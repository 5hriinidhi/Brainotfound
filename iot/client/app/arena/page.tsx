/**
 * Arena Page — 1v1 Multiplayer Lobby
 *
 * Shows Create/Join Room UI, waiting room with room link copy,
 * opponent joined animation, and Start Match button for host.
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useArenaSocket } from '@/store/useArenaSocket';
import { playClick, playSwoosh, playCelebration, playWarning } from '@/utils/soundEngine';

// ── Animated Pulse Ring ──────────────────────────────────────────────────────
function PulseRing({ color }: { color: string }) {
    return (
        <motion.div
            className={`absolute inset-0 rounded-full border-2 ${color}`}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}

// ── VS Divider ───────────────────────────────────────────────────────────────
function VSDivider() {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
            className="relative"
        >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 border-2 border-violet-400/50 flex items-center justify-center shadow-lg shadow-violet-900/50">
                <span className="text-sm font-black text-white">VS</span>
            </div>
            <PulseRing color="border-violet-500/30" />
        </motion.div>
    );
}

// ── Player Card ──────────────────────────────────────────────────────────────
function PlayerCard({ username, label, color, isConnected }: {
    username: string | null;
    label: string;
    color: string;
    isConnected: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: label === 'Player 1' ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-36 p-4 rounded-xl border text-center ${isConnected
                ? `bg-${color}-900/20 border-${color}-600/40`
                : 'bg-zinc-800/30 border-zinc-700/30'
                }`}
        >
            <div className="relative mx-auto w-12 h-12 mb-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${isConnected
                    ? `bg-gradient-to-br from-${color}-500 to-${color}-700`
                    : 'bg-zinc-700'
                    }`}>
                    {isConnected ? '🎮' : '❓'}
                </div>
                {isConnected && <PulseRing color={`border-${color}-500/40`} />}
            </div>
            <p className={`text-[9px] font-bold ${isConnected ? 'text-white' : 'text-zinc-500'}`}>
                {username ?? 'Waiting...'}
            </p>
            <p className="text-[6px] text-zinc-500 mt-0.5">{label}</p>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Arena Page
// ═══════════════════════════════════════════════════════════════════════════

export default function ArenaPage() {
    const {
        connected, roomId, roomStatus, players, isHost, username: storedUsername,
        error, countdown, opponentDisconnected, matchResult,
        createRoom, joinRoom, startMatch, reset,
    } = useArenaSocket();

    const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby'>('menu');
    const [usernameInput, setUsernameInput] = useState('');
    const [roomIdInput, setRoomIdInput] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [copied, setCopied] = useState(false);

    // No auto-connect — socket connects lazily when user creates/joins

    // Auto-transition to lobby when room is created/joined
    useEffect(() => {
        if (roomStatus === 'waiting' || roomStatus === 'ready') {
            setView('lobby');
        }
    }, [roomStatus]);

    // Play sounds on state changes
    useEffect(() => {
        if (roomStatus === 'ready') playCelebration();
    }, [roomStatus]);

    useEffect(() => {
        if (roomStatus === 'countdown') playWarning();
    }, [roomStatus]);

    const handleCreate = useCallback(() => {
        if (!usernameInput.trim()) return;
        playClick();
        createRoom(usernameInput.trim(), questionCount);
    }, [usernameInput, questionCount, createRoom]);

    const handleJoin = useCallback(() => {
        if (!usernameInput.trim() || !roomIdInput.trim()) return;
        playClick();
        joinRoom(roomIdInput.trim(), usernameInput.trim());
    }, [usernameInput, roomIdInput, joinRoom]);

    const handleCopyLink = useCallback(() => {
        if (!roomId) return;
        const link = `${window.location.origin}/arena?room=${roomId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        playClick();
        setTimeout(() => setCopied(false), 2000);
    }, [roomId]);

    const handleStartMatch = useCallback(() => {
        playClick();
        startMatch();
    }, [startMatch]);

    // Auto-fill room ID from URL query params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get('room');
        if (roomParam) {
            setRoomIdInput(roomParam.toUpperCase());
            setView('join');
        }
    }, []);

    return (
        <main className="min-h-screen bg-[#0a0a12] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.08)_0%,_transparent_70%)]" />
            <motion.div
                className="fixed inset-0 bg-[linear-gradient(transparent_49%,rgba(139,92,246,0.03)_50%,transparent_51%)] bg-[length:100%_4px]"
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            {/* Back button */}
            <Link href="/" className="fixed top-4 left-4 z-50">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { reset(); playSwoosh(); }}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[7px] text-zinc-400 cursor-pointer hover:text-white transition-colors"
                >
                    ← Back to Menu
                </motion.button>
            </Link>

            {/* Error toast */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-red-900/80 border border-red-700/50 text-[7px] text-red-300"
                    >
                        ⚠️ {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connection status */}
            <div className="fixed top-4 right-4 z-40">
                <span className={`text-[6px] flex items-center gap-1 ${connected ? 'text-emerald-500' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {connected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            <div className="relative z-10 w-full max-w-md space-y-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-3xl mb-2 inline-block"
                    >
                        ⚔️
                    </motion.div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">
                        1v1 Arena
                    </h1>
                    <p className="text-[7px] text-zinc-500 mt-1">Challenge another engineer in real-time</p>
                </motion.div>

                {/* ═══ MENU VIEW ═══════════════════════════════════════════ */}
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-3"
                        >
                            <button
                                onClick={() => { setView('create'); playClick(); }}
                                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-[9px] font-semibold text-white shadow-lg shadow-violet-900/40 cursor-pointer hover:from-violet-500 hover:to-purple-500 transition-all active:scale-95 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative">🏠 Create Room</span>
                            </button>

                            <button
                                onClick={() => { setView('join'); playClick(); }}
                                className="w-full px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-[9px] font-semibold text-zinc-300 cursor-pointer hover:bg-white/15 transition-all active:scale-95 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                <span className="relative">🔗 Join Room</span>
                            </button>
                        </motion.div>
                    )}

                    {/* ═══ CREATE VIEW ═════════════════════════════════════ */}
                    {view === 'create' && (
                        <motion.div
                            key="create"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-3">
                                <p className="text-[8px] text-zinc-400 font-semibold">Your Username</p>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    placeholder="Enter your name..."
                                    maxLength={16}
                                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-zinc-700/50 text-[9px] text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />

                                <p className="text-[8px] text-zinc-400 font-semibold mt-3">Question Count</p>
                                <div className="flex gap-2">
                                    {[3, 5, 7].map((n) => (
                                        <button
                                            key={n}
                                            onClick={() => { setQuestionCount(n); playClick(); }}
                                            className={`flex-1 py-2.5 rounded-lg text-[8px] font-semibold transition-all cursor-pointer ${questionCount === n
                                                ? 'bg-violet-600 text-white border border-violet-500/50'
                                                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30 hover:bg-zinc-800'
                                                }`}
                                        >
                                            {n} Qs
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setView('menu'); playClick(); }}
                                    className="px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30 text-[8px] text-zinc-400 cursor-pointer hover:bg-zinc-800 transition-all"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleCreate}
                                    disabled={!usernameInput.trim() || roomStatus === 'connecting'}
                                    className={`flex-1 py-3 rounded-lg text-[8px] font-semibold transition-all ${usernameInput.trim() && roomStatus !== 'connecting'
                                        ? 'bg-violet-600 hover:bg-violet-500 text-white cursor-pointer active:scale-95'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    {roomStatus === 'connecting' ? '⏳ Connecting...' : '🏠 Create Room'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ JOIN VIEW ═══════════════════════════════════════ */}
                    {view === 'join' && (
                        <motion.div
                            key="join"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 space-y-3">
                                <p className="text-[8px] text-zinc-400 font-semibold">Room Code</p>
                                <input
                                    type="text"
                                    value={roomIdInput}
                                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-digit code..."
                                    maxLength={6}
                                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-zinc-700/50 text-[9px] text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors font-mono tracking-widest text-center uppercase"
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                />

                                <p className="text-[8px] text-zinc-400 font-semibold mt-3">Your Username</p>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    placeholder="Enter your name..."
                                    maxLength={16}
                                    className="w-full px-4 py-3 rounded-lg bg-black/40 border border-zinc-700/50 text-[9px] text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setView('menu'); playClick(); }}
                                    className="px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30 text-[8px] text-zinc-400 cursor-pointer hover:bg-zinc-800 transition-all"
                                >
                                    ← Back
                                </button>
                                <button
                                    onClick={handleJoin}
                                    disabled={!usernameInput.trim() || !roomIdInput.trim() || roomStatus === 'connecting'}
                                    className={`flex-1 py-3 rounded-lg text-[8px] font-semibold transition-all ${usernameInput.trim() && roomIdInput.trim() && roomStatus !== 'connecting'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    {roomStatus === 'connecting' ? '⏳ Connecting...' : '🔗 Join Room'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ LOBBY VIEW ══════════════════════════════════════ */}
                    {view === 'lobby' && (
                        <motion.div
                            key="lobby"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-5"
                        >
                            {/* Room code display */}
                            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-center space-y-2">
                                <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Room Code</p>
                                <p className="text-2xl font-mono font-bold text-violet-400 tracking-[0.3em]">
                                    {roomId}
                                </p>

                                {/* Copy link */}
                                <button
                                    onClick={handleCopyLink}
                                    className="mt-2 px-4 py-2 rounded-lg bg-violet-900/30 border border-violet-700/30 text-[7px] text-violet-300 cursor-pointer hover:bg-violet-900/50 transition-all active:scale-95"
                                >
                                    {copied ? '✅ Copied!' : '📋 Copy Invite Link'}
                                </button>

                                <p className="text-[6px] text-zinc-600 mt-1">
                                    Share this code or link with your opponent
                                </p>
                            </div>

                            {/* Player cards */}
                            <div className="flex items-center justify-center gap-4">
                                <PlayerCard
                                    username={players[0]?.username ?? null}
                                    label="Player 1"
                                    color="cyan"
                                    isConnected={!!players[0]}
                                />
                                <VSDivider />
                                <PlayerCard
                                    username={players[1]?.username ?? null}
                                    label="Player 2"
                                    color="red"
                                    isConnected={!!players[1]}
                                />
                            </div>

                            {/* Status */}
                            <div className="text-center">
                                <AnimatePresence mode="wait">
                                    {roomStatus === 'waiting' && (
                                        <motion.div
                                            key="waiting"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <motion.div
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-[8px] text-zinc-400"
                                            >
                                                ⏳ Waiting for opponent to join...
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {roomStatus === 'ready' && (
                                        <motion.div
                                            key="ready"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3"
                                        >
                                            <motion.p
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-[9px] font-bold text-emerald-400"
                                            >
                                                🎉 Opponent Joined!
                                            </motion.p>

                                            {isHost ? (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(139,92,246,0.4)' }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={handleStartMatch}
                                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-[9px] font-bold text-white shadow-lg shadow-violet-900/40 cursor-pointer transition-all relative overflow-hidden group"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                                    <span className="relative">🚀 Start Match</span>
                                                </motion.button>
                                            ) : (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-[7px] text-zinc-500"
                                                >
                                                    Waiting for host to start the match...
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    )}

                                    {roomStatus === 'countdown' && (
                                        <motion.div
                                            key="countdown"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-2"
                                        >
                                            <p className="text-[8px] text-amber-400">Match starting in...</p>
                                            <motion.div
                                                key={countdown}
                                                initial={{ scale: 2, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                className="text-4xl font-black text-violet-400"
                                            >
                                                {countdown}
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Opponent disconnected */}
                            {opponentDisconnected && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-amber-900/20 border border-amber-700/30 text-center"
                                >
                                    <p className="text-[7px] text-amber-400">{opponentDisconnected}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
