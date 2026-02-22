import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const QUESTIONS = [
    {
        id: 0,
        icon: '📊',
        panelName: 'Revenue Chart',
        skill: 'Data Visualization',
        errorTag: 'Wrong Chart Type',

        contextLabel: 'REVENUE DASHBOARD — Q1-Q4 MONTHLY TREND',
        contextHTML: (
            <>
                <div style={{ color: 'var(--neon-cyan)', fontFamily: "'Press Start 2P', monospace", fontSize: '8px', marginBottom: '10px' }}>REVENUE DASHBOARD — Q1-Q4</div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '72px', marginBottom: '8px' }}>
                    <div style={{ height: '60%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                    <div style={{ height: '80%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                    <div style={{ height: '50%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                    <div style={{ height: '90%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                    <div style={{ height: '70%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                    <div style={{ height: '95%', width: '24px', background: 'rgba(232,51,74,0.35)', border: '1px solid var(--neon-red)' }}></div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Chart type currently set to: <span style={{ color: 'var(--neon-red)', fontWeight: 'bold' }}>PIE CHART</span> | Dataset: Monthly Revenue Jan–Jun</div>
            </>
        ),

        fixType: 'chart-type',
        fixLabel: 'Select the correct chart type for this time-series revenue data:',
        chartOptions: [
            { label: 'PIE', icon: '🥧', correct: false },
            { label: 'LINE', icon: '📈', correct: true },
            { label: 'DONUT', icon: '⭕', correct: false },
            { label: 'SCATTER', icon: '✦', correct: false },
        ],
        justifyPrompt: 'Why does using a pie chart for monthly revenue data hurt business decision-making?',
    },

    {
        id: 1,
        icon: '🗄️',
        panelName: 'Data Feed',
        skill: 'MongoDB',
        errorTag: 'Malformed Document Field',

        contextLabel: 'PRODUCT FEED — MONGODB DOCUMENT #4821',
        contextHTML: (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '16px', lineHeight: 1.9 }}>
                <span style={{ color: 'var(--neon-cyan)' }}>{'{'}</span><br />
                &nbsp;&nbsp;<span style={{ color: 'var(--text-dim)' }}>"product_id":</span> <span style={{ color: 'var(--neon-gold)' }}>"P-9912"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: 'var(--text-dim)' }}>"name":</span> <span style={{ color: 'var(--neon-gold)' }}>"Wireless Headset Pro"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: 'var(--text-dim)' }}>"price":</span> <span style={{ color: 'var(--neon-red)' }}>"$299.99"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: 'var(--text-dim)' }}>"stock":</span> <span style={{ color: 'var(--neon-green)' }}>142</span>,<br />
                &nbsp;&nbsp;<span style={{ color: 'var(--text-dim)' }}>"category":</span> <span style={{ color: 'var(--neon-gold)' }}>"Electronics"</span><br />
                <span style={{ color: 'var(--neon-cyan)' }}>{'}'}</span>
            </div>
        ),

        fixType: 'json-editor',
        fixLabel: 'Correct the field type error in the document:',
        jsonFields: [
            { key: 'product_id', value: '"P-9912"', editable: false },
            { key: 'name', value: '"Wireless Headset Pro"', editable: false },
            { key: 'price', value: '"$299.99"', editable: true, correctValue: '299.99', hint: 'Remove quotes and $ symbol — should be a number' },
            { key: 'stock', value: '142', editable: false },
            { key: 'category', value: '"Electronics"', editable: false },
        ],
        justifyPrompt: 'Why does storing price as a string instead of a number break downstream analytics?',
    },

    {
        id: 2,
        icon: '🧹',
        panelName: 'Raw Data Table',
        skill: 'Data Cleaning & Wrangling',
        errorTag: 'NULL in Critical Column',

        contextLabel: 'CUSTOMER TRANSACTIONS — LAST 4 ROWS',
        contextHTML: (
            <table className="data-table">
                <thead><tr><th>TXN_ID</th><th>AMOUNT</th><th>CUSTOMER</th><th>DATE</th></tr></thead>
                <tbody>
                    <tr><td>T-001</td><td>450.00</td><td>Alice M.</td><td>2024-01-05</td></tr>
                    <tr><td>T-002</td><td className="td-warn">NULL</td><td>Bob K.</td><td>2024-01-06</td></tr>
                    <tr><td>T-003</td><td>120.50</td><td>Carol P.</td><td>2024-01-07</td></tr>
                    <tr><td>T-004</td><td className="td-warn">NULL</td><td>Dave L.</td><td>2024-01-08</td></tr>
                </tbody>
            </table>
        ),

        fixType: 'table-edit',
        fixLabel: 'Replace NULL values using the correct imputation strategy (column median = 285.25):',
        tableData: {
            headers: ['TXN_ID', 'AMOUNT', 'CUSTOMER', 'DATE'],
            rows: [
                ['T-001', '450.00', 'Alice M.', '2024-01-05'],
                ['T-002', '[[NULL]]', 'Bob K.', '2024-01-06'],
                ['T-003', '120.50', 'Carol P.', '2024-01-07'],
                ['T-004', '[[NULL]]', 'Dave L.', '2024-01-08'],
            ],
            editableCol: 1,
            acceptedValues: ['285.25', '285', 'median', 'MEDIAN'],
            hint: 'Use the column median (285.25) — mean would be skewed by outliers',
        },
        justifyPrompt: 'What happens to revenue totals and reports if NULL values in AMOUNT are ignored?',
    },

    {
        id: 3,
        icon: '🤖',
        panelName: 'Prediction Widget',
        skill: 'ML Fundamentals',
        errorTag: 'Data Leakage Detected',

        contextLabel: 'CHURN PREDICTION MODEL — FEATURE SET',
        contextHTML: (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '15px', lineHeight: 1.9 }}>
                <div style={{ color: 'var(--text-dim)' }}>Model Accuracy: <span style={{ color: 'var(--neon-green)' }}>99.8%</span> <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>← suspiciously high</span></div>
                <div style={{ marginTop: '10px', color: 'var(--text-dim)' }}>Features used in training:</div>
                <div style={{ paddingLeft: '14px', marginTop: '4px' }}>
                    <div>✓ age, tenure_months, monthly_charges</div>
                    <div>✓ num_support_tickets</div>
                    <div style={{ color: 'var(--neon-red)' }}>✓ cancellation_date &nbsp;← ⚠ INCLUDED IN TRAINING SET</div>
                    <div>✓ contract_type</div>
                </div>
            </div>
        ),

        fixType: 'toggle',
        fixLabel: 'Enable/disable each feature — remove the data-leaking feature from training:',
        toggleItems: [
            { id: 0, label: 'age', defaultOn: true, shouldBeOn: true },
            { id: 1, label: 'tenure_months', defaultOn: true, shouldBeOn: true },
            { id: 2, label: 'monthly_charges', defaultOn: true, shouldBeOn: true },
            { id: 3, label: 'num_support_tickets', defaultOn: true, shouldBeOn: true },
            { id: 4, label: 'cancellation_date', defaultOn: true, shouldBeOn: false },
            { id: 5, label: 'contract_type', defaultOn: true, shouldBeOn: true },
        ],
        justifyPrompt: 'Why does including cancellation_date as a feature make this model useless in production?',
    },

    {
        id: 4,
        icon: '📈',
        panelName: 'KPI Scorecard',
        skill: 'Business Analytics',
        errorTag: 'Wrong KPI Formula',

        contextLabel: 'KPI SCORECARD — CUSTOMER ACQUISITION COST (CAC)',
        contextHTML: (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '16px', lineHeight: 2 }}>
                <div>Marketing Spend: <span style={{ color: 'var(--neon-gold)' }}>$50,000</span></div>
                <div>New Customers: <span style={{ color: 'var(--neon-gold)' }}>250</span></div>
                <div>Sales Team Cost: <span style={{ color: 'var(--neon-gold)' }}>$30,000</span></div>
                <div style={{ marginTop: '10px', padding: '10px', border: '1px solid var(--neon-red)', background: 'rgba(232,51,74,0.05)' }}>
                    Current formula: CAC = Marketing Spend ÷ New Customers<br />
                    <span style={{ color: 'var(--neon-red)' }}>Result: $50,000 ÷ 250 = $200 per customer</span>
                </div>
            </div>
        ),

        fixType: 'formula',
        fixLabel: 'Enter the correct CAC formula:',
        formulaContext: 'Marketing Spend = $50,000 | Sales Cost = $30,000 | New Customers = 250',
        formulaCorrect: '(50000 + 30000) / 250',
        formulaPlaceholder: 'e.g. (50000 + 30000) / 250',
        formulaHint: 'CAC must include ALL acquisition costs: (Marketing + Sales) ÷ New Customers = $320',
        justifyPrompt: 'How does an underestimated CAC mislead leadership about marketing campaign profitability?',
    },

    {
        id: 5,
        icon: '🔢',
        panelName: 'Stats Summary',
        skill: 'Statistics & Probability',
        errorTag: 'Wrong Central Tendency Measure',

        contextLabel: 'SALARY STATISTICS — ENGINEERING TEAM',
        contextHTML: (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '15px', lineHeight: 1.9 }}>
                <div style={{ color: 'var(--text-dim)' }}>Salaries (USD): 62k, 65k, 68k, 70k, 72k, 75k, 78k, <span style={{ color: 'var(--neon-red)' }}>850k</span></div>
                <div style={{ marginTop: '10px' }}>
                    <div>Reported figure: <span style={{ color: 'var(--neon-red)' }}>MEAN = $167,500</span></div>
                    <div>Median: <span style={{ color: 'var(--neon-green)' }}>$71,000</span></div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>
                    ⚠ The $850k executive salary is pulling the mean far above most employees
                </div>
            </div>
        ),

        fixType: 'measure-select',
        fixLabel: 'Select the correct statistical measure to represent this salary distribution:',
        measureOptions: [
            { label: 'MEAN', correct: false, desc: 'Sum ÷ Count — sensitive to outliers' },
            { label: 'MEDIAN', correct: true, desc: 'Middle value — robust to outliers' },
            { label: 'MODE', correct: false, desc: 'Most frequent value' },
            { label: 'RANGE', correct: false, desc: 'Max − Min spread' },
        ],
        justifyPrompt: 'Why does reporting the mean salary mislead HR and budget planning when outliers exist?',
    },

    {
        id: 6,
        icon: '💾',
        panelName: 'Query Panel',
        skill: 'SQL',
        errorTag: 'Missing GROUP BY Clause',

        contextLabel: 'SQL QUERY — REGIONAL SALES REPORT',
        contextHTML: (
            <div style={{ fontFamily: "'VT323', monospace", fontSize: '16px', lineHeight: 1.9, color: 'var(--neon-green)' }}>
                SELECT region, SUM(sales_amount)<br />
                FROM transactions<br />
                WHERE year = 2024;<br />
                <br />
                <span style={{ color: 'var(--neon-red)' }}>-- ERROR: 'region' is invalid in the SELECT list</span><br />
                <span style={{ color: 'var(--neon-red)' }}>-- because it is not in GROUP BY or an aggregate function</span>
            </div>
        ),

        fixType: 'sql-editor',
        fixLabel: 'Fix the SQL query:',
        sqlDefault: `SELECT region, SUM(sales_amount)\nFROM transactions\nWHERE year = 2024;`,
        sqlCorrectContains: ['GROUP BY', 'group by'],
        sqlHint: 'Hint: Every non-aggregated column in SELECT must appear in GROUP BY',
        justifyPrompt: 'How does a missing GROUP BY produce incorrect regional sales totals in the executive report?',
    },
];


