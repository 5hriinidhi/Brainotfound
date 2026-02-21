import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TitleScreen from './shared/components/TitleScreen'
import LobbyScreen from './domains/coding/components/LobbyScreen'
import DuelArena from './domains/coding/components/DuelArena'
import ResultScreen from './domains/coding/components/ResultScreen'
import StoryMode from './domains/coding/components/StoryMode'
import Leaderboard from './domains/coding/components/Leaderboard'
import Dashboard from './domains/coding/components/Dashboard'
import FriendLobby from './domains/coding/components/FriendLobby'
import { useCodingStore } from './domains/coding/store/useCodingStore'
import { findOpponent } from './domains/coding/engine/matchmaking'

const App = () => {
    const [screen, setScreen] = useState('TITLE')
    const [selectedSkill, setSelectedSkill] = useState(null)
    const [opponentRating, setOpponentRating] = useState(1200)
    const [duelResults, setDuelResults] = useState([])
    const [isFriendlyDuel, setIsFriendlyDuel] = useState(false)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode === 'duel') {
            setScreen('LOBBY');
        } else if (mode === 'story') {
            setScreen('STORY');
        }
    }, []);

    const handleStartMatchmaking = (skill) => {
        const { ratings } = useCodingStore.getState()
        const opponent = findOpponent(ratings[skill])
        setOpponentRating(opponent.rating)
        setSelectedSkill(skill)
        setIsFriendlyDuel(false)
        setScreen('MATCHMAKING')

        setTimeout(() => setScreen('DUEL_ARENA'), 2000)
    }

    const handleFriendlyDuel = (skill, roomCode, isHost, opponentName = 'Challenger', questionSeed) => {
        setSelectedSkill(skill)
        setOpponentRating(1200)
        setIsFriendlyDuel(true)
        useCodingStore.getState().setLobby(roomCode, isHost, opponentName)
        setScreen('DUEL_ARENA')
    }

    return (
        <main style={{ background: '#0f1120', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={screen}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {screen === 'TITLE' && (
                        <TitleScreen
                            onStartDuel={() => setScreen('LOBBY')}
                            onStartStory={() => setScreen('STORY')}
                            onLeaderboard={() => setScreen('LEADERBOARD')}
                            onDashboard={() => setScreen('DASHBOARD')}
                            onFriendDuel={() => setScreen('FRIEND_LOBBY')}
                        />
                    )}

                    {screen === 'LOBBY' && (
                        <LobbyScreen
                            onBack={() => setScreen('TITLE')}
                            onStartMatchmaking={handleStartMatchmaking}
                        />
                    )}

                    {screen === 'FRIEND_LOBBY' && (
                        <FriendLobby
                            onBack={() => setScreen('TITLE')}
                            onStartFriendlyDuel={handleFriendlyDuel}
                        />
                    )}

                    {screen === 'MATCHMAKING' && (
                        <div className="matchmaking-overlay" style={{
                            height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center', background: '#0f1120',
                            fontFamily: "'Press Start 2P', cursive",
                        }}>
                            <h2 style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '1rem' }}>SCANNING FOR RIVAL...</h2>
                            <div className="loader"></div>
                            <p style={{ marginTop: '1rem', color: 'var(--neon-cyan)', fontSize: '0.5rem' }}>
                                Skill: {selectedSkill?.toUpperCase()}
                            </p>
                            <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.35rem' }}>
                                Opponent Rating: ~{opponentRating}
                            </p>
                        </div>
                    )}

                    {screen === 'DUEL_ARENA' && (
                        <DuelArena
                            skill={selectedSkill}
                            onDuelEnd={(allResults) => {
                                setDuelResults(allResults)
                                setScreen('RESULTS')
                            }}
                        />
                    )}

                    {screen === 'RESULTS' && (
                        <ResultScreen
                            playerResults={duelResults}
                            skill={selectedSkill}
                            opponentRating={opponentRating}
                            isFriendly={isFriendlyDuel}
                            onReturn={() => {
                                setIsFriendlyDuel(false)
                                useCodingStore.getState().clearLobby()
                                setScreen('LOBBY')
                            }}
                        />
                    )}

                    {screen === 'STORY' && (
                        <StoryMode onExit={() => setScreen('TITLE')} />
                    )}

                    {screen === 'LEADERBOARD' && (
                        <Leaderboard onBack={() => setScreen('TITLE')} />
                    )}

                    {screen === 'DASHBOARD' && (
                        <Dashboard onBack={() => setScreen('TITLE')} />
                    )}
                </motion.div>
            </AnimatePresence>
        </main>
    )
}

export default App
