// Judge0 CE API Service
// Free hosted code execution - no API key required
// Docs: https://ce.judge0.com

const JUDGE0_BASE_URL = 'https://judge0-ce.p.rapidapi.com';

// Language IDs for Judge0 CE
export const JUDGE0_LANGUAGES = {
    javascript: { id: 102, name: 'JavaScript (Node.js 22)', monacoId: 'javascript' },
    python: { id: 109, name: 'Python (3.13)', monacoId: 'python' },
    cpp: { id: 105, name: 'C++ (GCC 14)', monacoId: 'cpp' },
    java: { id: 91, name: 'Java (JDK 17)', monacoId: 'java' },
};

/**
 * Wraps user code with a test harness that calls solve() and compares output.
 * Returns a full program string for the given language.
 */
function wrapCodeWithHarness(userCode, testCases, languageId) {
    const lang = Object.values(JUDGE0_LANGUAGES).find(l => l.id === languageId);
    const langKey = Object.keys(JUDGE0_LANGUAGES).find(k => JUDGE0_LANGUAGES[k].id === languageId);

    if (langKey === 'javascript') {
        const testCode = testCases.map((tc, i) => {
            const args = tc.input.map(a => JSON.stringify(a)).join(', ');
            const expected = JSON.stringify(tc.output);
            return `
try {
  const result_${i} = solve(${args});
  const passed_${i} = JSON.stringify(result_${i}) === '${expected.replace(/'/g, "\\'")}';
  console.log(JSON.stringify({ test: ${i}, passed: passed_${i}, expected: ${expected}, actual: result_${i} }));
} catch(e) {
  console.log(JSON.stringify({ test: ${i}, passed: false, expected: ${expected}, actual: "Error: " + e.message }));
}`;
        }).join('\n');
        return `${userCode}\n\n${testCode}`;
    }

    if (langKey === 'python') {
        const testCode = testCases.map((tc, i) => {
            const args = tc.input.map(a => JSON.stringify(a)).join(', ');
            const expected = JSON.stringify(tc.output);
            return `
try:
    result_${i} = solve(${args})
    import json
    passed_${i} = json.dumps(result_${i}) == '${expected.replace(/'/g, "\\'")}'
    print(json.dumps({"test": ${i}, "passed": passed_${i}, "expected": ${expected}, "actual": result_${i}}))
except Exception as e:
    import json
    print(json.dumps({"test": ${i}, "passed": False, "expected": ${expected}, "actual": "Error: " + str(e)}))`;
        }).join('\n');
        return `${userCode}\n\n${testCode}`;
    }

    if (langKey === 'cpp') {
        const includes = `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;
`;
        const testCode = testCases.map((tc, i) => {
            const args = tc.input.map(a => {
                if (Array.isArray(a)) return `{${a.join(', ')}}`;
                if (typeof a === 'string') return `"${a}"`;
                return String(a);
            }).join(', ');
            const expected = JSON.stringify(tc.output);
            return `
  {
    try {
      auto result = solve(${args});
      stringstream ss;
      ss << result;
      string actual = ss.str();
      bool passed = (actual == "${typeof tc.output === 'string' ? tc.output : tc.output}");
      cout << "{\\"test\\":${i},\\"passed\\":" << (passed ? "true" : "false") << ",\\"expected\\":${expected.replace(/"/g, '\\"')},\\"actual\\":\\"" << actual << "\\"}" << endl;
    } catch (...) {
      cout << "{\\"test\\":${i},\\"passed\\":false,\\"expected\\":${expected.replace(/"/g, '\\"')},\\"actual\\":\\"Runtime Error\\"}" << endl;
    }
  }`;
        }).join('\n');
        return `${includes}\n${userCode}\n\nint main() {\n${testCode}\n  return 0;\n}`;
    }

    if (langKey === 'java') {
        const testCode = testCases.map((tc, i) => {
            const args = tc.input.map(a => {
                if (Array.isArray(a)) return `new int[]{${a.join(', ')}}`;
                if (typeof a === 'string') return `"${a}"`;
                return String(a);
            }).join(', ');
            const expected = JSON.stringify(tc.output);
            return `
      try {
        var result_${i} = Solution.solve(${args});
        String actual_${i} = String.valueOf(result_${i});
        boolean passed_${i} = actual_${i}.equals("${typeof tc.output === 'string' ? tc.output : tc.output}");
        System.out.println("{\\"test\\":${i},\\"passed\\":" + passed_${i} + ",\\"expected\\":${expected.replace(/"/g, '\\"')},\\"actual\\":\\"" + actual_${i} + "\\"}");
      } catch (Exception e) {
        System.out.println("{\\"test\\":${i},\\"passed\\":false,\\"expected\\":${expected.replace(/"/g, '\\"')},\\"actual\\":\\"Error: " + e.getMessage() + "\\"}");
      }`;
        }).join('\n');
        return `class Solution {\n  ${userCode}\n\n  public static void main(String[] args) {\n${testCode}\n  }\n}`;
    }

    // Fallback: just run the code as-is
    return userCode;
}

