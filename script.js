// ==============================
// NAVBAR SCROLL EFFECT
// ==============================

const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ==============================
// COURSE CARD FILTERING
// ==============================

const filterTags = document.querySelectorAll('.filter-tags .tag');
const courseCards = document.querySelectorAll('.course-card');
const searchInput = document.getElementById('courseSearch');
let activeFilter = 'popular';

filterTags.forEach(tag => {
  tag.addEventListener('click', () => {
    filterTags.forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    activeFilter = tag.id.replace('tag-', '');
    filterCourses();
  });
});

searchInput.addEventListener('input', filterCourses);

function filterCourses() {
  const q = searchInput.value.toLowerCase().trim();
  courseCards.forEach(card => {
    const cats = card.dataset.category || '';
    const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
    const desc = (card.querySelector('.card-desc')?.textContent || '').toLowerCase();
    const ok = (activeFilter === 'popular' || cats.includes(activeFilter)) &&
      (!q || title.includes(q) || desc.includes(q));
    card.classList.toggle('hidden', !ok);
  });
}

// ==============================
// INTERSECTION OBSERVER � fade sections in
// ==============================

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.courses-heading, .features-heading, .cta-heading, .stat-item, .feature-card, .course-card'
).forEach((el, i) => {
  if (el.classList.contains('feature-card')) el.style.transitionDelay = `${(i % 4) * 0.08}s`;
  if (el.classList.contains('course-card')) el.style.transitionDelay = `${(i % 9) * 0.05}s`;
  observer.observe(el);
});

// ==============================
// PIXEL SPARKLE CURSOR TRAIL (hero only)
// ==============================

const heroEl = document.getElementById('hero');
let sparkleStyleAdded = false;

heroEl.addEventListener('mousemove', e => {
  if (Math.random() > 0.65) return;

  if (!sparkleStyleAdded) {
    const s = document.createElement('style');
    s.textContent = `@keyframes sparkleAnim {
      0%   { opacity:1; transform:translate(0,0) scale(1); }
      100% { opacity:0; transform:translate(var(--tx),var(--ty)) scale(0); }
    }`;
    document.head.appendChild(s);
    sparkleStyleAdded = true;
  }

  const colors = ['#F5C518', '#ff6eb4', '#38d4c4', '#ffffff'];
  const el = document.createElement('div');
  const size = Math.random() * 5 + 3;
  const tx = `${(Math.random() - 0.5) * 30}px`;
  const ty = `${-Math.random() * 40 - 10}px`;
  el.style.cssText = `
    position:fixed; left:${e.clientX}px; top:${e.clientY}px;
    width:${size}px; height:${size}px;
    background:${colors[Math.floor(Math.random() * colors.length)]};
    pointer-events:none; z-index:9999; border-radius:1px;
    --tx:${tx}; --ty:${ty};
    animation:sparkleAnim 0.6s ease forwards;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 650);
});

// ==============================
// SMOOTH ANCHOR SCROLL
// ==============================

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ==============================
// INTERVIEW CARD � open in new tab
// ==============================
const interviewCard = document.getElementById('interviewCard');
if (interviewCard) {
  interviewCard.style.cursor = 'pointer';
  interviewCard.addEventListener('click', () => {
    window.open('interview.html', '_blank');
  });
}

// ==============================
// PUBLIC SPEAKING CARD - open in new tab
// ==============================
const speakingCard = document.getElementById('speakingCard');
if (speakingCard) {
  speakingCard.addEventListener('click', () => {
    window.open('public_speaking.html', '_blank');
  });
}
