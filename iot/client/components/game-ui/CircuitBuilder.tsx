/**
 * CircuitBuilder — Gamified Drag & Drop Circuit Builder.
 *
 * Features:
 *   - Animated glowing current flow on valid circuit (SVG)
 *   - Flashing red nodes for errors
 *   - Sound effects (Web Audio synthesis)
 *   - XP popup animation
 *   - Stability drop animation
 *   - Dynamic power meter
 *   - Engineering Grade badge (S/A/B/C/D/F)
 *   - 3 validation attempts
 *   - Timer countdown
 *   - Completion celebration overlay
 */
'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    DndContext, DragEndEvent, DragStartEvent, DragOverlay,
    useSensor, useSensors, PointerSensor, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import GameContainer, { GRADE_COLORS } from '@/components/layout/GameContainer';
import { useCircuitStore, getGrade } from '@/store/useCircuitStore';
import {
    PALETTE_ITEMS, RESISTOR_VALUES, GPIO_PINS,
    ComponentType, PlacedComponent,
} from '@/types/circuit';
import { formatResistor } from '@/utils/scenarioRandomizer';
import {
    playCorrect, playWrong, playCelebration, playTick,
    playPlace, playConnect, playDisconnect, playDragStart, playDrop,
    playClick, playFail, playUrgentTick, playElectricHum, playToggle,
    playWarning,
} from '@/utils/soundEngine';
import { fireConfetti } from '@/utils/confetti';
import { useCursorActivity } from '@/hooks/useCursorActivity';
import AdaptiveWarning from '@/components/game-ui/AdaptiveWarning';
import ExplanationOverlay, { type ExplanationData } from '@/components/game-ui/ExplanationOverlay';
import TestSummary from '@/components/game-ui/TestSummary';

// ── Constants ────────────────────────────────────────────────────────────────
const GRID_COLS = 8;
const GRID_ROWS = 6;
const CELL_SIZE = 100;

const ICONS: Record<ComponentType, string> = {
    esp32: '🔲', resistor: '⏛', led: '💡', sensor: '📡', power: '🔋', gnd: '⏚',
};
const COLORS: Record<ComponentType, string> = {
    esp32: 'border-cyan-500/60 bg-cyan-900/30',
    resistor: 'border-amber-500/60 bg-amber-900/30',
    led: 'border-yellow-500/60 bg-yellow-900/30',
    sensor: 'border-violet-500/60 bg-violet-900/30',
    power: 'border-emerald-500/60 bg-emerald-900/30',
    gnd: 'border-zinc-500/60 bg-zinc-800/30',
};
const DIFF_BG: Record<string, string> = { easy: 'bg-emerald-900/30 border-emerald-700/30', medium: 'bg-amber-900/30 border-amber-700/30', hard: 'bg-red-900/30 border-red-700/30' };

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function PaletteItem({ type, label, icon, description, disabled }: {
    type: ComponentType; label: string; icon: string; description: string; disabled: boolean;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${type}`, data: { type, fromPalette: true }, disabled,
    });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all select-none
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        ${isDragging ? 'opacity-40 scale-95' : disabled ? '' : 'hover:scale-[1.03] hover:border-violet-500/50'}
        border-white/10 bg-white/5`}>
            <span className="text-2xl">{icon}</span>
            <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{label}</p>
                <p className="text-xs text-zinc-500 truncate">{description}</p>
            </div>
        </div>
    );
}

function GridCell({ x, y, children }: { x: number; y: number; children?: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: `cell-${x}-${y}`, data: { x, y } });
    return (
        <div ref={setNodeRef}
            className={`relative border border-white/[0.04] transition-colors duration-150
        ${isOver ? 'bg-violet-500/20 border-violet-500/40' : 'hover:bg-white/[0.02]'}`}
            style={{ width: CELL_SIZE, height: CELL_SIZE }}>
            {children}
        </div>
    );
}

