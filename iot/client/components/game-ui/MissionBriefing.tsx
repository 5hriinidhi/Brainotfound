/**
 * MissionBriefing — Gamified full-screen overlay shown before gameplay.
 *
 * Effects:
 *   - Animated background pulse
 *   - Glitch animation on title
 *   - Stat preview cards (Reasoning, Efficiency, Power/Stability)
 *   - Sound effect on "Start Mission"
 *   - Difficulty badge
 *   - Smooth slide transition
 */
'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { playCorrect } from '@/utils/soundEngine';

interface MissionBriefingProps {
    mode: 'debug' | 'crisis';
    onStart: () => void;
    backgroundUrl?: string;
}

// ── CSS-in-JS keyframes (injected once) ──────────────────────────────────────
const glitchKeyframes = `
@keyframes glitch {
    0%, 100% { text-shadow: none; transform: translate(0); }
    20% { text-shadow: -2px 0 #ff0040, 2px 0 #0ff; transform: translate(-1px, 1px); }
    40% { text-shadow: 2px 0 #ff0040, -2px 0 #0ff; transform: translate(1px, -1px); }
    60% { text-shadow: -1px 0 #ff0040, 1px 0 #0ff; transform: translate(0.5px, 0.5px); }
    80% { text-shadow: 1px 0 #ff0040, -1px 0 #0ff; transform: translate(-0.5px, -0.5px); }
}
@keyframes pulse-bg {
    0%, 100% { opacity: 0.06; transform: scale(1); }
    50% { opacity: 0.12; transform: scale(1.05); }
}
`;

