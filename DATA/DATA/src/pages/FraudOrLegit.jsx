import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CASE = {
    name: 'DATA QUALITY AUDIT — MULTI-DOMAIN',
    badge: '🔍 DATA AUDIT',
    records: [
        // ─── DATA VISUALIZATION (3) ──────────────────────────────────────
        {
            id: 'VIZ-001', skill: 'Data Visualization', type: 'CHART AUDIT REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Impossible Value', severity: 'Critical',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Chart Title', 'Customer Satisfaction Trend — Jan to Dec'],
                    ['Chart Type', 'PIE CHART'],
                    ['X-Axis Label', 'Month'],
                    ['Y-Axis Label', 'Score (0–10)'],
                    ['Dataset Size', '12 monthly data points'],
                    ['Analyst Note', 'Used to show trends over time'],
                ]
            },
            note: 'Pie charts cannot show trends over time. A line chart is required for this time-series data.'
        },
        {
            id: 'VIZ-002', skill: 'Data Visualization', type: 'CHART AUDIT REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Pattern Deviation', severity: 'Medium',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Chart', 'Revenue by Region — Bar Chart'],
                    ['Y-Axis Start', '95,000 (truncated)'],
                    ['Region A Revenue', '98,200'],
                    ['Region B Revenue', '97,800'],
                    ['Visual Bar Difference', '80% taller for A vs B'],
                    ['Actual Difference', '0.4%'],
                ]
            },
            note: 'Truncated Y-axis starting at 95,000 makes a 0.4% difference look like an 80% gap — misleading visualization.'
        },
        {
            id: 'VIZ-003', skill: 'Data Visualization', type: 'CHART AUDIT REPORT',
            isFraud: false, isTrap: true, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Chart', 'Market Share by Product'],
                    ['Chart Type', 'PIE CHART'],
                    ['Number of Categories', '5'],
                    ['Data Type', 'Proportional — not time-series'],
                    ['Largest Slice', '38%'],
                    ['Note', 'Each category sums to 100%'],
                ]
            },
            note: '⚠ Pie chart used here — but this is market SHARE data (proportional, not over time). Pie chart is actually correct here. LEGITIMATE.'
        },

        // ─── MONGODB (3) ─────────────────────────────────────────────────
        {
            id: 'MDB-001', skill: 'MongoDB', type: 'DOCUMENT SCHEMA AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Impossible Value', severity: 'Critical',
            tableData: {
                headers: ['Field', 'Type Found', 'Expected Type'],
                rows: [
                    ['order_id', 'String', 'String ✓'],
                    ['customer_id', 'String', 'String ✓'],
                    ['total_price', 'String: "$450.99"', 'Number ✗'],
                    ['quantity', 'Number: 3', 'Number ✓'],
                    ['order_date', 'String: "15-03-2024"', 'ISODate ✗'],
                    ['status', 'String', 'String ✓'],
                ]
            },
            note: 'Two type violations: total_price stored as string (breaks arithmetic), order_date stored as non-ISO string (breaks date range queries).'
        },
        {
            id: 'MDB-002', skill: 'MongoDB', type: 'DOCUMENT SCHEMA AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Missing Data', severity: 'Medium',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Collection', 'users'],
                    ['Document #5512', '{ name: "Sam", email: null, role: "admin" }'],
                    ['Document #5513', '{ name: "Priya" }'],
                    ['Document #5514', '{ name: "Lee", email: "lee@co.com", role: null }'],
                    ['Schema Enforcement', 'None set'],
                    ['Impact', 'Auth module crashes on null email lookup'],
                ]
            },
            note: 'No schema validation — critical fields (email, role) missing or null in multiple documents. Auth and RBAC systems will break.'
        },
        {
            id: 'MDB-003', skill: 'MongoDB', type: 'DOCUMENT SCHEMA AUDIT',
            isFraud: false, isTrap: true, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Collection', 'products'],
                    ['Document', '{ id: "P-001", variants: ["Red", "Blue", "Green"] }'],
                    ['Field Type', 'Array of strings'],
                    ['Expected Type', 'Array (polymorphic allowed)'],
                    ['Analyst Flag', 'Flagged — variants is an array not a string'],
                    ['MongoDB Docs', 'Arrays are native — valid BSON type'],
                ]
            },
            note: '⚠ Analyst flagged array type as anomaly — but MongoDB natively supports arrays as field values. This is valid schema design. LEGITIMATE.'
        },

        // ─── DATA CLEANING & WRANGLING (3) ───────────────────────────────
        {
            id: 'CLN-001', skill: 'Data Cleaning', type: 'DATA PIPELINE AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Duplicate Entry', severity: 'Medium',
            tableData: {
                headers: ['Row', 'Customer', 'Email', 'Purchase Date', 'Amount'],
                rows: [
                    ['1', 'John Smith', 'john@email.com', '2024-02-01', '$120'],
                    ['2', 'Jane Doe', 'jane@email.com', '2024-02-01', '$89'],
                    ['3', 'John Smith', 'john@email.com', '2024-02-01', '$120'],
                    ['4', 'Alice Wong', 'alice@email.com', '2024-02-02', '$200'],
                ]
            },
            note: 'Rows 1 and 3 are exact duplicates (same customer, email, date, amount). Duplicate purchases inflate revenue and customer counts.'
        },
        {
            id: 'CLN-002', skill: 'Data Cleaning', type: 'DATA PIPELINE AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Impossible Value', severity: 'Critical',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Customer DOB', '2030-06-15'],
                    ['Current Date', '2024-03-01'],
                    ['Calculated Age', '-6 years (future birth date)'],
                    ['Field Validation', 'None on input form'],
                    ['Downstream Impact', 'Age-based segmentation, recommendation engine'],
                    ['Age Group Assigned', 'NULL — breaks segmentation'],
                ]
            },
            note: 'Future birth date entered — passes validation. Negative age of -6 years breaks all age-based analytics and recommendations.'
        },
        {
            id: 'CLN-003', skill: 'Data Cleaning', type: 'DATA PIPELINE AUDIT',
            isFraud: false, isTrap: false, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Dataset', 'Product Reviews — Raw Import'],
                    ['Column: rating', '1, 2, 3, 4, 5 (integer scale)'],
                    ['Column: review_text', 'Optional — some rows empty string ""'],
                    ['Empty review_text rows', '34% of dataset'],
                    ['Analyst Question', 'Should empty strings be treated as NULL?'],
                    ['Business Decision', 'Empty review is valid — user chose not to write'],
                ]
            },
            note: 'Empty review_text is intentionally allowed by product design — users can rate without writing. Not a data error. LEGITIMATE.'
        },

        // ─── ML FUNDAMENTALS (3) ─────────────────────────────────────────
        {
            id: 'ML-001', skill: 'ML Fundamentals', type: 'MODEL AUDIT REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Statistical Outlier', severity: 'Critical',
            tableData: {
                headers: ['Metric', 'Value'],
                rows: [
                    ['Model', 'Fraud Classifier'],
                    ['Train Accuracy', '99.7%'],
                    ['Test Accuracy', '52.1%'],
                    ['Train/Test Split', '95% train / 5% test'],
                    ['Feature: recent_fraud_label', 'Included (from same week as target)'],
                    ['Confusion Matrix (test)', 'Basically random performance'],
                ]
            },
            note: '99.7% train vs 52.1% test — severe overfitting, likely data leakage. Train split too large. Target-correlated feature included.'
        },
        {
            id: 'ML-002', skill: 'ML Fundamentals', type: 'MODEL AUDIT REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Pattern Deviation', severity: 'Medium',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Model Type', 'Binary Classifier — Churn Prediction'],
                    ['Dataset', 'Highly imbalanced: 95% No-Churn / 5% Churn'],
                    ['Metric Reported', 'Accuracy: 95%'],
                    ['Precision (Churn)', '0.0'],
                    ['Recall (Churn)', '0.0'],
                    ['Model Behavior', 'Predicts "No Churn" for every single record'],
                ]
            },
            note: 'Model achieves 95% accuracy by predicting "no churn" for everyone — never catches actual churners. Accuracy is a misleading metric here.'
        },
        {
            id: 'ML-003', skill: 'ML Fundamentals', type: 'MODEL AUDIT REPORT',
            isFraud: false, isTrap: true, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Model', 'Product Recommender'],
                    ['Algorithm', 'Collaborative Filtering'],
                    ['Train Accuracy', '88%'],
                    ['Test Accuracy', '84%'],
                    ['Gap', '4% — flagged as potential overfit'],
                    ['Industry Benchmark', '3–6% gap is normal for this model class'],
                ]
            },
            note: '⚠ 4% train/test gap was flagged as overfitting — but for collaborative filtering on sparse data, this gap is within normal range. LEGITIMATE.'
        },

        // ─── BUSINESS ANALYTICS (2) ──────────────────────────────────────
        {
            id: 'BIZ-001', skill: 'Business Analytics', type: 'KPI AUDIT REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Impossible Value', severity: 'Critical',
            tableData: {
                headers: ['KPI', 'Formula Used', 'Issue'],
                rows: [
                    ['Monthly Recurring Revenue', 'Total Revenue / 12', '✗ Divides all revenue not just recurring'],
                    ['Churn Rate', '(Lost Customers / Starting Customers) × 12', '✗ Annualizes monthly — overstates churn 12x'],
                    ['Customer LTV', 'Avg Order Value × 10', '✗ Missing: purchase frequency × avg lifespan'],
                    ['Correct Churn Rate', '(Lost / Starting) × 100', 'Monthly churn — no annualization needed'],
                ]
            },
            note: 'Three KPI formulas are incorrect. Monthly churn annualized 12x makes 2% monthly look like 24% annual. LTV calculation ignores frequency.'
        },
        {
            id: 'BIZ-002', skill: 'Business Analytics', type: 'KPI AUDIT REPORT',
            isFraud: false, isTrap: false, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Metric', 'Customer Acquisition Cost (CAC)'],
                    ['Marketing Spend Q1', '$120,000'],
                    ['Sales Team Cost Q1', '$80,000'],
                    ['New Customers Q1', '500'],
                    ['CAC Reported', '($120,000 + $80,000) / 500 = $400'],
                    ['Formula', 'Correct — includes all acquisition costs'],
                ]
            },
            note: 'CAC formula correctly includes both marketing and sales costs. Result of $400 is accurately calculated. LEGITIMATE.'
        },

        // ─── STATISTICS & PROBABILITY (3) ────────────────────────────────
        {
            id: 'STA-001', skill: 'Statistics & Probability', type: 'STATISTICAL REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Statistical Outlier', severity: 'Medium',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Dataset', 'Website load times (ms)'],
                    ['Values', '210, 220, 218, 215, 222, 219, 5800'],
                    ['Mean Reported', '872 ms'],
                    ['Median', '219 ms'],
                    ['Reason for High Mean', 'Single server timeout spike (5800ms)'],
                    ['Action Taken', 'Team used mean for SLA report'],
                ]
            },
            note: 'One 5800ms timeout event inflates mean to 872ms. Median of 219ms reflects real user experience. Using mean misrepresents SLA performance.'
        },
        {
            id: 'STA-002', skill: 'Statistics & Probability', type: 'STATISTICAL REPORT',
            isFraud: true, isTrap: false, anomalyType: 'Pattern Deviation', severity: 'Critical',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Experiment', 'A/B Test — New Checkout Flow'],
                    ['Sample Size Group A', '32 users'],
                    ['Sample Size Group B', '28 users'],
                    ['Conversion Rate A', '18.75%'],
                    ['Conversion Rate B', '25.0%'],
                    ['p-value', '0.38'],
                    ['Conclusion in Report', '"B is significantly better — deploy immediately"'],
                ]
            },
            note: 'p-value of 0.38 >> 0.05 threshold. No statistical significance. Sample size too small (60 total). Conclusion to "deploy" is statistically invalid.'
        },
        {
            id: 'STA-003', skill: 'Statistics & Probability', type: 'STATISTICAL REPORT',
            isFraud: false, isTrap: true, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Dataset', 'Employee performance scores (0–100)'],
                    ['Distribution', 'Bimodal: peaks at 45 and 82'],
                    ['Mean', '63.5'],
                    ['Median', '61'],
                    ['Analyst Flag', 'Mean and median differ by 2.5 — flagged as skewed'],
                    ['Actual Shape', 'Bimodal (two groups) — not skewed'],
                ]
            },
            note: '⚠ Analyst flagged the 2.5-point mean/median gap as skew — but the data is bimodal (two performance clusters), not skewed. Mean/median difference alone does not indicate skew. LEGITIMATE.'
        },

        // ─── SQL (3) ─────────────────────────────────────────────────────
        {
            id: 'SQL-001', skill: 'SQL', type: 'QUERY RESULT AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Missing Data', severity: 'Critical',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Query Goal', 'All customers who placed an order in March'],
                    ['Query Used', 'SELECT * FROM customers INNER JOIN orders ON customers.id = orders.cust_id WHERE month = 3'],
                    ['Result Count', '1,240 customers'],
                    ['Expected (from CRM)', '1,890 customers'],
                    ['Gap', '650 missing customers'],
                    ['Root Cause', 'INNER JOIN excludes customers with no matching order row'],
                ]
            },
            note: 'INNER JOIN drops customers who have an account but no order row in March. LEFT JOIN should be used to include all customers, with NULLs for those without orders.'
        },
        {
            id: 'SQL-002', skill: 'SQL', type: 'QUERY RESULT AUDIT',
            isFraud: true, isTrap: false, anomalyType: 'Statistical Outlier', severity: 'Medium',
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Query', 'SELECT department, AVG(salary) FROM employees GROUP BY department'],
                    ['Engineering Result', 'AVG salary: $167,000'],
                    ['HR Expectation', '~$75,000 for Engineering'],
                    ['Root Cause Check', 'executive_salaries table was UNION-ed in without filter'],
                    ['Exec Salaries Included', 'CEO, CTO, VP salaries all joined in'],
                    ['Correct Fix', 'Filter WHERE job_level NOT IN ("executive") or separate queries'],
                ]
            },
            note: 'Executive salaries unintentionally included via UNION with the employee table, inflating department averages by 2x.'
        },
        {
            id: 'SQL-003', skill: 'SQL', type: 'QUERY RESULT AUDIT',
            isFraud: false, isTrap: true, anomalyType: null, severity: null,
            tableData: {
                headers: ['Field', 'Value'],
                rows: [
                    ['Query', 'SELECT * FROM orders WHERE status = "pending" OR status = "processing"'],
                    ['Result Count', '4,102 rows'],
                    ['Analyst Flag', '"OR condition looks wrong — should be AND"'],
                    ['Actual Goal', 'Find all orders that are either pending OR processing'],
                    ['OR vs AND', 'OR is correct — AND would return 0 rows (status cannot be both)'],
                    ['Verdict', 'Query is logically correct'],
                ]
            },
            note: '⚠ Analyst flagged OR as a bug — but OR is absolutely correct here. A status column cannot simultaneously be "pending" AND "processing". LEGITIMATE.'
        },
    ]
};

