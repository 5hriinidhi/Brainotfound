import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Serve Static Frontend Files from dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA Fallback for Story Mode and Duel
app.get('*', (req, res, next) => {
    // If it's a file request that wasn't found in static, just let it pass
    if (req.path.includes('.')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
});
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            // Allow any localhost port in dev
            if (!origin || origin.match(/^http:\/\/localhost:\d+$/)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed'));
            }
        },
        methods: ['GET', 'POST'],
    },
});

// Room storage
const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`[CONNECT] ${socket.id}`);

    // Create a private room
    socket.on('create-room', ({ playerName, skill }, callback) => {
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        rooms.set(code, {
            code,
            skill,
            host: { id: socket.id, name: playerName, ready: false, score: null },
            guest: null,
            state: 'waiting', // waiting | playing | finished
            questionSeed: Math.floor(Math.random() * 10000),
            createdAt: Date.now(),
        });
        socket.join(code);
        console.log(`[ROOM] ${playerName} created room ${code}`);
        callback({ code, success: true });
    });

    // Join a room
    socket.on('join-room', ({ code, playerName }, callback) => {
        const room = rooms.get(code);
        if (!room) {
            callback({ success: false, error: 'Room not found' });
            return;
        }
        if (room.guest) {
            callback({ success: false, error: 'Room is full' });
            return;
        }
        room.guest = { id: socket.id, name: playerName, ready: false, score: null };
        socket.join(code);
        console.log(`[ROOM] ${playerName} joined room ${code}`);

        // Notify host that opponent joined
        io.to(room.host.id).emit('opponent-joined', { name: playerName });

        callback({
            success: true,
            skill: room.skill,
            hostName: room.host.name,
        });
    });

    // Player ready
    socket.on('player-ready', ({ code }) => {
        const room = rooms.get(code);
        if (!room) return;

        if (room.host.id === socket.id) room.host.ready = true;
        if (room.guest?.id === socket.id) room.guest.ready = true;

        // Both ready? Start the duel
        if (room.host.ready && room.guest?.ready) {
            room.state = 'playing';
            io.to(code).emit('duel-start', {
                skill: room.skill,
                questionSeed: room.questionSeed,
            });
            console.log(`[DUEL] Room ${code} started!`);
        }
    });

    // Round result submitted
    socket.on('round-result', ({ code, round, accuracy, timeLeft }) => {
        const room = rooms.get(code);
        if (!room) return;

        const player = room.host.id === socket.id ? 'host' : 'guest';
        if (!room[`round_${round}`]) room[`round_${round}`] = {};
        room[`round_${round}`][player] = { accuracy, timeLeft };

        // Notify opponent of progress
        const opponentId = player === 'host' ? room.guest?.id : room.host.id;
        if (opponentId) {
            io.to(opponentId).emit('opponent-round-done', { round, accuracy });
        }

        // Both submitted? Broadcast round results
        const roundData = room[`round_${round}`];
        if (roundData.host && roundData.guest) {
            io.to(code).emit('round-complete', {
                round,
                host: roundData.host,
                guest: roundData.guest,
            });
        }
    });

    // Final results
    socket.on('duel-finished', ({ code, finalScore }) => {
        const room = rooms.get(code);
        if (!room) return;

        if (room.host.id === socket.id) room.host.score = finalScore;
        if (room.guest?.id === socket.id) room.guest.score = finalScore;

        // Both finished?
        if (room.host.score !== null && room.guest?.score !== null) {
            room.state = 'finished';
            io.to(code).emit('duel-results', {
                host: { name: room.host.name, score: room.host.score },
                guest: { name: room.guest.name, score: room.guest.score },
            });
            console.log(`[DUEL] Room ${code} finished! Host: ${room.host.score}, Guest: ${room.guest.score}`);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] ${socket.id}`);
        // Notify rooms this player was in
        for (const [code, room] of rooms) {
            if (room.host.id === socket.id || room.guest?.id === socket.id) {
                io.to(code).emit('opponent-disconnected');
                rooms.delete(code);
            }
        }
    });
});

// Cleanup stale rooms every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (now - room.createdAt > 30 * 60 * 1000) {
            rooms.delete(code);
            console.log(`[CLEANUP] Room ${code} expired`);
        }
    }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`⚡ SkillForge Duel Server running on port ${PORT}`);
});