// ── Stat preview card ────────────────────────────────────────────────────────
function StatCard({ icon, label, color, desc }: { icon: string; label: string; color: string; desc: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.03]`}
        >
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                <span className="text-sm">{icon}</span>
            </div>
            <div className="min-w-0">
                <p className="text-sm text-white font-medium">{label}</p>
                <p className="text-xs text-zinc-500">{desc}</p>
            </div>
        </motion.div>
    );
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{icon}</span> {title}
            </h3>
            <div className="pl-6 space-y-2 text-sm sm:text-base text-zinc-300 leading-relaxed">
                {children}
            </div>
        </div>
    );
}

function BulletItem({ emoji, text }: { emoji: string; text: string }) {
    return (
        <p className="flex items-start gap-2">
            <span className="shrink-0">{emoji}</span>
            <span>{text}</span>
        </p>
    );
}

// ── Mode-specific content ────────────────────────────────────────────────────
function DebugContent() {
    return (
        <Section icon="🎯" title="How The Game Works">
            <BulletItem emoji="🔍" text="Diagnose the circuit fault described in the scenario" />
            <BulletItem emoji="🔧" text="Drag and connect components on the circuit grid" />
            <BulletItem emoji="⏛" text="Select the correct resistor value and GPIO pin" />
            <BulletItem emoji="⚡" text="Validate your circuit before the timer runs out" />
        </Section>
    );
}

function CrisisContent() {
    return (
        <Section icon="🎯" title="How The Game Works">
            <BulletItem emoji="📡" text="Analyze the failure alert and system symptoms" />
            <BulletItem emoji="🔢" text="Arrange diagnostic steps in the correct order" />
            <BulletItem emoji="🛡" text="Preserve system stability — wrong steps cost you" />
            <BulletItem emoji="🎯" text="Minimize wrong decisions to maximize your score" />
        </Section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// MissionBriefing
// ═══════════════════════════════════════════════════════════════════════════

export default function MissionBriefing({ mode, onStart, backgroundUrl }: MissionBriefingProps) {
    const isDebug = mode === 'debug';

    const title = isDebug
        ? '🧪 Circuit Debug Lab – Mission Briefing'
        : '🚨 IoT Crisis Mode – Emergency Protocol';

    const diffBadge = isDebug ? 'Technical Precision Mode' : 'High Pressure Mode';
    const accentColor = isDebug ? 'cyan' : 'red';
    const borderColor = isDebug ? 'border-cyan-500/20' : 'border-red-500/20';
    const glowBg = isDebug ? 'bg-cyan-600/15' : 'bg-red-600/15';
    const pulseBg = isDebug ? 'bg-cyan-500' : 'bg-red-500';
    const buttonGradient = isDebug
        ? 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-800/40'
        : 'from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-red-800/40';
    const badgeBg = isDebug
        ? 'bg-cyan-900/30 border-cyan-700/30 text-cyan-400'
        : 'bg-red-900/30 border-red-700/30 text-red-400';

    const statCards = isDebug
        ? [
            { icon: '🧠', label: 'Reasoning', color: 'bg-cyan-900/40', desc: '+3 correct · -2 wrong logic' },
            { icon: '⚡', label: 'Efficiency', color: 'bg-amber-900/40', desc: 'Bonus for fewer steps' },
            { icon: '🔋', label: 'Power Awareness', color: 'bg-violet-900/40', desc: 'Resistor + power config' },
        ]
        : [
            { icon: '🧠', label: 'Reasoning', color: 'bg-cyan-900/40', desc: '+3 correct · -2 wrong logic' },
            { icon: '⚡', label: 'Efficiency', color: 'bg-amber-900/40', desc: 'Bonus for fewer missteps' },
            { icon: '🛡', label: 'Stability', color: 'bg-red-900/40', desc: 'Each wrong step = -10%' },
        ];

    const handleStart = useCallback(() => {
        playCorrect();
        setTimeout(() => onStart(), 300);
    }, [onStart]);

    return (
        <>
            {/* Inject keyframes */}
            <style>{glitchKeyframes}</style>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-hidden"
            >
                {/* ── Themed Background GIF ────────────────────────── */}
                {backgroundUrl && (
                    <div
                        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                        style={{
                            backgroundImage: `url(${backgroundUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'saturate(1.5)',
                        }}
                    />
                )}
                {/* ── Animated background pulse ──────────────────────── */}
                <div
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full ${pulseBg} pointer-events-none`}
                    style={{ animation: 'pulse-bg 4s ease-in-out infinite' }}
                />
                <div
                    className={`absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full ${pulseBg} pointer-events-none`}
                    style={{ animation: 'pulse-bg 6s ease-in-out infinite 1s' }}
                />

                {/* ── Card ────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.95 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={`relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-2xl border ${borderColor} bg-[#0c0c18]/95 shadow-2xl p-5 sm:p-7 space-y-4`}
                >
                    {/* Decorative glow */}
                    <div className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-[80px] pointer-events-none ${glowBg}`} />

                    {/* ── Difficulty Badge ──────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center"
                    >
                        <span className={`text-[10px] sm:text-xs px-4 py-1.5 rounded-full border ${badgeBg} uppercase tracking-widest font-medium`}>
                            {diffBadge}
                        </span>
                    </motion.div>

                    {/* ── Title with glitch effect ──────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="text-center space-y-2 relative"
                    >
                        <h1
                            className={`text-lg sm:text-2xl font-bold text-${accentColor}-400 leading-tight`}
                            style={{ animation: 'glitch 3s ease-in-out infinite' }}
                        >
                            {title}
                        </h1>
                        <div className={`mx-auto w-20 h-px bg-gradient-to-r from-transparent via-${accentColor}-500/50 to-transparent`} />
                    </motion.div>

                    {/* ── Stat Preview Cards ────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.4 }}
                        className="grid grid-cols-3 gap-2"
                    >
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.08 }}
                            >
                                <StatCard {...stat} />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* ── Sections ──────────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="space-y-4"
                    >
                        {isDebug ? <DebugContent /> : <CrisisContent />}

                        {/* ── Points System ────────────────────────── */}
                        <Section icon="📊" title="Points System">
                            {statCards.map((stat) => (
                                <BulletItem key={stat.label} emoji={stat.icon} text={`${stat.label} — ${stat.desc}`} />
                            ))}
                            <BulletItem emoji="⏱" text="Time Bonus — remaining seconds × difficulty multiplier" />
                        </Section>

                        {/* ── Engineering Disclaimer ────────────────── */}
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                            <p className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">⚠️ Engineering Disclaimer</p>
                            <p className="text-[10px] text-zinc-600 leading-relaxed">
                                This is a <span className="text-zinc-400">logical simulation</span> — no real electrical physics engine.
                                Designed to test <span className="text-zinc-400">decision-making and diagnostic reasoning</span>.
                                For educational purposes only.
                            </p>
                        </div>
                    </motion.div>

                    {/* ── Start Button ──────────────────────────────── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="pt-1"
                    >
                        <button
                            onClick={handleStart}
                            className={`w-full text-base sm:text-lg font-bold px-8 py-5 rounded-xl bg-gradient-to-r ${buttonGradient} text-white tracking-wider shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-95 cursor-pointer relative overflow-hidden group`}
                        >
                            {/* Button shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            <span className="relative">🚀 Start Mission</span>
                        </button>
                    </motion.div>

                    <p className="text-center text-[10px] text-zinc-700">BrainNotFound v1.0 • IoT Diagnostic Arena</p>
                </motion.div>
            </motion.div>
        </>
    );
}
