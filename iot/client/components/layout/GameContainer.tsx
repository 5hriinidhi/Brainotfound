/**
 * GameContainer — Shared layout wrapper for both Circuit Builder and Crisis Sequence Builder.
 *
 * Provides:
 *   - Full-screen dark background
 *   - TopStatsBar (mode label, difficulty, counter, XP, timer, stability, attempts)
 *   - XP popup overlay
 *   - Celebration overlay (grade badge + particles)
 *   - Scenario failed overlay
 *   - Children slot for the builder content
 *
 * This eliminates ~120 lines of duplicate JSX between the two builders.
 */
'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Shared constants ─────────────────────────────────────────────────────────
const DIFF_COLORS: Record<string, string> = { easy: 'text-emerald-400', medium: 'text-amber-400', hard: 'text-red-400' };
const DIFF_BG: Record<string, string> = { easy: 'bg-emerald-900/30 border-emerald-700/30', medium: 'bg-amber-900/30 border-amber-700/30', hard: 'bg-red-900/30 border-red-700/30' };
export const GRADE_COLORS: Record<string, string> = {
    S: 'from-yellow-400 to-amber-500', A: 'from-emerald-400 to-cyan-500', B: 'from-blue-400 to-violet-500',
    C: 'from-violet-400 to-purple-500', D: 'from-orange-400 to-red-500', F: 'from-red-500 to-red-700',
};

