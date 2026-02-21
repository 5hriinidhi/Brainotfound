'use client';

interface StabilityMeterProps {
    value: number;  // 0–100
}

export default function StabilityMeter({ value }: StabilityMeterProps) {
    const isLow = value < 30;
    const barColor =
        value > 60
            ? 'from-emerald-500 to-emerald-400'
            : value > 30
                ? 'from-amber-500 to-amber-400'
                : 'from-red-600 to-red-500';

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span
                    className={`text-xs font-semibold tracking-wider uppercase flex gap-1 items-center ${isLow ? 'text-red-400 animate-pulse' : 'text-zinc-300'
                        }`}
                >
                    🛡 Stability
                </span>
                <span className={`text-xs font-bold tabular-nums ${isLow ? 'text-red-400' : 'text-white'}`}>
                    {Math.round(value)}
                </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
                    style={{
                        width: `${value}%`,
                        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                        boxShadow: isLow ? '0 0 8px rgba(239,68,68,0.8)' : undefined,
                    }}
                />
            </div>
            {isLow && (
                <p className="mt-1 text-xs text-red-400 animate-pulse font-medium">
                    ⚠ CRITICAL — System at risk!
                </p>
            )}
        </div>
    );
}
