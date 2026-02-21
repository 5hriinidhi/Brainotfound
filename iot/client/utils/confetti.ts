/**
 * Confetti burst utility — wraps canvas-confetti for victory celebrations.
 */
import confetti from 'canvas-confetti';

/** Full victory confetti explosion — multiple bursts */
export function fireConfetti() {
    const defaults = { startVelocity: 30, spread: 360, ticks: 80, zIndex: 9999 };

    // Burst 1 — center
    confetti({ ...defaults, particleCount: 80, origin: { x: 0.5, y: 0.4 } });

    // Burst 2 — left
    setTimeout(() => {
        confetti({ ...defaults, particleCount: 50, origin: { x: 0.2, y: 0.5 } });
    }, 200);

    // Burst 3 — right
    setTimeout(() => {
        confetti({ ...defaults, particleCount: 50, origin: { x: 0.8, y: 0.5 } });
    }, 400);

    // Gold shower from top
    setTimeout(() => {
        confetti({
            particleCount: 100,
            spread: 100,
            origin: { x: 0.5, y: 0 },
            colors: ['#FFD700', '#FFA500', '#FF6347', '#9333ea', '#06b6d4'],
            startVelocity: 45,
            ticks: 120,
            zIndex: 9999,
        });
    }, 600);
}

/** Subtle side cannons — result page entrance */
export function fireSideCannons() {
    // Left cannon
    confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#a78bfa', '#06b6d4', '#34d399'],
        zIndex: 9999,
    });
    // Right cannon
    confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#a78bfa', '#06b6d4', '#34d399'],
        zIndex: 9999,
    });
}
