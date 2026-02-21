/**
 * socketHandler — Socket.io event handler for 1v1 multiplayer.
 *
 * Events:
 *   Client → Server:
 *     createRoom { username }
 *     joinRoom { roomId, username }
 *     startMatch { roomId }
 *     submitAnswer { roomId, answerIndex }
 *
 *   Server → Client:
 *     roomCreated { roomId, players }
 *     roomJoined { roomId, players }
 *     roomReady { roomId, players }
 *     countdownStart { countdown }
 *     questionStart { question, questionNumber, totalQuestions }
 *     answerResult { socketId, isCorrect, points, correctIndex }
 *     scoreUpdate { players }
 *     nextQuestion { question, questionNumber, totalQuestions }
 *     matchFinished { result }
 *     opponentDisconnected { message }
 *     error { message }
 */

const {
    createRoom,
    joinRoom,
    startMatch,
    submitAnswer,
    nextQuestion,
    getSafeQuestion,
    handleDisconnect,
    getRoom,
    setRoomLive,
} = require('./roomManager');

const COUNTDOWN_SECONDS = 3;
const QUESTION_TIME = 30; // seconds per question

function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`\n[Socket] Connected: ${socket.id}`);

        // ── createRoom ───────────────────────────────────────────────
        socket.on('createRoom', ({ username }) => {
            if (!username || typeof username !== 'string') {
                socket.emit('error', { message: 'Username is required' });
                return;
            }

            const room = createRoom(socket.id, username.trim());
            socket.join(room.roomId);

            socket.emit('roomCreated', {
                roomId: room.roomId,
                players: room.players.map(p => ({ username: p.username, score: p.score })),
            });

            console.log(`[Socket] ${username} created room ${room.roomId}`);
        });

        // ── joinRoom ─────────────────────────────────────────────────
        socket.on('joinRoom', ({ roomId, username }) => {
            if (!roomId || !username) {
                socket.emit('error', { message: 'roomId and username are required' });
                return;
            }

            const result = joinRoom(roomId.toUpperCase(), socket.id, username.trim());

            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }

            const { room } = result;
            socket.join(room.roomId);

            const playerData = room.players.map(p => ({ username: p.username, score: p.score }));

            // Notify joiner
            socket.emit('roomJoined', {
                roomId: room.roomId,
                players: playerData,
            });

            // Notify everyone in room
            io.to(room.roomId).emit('playerJoined', {
                username: username.trim(),
                players: playerData,
            });

            // If 2 players → room is ready
            if (room.players.length === 2) {
                io.to(room.roomId).emit('roomReady', {
                    roomId: room.roomId,
                    players: playerData,
                });
                console.log(`[Socket] Room ${room.roomId} is READY — 2 players connected`);
            }
        });

        // ── startMatch ───────────────────────────────────────────────
        socket.on('startMatch', ({ roomId }) => {
            if (!roomId) {
                socket.emit('error', { message: 'roomId is required' });
                return;
            }

            const result = startMatch(roomId.toUpperCase());
            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }

            const { room } = result;

            // Broadcast countdown
            io.to(room.roomId).emit('countdownStart', { countdown: COUNTDOWN_SECONDS });
            console.log(`[Socket] Room ${room.roomId} — countdown started (${COUNTDOWN_SECONDS}s)`);

            // After countdown, send first question
            setTimeout(() => {
                setRoomLive(room.roomId);
                const question = getSafeQuestion(room);

                io.to(room.roomId).emit('questionStart', {
                    question,
                    questionNumber: 1,
                    totalQuestions: room.questions.length,
                    timeLimit: QUESTION_TIME,
                });

                console.log(`[Socket] Room ${room.roomId} — Q1 sent: ${question.id}`);

                // Start per-question timer
                startQuestionTimer(io, room.roomId);
            }, COUNTDOWN_SECONDS * 1000);
        });

        // ── submitAnswer ─────────────────────────────────────────────
        socket.on('submitAnswer', ({ roomId, answerIndex }) => {
            if (!roomId || answerIndex === undefined) {
                socket.emit('error', { message: 'roomId and answerIndex are required' });
                return;
            }

            const result = submitAnswer(roomId.toUpperCase(), socket.id, answerIndex);
            if (result.error) {
                socket.emit('error', { message: result.error });
                return;
            }

            const room = getRoom(roomId.toUpperCase());
            if (!room) return;

            // Send answer result to the submitter
            socket.emit('answerResult', {
                isCorrect: result.isCorrect,
                points: result.points,
                correctIndex: result.correctIndex,
                yourScore: result.playerScore,
            });

            // Broadcast score update to entire room
            io.to(room.roomId).emit('scoreUpdate', {
                players: room.players.map(p => ({
                    username: p.username,
                    score: p.score,
                    answered: p.answered,
                })),
            });

            // If both players answered, advance to next question
            if (result.allAnswered) {
                console.log(`[Socket] Room ${room.roomId} — both players answered Q${room.currentQuestionIndex + 1}`);
                advanceQuestion(io, room.roomId);
            }
        });

        // ── disconnect ───────────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            const result = handleDisconnect(socket.id);
            if (result) {
                const { roomId, room, disconnectedPlayer } = result;

                if (room.status === 'finished') {
                    // Notify opponent about forfeit win
                    const opponent = room.players.find(p => p.socketId !== socket.id);
                    if (opponent) {
                        io.to(opponent.socketId).emit('opponentDisconnected', {
                            message: `${disconnectedPlayer.username} disconnected. You win by forfeit!`,
                            result: {
                                winner: { username: opponent.username, score: opponent.score },
                                isDraw: false,
                                players: room.players.map(p => ({
                                    username: p.username,
                                    score: p.score,
                                })),
                            },
                        });
                    }
                } else if (room.players.length > 0) {
                    // Waiting room — notify remaining player
                    io.to(roomId).emit('playerLeft', {
                        username: disconnectedPlayer.username,
                        players: room.players.map(p => ({ username: p.username, score: p.score })),
                    });
                }
            }
        });
    });

    console.log('[Socket.io] Event handlers registered');
}

