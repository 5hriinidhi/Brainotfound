'use client';

// ── Web Audio API Sound Engine ──────────────────────────────────────────────
// All sounds synthesized — zero external files, instant playback, tiny footprint.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext();
    return ctx;
}

function resumeCtx() {
    const c = getCtx();
    if (c.state === 'suspended') c.resume();
}

// ── Correct Answer — rising chime ────────────────────────────────────────────
export function playCorrect() {
    resumeCtx();
    const c = getCtx();
    const now = c.currentTime;

    [523, 659, 784].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(gain).connect(c.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
    });
}

// ── Wrong Answer — low buzz ──────────────────────────────────────────────────
export function playWrong() {
    resumeCtx();
    const c = getCtx();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.3);
}

// ── Countdown Tick — short click ─────────────────────────────────────────────
export function playTick() {
    resumeCtx();
    const c = getCtx();
    const now = c.currentTime;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.05);
}

// ── Crisis Alert — two-tone alarm ────────────────────────────────────────────
export function playCrisisAlert() {
    resumeCtx();
    const c = getCtx();
    const now = c.currentTime;

    [0, 0.15].forEach((offset, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.value = i % 2 === 0 ? 600 : 450;
        gain.gain.setValueAtTime(0.1, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
        osc.connect(gain).connect(c.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
    });
}

// ── XP Gain — sparkle ────────────────────────────────────────────────────────
export function playXP() {
    resumeCtx();
    const c = getCtx();
    const now = c.currentTime;

    [1047, 1319, 1568].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
        osc.connect(gain).connect(c.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.15);
    });
}
