// ─── Choice ───────────────────────────────────────────────────────────────────
export interface ChoiceEffects {
    reasoning?: number;
    efficiency?: number;
    powerAwareness?: number;
    stability?: number;
    score?: number;
}

export interface SceneChoice {
    text: string;
    effects: ChoiceEffects;
    nextScene: string; // "NEXT", "GAME_OVER", or "COMPLETE"
}

// ─── Scene ────────────────────────────────────────────────────────────────────
export interface Scene {
    id: string;
    background: string;
    character?: string;
    dialogue: string;
    timer: number;
    choices: SceneChoice[];
}

// ─── Game State ───────────────────────────────────────────────────────────────
export type GameStatus = 'idle' | 'playing' | 'gameover' | 'complete';
export type GameMode = 'debug' | 'crisis';

export interface GameState {
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
}
