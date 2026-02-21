/**
 * Crisis Validator — scores the user's diagnostic sequence against
 * the optimal order for a crisis scenario.
 *
 * Scoring:
 *   - orderScore:     25 pts per correct position (exact match)
 *   - partial credit: 12 pts if action is in optimal set but wrong slot
 *   - reasoningScore: derived from order accuracy
 *   - timeBonus:      remaining seconds × 0.5
 *   - stabilityDelta: +10 on success, -15 to -25 on failure
 */
import { CrisisSequenceScenario, CrisisValidationResult } from '@/types/crisis';

export function validateCrisisSequence(
    userSequence: string[],
    scenario: CrisisSequenceScenario,
    timeRemaining: number,
): CrisisValidationResult {
    const { optimalSequence, sequenceLength } = scenario;
    const slotResults: ('correct' | 'partial' | 'wrong')[] = [];
    let correctCount = 0;
    let partialCount = 0;

    // Score each slot
    for (let i = 0; i < sequenceLength; i++) {
        const userAction = userSequence[i];
        if (!userAction) {
            slotResults.push('wrong');
        } else if (userAction === optimalSequence[i]) {
            slotResults.push('correct');
            correctCount++;
        } else if (optimalSequence.includes(userAction)) {
            slotResults.push('partial');
            partialCount++;
        } else {
            slotResults.push('wrong');
        }
    }

    // Calculate scores
    const orderScore = Math.round(
        ((correctCount * 25) + (partialCount * 12)) / sequenceLength * (100 / 25),
    );
    const reasoningScore = Math.min(100, Math.round(
        (correctCount / sequenceLength) * 80 + (partialCount / sequenceLength) * 30,
    ));
    const timeBonus = Math.round(Math.max(0, timeRemaining) * 0.5);
    const success = correctCount === sequenceLength;

    // Stability
    let stabilityDelta: number;
    if (success) {
        stabilityDelta = 10;
    } else if (correctCount >= sequenceLength / 2) {
        stabilityDelta = -Math.round(5 + Math.random() * 5);
    } else {
        stabilityDelta = -Math.round(15 + Math.random() * 10);
    }

    // XP
    const diffMultiplier = { easy: 1, medium: 1.5, hard: 2 }[scenario.difficulty] ?? 1;
    const rawScore = orderScore + timeBonus;
    const xpEarned = success
        ? Math.round((rawScore + reasoningScore) * diffMultiplier)
        : Math.round(Math.max(0, partialCount * 10) * diffMultiplier);

    const totalScore = Math.min(100, Math.round((orderScore * 0.6 + reasoningScore * 0.3 + Math.min(timeBonus, 20) * 0.5)));

    // Feedback
    let feedback: string;
    if (success) {
        feedback = `🎉 Perfect diagnostic sequence! ${scenario.explanation}`;
    } else if (correctCount >= sequenceLength - 1) {
        feedback = `⚡ Almost! ${correctCount}/${sequenceLength} steps correct. ${scenario.hint}`;
    } else if (partialCount > 0) {
        feedback = `🔧 Right actions, wrong order. ${correctCount} exact + ${partialCount} misplaced. ${scenario.hint}`;
    } else {
        feedback = `💥 Incorrect sequence. ${scenario.hint}`;
    }

    return {
        success,
        orderScore: Math.min(100, orderScore),
        reasoningScore,
        timeBonus,
        totalScore,
        stabilityDelta,
        xpEarned,
        feedback,
        slotResults,
        correctSequence: optimalSequence,
    };
}
