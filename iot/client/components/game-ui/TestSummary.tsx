/**
 * TestSummary — Animated overlay shown after all 5 test questions are complete.
 *
 * Displays: questions solved, bonus usage, average speed, performance badge,
 * animated XP bar, and backend session storage trigger.
 */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { playCelebration, playFail, playPowerUp } from '@/utils/soundEngine';
import { fireConfetti } from '@/utils/confetti';
import { analyzePerformance, type TestLevelAnalytics } from '@/utils/skillAnalyzer';
import type { CircuitDecision } from '@/store/useCircuitStore';
import type { CrisisDecision } from '@/store/useCrisisStore';

type Decision = CircuitDecision | CrisisDecision;
type Mode = 'debug' | 'crisis';

// ── Badge System ─────────────────────────────────────────────────────────────

interface PerformanceBadge {
    title: string;
    icon: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

function determineBadge(
    decisions: Decision[],
    analytics: TestLevelAnalytics | undefined,
): PerformanceBadge {
    const solved = decisions.filter((d) => d.finalOutcome === 'solved').length;
    const total = decisions.length;
    const avgTime = total > 0
        ? decisions.reduce((s, d) => s + d.timeTaken, 0) / total
        : 0;
    const bonusCount = decisions.filter((d) => d.bonusTimeUsed).length;
    const hardSolved = decisions.filter((d) => d.difficulty === 'hard' && d.isCorrect).length;

    // Fast Fixer: solved ≥3 with avg time < 45s
    if (solved >= 3 && avgTime < 45) {
        return {
            title: 'Fast Fixer',
            icon: '⚡',
            color: 'text-amber-300',
            bgColor: 'bg-amber-900/30',
            borderColor: 'border-amber-500/40',
        };
    }

    // Strategic Analyst: solved ≥4 with ≥2 hard
    if (solved >= 4 && hardSolved >= 2) {
        return {
            title: 'Strategic Analyst',
            icon: '🧠',
            color: 'text-violet-300',
            bgColor: 'bg-violet-900/30',
            borderColor: 'border-violet-500/40',
        };
    }

    // Under Pressure Performer: solved ≥3 and used bonus ≥2 times
    if (solved >= 3 && bonusCount >= 2) {
        return {
            title: 'Under Pressure Performer',
            icon: '🔥',
            color: 'text-red-300',
            bgColor: 'bg-red-900/30',
            borderColor: 'border-red-500/40',
        };
    }

    // Tactical Thinker: default for decent performance
    if (solved >= 2) {
        return {
            title: 'Tactical Thinker',
            icon: '🎯',
            color: 'text-cyan-300',
            bgColor: 'bg-cyan-900/30',
            borderColor: 'border-cyan-500/40',
        };
    }

    // Fallback: needs improvement
    return {
        title: 'Rookie Engineer',
        icon: '🔧',
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-800/30',
        borderColor: 'border-zinc-600/40',
    };
}

// ── Props ────────────────────────────────────────────────────────────────────

interface TestSummaryProps {
    show: boolean;
    decisions: Decision[];
    totalXP: number;
    mode: Mode;
    onClose: () => void;
}

// ── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target, duration = 1.5, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (target === 0) return;
        const start = performance.now();
        const animate = (now: number) => {
            const elapsed = (now - start) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCurrent(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [target, duration]);

    return <>{current}{suffix}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main TestSummary
// ═══════════════════════════════════════════════════════════════════════════

export default function TestSummary({ show, decisions, totalXP, mode, onClose }: TestSummaryProps) {
    const router = useRouter();
    const [phase, setPhase] = useState(0); // 0=enter, 1=stats, 2=badge, 3=xp, 4=ready
    const [backendSaved, setBackendSaved] = useState(false);

    const total = decisions.length;
    const solved = decisions.filter((d) => d.finalOutcome === 'solved').length;
    const bonusCount = decisions.filter((d) => d.bonusTimeUsed).length;
    const avgTime = total > 0
        ? Math.round(decisions.reduce((s, d) => s + d.timeTaken, 0) / total)
        : 0;
    const passed = solved >= 3;

    const analysis = useMemo(() => analyzePerformance(decisions, mode), [decisions, mode]);
    const badge = useMemo(() => determineBadge(decisions, analysis.testAnalytics), [decisions, analysis]);

    // Phase progression
    useEffect(() => {
        if (!show) { setPhase(0); return; }

        const timers = [
            setTimeout(() => setPhase(1), 600),   // stats
            setTimeout(() => setPhase(2), 1800),   // badge
            setTimeout(() => setPhase(3), 2800),   // xp bar
            setTimeout(() => setPhase(4), 3800),   // buttons ready
        ];

        // Sound
        if (passed) {
            setTimeout(() => { playCelebration(); fireConfetti(); }, 400);
        } else {
            setTimeout(() => playFail(), 400);
        }

        return () => timers.forEach(clearTimeout);
    }, [show, passed]);

    // Save test session to backend
    useEffect(() => {
        if (!show || backendSaved || decisions.length === 0) return;

        const saveSession = async () => {
            try {
                const payload = {
                    mode,
                    totalQuestions: total,
                    solved,
                    totalXP,
                    bonusUsed: bonusCount,
                    avgTime,
                    badge: badge.title,
                    passed,
                    decisions: decisions.map((d) => ({
                        questionId: d.questionId,
                        isCorrect: d.isCorrect,
                        timeTaken: d.timeTaken,
                        bonusTimeUsed: d.bonusTimeUsed,
                        validationAttempts: d.validationAttempts,
                        finalOutcome: d.finalOutcome,
                        difficulty: d.difficulty,
                    })),
                    analytics: analysis.testAnalytics,
                    timestamp: new Date().toISOString(),
                };

                const res = await fetch('/api/test-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    setBackendSaved(true);
                    console.log('[TestSummary] Session saved to backend');
                }
            } catch (err) {
                console.warn('[TestSummary] Backend save failed:', err);
            }
        };

        saveSession();
    }, [show, backendSaved, decisions, mode, total, solved, totalXP, bonusCount, avgTime, badge, passed, analysis]);

    const handleViewResults = useCallback(() => {
        playPowerUp();
        // Navigate to the result page with query params
        const params = new URLSearchParams({
            mode,
            score: String(totalXP),
            total: String(total),
            solved: String(solved),
            badge: badge.title,
        });
        router.push(`/result?${params.toString()}`);
    }, [router, mode, totalXP, total, solved, badge]);

    if (!show) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="test-summary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 20 }}
                    className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 shadow-2xl overflow-hidden"
                >
                    {/* Top accent */}
                    <div className={`h-1.5 ${passed ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500' : 'bg-gradient-to-r from-red-600 via-amber-500 to-red-600'}`} />

                    {/* Particle/scan lines effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div
                            className="absolute inset-0 bg-[linear-gradient(transparent_49%,rgba(255,255,255,0.02)_50%,transparent_51%)] bg-[length:100%_4px]"
                            animate={{ y: [0, -20, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        />
                    </div>

                    <div className="relative p-6 space-y-5">

                        {/* ── Header ─────────────────────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: -15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-3xl mb-2 inline-block"
                            >
                                {passed ? '🏆' : '📋'}
                            </motion.div>
                            <h2 className="text-xl font-bold text-white tracking-wide">
                                Test Complete!
                            </h2>
                            <p className="text-xs text-zinc-400 mt-2">
                                {mode === 'debug' ? 'Circuit Debug' : 'Crisis Mode'} — 5-Question Assessment
                            </p>
                        </motion.div>

                        {/* ── Stats Grid ──────────────────────────── */}
                        <AnimatePresence>
                            {phase >= 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-3 gap-2"
                                >
                                    {/* Questions Solved */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-700/30 text-center"
                                    >
                                        <p className="text-2xl font-bold text-emerald-400">
                                            <AnimatedNumber target={solved} /><span className="text-xs text-emerald-600">/{total}</span>
                                        </p>
                                        <p className="text-[10px] text-emerald-500/60 uppercase tracking-wider mt-1">Solved</p>
                                    </motion.div>

                                    {/* Bonus Used */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="p-4 rounded-xl bg-amber-900/20 border border-amber-700/30 text-center"
                                    >
                                        <p className="text-2xl font-bold text-amber-400">
                                            <AnimatedNumber target={bonusCount} />
                                        </p>
                                        <p className="text-[10px] text-amber-500/60 uppercase tracking-wider mt-1">Bonus Used</p>
                                    </motion.div>

                                    {/* Avg Speed */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="p-4 rounded-xl bg-cyan-900/20 border border-cyan-700/30 text-center"
                                    >
                                        <p className="text-2xl font-bold text-cyan-400">
                                            <AnimatedNumber target={avgTime} suffix="s" />
                                        </p>
                                        <p className="text-[10px] text-cyan-500/60 uppercase tracking-wider mt-1">Avg Time</p>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Performance Badge ──────────────────── */}
                        <AnimatePresence>
                            {phase >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                    className={`mx-auto w-fit px-5 py-3 rounded-2xl ${badge.bgColor} border ${badge.borderColor} text-center`}
                                >
                                    <motion.div
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="text-4xl mb-2"
                                    >
                                        {badge.icon}
                                    </motion.div>
                                    <p className={`text-sm font-bold ${badge.color} tracking-wider`}>
                                        {badge.title}
                                    </p>
                                    <motion.div
                                        className={`mt-1 h-[1px] ${badge.borderColor} mx-auto`}
                                        initial={{ width: 0 }}
                                        animate={{ width: '100%' }}
                                        transition={{ delay: 0.3, duration: 0.6 }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Animated XP Bar ────────────────────── */}
                        <AnimatePresence>
                            {phase >= 3 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-1.5"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Total XP Earned</span>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-base font-bold text-amber-300"
                                        >
                                            <AnimatedNumber target={totalXP} duration={1.2} /> XP
                                        </motion.span>
                                    </div>

                                    {/* XP Bar */}
                                    <div className="h-3 rounded-full bg-zinc-800 border border-zinc-700/50 overflow-hidden relative">
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={{ width: `${Math.min((totalXP / 500) * 100, 100)}%` }}
                                            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 relative"
                                        >
                                            {/* Shimmer effect */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 1.5, delay: 1, repeat: Infinity, repeatDelay: 2 }}
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Level markers */}
                                    <div className="flex justify-between text-[8px] text-zinc-600">
                                        <span>0</span>
                                        <span>Novice (100)</span>
                                        <span>Pro (250)</span>
                                        <span>Expert (400)</span>
                                        <span>500</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Insights (top 3) ───────────────────── */}
                        <AnimatePresence>
                            {phase >= 3 && analysis.insights.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30 space-y-1"
                                >
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Key Insights</p>
                                    {analysis.insights.slice(0, 3).map((insight, i) => (
                                        <motion.p
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + i * 0.15 }}
                                            className="text-[10px] text-zinc-300"
                                        >
                                            {insight}
                                        </motion.p>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ── Action Buttons ──────────────────────── */}
                        <AnimatePresence>
                            {phase >= 4 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 justify-center pt-1"
                                >
                                    <button
                                        onClick={handleViewResults}
                                        className="px-6 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                                    >
                                        📊 View Full Results
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 active:scale-95 transition-all cursor-pointer"
                                    >
                                        🏠 Home
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Backend save indicator */}
                        {backendSaved && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center text-[5px] text-emerald-600/50"
                            >
                                ✓ Session saved
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
