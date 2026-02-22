import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useCodingStore } from '../store/useCodingStore';
import { calculateELO } from '../engine/eloSystem';
import { buildCodingMetrics } from '../engine/metricsCollector';
import { sendGameResults } from '../engine/performanceBridge';

const font = "'Press Start 2P', cursive";

const ResultScreen = ({ playerResults, skill, opponentRating, onReturn, isFriendly = false }) => {
    const { ratings, updateRating, addMatchResult } = useCodingStore();
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        const totalRounds = playerResults.length || 1;

        const avgAccuracy = playerResults.reduce((a, b) => a + b.accuracy, 0) / totalRounds;
        const avgSpeed = playerResults.reduce((a, b) => a + (60 - b.timeLeft), 0) / totalRounds;
        const avgEfficiency = playerResults.reduce((a, b) => a + b.efficiency, 0) / totalRounds;

        const playerScore = (avgAccuracy * 0.5) + ((100 - avgSpeed) * 0.3) + (avgEfficiency * 0.2);
        const opponentScore = Math.floor(Math.random() * (90 - 60 + 1) + 60);

        let resultValue = 0.5;
        if (playerScore > opponentScore) resultValue = 1;
        else if (playerScore < opponentScore) resultValue = 0;

        const currentRating = ratings[skill];

        if (isFriendly) {
            // Friendly duel: no ELO change, no match history
            const finalMetrics = buildCodingMetrics({
                skill, avgAccuracy, avgSpeed, avgEfficiency,
                ratingChange: 0, newRating: currentRating,
            });
            setMetrics({ ...finalMetrics, resultValue, opponentScore: Math.round(opponentScore), playerScore: Math.round(playerScore), isFriendly: true });
            return;
        }

        const newRating = calculateELO(currentRating, opponentRating, resultValue);
        updateRating(skill, newRating);

        addMatchResult({
            skill,
            result: resultValue === 1 ? 'win' : resultValue === 0 ? 'loss' : 'draw',
            accuracy: Math.round(avgAccuracy),
            efficiency: Math.round(avgEfficiency),
            ratingChange: newRating - currentRating,
            newRating,
            opponentRating,
            playerScore: Math.round(playerScore),
            opponentScore: Math.round(opponentScore),
        });

        const finalMetrics = buildCodingMetrics({
            skill, avgAccuracy, avgSpeed, avgEfficiency,
            ratingChange: newRating - currentRating, newRating,
        });
        setMetrics({ ...finalMetrics, resultValue, opponentScore: Math.round(opponentScore), playerScore: Math.round(playerScore) });

        // Report to SkillForge auth server for profile/skill tracking
        const weakRounds = playerResults.filter(r => r.accuracy < 60);
        sendGameResults({
            gameType: `coding-duel-${skill}`,
            score: Math.round(playerScore),
            weakTopics: weakRounds.length > 0 ? [`Low accuracy in ${weakRounds.length}/${totalRounds} rounds`] : [],
            xpEarned: Math.round(avgAccuracy * 0.5),
            metrics: { avgAccuracy: Math.round(avgAccuracy), avgEfficiency: Math.round(avgEfficiency), ratingChange: newRating - currentRating },
        });
    }, []);

    if (!metrics) {
        return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f1120', fontFamily: font }}>
                <h2 style={{ fontSize: '0.7rem', color: 'var(--neon-cyan)' }}>CALCULATING RESULTS...</h2>
            </div>
        );
    }

    const isWin = metrics.rating.change >= 0;
    const resultLabel = metrics.resultValue === 1 ? 'VICTORY' : metrics.resultValue === 0 ? 'DEFEAT' : 'DRAW';

    return (
        <div style={{
            height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: '#0f1120', fontFamily: font,
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '520px', textAlign: 'center' }}
            >
                {/* Result Header */}
                <motion.h1
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    style={{
                        fontSize: '1.4rem', marginBottom: '0.3rem',
                        color: isWin ? 'var(--neon-cyan)' : metrics.resultValue === 0.5 ? '#facc15' : '#ef4444',
                    }}
                >
                    {resultLabel}
                </motion.h1>
                <p style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2rem' }}>
                    {metrics.skill.toUpperCase()} DUEL COMPLETE
                </p>

                {/* Score Comparison */}
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem',
                    marginBottom: '1.5rem', padding: '1rem',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                }}>
                    <div>
                        <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>YOU</div>
                        <div style={{ fontSize: '1rem', color: 'var(--neon-cyan)' }}>{metrics.playerScore}</div>
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)' }}>VS</div>
                    <div>
                        <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>RIVAL</div>
                        <div style={{ fontSize: '1rem', color: 'var(--neon-purple)' }}>{metrics.opponentScore}</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem',
                    marginBottom: '1.5rem',
                }}>
                    {[
                        { label: 'ACCURACY', value: `${Math.round(metrics.performance.accuracy)}%`, color: '#34d399' },
                        { label: 'EFFICIENCY', value: metrics.performance.efficiency, color: '#a78bfa' },
                        { label: 'NEW RATING', value: metrics.rating.newRating, color: 'var(--neon-cyan)' },
                        { label: 'CHANGE', value: metrics.rating.change >= 0 ? `+${metrics.rating.change}` : `${metrics.rating.change}`, color: metrics.rating.change >= 0 ? '#34d399' : '#ef4444' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px', padding: '0.8rem',
                            }}
                        >
                            <div style={{ fontSize: '0.3rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.3rem' }}>{stat.label}</div>
                            <div style={{ fontSize: '0.65rem', color: stat.color }}>{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Per-Round Breakdown */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.5rem' }}>ROUND BREAKDOWN</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem' }}>
                        {playerResults.map((r, i) => (
                            <div key={i} style={{
                                width: '40px', padding: '0.4rem 0', borderRadius: '4px',
                                background: r.accuracy >= 80 ? 'rgba(52, 211, 153, 0.15)' : r.accuracy >= 40 ? 'rgba(250, 204, 21, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${r.accuracy >= 80 ? 'rgba(52, 211, 153, 0.3)' : r.accuracy >= 40 ? 'rgba(250, 204, 21, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            }}>
                                <div style={{ fontSize: '0.25rem', color: 'rgba(255,255,255,0.4)' }}>R{i + 1}</div>
                                <div style={{ fontSize: '0.35rem', color: '#fff' }}>{Math.round(r.accuracy)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="neon-button"
                    onClick={onReturn}
                    style={{ fontFamily: font, fontSize: '0.5rem' }}
                >
                    RETURN TO COMMAND CENTER
                </motion.button>
            </motion.div>
        </div>
    );
};

export default ResultScreen;
