/**
 * roomManager — In-memory room state management for 1v1 multiplayer.
 *
 * Manages room lifecycle: create → join → countdown → live → finished.
 * Server-authoritative scoring — clients cannot manipulate scores.
 */

const { pickRandomQuestions } = require('./questionBank');

// ── In-memory room store ─────────────────────────────────────────────────────
const rooms = new Map();

/**
 * Generate a unique 6-character room ID.
 */
function generateRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I confusion
    let id;
    do {
        id = '';
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
    } while (rooms.has(id));
    return id;
}

/**
 * Create a new room with the host player.
 */
function createRoom(socketId, username) {
    const roomId = generateRoomId();
    const room = {
        roomId,
        players: [
            { socketId, username, score: 0, answered: false },
        ],
        questions: [],
        currentQuestionIndex: 0,
        timer: 30, // seconds per question
        status: 'waiting', // waiting | countdown | live | finished
        createdAt: Date.now(),
    };
    rooms.set(roomId, room);
    console.log(`[Room] Created room ${roomId} by ${username} (${socketId})`);
    return room;
}

/**
 * Join an existing room. Returns the room or null if invalid.
 */
function joinRoom(roomId, socketId, username) {
    const room = rooms.get(roomId);
    if (!room) {
        console.log(`[Room] Join failed — room ${roomId} not found`);
        return { error: 'Room not found' };
    }
    if (room.status !== 'waiting') {
        console.log(`[Room] Join failed — room ${roomId} already ${room.status}`);
        return { error: 'Match already in progress' };
    }
    if (room.players.length >= 2) {
        console.log(`[Room] Join failed — room ${roomId} is full`);
        return { error: 'Room is full' };
    }
    if (room.players.some(p => p.socketId === socketId)) {
        console.log(`[Room] Join failed — ${socketId} already in room ${roomId}`);
        return { error: 'Already in this room' };
    }

    room.players.push({ socketId, username, score: 0, answered: false });
    console.log(`[Room] ${username} (${socketId}) joined room ${roomId} — ${room.players.length}/2 players`);
    return { room };
}

/**
 * Start the match: generate questions and set status.
 */
function startMatch(roomId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.players.length < 2) return { error: 'Need 2 players to start' };
    if (room.status !== 'waiting') return { error: 'Match already started' };

    room.questions = pickRandomQuestions(5);
    room.currentQuestionIndex = 0;
    room.status = 'countdown';

    // Reset scores
    room.players.forEach(p => { p.score = 0; p.answered = false; });

    console.log(`[Room] Match starting in room ${roomId} — ${room.questions.length} questions selected`);
    console.log(`[Room] Questions: ${room.questions.map(q => q.id).join(', ')}`);
    return { room };
}

/**
 * Submit an answer. Server-authoritative scoring.
 * Returns the result or an error.
 */
function submitAnswer(roomId, socketId, answerIndex) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };
    if (room.status !== 'live') return { error: 'Match not in progress' };

    const player = room.players.find(p => p.socketId === socketId);
    if (!player) return { error: 'Player not in room' };
    if (player.answered) return { error: 'Already answered this question' };

    const question = room.questions[room.currentQuestionIndex];
    if (!question) return { error: 'No active question' };

    const isCorrect = answerIndex === question.correctIndex;
    const timeBonus = 0; // could be added later based on response time
    const points = isCorrect ? question.points + timeBonus : 0;

    player.score += points;
    player.answered = true;

    console.log(`[Room ${roomId}] ${player.username} answered Q${room.currentQuestionIndex + 1}: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'} (choice: ${answerIndex}, correct: ${question.correctIndex}) — Score: ${player.score}`);

    return {
        isCorrect,
        points,
        correctIndex: question.correctIndex,
        playerScore: player.score,
        allAnswered: room.players.every(p => p.answered),
    };
}

/**
 * Advance to next question. Returns the question data (without correctIndex) or match result.
 */
