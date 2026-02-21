export function evaluateSubmission(code, testCases) {

    if (isCheating(code)) {
        return { accuracy: 0, bugs: 1, efficiency: 0 };
    }

    let accuracy = 0;
    let bugs = 0;
    let passed = 0;

    try {

        const safeFunction =
            new Function('"use strict"; ' + code + '; return solve;')();

        testCases.forEach(test => {

            const result = safeFunction(...test.input);

            if (JSON.stringify(result) === JSON.stringify(test.output)) {
                passed++;
            }
        });

        accuracy = (passed / testCases.length) * 100;

    } catch {
        bugs++;
    }

    const efficiency = calculateEfficiency(code);

    return { accuracy, bugs, efficiency };
}

function calculateEfficiency(code) {

    let score = 100;

    score -= code.length * 0.2;

    const loopCount = (code.match(/for|while/g) || []).length;
    score -= loopCount * 5;

    if (score < 0) score = 0;

    return Math.round(score);
}

function isCheating(code) {

    const forbidden = [
        "eval(",
        "fetch(",
        "XMLHttpRequest",
        "window",
        "document",
        "localStorage",
        "while(true)",
        "for(;;)"
    ];

    return forbidden.some(pattern => code.includes(pattern));
}