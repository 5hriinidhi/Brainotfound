/**
 * PerformanceCertificate — Exportable gaming-themed certificate
 * rendered as a styled DOM element and captured via html2canvas-pro.
 */
'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas-pro';
import { playPowerUp } from '@/utils/soundEngine';

interface CertificateProps {
    playerName: string;
    mode: 'debug' | 'crisis';
    score: number;
    maxScore: number;
    rank: { title: string; color: string; emoji: string };
    grade: string;
    reasoning: number;
    efficiency: number;
    powerOrStability: number;
    timeManagement: number;
    totalXP: number;
    date: string;
}

export default function PerformanceCertificate(props: CertificateProps) {
    const certRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);
    const pct = props.maxScore > 0 ? Math.round((props.score / props.maxScore) * 100) : 0;

    const handleExport = async () => {
        if (!certRef.current || exporting) return;
        setExporting(true);
        playPowerUp();

        try {
            const canvas = await html2canvas(certRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement('a');
            link.download = `BrainNotFound_Certificate_${props.playerName || 'Engineer'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Certificate export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    const modeLabel = props.mode === 'debug' ? 'Circuit Debug Lab' : 'Crisis Mode';
    const modeIcon = props.mode === 'debug' ? '🔧' : '🚨';

    return (
        <div className="space-y-3">
            {/* ── Certificate card ──────────────────────────────────────── */}
            <div
                ref={certRef}
                style={{
                    width: '600px',
                    minHeight: '400px',
                    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 30%, #24243e 60%, #0f0c29 100%)',
                    fontFamily: '"Segoe UI", system-ui, sans-serif',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    padding: '36px',
                    color: '#fff',
                }}
            >
                {/* Corner decorations */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '120px', height: '120px',
                    borderTop: '3px solid rgba(167,139,250,0.5)', borderLeft: '3px solid rgba(167,139,250,0.5)',
                    borderRadius: '16px 0 0 0',
                }} />
                <div style={{
                    position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
                    borderTop: '3px solid rgba(6,182,212,0.5)', borderRight: '3px solid rgba(6,182,212,0.5)',
                    borderRadius: '0 16px 0 0',
                }} />
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, width: '120px', height: '120px',
                    borderBottom: '3px solid rgba(6,182,212,0.5)', borderLeft: '3px solid rgba(6,182,212,0.5)',
                    borderRadius: '0 0 0 16px',
                }} />
                <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: '120px', height: '120px',
                    borderBottom: '3px solid rgba(167,139,250,0.5)', borderRight: '3px solid rgba(167,139,250,0.5)',
                    borderRadius: '0 0 16px 0',
                }} />

                {/* Background circuit pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.03,
                    backgroundImage: `
                        linear-gradient(rgba(167,139,250,1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }} />

                {/* Glow accent */}
                <div style={{
                    position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
                    width: '300px', height: '300px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
                }} />

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    {/* Header */}
                    <div style={{ fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', color: '#a78bfa', marginBottom: '4px' }}>
                        ⚡ IoT BrainNotFound ⚡
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px', letterSpacing: '2px' }}>
                        CERTIFICATE OF ACHIEVEMENT
                    </div>
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginBottom: '20px' }}>
                        {modeIcon} {modeLabel}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)', margin: '0 auto 20px' }} />

                    {/* Congratulations */}
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px' }}>This certifies that</div>
                    <div style={{
                        fontSize: '26px', fontWeight: 700,
                        background: 'linear-gradient(135deg, #e0e7ff, #a78bfa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        marginBottom: '6px',
                    }}>
                        {props.playerName || 'IoT Engineer'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
                        has demonstrated exceptional diagnostic skills in the<br />
                        IoT Diagnostic Arena — {modeLabel}
                    </div>

                    {/* Rank + Score row */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '20px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', marginBottom: '2px' }}>{props.rank.emoji}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: props.rank.color }}>{props.rank.title}</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: props.rank.color }}>{pct}%</div>
                            <div style={{ fontSize: '9px', color: '#71717a' }}>Accuracy</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#a78bfa' }}>{props.grade}</div>
                            <div style={{ fontSize: '9px', color: '#71717a' }}>Grade</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#06b6d4' }}>{props.totalXP}</div>
                            <div style={{ fontSize: '9px', color: '#71717a' }}>XP</div>
                        </div>
                    </div>

                    {/* Skill bars */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
                        {[
                            { label: 'Reasoning', value: props.reasoning, color: '#06b6d4' },
                            { label: 'Efficiency', value: props.efficiency, color: '#f59e0b' },
                            { label: props.mode === 'debug' ? 'Power' : 'Stability', value: props.powerOrStability, color: '#a78bfa' },
                            { label: 'Time Mgmt', value: props.timeManagement, color: '#34d399' },
                        ].map((s) => (
                            <div key={s.label} style={{ width: '100px', textAlign: 'center' }}>
                                <div style={{ fontSize: '7px', color: '#71717a', marginBottom: '3px' }}>{s.label}</div>
                                <div style={{
                                    height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: '3px', width: `${s.value}%`,
                                        background: s.color,
                                    }} />
                                </div>
                                <div style={{ fontSize: '8px', color: s.color, marginTop: '2px', fontWeight: 600 }}>{s.value}%</div>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '200px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)', margin: '0 auto 12px' }} />

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
                        <div style={{ fontSize: '7px', color: '#52525b' }}>
                            🗓 {props.date}
                        </div>
                        <div style={{ fontSize: '7px', color: '#52525b' }}>
                            IoT Diagnostic Arena • BrainNotFound
                        </div>
                        <div style={{ fontSize: '7px', color: '#52525b' }}>
                            🎮 Verified Achievement
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Export Button ─────────────────────────────────────────── */}
            <motion.button
                onClick={handleExport}
                disabled={exporting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full text-[8px] px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white tracking-wider shadow-lg shadow-violet-800/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">
                    {exporting ? '⏳ Generating...' : '📜 Download Certificate'}
                </span>
            </motion.button>
        </div>
    );
}
