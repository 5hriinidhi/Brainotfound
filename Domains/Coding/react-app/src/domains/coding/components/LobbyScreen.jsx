import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCodingStore } from '../store/useCodingStore';
import lobbyBg from '../../../assets/lobby.png';

const LobbyScreen = ({ onBack, onStartMatchmaking }) => {
    const { playerName, ratings } = useCodingStore();
    const [selectedSkill, setSelectedSkill] = useState(null);

    return (
        <div style={{
            height: '100vh', width: '100vw',
            backgroundImage: `url(${lobbyBg})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '450px', textAlign: 'center' }}
            >
                <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem', fontFamily: "'Press Start 2P', cursive", fontSize: '1.1rem' }}>COMMAND CENTER</h2>
                <p style={{ marginBottom: '2rem', fontFamily: "'Press Start 2P', cursive", fontSize: '0.55rem' }}>User: <span style={{ color: 'var(--neon-purple)' }}>{playerName}</span></p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        className={`neon-button ${selectedSkill === 'development' ? 'active' : ''}`}
                        onClick={() => setSelectedSkill('development')}
                        style={{
                            background: selectedSkill === 'development' ? '' : 'rgba(255,255,255,0.05)',
                            border: selectedSkill === 'development' ? '1px solid var(--neon-cyan)' : '1px solid transparent',
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: '0.55rem',
                        }}
                    >
                        DEVELOPMENT (ELO: {ratings.development})
                    </button>

                    <button
                        className={`neon-button ${selectedSkill === 'cybersecurity' ? 'active' : ''}`}
                        onClick={() => setSelectedSkill('cybersecurity')}
                        style={{
                            background: selectedSkill === 'cybersecurity' ? '' : 'rgba(255,255,255,0.05)',
                            border: selectedSkill === 'cybersecurity' ? '1px solid var(--neon-cyan)' : '1px solid transparent',
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: '0.55rem',
                        }}
                    >
                        CYBERSECURITY (ELO: {ratings.cybersecurity})
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button className="neon-button" style={{ filter: 'grayscale(1)', fontFamily: "'Press Start 2P', cursive", fontSize: '0.6rem' }} onClick={onBack}>
                        EXIT
                    </button>
                    <button
                        className="neon-button"
                        disabled={!selectedSkill}
                        onClick={() => onStartMatchmaking(selectedSkill)}
                        style={{ opacity: selectedSkill ? 1 : 0.5, fontFamily: "'Press Start 2P', cursive", fontSize: '0.6rem' }}
                    >
                        FIND DUEL
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default LobbyScreen;
