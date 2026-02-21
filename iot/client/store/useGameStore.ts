/**
 * Game Store — centralized state for the IoT Diagnostic Arena.
 *
 * Handles: random 5-question test generation, stat tracking (reasoning,
 * efficiency, power, stability), timer management with negative-guard,
 * sequential scenario advancement, and game status transitions
 * (idle → playing → complete/gameover).
 */
import { create } from 'zustand';
import { GameStatus, GameMode, ChoiceEffects } from '@/types/game';
import { generateTest } from '@/utils/testGenerator';
import { Scene } from '@/types/game';

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (val: number, min = 0, max = 100) =>
    Math.min(max, Math.max(min, val));

// ── Store Interface ──────────────────────────────────────────────────────────
interface GameStore {
    // State
    currentSceneId: string;
    reasoning: number;
    efficiency: number;
    powerAwareness: number;
    stability: number;
    timer: number;
    score: number;
    gameStatus: GameStatus;
    gameMode: GameMode | null;
    scenarioIndex: number;
    totalScenarios: number;
    scenarios: Scene[];
    isProcessing: boolean; // prevents double-click

    // Actions
    startGame: (mode: GameMode) => void;
    applyChoice: (effects: ChoiceEffects, nextScene: string) => void;
    tickTimer: () => void;
    resetGame: () => void;
    setTimer: (t: number) => void;
}

const baseState = {
    currentSceneId: '',
    reasoning: 50,
    efficiency: 50,
    powerAwareness: 50,
    stability: 100,
    timer: 20,
    score: 0,
    gameStatus: 'idle' as GameStatus,
    gameMode: null as GameMode | null,
    scenarioIndex: 0,
    totalScenarios: 0,
    scenarios: [] as Scene[],
    isProcessing: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
    ...baseState,

    /** Initialize a new game with 5 random questions for the given mode */
    startGame: (mode: GameMode) => {
        const test = generateTest(mode);
        const first = test.scenarios[0];
        set({
            ...baseState,
            gameMode: mode,
            gameStatus: 'playing',
            scenarios: test.scenarios,
            totalScenarios: test.total,
            scenarioIndex: 0,
            currentSceneId: first.id,
            timer: first.timer,
            isProcessing: false,
        });
    },


    /** Apply choice effects, advance to next scenario, and transition game status */
    applyChoice: (effects) => {
        const state = get();

        // Prevent double-click
        if (state.isProcessing || state.gameStatus !== 'playing') return;
        set({ isProcessing: true });

        const newStability = clamp(state.stability + (effects.stability ?? 0));

        // Advance to next scenario in the shuffled pool
        const nextIdx = state.scenarioIndex + 1;
        const isLastScenario = nextIdx >= state.scenarios.length;

        const newStatus: GameStatus =
            newStability <= 0
                ? 'gameover'
                : isLastScenario
                    ? 'complete'
                    : 'playing';

        const nextScene = !isLastScenario ? state.scenarios[nextIdx] : null;

        set({
            reasoning: clamp(state.reasoning + (effects.reasoning ?? 0)),
            efficiency: clamp(state.efficiency + (effects.efficiency ?? 0)),
            powerAwareness: clamp(state.powerAwareness + (effects.powerAwareness ?? 0)),
            stability: newStability,
            score: state.score + (effects.score ?? 0),
            scenarioIndex: nextIdx,
            currentSceneId: nextScene?.id ?? state.currentSceneId,
            timer: nextScene?.timer ?? 20,
            gameStatus: newStatus,
            isProcessing: false, // re-enable after state update
        });
    },

    /** Decrement timer. Auto-picks worst choice on timeout. Guards against negative values. */
    tickTimer: () => {
        const { timer, gameStatus, scenarios, scenarioIndex, isProcessing } = get();
        if (gameStatus !== 'playing' || isProcessing) return;

        if (timer <= 1) {
            // Time ran out → auto-pick the WORST choice (last one)
            const scene = scenarios[scenarioIndex];
            if (scene?.choices?.length) {
                const worst = scene.choices[scene.choices.length - 1];
                get().applyChoice(worst.effects, worst.nextScene);
            } else {
                set({ gameStatus: 'gameover' });
            }
        } else {
            // Guard: never go below 0
            set({ timer: Math.max(0, timer - 1) });
        }
    },

    setTimer: (t) => set({ timer: Math.max(0, t) }),

    resetGame: () => set({ ...baseState }),
}));
