/**
 * Result Page — Full analytics dashboard shown after a match.
 *
 * Sections:
 *   1. Final Score Card (score, rank, XP)
 *   2. Skill Radar Chart (reasoning, efficiency, power/stability, time mgmt)
 *   3. Accuracy Bar Chart (correct / partial / wrong)
 *   4. Time Efficiency Line Graph (timeTaken per decision)
 *   5. Strength vs Weakness Cards
 *   6. AI Feedback Panel (insights)
 *
 * Auth + score submission preserved from original.
 */
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { useCircuitStore } from '@/store/useCircuitStore';
import { useCrisisStore } from '@/store/useCrisisStore';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line,
    ResponsiveContainer, Cell,
} from 'recharts';
import { analyzePerformance, type PerformanceAnalysis } from '@/utils/skillAnalyzer';
import { fireSideCannons } from '@/utils/confetti';
import PerformanceCertificate from '@/components/game-ui/PerformanceCertificate';
import api from '@/lib/api';

// ── Rank Calculation ─────────────────────────────────────────────────────────
function getRank(pct: number) {
    if (pct > 85) return { title: 'Elite IoT Architect', color: '#c084fc', emoji: '💎' };
    if (pct > 70) return { title: 'Gold Troubleshooter', color: '#facc15', emoji: '🥇' };
    if (pct > 50) return { title: 'Silver Debugger', color: '#94a3b8', emoji: '🥈' };
    return { title: 'Bronze Engineer', color: '#f59e0b', emoji: '🥉' };
}

// ── Motivational Quotes ──────────────────────────────────────────────────────
const QUOTES = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'First, solve the problem. Then, write the code.', author: 'John Johnson' },
    { text: 'Hardware eventually fails. Software eventually works.', author: 'Michael Hartung' },
    { text: 'Debugging is twice as hard as writing the code in the first place.', author: 'Brian Kernighan' },
    { text: 'Any sufficiently advanced bug is indistinguishable from a feature.', author: 'Rich Kulawiec' },
    { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
    { text: 'A good engineer thinks in reverse and asks: What could go wrong?', author: 'Claus Borgnakke' },
    { text: 'Measure twice, solder once.', author: 'Hardware Wisdom' },
];
function getRandomQuote() { return QUOTES[Math.floor(Math.random() * QUOTES.length)]; }

// ── Submit Result Type ───────────────────────────────────────────────────────
interface SubmitResult { xpEarned: number; eloChange: number; eloRating: number; }

