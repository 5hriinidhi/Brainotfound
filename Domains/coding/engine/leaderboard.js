let leaderboard = [];

export function updateLeaderboard(player) {
    leaderboard.push(player);
    leaderboard.sort((a, b) => b.rating - a.rating);
    return leaderboard;
}

export function getLeaderboard() {
    return leaderboard;
}