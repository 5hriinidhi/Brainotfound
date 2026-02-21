'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface XPPopupProps {
    score: number; // current score — changes trigger the popup
}

export default function XPPopup({ score }: XPPopupProps) {
    const [delta, setDelta] = useState<number | null>(null);
    const [prev, setPrev] = useState(score);
    const [key, setKey] = useState(0);

    useEffect(() => {
        const diff = score - prev;
        if (diff > 0) {
            setDelta(diff);
            setKey((k) => k + 1);
        }
        setPrev(score);
    }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AnimatePresence>
            {delta !== null && (
                <motion.div
                    key={key}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -40, scale: 1.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    onAnimationComplete={() => setDelta(null)}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-yellow-300 pointer-events-none whitespace-nowrap z-50 drop-shadow-lg"
                >
                    +{delta} pts
                </motion.div>
            )}
        </AnimatePresence>
    );
}
