// ═══════════════════════════════════════════════════════════════
// SKILL TREE — JavaScript
// Gamified Skill Tree Visualization
// ═══════════════════════════════════════════════════════════════

const AUTH_API = 'http://localhost:4000/api';

function getToken() {
    return localStorage.getItem('sf_token');
}

// Skill category icons and colors
const SKILL_META = {
    'Logical Reasoning': { icon: '🧠', color: '#a855f7' },
    'Data Structures': { icon: '🏗️', color: '#3b82f6' },
    'Algorithms': { icon: '⚡', color: '#F5C518' },
    'Problem Solving': { icon: '🧩', color: '#38d4c4' },
    'Debugging': { icon: '🔍', color: '#ff6eb4' },
    'SQL & Databases': { icon: '🗄️', color: '#f59e0b' },
};

// Tree layout — rows of skills
const TREE_LAYOUT = [
    ['Logical Reasoning', 'Problem Solving'],
    ['Data Structures', 'Algorithms'],
    ['Debugging', 'SQL & Databases'],
];

let skillsData = [];

// ── Load Skill Tree Data ────────────────────────────────────────
async function loadSkillTree() {
    const token = getToken();
    if (!token) {
        document.getElementById('skillTree').innerHTML =
            '<div class="st-empty">Please <a href="index.html" style="color:#F5C518">sign in</a> to view your skill tree.</div>';
        return;
    }

    try {
        const res = await fetch(`${AUTH_API}/skills`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        skillsData = data.skills;
        renderTree(data.skills);
        updateSummary(data.skills);
    } catch {
        document.getElementById('skillTree').innerHTML =
            '<div class="st-empty">Unable to load skill tree. <a href="index.html" style="color:#F5C518">Sign in</a>.</div>';
    }
}

// ── Render Tree ─────────────────────────────────────────────────
function renderTree(skills) {
    const container = document.getElementById('skillTree');
    container.innerHTML = '';

    TREE_LAYOUT.forEach((row, rowIdx) => {
        // Connector
        if (rowIdx > 0) {
            const connectors = document.createElement('div');
            connectors.className = 'st-connectors';
            connectors.innerHTML = '<div class="st-connector-line"></div>';
            container.appendChild(connectors);
        }

        // Row of nodes
        const rowEl = document.createElement('div');
        rowEl.className = 'st-tree-row';

        row.forEach((skillName) => {
            const skill = skills.find(s => s.skillName === skillName);
            if (!skill) return;

            const meta = SKILL_META[skillName] || { icon: '⚡', color: '#F5C518' };
            const isUnlocked = skill.isUnlocked;
            const isMaxed = skill.isMaxLevel && skill.level >= 10;

            const node = document.createElement('div');
            node.className = `st-node ${isMaxed ? 'maxed' : isUnlocked ? 'unlocked' : 'locked'}`;
            node.style.setProperty('--node-color', meta.color);

            node.innerHTML = `
        ${!isUnlocked ? '<div class="st-node-lock">🔒</div>' : ''}
        <div class="st-node-icon">${meta.icon}</div>
        <div class="st-node-name">${skillName}</div>
        <div class="st-node-level">LVL ${skill.level}${isMaxed ? ' ★' : ''}</div>
        <div class="st-node-bar">
          <div class="st-node-bar-fill" style="width:0%"></div>
        </div>
        <div class="st-node-xp">${skill.xp} XP</div>
      `;

            // Click to show detail
            if (isUnlocked) {
                node.addEventListener('click', () => showDetail(skill, meta));
            }

            rowEl.appendChild(node);

            // Animate XP bar after a delay
            setTimeout(() => {
                const bar = node.querySelector('.st-node-bar-fill');
                if (bar) bar.style.width = `${skill.progress}%`;
            }, 300 + rowIdx * 200);
        });

        container.appendChild(rowEl);
    });
}

// ── Update Summary ──────────────────────────────────────────────
function updateSummary(skills) {
    const totalXP = skills.reduce((sum, s) => sum + s.xp, 0);
    const maxLevel = skills.reduce((max, s) => Math.max(max, s.level), 1);

    document.getElementById('totalXP').textContent = totalXP.toLocaleString();
    document.getElementById('totalSkills').textContent = skills.length;
    document.getElementById('maxLevel').textContent = maxLevel;
}

// ── Show Detail Panel ───────────────────────────────────────────
function showDetail(skill, meta) {
    const panel = document.getElementById('detailPanel');
    panel.style.display = 'block';

    document.getElementById('detailIcon').textContent = meta.icon;
    document.getElementById('detailName').textContent = skill.skillName;
    document.getElementById('detailLevel').textContent =
        skill.isMaxLevel ? `Level ${skill.level} ★ MAX` : `Level ${skill.level}`;

    // XP bar
    setTimeout(() => {
        document.getElementById('detailBarFill').style.width = `${skill.progress}%`;
    }, 100);
    document.getElementById('detailXP').textContent =
        `${skill.xp} / ${skill.nextLevelXP} XP (${skill.progress}%)`;

    // Weak areas
    const weakEl = document.getElementById('detailWeak');
    if (skill.weakAreas && skill.weakAreas.length > 0) {
        weakEl.innerHTML = '<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px">Weak Areas:</div>' +
            skill.weakAreas.map(w => `<span class="st-detail-weak-tag">${w}</span>`).join('');
    } else {
        weakEl.innerHTML = '';
    }

    // Status
    const statusEl = document.getElementById('detailStatus');
    if (skill.isMaxLevel) {
        statusEl.className = 'st-detail-status complete';
        statusEl.textContent = '✅ Mastered!';
    } else if (skill.isUnlocked) {
        statusEl.className = 'st-detail-status active';
        statusEl.textContent = '🔥 In Progress — Keep going!';
    } else {
        statusEl.className = 'st-detail-status locked';
        statusEl.textContent = '🔒 Locked — Complete challenges to unlock';
    }
}

// ── Close Detail Panel ──────────────────────────────────────────
document.getElementById('closeDetail').addEventListener('click', () => {
    document.getElementById('detailPanel').style.display = 'none';
});

// ── Init ────────────────────────────────────────────────────────
loadSkillTree();
