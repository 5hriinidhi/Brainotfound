export function evaluateSubmission(code, testCases) {
    if (isCheating(code)) {
        return { accuracy: 0, bugs: 1, efficiency: 0, testResults: testCases.map(() => ({ passed: false, error: 'Forbidden code detected' })) };
    }

    let passed = 0;
    let bugs = 0;
    const testResults = [];

    try {
        // Safe evaluation context
        const solve = new Function('"use strict"; ' + code + '; return solve;')();

        testCases.forEach(test => {
            try {
                const result = solve(...test.input);
                const didPass = JSON.stringify(result) === JSON.stringify(test.output);
                if (didPass) passed++;
                testResults.push({
                    passed: didPass,
                    input: JSON.stringify(test.input),
                    expected: JSON.stringify(test.output),
                    actual: JSON.stringify(result),
                });
            } catch (e) {
                bugs++;
                testResults.push({
                    passed: false,
                    input: JSON.stringify(test.input),
                    expected: JSON.stringify(test.output),
                    actual: 'Runtime Error: ' + e.message,
                });
            }
        });
    } catch (e) {
        bugs++;
        testCases.forEach(test => {
            testResults.push({
                passed: false,
                input: JSON.stringify(test.input),
                expected: JSON.stringify(test.output),
                actual: 'Compile Error: ' + e.message,
            });
        });
    }

    const accuracy = testCases.length > 0 ? (passed / testCases.length) * 100 : 0;
    const efficiency = calculateEfficiency(code);

    return { accuracy, bugs, efficiency, testResults };
}

function calculateEfficiency(code) {
    let score = 100;
    // Length penalty
    score -= code.length * 0.2;
    // Loop usage penalty
    const loopCount = (code.match(/for|while/g) || []).length;
    score -= loopCount * 5;

    return Math.max(0, Math.round(score));
}

function isCheating(code) {
    const forbidden = [
        "eval(", "fetch(", "XMLHttpRequest", "window",
        "document", "localStorage", "while(true)", "for(;;)",
        "process", "require", "import"
    ];
    return forbidden.some(pattern => code.includes(pattern));
}