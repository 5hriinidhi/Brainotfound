export const developmentTemplates = [

    {
        id: "sum_numbers",
        difficulty: "easy",
        generate: () => {
            const a = randomInt(1, 50);
            const b = randomInt(1, 50);

            return {
                prompt: `Write a function solve(a, b) that returns the sum of ${a} and ${b}.`,
                testCases: [
                    { input: [a, b], output: a + b }
                ]
            };
        }
    },

    {
        id: "array_max",
        difficulty: "medium",
        generate: () => {
            const arr = Array.from({ length: 5 }, () =>
                randomInt(1, 100)
            );

            return {
                prompt: `Write a function solve(arr) that returns the maximum number in [${arr}].`,
                testCases: [
                    { input: [arr], output: Math.max(...arr) }
                ]
            };
        }
    },

    {
        id: "prime_check",
        difficulty: "hard",
        generate: () => {
            const num = randomInt(20, 100);

            return {
                prompt: `Write a function solve(n) that returns true if ${num} is prime.`,
                testCases: [
                    { input: [num], output: isPrime(num) }
                ]
            };
        }
    }
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPrime(n) {
    for (let i = 2; i < n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}