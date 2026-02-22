// ═══════════════════════════════════════════════════════════════
// SKILL FORGE — AUTH SYSTEM (Frontend)
// ═══════════════════════════════════════════════════════════════

const AUTH_API = 'http://localhost:4000/api';

// ── State ─────────────────────────────────────────────────────
let currentUser = null;

// ── DOM refs (lazy-loaded) ────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ══════════════════════════════════════════════════════════════
// 1. INITIALISATION
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    // Check for Google OAuth redirect token
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('auth_token');
    if (authToken) {
        localStorage.setItem('sf_token', authToken);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
    }

    // Check if user is logged in
    const token = localStorage.getItem('sf_token');
    if (token) {
        try {
            const res = await fetch(`${AUTH_API}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setLoggedIn(data.user);
            } else {
                localStorage.removeItem('sf_token');
            }
        } catch (e) {
            console.warn('Auth server not reachable:', e.message);
        }
    }

    // Setup event listeners
    setupAuthListeners();
});

// ══════════════════════════════════════════════════════════════
// 2. AUTH STATE
// ══════════════════════════════════════════════════════════════

function setLoggedIn(user) {
    currentUser = user;

    // Hide signup button, show profile container
    const signupBtn = $('.btn-signup');
    const profileNav = $('.profile-nav-container');

    if (signupBtn) signupBtn.classList.add('hidden');
    if (profileNav) {
        profileNav.classList.add('visible');

        // Set avatar
        const avatar = profileNav.querySelector('.profile-avatar');
        if (avatar) {
            if (user.profilePhoto) {
                const photoUrl = user.profilePhoto.startsWith('http')
                    ? user.profilePhoto
                    : `http://localhost:4000${user.profilePhoto}`;
                avatar.innerHTML = `<img src="${photoUrl}" alt="${user.name}">`;
            } else {
                const initials = user.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                avatar.innerHTML = `<span class="profile-avatar-initials">${initials}</span>`;
            }
        }

        // Set dropdown info
        const ddName = profileNav.querySelector('.dropdown-name');
        const ddEmail = profileNav.querySelector('.dropdown-email');
        const ddXP = profileNav.querySelector('.dropdown-xp');
        if (ddName) ddName.textContent = user.name;
        if (ddEmail) ddEmail.textContent = user.email;
        if (ddXP) ddXP.textContent = `⚡ ${user.totalXP || 0} XP • Level ${user.highestLevel || 1}`;
    }

    // Close auth modal if open
    closeAuthModal();
}

function setLoggedOut() {
    currentUser = null;
    localStorage.removeItem('sf_token');

    const signupBtn = $('.btn-signup');
    const profileNav = $('.profile-nav-container');

    if (signupBtn) signupBtn.classList.remove('hidden');
    if (profileNav) profileNav.classList.remove('visible');
}

// ══════════════════════════════════════════════════════════════
// 3. AUTH MODAL
// ══════════════════════════════════════════════════════════════

function openAuthModal(mode = 'signup') {
    const overlay = $('#authOverlay');
    if (!overlay) return;

    overlay.classList.add('active');

    // Toggle forms
    const signupForm = $('#signupForm');
    const loginForm = $('#loginForm');

    if (mode === 'signup') {
        if (signupForm) signupForm.style.display = 'flex';
        if (loginForm) loginForm.style.display = 'none';
        overlay.querySelector('h2').textContent = 'Create Account';
        overlay.querySelector('.auth-subtitle').textContent = 'Start your coding adventure today';
    } else {
        if (signupForm) signupForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'flex';
        overlay.querySelector('h2').textContent = 'Welcome Back';
        overlay.querySelector('.auth-subtitle').textContent = 'Sign in to continue your quest';
    }

    // Clear error
    const err = overlay.querySelector('.auth-error');
    if (err) err.classList.remove('visible');
}

function closeAuthModal() {
    const overlay = $('#authOverlay');
    if (overlay) overlay.classList.remove('active');
}

function showAuthError(msg) {
    const err = $('#authOverlay .auth-error');
    if (err) {
        err.textContent = msg;
        err.classList.add('visible');
    }
}

