import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { storyData } from '../storyMode/storyData';
import DuelArena from './DuelArena';
import { sendGameResults } from '../engine/performanceBridge';

const font = "'Press Start 2P', cursive";

const StoryMode = ({ onExit }) => {
    const [currentNodeId, setCurrentNodeId] = useState(storyData.startNode);
    const [gameState, setGameState] = useState('NARRATIVE'); // NARRATIVE | CHALLENGE | ENDING

    const currentNode = storyData.nodes[currentNodeId];

    const handleChallengeComplete = (results) => {
        // Calculate average accuracy across all rounds
        const totalRounds = results.length || 1;
        const avgAccuracy = results.reduce((sum, r) => sum + r.accuracy, 0) / totalRounds;

        // >= 50% accuracy = success, otherwise failure
        const passed = avgAccuracy >= 50;

        // Report to SkillForge auth server
        sendGameResults({
            gameType: 'coding-story',
            score: Math.round(avgAccuracy),
            skillArea: 'Problem Solving',
            weakTopics: !passed ? ['Story challenge failed', `Avg accuracy: ${Math.round(avgAccuracy)}%`] : [],
            xpEarned: passed ? 30 : 10,
        });

        if (currentNode.isEnding) {
            setGameState('ENDING');
            return;
        }

        const nextNodeId = passed ? currentNode.nextSuccess : currentNode.nextFailure;
        const nextNode = storyData.nodes[nextNodeId];

        setCurrentNodeId(nextNodeId);

        if (nextNode?.isEnding) {
            setGameState('ENDING');
        } else {
            setGameState('NARRATIVE');
        }
    };

    // Ending screen (victory or failure)
    if (gameState === 'ENDING' && currentNode?.isEnding) {
        const isVictory = currentNode.endingType === 'victory';

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    height: '100vh', width: '100vw',
                    backgroundImage: `url(${currentNode.background})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    position: 'relative',
                }}
            >
                {/* Dark overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: isVictory
                        ? 'rgba(0, 0, 0, 0.5)'
                        : 'linear-gradient(180deg, rgba(100, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.8) 100%)',
                    zIndex: 0,
                }} />

                {/* Failure fire effect */}
                {!isVictory && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                        background: 'linear-gradient(0deg, rgba(255, 60, 0, 0.3) 0%, rgba(255, 100, 0, 0.1) 50%, transparent 100%)',
                        zIndex: 1, animation: 'flicker 0.5s ease-in-out infinite alternate',
                    }} />
                )}

                <motion.div
                    initial={{ scale: 0.8, y: 30 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-panel"
                    style={{
                        padding: '2.5rem', textAlign: 'center', maxWidth: '550px',
                        fontFamily: font, zIndex: 2,
                        border: isVictory ? '1px solid rgba(0, 255, 255, 0.2)' : '1px solid rgba(255, 60, 0, 0.3)',
                    }}
                >
                    <h1 style={{
                        fontSize: '1.5rem', marginBottom: '1.5rem',
                        color: isVictory ? 'var(--neon-cyan)' : '#ef4444',
                    }}>
                        {currentNode.endingTitle}
                    </h1>

                    <p style={{
                        fontSize: '0.8rem', lineHeight: 2.2, marginBottom: '1.5rem',
                        color: 'rgba(255,255,255,0.8)',
                    }}>
                        {currentNode.text}
                    </p>

                    <p style={{
                        fontSize: '0.7rem', lineHeight: 2, marginBottom: '2rem',
                        color: isVictory ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 100, 100, 0.6)',
                        fontStyle: 'italic',
                    }}>
                        {currentNode.endingMessage}
                    </p>

                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
                        {!isVictory && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="neon-button"
                                onClick={() => {
                                    setCurrentNodeId(storyData.startNode);
                                    setGameState('NARRATIVE');
                                }}
                                style={{ fontFamily: font, fontSize: '0.75rem', filter: 'hue-rotate(180deg)' }}
                            >
                                🔄 TRY AGAIN
                            </motion.button>
                        )}
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className="neon-button"
                            onClick={onExit}
                            style={{
                                fontFamily: font, fontSize: '0.75rem',
                                background: isVictory ? '' : 'transparent',
                                border: isVictory ? '' : '1px solid rgba(255,255,255,0.2)',
                            }}
                        >
                            {isVictory ? '🏆 RETURN' : '← EXIT'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* CSS for fire flicker */}
                <style>{`
          @keyframes flicker {
            0% { opacity: 0.6; }
            100% { opacity: 1; }
          }
        `}</style>
            </motion.div>
        );
    }

    return (
        <div style={{ height: '100vh', width: '100vw', backgroundColor: '#000' }}>
            <AnimatePresence mode="wait">
                {gameState === 'NARRATIVE' && (
                    <motion.div
                        key={currentNode.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            height: '100vh', width: '100vw',
                            backgroundImage: `url(${currentNode.background})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        }}
                    >
                        {/* Back button */}
                        <button
                            onClick={onExit}
                            style={{
                                position: 'absolute', top: '1.2rem', left: '1.2rem',
                                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: '6px',
                                fontFamily: font, fontSize: '0.55rem', cursor: 'pointer', zIndex: 10,
                            }}
                        >
                            ← EXIT STORY
                        </button>

                        {/* Narrative Panel */}
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="glass-panel"
                            style={{ margin: '1rem 2rem', padding: '1rem 1.5rem' }}
                        >
                            <p style={{
                                fontSize: '0.8rem', marginBottom: '1.2rem', lineHeight: 2,
                                fontFamily: font, color: 'rgba(255,255,255,0.85)',
                            }}>
                                {currentNode.text}
                            </p>
                            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                                <motion.button
                                    whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(0, 210, 255, 0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    className="neon-button"
                                    onClick={() => setGameState('CHALLENGE')}
                                    style={{ fontFamily: font, fontSize: '0.75rem' }}
                                >
                                    ⚡ INTERFACE
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {gameState === 'CHALLENGE' && (
                    <motion.div
                        key="challenge"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', duration: 0.4 }}
                        style={{ height: '100vh', width: '100vw' }}
                    >
                        <DuelArena
                            skill={currentNode.challenge.skill}
                            isStoryMode={true}
                            onDuelEnd={handleChallengeComplete}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StoryMode;
