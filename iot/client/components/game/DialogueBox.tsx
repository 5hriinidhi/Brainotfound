'use client';

import { useEffect, useState } from 'react';

interface DialogueBoxProps {
    character?: string;
    dialogue: string;
    sceneId: string; // used to reset typewriter on scene change
}

export default function DialogueBox({ character, dialogue, sceneId }: DialogueBoxProps) {
    const [displayed, setDisplayed] = useState('');

    // Typewriter effect — reset and retype whenever scene/dialogue changes
    useEffect(() => {
        setDisplayed('');
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayed(dialogue.slice(0, i));
            if (i >= dialogue.length) clearInterval(interval);
        }, 22);
        return () => clearInterval(interval);
    }, [sceneId, dialogue]);

    return (
        <div className="w-full rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md p-5 shadow-2xl">
            <div className="mb-3">
                <span className="inline-block px-4 py-1 text-base font-bold tracking-widest uppercase rounded-full bg-violet-900/70 text-violet-300 border border-violet-700/50">
                    {character}
                </span>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-zinc-100 min-h-[5rem]">
                {displayed}
                <span className="animate-pulse text-violet-400">▌</span>
            </p>
        </div>
    );
}