// ══════════════════════════════════════════════════════════════
// 4. AUTH FORM HANDLERS
// ══════════════════════════════════════════════════════════════

async function handleSignup(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.auth-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
        const name = e.target.querySelector('[name="name"]').value.trim();
        const email = e.target.querySelector('[name="email"]').value.trim();
        const password = e.target.querySelector('[name="password"]').value;

        const res = await fetch(`${AUTH_API}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error || 'Signup failed');
            return;
        }

        localStorage.setItem('sf_token', data.token);
        setLoggedIn(data.user);
    } catch (err) {
        showAuthError('Cannot connect to server. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.auth-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
        const email = e.target.querySelector('[name="email"]').value.trim();
        const password = e.target.querySelector('[name="password"]').value;

        const res = await fetch(`${AUTH_API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            showAuthError(data.error || 'Login failed');
            return;
        }

        localStorage.setItem('sf_token', data.token);
        setLoggedIn(data.user);
    } catch (err) {
        showAuthError('Cannot connect to server. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

async function handleLogout() {
    try {
        await fetch(`${AUTH_API}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        // Ignore — clear client-side regardless
    }
    setLoggedOut();
    closeProfileDropdown();
}

function handleGoogleLogin() {
    window.location.href = `${AUTH_API}/auth/google`;
}

// ══════════════════════════════════════════════════════════════
// 5. PROFILE DROPDOWN
// ══════════════════════════════════════════════════════════════

function toggleProfileDropdown() {
    const dd = $('.profile-dropdown');
    if (dd) dd.classList.toggle('active');
}

function closeProfileDropdown() {
    const dd = $('.profile-dropdown');
    if (dd) dd.classList.remove('active');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
    const container = $('.profile-nav-container');
    if (container && !container.contains(e.target)) {
        closeProfileDropdown();
    }
});

// ══════════════════════════════════════════════════════════════
// 6. SETUP LISTENERS
// ══════════════════════════════════════════════════════════════

function setupAuthListeners() {
    // Sign up button in navbar
    const signupBtn = $('.btn-signup');
    if (signupBtn) {
        signupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openAuthModal('signup');
        });
    }

    // Modal close button
    const closeBtn = $('.auth-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);

    // Overlay click to close
    const overlay = $('#authOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAuthModal();
        });
    }

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAuthModal();
            closeProfileDropdown();
        }
    });

    // Signup form
    const signupForm = $('#signupForm');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);

    // Login form
    const loginForm = $('#loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    // Toggle to login link
    const toLogin = $('#switchToLogin');
    if (toLogin) toLogin.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });

    // Toggle to signup link
    const toSignup = $('#switchToSignup');
    if (toSignup) toSignup.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('signup'); });

    // Google buttons
    $$('.auth-google-btn').forEach((btn) => {
        btn.addEventListener('click', handleGoogleLogin);
    });

    // Profile avatar → toggle dropdown
    const avatar = $('.profile-avatar');
    if (avatar) avatar.addEventListener('click', toggleProfileDropdown);

    // Dropdown items
    const logoutItem = $('#dropdownLogout');
    if (logoutItem) logoutItem.addEventListener('click', handleLogout);

    const profileItem = $('#dropdownProfile');
    if (profileItem) profileItem.addEventListener('click', () => {
        window.open('profile.html', '_blank');
        closeProfileDropdown();
    });

    const editProfileItem = $('#dropdownEditProfile');
    if (editProfileItem) editProfileItem.addEventListener('click', () => {
        window.open('profile.html#edit', '_blank');
        closeProfileDropdown();
    });

    const skillTreeItem = $('#dropdownSkillTree');
    if (skillTreeItem) skillTreeItem.addEventListener('click', () => {
        window.open('skilltree.html', '_blank');
        closeProfileDropdown();
    });

    const dashboardItem = $('#dropdownDashboard');
    if (dashboardItem) dashboardItem.addEventListener('click', () => {
        window.open('dashboard.html', '_blank');
        closeProfileDropdown();
    });

    // Skill tree button in navbar
    const skillTreeBtn = $('.nav-skilltree-btn');
    if (skillTreeBtn) skillTreeBtn.addEventListener('click', () => {
        window.open('skilltree.html', '_blank');
    });
}
