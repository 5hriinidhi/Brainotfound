/**
 * AdaptiveWarning — Animated popup shown when cursor inactivity is detected.
 * Displays "+10s" bonus notification and auto-dismisses after 3 seconds.
 */
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdaptiveWarningProps {
    show: boolean;
    onDismiss: () => void;
}

export default function AdaptiveWarning({ show, onDismiss }: AdaptiveWarningProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            const t = setTimeout(() => {
                setVisible(false);
                setTimeout(onDismiss, 400); // wait for exit animation
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [show, onDismiss]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
                >
                    <div className="relative px-5 py-3 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-900/90 via-amber-800/90 to-amber-900/90 backdrop-blur-md shadow-2xl shadow-amber-900/30">
                        {/* Animated glow border */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>

                        {/* Content */}
                        <div className="relative flex items-center gap-3">
                            {/* Pulsing warning icon */}
                            <motion.span
                                className="text-lg"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            >
                                ⚠️
                            </motion.span>

                            <div>
                                <p className="text-[9px] font-semibold text-amber-200 tracking-wide">
                                    Inactivity Detected
                                </p>
                                <p className="text-[7px] text-amber-300/80 mt-0.5">
                                    +10s added to your timer. Stay focused, Engineer!
                                </p>
                            </div>

                            {/* +10s badge */}
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                                className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600/80 border border-emerald-500/40"
                            >
                                <span className="text-[10px] font-bold text-emerald-100">+10s</span>
                            </motion.div>
                        </div>

                        {/* Auto-dismiss progress bar */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 3, ease: 'linear' }}
                            className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-400/50 origin-left rounded-b-xl"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
