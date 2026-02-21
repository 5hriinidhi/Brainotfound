import React from 'react';
import { motion } from 'framer-motion';
import { useCodingStore } from '../store/useCodingStore';

const font = "'Press Start 2P', cursive";

const Dashboard = ({ onBack }) => {
    const { playerName, ratings, eloHistory, matchHistory } = useCodingStore();
    const stats = useCodingStore.getState().getStats();

    // ELO chart: simple bar visualization
    const renderEloChart = (skill, color) => {
        const history = eloHistory[skill] || [];
        if (history.length <= 1) return <p style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.3)' }}>No data yet</p>;

        const ratings = history.map(h => h.rating);
        const max = Math.max(...ratings, 1500);
        const min = Math.min(...ratings, 800);
        const range = max - min || 1;

        return (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px', padding: '0.5rem 0' }}>
                {history.slice(-15).map((point, i) => {
                    const height = ((point.rating - min) / range) * 100;
                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 5)}%` }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            title={`${point.rating}`}
                            style={{
                                flex: 1, background: color, borderRadius: '2px 2px 0 0',
                                minWidth: '8px', cursor: 'pointer', position: 'relative',
                                opacity: i === history.slice(-15).length - 1 ? 1 : 0.6,
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    // Recent matches list
    const recentMatches = matchHistory.slice(0, 8);

    return (
        <div style={{
            height: '100vh', width: '100vw', background: '#0f1120',
            fontFamily: font, color: 'white', padding: '1.5rem',
            overflowY: 'auto',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', maxWidth: '900px', margin: '0 auto 1.5rem' }}>
                <button onClick={onBack} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.6)', padding: '6px 14px', borderRadius: '4px',
                    fontFamily: font, fontSize: '0.35rem', cursor: 'pointer',
                }}>← BACK</button>
                <h1 style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>📊 SKILL ANALYTICS</h1>
                <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)' }}>{playerName}</div>
            </div>

            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Stats Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    {[
                        { label: 'MATCHES', value: stats.totalMatches, color: 'var(--neon-cyan)' },
                        { label: 'WIN RATE', value: `${stats.winRate}%`, color: '#34d399' },
                        { label: 'AVG ACC', value: `${stats.avgAccuracy}%`, color: '#a78bfa' },
                        { label: 'STREAK', value: stats.currentStreak, color: '#facc15' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-panel"
                            style={{ padding: '1rem', textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '0.28rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.4rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.8rem', color: stat.color }}>{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ELO Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.35rem', color: '#a78bfa' }}>DEVELOPMENT ELO</span>
                            <span style={{ fontSize: '0.5rem', color: '#a78bfa' }}>{ratings.development}</span>
                        </div>
                        {renderEloChart('development', '#a78bfa')}
                    </div>

                    <div className="glass-panel" style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.35rem', color: '#34d399' }}>CYBERSECURITY ELO</span>
                            <span style={{ fontSize: '0.5rem', color: '#34d399' }}>{ratings.cybersecurity}</span>
                        </div>
                        {renderEloChart('cybersecurity', '#34d399')}
                    </div>
                </div>

                {/* Win/Loss/Draw Breakdown */}
                <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem' }}>MATCH BREAKDOWN</div>
                    <div style={{ display: 'flex', gap: '0.5rem', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
                        {stats.totalMatches > 0 ? (
                            <>
                                <div style={{ flex: stats.wins, background: '#34d399', borderRadius: '4px 0 0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stats.wins > 0 && <span style={{ fontSize: '0.25rem' }}>W:{stats.wins}</span>}
                                </div>
                                <div style={{ flex: stats.draws || 0.01, background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stats.draws > 0 && <span style={{ fontSize: '0.25rem', color: '#000' }}>D:{stats.draws}</span>}
                                </div>
                                <div style={{ flex: stats.losses, background: '#ef4444', borderRadius: '0 4px 4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {stats.losses > 0 && <span style={{ fontSize: '0.25rem' }}>L:{stats.losses}</span>}
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
                                <span style={{ fontSize: '0.28rem', color: 'rgba(255,255,255,0.3)' }}>No matches yet</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Matches */}
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.6rem' }}>RECENT MATCHES</div>
                    {recentMatches.length === 0 ? (
                        <p style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '1rem' }}>
                            No match history yet. Start a duel!
                        </p>
                    ) : (
                        recentMatches.map((match, i) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                style={{
                                    display: 'grid', gridTemplateColumns: '60px 1fr 60px 60px 80px',
                                    gap: '0.5rem', padding: '0.5rem', alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <span style={{
                                    fontSize: '0.3rem',
                                    color: match.result === 'win' ? '#34d399' : match.result === 'draw' ? '#facc15' : '#ef4444',
                                    textTransform: 'uppercase',
                                }}>
                                    {match.result}
                                </span>
                                <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.6)' }}>
                                    {match.skill?.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                    {Math.round(match.accuracy || 0)}%
                                </span>
                                <span style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                    EFF:{match.efficiency || 0}
                                </span>
                                <span style={{
                                    fontSize: '0.3rem', textAlign: 'right',
                                    color: (match.ratingChange || 0) >= 0 ? '#34d399' : '#ef4444',
                                }}>
                                    {(match.ratingChange || 0) >= 0 ? '+' : ''}{match.ratingChange || 0}
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
