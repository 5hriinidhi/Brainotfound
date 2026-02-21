'use client';

interface TimerProps {
    value: number;       // current seconds remaining
    max: number;         // scene's original timer value
}

export default function Timer({ value, max }: TimerProps) {
    const SIZE = 80;
    const STROKE = 6;
    const R = (SIZE - STROKE) / 2;
    const CIRC = 2 * Math.PI * R;
    const progress = max > 0 ? value / max : 0;
    const dashOffset = CIRC * (1 - progress);

    const color =
        progress > 0.5 ? '#34d399' : progress > 0.25 ? '#fbbf24' : '#f87171';

    return (
        <div className="relative flex items-center justify-center">
            <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={STROKE}
                />
                {/* Progress */}
                <circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth={STROKE}
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
            </svg>
            {/* Label */}
            <span
                className="absolute text-lg font-bold tabular-nums"
                style={{ color, textShadow: `0 0 10px ${color}` }}
            >
                {value}
            </span>
        </div>
    );
}
