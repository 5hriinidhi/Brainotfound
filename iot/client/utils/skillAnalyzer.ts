/**
 * skillAnalyzer — Derives skill ratings, accuracy breakdown, and
 * human-readable insights from per-question decision analytics.
 *
 * Works for both Debug (circuit) and Crisis modes.
 */

import type { CircuitDecision } from '@/store/useCircuitStore';
import type { CrisisDecision } from '@/store/useCrisisStore';

type Decision = CircuitDecision | CrisisDecision;
type Mode = 'debug' | 'crisis';

export interface SkillRatings {
    reasoning: number;
    efficiency: number;
    powerOrStability: number;
    timeManagement: number;
}

export interface AccuracyBreakdown {
    correct: number;
    partial: number;
    wrong: number;
}

// ── Test-Level Analytics (new) ───────────────────────────────────────────────

export interface TestLevelAnalytics {
    /** % of questions solved correctly on first attempt */
    accuracyRate: number;
    /** Average time per difficulty: { easy, medium, hard } in seconds */
    averageTimePerDifficulty: Record<'easy' | 'medium' | 'hard', number>;
    /** % of questions where the +10s bonus was used */
    bonusUsageFrequency: number;
    /** 0-100: higher = more hesitation detected (based on bonus usage + low cursor activity) */
    hesitationScore: number;
    /** 0-100: higher = better recovery from failures (partial credit after retries) */
    resilienceScore: number;
}

export interface PerformanceAnalysis {
    skillRatings: SkillRatings;
    accuracy: AccuracyBreakdown;
    insights: string[];
    /** Test-level summary analytics (available when enhanced fields are present) */
    testAnalytics?: TestLevelAnalytics;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, Math.round(val)));
}

function avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

function hasEnhancedFields(d: Decision): boolean {
    return 'bonusTimeUsed' in d && 'finalOutcome' in d && 'difficulty' in d;
}

// ── Test-Level Analytics Generator ───────────────────────────────────────────

export function generateTestAnalytics(decisions: Decision[]): TestLevelAnalytics | undefined {
    if (decisions.length === 0 || !decisions.every(hasEnhancedFields)) return undefined;

    const total = decisions.length;

    // Accuracy rate: % of questions solved (finalOutcome === 'solved')
    const solved = decisions.filter((d) => d.finalOutcome === 'solved').length;
    const accuracyRate = Math.round((solved / total) * 100);

    // Average time per difficulty
    const byDifficulty: Record<'easy' | 'medium' | 'hard', number[]> = { easy: [], medium: [], hard: [] };
    for (const d of decisions) {
        if (d.difficulty) byDifficulty[d.difficulty].push(d.timeTaken);
    }
    const averageTimePerDifficulty: Record<'easy' | 'medium' | 'hard', number> = {
        easy: Math.round(avg(byDifficulty.easy)),
        medium: Math.round(avg(byDifficulty.medium)),
        hard: Math.round(avg(byDifficulty.hard)),
    };

    // Bonus usage frequency: % of questions where bonus was used
    const bonusCount = decisions.filter((d) => d.bonusTimeUsed).length;
    const bonusUsageFrequency = Math.round((bonusCount / total) * 100);

    // Hesitation score: weighted combo of bonus usage + low cursor speed
    const avgCursorSpeed = avg(decisions.map((d) => d.cursorActivityAverage));
    const cursorPenalty = avgCursorSpeed < 10 ? 30 : avgCursorSpeed < 20 ? 15 : 0;
    const hesitationScore = clamp(bonusUsageFrequency * 0.6 + cursorPenalty + (total - solved) * 5);

    // Resilience score: ability to recover after failures
    // Higher if: partial credit earned, retries lead to eventual solve
    const retriedAndSolved = decisions.filter(
        (d) => d.validationAttempts > 1 && d.finalOutcome === 'solved'
    ).length;
    const partialCredits = decisions.filter((d) => d.partialCredit).length;
    const resilienceBase = total > 0 ? ((retriedAndSolved + partialCredits * 0.5) / total) * 100 : 0;
    const resilienceScore = clamp(resilienceBase + (solved > 0 ? 20 : 0));

    return {
        accuracyRate,
        averageTimePerDifficulty,
        bonusUsageFrequency,
        hesitationScore,
        resilienceScore,
    };
}

// ── Main Analyzer ────────────────────────────────────────────────────────────