const MCQ_QUESTIONS = [
    {
        question: 'Across this audit, which error type appeared in BOTH visualizations AND SQL queries?',
        options: [
            'Duplicate entries',
            'Missing/excluded data — showing less data than actually exists',
            'Wrong statistical measure',
            'Type mismatch in stored values',
        ],
        correct: 1,
    },
    {
        question: 'When evaluating ML model quality, which metric combination is REQUIRED beyond just accuracy?',
        options: [
            'Model size and training time',
            'Number of features and dataset size',
            'Precision, Recall, and F1-score — especially for imbalanced classes',
            'Only the test accuracy matters',
        ],
        correct: 2,
    },
    {
        question: 'What is the key signal that a data record might be a TRAP (legitimate despite looking suspicious)?',
        options: [
            'The numbers are very large',
            'There is a known business context or documented reason that explains the anomaly',
            'The record has no NULL values',
            'The record comes from a trusted data source',
        ],
        correct: 1,
    },
];

function getRank(score, correct, total) {
    const acc = total > 0 ? correct / total : 0;
    if (score >= 600 && acc >= 0.85) return 'CHIEF INVESTIGATOR';
    if (score >= 420 && acc >= 0.70) return 'SENIOR DETECTIVE';
    if (score >= 240 && acc >= 0.55) return 'FIELD DETECTIVE';
    return 'ROOKIE DETECTIVE';
}

