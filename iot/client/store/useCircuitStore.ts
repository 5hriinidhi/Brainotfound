/**
 * Circuit Builder Store — manages placed components, connections,
 * scenario loading (with randomization), validation, gamification state.
 *
 * Gamification:
 *   - 3 validation attempts per scenario
 *   - Timer countdown (60/90/120s by difficulty)
 *   - XP tracking
 *   - Engineering grade
 *   - Scenario failed state
 */
import { create } from 'zustand';
import {
    PlacedComponent,
    Connection,
    CircuitState,
    ComponentType,
    SensorType,
    CircuitScenario,
    CircuitScenarioTemplate,
    ValidationResult,
} from '@/types/circuit';
import { circuitScenarioTemplates } from '@/data/circuit-scenarios';
import { randomizeScenario } from '@/utils/scenarioRandomizer';
import { validateCircuit, CircuitConfig } from '@/utils/circuitValidator';

// ── Helpers ──────────────────────────────────────────────────────────────────
let idCounter = 0;
const uid = () => `comp-${++idCounter}-${Date.now()}`;
const connUid = () => `conn-${++idCounter}-${Date.now()}`;

const LABELS: Record<ComponentType, string> = {
    esp32: 'ESP32', resistor: 'Resistor', led: 'LED',
    sensor: 'Sensor', power: 'Power 3.3V', gnd: 'GND',
};

const TIMER_BY_DIFFICULTY: Record<string, number> = {
    easy: 90, medium: 120, hard: 150,
};

export type EngineeringGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface CircuitDecision {
    questionId: string;
    isCorrect: boolean;
    partialCredit: boolean;
    timeTaken: number;
    reasoningDelta: number;
    efficiencyDelta: number;
    powerDelta: number;
    /** Whether the +10s inactivity bonus was used */
    bonusTimeUsed: boolean;
    /** Average cursor speed during this question (px/sec) */
    cursorActivityAverage: number;
    /** Number of validation attempts before final outcome */
    validationAttempts: number;
    /** Final result: 'solved', 'failed', or 'timeout' */
    finalOutcome: 'solved' | 'failed' | 'timeout';
    /** Difficulty level of the scenario */
    difficulty: 'easy' | 'medium' | 'hard';
}

export function getGrade(score: number): EngineeringGrade {
    if (score >= 95) return 'S';
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
}

// ── Store Interface ──────────────────────────────────────────────────────────
interface CircuitStore extends CircuitState {
    connectingFrom: string | null;

    scenarioTemplates: CircuitScenarioTemplate[];
    selectedTemplateIndex: number;
    activeScenario: CircuitScenario | null;
    validationResult: ValidationResult | null;

    // Gamification
    attemptsLeft: number;
    maxAttempts: number;
    scenarioFailed: boolean;
    scenarioCompleted: boolean;
    timerSeconds: number;
    timerRunning: boolean;
    xpEarned: number;
    totalXP: number;
    stabilityDrop: number;
    grade: EngineeringGrade | null;
    showCelebration: boolean;
    showXPPopup: boolean;
    xpPopupAmount: number;
    errorNodeIds: string[];  // IDs of components that flash red

    // Analytics
    decisions: CircuitDecision[];
    totalTimeUsed: number;
    totalCorrect: number;
    totalWrong: number;

    // Component actions
    addComponent: (type: ComponentType, gridX: number, gridY: number) => void;
    moveComponent: (id: string, gridX: number, gridY: number) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, updates: Partial<PlacedComponent>) => void;

    // Connection actions
    startConnection: (fromId: string) => void;
    completeConnection: (toId: string) => void;
    cancelConnection: () => void;
    removeConnection: (id: string) => void;

    // Scenario actions
    selectScenario: (index: number) => void;
    rerollScenario: () => void;
    validateCircuitAction: () => ValidationResult;
    resetCircuit: () => void;

    // Timer actions
    tickTimer: () => void;
    startTimer: () => void;
    stopTimer: () => void;

    // UI dismiss
    dismissCelebration: () => void;
    dismissXPPopup: () => void;
    clearErrorNodes: () => void;
}

