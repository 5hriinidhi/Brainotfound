const questionBank = {
    development: {
        easy: [
            {
                title: "Sum of Numbers",
                prompt: "Given an integer `n`, return the sum of all integers from `1` to `n`.",
                examples: [
                    { input: "n = 5", output: "15", explanation: "1 + 2 + 3 + 4 + 5 = 15" },
                    { input: "n = 10", output: "55" },
                    { input: "n = 1", output: "1" },
                ],
                constraints: ["1 <= n <= 10^4"],
                functionSignature: {
                    javascript: "function solve(n) {\n  // Write your code here\n}",
                    python: "def solve(n):\n    # Write your code here\n    pass",
                    cpp: "int solve(int n) {\n    // Write your code here\n    return 0;\n}",
                    java: "public static int solve(int n) {\n    // Write your code here\n    return 0;\n}",
                },
                testCases: [
                    { input: [5], output: 15 },
                    { input: [10], output: 55 },
                    { input: [1], output: 1 },
                    { input: [100], output: 5050 },
                ],
            },
            {
                title: "Reverse String",
                prompt: "Given a string `s`, return the reversed string.",
                examples: [
                    { input: 's = "hello"', output: '"olleh"' },
                    { input: 's = "world"', output: '"dlrow"' },
                ],
                constraints: ["1 <= s.length <= 10^4", "s consists of printable ASCII characters"],
                functionSignature: {
                    javascript: "function solve(s) {\n  // Write your code here\n}",
                    python: "def solve(s):\n    # Write your code here\n    pass",
                    cpp: "string solve(string s) {\n    // Write your code here\n    return \"\";\n}",
                    java: "public static String solve(String s) {\n    // Write your code here\n    return \"\";\n}",
                },
                testCases: [
                    { input: ["hello"], output: "olleh" },
                    { input: ["world"], output: "dlrow" },
                    { input: ["a"], output: "a" },
                    { input: ["racecar"], output: "racecar" },
                ],
            },
            {
                title: "Find Maximum",
                prompt: "Given an array of integers `nums`, return the maximum element.",
                examples: [
                    { input: "nums = [3, 1, 4, 1, 5]", output: "5" },
                    { input: "nums = [-1, -5, -2]", output: "-1" },
                ],
                constraints: ["1 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4"],
                functionSignature: {
                    javascript: "function solve(nums) {\n  // Write your code here\n}",
                    python: "def solve(nums):\n    # Write your code here\n    pass",
                    cpp: "int solve(vector<int> nums) {\n    // Write your code here\n    return 0;\n}",
                    java: "public static int solve(int[] nums) {\n    // Write your code here\n    return 0;\n}",
                },
                testCases: [
                    { input: [[3, 1, 4, 1, 5]], output: 5 },
                    { input: [[-1, -5, -2]], output: -1 },
                    { input: [[42]], output: 42 },
                ],
            },
        ],
        medium: [
            {
                title: "Second Largest Element",
                prompt: "Given an array of integers `nums`, return the second largest element. You may assume the array has at least 2 distinct elements.",
                examples: [
                    { input: "nums = [3, 1, 4, 1, 5]", output: "4", explanation: "The largest is 5, second largest is 4" },
                    { input: "nums = [10, 20, 30]", output: "20" },
                ],
                constraints: ["2 <= nums.length <= 10^4", "Array has at least 2 distinct values"],
                functionSignature: {
                    javascript: "function solve(nums) {\n  // Write your code here\n}",
                    python: "def solve(nums):\n    # Write your code here\n    pass",
                    cpp: "int solve(vector<int> nums) {\n    // Write your code here\n    return 0;\n}",
                    java: "public static int solve(int[] nums) {\n    // Write your code here\n    return 0;\n}",
                },
                testCases: [
                    { input: [[3, 1, 4, 1, 5]], output: 4 },
                    { input: [[10, 20, 30]], output: 20 },
                    { input: [[1, 2]], output: 1 },
                ],
            },
            {
                title: "Palindrome Check",
                prompt: "Given a string `s`, determine if it is a palindrome. Return `true` if it reads the same forward and backward, `false` otherwise. Consider only alphanumeric characters and ignore case.",
                examples: [
                    { input: 's = "racecar"', output: "true" },
                    { input: 's = "hello"', output: "false" },
                    { input: 's = "A man a plan a canal Panama"', output: "true", explanation: "After removing spaces and ignoring case" },
                ],
                constraints: ["1 <= s.length <= 10^4", "s consists of printable ASCII characters"],
                functionSignature: {
                    javascript: "function solve(s) {\n  // Write your code here\n}",
                    python: "def solve(s):\n    # Write your code here\n    pass",
                    cpp: "bool solve(string s) {\n    // Write your code here\n    return false;\n}",
                    java: "public static boolean solve(String s) {\n    // Write your code here\n    return false;\n}",
                },
                testCases: [
                    { input: ["racecar"], output: true },
                    { input: ["hello"], output: false },
                    { input: ["madam"], output: true },
                ],
            },
            {
                title: "Two Sum",
                prompt: "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume each input has exactly one solution, and you may not use the same element twice. Return the answer as an array `[i, j]` where `i < j`.",
                examples: [
                    { input: "nums = [2, 7, 11, 15], target = 9", output: "[0, 1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
                    { input: "nums = [3, 2, 4], target = 6", output: "[1, 2]" },
                ],
                constraints: ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "Exactly one valid answer exists"],
                functionSignature: {
                    javascript: "function solve(nums, target) {\n  // Write your code here\n}",
                    python: "def solve(nums, target):\n    # Write your code here\n    pass",
                    cpp: "vector<int> solve(vector<int> nums, int target) {\n    // Write your code here\n    return {};\n}",
                    java: "public static int[] solve(int[] nums, int target) {\n    // Write your code here\n    return new int[]{};\n}",
                },
                testCases: [
                    { input: [[2, 7, 11, 15], 9], output: [0, 1] },
                    { input: [[3, 2, 4], 6], output: [1, 2] },
                    { input: [[3, 3], 6], output: [0, 1] },
                ],
            },
        ],
        hard: [
            {
                title: "Longest Increasing Subsequence",
                prompt: "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.",
                examples: [
                    { input: "nums = [10, 9, 2, 5, 3, 7, 101, 18]", output: "4", explanation: "The LIS is [2, 3, 7, 101]" },
                    { input: "nums = [0, 1, 0, 3, 2, 3]", output: "4" },
                    { input: "nums = [7, 7, 7]", output: "1" },
                ],
                constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
                functionSignature: {
                    javascript: "function solve(nums) {\n  // Write your code here\n}",
                    python: "def solve(nums):\n    # Write your code here\n    pass",
                    cpp: "int solve(vector<int> nums) {\n    // Write your code here\n    return 0;\n}",
                    java: "public static int solve(int[] nums) {\n    // Write your code here\n    return 0;\n}",
                },
                testCases: [
                    { input: [[10, 9, 2, 5, 3, 7, 101, 18]], output: 4 },
                    { input: [[0, 1, 0, 3, 2, 3]], output: 4 },
                    { input: [[7, 7, 7]], output: 1 },
                ],
            },
            {
                title: "Staircase Climbing",
                prompt: "You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.",
                examples: [
                    { input: "n = 2", output: "2", explanation: "1+1 or 2" },
                    { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, or 2+1" },
                ],
                constraints: ["1 <= n <= 45"],
                functionSignature: {
                    javascript: "function solve(n) {\n  // Write your code here\n}",
                    python: "def solve(n):\n    # Write your code here\n    pass",
                    cpp: "int solve(int n) {\n    // Write your code here\n    return 0;\n}",
                    java: "public static int solve(int n) {\n    // Write your code here\n    return 0;\n}",
                },
                testCases: [
                    { input: [2], output: 2 },
                    { input: [3], output: 3 },
                    { input: [5], output: 8 },
                ],
            },
        ],
    },
    cybersecurity: {
        easy: [
            {
                title: "Caesar Cipher",
                prompt: "Encode a string using a Caesar cipher with a shift of 3. Only shift lowercase letters `a-z`, wrapping around from `z` to `a`.",
                examples: [
                    { input: 's = "abc"', output: '"def"' },
                    { input: 's = "xyz"', output: '"abc"', explanation: "x→a, y→b, z→c (wraps around)" },
                ],
                constraints: ["1 <= s.length <= 10^4", "s consists of lowercase English letters"],
                functionSignature: {
                    javascript: "function solve(s) {\n  // Write your code here\n}",
                    python: "def solve(s):\n    # Write your code here\n    pass",
                    cpp: "string solve(string s) {\n    // Write your code here\n    return \"\";\n}",
                    java: "public static String solve(String s) {\n    // Write your code here\n    return \"\";\n}",
                },
                testCases: [
                    { input: ["abc"], output: "def" },
                    { input: ["xyz"], output: "abc" },
                    { input: ["hello"], output: "khoor" },
                ],
            },
        ],
        medium: [
            {
                title: "SQL Injection Detector",
                prompt: "Given a string `input`, detect if it contains a SQL injection pattern. Return `true` if it contains patterns like `' OR`, `1=1`, `--`, or `' OR ''='`.",
                examples: [
                    { input: `input = "admin' OR 1=1--"`, output: "true" },
                    { input: `input = "normaluser"`, output: "false" },
                ],
                constraints: ["1 <= input.length <= 10^4"],
                functionSignature: {
                    javascript: "function solve(input) {\n  // Write your code here\n}",
                    python: "def solve(input_str):\n    # Write your code here\n    pass",
                    cpp: "bool solve(string input) {\n    // Write your code here\n    return false;\n}",
                    java: "public static boolean solve(String input) {\n    // Write your code here\n    return false;\n}",
                },
                testCases: [
                    { input: ["admin' OR 1=1--"], output: true },
                    { input: ["normaluser"], output: false },
                    { input: ["' OR ''='"], output: true },
                ],
            },
        ],
        hard: [
            {
                title: "Password Validator",
                prompt: "Validate a password against security rules: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character (`!@#$%^&*`). Return `true` if valid.",
                examples: [
                    { input: 's = "Str0ng!Pass"', output: "true" },
                    { input: 's = "weakpass"', output: "false", explanation: "Missing uppercase, digit, special char" },
                ],
                constraints: ["1 <= s.length <= 100"],
                functionSignature: {
                    javascript: "function solve(s) {\n  // Write your code here\n}",
                    python: "def solve(s):\n    # Write your code here\n    pass",
                    cpp: "bool solve(string s) {\n    // Write your code here\n    return false;\n}",
                    java: "public static boolean solve(String s) {\n    // Write your code here\n    return false;\n}",
                },
                testCases: [
                    { input: ["Str0ng!Pass"], output: true },
                    { input: ["weakpass"], output: false },
                    { input: ["NoDigit!Here"], output: false },
                ],
            },
        ],
    },
};

export function generateQuestion(skill, difficulty) {
    const questions = questionBank[skill]?.[difficulty];
    if (!questions || questions.length === 0) {
        return {
            title: "No Question Available",
            prompt: "No question available for this category.",
            examples: [],
            constraints: [],
            functionSignature: { javascript: "function solve() {\n  \n}", python: "def solve():\n    pass", cpp: "void solve() {\n    \n}", java: "public static void solve() {\n    \n}" },
            testCases: [],
        };
    }
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}
