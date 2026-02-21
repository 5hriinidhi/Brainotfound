/**
 * Sound Engine — Web Audio API synthesized sound effects.
 * No .wav files needed — generates tones procedurally.
 *
 * Full gaming SFX library:
 *   - UI: click, hover, swoosh, pop
 *   - Gameplay: place, connect, disconnect, drag, drop
 *   - Feedback: correct, wrong, celebration, fail
 *   - Ambient: tick, warning, countdown, powerUp
 *
 * Lazy-initializes AudioContext on first user interaction.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function tone(
    freq: number,
    type: OscillatorType,
    volume: number,
    start: number,
    duration: number,
    ac: AudioContext,
) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + duration);
}

function noise(volume: number, start: number, duration: number, ac: AudioContext) {
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ac.createBufferSource();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start(start);
    src.stop(start + duration);
}

// ═══════════════════════════════════════════════════════════════════════════
// UI SOUNDS
// ═══════════════════════════════════════════════════════════════════════════

/** Soft click — button press, menu selection */
export function playClick() {
    try {
        const ac = getCtx();
        tone(1200, 'sine', 0.06, ac.currentTime, 0.04, ac);
        tone(800, 'sine', 0.04, ac.currentTime + 0.02, 0.03, ac);
    } catch { /* */ }
}

/** Subtle hover sound — menu items */
export function playHover() {
    try {
        const ac = getCtx();
        tone(2000, 'sine', 0.02, ac.currentTime, 0.03, ac);
    } catch { /* */ }
}

/** Swoosh — page transitions, modal open */
export function playSwoosh() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        noise(0.03, now, 0.15, ac);
    } catch { /* */ }
}

/** Pop — notification, tooltip, badge appear */
export function playPop() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } catch { /* */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY SOUNDS
// ═══════════════════════════════════════════════════════════════════════════

/** Component placed onto the grid — solid thunk */
export function playPlace() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        tone(200, 'triangle', 0.12, now, 0.1, ac);
        tone(300, 'sine', 0.08, now + 0.02, 0.08, ac);
        noise(0.04, now, 0.06, ac);
    } catch { /* */ }
}

/** Wire connected — electrical spark zap */
export function playConnect() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        // Electric zap
        tone(1800, 'sawtooth', 0.04, now, 0.05, ac);
        tone(2400, 'square', 0.03, now + 0.02, 0.04, ac);
        tone(1200, 'sine', 0.06, now + 0.04, 0.08, ac);
        noise(0.03, now, 0.05, ac);
    } catch { /* */ }
}

/** Wire disconnected / component removed — reverse zap */
export function playDisconnect() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    } catch { /* */ }
}

/** Component picked up / drag start */
export function playDragStart() {
    try {
        const ac = getCtx();
        tone(500, 'sine', 0.06, ac.currentTime, 0.06, ac);
        tone(700, 'sine', 0.04, ac.currentTime + 0.03, 0.05, ac);
    } catch { /* */ }
}

/** Component dropped */
export function playDrop() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        tone(400, 'triangle', 0.08, now, 0.08, ac);
        tone(250, 'sine', 0.06, now + 0.03, 0.06, ac);
    } catch { /* */ }
}

/** Resistor value changed / config toggle — dial click */
export function playToggle() {
    try {
        const ac = getCtx();
        tone(1500, 'square', 0.03, ac.currentTime, 0.025, ac);
        tone(1800, 'square', 0.02, ac.currentTime + 0.04, 0.025, ac);
    } catch { /* */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK SOUNDS
// ═══════════════════════════════════════════════════════════════════════════

/** Play a short success chime (ascending tones) */
export function playCorrect() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        [523, 659, 784].forEach((freq, i) => {
            tone(freq, 'sine', 0.15, now + i * 0.1, 0.3, ac);
        });
    } catch { /* */ }
}

/** Play a short error buzz (descending low tones) */
export function playWrong() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        [220, 165].forEach((freq, i) => {
            tone(freq, 'sawtooth', 0.1, now + i * 0.12, 0.2, ac);
        });
    } catch { /* */ }
}

/** Play celebration fanfare — victory! */
export function playCelebration() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        // Triumphant arpeggio
        [523, 659, 784, 1047].forEach((freq, i) => {
            tone(freq, 'triangle', 0.12, now + i * 0.12, 0.5, ac);
        });
        // Shimmer on top
        setTimeout(() => {
            try {
                const ac2 = getCtx();
                const t = ac2.currentTime;
                [1568, 2093, 2637].forEach((freq, i) => {
                    tone(freq, 'sine', 0.04, t + i * 0.08, 0.4, ac2);
                });
            } catch { /* */ }
        }, 400);
    } catch { /* */ }
}

/** Mission fail — ominous descending tones */
export function playFail() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        // Low rumble
        tone(110, 'sawtooth', 0.08, now, 0.6, ac);
        tone(82, 'sawtooth', 0.06, now + 0.2, 0.5, ac);
        // Dissonant chord
        [220, 233, 262].forEach((freq, i) => {
            tone(freq, 'triangle', 0.05, now + 0.1 + i * 0.05, 0.4, ac);
        });
    } catch { /* */ }
}

// ═══════════════════════════════════════════════════════════════════════════
// AMBIENT / TIMER SOUNDS
// ═══════════════════════════════════════════════════════════════════════════

/** Timer tick — subtle clock sound */
export function playTick() {
    try {
        const ac = getCtx();
        tone(880, 'sine', 0.05, ac.currentTime, 0.03, ac);
    } catch { /* */ }
}

/** Urgent tick — last 10 seconds, louder + deeper */
export function playUrgentTick() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        tone(660, 'triangle', 0.08, now, 0.05, ac);
        tone(440, 'sine', 0.04, now + 0.02, 0.04, ac);
    } catch { /* */ }
}

/** Warning alarm — stability low or time critical */
export function playWarning() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        tone(440, 'square', 0.06, now, 0.1, ac);
        tone(440, 'square', 0.06, now + 0.15, 0.1, ac);
    } catch { /* */ }
}

/** Countdown beep — 3… 2… 1… GO! */
export function playCountdown() {
    try {
        const ac = getCtx();
        tone(880, 'sine', 0.1, ac.currentTime, 0.15, ac);
    } catch { /* */ }
}

/** Countdown final GO — higher pitch */
export function playCountdownGo() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        tone(1047, 'sine', 0.15, now, 0.2, ac);
        tone(1319, 'sine', 0.1, now + 0.05, 0.2, ac);
    } catch { /* */ }
}

/** Power up — XP earned, level up feel */
export function playPowerUp() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        [400, 500, 600, 800, 1000, 1200].forEach((freq, i) => {
            tone(freq, 'sine', 0.06, now + i * 0.05, 0.15, ac);
        });
    } catch { /* */ }
}

/** Electric hum — ambient background for circuit mode */
export function playElectricHum() {
    try {
        const ac = getCtx();
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = 60; // Mains hum
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 2.0);
    } catch { /* */ }
}
