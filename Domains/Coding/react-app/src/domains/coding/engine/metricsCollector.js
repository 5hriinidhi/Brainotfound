export function buildCodingMetrics({
    skill,
    avgAccuracy,
    avgSpeed,
    avgEfficiency,
    ratingChange,
    newRating
}) {
    return {
        domain: "coding",
        skill,
        performance: {
            accuracy: avgAccuracy,
            speed: avgSpeed,
            efficiency: avgEfficiency
        },
        rating: {
            change: ratingChange,
            newRating
        }
    };
}