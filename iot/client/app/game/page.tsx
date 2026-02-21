/**
 * Game Page — Main gameplay screen.
 *
 * Features:
 * - Conditional stats bar (4 stats for Crisis, 3 for Debug)
 * - SFX triggers: correct chime, wrong buzz, tick at ≤5s, crisis alert at 3s
 * - Screen shake on wrong/mediocre answers
 * - Red flash overlay when stability drops (Crisis mode)
 * - XP popup animation on score increase
 * - Double-click prevention via store's isProcessing flag
 * - Animated scene transitions with Framer Motion
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Timer from '@/components/game/Timer';
import DialogueBox from '@/components/game/DialogueBox';
import ChoiceButtons from '@/components/game/ChoiceButtons';
import SkillMeter from '@/components/game/SkillMeter';
import StabilityMeter from '@/components/game/StabilityMeter';
import XPPopup from '@/components/game/XPPopup';
import { SceneChoice } from '@/types/game';
import { playCorrect, playWrong, playTick, playCrisisAlert, playXP } from '@/lib/sfx';

export default function GamePage() {
    const router = useRouter();
    const {
        gameStatus,
        gameMode,
        reasoning,
        efficiency,
        powerAwareness,
        stability,
        timer,
        score,
        scenarioIndex,
        totalScenarios,
        scenarios,
        isProcessing,
        tickTimer,
        applyChoice,
    } = useGameStore();

    const scene = scenarios[scenarioIndex];
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Visual effect states ────────────────────────────────────────────
    const [shake, setShake] = useState(false);
    const [stabilityFlash, setStabilityFlash] = useState(false);
    const prevStability = useRef(stability);

    // ── Redirect: no mode → home ────────────────────────────────────────
    useEffect(() => {
        if (!gameMode) router.push('/');
    }, [gameMode, router]);

    // ── Redirect: game end → result ─────────────────────────────────────
    useEffect(() => {
        if (gameStatus === 'gameover' || gameStatus === 'complete') {
            router.push('/result');
        }
    }, [gameStatus, router]);

    // ── Timer interval with SFX ─────────────────────────────────────────
    useEffect(() => {
        if (gameStatus !== 'playing') return;
        intervalRef.current = setInterval(() => {
            const state = useGameStore.getState();
            if (state.isProcessing) return; // skip tick during processing

            // Countdown tick sound at ≤ 5 seconds
            if (state.timer <= 6 && state.timer > 1) playTick();
            // Crisis alert at 3 seconds in crisis mode
            if (state.timer === 3 && state.gameMode === 'crisis') playCrisisAlert();

            tickTimer();
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [scenarioIndex, gameStatus, tickTimer]);

    // ── Stability flash detection (Crisis mode only) ────────────────────
    useEffect(() => {
        if (stability < prevStability.current && gameMode === 'crisis') {
            setStabilityFlash(true);
            playCrisisAlert();
            const t = setTimeout(() => setStabilityFlash(false), 500);
            prevStability.current = stability;
            return () => clearTimeout(t);
        }
        prevStability.current = stability;
    }, [stability, gameMode]);

    // ── Choice handler with SFX and screen shake ────────────────────────
    const handleChoice = useCallback((choice: SceneChoice) => {
        if (isProcessing) return; // double-click guard
        if (intervalRef.current) clearInterval(intervalRef.current);

        const isGood = (choice.effects.score ?? 0) >= 20;

        if (isGood) {
            playCorrect();
            setTimeout(() => playXP(), 200);
        } else {
            playWrong();
            setShake(true);
            setTimeout(() => setShake(false), 400);
        }

        applyChoice(choice.effects, choice.nextScene);
    }, [applyChoice, isProcessing]);

    // ── Loading state ───────────────────────────────────────────────────
    if (!gameMode || !scene) {
        return (
            <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center">
                <p className="text-[10px] text-violet-400 animate-pulse">Loading…</p>
            </div>
        );
    }

    const modeLabel = gameMode === 'debug' ? '🔧 Circuit Debug Lab' : '🚨 IoT Crisis Mode';
    const modeColor = gameMode === 'debug' ? 'text-cyan-400' : 'text-red-400';

    return (
        <motion.div
            className="relative min-h-screen w-full overflow-hidden"
            animate={shake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
            transition={shake ? { duration: 0.4, ease: 'easeInOut' } : {}}
        >
            {/* ── Animated background ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={scene.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(/backgrounds/${scene.background})` }}
                />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

            {/* ── Red flash overlay (crisis stability drop) ────────────────── */}
            <AnimatePresence>
                {stabilityFlash && (
                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 bg-red-600/30 z-20 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* ── Top HUD ──────────────────────────────────────────────────── */}
                <header className="flex items-center justify-between px-3 sm:px-6 py-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <Timer value={timer} max={scene.timer} />
                        <div>
                            <p className={`text-[6px] sm:text-[7px] ${modeColor} uppercase tracking-wider`}>{modeLabel}</p>
                            <p className="text-[8px] sm:text-[9px] text-white mt-1">Q {scenarioIndex + 1} / {totalScenarios}</p>
                        </div>
                    </div>
                    <div className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="text-yellow-400 text-base sm:text-lg">★</span>
                        <span className="text-[9px] sm:text-[10px] text-white tabular-nums">{score}</span>
                        <XPPopup score={score} />
                    </div>
                </header>

                {/* ── Stats bar ────────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mx-2 sm:mx-6 mt-1"
                >
                    <div className={`grid ${gameMode === 'crisis' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10`}>
                        <SkillMeter label="Reasoning" value={reasoning} color="cyan" icon="🧠" />
                        <SkillMeter label="Efficiency" value={efficiency} color="amber" icon="⚡" />
                        <SkillMeter label="Power" value={powerAwareness} color="violet" icon="🔋" />
                        {gameMode === 'crisis' && <StabilityMeter value={stability} />}
                    </div>
                </motion.div>

                <div className="flex-1" />

                {/* ── Dialogue + choices ────────────────────────────────────────── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={scene.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="px-2 sm:px-6 pb-4 space-y-3"
                    >
                        <DialogueBox character={scene.character} dialogue={scene.dialogue} sceneId={scene.id} />
                        <ChoiceButtons
                            choices={scene.choices}
                            disabled={isProcessing}
                            onChoose={handleChoice}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