function CanvasComponent({ comp, isConnecting, isSelected, isError, isGlowing, onConnect, onSelect }: {
    comp: PlacedComponent; isConnecting: boolean; isSelected: boolean;
    isError: boolean; isGlowing: boolean;
    onConnect: (id: string) => void; onSelect: (id: string) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: comp.id, data: { type: comp.type, fromPalette: false, compId: comp.id },
    });
    return (
        <motion.div ref={setNodeRef} {...listeners} {...attributes}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                scale: 1,
                opacity: isDragging ? 0.4 : 1,
                boxShadow: isGlowing
                    ? ['0 0 8px rgba(52,211,153,0.6)', '0 0 20px rgba(52,211,153,0.9)', '0 0 8px rgba(52,211,153,0.6)']
                    : isError
                        ? ['0 0 8px rgba(239,68,68,0.8)', '0 0 20px rgba(239,68,68,1)', '0 0 8px rgba(239,68,68,0.8)']
                        : '0 0 0px transparent',
            }}
            transition={isGlowing || isError ? { boxShadow: { repeat: Infinity, duration: 1 } } : { duration: 0.3 }}
            className={`absolute inset-1 rounded-lg border-2 flex flex-col items-center justify-center
        cursor-grab active:cursor-grabbing select-none transition-colors ${COLORS[comp.type]}
        ${isSelected ? 'ring-2 ring-violet-400 ring-offset-1 ring-offset-black' : ''}
        ${isConnecting ? 'cursor-crosshair' : ''}
        ${isError ? 'border-red-500 bg-red-900/40' : ''}
        ${isGlowing ? 'border-emerald-400 bg-emerald-900/30' : ''}`}
            onClick={(e) => { e.stopPropagation(); isConnecting ? onConnect(comp.id) : onSelect(comp.id); }}>
            <span className="text-xl">{ICONS[comp.type]}</span>
            <span className="text-[10px] text-white/80 mt-1">{comp.label}</span>
            {comp.type === 'resistor' && <span className="text-[8px] text-amber-400">{comp.resistorValue}Ω</span>}
            {comp.type === 'sensor' && <span className="text-[8px] text-violet-400">{comp.sensorType}</span>}
            {comp.type === 'esp32' && <span className="text-[8px] text-cyan-400">{comp.gpioPin}</span>}
        </motion.div>
    );
}

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

