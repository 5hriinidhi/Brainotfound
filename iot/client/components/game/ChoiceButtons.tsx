'use client';

import { SceneChoice } from '@/types/game';

interface ChoiceButtonsProps {
    choices: SceneChoice[];
    disabled?: boolean;
    onChoose: (choice: SceneChoice) => void;
}

export default function ChoiceButtons({ choices, disabled, onChoose }: ChoiceButtonsProps) {
    return (
        <div className="flex flex-col gap-3 w-full">
            {choices.map((choice, i) => (
                <button
                    key={i}
                    onClick={() => onChoose(choice)}
                    disabled={disabled}
                    className={`
            group relative w-full text-left px-6 py-5 rounded-xl border text-lg font-medium
            transition-all duration-200
            ${disabled
                            ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/10 text-zinc-500'
                            : 'cursor-pointer bg-white/5 border-white/10 text-zinc-200 hover:bg-violet-900/40 hover:border-violet-500/60 hover:text-white hover:shadow-lg hover:shadow-violet-900/30 active:scale-[0.98]'
                        }
          `}
                >
                    {/* Choice number badge */}
                    <span className="inline-flex items-center justify-center w-8 h-8 mr-4 rounded-full bg-violet-700/50 text-violet-300 text-sm font-bold border border-violet-600/40">
                        {i + 1}
                    </span>
                    {choice.text}

                    {/* Hover arrow */}
                    {!disabled && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-violet-400">
                            →
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
