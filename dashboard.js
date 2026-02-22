// ═══════════════════════════════════════════════════════════════
// ASSESSMENT DASHBOARD — JavaScript
// ═══════════════════════════════════════════════════════════════

const AUTH_API = 'http://localhost:4000/api';

function getToken() {
    return localStorage.getItem('sf_token');
}

// ── Load Dashboard ──────────────────────────────────────────────
async function loadDashboard() {
    const token = getToken();
    if (!token) {
        document.querySelector('.db-main').innerHTML =
            '<div class="db-empty">Please <a href="index.html" style="color:#F5C518">sign in</a> to view your dashboard.</div>';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API}/skills/assessments`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const { assessments } = await res.json();
        renderOverview(assessments);
        renderWeakAreas(assessments);
        renderAssessments(assessments);
    } catch {
        document.querySelector('.db-main').innerHTML =
            '<div class="db-empty">Unable to load dashboard. <a href="index.html" style="color:#F5C518">Sign in</a>.</div>';
    }
}

// ── Render Overview Stats ───────────────────────────────────────
function renderOverview(assessments) {
    const total = assessments.length;
    const avgScore = total > 0
        ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / total)
        : 0;
    const bestScore = total > 0
        ? Math.max(...assessments.map(a => a.score))
        : 0;

    // Collect all weak topics
    const weakTopics = [];
    assessments.forEach(a => {
        if (a.weakTopics) weakTopics.push(...a.weakTopics);
    });
    const uniqueWeak = new Set(weakTopics);

    document.getElementById('totalTests').textContent = total;
    document.getElementById('avgScore').textContent = `${avgScore}%`;
    document.getElementById('bestScore').textContent = `${bestScore}%`;
    document.getElementById('weakCount').textContent = uniqueWeak.size;
}

// ── Render Weak Areas ───────────────────────────────────────────
function renderWeakAreas(assessments) {
    const weakCounts = {};
    assessments.forEach(a => {
        (a.weakTopics || []).forEach(topic => {
            weakCounts[topic] = (weakCounts[topic] || 0) + 1;
        });
    });

    const sorted = Object.entries(weakCounts).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) return;

    document.getElementById('weakSection').style.display = 'block';
    const grid = document.getElementById('weakGrid');
    grid.innerHTML = sorted.slice(0, 8).map(([topic, count]) => `
    <div class="db-weak-card">
      <span class="db-weak-name">${topic}</span>
      <span class="db-weak-count">${count}x</span>
    </div>
  `).join('');
}

// ── Render Assessments ──────────────────────────────────────────
function renderAssessments(assessments) {
    const list = document.getElementById('assessmentsList');

    if (!assessments.length) {
        list.innerHTML = '<div class="db-empty">No assessments yet — complete a challenge to see results here!</div>';
        return;
    }

    // Sort by date descending
    const sorted = [...assessments].sort((a, b) => new Date(b.date) - new Date(a.date));

    list.innerHTML = sorted.map(a => {
        const date = new Date(a.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

        // Score ring color
        const ringClass = a.score >= 80 ? 'high' : a.score >= 50 ? 'mid' : 'low';

        const weakTags = (a.weakTopics || [])
            .map(t => `<span class="db-weak-tag">${t}</span>`)
            .join('');

        return `
      <div class="db-assessment-card">
        <div class="db-assessment-score-ring ${ringClass}">
          ${a.score}%
        </div>
        <div class="db-assessment-info">
          <div class="db-assessment-name">${a.testName}</div>
          <div class="db-assessment-date">${date}</div>
          ${weakTags ? `<div class="db-assessment-weak-tags">${weakTags}</div>` : ''}
        </div>
      </div>
    `;
    }).join('');
}

// ── Init ────────────────────────────────────────────────────────
loadDashboard();
