/**
 * Crisis Mode Page — /crisis route.
 * Shows MissionBriefing first, then loads the SequenceBuilder after "Start Mission".
 */
'use client';

import { useState } from 'react';
import SequenceBuilder from '@/components/game-ui/SequenceBuilder';
import MissionBriefing from '@/components/game-ui/MissionBriefing';
import { useCrisisStore } from '@/store/useCrisisStore';

export default function CrisisPage() {
    const [missionStarted, setMissionStarted] = useState(false);
    const startTimer = useCrisisStore((s) => s.startTimer);

    const handleStart = () => {
        setMissionStarted(true);
        startTimer();
    };

    if (!missionStarted) {
        return <MissionBriefing mode="crisis" onStart={handleStart} backgroundUrl="/backgrounds/EDGY.gif" />;
    }

    return <SequenceBuilder />;
}
