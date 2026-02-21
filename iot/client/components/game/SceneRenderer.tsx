'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import Timer from './Timer';
import DialogueBox from './DialogueBox';
import ChoiceButtons from './ChoiceButtons';
import SkillMeter from './SkillMeter';
import StabilityMeter from './StabilityMeter';
import { SceneChoice } from '@/types/game';

export default function SceneRenderer() {
    const {
        currentSceneId,
        reasoning,
        efficiency,
        powerAwareness,
        stability,
        timer,
        score,
        scenarioIndex,
        totalScenarios,
        gameMode,
        scenarios,
        tickTimer,
        applyChoice,
    } = useGameStore();

    // Find current scene from the shuffled pool
    const scene = scenarios[scenarioIndex];
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer countdown
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            tickTimer();
        }, 1000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [scenarioIndex, tickTimer]);

    if (!scene) return null;

    const handleChoice = (choice: SceneChoice) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        applyChoice(choice.effects, choice.nextScene);
    };

    const modeLabel = gameMode === 'debug' ? '🔧 Circuit Debug Lab' : '🚨 IoT Crisis Mode';
    const modeColor = gameMode === 'debug' ? 'text-cyan-400' : 'text-red-400';

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
                style={{ backgroundImage: `url(/backgrounds/${scene.background})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Top HUD */}
                <header className="flex items-center justify-between px-4 md:px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Timer value={timer} max={scene.timer} />
                        <div className="ml-1">
                            <p className={`font-pixel text-[7px] ${modeColor} uppercase tracking-wider`}>{modeLabel}</p>
                            <p className="font-pixel text-[9px] text-white mt-1">
                                Q {scenarioIndex + 1} / {totalScenarios}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="text-yellow-400 text-lg">★</span>
                        <span className="font-pixel text-[10px] text-white tabular-nums">{score}</span>
                    </div>
                </header>

                <div className="flex-1" />

                {/* Bottom Panel */}
                <div className="px-3 md:px-6 pb-4 space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
                        <SkillMeter label="Reasoning" value={reasoning} color="cyan" icon="🧠" />
                        <SkillMeter label="Efficiency" value={efficiency} color="amber" icon="⚡" />
                        <SkillMeter label="Power" value={powerAwareness} color="violet" icon="🔋" />
                        <StabilityMeter value={stability} />
                    </div>

                    {/* Dialogue */}
                    <DialogueBox character={scene.character} dialogue={scene.dialogue} sceneId={scene.id} />

                    {/* Choices */}
                    <ChoiceButtons choices={scene.choices} disabled={false} onChoose={handleChoice} />
                </div>
            </div>
        </div>
    );
}