// ── Timer sub-component ──────────────────────────────────────────────────────
export function TimerDisplay({ seconds }: { seconds: number }) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const urgent = seconds <= 15;
    const warning = seconds <= 30;
    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-colors ${urgent ? 'bg-red-900/40 border-red-700/50' : warning ? 'bg-amber-900/30 border-amber-700/30' : 'bg-black/30 border-white/10'
            }`}>
            <span className={`text-base font-bold font-mono tabular-nums ${urgent ? 'text-red-400 animate-pulse' : warning ? 'text-amber-400' : 'text-zinc-300'}`}>
                ⏱ {mins}:{secs.toString().padStart(2, '0')}
            </span>
        </div>
    );
}

// ── Stability sub-component ──────────────────────────────────────────────────
export function StabilityMeter({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500">STAB</span>
            <div className="w-24 h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div animate={{ width: `${value}%` }} transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${value > 70 ? 'bg-emerald-500' : value > 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
            <span className="text-xs font-bold text-zinc-400">{value}%</span>
        </div>
    );
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface GameContainerProps {
    /** Mode identity */
    modeLabel: string;
    modeIcon: string;
    modeColor: string; // tailwind text color class

    /** Scenario info for top bar */
    difficulty: 'easy' | 'medium' | 'hard';
    scenarioIndex: number;
    totalScenarios: number;

    /** Stats */
    totalXP: number;
    timerSeconds: number;
    attemptsLeft: number;
    maxAttempts: number;

    /** Optional extra top-bar items (power meter, part count, etc.) */
    topBarExtra?: ReactNode;

    /** Overlays */
    showXPPopup: boolean;
    xpPopupAmount: number;
    xpPopupLabel?: string;

    showCelebration: boolean;
    grade: string | null;
    celebrationTitle: string;
    celebrationXP: number;
    celebrationSubtitle?: string;
    onDismissCelebration: () => void;

    scenarioFailed: boolean;
    failedTitle: string;
    failedReason: string;
    failedExtra?: ReactNode;
    onRetry: () => void;

    /** Optional stability meter */
    stability?: number;

    /** Optional background GIF/Image */
    backgroundUrl?: string;

    /** Builder content */
    children: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// GameContainer
// ═══════════════════════════════════════════════════════════════════════════

export default function GameContainer(props: GameContainerProps) {
    const {
        modeLabel, modeIcon, modeColor,
        difficulty, scenarioIndex, totalScenarios,
        totalXP, timerSeconds, attemptsLeft, maxAttempts,
        topBarExtra,
        showXPPopup, xpPopupAmount, xpPopupLabel,
        showCelebration, grade, celebrationTitle, celebrationXP, celebrationSubtitle, onDismissCelebration,
        scenarioFailed, failedTitle, failedReason, failedExtra, onRetry,
        stability,
        backgroundUrl,
        children,
    } = props;

    return (
        <div className="h-screen w-screen bg-[#0a0a12] text-white flex flex-col overflow-hidden relative">
            {/* ═══ THEMED BACKGROUND ════════════════════════════════════ */}
            {backgroundUrl && (
                <div
                    className="absolute inset-0 z-0 opacity-40 pointer-events-none overflow-hidden"
                    style={{
                        backgroundImage: `url(${backgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'saturate(0.8)',
                    }}
                />
            )}

            {/* ═══ XP POPUP ═════════════════════════════════════════════ */}
            <AnimatePresence>
                {showXPPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.8 }}
                        className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 shadow-2xl shadow-violet-900/50 border border-white/20">
                            <p className="text-2xl font-black text-white text-center">+{xpPopupAmount} XP</p>
                            <p className="text-xs font-bold text-white/70 text-center tracking-wider uppercase">{xpPopupLabel ?? 'Well Done'}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ CELEBRATION OVERLAY ═══════════════════════════════════ */}
            <AnimatePresence>
                {showCelebration && grade && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md"
                        onClick={onDismissCelebration}>
                        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                            className="text-center">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <motion.div key={i}
                                    initial={{ opacity: 1, x: 0, y: 0 }}
                                    animate={{
                                        opacity: 0,
                                        x: Math.cos(i * 30 * Math.PI / 180) * 120,
                                        y: Math.sin(i * 30 * Math.PI / 180) * 120,
                                    }}
                                    transition={{ duration: 1.5, delay: 0.2 }}
                                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                            ))}
                            <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${GRADE_COLORS[grade] ?? GRADE_COLORS.F} flex items-center justify-center shadow-2xl mx-auto mb-4`}>
                                <span className="text-5xl font-black text-white drop-shadow-lg">{grade}</span>
                            </div>
                            <p className="text-xl font-bold text-white mb-1">{celebrationTitle}</p>
                            <p className="text-[9px] text-zinc-300">+{celebrationXP} XP earned</p>
                            {celebrationSubtitle && <p className="text-[8px] text-zinc-400 mt-1">{celebrationSubtitle}</p>}
                            <p className="text-[7px] text-zinc-500 mt-4">Click anywhere to continue</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ SCENARIO FAILED OVERLAY ═══════════════════════════════ */}
            <AnimatePresence>
                {scenarioFailed && !showCelebration && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-center">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-2xl mx-auto mb-4">
                                <span className="text-4xl">💥</span>
                            </div>
                            <p className="text-xl font-bold text-red-400 mb-1">{failedTitle}</p>
                            <p className="text-[8px] text-zinc-400">{failedReason}</p>
                            {failedExtra}
                            <button onClick={onRetry}
                                className="mt-4 px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[8px] cursor-pointer transition-all active:scale-95">
                                🔄 Retry Scenario
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ TOP STATS BAR ═══════════════════════════════════════ */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-black ${modeColor} uppercase tracking-widest`}>{modeIcon} {modeLabel}</span>
                    {topBarExtra && (
                        <>
                            <span className="text-zinc-600 font-bold">|</span>
                            {topBarExtra}
                        </>
                    )}
                    <span className="text-zinc-600 font-bold">|</span>
                    <span className={`text-xs px-3 py-1 rounded-full border font-bold ${DIFF_BG[difficulty]}`}>
                        <span className={DIFF_COLORS[difficulty]}>{difficulty.toUpperCase()}</span>
                    </span>
                    <span className="text-zinc-600 font-bold">|</span>
                    <span className="text-sm font-bold text-zinc-300">{scenarioIndex + 1}/{totalScenarios}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 rounded-full bg-violet-900/30 border border-violet-700/30">
                        <span className="text-xs font-black text-violet-400">✦ {totalXP} XP</span>
                    </div>
                    <TimerDisplay seconds={timerSeconds} />
                    {stability !== undefined && <StabilityMeter value={stability} />}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-white/10">
                        {Array.from({ length: maxAttempts }).map((_, i) => (
                            <span key={i} className={`text-base leading-none ${i < attemptsLeft ? 'text-emerald-400' : 'text-red-500/40'}`}>
                                {i < attemptsLeft ? '●' : '○'}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* ═══ BUILDER CONTENT ═════════════════════════════════════ */}
            {children}
        </div>
    );
}
