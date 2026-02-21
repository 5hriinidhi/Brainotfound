import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

let socket = null;

/**
 * Connect to the duel server
 */
export function connectSocket() {
    if (socket?.connected) return socket;

    socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
        console.warn('[Socket] Connection error:', err.message);
    });

    return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket() {
    if (!socket) return connectSocket();
    return socket;
}

/**
 * Disconnect from the server
 */
export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * Create a private room
 */
export function createRoom(playerName, skill) {
    return new Promise((resolve, reject) => {
        const s = getSocket();
        s.emit('create-room', { playerName, skill }, (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(new Error(response.error || 'Failed to create room'));
            }
        });
    });
}

/**
 * Join an existing room
 */
export function joinRoom(code, playerName) {
    return new Promise((resolve, reject) => {
        const s = getSocket();
        s.emit('join-room', { code, playerName }, (response) => {
            if (response.success) {
                resolve(response);
            } else {
                reject(new Error(response.error || 'Failed to join room'));
            }
        });
    });
}

/**
 * Signal player is ready
 */
export function playerReady(code) {
    getSocket().emit('player-ready', { code });
}

/**
 * Submit round result
 */
export function submitRoundResult(code, round, accuracy, timeLeft) {
    getSocket().emit('round-result', { code, round, accuracy, timeLeft });
}

/**
 * Submit final duel score
 */
export function submitFinalScore(code, finalScore) {
    getSocket().emit('duel-finished', { code, finalScore });
}

/**
 * Listen for events
 */
export function onEvent(event, callback) {
    const s = getSocket();
    s.on(event, callback);
    return () => s.off(event, callback);
}

/**
 * Check if socket is connected
 */
export function isConnected() {
    return socket?.connected || false;
}
