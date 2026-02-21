/**
 * Crisis Store — manages state for the Sequence Builder mode.
 *
 * Gamification:
 *   - 3 validation attempts per scenario
 *   - Timer countdown
 *   - XP tracking
 *   - Stability tracking
 */
import { create } from 'zustand';
import { CrisisSequenceScenario, CrisisValidationResult, ACTION_POOL, TroubleshootAction } from '@/types/crisis';
import { crisisSequenceScenarios } from '@/data/crisis-sequence-scenarios';
import { validateCrisisSequence } from '@/utils/crisisValidator';

const MAX_ATTEMPTS = 3;

export interface CrisisDecision {
    questionId: string;
    isCorrect: boolean;
    partialCredit: boolean;
    timeTaken: number;
    reasoningDelta: number;
    efficiencyDelta: number;
    stabilityDelta: number;
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

export type CrisisGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export function getCrisisGrade(score: number): CrisisGrade {
    if (score >= 95) return 'S';
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 30) return 'D';
    return 'F';
}

interface CrisisStore {
    scenarios: CrisisSequenceScenario[];
    selectedIndex: number;
    activeScenario: CrisisSequenceScenario;

    /** Available actions for current scenario */
    availableActions: TroubleshootAction[];
    /** User's sequence slots (null = empty) */
    sequenceSlots: (string | null)[];

    validationResult: CrisisValidationResult | null;
    attemptsLeft: number;
    scenarioFailed: boolean;
    scenarioCompleted: boolean;
    timerSeconds: number;
    timerRunning: boolean;
    totalXP: number;
    stability: number;
    grade: CrisisGrade | null;
    showCelebration: boolean;
    showXPPopup: boolean;
    xpPopupAmount: number;

    // Analytics
    decisions: CrisisDecision[];
    totalTimeUsed: number;
    totalCorrect: number;
    totalWrong: number;

    // Actions
    selectScenario: (index: number) => void;
    placeAction: (actionId: string, slotIndex: number) => void;
    removeFromSlot: (slotIndex: number) => void;
    returnToPool: (actionId: string) => void;
    validateSequence: () => CrisisValidationResult;
    resetScenario: () => void;
    tickTimer: () => void;
    startTimer: () => void;
    dismissCelebration: () => void;
    dismissXPPopup: () => void;
}

function getActionsForScenario(scenario: CrisisSequenceScenario): TroubleshootAction[] {
    return scenario.availableActionIds
        .map((id) => ACTION_POOL.find((a) => a.id === id))
        .filter(Boolean) as TroubleshootAction[];
}

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

const shuffledCrisis = shuffleArray(crisisSequenceScenarios).slice(0, TEST_SIZE);
const initialIndex = 0;
const initial = shuffledCrisis[initialIndex];

