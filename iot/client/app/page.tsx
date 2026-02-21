'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { playSwoosh } from '@/utils/soundEngine';

// ── Floating IoT icons ───────────────────────────────────────────────────────
const FLOATING_ICONS = ['📡', '🔌', '⚡', '🛡', '🔧', '📶', '🧠', '💡', '🔋', '⏱', '🌐', '🖥'];

function FloatingIcons() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {FLOATING_ICONS.map((icon, i) => (
        <motion.span
          key={i}
          className="absolute text-lg sm:text-xl opacity-[0.06]"
          initial={{
            x: `${10 + (i * 7) % 80}vw`,
            y: `${110}vh`,
          }}
          animate={{
            y: '-10vh',
            x: `${10 + (i * 7) % 80 + Math.sin(i) * 5}vw`,
            rotate: [0, 360],
          }}
          transition={{
            duration: 18 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'linear',
          }}
        >
          {icon}
        </motion.span>
      ))}
    </div>
  );
}

// ── Typing effect ────────────────────────────────────────────────────────────
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let idx = 0;
    const iv = setInterval(() => {
      idx++;
      setDisplayed(text.slice(0, idx));
      if (idx >= text.length) clearInterval(iv);
    }, 50);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="text-violet-400"
        >|</motion.span>
      )}
    </span>
  );
}

// ── Animated grid lines ──────────────────────────────────────────────────────
function GridPulse() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Horizontal scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent"
        initial={{ top: '-5%' }}
        animate={{ top: '105%' }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
      {/* Vertical scanning line */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-500/15 to-transparent"
        initial={{ left: '-5%' }}
        animate={{ left: '105%' }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear', delay: 2 }}
      />
    </div>
  );
}

// ── Main animations ──────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(139,92,246,0)',
      '0 0 30px rgba(139,92,246,0.3)',
      '0 0 0px rgba(139,92,246,0)',
    ],
  },
  transition: { duration: 3, repeat: Infinity },
};

export default function Home() {
  // Play swoosh on mount
  useEffect(() => {
    const t = setTimeout(() => playSwoosh(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="min-h-screen text-white flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Full-screen background */}
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/backgrounds/hero-bg.png')" }} />
      <div className="fixed inset-0 bg-black/65" />
      <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

      {/* Animated effects */}
      <FloatingIcons />
      <GridPulse />

      <div className="relative z-10 w-full max-w-xl text-center space-y-8">
        {/* Badge */}
        <motion.span
          variants={fadeUp}
          initial="hidden"
          custom={0}
          className="inline-block px-5 py-2 text-[7px] tracking-[0.2em] uppercase rounded-full bg-violet-900/60 text-violet-300 ring-1 ring-violet-700/50 backdrop-blur-sm"
          {...pulseGlow}
        >
          ⚡ IoT BrainNotFound ⚡
        </motion.span>

        {/* Title with typing effect */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-2xl md:text-4xl bg-gradient-to-br from-white via-violet-200 to-violet-500 bg-clip-text text-transparent leading-relaxed drop-shadow-lg"
        >
          <TypingText text="IoT Diagnostic" delay={400} />
          <br />
          <TypingText text="Arena" delay={1200} />
        </motion.h1>

        {/* Animated subtitle */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-zinc-300 text-[9px] max-w-md mx-auto leading-relaxed drop-shadow-md"
        >
          Test your IoT knowledge across two challenging modes.
          Diagnose hardware faults or manage network crises under pressure.
        </motion.p>

        {/* Buttons with hover glow */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col gap-3 items-center pt-2"
        >
          <Link href="/circuit" className="w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(6,182,212,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full text-[8px] px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white tracking-wider shadow-lg shadow-cyan-800/40 transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">🔧 Enter Circuit Debug Lab</span>
            </motion.button>
          </Link>

          <Link href="/crisis" className="w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(239,68,68,0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full text-[8px] px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white tracking-wider shadow-lg shadow-red-800/40 transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">🚨 Enter Crisis Mode</span>
            </motion.button>
          </Link>

          <Link href="/arena" className="w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(168,85,247,0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full text-[8px] px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white tracking-wider shadow-lg shadow-violet-800/40 transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden group border border-violet-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">⚔️ 1v1 Arena</span>
            </motion.button>
          </Link>

          <Link href="/leaderboard" className="w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="w-full text-[8px] px-8 py-4 rounded-xl bg-white/10 border border-white/20 text-zinc-300 tracking-wider transition-all duration-300 cursor-pointer backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">🏆 Leaderboard</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Animated stat pills */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex flex-wrap gap-2 justify-center pt-4"
        >
          {[
            { emoji: '🧠', label: 'Reasoning', color: 'border-cyan-700/30' },
            { emoji: '⚡', label: 'Efficiency', color: 'border-amber-700/30' },
            { emoji: '🔋', label: 'Power', color: 'border-violet-700/30' },
            { emoji: '🛡', label: 'Stability', color: 'border-emerald-700/30' },
          ].map((s, i) => (
            <motion.span
              key={s.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.1, borderColor: 'rgba(255,255,255,0.3)' }}
              className={`px-3 py-1 text-[7px] rounded-full bg-black/40 border ${s.color} text-zinc-400 backdrop-blur-sm cursor-default transition-colors`}
            >
              {s.emoji} {s.label}
            </motion.span>
          ))}
        </motion.div>

        {/* Version tag */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="text-[5px] text-zinc-700 pt-4"
        >
          BrainNotFound v1.0 • Built for IoT Engineers
        </motion.p>
      </div>
    </main>
  );
}
