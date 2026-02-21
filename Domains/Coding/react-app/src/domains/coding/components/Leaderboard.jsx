import React from 'react';
import { motion } from 'framer-motion';
import { useCodingStore } from '../store/useCodingStore';

const font = "'Press Start 2P', cursive";

// Simulated global leaderboard with the player injected
const MOCK_PLAYERS = [
    { name: "ShadowByte", devRating: 1580, cyberRating: 1520, wins: 42 },
    { name: "NeonHacker", devRating: 1490, cyberRating: 1610, wins: 38 },
    { name: "PixelForge", devRating: 1450, cyberRating: 1380, wins: 35 },
    { name: "CodeWraith", devRating: 1420, cyberRating: 1350, wins: 30 },
    { name: "BinaryGhost", devRating: 1380, cyberRating: 1300, wins: 27 },
    { name: "CipherPunk", devRating: 1340, cyberRating: 1290, wins: 24 },
    { name: "VoidRunner", devRating: 1310, cyberRating: 1270, wins: 20 },
    { name: "DataPhantom", devRating: 1280, cyberRating: 1240, wins: 18 },
    { name: "HexMaster", devRating: 1250, cyberRating: 1210, wins: 15 },
];

const Leaderboard = ({ onBack }) => {
    const { playerName, ratings } = useCodingStore();
    const stats = useCodingStore.getState().getStats();

    // Insert player into leaderboard
    const allPlayers = [
        ...MOCK_PLAYERS,
        {
            name: playerName,
            devRating: ratings.development,
            cyberRating: ratings.cybersecurity,
            wins: stats.wins,
            isPlayer: true,
        },
    ].sort((a, b) => (b.devRating + b.cyberRating) - (a.devRating + a.cyberRating));

    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
        <div style={{
            height: '100vh', width: '100vw', background: '#0f1120',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            fontFamily: font, color: 'white', padding: '2rem 1rem',
            overflowY: 'auto',
        }}>
            {/* Header */}
            <div style={{ width: '100%', maxWidth: '700px', marginBottom: '1.5rem' }}>
                <button onClick={onBack} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.6)', padding: '6px 14px', borderRadius: '4px',
                    fontFamily: font, fontSize: '0.35rem', cursor: 'pointer', marginBottom: '1rem',
                }}>← BACK</button>

                <h1 style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', textAlign: 'center' }}>
                    🏆 GLOBAL RANKINGS
                </h1>
            </div>

            {/* Leaderboard Table */}
            <div className="glass-panel" style={{ width: '100%', maxWidth: '700px', padding: '1.5rem', overflow: 'hidden' }}>
                {/* Header Row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr 90px 90px 60px',
                    gap: '0.5rem', padding: '0.5rem 0.5rem', marginBottom: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)' }}>#</span>
                    <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)' }}>PLAYER</span>
                    <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>DEV</span>
                    <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>CYBER</span>
                    <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>WINS</span>
                </div>

                {/* Rows */}
                {allPlayers.map((player, i) => (
                    <motion.div
                        key={player.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                            display: 'grid', gridTemplateColumns: '40px 1fr 90px 90px 60px',
                            gap: '0.5rem', padding: '0.6rem 0.5rem', alignItems: 'center',
                            background: player.isPlayer ? 'rgba(0, 210, 255, 0.08)' : 'transparent',
                            border: player.isPlayer ? '1px solid rgba(0, 210, 255, 0.2)' : '1px solid transparent',
                            borderRadius: '6px', marginBottom: '0.3rem',
                        }}
                    >
                        <span style={{
                            fontSize: '0.4rem',
                            color: i < 3 ? medalColors[i] : 'rgba(255,255,255,0.3)',
                            fontWeight: i < 3 ? 'bold' : 'normal',
                        }}>
                            {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>
                        <span style={{
                            fontSize: '0.38rem',
                            color: player.isPlayer ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.8)',
                        }}>
                            {player.name} {player.isPlayer ? '(YOU)' : ''}
                        </span>
                        <span style={{ fontSize: '0.35rem', color: '#a78bfa', textAlign: 'center' }}>{player.devRating}</span>
                        <span style={{ fontSize: '0.35rem', color: '#34d399', textAlign: 'center' }}>{player.cyberRating}</span>
                        <span style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{player.wins}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;