// ── Section wrapper ──────────────────────────────────────────────────────────
function SectionCard({ title, icon, delay, children }: { title: string; icon: string; delay: number; children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="rounded-xl bg-white/5 border border-white/10 p-4 sm:p-5 space-y-3"
        >
            <h3 className="text-[9px] sm:text-[10px] font-bold text-white flex items-center gap-2">
                <span>{icon}</span> {title}
            </h3>
            {children}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Result Page
// ═══════════════════════════════════════════════════════════════════════════

export default function ResultPage() {
    const router = useRouter();
    const { user, register, login, error: authError, clearError } = useAuth();
    const {
        reasoning, efficiency, powerAwareness, stability, score,
        gameStatus, gameMode, totalScenarios, resetGame, startGame,
    } = useGameStore();

    // Pull analytics from mode-specific stores
    const circuitDecisions = useCircuitStore((s) => s.decisions);
    const circuitTotalXP = useCircuitStore((s) => s.totalXP);
    const crisisDecisions = useCrisisStore((s) => s.decisions);
    const crisisTotalXP = useCrisisStore((s) => s.totalXP);

    const [showChart, setShowChart] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [quote] = useState(() => getRandomQuote());
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [usernameInput, setUsernameInput] = useState('');

    // ── Derive analytics ──────────────────────────────────────────
    const mode = (gameMode ?? 'debug') as 'debug' | 'crisis';
    const decisions = mode === 'debug' ? circuitDecisions : crisisDecisions;
    const totalXP = mode === 'debug' ? circuitTotalXP : crisisTotalXP;

    const analysis: PerformanceAnalysis = useMemo(
        () => analyzePerformance(decisions, mode),
        [decisions, mode],
    );

    // ── Redirect if no game data ──────────────────────────────────
    useEffect(() => {
        if (!gameMode || (gameStatus !== 'complete' && gameStatus !== 'gameover')) {
            router.push('/');
            return;
        }
        const t = setTimeout(() => setShowChart(true), 600);
        // Confetti on victory
        if (gameStatus === 'complete') {
            setTimeout(() => fireSideCannons(), 800);
        }
        return () => clearTimeout(t);
    }, [gameMode, gameStatus, router]);

    if (!gameMode) return null;

    const isComplete = gameStatus === 'complete';
    const maxScore = totalScenarios * 30;
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const rank = getRank(pct);

    // ── Chart data ────────────────────────────────────────────────
    const radarData = [
        { stat: 'Reasoning', value: analysis.skillRatings.reasoning },
        { stat: 'Efficiency', value: analysis.skillRatings.efficiency },
        { stat: mode === 'debug' ? 'Power' : 'Stability', value: analysis.skillRatings.powerOrStability },
        { stat: 'Time Mgmt', value: analysis.skillRatings.timeManagement },
    ];

    const accuracyData = [
        { name: 'Correct', value: analysis.accuracy.correct, fill: '#34d399' },
        { name: 'Partial', value: analysis.accuracy.partial, fill: '#fbbf24' },
        { name: 'Wrong', value: analysis.accuracy.wrong, fill: '#f87171' },
    ];

    const timeData = decisions.map((d, i) => ({
        name: `#${i + 1}`,
        time: d.timeTaken,
        correct: d.isCorrect,
    }));

    const skillEntries: { label: string; value: number; icon: string; color: string }[] = [
        { label: 'Reasoning', value: analysis.skillRatings.reasoning, icon: '🧠', color: 'cyan' },
        { label: 'Efficiency', value: analysis.skillRatings.efficiency, icon: '⚡', color: 'amber' },
        { label: mode === 'debug' ? 'Power Awareness' : 'Stability', value: analysis.skillRatings.powerOrStability, icon: mode === 'debug' ? '🔋' : '🛡', color: 'violet' },
        { label: 'Time Management', value: analysis.skillRatings.timeManagement, icon: '⏱', color: 'emerald' },
    ];

    // ── Auth handler ──────────────────────────────────────────────
    const handleAuth = async () => {
        if (!usernameInput.trim() || usernameInput.trim().length < 2) return;
        clearError();
        try {
            if (authMode === 'register') await register(usernameInput.trim());
            else await login(usernameInput.trim());
        } catch { /* Error set in AuthContext */ }
    };

    // ── Submit score ──────────────────────────────────────────────
    const handleSubmitScore = useCallback(async () => {
        if (!user || submitted) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const { data } = await api.post('/api/submit-score', { mode: gameMode, score });
            setSubmitResult({ xpEarned: data.match.xpEarned, eloChange: data.match.eloChange, eloRating: data.user.eloRating });
            setSubmitted(true);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to submit score';
            setSubmitError(msg);
        } finally { setSubmitting(false); }
    }, [user, submitted, gameMode, score]);

    useEffect(() => {
        if (user && !submitted && !submitting) handleSubmitScore();
    }, [user, submitted, submitting, handleSubmitScore]);

    const handleReplay = () => { startGame(gameMode); router.push('/game'); };
    const handleHome = () => { resetGame(); router.push('/'); };
    const handleSwitchMode = () => { resetGame(); router.push('/mode'); };

    const modeLabel = gameMode === 'debug' ? '🔧 Circuit Debug Lab' : '🚨 IoT Crisis Mode';

    return (
        <main className="min-h-screen text-white flex flex-col items-center justify-start px-3 sm:px-4 relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/backgrounds/result-bg.png')" }} />
            <div className="fixed inset-0 bg-black/70" />
            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

            <div className="relative z-10 w-full max-w-lg space-y-4 py-6 sm:py-8">

                {/* ══════ SECTION 1: Final Score Card ══════════════════════════ */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-3">
                    <p className="text-[6px] sm:text-[7px] text-zinc-500 uppercase">{modeLabel}</p>

                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                        <span className={`inline-block px-5 py-1.5 text-[7px] sm:text-[8px] font-bold tracking-widest uppercase rounded-full ${isComplete ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'}`}>
                            {isComplete ? '✦ Mission Complete' : '✖ System Failure'}
                        </span>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <p className="text-2xl sm:text-3xl mb-2">{rank.emoji}</p>
                        <h1 className="text-base sm:text-lg md:text-xl" style={{ color: rank.color }}>{rank.title}</h1>
                        <p className="text-[7px] text-zinc-400 italic mt-2 max-w-sm mx-auto">&ldquo;{quote.text}&rdquo;</p>
                        <p className="text-[6px] text-zinc-600 mt-1">— {quote.author}</p>
                    </motion.div>

                    {/* Score + XP */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                        className="flex items-center justify-center gap-6">
                        <div>
                            <p className="text-[6px] text-zinc-500 mb-1">Score</p>
                            <p className="text-xl sm:text-2xl text-white">{score}</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-[6px] text-zinc-500 mb-1">Accuracy</p>
                            <p className="text-xl sm:text-2xl" style={{ color: rank.color }}>{pct}%</p>
                        </div>
                        <div className="w-px h-10 bg-white/10" />
                        <div>
                            <p className="text-[6px] text-zinc-500 mb-1">XP Earned</p>
                            <p className="text-xl sm:text-2xl text-violet-400">{totalXP}</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* ══════ SECTION 2: Skill Radar Chart ═════════════════════════ */}
                <SectionCard title="Skill Radar" icon="📡" delay={0.4}>
                    <div className="w-full h-48 sm:h-56">
                        {showChart && (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="Skills" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.25} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </SectionCard>

                {/* ══════ SECTION 3: Accuracy Bar Chart ════════════════════════ */}
                <SectionCard title="Accuracy Breakdown" icon="📊" delay={0.5}>
                    <div className="w-full h-40">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={accuracyData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 8 }} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                                    labelStyle={{ color: '#e4e4e7' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {accuracyData.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-[7px]">
                        <span className="text-emerald-400">● Correct: {analysis.accuracy.correct}</span>
                        <span className="text-amber-400">● Partial: {analysis.accuracy.partial}</span>
                        <span className="text-red-400">● Wrong: {analysis.accuracy.wrong}</span>
                    </div>
                </SectionCard>

                {/* ══════ SECTION 4: Time Efficiency Line Graph ════════════════ */}
                {timeData.length > 0 && (
                    <SectionCard title="Time per Decision" icon="⏱" delay={0.6}>
                        <div className="w-full h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 8 }} axisLine={false} />
                                    <YAxis tick={{ fill: '#71717a', fontSize: 8 }} axisLine={false} unit="s" />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
                                        labelStyle={{ color: '#e4e4e7' }}
                                        formatter={(value: number | undefined) => [`${value ?? 0}s`, 'Time']}
                                    />
                                    <Line type="monotone" dataKey="time" stroke="#818cf8" strokeWidth={2} dot={{ fill: '#818cf8', r: 4 }} activeDot={{ r: 6, fill: '#a78bfa' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </SectionCard>
                )}

                {/* ══════ SECTION 5: Strength vs Weakness Cards ════════════════ */}
                <SectionCard title="Skill Assessment" icon="🎯" delay={0.7}>
                    <div className="grid grid-cols-2 gap-2">
                        {skillEntries.map((skill) => {
                            const isStrength = skill.value >= 75;
                            return (
                                <motion.div
                                    key={skill.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`rounded-xl border p-3 text-center space-y-1 ${isStrength
                                        ? 'bg-emerald-900/15 border-emerald-700/30'
                                        : 'bg-red-900/10 border-red-700/20'
                                        }`}
                                >
                                    <p className="text-lg">{skill.icon}</p>
                                    <p className="text-[8px] text-white font-medium">{skill.label}</p>
                                    <p className={`text-sm font-bold ${isStrength ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {skill.value}%
                                    </p>
                                    <p className={`text-[6px] ${isStrength ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isStrength ? '✦ Strength' : '↑ Needs Improvement'}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </SectionCard>

                {/* ══════ SECTION 6: AI Feedback Panel ═════════════════════════ */}
                <SectionCard title="AI Performance Insights" icon="🤖" delay={0.8}>
                    <div className="space-y-2">
                        {analysis.insights.map((insight, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.08 }}
                                className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5"
                            >
                                <span className="text-[8px] sm:text-[9px] text-zinc-300 leading-relaxed">{insight}</span>
                            </motion.div>
                        ))}
                    </div>
                </SectionCard>

                {/* ══════ SECTION 7: Answer Pattern Graph ══════════════════════ */}
                {decisions.length > 0 && (
                    <SectionCard title="Answer Pattern" icon="📋" delay={0.85}>
                        <div className="flex items-center gap-1 overflow-x-auto py-2 px-1">
                            {decisions.map((d, i) => {
                                const color = d.isCorrect ? 'bg-emerald-500' : d.partialCredit ? 'bg-amber-500' : 'bg-red-500';
                                const borderColor = d.isCorrect ? 'border-emerald-400' : d.partialCredit ? 'border-amber-400' : 'border-red-400';
                                const emoji = d.isCorrect ? '🟢' : d.partialCredit ? '🟡' : '🔴';
                                const scoreDelta = d.reasoningDelta + d.efficiencyDelta;

                                return (
                                    <div key={i} className="flex flex-col items-center gap-1 group relative">
                                        {/* Connector line */}
                                        {i > 0 && (
                                            <div className="absolute left-0 top-1/2 -translate-x-full w-1 h-0.5 bg-white/10" style={{ top: '16px' }} />
                                        )}
                                        {/* Step dot */}
                                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${color}/20 border ${borderColor}/50 flex items-center justify-center cursor-default transition-transform group-hover:scale-110`}>
                                            <span className="text-[9px]">{emoji}</span>
                                        </div>
                                        <span className="text-[5px] text-zinc-600">Q{i + 1}</span>

                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                            <div className="bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
                                                <p className="text-[7px] text-white font-medium mb-1">Question {i + 1}</p>
                                                <p className="text-[6px] text-zinc-400">⏱ Time: {d.timeTaken}s</p>
                                                <p className={`text-[6px] ${scoreDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    📊 Score: {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
                                                </p>
                                                <p className="text-[6px] text-zinc-500">
                                                    {d.isCorrect ? '✓ Correct' : d.partialCredit ? '◐ Partial' : '✕ Wrong'}
                                                </p>
                                            </div>
                                            {/* Tooltip arrow */}
                                            <div className="w-2 h-2 bg-[#1a1a2e] border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="flex justify-center gap-4 text-[6px] text-zinc-500 mt-1">
                            <span>🟢 Correct</span>
                            <span>🟡 Partial</span>
                            <span>🔴 Wrong</span>
                        </div>
                    </SectionCard>
                )}

                {/* ══════ SECTION 8: Improvement Suggestions ═══════════════════ */}
                <SectionCard title="Improvement Suggestions" icon="💡" delay={0.9}>
                    <div className="space-y-2">
                        {(() => {
                            const suggestions: { skill: string; icon: string; advice: string; color: string }[] = [];
                            const { reasoning: r, efficiency: e, powerOrStability: p, timeManagement: t } = analysis.skillRatings;

                            if (r < 75) suggestions.push({
                                skill: 'Reasoning', icon: '🧠', color: 'border-cyan-700/30 bg-cyan-900/10',
                                advice: r < 40
                                    ? 'Focus on understanding fault symptoms before placing components. Read scenario descriptions carefully.'
                                    : 'Your diagnostic logic is developing. Try to identify root cause before attempting fixes.',
                            });
                            if (e < 75) suggestions.push({
                                skill: 'Efficiency', icon: '⚡', color: 'border-amber-700/30 bg-amber-900/10',
                                advice: e < 40
                                    ? "You're using too many unnecessary steps. Plan your approach before building."
                                    : 'Good approach, but try to minimize trial-and-error. Think before each connection.',
                            });
                            if (p < 75) suggestions.push({
                                skill: mode === 'debug' ? 'Power Awareness' : 'Stability', icon: mode === 'debug' ? '🔋' : '🛡',
                                color: 'border-violet-700/30 bg-violet-900/10',
                                advice: mode === 'debug'
                                    ? (p < 40
                                        ? 'Focus on resistor calculation (V/I = R) and voltage considerations. Match power to sensor specs.'
                                        : 'Review pull-up resistor values and GPIO voltage levels for common sensors.')
                                    : (p < 40
                                        ? 'Practice structured network diagnostics. Each wrong step destabilizes the system significantly.'
                                        : 'Good stability management. Focus on getting the sequence order right on first attempt.'),
                            });
                            if (t < 75) suggestions.push({
                                skill: 'Time Management', icon: '⏱', color: 'border-emerald-700/30 bg-emerald-900/10',
                                advice: t < 40
                                    ? "You're running out of time consistently. Practice quick pattern recognition in scenarios."
                                    : 'Your pace is decent but could improve. Try to solve the core issue first, then optimize.',
                            });

                            if (suggestions.length === 0) {
                                return (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="text-center py-4 space-y-2">
                                        <p className="text-xl">🌟</p>
                                        <p className="text-[9px] text-emerald-400 font-medium">Outstanding Performance!</p>
                                        <p className="text-[7px] text-zinc-400">All skill areas are at 75% or above. Keep up the excellent work.</p>
                                    </motion.div>
                                );
                            }

                            return suggestions.map((s, i) => (
                                <motion.div
                                    key={s.skill}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.95 + i * 0.08 }}
                                    className={`flex items-start gap-3 px-3 py-3 rounded-xl border ${s.color}`}
                                >
                                    <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
                                    <div className="min-w-0">
                                        <p className="text-[8px] text-white font-medium">{s.skill}</p>
                                        <p className="text-[7px] text-zinc-400 leading-relaxed mt-0.5">{s.advice}</p>
                                    </div>
                                </motion.div>
                            ));
                        })()}
                    </div>
                </SectionCard>

                {/* ══════ Auth + Submit Section ════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }}
                    className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4 space-y-3"
                >
                    {!user ? (
                        <>
                            <p className="text-[7px] text-zinc-400 text-center">
                                {authMode === 'register' ? 'Create account to save score' : 'Login to save score'}
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text" placeholder="Username" value={usernameInput}
                                    onChange={(e) => setUsernameInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                    maxLength={20}
                                    className="flex-1 px-3 py-2 text-[8px] rounded-lg bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                                />
                                <button onClick={handleAuth} disabled={usernameInput.trim().length < 2}
                                    className="px-4 py-2 text-[7px] rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer">
                                    {authMode === 'register' ? '📝 Register' : '🔑 Login'}
                                </button>
                            </div>
                            <button onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); clearError(); }}
                                className="text-[7px] text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                                {authMode === 'register' ? 'Already have an account? Login' : 'New? Create account'}
                            </button>
                            {authError && <p className="text-[7px] text-red-400">⚠ {authError}</p>}
                        </>
                    ) : submitted && submitResult ? (
                        <div className="space-y-2 text-center">
                            <p className="text-[7px] text-emerald-400">✓ Score saved for {user.username}!</p>
                            <div className="flex justify-center gap-4 text-[7px]">
                                <span className="text-amber-400">+{submitResult.xpEarned} XP</span>
                                <span className={submitResult.eloChange >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                    {submitResult.eloChange >= 0 ? '+' : ''}{submitResult.eloChange} ELO
                                </span>
                                <span className="text-violet-400">Rating: {submitResult.eloRating}</span>
                            </div>
                        </div>
                    ) : submitting ? (
                        <p className="text-[8px] text-violet-400 animate-pulse text-center">Submitting score…</p>
                    ) : submitError ? (
                        <div className="space-y-2 text-center">
                            <p className="text-[7px] text-red-400">⚠ {submitError}</p>
                            <button onClick={handleSubmitScore}
                                className="text-[7px] px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-all cursor-pointer">
                                🔄 Retry
                            </button>
                        </div>
                    ) : null}
                </motion.div>

                {/* ══════ SECTION 9: Performance Certificate ══════════════════ */}
                <SectionCard title="Performance Certificate" icon="📜" delay={1.0}>
                    <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
                        <div className="min-w-[600px]">
                            <PerformanceCertificate
                                playerName={user?.username || 'IoT Engineer'}
                                mode={mode}
                                score={score}
                                maxScore={maxScore}
                                rank={rank}
                                grade={analysis.skillRatings.reasoning >= 80 ? 'A' : analysis.skillRatings.reasoning >= 60 ? 'B' : analysis.skillRatings.reasoning >= 40 ? 'C' : 'D'}
                                reasoning={analysis.skillRatings.reasoning}
                                efficiency={analysis.skillRatings.efficiency}
                                powerOrStability={analysis.skillRatings.powerOrStability}
                                timeManagement={analysis.skillRatings.timeManagement}
                                totalXP={totalXP}
                                date={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ══════ Action Buttons ═══════════════════════════════════════ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
                    className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3 justify-center pt-1 pb-8">
                    <button onClick={handleReplay} className="text-[7px] sm:text-[8px] px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all active:scale-95 cursor-pointer">
                        🔁 Replay
                    </button>
                    <button onClick={() => router.push('/leaderboard')} className="text-[7px] sm:text-[8px] px-5 py-3 rounded-xl bg-yellow-600/80 hover:bg-yellow-500/80 text-white transition-all active:scale-95 cursor-pointer">
                        🏆 Leaderboard
                    </button>
                    <button onClick={handleSwitchMode} className="text-[7px] sm:text-[8px] px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 border border-white/10 transition-all active:scale-95 cursor-pointer">
                        🔄 Switch Mode
                    </button>
                    <button onClick={handleHome} className="text-[7px] sm:text-[8px] px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 border border-white/10 transition-all active:scale-95 cursor-pointer">
                        🏠 Home
                    </button>
                </motion.div>
            </div>
        </main>
    );
}