function nextQuestion(roomId) {
    const room = rooms.get(roomId);
    if (!room) return { error: 'Room not found' };

    room.currentQuestionIndex++;
    room.players.forEach(p => { p.answered = false; });

    if (room.currentQuestionIndex >= room.questions.length) {
        // Match finished
        room.status = 'finished';
        const result = getMatchResult(room);
        console.log(`[Room ${roomId}] Match finished! ${result.winner ? result.winner.username + ' wins!' : 'Draw!'}`);
        console.log(`[Room ${roomId}] Final scores: ${room.players.map(p => `${p.username}: ${p.score}`).join(' vs ')}`);
        return { finished: true, result };
    }

    console.log(`[Room ${roomId}] Advancing to question ${room.currentQuestionIndex + 1}/${room.questions.length}`);
    return { finished: false, question: getSafeQuestion(room) };
}

/**
 * Get the current question without the correct answer (client-safe).
 */
function getSafeQuestion(room) {
    const q = room.questions[room.currentQuestionIndex];
    if (!q) return null;
    return {
        id: q.id,
        scenario: q.scenario,
        choices: q.choices,
        difficulty: q.difficulty,
        points: q.points,
        questionNumber: room.currentQuestionIndex + 1,
        totalQuestions: room.questions.length,
    };
}

/**
 * Calculate match result.
 */
function getMatchResult(room) {
    const [p1, p2] = room.players;
    let winner = null;
    if (p1.score > p2.score) winner = { username: p1.username, score: p1.score };
    else if (p2.score > p1.score) winner = { username: p2.username, score: p2.score };

    return {
        winner,
        isDraw: p1.score === p2.score,
        players: room.players.map(p => ({
            username: p.username,
            score: p.score,
            socketId: p.socketId,
        })),
    };
}

/**
 * Handle player disconnect. Returns the room if it exists.
 */
function handleDisconnect(socketId) {
    for (const [roomId, room] of rooms) {
        const playerIdx = room.players.findIndex(p => p.socketId === socketId);
        if (playerIdx !== -1) {
            const player = room.players[playerIdx];
            console.log(`[Room ${roomId}] ${player.username} (${socketId}) disconnected`);

            if (room.status === 'waiting') {
                // Remove from waiting room
                room.players.splice(playerIdx, 1);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`[Room ${roomId}] Empty room deleted`);
                }
            } else if (room.status === 'live' || room.status === 'countdown') {
                // End match — opponent wins by forfeit
                room.status = 'finished';
                const opponent = room.players.find(p => p.socketId !== socketId);
                console.log(`[Room ${roomId}] Match ended by disconnect — ${opponent?.username ?? 'nobody'} wins by forfeit`);
            }

            return { roomId, room, disconnectedPlayer: player };
        }
    }
    return null;
}

/**
 * Get room by ID.
 */
function getRoom(roomId) {
    return rooms.get(roomId) || null;
}

/**
 * Set room status to 'live'.
 */
function setRoomLive(roomId) {
    const room = rooms.get(roomId);
    if (room) {
        room.status = 'live';
        console.log(`[Room ${roomId}] Status → live`);
    }
    return room;
}

/**
 * Clean up stale rooms (older than 30 minutes).
 */
function cleanupStaleRooms() {
    const STALE_MS = 30 * 60 * 1000;
    const now = Date.now();
    let cleaned = 0;
    for (const [roomId, room] of rooms) {
        if (now - room.createdAt > STALE_MS) {
            rooms.delete(roomId);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[Cleanup] Removed ${cleaned} stale rooms`);
    }
}

// Run cleanup every 5 minutes
setInterval(cleanupStaleRooms, 5 * 60 * 1000);

module.exports = {
    createRoom,
    joinRoom,
    startMatch,
    submitAnswer,
    nextQuestion,
    getSafeQuestion,
    handleDisconnect,
    getRoom,
    setRoomLive,
};