/**
 * Submit code to Judge0 and get results.
 * Returns: { stdout, stderr, status, compile_output, time, memory }
 */
export async function executeCode(sourceCode, languageId, stdin = '') {
    // Create submission
    const createResponse = await fetch(`${JUDGE0_BASE_URL}/submissions?base64_encoded=true&wait=true&fields=*`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
            'X-RapidAPI-Key': 'DEMO', // Will be replaced with user's key
        },
        body: JSON.stringify({
            source_code: btoa(unescape(encodeURIComponent(sourceCode))),
            language_id: languageId,
            stdin: stdin ? btoa(stdin) : '',
            cpu_time_limit: 5,
            memory_limit: 128000,
        }),
    });

    if (!createResponse.ok) {
        // Try direct CE endpoint as fallback
        return await executeCodeDirect(sourceCode, languageId, stdin);
    }

    const result = await createResponse.json();
    return parseJudge0Result(result);
}

/**
 * Fallback: Direct Judge0 CE endpoint (no RapidAPI)
 */
async function executeCodeDirect(sourceCode, languageId, stdin = '') {
    const createResponse = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true&fields=*', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source_code: btoa(unescape(encodeURIComponent(sourceCode))),
            language_id: languageId,
            stdin: stdin ? btoa(stdin) : '',
            cpu_time_limit: 5,
            memory_limit: 128000,
        }),
    });

    if (!createResponse.ok) {
        throw new Error(`Judge0 API error: ${createResponse.status} ${createResponse.statusText}`);
    }

    const result = await createResponse.json();
    return parseJudge0Result(result);
}

function parseJudge0Result(result) {
    const decode = (b64) => {
        if (!b64) return '';
        try {
            return decodeURIComponent(escape(atob(b64)));
        } catch {
            return atob(b64);
        }
    };

    return {
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        status: result.status,
        time: result.time,
        memory: result.memory,
    };
}

/**
 * High-level: Run user code against test cases using Judge0.
 * Returns the same format as the local evaluator.
 */
export async function evaluateWithJudge0(userCode, testCases, languageKey) {
    const langConfig = JUDGE0_LANGUAGES[languageKey];
    if (!langConfig) throw new Error(`Unsupported language: ${languageKey}`);

    const wrappedCode = wrapCodeWithHarness(userCode, testCases, langConfig.id);
    const result = await executeCode(wrappedCode, langConfig.id);

    // Check for compilation errors
    if (result.status?.id === 6 || result.compile_output) {
        return {
            accuracy: 0,
            bugs: 1,
            efficiency: 0,
            testResults: testCases.map(() => ({
                passed: false,
                input: '',
                expected: '',
                actual: `Compile Error: ${result.compile_output || 'Unknown error'}`,
            })),
            consoleOutput: [{ type: 'error', text: result.compile_output || result.stderr || 'Compilation failed' }],
        };
    }

    // Check for runtime errors
    if (result.status?.id === 11 || result.status?.id === 12) {
        return {
            accuracy: 0,
            bugs: 1,
            efficiency: 0,
            testResults: testCases.map(() => ({
                passed: false,
                input: '',
                expected: '',
                actual: `Runtime Error: ${result.stderr || 'Unknown error'}`,
            })),
            consoleOutput: [{ type: 'error', text: result.stderr || 'Runtime error' }],
        };
    }

    // Parse stdout to extract test results
    const lines = (result.stdout || '').trim().split('\n').filter(l => l.trim());
    const testResults = [];

    testCases.forEach((tc, i) => {
        try {
            const line = lines[i];
            if (line) {
                const parsed = JSON.parse(line);
                testResults.push({
                    passed: parsed.passed,
                    input: JSON.stringify(tc.input),
                    expected: JSON.stringify(tc.output),
                    actual: JSON.stringify(parsed.actual),
                });
            } else {
                testResults.push({
                    passed: false,
                    input: JSON.stringify(tc.input),
                    expected: JSON.stringify(tc.output),
                    actual: 'No output',
                });
            }
        } catch {
            testResults.push({
                passed: false,
                input: JSON.stringify(tc.input),
                expected: JSON.stringify(tc.output),
                actual: lines[i] || 'Parse error',
            });
        }
    });

    const passed = testResults.filter(t => t.passed).length;
    const accuracy = testCases.length > 0 ? (passed / testCases.length) * 100 : 0;

    return {
        accuracy,
        bugs: testResults.filter(t => !t.passed).length,
        efficiency: Math.max(0, 100 - Math.round(parseFloat(result.time || 0) * 20)),
        testResults,
        consoleOutput: [
            { type: 'info', text: `Executed in ${result.time || '?'}s | Memory: ${result.memory ? Math.round(result.memory / 1024) + ' KB' : '?'}` },
            ...(result.stderr ? [{ type: 'warn', text: result.stderr }] : []),
        ],
    };
}
