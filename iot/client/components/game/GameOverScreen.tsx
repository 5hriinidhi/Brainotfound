'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { sendGameResults } from '@/lib/performanceBridge';

export default function GameOverScreen() {
    const { reasoning, efficiency, powerAwareness, stability, score, gameStatus, gameMode, resetGame } =
        useGameStore();
    const router = useRouter();

    const isComplete = gameStatus === 'complete';

    // Report to SkillForge auth server
    useEffect(() => {
        if (gameMode && (gameStatus === 'complete' || gameStatus === 'gameover')) {
            const weakStats = [
                { label: 'Reasoning', value: reasoning },
                { label: 'Efficiency', value: efficiency },
                { label: 'Power', value: powerAwareness },
                { label: 'Stability', value: stability },
            ].filter(s => s.value < 50).map(s => s.label);

            sendGameResults({
                gameType: gameMode === 'debug' ? 'iot-circuit' : 'iot-crisis',
                score: Math.round((score / Math.max(1, score + 50)) * 100),
                weakTopics: weakStats,
                xpEarned: Math.round(score * 0.3),
            });
        }
    }, [gameStatus]);

    const handleRestart = () => {
        resetGame();
        router.push('/');
    };

    const handlePlayAgain = () => {
        if (gameMode) {
            useGameStore.getState().startGame(gameMode);
        }
    };

    const stats = [
        { label: 'Reasoning', value: reasoning, icon: '🧠', color: 'text-cyan-400' },
        { label: 'Efficiency', value: efficiency, icon: '⚡', color: 'text-amber-400' },
        { label: 'Power', value: powerAwareness, icon: '🔋', color: 'text-violet-400' },
        { label: 'Stability', value: stability, icon: '🛡', color: stability > 30 ? 'text-emerald-400' : 'text-red-400' },
    ];

    const grade =
        score >= 200 ? { letter: 'S', color: 'text-yellow-300', glow: 'shadow-yellow-400/50' }
            : score >= 150 ? { letter: 'A', color: 'text-emerald-400', glow: 'shadow-emerald-400/50' }
                : score >= 100 ? { letter: 'B', color: 'text-cyan-400', glow: 'shadow-cyan-400/50' }
                    : score >= 50 ? { letter: 'C', color: 'text-amber-400', glow: 'shadow-amber-400/50' }
                        : { letter: 'D', color: 'text-red-400', glow: 'shadow-red-400/50' };

    const modeLabel = gameMode === 'debug' ? '🔧 Circuit Debug Lab' : '🚨 IoT Crisis Mode';

    return (
        <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col items-center justify-center px-4">
            {/* Grid */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            <div className="relative z-10 w-full max-w-md text-center space-y-6">
                {/* Mode badge */}
                <p className="font-pixel text-xs text-zinc-500 uppercase">{modeLabel}</p>

                {/* Status badge */}
                <span className={`inline-block px-5 py-1.5 text-base font-bold tracking-widest uppercase rounded-full ${isComplete ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'}`}>
                    {isComplete ? 'Mission Complete' : 'System Failure'}
                </span>

                {/* Title */}
                <h1 className="font-pixel text-4xl md:text-5xl bg-gradient-to-br from-white via-violet-200 to-violet-500 bg-clip-text text-transparent">
                    {isComplete ? 'Well Done!' : 'Game Over'}
                </h1>
                <p className="text-lg text-zinc-400">
                    {isComplete ? 'All scenarios resolved. The IoT network is safe.' : 'The system collapsed under cascading failures.'}
                </p>

                {/* Grade */}
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-2xl bg-white/5 border border-white/10 shadow-2xl ${grade.glow}`}>
                    <span className={`font-pixel text-6xl ${grade.color}`}>{grade.letter}</span>
                </div>

                {/* Score */}
                <p className="text-zinc-300">
                    <span className="font-pixel text-sm text-zinc-500">Total Score</span>
                    <br />
                    <span className="font-pixel text-3xl text-white">{score}</span>
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => (
                        <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-5">
                            <p className="text-2xl">{s.icon}</p>
                            <p className="font-pixel text-xs text-zinc-400 mt-2">{s.label}</p>
                            <p className={`font-pixel text-xl mt-1 ${s.color}`}>{Math.round(s.value)}</p>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center pt-4">
                    <button
                        onClick={handlePlayAgain}
                        className="font-pixel text-xs px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all active:scale-95"
                    >
                        Play Again
                    </button>
                    <button
                        onClick={handleRestart}
                        className="font-pixel text-xs px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 transition-all border border-white/10 active:scale-95"
                    >
                        Switch Mode
                    </button>
                </div>
            </div>
        </div>
    );
}