export function analyzePerformance(decisions: Decision[], mode: Mode): PerformanceAnalysis {
    if (decisions.length === 0) {
        return {
            skillRatings: { reasoning: 0, efficiency: 0, powerOrStability: 0, timeManagement: 0 },
            accuracy: { correct: 0, partial: 0, wrong: 0 },
            insights: ['No decisions recorded yet.'],
        };
    }

    // ── Accuracy ─────────────────────────────────────────────────
    const correct = decisions.filter((d) => d.isCorrect).length;
    const partial = decisions.filter((d) => !d.isCorrect && d.partialCredit).length;
    const wrong = decisions.filter((d) => !d.isCorrect && !d.partialCredit).length;
    const total = decisions.length;
    const correctPct = (correct / total) * 100;

    // ── Reasoning (avg reasoningDelta scaled 0-100) ──────────────
    const reasoning = clamp(avg(decisions.map((d) => d.reasoningDelta)));

    // ── Efficiency (avg efficiencyDelta scaled 0-100) ────────────
    const efficiency = clamp(avg(decisions.map((d) => d.efficiencyDelta)));

    // ── Power / Stability ────────────────────────────────────────
    let powerOrStability: number;
    if (mode === 'debug') {
        const powerDeltas = decisions.map((d) => ('powerDelta' in d ? (d as CircuitDecision).powerDelta : 0));
        powerOrStability = clamp(avg(powerDeltas));
    } else {
        // Stability: higher is better. stabilityDelta is negative for wrong answers.
        // Map from [-100, 0] to [0, 100]: 100 + avgDelta
        const stabDeltas = decisions.map((d) => ('stabilityDelta' in d ? (d as CrisisDecision).stabilityDelta : 0));
        const avgStab = avg(stabDeltas);
        powerOrStability = clamp(100 + avgStab);
    }

    // ── Time Management ──────────────────────────────────────────
    // Estimate: if typical allowed time ~90-150s, score based on how
    // quickly correct decisions were made vs time taken.
    // Low timeTaken on correct = good time management.
    // High timeTaken on wrong = poor time management.
    const correctDecisions = decisions.filter((d) => d.isCorrect);
    const wrongDecisions = decisions.filter((d) => !d.isCorrect);

    // Default allowed time per mode
    const typicalAllowed = mode === 'debug' ? 120 : 90;

    let timeScore: number;
    if (correctDecisions.length > 0) {
        // % of time remaining when correct answer was given
        const avgCorrectTime = avg(correctDecisions.map((d) => d.timeTaken));
        const pctTimeUsed = avgCorrectTime / typicalAllowed;
        timeScore = clamp((1 - pctTimeUsed) * 100);
    } else {
        // No correct answers — poor time management
        const avgTime = avg(decisions.map((d) => d.timeTaken));
        timeScore = clamp(Math.max(0, 30 - (avgTime / typicalAllowed) * 30));
    }
    const timeManagement = timeScore;

    // ── Test-Level Analytics ─────────────────────────────────────
    const testAnalytics = generateTestAnalytics(decisions);

    // ── Insights ─────────────────────────────────────────────────
    const insights: string[] = [];

    // Accuracy-based
    if (correctPct >= 80) {
        insights.push('🎯 Strong analytical accuracy.');
    } else if (correctPct >= 50) {
        insights.push('📊 Moderate accuracy — room for improvement.');
    } else {
        insights.push('⚠️ Accuracy needs significant improvement.');
    }

    // Speed-based: rushing detection
    const earlyDecisions = decisions.filter((d) => d.timeTaken < typicalAllowed * 0.2);
    if (earlyDecisions.length > total * 0.5) {
        insights.push('⏩ You tend to rush decisions — take more time to analyze.');
    }

    // First attempt accuracy
    const firstAttempts = decisions.filter((d) => d.questionId.endsWith('attempt-1'));
    const firstAttemptWrong = firstAttempts.filter((d) => !d.isCorrect);
    if (firstAttempts.length > 0 && firstAttemptWrong.length > firstAttempts.length * 0.6) {
        insights.push('🔍 Initial diagnosis accuracy needs improvement.');
    }

    // Efficiency vs reasoning imbalance
    if (efficiency >= 70 && reasoning < 50) {
        insights.push('⚡ Fast but inconsistent logic — focus on reasoning quality.');
    }
    if (reasoning >= 70 && efficiency < 50) {
        insights.push('🧠 Good reasoning but inefficient approach — optimize your steps.');
    }

    // Time management
    if (timeManagement >= 75) {
        insights.push('⏱ Excellent time management.');
    } else if (timeManagement < 30) {
        insights.push('⏱ Poor time management — practice working under pressure.');
    }

    // Mode-specific
    if (mode === 'debug' && powerOrStability >= 80) {
        insights.push('🔋 Strong power configuration awareness.');
    }
    if (mode === 'crisis' && powerOrStability < 40) {
        insights.push('🛡 System stability is suffering — be more careful with step ordering.');
    }

    // ── Enhanced Insights (from test-level analytics) ────────────
    if (testAnalytics) {
        // Hesitation under pressure
        if (testAnalytics.bonusUsageFrequency >= 40) {
            insights.push('🤔 You tend to hesitate under pressure.');
        }

        // Advanced reasoning capability
        const hardDecisions = decisions.filter((d) => d.difficulty === 'hard' && d.isCorrect);
        const hardTotal = decisions.filter((d) => d.difficulty === 'hard').length;
        if (hardTotal > 0 && hardDecisions.length >= hardTotal * 0.6) {
            const avgHardTime = avg(hardDecisions.map((d) => d.timeTaken));
            if (avgHardTime < typicalAllowed * 0.6) {
                insights.push('🚀 Strong advanced reasoning capability.');
            }
        }

        // Retry improvement needed
        const multiAttemptDecisions = decisions.filter((d) => d.validationAttempts > 1);
        if (multiAttemptDecisions.length > total * 0.5) {
            insights.push('🔄 Improvement in first-attempt accuracy needed.');
        }

        // Resilience recognition
        if (testAnalytics.resilienceScore >= 70) {
            insights.push('💪 Strong resilience — you recover well from mistakes.');
        }

        // Low cursor activity warning
        if (testAnalytics.hesitationScore >= 60) {
            insights.push('🖱 Low cursor engagement detected — stay active while thinking.');
        }
    }

    // Fallback
    if (insights.length <= 1) {
        insights.push('📈 Keep practicing to build stronger diagnostic skills.');
    }

    return {
        skillRatings: { reasoning, efficiency, powerOrStability, timeManagement },
        accuracy: { correct, partial, wrong },
        insights,
        testAnalytics,
    };
}