export const useCrisisStore = create<CrisisStore>((set, get) => ({
    scenarios: shuffledCrisis,
    selectedIndex: initialIndex,
    activeScenario: initial,
    availableActions: getActionsForScenario(initial),
    sequenceSlots: Array(initial.sequenceLength).fill(null),
    validationResult: null,
    attemptsLeft: MAX_ATTEMPTS,
    scenarioFailed: false,
    scenarioCompleted: false,
    timerSeconds: initial.timerSeconds,
    timerRunning: false,
    totalXP: 0,
    stability: 100,
    grade: null,
    showCelebration: false,
    showXPPopup: false,
    xpPopupAmount: 0,
    decisions: [] as CrisisDecision[],
    totalTimeUsed: 0,
    totalCorrect: 0,
    totalWrong: 0,

    selectScenario: (index) => {
        const scenarios = get().scenarios;
        if (index < 0 || index >= scenarios.length) return;
        const sc = scenarios[index];
        set({
            selectedIndex: index,
            activeScenario: sc,
            availableActions: getActionsForScenario(sc),
            sequenceSlots: Array(sc.sequenceLength).fill(null),
            validationResult: null,
            attemptsLeft: MAX_ATTEMPTS,
            scenarioFailed: false,
            scenarioCompleted: false,
            timerSeconds: sc.timerSeconds,
            timerRunning: false,
            grade: null,
            showCelebration: false,
        });
    },

    placeAction: (actionId, slotIndex) => {
        const { sequenceSlots, scenarioFailed, scenarioCompleted } = get();
        if (scenarioFailed || scenarioCompleted) return;
        const newSlots = [...sequenceSlots];
        // Remove from old slot if already placed
        const existingIdx = newSlots.indexOf(actionId);
        if (existingIdx >= 0) newSlots[existingIdx] = null;
        // If slot occupied, swap back
        const displaced = newSlots[slotIndex];
        newSlots[slotIndex] = actionId;
        set({
            sequenceSlots: newSlots,
            validationResult: null,
            timerRunning: true,
        });
    },

    removeFromSlot: (slotIndex) => {
        const { sequenceSlots, scenarioFailed, scenarioCompleted } = get();
        if (scenarioFailed || scenarioCompleted) return;
        const newSlots = [...sequenceSlots];
        newSlots[slotIndex] = null;
        set({ sequenceSlots: newSlots, validationResult: null });
    },

    returnToPool: (actionId) => {
        const { sequenceSlots } = get();
        const newSlots = sequenceSlots.map((s) => (s === actionId ? null : s));
        set({ sequenceSlots: newSlots, validationResult: null });
    },

    validateSequence: () => {
        const { sequenceSlots, activeScenario, attemptsLeft, timerSeconds, scenarioFailed, scenarioCompleted, decisions } = get();
        if (scenarioFailed || scenarioCompleted) return get().validationResult!;

        const startTime = activeScenario.timerSeconds;
        const elapsed = startTime - timerSeconds;

        const userSeq = sequenceSlots.map((s) => s ?? '');
        const result = validateCrisisSequence(userSeq, activeScenario, timerSeconds);
        const newAttempts = attemptsLeft - 1;
        const newStability = Math.max(0, get().stability + result.stabilityDelta);

        const decision: CrisisDecision = {
            questionId: `crisis-${get().selectedIndex}-attempt-${MAX_ATTEMPTS - newAttempts}`,
            isCorrect: result.success,
            partialCredit: !result.success && result.orderScore >= 40,
            timeTaken: elapsed,
            reasoningDelta: result.reasoningScore,
            efficiencyDelta: result.orderScore,
            stabilityDelta: result.stabilityDelta,
            bonusTimeUsed: false,
            cursorActivityAverage: 0,
            validationAttempts: MAX_ATTEMPTS - newAttempts,
            finalOutcome: result.success ? 'solved' : (newAttempts <= 0 ? 'failed' : 'failed'),
            difficulty: activeScenario.difficulty,
        };

        const newDecisions = [...decisions, decision];

        if (result.success) {
            const grade = getCrisisGrade(result.totalScore);
            console.log('[Crisis Analytics] Match complete:', { decisions: newDecisions, totalTimeUsed: elapsed, totalCorrect: get().totalCorrect + 1, totalWrong: get().totalWrong });
            set({
                validationResult: result,
                scenarioCompleted: true,
                timerRunning: false,
                totalXP: get().totalXP + result.xpEarned,
                stability: newStability,
                grade,
                showCelebration: true,
                showXPPopup: true,
                xpPopupAmount: result.xpEarned,
                attemptsLeft: newAttempts,
                decisions: newDecisions,
                totalTimeUsed: elapsed,
                totalCorrect: get().totalCorrect + 1,
            });
        } else if (newAttempts <= 0) {
            console.log('[Crisis Analytics] Match failed:', { decisions: newDecisions, totalTimeUsed: elapsed, totalCorrect: get().totalCorrect, totalWrong: get().totalWrong + 1 });
            set({
                validationResult: result,
                attemptsLeft: 0,
                scenarioFailed: true,
                timerRunning: false,
                stability: newStability,
                grade: 'F',
                decisions: newDecisions,
                totalTimeUsed: elapsed,
                totalWrong: get().totalWrong + 1,
            });
        } else {
            set({
                validationResult: result,
                attemptsLeft: newAttempts,
                stability: newStability,
                decisions: newDecisions,
                totalWrong: get().totalWrong + 1,
            });
        }

        return result;
    },

    resetScenario: () => {
        const { activeScenario, scenarios, selectedIndex, totalXP } = get();
        set({
            availableActions: getActionsForScenario(activeScenario),
            sequenceSlots: Array(activeScenario.sequenceLength).fill(null),
            validationResult: null,
            attemptsLeft: MAX_ATTEMPTS,
            scenarioFailed: false,
            scenarioCompleted: false,
            timerSeconds: activeScenario.timerSeconds,
            timerRunning: false,
            grade: null,
            showCelebration: false,
            stability: 100,
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
                    success: false, orderScore: 0, reasoningScore: 0, timeBonus: 0,
                    totalScore: 0, stabilityDelta: -20, xpEarned: 0,
                    feedback: '⏰ Time\'s up! The crisis escalated.',
                    slotResults: [], correctSequence: get().activeScenario.optimalSequence,
                },
            });
        } else {
            set({ timerSeconds: timerSeconds - 1 });
        }
    },

    startTimer: () => set({ timerRunning: true }),
    dismissCelebration: () => set({ showCelebration: false }),
    dismissXPPopup: () => set({ showXPPopup: false }),
}));
