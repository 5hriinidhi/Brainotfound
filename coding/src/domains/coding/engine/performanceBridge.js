/**
 * Performance Bridge — sends game results to the Skill Forge auth server.
 * This file is imported by ResultScreen and StoryMode to report live performance.
 * Auth token is read from localStorage (shared with the main landing page).
 */

const AUTH_API = 'http://localhost:4000/api';

/**
 * Send game results to the auth server.
 * Fails silently — game continues working even if auth server is down.
 *
 * @param {Object} data
 * @param {string} data.gameType - e.g. 'coding-duel-development', 'coding-story'
 * @param {number} data.score - 0-100 percentage
 * @param {string} [data.skillArea] - override skill mapping
 * @param {string[]} [data.weakTopics] - areas needing improvement
 * @param {number} [data.xpEarned] - explicit XP amount
 * @param {Object} [data.metrics] - additional game metrics
 */
export async function sendGameResults(data) {
    try {
        const token = localStorage.getItem('sf_token');
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
            const result = await res.json();
            console.log(`🎯 SkillForge: ${result.message}`);
            return result;
        }
    } catch (err) {
        // Silent fail — don't break the game experience
        console.warn('SkillForge: Could not report game results', err.message);
    }
    return null;
}