function getRank(score, fixed) {
    if (fixed === 7 && score >= 550) return 'DATA LEAD';
    if (fixed >= 5 && score >= 380) return 'SENIOR ANALYST';
    if (fixed >= 3 && score >= 200) return 'JUNIOR ANALYST';
    return 'ANALYST TRAINEE';
}


const DashboardDisaster = () => {
    const navigate = useNavigate();

    // -- State --
    const [gameState, setGameState] = useState('intro'); // intro, countdown, playing, results
    const [timeLeft, setTimeLeft] = useState(240);
    const [score, setScore] = useState(0);
    const [currentQ, setCurrentQ] = useState(0);
    const [qCorrect, setQCorrect] = useState(Array(7).fill(false));
    const [qScores, setQScores] = useState(Array(7).fill(0));
    const [attemptCount, setAttemptCount] = useState(0);

    const [fixConfirmed, setFixConfirmed] = useState(false);
    const [justifyText, setJustifyText] = useState('');
    const [feedback, setFeedback] = useState(null); // {type: 'error'|'success', msg: ''}

    // Fix Specific States
    const [selectedChart, setSelectedChart] = useState(null);
    const [jsonValues, setJsonValues] = useState({});
    const [tableEdits, setTableEdits] = useState({});
    const [toggleStates, setToggleStates] = useState({});
    const [formulaInput, setFormulaInput] = useState('');
    const [selectedMeasure, setSelectedMeasure] = useState(null);
    const [sqlCode, setSqlCode] = useState('');

    // --- Init ---
    useEffect(() => {
        // Init toggle states when entering a toggle question
        const q = QUESTIONS[currentQ];
        if (q && q.fixType === 'toggle' && Object.keys(toggleStates).length === 0) {
            const initialToggles = {};
            q.toggleItems.forEach(t => initialToggles[t.id] = t.defaultOn);
            setToggleStates(initialToggles);
        }
        if (q && q.fixType === 'json-editor' && Object.keys(jsonValues).length === 0) {
            const initialJson = {};
            q.jsonFields.forEach((f, i) => { if (f.editable) initialJson[i] = f.value });
            setJsonValues(initialJson);
        }
        if (q && q.fixType === 'sql-editor' && sqlCode === '') {
            setSqlCode(q.sqlDefault);
        }
    }, [currentQ]);

    // --- Timer ---
    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && gameState === 'playing') {
            setGameState('results');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const startCountdown = () => {
        setGameState('countdown');
        let count = 3;
        const iv = setInterval(() => {
            count--;
            if (count <= 0) {
                clearInterval(iv);
                setGameState('playing');
            } else {
                document.getElementById('countdown-number').textContent = count;
            }
        }, 900);
    };

    const handleFix = () => {
        const q = QUESTIONS[currentQ];
        let isCorrect = false;
        setFeedback(null);

        switch (q.fixType) {
            case 'chart-type':
                if (selectedChart === null) return setFeedback({ type: 'error', msg: '⚠ Select a chart type first' });
                isCorrect = q.chartOptions[selectedChart].correct;
                break;
            case 'json-editor':
                isCorrect = true;
                q.jsonFields.forEach((f, i) => {
                    if (f.editable) {
                        if (jsonValues[i]?.trim() !== f.correctValue) isCorrect = false;
                    }
                });
                break;
            case 'table-edit':
                isCorrect = true;
                const expected = q.tableData.acceptedValues.map(v => v.toLowerCase());
                q.tableData.rows.forEach((row, rowIdx) => {
                    row.forEach((cell, cellIdx) => {
                        if (cell === '[[NULL]]') {
                            const val = (tableEdits[rowIdx] || '').trim().toLowerCase();
                            if (!expected.includes(val)) isCorrect = false;
                        }
                    })
                });
                break;
            case 'toggle':
                isCorrect = q.toggleItems.every(t => toggleStates[t.id] === t.shouldBeOn);
                break;
            case 'formula':
                const strippedInput = formulaInput.replace(/\s+/g, '').toLowerCase();
                const expectedFormula = q.formulaCorrect.replace(/\s+/g, '').toLowerCase();
                isCorrect = strippedInput === expectedFormula;
                break;
            case 'measure-select':
                if (selectedMeasure === null) return setFeedback({ type: 'error', msg: '⚠ Select a measure first' });
                isCorrect = q.measureOptions[selectedMeasure].correct;
                break;
            case 'sql-editor':
                isCorrect = q.sqlCorrectContains.some(kw => sqlCode.toLowerCase().includes(kw.toLowerCase()));
                break;
            default: break;
        }

        if (isCorrect) {
            setFixConfirmed(true);
            setFeedback({ type: 'success', msg: '✓ Fix applied correctly! Now justify the business impact.' });
            setTimeout(() => {
                document.getElementById('justify-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        } else {
            setAttemptCount(prev => prev + 1);
            setFeedback({ type: 'error', msg: '✗ Incorrect — check your answer and try again' });
        }
    };

    const handleSubmit = () => {
        if (justifyText.length < 50) {
            return setFeedback({ type: 'error', msg: '⚠ Minimum 50 characters required for justification' });
        }

        const timeBonus = Math.max(0.5, timeLeft / 240);
        const attemptPenalty = Math.max(0.5, 1 - attemptCount * 0.1);
        const justifyBonus = justifyText.length >= 100 ? 1.0 : 0.8;
        const pts = Math.round(100 * timeBonus * attemptPenalty * justifyBonus);

        const newScores = [...qScores];
        newScores[currentQ] = pts;
        const newCorrect = [...qCorrect];
        newCorrect[currentQ] = true;

        setQScores(newScores);
        setQCorrect(newCorrect);
        setScore(prev => prev + pts);

        // Reset stage for next q
        setFixConfirmed(false);
        setJustifyText('');
        setFeedback(null);
        setAttemptCount(0);
        setSelectedChart(null);
        setJsonValues({});
        setTableEdits({});
        setToggleStates({});
        setFormulaInput('');
        setSelectedMeasure(null);
        setSqlCode('');

        if (currentQ + 1 >= QUESTIONS.length) {
            setGameState('results');
            // --- Submit Score ---
            const finalScore = prevScore => prevScore + pts;
            const token = localStorage.getItem('sf_token');
            if (token) {
                // Calculate percentage (max score is theoretically 700 but often lower due to time penalties, we'll cap it at 100 or scale it)
                fetch('http://localhost:4000/api/skills/game-results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        gameType: 'data-dashboard-disaster',
                        score: Math.min(100, Math.round((newCorrect.filter(Boolean).length / 7) * 100)),
                        skillArea: 'Data Analytics',
                        metrics: { rawScore: finalScore }
                    })
                }).catch(err => console.warn('Could not save score:', err));
            }
        } else {
            setCurrentQ(prev => prev + 1);
            document.getElementById('game-stage')?.scrollTo(0, 0);
        }
    };

    const restartGame = () => {
        setTimeLeft(240);
        setScore(0);
        setCurrentQ(0);
        setQCorrect(Array(7).fill(false));
        setQScores(Array(7).fill(0));
        setAttemptCount(0);
        setFixConfirmed(false);
        setJustifyText('');
        setFeedback(null);
        setGameState('intro');
    };

    const q = QUESTIONS[currentQ];

    return (
        <div className="page-wrap pixel-bg" style={{ minHeight: '100vh' }}>
            <style>
                {`
                body.pixel-bg {
                    overflow: hidden;
                    background-image: url('/bg_game1.png');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                }
                body::after {
                    content: '';
                    position: fixed;
                    inset: 0;
                    background: rgba(4, 4, 20, 0.4);
                    pointer-events: none;
                    z-index: 0;
                }
                /* Additional UI Specific overrides (mostly inherited from index.css) */
                .ceo-strip {
                    width: 100%;
                    max-width: 820px;
                    padding: 8px 16px;
                    background: rgba(232, 51, 74, 0.08);
                    border: 1px solid rgba(232, 51, 74, 0.4);
                    font-family: 'Press Start 2P', monospace;
                    font-size: 7px;
                    color: var(--neon-red);
                    text-align: center;
                    letter-spacing: 3px;
                }
                .ceo-strip.visible {
                    animation: blink 1s step-end infinite;
                }
                `}
            </style>

            {/* ====== INTRO SCREEN ====== */}
            {gameState === 'intro' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '3px' }}>
                        DATA DOMAIN · GAME 01
                    </div>
                    <div className="intro-title glitch" data-text="DASHBOARD DISASTER" style={{ fontSize: 'clamp(16px, 3.5vw, 30px)', color: 'var(--neon-red)', fontFamily: "'Press Start 2P', monospace" }}>DASHBOARD DISASTER</div>
                    <div className="intro-sub" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'var(--text-dim)', maxWidth: '560px', textAlign: 'center' }}>
                        The CEO presentation starts in 4 minutes.<br />
                        7 critical errors are buried across your dashboard.<br />
                        Answer each question, fix each error, justify the impact.
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '500px' }}>
                        <span className="skill-tag neon-red">📊 Visualization</span>
                        <span className="skill-tag neon-red">🗄️ MongoDB</span>
                        <span className="skill-tag neon-red">🧹 Data Cleaning</span>
                        <span className="skill-tag neon-red">🤖 ML</span>
                        <span className="skill-tag neon-red">📈 Analytics</span>
                        <span className="skill-tag neon-red">🔢 Statistics</span>
                        <span className="skill-tag neon-red">💾 SQL</span>
                    </div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--text-dim)' }}>
                        7 QUESTIONS · FIX + JUSTIFY · 4 MINUTES
                    </div>
                    <button className="btn-pixel btn-red" onClick={startCountdown} style={{ fontSize: '10px', padding: '14px 32px' }}>
                        ▶ START MISSION
                    </button>
                    <button onClick={() => navigate('/')} className="btn-pixel btn-cyan" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--text-dim)', textDecoration: 'none' }}>◀ BACK TO GAME SELECT</span>
                    </button>
                </div>
            )}

            {/* ====== COUNTDOWN ====== */}
            {gameState === 'countdown' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--neon-red)', letterSpacing: '3px' }}>MISSION STARTS IN</div>
                    <div id="countdown-number" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '64px', color: 'var(--neon-red)' }}>3</div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'var(--text-dim)' }}>STAY FOCUSED, ANALYST</div>
                </div>
            )}

            {/* ====== GAME MAIN ====== */}
            {gameState === 'playing' && (
                <div id="game-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 10 }}>
                    <div className="game-topbar" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '10px 24px', background: 'rgba(0, 0, 0, 0.7)', borderBottom: '1px solid var(--border-dim)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--neon-red)' }}>🚨 DASHBOARD DISASTER</span>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--text-dim)' }}>Q <span style={{ color: 'var(--neon-cyan)' }}>{currentQ + 1}</span>/7</span>
                        </div>
                        <div className={`timer-display ${timeLeft <= 30 ? 'danger' : timeLeft <= 90 ? 'warn' : ''}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-end' }}>
                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: 'var(--neon-gold)' }}>⭐ {score}</span>
                            <button onClick={() => navigate('/')} className="btn-pixel btn-red" style={{ fontSize: '7px', padding: '6px 12px' }}>✕ EXIT</button>
                        </div>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ height: '100%', background: 'var(--neon-cyan)', transition: 'width 0.4s', width: `${((currentQ) / QUESTIONS.length) * 100}%` }}></div>
                    </div>

                    <div className="game-stage" id="game-stage" style={{ height: 'calc(100vh - 70px)', overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {timeLeft <= 60 && <div className="ceo-strip visible">⚠ CEO IS WATCHING — HURRY UP ⚠</div>}

                        {/* QUESTION CARD */}
                        {q && (
                            <div className="question-card">
                                <div className="q-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-dim)' }}>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span className="q-icon">{q.icon}</span>
                                        <div>
                                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--neon-red)' }}>{q.skill}</div>
                                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--text-dim)', marginTop: '4px' }}>{q.panelName}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', padding: '4px 10px', border: '1px solid var(--neon-red)', color: 'var(--neon-red)', background: 'rgba(232,51,74,0.06)' }}>⚠ {q.errorTag}</div>
                                </div>

                                <div className="q-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="step-section">
                                        <div className="step-label" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--neon-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '18px', height: '18px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📋</div>
                                            <span>CONTEXT — WHAT'S IN THIS PANEL</span>
                                        </div>
                                        <div className="q-context" style={{ background: '#030310', border: '1px solid rgba(0,200,224,0.15)', padding: '16px' }}>
                                            {q.contextHTML}
                                        </div>
                                    </div>

                                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-dim)', margin: '4px 0' }} />

                                    {/* FIX MECHANIC */}
                                    <div className="step-section">
                                        <div className="step-label" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--neon-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '18px', height: '18px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
                                            <span>FIX THE ERROR</span>
                                        </div>
                                        <div style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'var(--neon-gold)', marginBottom: '8px' }}>{q.fixLabel}</div>

                                        {q.fixType === 'chart-type' && (
                                            <div className="chart-type-selector">
                                                {q.chartOptions.map((opt, i) => (
                                                    <button key={i} className={`chart-type-btn ${selectedChart === i ? 'selected' : ''}`} onClick={() => !fixConfirmed && setSelectedChart(i)}>
                                                        <span className="chart-icon">{opt.icon}</span>{opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.fixType === 'json-editor' && (
                                            <div className="json-field-list">
                                                <div style={{ color: 'var(--neon-cyan)', fontFamily: "'VT323', monospace", fontSize: '18px' }}>{'{'}</div>
                                                {q.jsonFields.map((f, i) => (
                                                    <div key={i} className="json-field-row">
                                                        <span className="json-key">&nbsp;&nbsp;"{f.key}"</span>
                                                        <span className="json-colon">:</span>
                                                        {f.editable ? (
                                                            <>
                                                                <input className="json-val err" value={jsonValues[i] ?? f.value} onChange={e => setJsonValues({ ...jsonValues, [i]: e.target.value })} disabled={fixConfirmed} />
                                                                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'Inter, sans-serif' }}>{f.hint}</span>
                                                            </>
                                                        ) : (
                                                            <span style={{ color: 'var(--neon-green)', fontFamily: "'VT323', monospace", fontSize: '16px' }}>{f.value}</span>
                                                        )}
                                                    </div>
                                                ))}
                                                <div style={{ color: 'var(--neon-cyan)', fontFamily: "'VT323', monospace", fontSize: '18px' }}>{'}'}</div>
                                            </div>
                                        )}

                                        {q.fixType === 'table-edit' && (
                                            <>
                                                <div className="code-hint" style={{ marginBottom: '10px' }}>▸ {q.tableData.hint}</div>
                                                <table className="data-table">
                                                    <thead><tr>{q.tableData.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                                                    <tbody>
                                                        {q.tableData.rows.map((row, rowIdx) => (
                                                            <tr key={rowIdx}>
                                                                {row.map((cell, cellIdx) => (
                                                                    <td key={cellIdx} className={cell === '[[NULL]]' ? 'cell-editable' : ''}>
                                                                        {cell === '[[NULL]]' ?
                                                                            <input className="inline-edit" placeholder="type fix..." value={tableEdits[rowIdx] || ''} onChange={(e) => setTableEdits({ ...tableEdits, [rowIdx]: e.target.value })} disabled={fixConfirmed} />
                                                                            : cell}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </>
                                        )}

                                        {q.fixType === 'toggle' && (
                                            <div className="toggle-group">
                                                {q.toggleItems.map(t => (
                                                    <div key={t.id} className="toggle-row">
                                                        <span className="toggle-label">{t.label}</span>
                                                        <div className="pixel-toggle" onClick={() => !fixConfirmed && setToggleStates({ ...toggleStates, [t.id]: !toggleStates[t.id] })}>
                                                            <div className={`toggle-track ${toggleStates[t.id] ? 'on' : ''}`}>
                                                                <div className="toggle-thumb"></div>
                                                            </div>
                                                            <span className="toggle-state">{toggleStates[t.id] ? 'ON' : 'OFF'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.fixType === 'formula' && (
                                            <>
                                                <div style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: 'var(--text-dim)', padding: '10px', border: '1px solid var(--border-dim)', marginBottom: '12px' }}>{q.formulaContext}</div>
                                                <input className="formula-input" placeholder={q.formulaPlaceholder} value={formulaInput} onChange={e => setFormulaInput(e.target.value)} disabled={fixConfirmed} />
                                                <div className="code-hint mt-8">▸ {q.formulaHint}</div>
                                            </>
                                        )}

                                        {q.fixType === 'measure-select' && (
                                            <div className="measure-options">
                                                {q.measureOptions.map((opt, i) => (
                                                    <button key={i} className={`measure-btn ${selectedMeasure === i ? 'selected' : ''}`} onClick={() => !fixConfirmed && setSelectedMeasure(i)}>
                                                        <div>{opt.label}</div>
                                                        <div style={{ fontSize: '7px', color: 'var(--text-dim)', marginTop: '5px', fontFamily: "'Inter', sans-serif" }}>{opt.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {q.fixType === 'sql-editor' && (
                                            <>
                                                <textarea className="code-editor" spellCheck="false" value={sqlCode} onChange={e => setSqlCode(e.target.value)} disabled={fixConfirmed} />
                                                <div className="code-hint mt-8">▸ {q.sqlHint}</div>
                                            </>
                                        )}
                                    </div>

                                    {feedback && (
                                        <div className={`feedback-banner ${feedback.type === 'success' ? 'success' : 'error'}`} style={{ display: 'block' }}>
                                            {feedback.msg}
                                        </div>
                                    )}

                                    {/* JUSTIFY SECTON */}
                                    {fixConfirmed && (
                                        <div id="justify-section">
                                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-dim)', margin: '4px 0 16px' }} />
                                            <div className="step-section">
                                                <div className="step-label" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '7px', color: 'var(--neon-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '18px', height: '18px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
                                                    <span>JUSTIFY THE BUSINESS IMPACT</span>
                                                </div>
                                                <div className="justify-prompt">{q.justifyPrompt}</div>
                                                <textarea className="pixel-textarea" rows="3" placeholder="Explain why this error mattered to the business..." value={justifyText} onChange={e => setJustifyText(e.target.value)}></textarea>
                                                <div className={`char-count ${justifyText.length >= 50 ? 'ok' : ''}`}>{justifyText.length} / 50 chars minimum</div>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                <div className="q-actions" style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border-dim)' }}>
                                    <div className="q-hint">{fixConfirmed ? 'Explain the business impact (min 50 chars), then submit' : 'Fix the error above to continue'}</div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {!fixConfirmed ? (
                                            <button className="btn-pixel btn-red" onClick={handleFix}>[ CONFIRM FIX ]</button>
                                        ) : (
                                            <button className="btn-pixel btn-cyan" onClick={handleSubmit}>[ SUBMIT & NEXT ]</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ====== RESULTS ====== */}
            {gameState === 'results' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', padding: '40px' }}>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '3px' }}>MISSION COMPLETE</div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--neon-red)' }}>DASHBOARD DISASTER</div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', maxWidth: '680px', width: '100%' }}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: 'var(--neon-gold)', marginBottom: '8px' }}>{score}</div>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--text-dim)', letterSpacing: '1px' }}>TOTAL SCORE</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: 'var(--neon-green)', marginBottom: '8px' }}>{qCorrect.filter(Boolean).length}/7</div>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--text-dim)', letterSpacing: '1px' }}>QUESTIONS FIXED</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: 'var(--neon-cyan)', marginBottom: '8px' }}>{timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : '0:00'}</div>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--text-dim)', letterSpacing: '1px' }}>TIME LEFT</div>
                        </div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)', padding: '18px', textAlign: 'center' }}>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '24px', color: 'var(--neon-purple)', marginBottom: '8px' }}>{Math.round((qCorrect.filter(Boolean).length / 7) * 100)}%</div>
                            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', color: 'var(--text-dim)', letterSpacing: '1px' }}>ACCURACY</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '680px' }}>
                        {QUESTIONS.map((qOpt, i) => (
                            <div key={i} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', padding: '5px 10px', border: '1px solid', color: qCorrect[i] ? 'var(--neon-green)' : 'var(--neon-red)', borderColor: qCorrect[i] ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                                {qOpt.icon} {qOpt.skill.split(' ')[0]}: {qCorrect[i] ? `+${qScores[i]}` : '✗'}
                            </div>
                        ))}
                    </div>

                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '11px', color: 'var(--neon-gold)', padding: '14px 28px', border: '1px solid var(--neon-gold)', letterSpacing: '2px' }}>
                        🏆 {getRank(score, qCorrect.filter(Boolean).length)}
                    </div>

                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="btn-pixel btn-red" onClick={restartGame}>[ PLAY AGAIN ]</button>
                        <button className="btn-pixel btn-cyan" onClick={() => navigate('/')}>[ GAME SELECT ]</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardDisaster;
