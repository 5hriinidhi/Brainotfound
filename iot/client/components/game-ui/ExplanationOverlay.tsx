/**
 * ExplanationOverlay — Full-screen animated overlay triggered on failure.
 *
 * Shows step-by-step review of what went wrong and the correct approach.
 * Prevents skipping for the first 2 seconds to force reading.
 * Works for both Debug (circuit) and Crisis (sequence) modes.
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playFail, playWarning } from '@/utils/soundEngine';

// ── Types ────────────────────────────────────────────────────────────────────

interface DebugExplanation {
    mode: 'debug';
    title: string;
    errors: string[];
    feedback: string;
    requiredConnections: { from: string; to: string }[];
    resistorRange: [number, number];
    requiredPower: { minVoltage: number; minCurrent: number };
    hint: string;
    timedOut?: boolean;
}

interface CrisisExplanation {
    mode: 'crisis';
    title: string;
    feedback: string;
    userSequence: (string | null)[];
    correctSequence: string[];
    slotResults: ('correct' | 'partial' | 'wrong')[];
    explanation: string;
    hint: string;
    timedOut?: boolean;
}

export type ExplanationData = DebugExplanation | CrisisExplanation;

interface ExplanationOverlayProps {
    data: ExplanationData | null;
    onRetry: () => void;
    onContinue: () => void;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StepReveal({ children, index }: { children: React.ReactNode; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + index * 0.35, duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
}

function CorrectBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-900/50 border border-emerald-600/40 text-[7px] text-emerald-300">
            ✅ {label}
        </span>
    );
}

function WrongBadge({ label }: { label: string }) {
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/50 border border-red-600/40 text-[7px] text-red-300">
            ❌ {label}
        </span>
    );
}

// ── Debug Mode Explanation ───────────────────────────────────────────────────

function DebugReview({ data }: { data: DebugExplanation }) {
    return (
        <div className="space-y-3">
            {/* What went wrong */}
            <StepReveal index={0}>
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                    <p className="text-[8px] font-semibold text-red-400 mb-1.5">🔍 What Went Wrong</p>
                    <ul className="space-y-1">
                        {data.errors.map((err, i) => (
                            <li key={i} className="text-[7px] text-red-300/80 flex items-start gap-1.5">
                                <span className="text-red-500 mt-0.5 shrink-0">•</span>
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            </StepReveal>

            {/* Correct connection path */}
            <StepReveal index={1}>
                <div className="p-3 rounded-lg bg-emerald-900/15 border border-emerald-700/30">
                    <p className="text-[8px] font-semibold text-emerald-400 mb-1.5">🔗 Correct Connection Path</p>
                    <div className="flex flex-wrap gap-1.5">
                        {data.requiredConnections.map((conn, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.2 + i * 0.2 }}
                                className="flex items-center gap-1"
                            >
                                <CorrectBadge label={conn.from} />
                                <motion.span
                                    className="text-emerald-500 text-[8px]"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >→</motion.span>
                                <CorrectBadge label={conn.to} />
                                {i < data.requiredConnections.length - 1 && (
                                    <span className="text-zinc-600 text-[7px] ml-1">then</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </StepReveal>

            {/* Correct resistor value */}
            <StepReveal index={2}>
                <div className="p-3 rounded-lg bg-cyan-900/15 border border-cyan-700/30">
                    <p className="text-[8px] font-semibold text-cyan-400 mb-1.5">⏛ Required Resistor Value</p>
                    <div className="flex items-center gap-2">
                        <motion.div
                            className="px-3 py-1.5 rounded-lg bg-cyan-800/30 border border-cyan-600/40"
                            animate={{ boxShadow: ['0 0 0px rgba(34,211,238,0)', '0 0 12px rgba(34,211,238,0.3)', '0 0 0px rgba(34,211,238,0)'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <span className="text-[9px] font-mono font-bold text-cyan-300">
                                {data.resistorRange[0]}Ω – {data.resistorRange[1]}Ω
                            </span>
                        </motion.div>
                    </div>
                </div>
            </StepReveal>

            {/* Power requirements */}
            <StepReveal index={3}>
                <div className="p-3 rounded-lg bg-amber-900/15 border border-amber-700/30">
                    <p className="text-[8px] font-semibold text-amber-400 mb-1.5">🔋 Required Power Configuration</p>
                    <div className="flex gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-amber-800/20 border border-amber-600/30">
                            <p className="text-[6px] text-amber-400/60 uppercase tracking-wider">Min Voltage</p>
                            <p className="text-[9px] font-mono font-bold text-amber-300">{data.requiredPower.minVoltage}V</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-amber-800/20 border border-amber-600/30">
                            <p className="text-[6px] text-amber-400/60 uppercase tracking-wider">Min Current</p>
                            <p className="text-[9px] font-mono font-bold text-amber-300">{data.requiredPower.minCurrent}mA</p>
                        </div>
                    </div>
                </div>
            </StepReveal>
        </div>
    );
}

// ── Crisis Mode Explanation ──────────────────────────────────────────────────

function CrisisReview({ data }: { data: CrisisExplanation }) {
    return (
        <div className="space-y-3">
            {/* What went wrong */}
            <StepReveal index={0}>
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                    <p className="text-[8px] font-semibold text-red-400 mb-1.5">🔍 What Went Wrong</p>
                    <p className="text-[7px] text-red-300/80">{data.feedback}</p>
                </div>
            </StepReveal>

            {/* User sequence vs correct */}
            <StepReveal index={1}>
                <div className="p-3 rounded-lg bg-violet-900/15 border border-violet-700/30">
                    <p className="text-[8px] font-semibold text-violet-400 mb-2">📋 Your Sequence vs Correct Order</p>
                    <div className="space-y-1.5">
                        {data.correctSequence.map((correctId, i) => {
                            const userAction = data.userSequence[i];
                            const result = data.slotResults[i];
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -15 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.2 + i * 0.25 }}
                                    className="flex items-center gap-2 text-[7px]"
                                >
                                    <span className="text-zinc-500 font-mono w-4 shrink-0">#{i + 1}</span>
                                    {userAction ? (
                                        <WrongBadge label={userAction} />
                                    ) : (
                                        <span className="text-zinc-600 italic text-[6px]">(empty)</span>
                                    )}
                                    <motion.span
                                        className="text-zinc-500"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >→</motion.span>
                                    <motion.div
                                        animate={{
                                            boxShadow: result === 'correct'
                                                ? 'none'
                                                : ['0 0 0px rgba(34,197,94,0)', '0 0 10px rgba(34,197,94,0.4)', '0 0 0px rgba(34,197,94,0)']
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="rounded"
                                    >
                                        <CorrectBadge label={correctId} />
                                    </motion.div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </StepReveal>

            {/* Correct diagnostic flow */}
            <StepReveal index={2}>
                <div className="p-3 rounded-lg bg-emerald-900/15 border border-emerald-700/30">
                    <p className="text-[8px] font-semibold text-emerald-400 mb-1.5">🧠 Correct Diagnostic Reasoning</p>
                    <p className="text-[7px] text-emerald-300/80 leading-relaxed">{data.explanation}</p>
                </div>
            </StepReveal>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main ExplanationOverlay
// ═══════════════════════════════════════════════════════════════════════════

export default function ExplanationOverlay({ data, onRetry, onContinue }: ExplanationOverlayProps) {
    const [canDismiss, setCanDismiss] = useState(false);

    // Prevent skipping for first 2 seconds
    useEffect(() => {
        if (data) {
            setCanDismiss(false);
            // Sound effects
            playFail();
            setTimeout(() => playWarning(), 600);
            const t = setTimeout(() => setCanDismiss(true), 2000);
            return () => clearTimeout(t);
        }
    }, [data]);

    if (!data) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="explanation-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Content card */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
                    className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-red-700/30 bg-gradient-to-b from-zinc-900 via-zinc-900/98 to-zinc-950 shadow-2xl"
                >
                    {/* Top red accent bar */}
                    <div className="h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 rounded-t-2xl" />

                    <div className="p-5 sm:p-6 space-y-4">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="inline-block text-2xl mb-2"
                            >
                                {data.timedOut ? '⏰' : '🚨'}
                            </motion.div>
                            <h2 className="text-[11px] sm:text-[13px] font-bold text-red-400 tracking-wide">
                                Mission Failed — Engineering Review
                            </h2>
                            <p className="text-[8px] text-zinc-400 mt-1">{data.title}</p>
                            {data.timedOut && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-[7px] text-amber-400/70 mt-1"
                                >
                                    ⏰ Time ran out — review the correct approach below
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />

                        {/* Mode-specific review */}
                        {data.mode === 'debug' ? (
                            <DebugReview data={data} />
                        ) : (
                            <CrisisReview data={data} />
                        )}

                        {/* Hint */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.5 }}
                            className="p-3 rounded-lg bg-violet-900/10 border border-violet-700/20"
                        >
                            <p className="text-[7px] text-violet-400">
                                💡 <span className="font-semibold">Pro Tip:</span>{' '}
                                <span className="text-violet-300/70">{data.hint}</span>
                            </p>
                        </motion.div>

                        {/* Action buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: canDismiss ? 1 : 0.3, y: 0 }}
                            transition={{ delay: 1.8 }}
                            className="flex gap-3 justify-center pt-2"
                        >
                            <button
                                onClick={canDismiss ? onRetry : undefined}
                                disabled={!canDismiss}
                                className={`px-5 py-2.5 rounded-xl text-[8px] font-semibold transition-all ${canDismiss
                                        ? 'bg-violet-600 hover:bg-violet-500 text-white active:scale-95 cursor-pointer'
                                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    }`}
                            >
                                🔁 Retry Scenario
                            </button>
                            <button
                                onClick={canDismiss ? onContinue : undefined}
                                disabled={!canDismiss}
                                className={`px-5 py-2.5 rounded-xl text-[8px] font-semibold transition-all ${canDismiss
                                        ? 'bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 active:scale-95 cursor-pointer'
                                        : 'bg-zinc-800 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                    }`}
                            >
                                ➡️ Continue
                            </button>
                        </motion.div>

                        {/* Skip lock notice */}
                        <AnimatePresence>
                            {!canDismiss && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center text-[6px] text-zinc-600"
                                >
                                    Review the explanation... buttons unlock in 2 seconds
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