/** Timer display with color change as time runs low */
function TimerDisplay({ seconds, running }: { seconds: number; running: boolean }) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const urgent = seconds <= 15;
    const warning = seconds <= 30;
    return (
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors ${urgent ? 'bg-red-900/40 border-red-700/50' : warning ? 'bg-amber-900/30 border-amber-700/30' : 'bg-black/30 border-white/10'
            }`}>
            <span className={`text-xs font-mono tabular-nums ${urgent ? 'text-red-400 animate-pulse' : warning ? 'text-amber-400' : 'text-zinc-300'}`}>
                ⏱ {mins}:{secs.toString().padStart(2, '0')}
            </span>
            {!running && seconds > 0 && <span className="text-[8px] text-zinc-500">PAUSED</span>}
        </div>
    );
}

/** Power meter with animated fill */
function PowerMeter({ usedPower, totalPower }: { usedPower: number; totalPower: number }) {
    const pct = Math.min(100, (usedPower / totalPower) * 100);
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase">Power</span>
            <div className="w-24 h-3 rounded-full bg-white/10 overflow-hidden shadow-inner">
                <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
                    className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </div>
            <span className="text-xs font-black text-zinc-300 tabular-nums">{usedPower}/{totalPower}mA</span>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main CircuitBuilder
// ═══════════════════════════════════════════════════════════════════════════

export default function CircuitBuilder() {
    const store = useCircuitStore();
    const {
        components, connections, connectingFrom, powerSupply,
        scenarioTemplates, selectedTemplateIndex, activeScenario, validationResult,
        attemptsLeft, maxAttempts, scenarioFailed, scenarioCompleted,
        timerSeconds, timerRunning, xpEarned, totalXP, stabilityDrop, grade,
        showCelebration, showXPPopup, xpPopupAmount, errorNodeIds,
        addComponent, moveComponent, removeComponent, updateComponent,
        startConnection, completeConnection, cancelConnection, removeConnection,
        selectScenario, rerollScenario, validateCircuitAction, resetCircuit,
        tickTimer, dismissCelebration, dismissXPPopup, clearErrorNodes,
    } = store;

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeDragType, setActiveDragType] = useState<ComponentType | null>(null);
    const [showStabDrop, setShowStabDrop] = useState(false);
    const [bonusUsed, setBonusUsed] = useState(false);
    const [showAdaptiveWarning, setShowAdaptiveWarning] = useState(false);
    const [showTestSummary, setShowTestSummary] = useState(false);
    const prevStabRef = useRef(stabilityDrop);

    // Cursor activity tracking — only when timer is running
    const { isStuck, resetStuck } = useCursorActivity(timerRunning && !scenarioFailed && !scenarioCompleted);

    // Reset bonus on scenario change
    useEffect(() => {
        setBonusUsed(false);
        setShowAdaptiveWarning(false);
    }, [selectedTemplateIndex]);

    // Adaptive timer — +10s when stuck, once per question
    useEffect(() => {
        if (isStuck && !bonusUsed && timerRunning && !scenarioFailed && !scenarioCompleted) {
            const newTime = Math.min(timerSeconds + 10, 120);
            useCircuitStore.setState({ timerSeconds: newTime });
            setBonusUsed(true);
            setShowAdaptiveWarning(true);
            playWarning();
            resetStuck();
        }
    }, [isStuck, bonusUsed, timerRunning, timerSeconds, scenarioFailed, scenarioCompleted, resetStuck]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    const selectedComp = selectedId ? components.find((c) => c.id === selectedId) : null;
    const getComp = (id: string) => components.find((c) => c.id === id);
    const locked = scenarioFailed || scenarioCompleted;

    // ── Explanation overlay state ────────────────────────────────────
    const [showExplanation, setShowExplanation] = useState(false);

    // Trigger explanation overlay when scenario fails
    useEffect(() => {
        if (scenarioFailed && !scenarioCompleted) {
            const t = setTimeout(() => setShowExplanation(true), 600);
            return () => clearTimeout(t);
        }
    }, [scenarioFailed, scenarioCompleted]);

    // Reset explanation on scenario change
    useEffect(() => {
        setShowExplanation(false);
    }, [selectedTemplateIndex]);

    // Build explanation data
    const explanationData: ExplanationData | null = (showExplanation && activeScenario) ? {
        mode: 'debug' as const,
        title: activeScenario.title,
        errors: validationResult?.errors ?? ['Timer expired — no attempt submitted'],
        feedback: validationResult?.feedback ?? 'Time ran out before a valid circuit was built.',
        requiredConnections: activeScenario.requiredConnections.map(c => ({ from: c.from, to: c.to })),
        resistorRange: activeScenario.resistorRange,
        requiredPower: activeScenario.requiredPower,
        hint: activeScenario.hint,
        timedOut: timerSeconds <= 0,
    } : null;

    const handleExplanationRetry = useCallback(() => {
        setShowExplanation(false);
        resetCircuit();
    }, [resetCircuit]);

    const handleExplanationContinue = useCallback(() => {
        setShowExplanation(false);
        const nextIdx = selectedTemplateIndex + 1;
        if (nextIdx < scenarioTemplates.length) {
            selectScenario(nextIdx);
        } else {
            // Last scenario — show test summary
            setShowTestSummary(true);
        }
    }, [selectedTemplateIndex, scenarioTemplates.length, selectScenario]);

    // Celebration dismiss: advance or show test summary
    const handleCelebrationDismiss = useCallback(() => {
        dismissCelebration();
        const nextIdx = selectedTemplateIndex + 1;
        if (nextIdx < scenarioTemplates.length) {
            // Auto-advance to next scenario after celebration
            setTimeout(() => selectScenario(nextIdx), 300);
        } else {
            // Last scenario — show test summary
            setTimeout(() => setShowTestSummary(true), 300);
        }
    }, [dismissCelebration, selectedTemplateIndex, scenarioTemplates.length, selectScenario]);

    // Estimated power draw per component type
    const usedPower = useMemo(() => {
        let p = 0;
        components.forEach((c) => {
            if (c.type === 'esp32') p += 240;
            if (c.type === 'led') p += 20;
            if (c.type === 'sensor') p += 30;
        });
        return p;
    }, [components]);

    // ── Timer tick ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!timerRunning) return;
        const iv = setInterval(() => {
            tickTimer();
            if (timerSeconds <= 10 && timerSeconds > 0) playUrgentTick();
            else if (timerSeconds <= 30 && timerSeconds > 10 && timerSeconds % 5 === 0) playTick();
        }, 1000);
        return () => clearInterval(iv);
    }, [timerRunning, timerSeconds, tickTimer]);

    // ── Electric hum ambient on mount ──────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => playElectricHum(), 500);
        return () => clearTimeout(t);
    }, []);

    // ── Sound + confetti + stability drop animation on validation ─────
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

    useEffect(() => {
        if (stabilityDrop > prevStabRef.current) {
            setShowStabDrop(true);
            setTimeout(() => setShowStabDrop(false), 2000);
        }
        prevStabRef.current = stabilityDrop;
    }, [stabilityDrop]);

    // Auto-dismiss XP popup
    useEffect(() => {
        if (showXPPopup) {
            const t = setTimeout(() => dismissXPPopup(), 3000);
            return () => clearTimeout(t);
        }
    }, [showXPPopup, dismissXPPopup]);

    // Auto-clear error nodes
    useEffect(() => {
        if (errorNodeIds.length > 0) {
            const t = setTimeout(() => clearErrorNodes(), 3000);
            return () => clearTimeout(t);
        }
    }, [errorNodeIds, clearErrorNodes]);

    // ── Drag Handlers ──────────────────────────────────────────────────
    const handleDragStart = useCallback((e: DragStartEvent) => {
        setActiveDragType(e.active.data.current?.type as ComponentType);
        playDragStart();
    }, []);

    const handleDragEnd = useCallback((e: DragEndEvent) => {
        setActiveDragType(null);
        const { active, over } = e;
        if (!over) return;
        const overData = over.data.current;
        if (!overData || overData.x === undefined) return;
        const activeData = active.data.current;
        const { x, y } = overData as { x: number; y: number };
        if (components.some((c) => c.gridX === x && c.gridY === y)) return;
        if (activeData?.fromPalette) {
            addComponent(activeData.type as ComponentType, x, y);
            playPlace();
        } else if (activeData?.compId) {
            moveComponent(activeData.compId, x, y);
            playDrop();
        }
    }, [components, addComponent, moveComponent]);

    const handleComponentClick = useCallback((id: string) => {
        if (connectingFrom) {
            completeConnection(id);
            playConnect();
        } else {
            setSelectedId((prev) => (prev === id ? null : id));
            playClick();
        }
    }, [connectingFrom, completeConnection]);

    const handleValidate = useCallback(() => {
        validateCircuitAction();
        setSelectedId(null);
    }, [validateCircuitAction]);

    const avgScore = validationResult
        ? Math.round((validationResult.reasoningScore + validationResult.efficiencyScore + validationResult.powerScore) / 3)
        : 0;

    const topBarExtra = (
        <>
            <span className="text-sm font-bold text-zinc-400">{components.length} parts</span>
            <span className="text-zinc-600 font-bold">|</span>
            <span className="text-sm font-bold text-zinc-400">{connections.length} wires</span>
            <PowerMeter usedPower={usedPower} totalPower={powerSupply.current} />
            {activeScenario?.requiredSensorType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-900/30 border border-violet-700/30 text-violet-400">
                    📡 {activeScenario.requiredSensorType}
                </span>
            )}
            {connectingFrom && (
                <button onClick={cancelConnection}
                    className="text-xs px-4 py-1.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-400 cursor-pointer">
                    ✕ Cancel Wire
                </button>
            )}
        </>
    );

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <AdaptiveWarning show={showAdaptiveWarning} onDismiss={() => setShowAdaptiveWarning(false)} />
            <ExplanationOverlay data={explanationData} onRetry={handleExplanationRetry} onContinue={handleExplanationContinue} />
            <TestSummary
                show={showTestSummary}
                decisions={store.decisions}
                totalXP={totalXP}
                mode="debug"
                onClose={() => setShowTestSummary(false)}
            />
            <GameContainer
                modeLabel="Circuit Lab" modeIcon="🔧" modeColor="text-cyan-400"
                difficulty={activeScenario?.difficulty ?? 'easy'}
                scenarioIndex={selectedTemplateIndex}
                totalScenarios={scenarioTemplates.length}
                totalXP={totalXP} timerSeconds={timerSeconds}
                attemptsLeft={attemptsLeft} maxAttempts={maxAttempts}
                topBarExtra={topBarExtra}
                showXPPopup={showXPPopup} xpPopupAmount={xpPopupAmount} xpPopupLabel="Engineering Excellence"
                showCelebration={showCelebration} grade={grade}
                celebrationTitle="Circuit Complete!" celebrationXP={xpEarned}
                celebrationSubtitle={`Score: ${avgScore}/100`}
                onDismissCelebration={handleCelebrationDismiss}
                scenarioFailed={scenarioFailed}
                failedTitle="Scenario Failed"
                failedReason={attemptsLeft <= 0 ? 'All attempts exhausted' : 'Time expired'}
                onRetry={resetCircuit}
            >
                {/* ═══ STABILITY DROP POPUP (circuit-specific) ═══════════════════ */}
                <AnimatePresence>
                    {showStabDrop && (
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                        >
                            <div className="px-5 py-2 rounded-xl bg-red-900/80 border border-red-500/50 shadow-2xl">
                                <p className="text-sm font-bold text-red-400 text-center">⚠ Stability -{stabilityDrop}%</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MAIN LAYOUT ══════════════════════════════════════════════ */}
                <div className="flex flex-1 min-h-0">

                    {/* ─── LEFT: Scenario + Palette ───────────────────────────── */}
                    <aside className="w-64 sm:w-72 border-r border-white/10 bg-black/20 p-5 space-y-6 overflow-y-auto shrink-0">
                        <div className="space-y-4 pb-4 border-b border-white/10">
                            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Challenge</p>
                            <select value={selectedTemplateIndex}
                                onChange={(e) => selectScenario(Number(e.target.value))}
                                className="w-full text-xs px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer">
                                {scenarioTemplates.map((t, i) => (
                                    <option key={t.id} value={i}>{i + 1}. {t.title}</option>
                                ))}
                            </select>

                            {activeScenario && (
                                <div className={`p-3 rounded-lg border ${DIFF_BG[activeScenario.difficulty]} space-y-2`}>
                                    <p className="text-[10px] text-zinc-300 leading-relaxed">{activeScenario.description}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <span className="text-[9px] px-2 py-1 rounded bg-black/30 text-cyan-400">{activeScenario.requiredGPIO}</span>
                                        <span className="text-[9px] px-2 py-1 rounded bg-black/30 text-amber-400">
                                            {formatResistor(activeScenario.resistorRange[0])}–{formatResistor(activeScenario.resistorRange[1])}
                                        </span>
                                        {activeScenario.requiredSensorType && (
                                            <span className="text-[9px] px-2 py-1 rounded bg-black/30 text-violet-400">{activeScenario.requiredSensorType}</span>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-zinc-500 mt-1 italic">💡 {activeScenario.hint}</p>
                                </div>
                            )}

                            <button onClick={rerollScenario}
                                className="w-full text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 transition-all active:scale-95 cursor-pointer">
                                🎲 Re-Randomize
                            </button>
                        </div>

                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Components</p>
                        {PALETTE_ITEMS.map((item) => (
                            <PaletteItem key={item.type} {...item} disabled={locked} />
                        ))}

                        <div className="border-t border-white/10 pt-4 mt-2 space-y-3">
                            <button onClick={handleValidate} disabled={locked && !scenarioFailed}
                                className={`w-full text-xs px-4 py-3 rounded-lg text-white font-bold transition-all active:scale-95 cursor-pointer
                  ${locked ? 'bg-zinc-700 cursor-not-allowed opacity-50' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                ⚡ Validate ({attemptsLeft}/{maxAttempts})
                            </button>
                            <button onClick={() => { resetCircuit(); setSelectedId(null); }}
                                className="w-full text-xs px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/10 transition-all active:scale-95 cursor-pointer">
                                🗑 Reset
                            </button>
                        </div>
                    </aside>

                    {/* ─── CENTER: Grid Canvas ──────────────────────────────────── */}
                    <main className="flex-1 overflow-auto flex items-center justify-center p-4"
                        onClick={() => { if (connectingFrom) cancelConnection(); setSelectedId(null); }}>
                        <div className="relative rounded-xl border border-white/10 bg-black/40 overflow-hidden"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
                                gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
                            }}>
                            {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
                                const x = idx % GRID_COLS;
                                const y = Math.floor(idx / GRID_COLS);
                                const comp = components.find((c) => c.gridX === x && c.gridY === y);
                                return (
                                    <GridCell key={`${x}-${y}`} x={x} y={y}>
                                        {comp && (
                                            <CanvasComponent
                                                comp={comp}
                                                isConnecting={!!connectingFrom}
                                                isSelected={selectedId === comp.id}
                                                isError={errorNodeIds.includes(comp.id)}
                                                isGlowing={scenarioCompleted}
                                                onConnect={handleComponentClick}
                                                onSelect={handleComponentClick}
                                            />
                                        )}
                                    </GridCell>
                                );
                            })}

                            {/* SVG connection lines */}
                            <svg className="absolute inset-0 pointer-events-none"
                                width={GRID_COLS * CELL_SIZE} height={GRID_ROWS * CELL_SIZE}>
                                {/* Glow filter for valid circuit */}
                                <defs>
                                    <filter id="glow-green">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                    <filter id="glow-red">
                                        <feGaussianBlur stdDeviation="2" result="blur" />
                                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                                    </filter>
                                    <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#34d399" />
                                        <stop offset="50%" stopColor="#a3e635" />
                                        <stop offset="100%" stopColor="#34d399" />
                                    </linearGradient>
                                </defs>
                                {connections.map((conn) => {
                                    const from = getComp(conn.fromId);
                                    const to = getComp(conn.toId);
                                    if (!from || !to) return null;
                                    const fx = from.gridX * CELL_SIZE + CELL_SIZE / 2;
                                    const fy = from.gridY * CELL_SIZE + CELL_SIZE / 2;
                                    const tx = to.gridX * CELL_SIZE + CELL_SIZE / 2;
                                    const ty = to.gridY * CELL_SIZE + CELL_SIZE / 2;
                                    const isInError = errorNodeIds.includes(conn.fromId) || errorNodeIds.includes(conn.toId);
                                    const valid = scenarioCompleted;

                                    return (
                                        <g key={conn.id}>
                                            {/* Base wire */}
                                            <line x1={fx} y1={fy} x2={tx} y2={ty}
                                                stroke={isInError ? '#ef4444' : valid ? '#34d399' : 'rgba(168,139,250,0.5)'}
                                                strokeWidth={valid ? 3 : 2}
                                                strokeDasharray={valid ? '0' : '6 3'}
                                                filter={valid ? 'url(#glow-green)' : isInError ? 'url(#glow-red)' : undefined}
                                            />
                                            {/* Animated current dot for valid circuit */}
                                            {valid && (
                                                <circle r={4} fill="#a3e635" opacity={0.9} filter="url(#glow-green)">
                                                    <animateMotion
                                                        dur="1.5s"
                                                        repeatCount="indefinite"
                                                        path={`M${fx},${fy} L${tx},${ty}`}
                                                    />
                                                </circle>
                                            )}
                                            {/* Static midpoint dot */}
                                            {!valid && (
                                                <circle cx={(fx + tx) / 2} cy={(fy + ty) / 2} r={3}
                                                    fill={isInError ? '#ef4444' : '#a78bfa'} opacity={0.6} />
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </main>

                    {/* ─── RIGHT: Inspector + Validation ────────────────────────── */}
                    <aside className="w-64 sm:w-72 border-l border-white/10 bg-black/20 p-5 overflow-y-auto shrink-0 space-y-6">
                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Inspector</p>

                        {selectedComp ? (
                            <div className="space-y-3">
                                <div className={`p-4 rounded-lg border ${COLORS[selectedComp.type]}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xl">{ICONS[selectedComp.type]}</span>
                                        <span className="text-xs text-white">{selectedComp.label}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-500">Grid: {selectedComp.gridX}, {selectedComp.gridY}</p>
                                </div>
                                {selectedComp.type === 'resistor' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-400 block mb-1">Resistance</label>
                                        <select value={selectedComp.resistorValue} disabled={locked}
                                            onChange={(e) => updateComponent(selectedComp.id, { resistorValue: Number(e.target.value) })}
                                            className="w-full text-xs px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer disabled:opacity-50">
                                            {RESISTOR_VALUES.map((v) => (
                                                <option key={v} value={v}>{v >= 1000 ? `${v / 1000}kΩ` : `${v}Ω`}</option>
                                            ))}
                                        </select>
                                        {activeScenario && (
                                            <p className="text-[9px] text-zinc-500 mt-1">
                                                Required: {formatResistor(activeScenario.resistorRange[0])}–{formatResistor(activeScenario.resistorRange[1])}
                                            </p>
                                        )}
                                    </div>
                                )}
                                {selectedComp.type === 'sensor' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-400 block mb-1">Sensor Type</label>
                                        <select value={selectedComp.sensorType} disabled={locked}
                                            onChange={(e) => updateComponent(selectedComp.id, { sensorType: e.target.value as 'DHT11' | 'Ultrasonic' | 'LDR' })}
                                            className="w-full text-xs px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer disabled:opacity-50">
                                            <option value="DHT11">DHT11</option><option value="Ultrasonic">Ultrasonic</option><option value="LDR">LDR</option>
                                        </select>
                                        {activeScenario?.requiredSensorType && (
                                            <p className="text-[9px] text-zinc-500 mt-1">Required: {activeScenario.requiredSensorType}</p>
                                        )}
                                    </div>
                                )}
                                {selectedComp.type === 'esp32' && (
                                    <div className="space-y-2">
                                        <label className="text-xs text-zinc-400 block mb-1">GPIO Pin</label>
                                        <select value={selectedComp.gpioPin} disabled={locked}
                                            onChange={(e) => updateComponent(selectedComp.id, { gpioPin: e.target.value })}
                                            className="w-full text-xs px-2 py-2 rounded-lg bg-black/40 border border-white/10 text-white cursor-pointer disabled:opacity-50">
                                            {GPIO_PINS.map((pin) => (<option key={pin} value={pin}>{pin}</option>))}
                                        </select>
                                        {activeScenario && (
                                            <p className="text-[9px] text-zinc-500 mt-1">Required: {activeScenario.requiredGPIO}</p>
                                        )}
                                    </div>
                                )}
                                {!locked && (
                                    <div className="space-y-3 pt-3 border-t border-white/10">
                                        <button onClick={() => { startConnection(selectedComp.id); setSelectedId(null); }}
                                            className="w-full text-xs px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all active:scale-95 cursor-pointer">
                                            🔗 Wire From Here
                                        </button>
                                        <button onClick={() => { removeComponent(selectedComp.id); setSelectedId(null); }}
                                            className="w-full text-xs px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700/30 font-bold transition-all active:scale-95 cursor-pointer">
                                            🗑 Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : connectingFrom ? (
                            <div className="p-4 rounded-lg bg-violet-900/20 border border-violet-700/30">
                                <p className="text-xs text-violet-300 font-bold">🔗 Wiring Mode</p>
                                <p className="text-[10px] text-zinc-400 mt-1">Click a component to connect.</p>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-600 italic">Click a component to inspect.</p>
                        )}

                        {/* Connections */}
                        {connections.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-white/10">
                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Wires</p>
                                <div className="space-y-2">
                                    {connections.map((conn) => {
                                        const from = getComp(conn.fromId);
                                        const to = getComp(conn.toId);
                                        return (
                                            <div key={conn.id} className="flex items-center justify-between px-3 py-2 rounded bg-white/5 border border-white/5">
                                                <span className="text-[10px] text-zinc-300">
                                                    {from ? `${ICONS[from.type]} ${from.label}` : '?'} → {to ? `${ICONS[to.type]} ${to.label}` : '?'}
                                                </span>
                                                {!locked && (
                                                    <button onClick={() => removeConnection(conn.id)}
                                                        className="text-xs text-red-500 hover:text-red-400 cursor-pointer p-1">✕</button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Validation Result */}
                        <AnimatePresence>
                            {validationResult && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                    className={`mt-6 p-4 rounded-lg border space-y-4 ${validationResult.success ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-red-900/20 border-red-700/30'
                                        }`}>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-base font-bold ${validationResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {validationResult.success ? '✓ Valid!' : '✕ Issues'}
                                        </p>
                                        {grade && (
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${GRADE_COLORS[grade]} flex items-center justify-center`}>
                                                <span className="text-xs font-black text-white">{grade}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <ScoreBar label="🧠 Reasoning" score={validationResult.reasoningScore} color="text-cyan-400" />
                                        <ScoreBar label="⚡ Efficiency" score={validationResult.efficiencyScore} color="text-amber-400" />
                                        <ScoreBar label="🔋 Power" score={validationResult.powerScore} color="text-violet-400" />
                                    </div>
                                    <div className="text-center pt-3 border-t border-white/10">
                                        <span className="text-xs text-zinc-400">Overall: </span>
                                        <span className={`text-base font-bold ${validationResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                                            {avgScore}/100
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">{validationResult.feedback}</p>
                                    {validationResult.errors.length > 0 && (
                                        <ul className="space-y-1">
                                            {validationResult.errors.map((err, i) => (
                                                <li key={i} className="text-[9px] text-red-300/80">• {err}</li>
                                            ))}
                                        </ul>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </aside>
                </div>
                <DragOverlay>
                    {activeDragType && (
                        <div className={`w-16 h-16 rounded-lg border-2 flex flex-col items-center justify-center ${COLORS[activeDragType]} opacity-80 shadow-xl`}>
                            <span className="text-xl">{ICONS[activeDragType]}</span>
                            <span className="text-[6px] text-white/70 mt-0.5">{PALETTE_ITEMS.find((p) => p.type === activeDragType)?.label}</span>
                        </div>
                    )}
                </DragOverlay>
            </GameContainer>
        </DndContext>
    );
}
