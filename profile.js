// ═══════════════════════════════════════════════════════════════
// PROFILE PAGE — JavaScript
// Radar Chart + Weak Areas + Skills + Assessments
// ═══════════════════════════════════════════════════════════════

const AUTH_API = 'http://localhost:4000/api';

function getToken() {
    return localStorage.getItem('sf_token');
}

function headers() {
    return {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    };
}

// ── Stored data for cross-section use ───────────────────────────
let cachedSkills = [];
let cachedAssessments = [];

// ── Load Profile ────────────────────────────────────────────────
async function loadProfile() {
    const token = getToken();
    if (!token) {
        document.querySelector('.pf-main').innerHTML =
            '<div class="pf-empty">Please <a href="index.html" style="color:#F5C518">sign in</a> to view your profile.</div>';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API}/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: 'include',
        });
        if (!res.ok) throw new Error('Not authenticated');
        const { user } = await res.json();
        renderProfile(user);
        await Promise.all([loadSkills(), loadAssessments()]);
        renderRadarChart();
        renderWeakAreas();
    } catch (err) {
        document.querySelector('.pf-main').innerHTML =
            '<div class="pf-empty">Session expired. <a href="index.html" style="color:#F5C518">Sign in again</a>.</div>';
    }
}

function renderProfile(user) {
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileBio').textContent = user.bio || 'No bio yet — click Edit Profile to add one!';

    // Photo
    const photoEl = document.getElementById('profilePhoto');
    if (user.profilePhoto) {
        const url = user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:4000${user.profilePhoto}`;
        photoEl.innerHTML = `<img src="${url}" alt="${user.name}">`;
    } else {
        const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('profileInitials').textContent = initials;
    }

    // Stats
    document.getElementById('statXP').textContent = (user.totalXP || 0).toLocaleString();
    document.getElementById('statSkills').textContent = user.skills?.length || 0;
    document.getElementById('statLevel').textContent = user.highestLevel || 1;

    // Setup edit form
    document.getElementById('editName').value = user.name;
    document.getElementById('editBio').value = user.bio || '';
}

// ── Load Skills ─────────────────────────────────────────────────
async function loadSkills() {
    try {
        const res = await fetch(`${AUTH_API}/skills`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) throw new Error();
        const { skills } = await res.json();
        cachedSkills = skills;
        renderSkills(skills);
    } catch {
        document.getElementById('skillsGrid').innerHTML = '<div class="pf-empty">Unable to load skills.</div>';
    }
}

function renderSkills(skills) {
    const grid = document.getElementById('skillsGrid');
    if (!skills.length) {
        grid.innerHTML = '<div class="pf-empty">No skills yet — start a challenge to earn XP!</div>';
        return;
    }

    grid.innerHTML = skills.map(s => `
    <div class="pf-skill-card">
      <div class="pf-skill-name">${s.skillName}</div>
      <div class="pf-skill-level">Level ${s.level}${s.isMaxLevel ? ' ★ MAX' : ''}</div>
      <div class="pf-skill-bar">
        <div class="pf-skill-bar-fill" style="width:${s.progress}%"></div>
      </div>
      <div class="pf-skill-xp">${s.xp} / ${s.nextLevelXP} XP (${s.progress}%)</div>
    </div>
  `).join('');
}

// ── Load Assessments ────────────────────────────────────────────
async function loadAssessments() {
    try {
        const res = await fetch(`${AUTH_API}/skills/assessments`, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (!res.ok) throw new Error();
        const { assessments } = await res.json();
        cachedAssessments = assessments;
        renderAssessments(assessments);
        // Update assessment count stat
        const el = document.getElementById('statAssessments');
        if (el) el.textContent = assessments.length;
    } catch {
        document.getElementById('assessmentsList').innerHTML = '<div class="pf-empty">Unable to load assessments.</div>';
    }
}

function renderAssessments(assessments) {
    const list = document.getElementById('assessmentsList');
    if (!assessments.length) {
        list.innerHTML = '<div class="pf-empty">No assessments yet — complete a challenge to see results here!</div>';
        return;
    }

    list.innerHTML = assessments.slice(0, 10).map(a => {
        const date = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const weakTags = (a.weakTopics || []).map(t => `<span class="pf-weak-tag">${t}</span>`).join('');
        const scoreColor = a.score >= 80 ? '#34d399' : a.score >= 50 ? '#facc15' : '#ef4444';
        return `
      <div class="pf-assessment-card">
        <div>
          <div class="pf-assessment-name">${a.testName}</div>
          <div class="pf-assessment-date">${date}</div>
          ${weakTags ? `<div class="pf-assessment-weak">${weakTags}</div>` : ''}
        </div>
        <div class="pf-assessment-score" style="color:${scoreColor}">${a.score}%</div>
      </div>
    `;
    }).join('');
}

// ── Radar Chart (Canvas) ────────────────────────────────────────
function renderRadarChart() {
    const canvas = document.getElementById('radarChart');
    if (!canvas || !cachedSkills.length) {
        const wrap = document.querySelector('.pf-radar-wrap');
        if (wrap) wrap.innerHTML = '<div class="pf-empty">Play games to see your skill radar!</div>';
        return;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = 150;
    const skills = cachedSkills.map(s => ({
        name: s.skillName,
        value: Math.min(100, (s.xp / (s.nextLevelXP || 100)) * 100 + (s.level - 1) * 10),
    }));
    const n = skills.length;
    const angleStep = (2 * Math.PI) / n;

    // Background grid rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
            const a = i * angleStep - Math.PI / 2;
            const x = cx + r * Math.cos(a);
            const y = cy + r * Math.sin(a);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    for (let i = 0; i < n; i++) {
        const a = i * angleStep - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
        ctx.stroke();
    }

    // Data polygon — filled
    const points = skills.map((s, i) => {
        const a = i * angleStep - Math.PI / 2;
        const r = (s.value / 100) * maxR;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

    // Gradient fill
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    grad.addColorStop(0, 'rgba(245, 197, 24, 0.3)');
    grad.addColorStop(1, 'rgba(56, 212, 196, 0.15)');

    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Data polygon — stroke
    ctx.strokeStyle = 'rgba(245, 197, 24, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();

    // Data points (dots)
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#F5C518';
        ctx.fill();
        ctx.strokeStyle = '#0a0c14';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Labels
    ctx.font = '7px "Press Start 2P"';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    skills.forEach((s, i) => {
        const a = i * angleStep - Math.PI / 2;
        const labelR = maxR + 28;
        let x = cx + labelR * Math.cos(a);
        let y = cy + labelR * Math.sin(a);

        // Adjust alignment based on position
        if (Math.abs(Math.cos(a)) > 0.5) {
            ctx.textAlign = Math.cos(a) > 0 ? 'left' : 'right';
        } else {
            ctx.textAlign = 'center';
        }

        // Truncate long names
        const name = s.name.length > 12 ? s.name.substring(0, 11) + '…' : s.name;
        ctx.fillText(name, x, y);

        // Value label
        ctx.fillStyle = '#F5C518';
        ctx.fillText(Math.round(s.value) + '%', x, y + 14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    });
}

// ── Weak Areas ──────────────────────────────────────────────────
function renderWeakAreas() {
    const grid = document.getElementById('weakAreasGrid');
    if (!grid) return;

    // Collect weak areas from skills
    const weakSkills = cachedSkills.filter(s => s.weakAreas && s.weakAreas.length > 0);

    // Also derive weak topics from recent low-scoring assessments
    const recentLow = cachedAssessments
        .filter(a => a.score < 60)
        .slice(0, 5);

    if (weakSkills.length === 0 && recentLow.length === 0) {
        grid.innerHTML = '<div class="pf-weak-none">🌟 No weak areas detected — keep up the great work!</div>';
        return;
    }

    let html = '';

    // From skill weak areas
    weakSkills.forEach(s => {
        html += `
        <div class="pf-weak-card">
            <div class="pf-weak-skill">⚠️ ${s.skillName}</div>
            <div class="pf-weak-topics">
                ${s.weakAreas.map(t => `<span class="pf-weak-topic-tag">${t}</span>`).join('')}
            </div>
        </div>`;
    });

    // From recent low assessments
    recentLow.forEach(a => {
        if (a.weakTopics && a.weakTopics.length > 0) {
            html += `
            <div class="pf-weak-card">
                <div class="pf-weak-skill">📉 ${a.testName} (${a.score}%)</div>
                <div class="pf-weak-topics">
                    ${a.weakTopics.map(t => `<span class="pf-weak-topic-tag">${t}</span>`).join('')}
                </div>
            </div>`;
        }
    });

    grid.innerHTML = html || '<div class="pf-weak-none">🌟 No weak areas detected!</div>';
}

// ── Edit Profile ────────────────────────────────────────────────
document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('editPanel').style.display = 'block';
    document.getElementById('editPanel').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('cancelEdit').addEventListener('click', () => {
    document.getElementById('editPanel').style.display = 'none';
});

document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('editName').value;
    const bio = document.getElementById('editBio').value;

    try {
        const res = await fetch(`${AUTH_API}/profile`, {
            method: 'PUT',
            headers: headers(),
            credentials: 'include',
            body: JSON.stringify({ name, bio }),
        });
        if (res.ok) {
            document.getElementById('editPanel').style.display = 'none';
            loadProfile();
        }
    } catch (err) {
        console.error('Update failed:', err);
    }
});

// ── Photo Upload ────────────────────────────────────────────────
document.getElementById('photoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
        const res = await fetch(`${AUTH_API}/profile/photo`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` },
            body: formData,
        });
        if (res.ok) loadProfile();
    } catch (err) {
        console.error('Photo upload failed:', err);
    }
});

// ── Check for #edit hash ────────────────────────────────────────
if (window.location.hash === '#edit') {
    setTimeout(() => {
        document.getElementById('editPanel').style.display = 'block';
    }, 500);
}

// ── Init ────────────────────────────────────────────────────────
loadProfile();
