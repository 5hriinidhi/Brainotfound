/**
 * Circuit Builder Page — /circuit route.
 * Shows MissionBriefing first, then loads the CircuitBuilder after "Start Mission".
 */
'use client';

import { useState } from 'react';
import CircuitBuilder from '@/components/game-ui/CircuitBuilder';
import MissionBriefing from '@/components/game-ui/MissionBriefing';
import { useCircuitStore } from '@/store/useCircuitStore';

export default function CircuitPage() {
    const [missionStarted, setMissionStarted] = useState(false);
    const startTimer = useCircuitStore((s) => s.startTimer);

    const handleStart = () => {
        setMissionStarted(true);
        startTimer();
    };

    if (!missionStarted) {
        return <MissionBriefing mode="debug" onStart={handleStart} />;
    }

    return <CircuitBuilder />;
}
