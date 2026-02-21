import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCodingStore } from '../store/useCodingStore';
import {
    connectSocket, disconnectSocket, createRoom, joinRoom,
    playerReady, onEvent, isConnected,
} from '../engine/socketService';
import lobbyBg from '../../../assets/lobby.png';

const font = "'Press Start 2P', cursive";

const FriendLobby = ({ onBack, onStartFriendlyDuel }) => {
    const playerName = useCodingStore((s) => s.playerName);
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [selectedSkill, setSelectedSkill] = useState('development');
    const [phase, setPhase] = useState('menu'); // menu | creating | waiting | joining | countdown
    const [opponentName, setOpponentName] = useState(null);
    const [error, setError] = useState(null);
    const [countdown, setCountdown] = useState(3);
    const [connected, setConnected] = useState(false);

    // Connect socket on mount
    useEffect(() => {
        const socket = connectSocket();
        const checkConnection = setInterval(() => {
            setConnected(isConnected());
        }, 1000);

        return () => {
            clearInterval(checkConnection);
        };
    }, []);

    // Listen for opponent events
    useEffect(() => {
        const cleanupJoined = onEvent('opponent-joined', ({ name }) => {
            setOpponentName(name);
            setPhase('countdown');
            // Auto-ready as host
            playerReady(roomCode);
        });

        const cleanupStart = onEvent('duel-start', ({ skill, questionSeed }) => {
            onStartFriendlyDuel(skill, roomCode, true, opponentName, questionSeed);
        });

        const cleanupDisconnect = onEvent('opponent-disconnected', () => {
            setError('Opponent disconnected');
            setPhase('menu');
            setOpponentName(null);
        });

        return () => {
            cleanupJoined();
            cleanupStart();
            cleanupDisconnect();
        };
    }, [roomCode, opponentName]);

    // Countdown timer
    useEffect(() => {
        if (phase !== 'countdown') return;
        if (countdown <= 0) {
            // Ready up and wait for duel-start
            playerReady(roomCode);
            return;
        }
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, countdown]);

    const handleCreate = async () => {
        setError(null);
        setPhase('creating');
        try {
            const result = await createRoom(playerName, selectedSkill);
            setRoomCode(result.code);
            setPhase('waiting');
        } catch (e) {
            setError(e.message);
            setPhase('menu');
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) return;
        setError(null);
        setPhase('joining');
        try {
            const result = await joinRoom(joinCode.toUpperCase(), playerName);
            setRoomCode(joinCode.toUpperCase());
            setOpponentName(result.hostName);
            setSelectedSkill(result.skill);
            setPhase('countdown');
            // Auto-ready as guest
            setTimeout(() => playerReady(joinCode.toUpperCase()), 500);
        } catch (e) {
            setError(e.message);
            setPhase('menu');
        }
    };

    const handleBack = () => {
        disconnectSocket();
        onBack();
    };

    // Force start for solo testing
    const forceStart = () => {
        onStartFriendlyDuel(selectedSkill, roomCode, true, 'AI Opponent');
    };

    return (
        <div style={{
            height: '100vh', width: '100vw',
            backgroundImage: `url(${lobbyBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            position: 'relative',
        }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0, 0, 0, 0.55)', zIndex: 0 }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="glass-panel"
                style={{ padding: '2rem', width: '420px', textAlign: 'center', fontFamily: font, zIndex: 1 }}
            >
                <h2 style={{ fontSize: '0.8rem', color: 'var(--neon-cyan)', marginBottom: '0.3rem' }}>
                    ⚔️ FRIENDLY DUEL
                </h2>

                {/* Connection Status */}
                <div style={{
                    fontSize: '0.25rem', marginBottom: '1rem',
                    color: connected ? '#34d399' : '#ef4444',
                }}>
                    {connected ? '● CONNECTED' : '○ CONNECTING...'}
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '4px', padding: '0.5rem', marginBottom: '1rem',
                        fontSize: '0.3rem', color: '#ef4444',
                    }}>
                        {error}
                    </div>
                )}

                {/* Skill Selector (only in menu) */}
                {phase === 'menu' && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>SELECT SKILL</div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            {['development', 'cybersecurity'].map(s => (
                                <button key={s} onClick={() => setSelectedSkill(s)} style={{
                                    padding: '8px 16px', borderRadius: '6px', fontFamily: font, fontSize: '0.35rem',
                                    cursor: 'pointer', border: 'none',
                                    background: selectedSkill === s ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                                    color: selectedSkill === s ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.5)',
                                    outline: selectedSkill === s ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {s === 'development' ? '💻 DEV' : '🔒 CYBER'}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {/* MENU PHASE */}
                    {phase === 'menu' && (
                        <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}
                        >
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="neon-button" onClick={handleCreate}
                                disabled={!connected}
                                style={{
                                    fontFamily: font, fontSize: '0.4rem', width: '100%',
                                    opacity: connected ? 1 : 0.5,
                                }}
                            >
                                🏠 CREATE PRIVATE ROOM
                            </motion.button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', margin: '0.3rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.3)' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                            </div>

                            <input type="text" placeholder="ENTER CODE" value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={5}
                                style={{
                                    padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(167, 139, 250, 0.3)', borderRadius: '6px',
                                    color: 'white', textAlign: 'center', fontFamily: font, fontSize: '0.45rem',
                                    letterSpacing: '4px', outline: 'none', width: '100%', boxSizing: 'border-box',
                                }}
                            />
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="neon-button" onClick={handleJoin}
                                disabled={!joinCode.trim() || !connected}
                                style={{
                                    fontFamily: font, fontSize: '0.4rem', width: '100%', filter: 'hue-rotate(90deg)',
                                    opacity: (!joinCode.trim() || !connected) ? 0.5 : 1,
                                }}
                            >
                                🔗 JOIN ROOM
                            </motion.button>
                        </motion.div>
                    )}

                    {/* CREATING PHASE */}
                    {phase === 'creating' && (
                        <motion.div key="creating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '1rem' }}
                        >
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}
                            >⚙️</motion.div>
                            <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.5)' }}>CREATING ROOM...</div>
                        </motion.div>
                    )}

                    {/* WAITING PHASE (host waiting for guest) */}
                    {phase === 'waiting' && (
                        <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                        >
                            <div style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)' }}>ROOM CODE</div>
                            <div style={{
                                fontSize: '1.5rem', letterSpacing: '8px', color: 'var(--neon-cyan)',
                                padding: '0.8rem 1.5rem', background: 'rgba(0, 210, 255, 0.08)',
                                border: '1px solid rgba(0, 210, 255, 0.25)', borderRadius: '8px',
                            }}>
                                {roomCode}
                            </div>
                            <div style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.3)' }}>
                                Share this code with your friend
                            </div>
                            <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                style={{ fontSize: '0.35rem', color: 'rgba(167, 139, 250, 0.8)', margin: '0.5rem 0' }}
                            >
                                ⏳ WAITING FOR OPPONENT...
                            </motion.div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                className="neon-button" onClick={forceStart}
                                style={{ fontFamily: font, fontSize: '0.3rem', filter: 'hue-rotate(180deg)' }}
                            >
                                ⚡ START SOLO (DEBUG)
                            </motion.button>
                        </motion.div>
                    )}

                    {/* JOINING PHASE */}
                    {phase === 'joining' && (
                        <motion.div key="joining" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '1rem' }}
                        >
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}
                            >🔗</motion.div>
                            <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.5)' }}>JOINING ROOM...</div>
                        </motion.div>
                    )}

                    {/* COUNTDOWN PHASE */}
                    {phase === 'countdown' && (
                        <motion.div key="countdown" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}
                        >
                            <div style={{ fontSize: '0.35rem', color: '#34d399' }}>
                                OPPONENT: {opponentName || 'Connected'}
                            </div>
                            <motion.div
                                key={countdown}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ fontSize: '2rem', color: 'var(--neon-cyan)' }}
                            >
                                {countdown > 0 ? countdown : '⚡'}
                            </motion.div>
                            <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.5)' }}>
                                {countdown > 0 ? 'DUEL STARTING IN...' : 'GET READY!'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back button */}
                <button onClick={handleBack} style={{
                    marginTop: '1.5rem', background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)',
                    padding: '8px 20px', borderRadius: '6px', fontFamily: font,
                    fontSize: '0.3rem', cursor: 'pointer', width: '100%',
                }}>
                    ← BACK
                </button>
            </motion.div>
        </div>
    );
};

export default FriendLobby;