const MAX_ATTEMPTS = 3;
const TEST_SIZE = 5;

/** Fisher-Yates shuffle */
function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const shuffledTemplates = shuffleArray(circuitScenarioTemplates).slice(0, TEST_SIZE);
const initialIndex = 0;
const initialScenario = randomizeScenario(shuffledTemplates[initialIndex]);

const baseState = {
    components: [] as PlacedComponent[],
    connections: [] as Connection[],
    powerSupply: { voltage: 3.3, current: 500 },
    connectingFrom: null as string | null,
    scenarioTemplates: shuffledTemplates,
    selectedTemplateIndex: initialIndex,
    activeScenario: initialScenario as CircuitScenario | null,
    validationResult: null as ValidationResult | null,
    attemptsLeft: MAX_ATTEMPTS,
    maxAttempts: MAX_ATTEMPTS,
    scenarioFailed: false,
    scenarioCompleted: false,
    timerSeconds: TIMER_BY_DIFFICULTY[initialScenario.difficulty] ?? 90,
    timerRunning: false,
    xpEarned: 0,
    totalXP: 0,
    stabilityDrop: 0,
    grade: null as EngineeringGrade | null,
    showCelebration: false,
    showXPPopup: false,
    xpPopupAmount: 0,
    errorNodeIds: [] as string[],
    decisions: [] as CircuitDecision[],
    totalTimeUsed: 0,
    totalCorrect: 0,
    totalWrong: 0,
};

