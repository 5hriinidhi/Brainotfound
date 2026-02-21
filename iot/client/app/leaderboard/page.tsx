'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';

interface LeaderboardUser {
    _id: string;
    username: string;
    totalXP: number;
    bestScore: number;
    eloRating: number;
}

function getRankBadge(elo: number) {
    if (elo >= 1200) return { title: 'Elite', color: 'text-violet-400', bg: 'bg-violet-900/30 border-violet-700/30' };
    if (elo >= 1100) return { title: 'Gold', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/30' };
    if (elo >= 1000) return { title: 'Silver', color: 'text-zinc-300', bg: 'bg-zinc-800/30 border-zinc-600/30' };
    return { title: 'Bronze', color: 'text-amber-500', bg: 'bg-amber-900/30 border-amber-700/30' };
}

const podiumEmoji = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
    const router = useRouter();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await api.get('/api/leaderboard');
                setUsers(data.leaderboard);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    return (
        <main className="min-h-screen text-white flex flex-col items-center px-4 py-12 relative overflow-hidden">
            {/* Full-screen background image */}
            <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/backgrounds/leaderboard-bg.jpeg')" }} />
            <div className="fixed inset-0 bg-black/70" />
            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

            <div className="relative z-10 w-full max-w-lg space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-2"
                >
                    <p className="text-4xl">🏆</p>
                    <h1 className="text-lg text-yellow-400">Leaderboard</h1>
                    <p className="text-[7px] text-zinc-500 uppercase tracking-wider">Top 10 IoT Engineers by ELO Rating</p>
                </motion.div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[7px] text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2 text-center">ELO</div>
                    <div className="col-span-2 text-center">Best</div>
                    <div className="col-span-3 text-right">XP</div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="text-center py-12">
                        <p className="text-[9px] text-violet-400 animate-pulse">Loading rankings…</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && users.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 space-y-3"
                    >
                        <p className="text-3xl">👻</p>
                        <p className="text-[9px] text-zinc-500">No scores yet. Be the first!</p>
                    </motion.div>
                )}

                {/* Rows */}
                <div className="space-y-2">
                    {users.map((user, i) => {
                        const badge = getRankBadge(user.eloRating);
                        return (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl border transition-colors ${i < 3
                                    ? 'bg-white/5 border-white/10 shadow-lg'
                                    : 'bg-white/[0.02] border-white/5'
                                    }`}
                            >
                                {/* Rank */}
                                <div className="col-span-1 text-[10px]">
                                    {i < 3 ? podiumEmoji[i] : <span className="text-zinc-600">{i + 1}</span>}
                                </div>

                                {/* Username + Badge */}
                                <div className="col-span-4">
                                    <p className="text-[9px] text-white truncate">{user.username}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 text-[6px] rounded-full border ${badge.bg} ${badge.color}`}>
                                        {badge.title}
                                    </span>
                                </div>

                                {/* ELO */}
                                <div className="col-span-2 text-center">
                                    <p className="text-[10px] text-violet-400 tabular-nums">{user.eloRating}</p>
                                </div>

                                {/* Best Score */}
                                <div className="col-span-2 text-center">
                                    <p className="text-[10px] text-emerald-400 tabular-nums">{user.bestScore}</p>
                                </div>

                                {/* XP */}
                                <div className="col-span-3 text-right">
                                    <p className="text-[10px] text-amber-400 tabular-nums">{user.totalXP.toLocaleString()} XP</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Back */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex justify-center gap-4 pt-4"
                >
                    <button
                        onClick={() => router.push('/mode')}
                        className="text-[8px] px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all active:scale-95 cursor-pointer"
                    >
                        🎮 Play
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="text-[8px] px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-500 border border-white/10 transition-all active:scale-95 cursor-pointer"
                    >
                        ← Home
                    </button>
                </motion.div>
            </div>
        </main>
    );
}