const FraudOrLegit = () => {
    const navigate = useNavigate();

    // -- State --
    const [gameState, setGameState] = useState('intro'); // intro, case-intro, playing, mcq, results
    const [timeLeft, setTimeLeft] = useState(180);
    const [score, setScore] = useState(0);
    const [currentRecord, setCurrentRecord] = useState(0);

    const [decision, setDecision] = useState(null); // 'flag' or 'pass'
    const [anomalyType, setAnomalyType] = useState(null);
    const [severity, setSeverity] = useState(null);
    const [results, setResults] = useState([]);

    const [mcqIndex, setMcqIndex] = useState(0);
    const [mcqCorrect, setMcqCorrect] = useState(0);
    const [mcqAnswered, setMcqAnswered] = useState(false);
    const [mcqSelection, setMcqSelection] = useState(null);

    const [flashMsg, setFlashMsg] = useState(null); // {msg: '', type: 'correct'|'wrong'|'trap'}

    // --- Timers ---
    useEffect(() => {
        let timer;
        if (gameState === 'case-intro') {
            let count = 3;
            timer = setInterval(() => {
                count--;
                if (count <= 0) {
                    clearInterval(timer);
                    setGameState('playing');
                } else {
                    document.getElementById('case-countdown').textContent = count;
                }
            }, 900);
        }
        else if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0 && gameState === 'playing') {
            setGameState('mcq');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const showCaseIntro = () => {
        setGameState('case-intro');
    };

    const submitDecision = () => {
        const rec = CASE.records[currentRecord];
        const flagged = decision === 'flag';
        let flagScore = 0, typeScore = 0, sevScore = 0, fType = 'correct', fMsg = '';

        if (!rec.isTrap && rec.isFraud && flagged) {
            flagScore = 40; fMsg = '✓ CORRECT FLAG'; fType = 'correct';
        } else if (!rec.isFraud && !flagged) {
            flagScore = 40; fMsg = '✓ CORRECTLY PASSED'; fType = 'correct';
        } else if (rec.isTrap && !flagged) {
            flagScore = 40; fMsg = '✓ TRAP AVOIDED'; fType = 'correct';
        } else if (rec.isTrap && flagged) {
            flagScore = -20; fMsg = '⚠ TRAP — THAT WAS LEGITIMATE'; fType = 'trap';
        } else {
            flagScore = -10; fMsg = '✗ WRONG CALL'; fType = 'wrong';
        }

        if (flagged && rec.isFraud && !rec.isTrap) {
            typeScore = anomalyType === rec.anomalyType ? 30 : 0;
            sevScore = severity === rec.severity ? 30 : 0;
        }

        const pts = flagScore + typeScore + sevScore;
        setScore(prev => Math.max(0, prev + pts));

        const isCorrect = ((!rec.isTrap && rec.isFraud && flagged) || (!rec.isFraud && !flagged) || (rec.isTrap && !flagged));

        setResults([...results, {
            recordId: rec.id, skill: rec.skill, isTrap: rec.isTrap, isFraud: rec.isFraud, decision, flagScore, typeScore, sevScore, correct: isCorrect
        }]);

        // Show flash
        setFlashMsg({ msg: fMsg, type: fType });
        setTimeout(() => {
            setFlashMsg(null);
            if (currentRecord + 1 >= CASE.records.length) {
                setGameState('mcq');
            } else {
                setCurrentRecord(prev => prev + 1);
                setDecision(null);
                setAnomalyType(null);
                setSeverity(null);
            }
        }, 1400);
    };

    const selectMCQ = (idx, isCorrect) => {
        if (mcqAnswered) return;
        setMcqAnswered(true);
        setMcqSelection(idx);
        if (isCorrect) {
            setMcqCorrect(prev => prev + 1);
            setScore(prev => prev + 50);
        }
    };

    const handleMcqNext = () => {
        if (mcqIndex + 1 < MCQ_QUESTIONS.length) {
            setMcqIndex(prev => prev + 1);
            setMcqAnswered(false);
            setMcqSelection(null);
        } else {
            setGameState('results');
            // --- Submit Score ---
            const token = localStorage.getItem('sf_token');
            if (token) {
                // Determine a final score out of 100 based on the 20 records + MCQs
                // A simple approach: count how many primary decisions (Flag/Pass) were correct out of 20
                const correctCount = results.filter(r => r.correct).length;
                const finalPercentage = Math.round((correctCount / CASE.records.length) * 100);

                fetch('http://localhost:4000/api/skills/game-results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        gameType: 'data-fraud-or-legit',
                        score: finalPercentage,
                        skillArea: 'Data Security',
                        metrics: { rawScore: score, correctCalls: correctCount }
                    })
                }).catch(err => console.warn('Could not save score:', err));
            }
        }
    };

    const restartGame = () => {
        setTimeLeft(180);
        setScore(0);
        setCurrentRecord(0);
        setDecision(null);
        setAnomalyType(null);
        setSeverity(null);
        setResults([]);
        setMcqIndex(0);
        setMcqCorrect(0);
        setMcqAnswered(false);
        setMcqSelection(null);
        setGameState('intro');
    };

    const rec = CASE.records[currentRecord];
    const mcqQ = MCQ_QUESTIONS[mcqIndex];

    const canSubmit = decision === 'pass' || (decision === 'flag' && anomalyType && severity);

    return (
        <div className="page-wrap pixel-bg" style={{ minHeight: '100vh' }}>
            <style>
                {`
                body.pixel-bg {
                    overflow: hidden;
                    background-image: url('/bg_game2.png');
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
                /* Fraud Or Legit Specific UI Overrides */
                .game-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 20px;
                    background: rgba(0, 0, 0, 0.9);
                    border-bottom: 2px solid var(--neon-cyan);
                    box-shadow: 0 2px 20px rgba(0, 245, 255, 0.25);
                    z-index: 200;
                    position: relative;
                }
                .case-badge {
                    font-size: 7px;
                    padding: 4px 10px;
                    border: 1px solid var(--neon-cyan);
                    color: var(--neon-cyan);
                    letter-spacing: 1px;
                }
                .flag-btn, .pass-btn {
                    width: 120px;
                    height: 120px;
                    border-radius: 50%;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 10px;
                    border: 4px solid;
                    cursor: pointer;
                    letter-spacing: 1px;
                    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    background: rgba(0,0,0,0.6);
                }
                .flag-btn { color: var(--neon-red); border-color: var(--neon-red); }
                .flag-btn:hover, .flag-btn.active {
                    background: rgba(255, 45, 85, 0.3);
                    box-shadow: 0 0 30px rgba(255, 45, 85, 0.6), inset 0 0 20px rgba(255, 45, 85, 0.4);
                    transform: scale(1.05);
                }
                .pass-btn { color: var(--neon-green); border-color: var(--neon-green); }
                .pass-btn:hover, .pass-btn.active {
                    background: rgba(57, 255, 20, 0.25);
                    box-shadow: 0 0 30px rgba(57, 255, 20, 0.6), inset 0 0 20px rgba(57, 255, 20, 0.4);
                    transform: scale(1.05);
                }
                .anomaly-btn {
                    font-size: 7px;
                    padding: 6px 10px;
                    border: 1px solid var(--text-dim);
                    color: var(--text-dim);
                    background: transparent;
                    cursor: pointer;
                    font-family: 'Press Start 2P', monospace;
                    transition: all 0.15s;
                    letter-spacing: 1px;
                }
                .anomaly-btn:hover, .anomaly-btn.selected {
                    border-color: var(--neon-purple);
                    color: var(--neon-purple);
                }
                .anomaly-btn.selected {
                    background: rgba(191, 95, 255, 0.1);
                    box-shadow: 0 0 6px rgba(191, 95, 255, 0.4);
                }
                .severity-btn {
                    padding: 8px 16px;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 7px;
                    border: 2px solid;
                    cursor: pointer;
                    background: transparent;
                    transition: all 0.15s;
                }
                .sev-low { color: var(--neon-green); border-color: var(--neon-green); }
                .sev-low.selected { background: rgba(57, 255, 20, 0.1); box-shadow: var(--glow-green); }
                .sev-med { color: var(--neon-gold); border-color: var(--neon-gold); }
                .sev-med.selected { background: rgba(255, 215, 0, 0.1); box-shadow: var(--glow-gold); }
                .sev-crit { color: var(--neon-red); border-color: var(--neon-red); }
                .sev-crit.selected { background: rgba(255, 45, 85, 0.1); box-shadow: var(--glow-red); }
                
                .result-flash {
                    position: fixed;
                    top: 80px;
                    right: 24px;
                    font-family: 'VT323', monospace;
                    font-size: 18px;
                    padding: 10px 20px;
                    border: 2px solid;
                    opacity: 0;
                    pointer-events: none;
                    z-index: 300;
                    letter-spacing: 2px;
                }
                .result-flash.correct { color: var(--neon-green); border-color: var(--neon-green); background: rgba(57, 255, 20, 0.1); box-shadow: var(--glow-green); }
                .result-flash.wrong { color: var(--neon-red); border-color: var(--neon-red); background: rgba(255, 45, 85, 0.1); box-shadow: var(--glow-red); }
                .result-flash.trap { color: var(--neon-gold); border-color: var(--neon-gold); background: rgba(255, 215, 0, 0.1); box-shadow: var(--glow-gold); }
                @keyframes flash-in { 0% { opacity: 0; transform: translateX(20px); } 20% { opacity: 1; transform: translateX(0); } 80% { opacity: 1; } 100% { opacity: 0; } }
                .result-flash.show { animation: flash-in 1.5s ease forwards; }

                /* MCQ Overrides */
                .mcq-opt {
                    padding: 12px 16px; border: 2px solid var(--text-dim); cursor: pointer;
                    font-family: 'VT323', monospace; font-size: 17px; color: var(--text-dim); transition: all 0.15s; text-align: left; background: transparent; width: 100%;
                }
                .mcq-opt:hover { border-color: var(--neon-cyan); color: var(--neon-cyan); background: rgba(0, 245, 255, 0.05); }
                .mcq-opt.correct { border-color: var(--neon-green); color: var(--neon-green); background: rgba(57, 255, 20, 0.08); }
                .mcq-opt.wrong { border-color: var(--neon-red); color: var(--neon-red); background: rgba(255, 45, 85, 0.08); }
                `}
            </style>

            {/* ====== INTRO SCREEN ====== */}
            {gameState === 'intro' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '4px', fontFamily: "'Press Start 2P', monospace" }}>DATA DOMAIN · GAME 02</div>
                    <div style={{ fontSize: 'clamp(20px,4vw,34px)', color: 'var(--neon-cyan)', textShadow: 'var(--glow-cyan)', lineHeight: '1.4', fontFamily: "'Press Start 2P', monospace" }}>FRAUD OR LEGIT?</div>
                    <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', border: '2px solid var(--neon-cyan)', padding: '12px 28px', boxShadow: 'var(--glow-cyan)', letterSpacing: '4px', margin: '16px 0', fontFamily: "'Press Start 2P', monospace" }}>🕵️ DETECTIVE MODE</div>
                    <div style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: 'var(--text-dim)', maxWidth: '560px', lineHeight: '1.7', textAlign: 'center' }}>
                        You'll receive a case file with 20 data records.<br />
                        For each record: Flag it as fraud OR pass it as legit.<br />
                        Classify the anomaly type. Rate its severity.<br />
                        <span style={{ color: 'var(--neon-gold)' }}>⚠ WARNING: 20% of records look suspicious but are LEGITIMATE.<br />Flagging them costs you points.</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '500px' }}>
                        <span className="skill-tag neon-cyan">🏦 Bank Fraud</span>
                        <span className="skill-tag neon-cyan">🛒 E-commerce</span>
                        <span className="skill-tag neon-cyan">🏥 Healthcare</span>
                        <span className="skill-tag neon-cyan">📊 Survey Bias</span>
                        <span className="skill-tag neon-cyan">💾 DB Corruption</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', fontFamily: "'Press Start 2P', monospace" }}>
                        <div style={{ fontSize: '7px', padding: '6px 12px', border: '1px solid rgba(0,245,255,0.2)', color: 'var(--text-dim)' }}>FLAG ACCURACY 40%</div>
                        <div style={{ fontSize: '7px', padding: '6px 12px', border: '1px solid rgba(0,245,255,0.2)', color: 'var(--text-dim)' }}>ANOMALY TYPE 30%</div>
                        <div style={{ fontSize: '7px', padding: '6px 12px', border: '1px solid rgba(0,245,255,0.2)', color: 'var(--text-dim)' }}>SEVERITY 30%</div>
                    </div>
                    <button className="btn-pixel btn-cyan" onClick={showCaseIntro} style={{ fontSize: '11px', padding: '14px 32px' }}>▶ OPEN CASE FILE</button>
                    <button onClick={() => navigate('/')} style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
                        <span style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', textDecoration: 'none', fontFamily: "'Press Start 2P', monospace" }}>◀ BACK TO GAME SELECT</span>
                    </button>
                </div>
            )}

            {/* ====== CASE INTRO ====== */}
            {gameState === 'case-intro' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
                    <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '4px', fontFamily: "'Press Start 2P', monospace" }}>CASE FILE INCOMING</div>
                    <div style={{ fontSize: 'clamp(18px,3vw,28px)', color: 'var(--neon-gold)', textShadow: 'var(--glow-gold)', lineHeight: '1.4', fontFamily: "'Press Start 2P', monospace" }}>{CASE.name}</div>
                    <div style={{ fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>20 RECORDS · 3 MINUTES · STAY SHARP</div>
                    <div id="case-countdown" style={{ fontSize: '60px', fontFamily: "'VT323', monospace", color: 'var(--neon-cyan)', textShadow: 'var(--glow-cyan)' }}>3</div>
                </div>
            )}

            {/* ====== MAIN GAME ====== */}
            {gameState === 'playing' && (
                <div id="game-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative', zIndex: 10 }}>
                    {flashMsg && (
                        <div className={`result-flash ${flashMsg.type} show`}>{flashMsg.msg}</div>
                    )}

                    <div className="game-topbar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '8px', color: 'var(--neon-cyan)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>🕵️ FRAUD OR LEGIT?</span>
                            <span className="case-badge" style={{ fontFamily: "'Press Start 2P', monospace" }}>{CASE.badge}</span>
                        </div>
                        <div className={`timer-display ${timeLeft <= 30 ? 'danger' : timeLeft <= 60 ? 'warn' : ''}`}>
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontFamily: "'VT323', monospace", fontSize: '18px', color: 'var(--neon-gold)' }}>RECORD <span>{currentRecord + 1}</span>/20</span>
                            <span style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'var(--neon-green)', letterSpacing: '2px' }}>⭐ <span>{score}</span></span>
                            <button onClick={() => navigate('/')} className="btn-pixel btn-cyan" style={{ fontSize: '7px', padding: '6px 12px' }}>✕ EXIT</button>
                        </div>
                    </div>

                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(0, 245, 255, 0.1)' }}>
                        <div style={{ height: '100%', background: 'var(--neon-cyan)', boxShadow: 'var(--glow-cyan)', transition: 'width 0.3s', width: `${((currentRecord) / CASE.records.length) * 100}%` }}></div>
                    </div>

                    <div className="game-stage" style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: '16px', overflow: 'hidden' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
                            {rec && (
                                <div className="record-card" style={{ background: 'var(--bg-card)', border: '2px solid rgba(0, 245, 255, 0.3)', boxShadow: '0 0 20px rgba(0, 245, 255, 0.1)', maxWidth: '700px', width: '100%', padding: '24px', animation: 'card-slide-in 0.3s ease' }}>
                                    <div className="record-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid rgba(0, 245, 255, 0.15)' }}>
                                        <span style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>RECORD #{String(currentRecord + 1).padStart(3, '0')} — {rec.id}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '6px', padding: '3px 8px', border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}>{rec.skill}</span>
                                            <span style={{ fontSize: '7px', padding: '4px 10px', border: '1px solid var(--neon-purple)', color: 'var(--neon-purple)', letterSpacing: '1px', fontFamily: "'Press Start 2P', monospace" }}>{rec.type}</span>
                                        </div>
                                    </div>

                                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'VT323', monospace", fontSize: '15px', marginBottom: '16px' }}>
                                        <thead>
                                            <tr>{rec.tableData.headers.map(h => <th key={h} style={{ background: 'rgba(0, 245, 255, 0.2)', color: '#ffffff', padding: '10px 14px', textAlign: 'left', fontSize: '13px', borderBottom: '2px solid var(--neon-cyan)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace", textShadow: '0 0 5px rgba(0, 245, 255, 0.8)' }}>{h}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {rec.tableData.rows.map((row, i) => (
                                                <tr key={i} style={i % 2 !== 0 ? { background: 'rgba(255, 255, 255, 0.05)' } : { background: 'rgba(0,0,0,0.5)' }}>
                                                    {row.map((cell, j) => (
                                                        <td key={j} className={['NULL', 'null', 'None'].includes(cell) || cell.startsWith('✗') ? 'td-warn' : (cell.startsWith('✓') || cell === 'Correct ✓' ? 'td-ok' : '')} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255, 255, 255, 0.15)', color: '#ffffff', fontSize: '17px' }}>{cell}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* High Contrast Problem Statement Box */}
                                    <div style={{
                                        fontFamily: "'VT323', monospace",
                                        fontSize: '18px',
                                        color: '#ffffff',
                                        padding: '16px 20px',
                                        background: 'rgba(0, 0, 0, 0.85)',
                                        border: '1px solid rgba(0, 245, 255, 0.6)',
                                        borderLeft: '4px solid var(--neon-cyan)',
                                        lineHeight: '1.6',
                                        boxShadow: 'inset 0 0 20px rgba(0, 245, 255, 0.1)'
                                    }}>
                                        {rec.note}
                                    </div>
                                </div>
                            )}

                            {/* Huge Circular Decision Buttons Beside the Card */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                                <button className={`flag-btn ${decision === 'flag' ? 'active' : ''}`} onClick={() => setDecision('flag')}>
                                    <span style={{ fontSize: '24px' }}>🚩</span>
                                    <span>FLAG</span>
                                </button>
                                <button className={`pass-btn ${decision === 'pass' ? 'active' : ''}`} onClick={() => setDecision('pass')}>
                                    <span style={{ fontSize: '24px' }}>✅</span>
                                    <span>PASS</span>
                                </button>
                            </div>
                        </div>

                        {/* ANOMALY & SEVERITY PANEL (Only visible if Flagged, now at bottom) */}
                        <div style={{ background: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 245, 255, 0.2)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: decision === 'flag' ? 1 : 0.3, pointerEvents: decision === 'flag' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                <span style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', minWidth: '80px', fontFamily: "'Press Start 2P', monospace" }}>TYPE:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                                    {['Statistical Outlier', 'Duplicate Entry', 'Impossible Value', 'Missing Data', 'Pattern Deviation'].map(t => (
                                        <button key={t} className={`anomaly-btn ${anomalyType === t ? 'selected' : ''}`} onClick={() => setAnomalyType(t)}>{t.toUpperCase()}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: decision === 'flag' ? 1 : 0.3, pointerEvents: decision === 'flag' ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                                <span style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', minWidth: '80px', fontFamily: "'Press Start 2P', monospace" }}>SEVERITY:</span>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className={`severity-btn sev-low ${severity === 'Low' ? 'selected' : ''}`} onClick={() => setSeverity('Low')}>LOW</button>
                                    <button className={`severity-btn sev-med ${severity === 'Medium' ? 'selected' : ''}`} onClick={() => setSeverity('Medium')}>MEDIUM</button>
                                    <button className={`severity-btn sev-crit ${severity === 'Critical' ? 'selected' : ''}`} onClick={() => setSeverity('Critical')}>CRITICAL</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: 'var(--text-dim)' }}>
                                    {decision === 'pass' ? 'Ready to submit →' : (decision === 'flag' && anomalyType && severity ? 'All decisions made — lock in!' : (decision === 'flag' ? 'Select anomaly type & severity →' : 'Make your decision to continue →'))}
                                </span>
                                <button className="btn-pixel btn-cyan" disabled={!canSubmit} onClick={submitDecision}>[ SUBMIT DECISION ]</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== MCQ SCREEN ====== */}
            {gameState === 'mcq' && (
                <div className="screen" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px', padding: '40px', background: 'rgba(0, 0, 0, 0.95)' }}>
                    <div style={{ background: 'var(--bg-panel)', border: '2px solid var(--neon-cyan)', boxShadow: 'var(--glow-cyan), 8px 8px 0 #000', maxWidth: '640px', width: '100%', padding: '32px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--neon-cyan)', marginBottom: '8px', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>QUESTION {mcqIndex + 1} OF {MCQ_QUESTIONS.length}</div>
                        <div style={{ fontFamily: "'VT323', monospace", fontSize: '20px', color: 'var(--text-main)', marginBottom: '20px', lineHeight: '1.5' }}>{mcqQ.question}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {mcqQ.options.map((opt, i) => (
                                <button key={i} className={`mcq-opt ${mcqAnswered ? (i === mcqQ.correct ? 'correct' : (mcqSelection === i ? 'wrong' : '')) : ''}`} onClick={() => selectMCQ(i, i === mcqQ.correct)}>
                                    {String.fromCharCode(65 + i)}. {opt}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn-pixel btn-cyan" disabled={!mcqAnswered} onClick={handleMcqNext}>{mcqIndex < MCQ_QUESTIONS.length - 1 ? '[ NEXT ]' : '[ SEE RESULTS ]'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== RESULTS SCREEN ====== */}
            {gameState === 'results' && (() => {
                const total = results.length;
                const correct = results.filter(r => r.correct).length;
                const fraudCount = results.filter(r => r.isFraud && !r.isTrap).length;
                const typeOk = results.filter(r => r.typeScore > 0).length;
                const sevOk = results.filter(r => r.sevScore > 0).length;
                const traps = results.filter(r => r.isTrap);

                return (
                    <div className="screen" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px', padding: '40px' }}>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '3px' }}>AUDIT COMPLETE</div>
                        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '16px', color: 'var(--neon-cyan)', textShadow: 'var(--glow-cyan)' }}>{CASE.name}</div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', maxWidth: '640px', width: '100%' }}>
                            <div style={{ background: 'var(--bg-card)', border: '2px solid var(--text-dim)', padding: '18px', textAlign: 'center' }}>
                                <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', color: 'var(--neon-gold)', lineHeight: 1, marginBottom: '6px' }}>{score}</div>
                                <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>TOTAL SCORE</div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', border: '2px solid var(--text-dim)', padding: '18px', textAlign: 'center' }}>
                                <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', color: 'var(--neon-green)', lineHeight: 1, marginBottom: '6px' }}>{total > 0 ? Math.round((correct / total) * 100) + '%' : '0%'}</div>
                                <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>FLAG ACCURACY</div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', border: '2px solid var(--text-dim)', padding: '18px', textAlign: 'center' }}>
                                <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', color: 'var(--neon-purple)', lineHeight: 1, marginBottom: '6px' }}>{fraudCount > 0 ? Math.round((typeOk / fraudCount) * 100) + '%' : '0%'}</div>
                                <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>TYPE ACCURACY</div>
                            </div>
                            <div style={{ background: 'var(--bg-card)', border: '2px solid var(--text-dim)', padding: '18px', textAlign: 'center' }}>
                                <div style={{ fontFamily: "'VT323', monospace", fontSize: '36px', color: 'var(--neon-red)', lineHeight: 1, marginBottom: '6px' }}>{fraudCount > 0 ? Math.round((sevOk / fraudCount) * 100) + '%' : '0%'}</div>
                                <div style={{ fontSize: '7px', color: 'var(--text-dim)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>SEVERITY ACCURACY</div>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.3)', padding: '16px 20px', maxWidth: '640px', width: '100%' }}>
                            <div style={{ fontSize: '8px', color: 'var(--neon-gold)', marginBottom: '10px', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>TRAP REPORT</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {!traps.length ? (
                                    <span style={{ fontFamily: "'VT323', monospace", color: 'var(--text-dim)' }}>No trap records encountered.</span>
                                ) : (
                                    traps.map((r, i) => {
                                        const caught = r.decision === 'pass';
                                        return (
                                            <div key={i} style={{ fontSize: '7px', padding: '4px 10px', border: '1px solid', letterSpacing: '1px', fontFamily: "'Press Start 2P', monospace", color: caught ? 'var(--neon-green)' : 'var(--neon-red)', borderColor: caught ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                                                [{r.skill.split(' ')[0]}] {r.recordId}: {caught ? '✓ CAUGHT' : '✗ FLAGGED WRONG'}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--neon-gold)', padding: '14px 28px', border: '2px solid var(--neon-gold)', boxShadow: 'var(--glow-gold)', letterSpacing: '2px', fontFamily: "'Press Start 2P', monospace" }}>
                            🏅 {getRank(score, correct, total)}
                        </div>

                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '20px' }}>
                            <button className="btn-pixel btn-cyan" onClick={restartGame}>[ AUDIT NEW CASE ]</button>
                            <button className="btn-pixel btn-red" onClick={() => navigate('/')}>[ GAME SELECT ]</button>
                        </div>
                    </div>
                );
            })()}

        </div>
    );
};

export default FraudOrLegit;