export const useCircuitStore = create<CircuitStore>((set, get) => ({
    ...baseState,

    addComponent: (type, gridX, gridY) => {
        const { scenarioFailed, scenarioCompleted } = get();
        if (scenarioFailed || scenarioCompleted) return;
        const comp: PlacedComponent = {
            id: uid(), type, label: LABELS[type], gridX, gridY,
            ...(type === 'resistor' ? { resistorValue: 220 } : {}),
            ...(type === 'sensor' ? { sensorType: 'DHT11' as SensorType } : {}),
            ...(type === 'esp32' ? { gpioPin: 'GPIO2' } : {}),
        };
        set((s) => ({
            components: [...s.components, comp],
            validationResult: null,
            errorNodeIds: [],
            timerRunning: true,
        }));
    },

    moveComponent: (id, gridX, gridY) => {
        set((s) => ({
            components: s.components.map((c) => c.id === id ? { ...c, gridX, gridY } : c),
        }));
    },

    removeComponent: (id) => {
        set((s) => ({
            components: s.components.filter((c) => c.id !== id),
            connections: s.connections.filter((c) => c.fromId !== id && c.toId !== id),
            validationResult: null,
            errorNodeIds: s.errorNodeIds.filter((eid) => eid !== id),
        }));
    },

    updateComponent: (id, updates) => {
        set((s) => ({
            components: s.components.map((c) => c.id === id ? { ...c, ...updates } : c),
            validationResult: null,
            errorNodeIds: [],
        }));
    },

    startConnection: (fromId) => set({ connectingFrom: fromId }),

    completeConnection: (toId) => {
        const { connectingFrom, connections, scenarioFailed, scenarioCompleted } = get();
        if (scenarioFailed || scenarioCompleted) { set({ connectingFrom: null }); return; }
        if (!connectingFrom || connectingFrom === toId) {
            set({ connectingFrom: null });
            return;
        }
        const exists = connections.some(
            (c) => (c.fromId === connectingFrom && c.toId === toId) ||
                (c.fromId === toId && c.toId === connectingFrom),
        );
        if (!exists) {
            set((s) => ({
                connections: [...s.connections, {
                    id: connUid(), fromId: connectingFrom, toId, fromPin: 'OUT', toPin: 'IN',
                }],
                connectingFrom: null,
                validationResult: null,
                errorNodeIds: [],
                timerRunning: true,
            }));
        } else {
            set({ connectingFrom: null });
        }
    },

    cancelConnection: () => set({ connectingFrom: null }),

    removeConnection: (id) => {
        set((s) => ({
            connections: s.connections.filter((c) => c.id !== id),
            validationResult: null,
            errorNodeIds: [],
        }));
    },

    selectScenario: (index) => {
        const templates = get().scenarioTemplates;
        if (index < 0 || index >= templates.length) return;
        const resolved = randomizeScenario(templates[index]);
        set({
            selectedTemplateIndex: index,
            activeScenario: resolved,
            validationResult: null,
            components: [],
            connections: [],
            attemptsLeft: MAX_ATTEMPTS,
            scenarioFailed: false,
            scenarioCompleted: false,
            timerSeconds: TIMER_BY_DIFFICULTY[resolved.difficulty] ?? 90,
            timerRunning: false,
            xpEarned: 0,
            stabilityDrop: 0,
            grade: null,
            showCelebration: false,
            errorNodeIds: [],
        });
    },

    rerollScenario: () => {
        const { scenarioTemplates, selectedTemplateIndex } = get();
        const resolved = randomizeScenario(scenarioTemplates[selectedTemplateIndex]);
        set({
            activeScenario: resolved,
            validationResult: null,
            components: [],
            connections: [],
            attemptsLeft: MAX_ATTEMPTS,
            scenarioFailed: false,
            scenarioCompleted: false,
            timerSeconds: TIMER_BY_DIFFICULTY[resolved.difficulty] ?? 90,
            timerRunning: false,
            xpEarned: 0,
            stabilityDrop: 0,
            grade: null,
            showCelebration: false,
            errorNodeIds: [],
        });
    },

    validateCircuitAction: () => {
        const { components, connections, powerSupply, activeScenario, attemptsLeft, scenarioFailed, scenarioCompleted, timerSeconds, decisions } = get();
        const startTime = TIMER_BY_DIFFICULTY[activeScenario?.difficulty ?? 'easy'] ?? 90;
        const elapsed = startTime - timerSeconds;

        if (scenarioFailed || scenarioCompleted) {
            const r = get().validationResult!;
            return r;
        }

        if (!activeScenario) {
            const fallback: ValidationResult = {
                success: false, reasoningScore: 0, efficiencyScore: 0, powerScore: 0,
                feedback: '⚠ No scenario selected.', errors: ['No active scenario'],
            };
            set({ validationResult: fallback });
            return fallback;
        }

        const config: CircuitConfig = { components, connections, powerSupply };
        const result = validateCircuit(config, activeScenario);
        const newAttempts = attemptsLeft - 1;

        if (result.success) {
            // Calculate XP: base + time bonus + attempt bonus
            const avgScore = Math.round((result.reasoningScore + result.efficiencyScore + result.powerScore) / 3);
            const diffMultiplier = { easy: 1, medium: 1.5, hard: 2 }[activeScenario.difficulty] ?? 1;
            const timeBonus = Math.round(get().timerSeconds * 0.5);
            const attemptBonus = (attemptsLeft - 1) * 10; // bonus for fewer attempts used
            const xp = Math.round((avgScore + timeBonus + attemptBonus) * diffMultiplier);
            const grade = getGrade(avgScore);

            // Find floating (error) nodes
            const errorIds: string[] = [];

            const decision: CircuitDecision = {
                questionId: `circuit-${get().selectedTemplateIndex}-attempt-${MAX_ATTEMPTS - newAttempts}`,
                isCorrect: true,
                partialCredit: avgScore >= 50 && avgScore < 80,
                timeTaken: elapsed,
                reasoningDelta: result.reasoningScore,
                efficiencyDelta: result.efficiencyScore,
                powerDelta: result.powerScore,
                bonusTimeUsed: false,
                cursorActivityAverage: 0,
                validationAttempts: MAX_ATTEMPTS - newAttempts,
                finalOutcome: 'solved',
                difficulty: activeScenario.difficulty,
            };

            const newDecisions = [...decisions, decision];
            console.log('[Circuit Analytics] Match complete:', { decisions: newDecisions, totalTimeUsed: elapsed, totalCorrect: get().totalCorrect + 1, totalWrong: get().totalWrong });

            set({
                validationResult: result,
                scenarioCompleted: true,
                timerRunning: false,
                xpEarned: xp,
                totalXP: get().totalXP + xp,
                grade,
                showCelebration: true,
                showXPPopup: true,
                xpPopupAmount: xp,
                attemptsLeft: newAttempts,
                errorNodeIds: errorIds,
                decisions: newDecisions,
                totalTimeUsed: elapsed,
                totalCorrect: get().totalCorrect + 1,
            });
        } else {
            // Find unconnected component IDs for red flash
            const errorIds = components
                .filter((comp) => !connections.some((c) => c.fromId === comp.id || c.toId === comp.id))
                .map((c) => c.id);

            const stabDrop = Math.round(15 + Math.random() * 10);

            const decision: CircuitDecision = {
                questionId: `circuit-${get().selectedTemplateIndex}-attempt-${MAX_ATTEMPTS - newAttempts}`,
                isCorrect: false,
                partialCredit: result.reasoningScore >= 40,
                timeTaken: elapsed,
                reasoningDelta: result.reasoningScore,
                efficiencyDelta: result.efficiencyScore,
                powerDelta: result.powerScore,
                bonusTimeUsed: false,
                cursorActivityAverage: 0,
                validationAttempts: MAX_ATTEMPTS - newAttempts,
                finalOutcome: newAttempts <= 0 ? 'failed' : 'failed',
                difficulty: activeScenario.difficulty,
            };

            const newDecisions = [...decisions, decision];

            if (newAttempts <= 0) {
                console.log('[Circuit Analytics] Match failed:', { decisions: newDecisions, totalTimeUsed: elapsed, totalCorrect: get().totalCorrect, totalWrong: get().totalWrong + 1 });
                set({
                    validationResult: result,
                    attemptsLeft: 0,
                    scenarioFailed: true,
                    timerRunning: false,
                    stabilityDrop: get().stabilityDrop + stabDrop,
                    errorNodeIds: errorIds,
                    grade: 'F',
                    decisions: newDecisions,
                    totalTimeUsed: elapsed,
                    totalWrong: get().totalWrong + 1,
                });
            } else {
                set({
                    validationResult: result,
                    attemptsLeft: newAttempts,
                    stabilityDrop: get().stabilityDrop + stabDrop,
                    errorNodeIds: errorIds,
                    decisions: newDecisions,
                    totalWrong: get().totalWrong + 1,
                });
            }
        }

        return result;
    },

    resetCircuit: () => {
        const { activeScenario, scenarioTemplates, selectedTemplateIndex, totalXP } = get();
        set({
            ...baseState,
            scenarioTemplates,
            selectedTemplateIndex,
            activeScenario,
            totalXP,
            timerSeconds: TIMER_BY_DIFFICULTY[activeScenario?.difficulty ?? 'easy'] ?? 90,
        });
    },

    tickTimer: () => {
        const { timerRunning, timerSeconds, scenarioFailed, scenarioCompleted } = get();
        if (!timerRunning || scenarioFailed || scenarioCompleted) return;
        if (timerSeconds <= 1) {
            set({
                timerSeconds: 0,
                timerRunning: false,
                scenarioFailed: true,
                grade: 'F',
                validationResult: {
                    success: false, reasoningScore: 0, efficiencyScore: 0, powerScore: 0,
                    feedback: '⏰ Time\'s up! The scenario has failed.', errors: ['Timer expired'],
                },
            });
        } else {
            set({ timerSeconds: timerSeconds - 1 });
        }
    },

    startTimer: () => set({ timerRunning: true }),
    stopTimer: () => set({ timerRunning: false }),

    dismissCelebration: () => set({ showCelebration: false }),
    dismissXPPopup: () => set({ showXPPopup: false }),
    clearErrorNodes: () => set({ errorNodeIds: [] }),
}));
