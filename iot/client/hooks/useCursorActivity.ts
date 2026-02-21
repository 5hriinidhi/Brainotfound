/**
 * useCursorActivity — Tracks mouse movement speed and detects "stuck" state.
 *
 * Monitors mousemove events, calculates rolling average speed over 5 seconds,
 * and triggers "stuck" when average speed stays below threshold for 7 seconds.
 *
 * Returns:
 *   - isStuck: boolean — true when cursor inactivity detected
 *   - resetStuck: () => void — call after handling the stuck event
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const SPEED_THRESHOLD = 5;       // px/sec — below this = inactive
const WINDOW_MS = 5000;          // rolling average window (5 seconds)
const STUCK_DURATION_MS = 7000;  // must be below threshold for 7 seconds

interface Point {
    x: number;
    y: number;
    t: number;
}

export function useCursorActivity(enabled: boolean = true) {
    const [isStuck, setIsStuck] = useState(false);
    const pointsRef = useRef<Point[]>([]);
    const stuckStartRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const resetStuck = useCallback(() => {
        setIsStuck(false);
        stuckStartRef.current = null;
    }, []);

    useEffect(() => {
        if (!enabled) {
            setIsStuck(false);
            stuckStartRef.current = null;
            return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            const now = performance.now();
            pointsRef.current.push({ x: e.clientX, y: e.clientY, t: now });

            // Keep only points within the rolling window
            const cutoff = now - WINDOW_MS;
            pointsRef.current = pointsRef.current.filter((p) => p.t >= cutoff);
        };

        const checkSpeed = () => {
            const now = performance.now();
            const points = pointsRef.current;
            const cutoff = now - WINDOW_MS;

            // Clean old points
            pointsRef.current = points.filter((p) => p.t >= cutoff);

            // Calculate total distance traveled in the window
            let totalDist = 0;
            const filtered = pointsRef.current;
            for (let i = 1; i < filtered.length; i++) {
                const dx = filtered[i].x - filtered[i - 1].x;
                const dy = filtered[i].y - filtered[i - 1].y;
                totalDist += Math.sqrt(dx * dx + dy * dy);
            }

            // Time span in seconds
            const timeSpan = filtered.length >= 2
                ? (filtered[filtered.length - 1].t - filtered[0].t) / 1000
                : WINDOW_MS / 1000;

            const avgSpeed = timeSpan > 0 ? totalDist / timeSpan : 0;

            if (avgSpeed < SPEED_THRESHOLD) {
                // Below threshold
                if (stuckStartRef.current === null) {
                    stuckStartRef.current = now;
                } else if (now - stuckStartRef.current >= STUCK_DURATION_MS) {
                    setIsStuck(true);
                }
            } else {
                // Active — reset stuck timer
                stuckStartRef.current = null;
            }

            rafRef.current = requestAnimationFrame(checkSpeed);
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        rafRef.current = requestAnimationFrame(checkSpeed);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [enabled]);

    return { isStuck, resetStuck };
}
