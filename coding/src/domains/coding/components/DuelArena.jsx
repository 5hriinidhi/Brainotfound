import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuestion } from '../engine/questionGenerator';
import { evaluateSubmission } from '../engine/evaluator';
import { evaluateWithJudge0 } from '../engine/judge0Service';
import arenaBg from '../../../assets/DuelArena.png';

const TIME_BY_DIFFICULTY = { 1: 180, 2: 240, 3: 300 };

const LANGUAGES = [
    { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
    { id: 'python', label: 'Python', monacoId: 'python' },
    { id: 'cpp', label: 'C++', monacoId: 'cpp' },
    { id: 'java', label: 'Java', monacoId: 'java' },
];

const font = "'Press Start 2P', cursive";

const DuelArena = ({ skill, onDuelEnd }) => {
    const [currentRound, setCurrentRound] = useState(1);
    const [timeLeft, setTimeLeft] = useState(TIME_BY_DIFFICULTY[2]);
    const [question, setQuestion] = useState(null);
    const [adaptiveLevel, setAdaptiveLevel] = useState(2);
    const [results, setResults] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const [consoleOutput, setConsoleOutput] = useState([]);
    const [activeTab, setActiveTab] = useState('testcases'); // testcases | results | console
    const [testResults, setTestResults] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [timerPaused, setTimerPaused] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const editorRef = useRef(null);

    const difficultyLabel = adaptiveLevel === 1 ? 'EASY' : adaptiveLevel === 2 ? 'MEDIUM' : 'HARD';
    const difficultyColor = adaptiveLevel === 1 ? '#34d399' : adaptiveLevel === 2 ? '#facc15' : '#ef4444';

    // Initialize Round
    useEffect(() => {
        const difficulty = adaptiveLevel === 1 ? 'easy' : adaptiveLevel === 2 ? 'medium' : 'hard';
        const newQuestion = generateQuestion(skill, difficulty);
        setQuestion(newQuestion);
        setTimeLeft(TIME_BY_DIFFICULTY[adaptiveLevel]);
        setTestResults(null);
        setConsoleOutput([]);
        setShowFeedback(false);
        setTimerPaused(false);
        setActiveTab('testcases');
        if (editorRef.current && newQuestion) {
            editorRef.current.setValue(newQuestion.functionSignature[language] || newQuestion.functionSignature.javascript);
        }
    }, [currentRound, skill]);

    // Update editor when language changes
    useEffect(() => {
        if (editorRef.current && question && !showFeedback) {
            editorRef.current.setValue(question.functionSignature[language] || question.functionSignature.javascript);
        }
    }, [language]);

    // Timer
    useEffect(() => {
        if (timerPaused || showFeedback) return;
        if (timeLeft <= 0) { handleSubmit(); return; }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, timerPaused, showFeedback]);

    const runCode = async () => {
        if (isExecuting) return;
        const code = editorRef.current?.getValue() || "";

        // JavaScript: local execution (fast)
        if (language === 'javascript') {
            const logs = [];
            try {
                const solve = new Function('"use strict"; ' + code + '; return solve;')();
                const visibleTests = question.testCases.slice(0, 2);
                visibleTests.forEach((test, i) => {
                    try {
                        const result = solve(...test.input);
                        logs.push({ type: 'info', text: `Test ${i + 1}: solve(${JSON.stringify(test.input).slice(1, -1)}) → ${JSON.stringify(result)}` });
                    } catch (e) {
                        logs.push({ type: 'error', text: `Test ${i + 1}: Runtime Error — ${e.message}` });
                    }
                });
            } catch (e) {
                logs.push({ type: 'error', text: `Compile Error: ${e.message}` });
            }
            setConsoleOutput(logs);
            setActiveTab('console');
            return;
        }

        // Other languages: Judge0 API
        setIsExecuting(true);
        setConsoleOutput([{ type: 'info', text: `⏳ Executing ${LANGUAGES.find(l => l.id === language)?.label} code via Judge0...` }]);
        setActiveTab('console');
        setTimerPaused(true);

        try {
            const visibleTests = question.testCases.slice(0, 2);
            const result = await evaluateWithJudge0(code, visibleTests, language);
            setConsoleOutput([
                ...(result.consoleOutput || []),
                ...result.testResults.map((t, i) => ({
                    type: t.passed ? 'info' : 'error',
                    text: `Test ${i + 1}: ${t.passed ? '✅ Passed' : '❌ Failed'} | Expected: ${t.expected} | Got: ${t.actual}`,
                })),
            ]);
        } catch (e) {
            setConsoleOutput([{ type: 'error', text: `❌ Judge0 API Error: ${e.message}` }]);
        } finally {
            setIsExecuting(false);
            setTimerPaused(false);
        }
    };

    const handleSubmit = async () => {
        if (isExecuting) return;
        const code = editorRef.current?.getValue() || "";
        let evalResult;

        // JavaScript: local evaluation (fast)
        if (language === 'javascript') {
            evalResult = evaluateSubmission(code, question.testCases);
        } else {
            // Other languages: Judge0 API
            setIsExecuting(true);
            setConsoleOutput([{ type: 'info', text: `⏳ Submitting ${LANGUAGES.find(l => l.id === language)?.label} code via Judge0...` }]);
            setActiveTab('console');
            setTimerPaused(true);

            try {
                evalResult = await evaluateWithJudge0(code, question.testCases, language);
                if (evalResult.consoleOutput) {
                    setConsoleOutput(evalResult.consoleOutput);
                }
            } catch (e) {
                setConsoleOutput([{ type: 'error', text: `❌ Judge0 API Error: ${e.message}` }]);
                setIsExecuting(false);
                setTimerPaused(false);
                return;
            } finally {
                setIsExecuting(false);
            }
        }

        setTestResults(evalResult.testResults);
        setShowFeedback(true);
        setTimerPaused(true);
        setActiveTab('results');

        let newLevel = adaptiveLevel;
        if (evalResult.accuracy > 80 && adaptiveLevel < 3) newLevel = adaptiveLevel + 1;
        if (evalResult.accuracy < 40 && adaptiveLevel > 1) newLevel = adaptiveLevel - 1;

        const roundData = { ...evalResult, timeLeft, round: currentRound };
        const newResults = [...results, roundData];
        setResults(newResults);

        setTimeout(() => {
            setShowFeedback(false);
            setTestResults(null);
            setAdaptiveLevel(newLevel);
            if (currentRound >= 5) {
                onDuelEnd(newResults);
            } else {
                setCurrentRound(prev => prev + 1);
            }
        }, 4000);
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (!question) return null;

    return (
        <div style={{
            height: '100vh', width: '100vw', backgroundImage: `url(${arenaBg})`,
            backgroundSize: 'cover', color: 'white', display: 'flex', flexDirection: 'column',
            fontFamily: font, overflow: 'hidden',
        }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.8rem 1.2rem', background: 'rgba(0,0,0,0.7)', fontSize: '0.75rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <span>ROUND {currentRound}/5</span>
                    <span style={{ color: difficultyColor }}>[ {difficultyLabel} ]</span>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.4rem' }}>{question.title}</span>
                </div>
                <div style={{
                    color: timeLeft < 10 ? '#ef4444' : 'var(--neon-cyan)',
                    fontSize: timeLeft < 10 ? '1.4rem' : '1.1rem',
                    transition: 'all 0.3s',
                }}>
                    ⏱ {formatTime(timeLeft)}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* LEFT: Problem Description */}
                <div style={{
                    width: '38%', display: 'flex', flexDirection: 'column',
                    borderRight: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(10, 14, 26, 0.85)',
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.2rem' }}>
                        {/* Title */}
                        <h2 style={{ fontSize: '1rem', color: 'var(--neon-cyan)', marginBottom: '1.2rem' }}>
                            {question.title}
                        </h2>

                        {/* Description */}
                        <p style={{ fontSize: '0.75rem', lineHeight: 2, color: 'rgba(255,255,255,0.8)', marginBottom: '1.5rem' }}>
                            {question.prompt}
                        </p>

                        {/* Examples */}
                        {question.examples?.map((ex, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '6px', padding: '0.8rem', marginBottom: '0.8rem',
                            }}>
                                <div style={{ fontSize: '1rem', color: 'var(--neon-cyan)', marginBottom: '0.8rem' }}>
                                    Example {i + 1}:
                                </div>
                                <div style={{ fontSize: '0.9rem', lineHeight: 1.8, fontFamily: 'monospace' }}>
                                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Input: </span>{ex.input}</div>
                                    <div><span style={{ color: 'rgba(255,255,255,0.5)' }}>Output: </span>{ex.output}</div>
                                    {ex.explanation && (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.6rem' }}>
                                            💡 {ex.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Constraints */}
                        {question.constraints?.length > 0 && (
                            <div style={{ marginTop: '0.8rem' }}>
                                <div style={{ fontSize: '1rem', color: 'var(--neon-cyan)', marginBottom: '1rem' }}>Constraints:</div>
                                <ul style={{ fontSize: '0.9rem', lineHeight: 2.2, color: 'rgba(255,255,255,0.6)', paddingLeft: '1.5rem' }}>
                                    {question.constraints.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Editor + Console */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(10, 14, 26, 0.6)' }}>

                    {/* Language Selector Bar */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.4rem 0.8rem', background: 'rgba(0,0,0,0.4)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                    }}>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            disabled={showFeedback}
                            style={{
                                background: 'rgba(255,255,255,0.08)', color: 'var(--neon-cyan)',
                                border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
                                padding: '8px 12px', fontFamily: font, fontSize: '1rem', cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            {LANGUAGES.map(lang => (
                                <option key={lang.id} value={lang.id} style={{ background: '#1a1a2e' }}>
                                    {lang.label}
                                </option>
                            ))}
                        </select>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={runCode}
                                disabled={showFeedback || isExecuting}
                                style={{
                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                    color: '#34d399', padding: '6px 14px', borderRadius: '4px',
                                    fontFamily: font, fontSize: '0.65rem', cursor: (showFeedback || isExecuting) ? 'not-allowed' : 'pointer',
                                    opacity: (showFeedback || isExecuting) ? 0.5 : 1,
                                }}
                            >
                                {isExecuting ? '⏳ RUNNING...' : '▶ RUN'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={showFeedback || isExecuting}
                                style={{
                                    background: 'linear-gradient(135deg, #00d2ff, #0097e6)',
                                    border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px',
                                    fontFamily: font, fontSize: '1rem', cursor: (showFeedback || isExecuting) ? 'not-allowed' : 'pointer',
                                    opacity: (showFeedback || isExecuting) ? 0.5 : 1,
                                }}
                            >
                                ⚡ SUBMIT
                            </button>
                        </div>
                    </div>

                    {/* Code Editor */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={LANGUAGES.find(l => l.id === language)?.monacoId || 'javascript'}
                            defaultValue={question.functionSignature[language] || question.functionSignature.javascript}
                            onMount={(editor) => {
                                editorRef.current = editor;
                                // Block copy-paste
                                editor.onDidPaste(() => {
                                    const currentValue = editor.getValue();
                                    editor.setValue(question?.functionSignature[language] || "function solve(input) {\n  // Write your code here\n}");
                                    setConsoleOutput(prev => [...prev, { type: 'warn', text: '⚠ PASTE BLOCKED — Write your own code, agent.' }]);
                                    setActiveTab('console');
                                });
                                // Also block via keyboard shortcut
                                editor.addCommand(monaco => monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
                                    setConsoleOutput(prev => [...prev, { type: 'warn', text: '⚠ PASTE BLOCKED — Copy-paste is disabled during duels.' }]);
                                    setActiveTab('console');
                                });
                            }}
                            options={{
                                minimap: { enabled: false }, fontSize: 18, readOnly: showFeedback,
                                scrollBeyondLastLine: false, wordWrap: 'on',
                                padding: { top: 12 },
                            }}
                        />
                    </div>

                    {/* Bottom Panel: Tabs */}
                    <div style={{
                        height: '30%', minHeight: '120px', borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.5)',
                    }}>
                        {/* Tab Headers */}
                        <div style={{
                            display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            {['testcases', 'results', 'console'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        background: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                                        border: 'none', borderBottom: activeTab === tab ? '2px solid var(--neon-cyan)' : '2px solid transparent',
                                        color: activeTab === tab ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.4)',
                                        padding: '0.4rem 0.8rem', fontFamily: font, fontSize: '0.35rem',
                                        cursor: 'pointer', textTransform: 'uppercase',
                                    }}
                                >
                                    {tab === 'testcases' ? '📋 Test Cases' : tab === 'results' ? '✅ Results' : '💻 Console'}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.8rem' }}>

                            {/* Test Cases Tab */}
                            {activeTab === 'testcases' && (
                                <div style={{ fontSize: '0.38rem', lineHeight: 2 }}>
                                    {question.examples?.map((ex, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(255,255,255,0.03)', borderRadius: '4px',
                                            padding: '0.5rem', marginBottom: '0.4rem', fontFamily: 'monospace',
                                        }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Case {i + 1}: </span>
                                            <span>Input: {ex.input} → Expected: {ex.output}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Results Tab */}
                            {activeTab === 'results' && (
                                <div>
                                    {testResults ? (
                                        testResults.map((t, i) => (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                                                marginBottom: '0.4rem', padding: '0.4rem',
                                                background: t.passed ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                border: `1px solid ${t.passed ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                                                borderRadius: '4px',
                                            }}>
                                                <span style={{ fontSize: '1rem' }}>{t.passed ? '✅' : '❌'}</span>
                                                <div style={{ fontSize: '0.6rem', lineHeight: 2, fontFamily: 'monospace' }}>
                                                    <div>Input: {t.input}</div>
                                                    <div>Expected: {t.expected}</div>
                                                    {!t.passed && <div style={{ color: '#ef4444' }}>Got: {t.actual}</div>}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.38rem', color: 'rgba(255,255,255,0.3)' }}>
                                            Submit your solution to see results...
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Console Tab */}
                            {activeTab === 'console' && (
                                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', lineHeight: 2 }}>
                                    {consoleOutput.length === 0 ? (
                                        <p style={{ color: 'rgba(255,255,255,0.3)' }}>Run your code to see output...</p>
                                    ) : (
                                        consoleOutput.map((log, i) => (
                                            <div key={i} style={{
                                                color: log.type === 'error' ? '#ef4444' : log.type === 'warn' ? '#facc15' : 'rgba(255,255,255,0.7)',
                                                padding: '4px 0',
                                            }}>
                                                {log.text}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuelArena;
