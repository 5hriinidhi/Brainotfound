import { create } from 'zustand';

export const useCodingStore = create((set, get) => ({
  // Player Profile
  playerName: "Ajinkya",
  ratings: {
    development: 1200,
    cybersecurity: 1200,
  },

  // Match History (for leaderboard & analytics)
  matchHistory: [],
  eloHistory: {
    development: [{ rating: 1200, date: Date.now() }],
    cybersecurity: [{ rating: 1200, date: Date.now() }],
  },

  // Current Duel State
  currentDuel: null,
  leaderboard: [],

  // Friendly Duel State
  friendDuel: {
    isHost: false,
    lobbyCode: null,
    opponentName: null,
  },

  // Actions
  updateRating: (skill, newRating) => set((state) => ({
    ratings: { ...state.ratings, [skill]: newRating },
    eloHistory: {
      ...state.eloHistory,
      [skill]: [
        ...state.eloHistory[skill],
        { rating: newRating, date: Date.now() },
      ],
    },
  })),

  addMatchResult: (matchData) => set((state) => ({
    matchHistory: [
      {
        id: Date.now(),
        date: Date.now(),
        ...matchData,
      },
      ...state.matchHistory,
    ].slice(0, 50), // Keep last 50 matches
  })),

  getStats: () => {
    const state = get();
    const history = state.matchHistory;
    if (history.length === 0) {
      return {
        totalMatches: 0, wins: 0, losses: 0, draws: 0,
        winRate: 0, avgAccuracy: 0, avgEfficiency: 0,
        bestStreak: 0, currentStreak: 0,
      };
    }

    const wins = history.filter(m => m.result === 'win').length;
    const losses = history.filter(m => m.result === 'loss').length;
    const draws = history.filter(m => m.result === 'draw').length;
    const avgAccuracy = Math.round(history.reduce((s, m) => s + (m.accuracy || 0), 0) / history.length);
    const avgEfficiency = Math.round(history.reduce((s, m) => s + (m.efficiency || 0), 0) / history.length);

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    for (const m of history) {
      if (m.result === 'win') { streak++; bestStreak = Math.max(bestStreak, streak); }
      else { streak = 0; }
    }
    currentStreak = 0;
    for (const m of history) {
      if (m.result === 'win') currentStreak++;
      else break;
    }

    return {
      totalMatches: history.length, wins, losses, draws,
      winRate: Math.round((wins / history.length) * 100),
      avgAccuracy, avgEfficiency, bestStreak, currentStreak,
    };
  },

  startDuel: (skill, opponent) => set({
    currentDuel: {
      skill, opponent, rounds: [], currentRound: 1,
      playerScore: 0, opponentScore: 0, adaptiveLevel: 2,
    },
  }),

  endDuel: () => set({ currentDuel: null }),

  setLobby: (code, isHost, opponent = "Challenger") => set({
    friendDuel: { lobbyCode: code, isHost, opponentName: opponent },
  }),

  clearLobby: () => set({
    friendDuel: { isHost: false, lobbyCode: null, opponentName: null },
  }),
}));