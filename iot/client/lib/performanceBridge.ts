/**
 * Performance Bridge — sends game results to the Skill Forge auth server.
 * Used by IoT game result pages to report live performance.
 * Auth token is read from localStorage (shared with the main landing page).
 */

const AUTH_API = 'http://localhost:4000/api';

interface GameResultData {
    gameType: string;       // e.g. 'iot-circuit', 'iot-crisis', 'iot-arena'
    score: number;          // 0-100 percentage
    skillArea?: string;     // override skill mapping
    weakTopics?: string[];  // areas needing improvement
    xpEarned?: number;      // explicit XP amount
    metrics?: Record<string, number>; // additional game metrics
}

interface GameResultResponse {
    message: string;
    xpAwarded: number;
    leveledUp: boolean;
    skill: { name: string; level: number; xp: number } | null;
    assessment: { testName: string; score: number; date: string; weakTopics: string[] };
}

export async function sendGameResults(data: GameResultData): Promise<GameResultResponse | null> {
    try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sf_token') : null;
        if (!token) return null; // User not logged in to auth system

        const res = await fetch(`${AUTH_API}/skills/game-results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            const result: GameResultResponse = await res.json();
            console.log(`🎯 SkillForge: ${result.message}`);
            return result;
        }
    } catch (err) {
        // Silent fail — don't break the game experience
        console.warn('SkillForge: Could not report game results', (err as Error).message);
    }
    return null;
}
