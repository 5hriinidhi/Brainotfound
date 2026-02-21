'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { motion } from 'framer-motion';

const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.15 + i * 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
    }),
};

export default function ModePage() {
    const router = useRouter();
    const startGame = useGameStore((s) => s.startGame);

    const handleSelect = (mode: 'debug' | 'crisis') => {
        startGame(mode);
        router.push('/game');
    };

    return (
        <main className="min-h-screen text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Full-screen background */}
            <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/backgrounds/mode-bg.png')" }} />
            <div className="fixed inset-0 bg-black/60" />
            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            <div className="relative z-10 w-full max-w-2xl space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <h1 className="font-pixel text-xl md:text-2xl bg-gradient-to-r from-white to-violet-400 bg-clip-text text-transparent">
                        Select Your Mode
                    </h1>
                    <p className="text-zinc-500 text-sm mt-3">Choose a challenge. 9 randomized scenarios await.</p>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Debug Mode */}
                    <motion.button
                        variants={cardVariant}
                        initial="hidden"
                        animate="visible"
                        custom={0}
                        whileHover={{ scale: 1.03, borderColor: 'rgba(34,211,238,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect('debug')}
                        className="cursor-pointer text-left p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors duration-200"
                    >
                        <div className="text-4xl mb-4">🔧</div>
                        <h2 className="font-pixel text-[11px] text-cyan-400 mb-3">Circuit Debug Lab</h2>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            Troubleshoot ESP32 resets, LED failures, sensor wiring, firmware crashes, and power issues.
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {['ESP32', 'GPIO', 'I2C', 'DHT', 'ADC', 'Power'].map((t) => (
                                <span key={t} className="px-2 py-0.5 text-[9px] rounded-full bg-cyan-900/30 text-cyan-300 border border-cyan-700/30">{t}</span>
                            ))}
                        </div>
                        <p className="font-pixel text-[7px] text-cyan-600 mt-4">9 Questions • Hardware Focus →</p>
                    </motion.button>

                    {/* Crisis Mode */}
                    <motion.button
                        variants={cardVariant}
                        initial="hidden"
                        animate="visible"
                        custom={1}
                        whileHover={{ scale: 1.03, borderColor: 'rgba(248,113,113,0.5)' }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSelect('crisis')}
                        className="cursor-pointer text-left p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors duration-200"
                    >
                        <div className="text-4xl mb-4">🚨</div>
                        <h2 className="font-pixel text-[11px] text-red-400 mb-3">IoT Crisis Mode</h2>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            Handle MQTT failures, network outages, spectrum interference, cloud auth, and gateway failures.
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {['MQTT', 'LoRa', 'TLS', 'Zigbee', 'Cloud', 'Modbus'].map((t) => (
                                <span key={t} className="px-2 py-0.5 text-[9px] rounded-full bg-red-900/30 text-red-300 border border-red-700/30">{t}</span>
                            ))}
                        </div>
                        <p className="font-pixel text-[7px] text-red-600 mt-4">9 Questions • Network + System →</p>
                    </motion.button>
                </div>

                {/* Back */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center"
                >
                    <button
                        onClick={() => router.push('/')}
                        className="font-pixel text-[8px] text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                    >
                        ← Back to Arena
                    </button>
                </motion.div>
            </div>
        </main>
    );
}
