export function findOpponent(playerRating) {
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    return {
        name: "AI Opponent",
        rating: playerRating + randomInt(-100, 100),
        skillLevel: randomInt(60, 95),
        avgSpeed: randomInt(20, 50),
        efficiency: randomInt(60, 95)
    };
}