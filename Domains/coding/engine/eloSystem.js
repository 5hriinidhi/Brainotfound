export function calculateELO(playerRating, opponentRating, result, kFactor = 32) {

    const expectedScore =
        1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

    const newRating =
        playerRating + kFactor * (result - expectedScore);

    return Math.round(newRating);
}