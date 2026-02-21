/**
 * testGenerator — Generates a randomized 5-question test from the scenario pool.
 *
 * Uses Fisher-Yates shuffle for unbiased randomization.
 * Each test is a unique subset of the available questions.
 */

import type { Scene } from '@/types/game';
import { debugScenarios } from '@/data/debug-scenarios';
import { crisisScenarios } from '@/data/crisis-scenarios';

const TEST_SIZE = 5;

/** Fisher-Yates in-place shuffle (returns new array) */
function fisherYatesShuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export interface GeneratedTest {
    /** The 5 selected scenarios */
    scenarios: Scene[];
    /** Total number of questions in this test */
    total: number;
    /** The full pool size this was drawn from */
    poolSize: number;
    /** Mode this test was generated for */
    mode: 'debug' | 'crisis';
}

/**
 * Generate a randomized test of 5 unique questions for the given mode.
 *
 * @param mode - 'debug' or 'crisis'
 * @returns A GeneratedTest with 5 shuffled, unique scenarios
 */
export function generateTest(mode: 'debug' | 'crisis'): GeneratedTest {
    const pool = mode === 'debug' ? debugScenarios : crisisScenarios;
    const shuffled = fisherYatesShuffle(pool);
    const selected = shuffled.slice(0, Math.min(TEST_SIZE, shuffled.length));

    return {
        scenarios: selected,
        total: selected.length,
        poolSize: pool.length,
        mode,
    };
}