// ── Question Timer ───────────────────────────────────────────────────────────

const questionTimers = new Map();

function startQuestionTimer(io, roomId) {
    // Clear any existing timer
    if (questionTimers.has(roomId)) {
        clearTimeout(questionTimers.get(roomId));
    }

    const timer = setTimeout(() => {
        const room = getRoom(roomId);
        if (!room || room.status !== 'live') return;

        console.log(`[Timer] Room ${roomId} — Q${room.currentQuestionIndex + 1} time expired`);

        // Force advance even if not all players answered
        advanceQuestion(io, roomId);
    }, QUESTION_TIME * 1000);

    questionTimers.set(roomId, timer);
}

function advanceQuestion(io, roomId) {
    // Clear timer
    if (questionTimers.has(roomId)) {
        clearTimeout(questionTimers.get(roomId));
        questionTimers.delete(roomId);
    }

    // Small delay for dramatic effect
    setTimeout(() => {
        const result = nextQuestion(roomId);
        if (!result || result.error) return;

        if (result.finished) {
            // Match is over
            io.to(roomId).emit('matchFinished', { result: result.result });
            console.log(`[Socket] Room ${roomId} — matchFinished emitted`);
        } else {
            // Send next question
            io.to(roomId).emit('nextQuestion', {
                question: result.question,
                questionNumber: result.question.questionNumber,
                totalQuestions: result.question.totalQuestions,
                timeLimit: QUESTION_TIME,
            });
            console.log(`[Socket] Room ${roomId} — Q${result.question.questionNumber} sent`);

            // Restart timer for next question
            startQuestionTimer(io, roomId);
        }
    }, 1500); // 1.5s pause between questions
}

module.exports = { registerSocketHandlers };
