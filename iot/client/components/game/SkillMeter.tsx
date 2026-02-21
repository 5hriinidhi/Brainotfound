'use client';

interface SkillMeterProps {
    label: string;
    value: number;      // 0–100
    color?: string;     // tailwind color name
    icon?: string;
}

export default function SkillMeter({ label, value, color = 'violet', icon }: SkillMeterProps) {
    const colorMap: Record<string, { bar: string; glow: string }> = {
        violet: { bar: 'from-violet-500 to-violet-400', glow: 'shadow-violet-500/40' },
        cyan: { bar: 'from-cyan-500 to-cyan-400', glow: 'shadow-cyan-500/40' },
        amber: { bar: 'from-amber-500 to-amber-400', glow: 'shadow-amber-500/40' },
    };
    const c = colorMap[color] ?? colorMap.violet;

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-zinc-300 tracking-wider uppercase flex gap-1 items-center">
                    {icon && <span>{icon}</span>}
                    {label}
                </span>
                <span className="text-xs font-bold text-white tabular-nums">{Math.round(value)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${c.bar} shadow-sm ${c.glow}`}
                    style={{ width: `${value}%`, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }}
                />
            </div>
        </div>
    );
}
