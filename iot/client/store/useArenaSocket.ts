/**
 * useArenaSocket — Zustand store for 1v1 Arena multiplayer state.
 *
 * Connection is LAZY — only connects when user creates or joins a room.
 * Limited reconnection attempts to prevent flooding.
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// ── Types ────────────────────────────────────────────────────────────────────

interface Player {
    username: string;
    score: number;
    answered?: boolean;
}

interface ArenaQuestion {
    id: string;
    scenario: string;
    choices: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    questionNumber: number;
    totalQuestions: number;
}

interface MatchResult {
    winner: { username: string; score: number } | null;
    isDraw: boolean;
    players: Player[];
}

type RoomStatus = 'idle' | 'connecting' | 'waiting' | 'ready' | 'countdown' | 'live' | 'finished';

interface ArenaState {
    // Connection
    socket: Socket | null;
    connected: boolean;

    // Room
    roomId: string | null;
    roomStatus: RoomStatus;
    players: Player[];
    isHost: boolean;
    username: string;

    // Match
    currentQuestion: ArenaQuestion | null;
    countdown: number;
    timeLimit: number;
    myScore: number;
    lastAnswerResult: {
        isCorrect: boolean;
        points: number;
        correctIndex: number;
    } | null;
    matchResult: MatchResult | null;

    // UI state
    error: string | null;
    opponentDisconnected: string | null;

    // Actions
    ensureConnected: () => Promise<Socket>;
    disconnect: () => void;
    createRoom: (username: string, questionCount?: number) => void;
    joinRoom: (roomId: string, username: string) => void;
    startMatch: () => void;
    submitAnswer: (answerIndex: number) => void;
    reset: () => void;
}

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

// ── Store ────────────────────────────────────────────────────────────────────

export const useArenaSocket = create<ArenaState>((set, get) => ({
    // Initial state
    socket: null,
    connected: false,
    roomId: null,
    roomStatus: 'idle',
    players: [],
    isHost: false,
    username: '',
    currentQuestion: null,
    countdown: 0,
    timeLimit: 30,
    myScore: 0,
    lastAnswerResult: null,
    matchResult: null,
    error: null,
    opponentDisconnected: null,

    // ── Lazy connect — only called when needed ───────────────────
    ensureConnected: () => {
        return new Promise<Socket>((resolve, reject) => {
            const existing = get().socket;
            if (existing?.connected) {
                resolve(existing);
                return;
            }

            // Disconnect stale socket if any
            if (existing) {
                existing.removeAllListeners();
                existing.disconnect();
            }

            set({ roomStatus: 'connecting', error: null });

            const socket = io(SERVER_URL, {
                transports: ['websocket', 'polling'],
                autoConnect: true,
                reconnectionAttempts: 3,     // Only try 3 times, not infinite
                reconnectionDelay: 1000,
                timeout: 5000,               // 5 second connection timeout
            });

            const connectTimeout = setTimeout(() => {
                if (!socket.connected) {
                    socket.removeAllListeners();
                    socket.disconnect();
                    set({
                        socket: null,
                        connected: false,
                        roomStatus: 'idle',
                        error: 'Could not connect to server. Make sure the backend is running on port 5000.',
                    });
                    reject(new Error('Connection timeout'));
                }
            }, 6000);

            socket.on('connect', () => {
                clearTimeout(connectTimeout);
                console.log('[Arena] Connected:', socket.id);
                set({ connected: true, error: null });
                resolve(socket);
            });

            socket.on('connect_error', (err) => {
                console.warn('[Arena] Connection error:', err.message);
            });

            socket.on('disconnect', () => {
                console.log('[Arena] Disconnected');
                set({ connected: false });
            });

            // ── Room events ──────────────────────────────────────
            socket.on('roomCreated', ({ roomId, players }) => {
                console.log('[Arena] Room created:', roomId);
                set({ roomId, players, roomStatus: 'waiting', isHost: true, error: null });
            });

            socket.on('roomJoined', ({ roomId, players }) => {
                console.log('[Arena] Joined room:', roomId);
                set({ roomId, players, roomStatus: 'waiting', error: null });
            });

            socket.on('playerJoined', ({ players }) => {
                console.log('[Arena] Player joined, now', players.length, 'players');
                set({ players });
            });

            socket.on('roomReady', ({ roomId, players }) => {
                console.log('[Arena] Room ready! Both players connected');
                set({ roomId, players, roomStatus: 'ready', error: null });
            });

            socket.on('playerLeft', ({ username, players }) => {
                console.log('[Arena] Player left:', username);
                set({ players, roomStatus: 'waiting' });
            });

            // ── Match events ─────────────────────────────────────
            socket.on('countdownStart', ({ countdown }) => {
                console.log('[Arena] Countdown:', countdown);
                set({ roomStatus: 'countdown', countdown });
                let remaining = countdown;
                const iv = setInterval(() => {
                    remaining--;
                    set({ countdown: remaining });
                    if (remaining <= 0) clearInterval(iv);
                }, 1000);
            });

            socket.on('questionStart', ({ question, timeLimit }) => {
                console.log('[Arena] Question started:', question.id);
                set({ roomStatus: 'live', currentQuestion: question, timeLimit, lastAnswerResult: null });
            });

            socket.on('answerResult', (result) => {
                console.log('[Arena] Answer result:', result.isCorrect ? '✅' : '❌', '+' + result.points);
                set({
                    lastAnswerResult: { isCorrect: result.isCorrect, points: result.points, correctIndex: result.correctIndex },
                    myScore: result.yourScore,
                });
            });

            socket.on('scoreUpdate', ({ players }) => {
                set({ players });
            });

            socket.on('nextQuestion', ({ question, timeLimit }) => {
                console.log('[Arena] Next question:', question.id);
                set({ currentQuestion: question, timeLimit, lastAnswerResult: null });
            });

            socket.on('matchFinished', ({ result }) => {
                console.log('[Arena] Match finished!', result);
                set({ roomStatus: 'finished', matchResult: result, currentQuestion: null });
            });

            socket.on('opponentDisconnected', ({ message, result }) => {
                console.log('[Arena] Opponent disconnected:', message);
                set({ roomStatus: 'finished', opponentDisconnected: message, matchResult: result });
            });

            socket.on('error', ({ message }) => {
                console.error('[Arena] Error:', message);
                set({ error: message });
                setTimeout(() => set({ error: null }), 3000);
            });

            set({ socket });
        });
    },

    // ── Disconnect ───────────────────────────────────────────────
    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            set({ socket: null, connected: false });
        }
    },

    // ── Create Room (connects lazily) ────────────────────────────
    createRoom: async (username) => {
        try {
            const socket = await get().ensureConnected();
            set({ username });
            socket.emit('createRoom', { username });
        } catch {
            // Error already set in ensureConnected
        }
    },

    // ── Join Room (connects lazily) ──────────────────────────────
    joinRoom: async (roomId, username) => {
        try {
            const socket = await get().ensureConnected();
            set({ username });
            socket.emit('joinRoom', { roomId: roomId.toUpperCase(), username });
        } catch {
            // Error already set in ensureConnected
        }
    },

    // ── Start Match ──────────────────────────────────────────────
    startMatch: () => {
        const { socket, roomId } = get();
        if (!socket?.connected || !roomId) return;
        socket.emit('startMatch', { roomId });
    },

    // ── Submit Answer ────────────────────────────────────────────
    submitAnswer: (answerIndex) => {
        const { socket, roomId } = get();
        if (!socket?.connected || !roomId) return;
        socket.emit('submitAnswer', { roomId, answerIndex });
    },

    // ── Reset ────────────────────────────────────────────────────
    reset: () => {
        const { socket } = get();
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        set({
            socket: null,
            connected: false,
            roomId: null,
            roomStatus: 'idle',
            players: [],
            isHost: false,
            username: '',
            currentQuestion: null,
            countdown: 0,
            timeLimit: 30,
            myScore: 0,
            lastAnswerResult: null,
            matchResult: null,
            error: null,
            opponentDisconnected: null,
        });
    },
}));
