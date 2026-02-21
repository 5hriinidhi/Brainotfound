/**
 * SequenceBuilder — Drag & Drop Diagnostic Sequence Builder for Crisis Mode.
 *
 * Layout mirrors Circuit Builder:
 *   Left: Scenario selector + Available actions (drag from here)
 *   Center: Diagnostic Sequence slots (drop here, 1-4)
 *   Right: Inspector + Validation results
 *
 * Gamification: timer, 3 attempts, XP, stability, grade, celebration.
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import GameContainer, { GRADE_COLORS } from '@/components/layout/GameContainer';
import { useCrisisStore, getCrisisGrade } from '@/store/useCrisisStore';
import { ACTION_POOL, TroubleshootAction } from '@/types/crisis';
import {
    playCorrect, playWrong, playCelebration, playTick,
    playPlace, playClick, playFail, playUrgentTick, playWarning,
} from '@/utils/soundEngine';
import { fireConfetti } from '@/utils/confetti';
import { useCursorActivity } from '@/hooks/useCursorActivity';
import AdaptiveWarning from '@/components/game-ui/AdaptiveWarning';
import ExplanationOverlay, { type ExplanationData } from '@/components/game-ui/ExplanationOverlay';
import TestSummary from '@/components/game-ui/TestSummary';

// ── Constants ────────────────────────────────────────────────────────────────
const DIFF_BG: Record<string, string> = { easy: 'bg-emerald-900/30 border-emerald-700/30', medium: 'bg-amber-900/30 border-amber-700/30', hard: 'bg-red-900/30 border-red-700/30' };
const SLOT_COLORS = ['border-cyan-500/60', 'border-violet-500/60', 'border-amber-500/60', 'border-emerald-500/60'];
const SLOT_BG = ['bg-cyan-900/10', 'bg-violet-900/10', 'bg-amber-900/10', 'bg-emerald-900/10'];

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-zinc-400">{label}</span>
                <span className={color}>{score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
            </div>
        </div>
    );
}

/** A draggable action card in the available pool */
function ActionCard({ action, disabled, onDragStart }: {
    action: TroubleshootAction; disabled: boolean;
    onDragStart: (actionId: string) => void;
}) {
    return (
        <motion.div
            layout
            draggable={!disabled}
            onDragStart={() => onDragStart(action.id)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: disabled ? 0.3 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all select-none
        ${disabled ? 'opacity-30 cursor-not-allowed border-white/5 bg-white/[0.02]' :
                    'cursor-grab active:cursor-grabbing hover:scale-[1.03] hover:border-violet-500/50 border-white/10 bg-white/5'}`}
        >
            <span className="text-2xl">{action.icon}</span>
            <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{action.label}</p>
                <p className="text-xs text-zinc-500 truncate">{action.description}</p>
            </div>
        </motion.div>
    );
}

/** A sequence slot — drop zone for an action */
function SequenceSlot({ index, actionId, result, locked, onDrop, onRemove }: {
    index: number;
    actionId: string | null;
    result?: 'correct' | 'partial' | 'wrong';
    locked: boolean;
    onDrop: (actionId: string, slotIndex: number) => void;
    onRemove: (slotIndex: number) => void;
}) {
    const action = actionId ? ACTION_POOL.find((a) => a.id === actionId) : null;

    const resultBorder = result === 'correct'
        ? 'border-emerald-400 bg-emerald-900/20 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
        : result === 'partial'
            ? 'border-amber-400 bg-amber-900/20 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
            : result === 'wrong'
                ? 'border-red-400 bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : '';

    const resultIcon = result === 'correct' ? '✓' : result === 'partial' ? '~' : result === 'wrong' ? '✕' : '';

    return (
        <motion.div
            layout
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain');
                if (id) onDrop(id, index);
            }}
            className={`flex items-center gap-6 px-6 py-5 rounded-2xl border-2 transition-all min-h-[5.5rem]
        ${result ? resultBorder : action ? `${SLOT_COLORS[index % 4]} ${SLOT_BG[index % 4]} border-solid` : 'border-dashed border-white/10 bg-white/[0.02] hover:border-violet-500/30'}`}
        >
            {/* Step number */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl font-black
        ${result === 'correct' ? 'bg-emerald-500 text-black' : result === 'partial' ? 'bg-amber-500 text-black' : result === 'wrong' ? 'bg-red-500 text-white' : 'bg-white/10 text-zinc-400'}`}>
                {result ? resultIcon : index + 1}
            </div>

            {action ? (
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl">{action.icon}</span>
                        <span className="text-xl text-white font-bold">{action.label}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 font-medium">{action.description}</p>
                </div>
            ) : (
                <p className="text-base text-zinc-500 font-bold tracking-wide italic">Drop step {index + 1} here</p>
            )}

            {action && !locked && (
                <button onClick={() => onRemove(index)}
                    className="text-lg text-red-500 hover:text-red-400 cursor-pointer shrink-0 p-2">✕</button>
            )}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main SequenceBuilder
// ═══════════════════════════════════════════════════════════════════════════

export default function SequenceBuilder() {
    const {
        scenarios, selectedIndex, activeScenario,
        availableActions, sequenceSlots,
        validationResult, attemptsLeft, scenarioFailed, scenarioCompleted,
        timerSeconds, timerRunning, totalXP, stability, grade,
        showCelebration, showXPPopup, xpPopupAmount,
        selectScenario, placeAction, removeFromSlot,
        validateSequence, resetScenario, tickTimer, dismissCelebration, dismissXPPopup,
    } = useCrisisStore();

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [bonusUsed, setBonusUsed] = useState(false);
    const [showAdaptiveWarning, setShowAdaptiveWarning] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showTestSummary, setShowTestSummary] = useState(false);
    const locked = scenarioFailed || scenarioCompleted;

    // Cursor activity tracking
    const { isStuck, resetStuck } = useCursorActivity(timerRunning && !locked);

    // Reset bonus + explanation on scenario change
    useEffect(() => {
        setBonusUsed(false);
        setShowAdaptiveWarning(false);
        setShowExplanation(false);
    }, [selectedIndex]);

    // Trigger explanation overlay on failure
    useEffect(() => {
        if (scenarioFailed && !scenarioCompleted) {
            const t = setTimeout(() => setShowExplanation(true), 600);
            return () => clearTimeout(t);
        }
    }, [scenarioFailed, scenarioCompleted]);

    // Build crisis explanation data
    const explanationData: ExplanationData | null = (showExplanation && activeScenario) ? {
        mode: 'crisis' as const,
        title: activeScenario.title,
        feedback: validationResult?.feedback ?? 'Time ran out before a valid sequence was submitted.',
        userSequence: sequenceSlots,
        correctSequence: validationResult?.correctSequence ?? activeScenario.optimalSequence,
        slotResults: validationResult?.slotResults ?? activeScenario.optimalSequence.map(() => 'wrong' as const),
        explanation: activeScenario.explanation,
        hint: activeScenario.hint,
        timedOut: timerSeconds <= 0,
    } : null;

    const handleExplanationRetry = useCallback(() => {
        setShowExplanation(false);
        resetScenario();
    }, [resetScenario]);

    const handleExplanationContinue = useCallback(() => {
        setShowExplanation(false);
        const nextIdx = selectedIndex + 1;
        if (nextIdx < scenarios.length) {
            selectScenario(nextIdx);
        } else {
            setShowTestSummary(true);
        }
    }, [selectedIndex, scenarios.length, selectScenario]);

    // Celebration dismiss: advance or show test summary
    const handleCelebrationDismiss = useCallback(() => {
        dismissCelebration();
        const nextIdx = selectedIndex + 1;
        if (nextIdx < scenarios.length) {
            setTimeout(() => selectScenario(nextIdx), 300);
        } else {
            setTimeout(() => setShowTestSummary(true), 300);
        }
    }, [dismissCelebration, selectedIndex, scenarios.length, selectScenario]);

    // Adaptive timer — +10s when stuck, once per question
    useEffect(() => {
        if (isStuck && !bonusUsed && timerRunning && !locked) {
            const newTime = Math.min(timerSeconds + 10, 120);
            useCrisisStore.setState({ timerSeconds: newTime });
            setBonusUsed(true);
            setShowAdaptiveWarning(true);
            playWarning();
            resetStuck();
        }
    }, [isStuck, bonusUsed, timerRunning, timerSeconds, locked, resetStuck]);

    // Which action IDs are already placed in slots
    const placedIds = new Set(sequenceSlots.filter(Boolean) as string[]);

    // Timer tick
    useEffect(() => {
        if (!timerRunning) return;
        const iv = setInterval(() => {
            tickTimer();
            if (timerSeconds <= 10 && timerSeconds > 0) playUrgentTick();
            else if (timerSeconds <= 30 && timerSeconds > 10 && timerSeconds % 5 === 0) playTick();
        }, 1000);
        return () => clearInterval(iv);
    }, [timerRunning, timerSeconds, tickTimer]);

    // Sound + confetti effects
    useEffect(() => {
        if (validationResult?.success) {
            playCorrect();
            setTimeout(() => playCelebration(), 400);
            setTimeout(() => fireConfetti(), 200);
        } else if (validationResult && !validationResult.success) {
            playWrong();
            if (attemptsLeft <= 0) setTimeout(() => playFail(), 300);
        }
    }, [validationResult, attemptsLeft]);

    // Stability warning sound
    useEffect(() => {
        if (stability <= 30 && stability > 0) playWarning();
    }, [stability]);

    // Auto-dismiss XP popup
    useEffect(() => {
        if (showXPPopup) {
            const t = setTimeout(() => dismissXPPopup(), 3000);
            return () => clearTimeout(t);
        }
    }, [showXPPopup, dismissXPPopup]);

    const handleValidate = useCallback(() => {
        validateSequence();
    }, [validateSequence]);

    const handleDragStartAction = useCallback((actionId: string) => {
        setDraggingId(actionId);
    }, []);

    const handleDrop = useCallback((actionId: string, slotIndex: number) => {
        placeAction(actionId, slotIndex);
        setDraggingId(null);
    }, [placeAction]);

    const filledCount = sequenceSlots.filter(Boolean).length;

    const failedExtra = validationResult ? (
        <div className="mt-4 text-left max-w-sm mx-auto">
            <p className="text-xs text-zinc-500 mb-2">Correct sequence:</p>
            {validationResult.correctSequence.map((id, i) => {
                const a = ACTION_POOL.find((x) => x.id === id);
                return a ? (
                    <p key={i} className="text-xs text-emerald-400 my-1">{i + 1}. {a.icon} {a.label}</p>
                ) : null;
            })}
        </div>
    ) : undefined;

    const topBarExtra = (
        <span className="text-xs text-zinc-400">{activeScenario.character}</span>
    );

    return (
        <>
            <AdaptiveWarning show={showAdaptiveWarning} onDismiss={() => setShowAdaptiveWarning(false)} />
            <ExplanationOverlay data={explanationData} onRetry={handleExplanationRetry} onContinue={handleExplanationContinue} />
            <TestSummary
                show={showTestSummary}
                decisions={useCrisisStore.getState().decisions}
                totalXP={totalXP}
                mode="crisis"
                onClose={() => setShowTestSummary(false)}
            />
            <GameContainer
                modeLabel="Crisis Mode" modeIcon="🚨" modeColor="text-red-400"
                difficulty={activeScenario.difficulty}
                scenarioIndex={selectedIndex}
                totalScenarios={scenarios.length}
                totalXP={totalXP} timerSeconds={timerSeconds}
                attemptsLeft={attemptsLeft} maxAttempts={3}
                topBarExtra={topBarExtra}
                stability={stability}
                showXPPopup={showXPPopup} xpPopupAmount={xpPopupAmount} xpPopupLabel="Crisis Resolved"
                showCelebration={showCelebration} grade={grade}
                celebrationTitle="Crisis Resolved!" celebrationXP={xpPopupAmount}
                celebrationSubtitle={`Grade: ${grade}`}
                onDismissCelebration={handleCelebrationDismiss}
                scenarioFailed={scenarioFailed}
                failedTitle="Crisis Escalated"
                failedReason={attemptsLeft <= 0 ? 'All attempts exhausted' : 'Time expired'}
                failedExtra={failedExtra}
                onRetry={resetScenario}
                backgroundUrl="/backgrounds/EDGY.gif"
            >

                {/* ═══ MAIN LAYOUT ══════════════════════════════════════════════ */}
                <div className="flex flex-1 min-h-0">

                    {/* ─── LEFT: Scenario + Available Actions ─────────────────── */}
                    <aside className="w-64 sm:w-72 border-r border-white/10 bg-black/20 p-5 space-y-6 overflow-y-auto shrink-0">
                        <div className="space-y-4 pb-4 border-b border-white/10">
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Scenario</p>
                            <select value={selectedIndex}
                                onChange={(e) => selectScenario(Number(e.target.value))}
                                className="w-full text-xs px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
                                {scenarios.map((s, i) => (
                                    <option key={s.id} value={i}>{i + 1}. {s.title}</option>
                                ))}
                            </select>

                            <div className={`p-3 rounded-lg border ${DIFF_BG[activeScenario.difficulty]} space-y-2`}>
                                <p className="text-[10px] text-zinc-300 leading-relaxed">{activeScenario.description}</p>
                                <p className="text-[9px] text-zinc-500 mt-1 italic">💡 {activeScenario.hint}</p>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-500 uppercase tracking-wider">Available Actions</p>
                        <p className="text-[8px] text-zinc-600">Drag actions to the sequence slots →</p>

                        <div className="space-y-1.5">
                            {availableActions.map((action) => (
                                <div key={action.id}
                                    draggable={!locked && !placedIds.has(action.id)}
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', action.id);
                                        handleDragStartAction(action.id);
                                    }}>
                                    <ActionCard
                                        action={action}
                                        disabled={locked || placedIds.has(action.id)}
                                        onDragStart={handleDragStartAction}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
                            <button onClick={handleValidate} disabled={locked || filledCount < activeScenario.sequenceLength}
                                className={`w-full text-xs px-4 py-3 rounded-lg text-white font-bold transition-all active:scale-95 cursor-pointer
                ${locked || filledCount < activeScenario.sequenceLength ? 'bg-zinc-700 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                ⚡ Validate Sequence ({attemptsLeft}/3)
                            </button>
                            <button onClick={resetScenario}
                                className="w-full text-xs px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 transition-all active:scale-95 cursor-pointer">
                                🗑 Reset
                            </button>
                        </div>
                    </aside>

                    {/* ─── CENTER: Sequence Slots ─────────────────────────────── */}
                    <main className="flex-1 overflow-auto flex flex-col items-center justify-center p-12 gap-6 bg-black/10">
                        <p className="text-xl text-zinc-400 uppercase tracking-[0.2em] font-black mb-6">
                            Diagnostic Sequence — Arrange {activeScenario.sequenceLength} Steps
                        </p>

                        <div className="w-full max-w-4xl space-y-4">
                            {sequenceSlots.map((actionId, i) => (
                                <SequenceSlot
                                    key={i}
                                    index={i}
                                    actionId={actionId}
                                    result={validationResult?.slotResults[i]}
                                    locked={locked}
                                    onDrop={handleDrop}
                                    onRemove={removeFromSlot}
                                />
                            ))}
                        </div>

                        {/* Arrow flow indicator */}
                        {filledCount > 0 && filledCount < activeScenario.sequenceLength && (
                            <p className="text-xs text-zinc-600 mt-3 font-medium">
                                {filledCount}/{activeScenario.sequenceLength} steps placed
                            </p>
                        )}
                    </main>

                    {/* ─── RIGHT: Results ─────────────────────────────────────── */}
                    <aside className="w-64 sm:w-72 border-l border-white/10 bg-black/20 p-5 overflow-y-auto shrink-0 space-y-6">
                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-3">Results</p>

                        <AnimatePresence>
                            {validationResult ? (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`p-4 rounded-lg border space-y-4 ${validationResult.success ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'
                                        }`}>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-base font-bold ${validationResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {validationResult.success ? '✓ Correct Sequence!' : '✕ Wrong Order'}
                                        </p>
                                        {grade && (
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${GRADE_COLORS[grade]} flex items-center justify-center`}>
                                                <span className="text-xs font-black text-white">{grade}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <ScoreBar label="📋 Order" score={validationResult.orderScore} color="text-cyan-400" />
                                        <ScoreBar label="🧠 Reasoning" score={validationResult.reasoningScore} color="text-amber-400" />
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-400">⏱ Time Bonus</span>
                                            <span className="text-violet-400">+{validationResult.timeBonus}</span>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-white/10">
                                        <span className="text-xs text-zinc-400">Total: </span>
                                        <span className={`text-base font-bold ${validationResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {validationResult.totalScore}/100
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">{validationResult.feedback}</p>

                                    {/* Slot-by-slot results */}
                                    <div className="space-y-2 pt-3 border-t border-white/10">
                                        <p className="text-[8px] text-zinc-500 mb-2">Step Results:</p>
                                        {validationResult.slotResults.map((r, i) => {
                                            const userActionId = sequenceSlots[i];
                                            const correctActionId = validationResult.correctSequence[i];
                                            const userAction = userActionId ? ACTION_POOL.find((a) => a.id === userActionId) : null;
                                            const correctAction = ACTION_POOL.find((a) => a.id === correctActionId);
                                            return (
                                                <div key={i} className="flex items-center gap-2 text-[8px]">
                                                    <span className={`w-5 text-center font-bold ${r === 'correct' ? 'text-emerald-400' : r === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
                                                        {r === 'correct' ? '✓' : r === 'partial' ? '~' : '✕'}
                                                    </span>
                                                    <span className="text-zinc-300 font-medium">
                                                        {userAction?.label ?? 'Empty'} {r !== 'correct' && correctAction ? `→ ${correctAction.label}` : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Stability impact */}
                                    <div className={`text-[10px] pt-3 border-t border-white/10 font-bold ${validationResult.stabilityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        Stability: {validationResult.stabilityDelta >= 0 ? '+' : ''}{validationResult.stabilityDelta}%
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center py-10 space-y-2">
                                    <p className="text-xs text-zinc-600">Arrange the steps and validate.</p>
                                    <p className="text-[10px] text-zinc-700 mt-1">Correct order = highest score.</p>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Explanation (shown after completion) */}
                        {scenarioCompleted && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="mt-4 p-4 rounded-lg bg-cyan-900/20 border border-cyan-700/30">
                                <p className="text-sm text-cyan-400 font-bold mb-2">💡 Why This Order?</p>
                                <p className="text-[10px] text-zinc-300 leading-relaxed">{activeScenario.explanation}</p>
                            </motion.div>
                        )}
                    </aside>
                </div>
            </GameContainer>
        </>
    );
}
