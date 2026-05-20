// ── 탭 시스템 ─────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabs => {
    const btns = tabs.querySelectorAll('.tab-btn');
    const panels = tabs.querySelectorAll('.tab-panel');
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        panels[i].classList.add('active');
      });
    });
    if (btns[0]) { btns[0].classList.add('active'); panels[0].classList.add('active'); }
  });
}

// ── 사이드바 네비게이션 ──────────────────────────
function initNav() {
  const items = document.querySelectorAll('.nav-item[data-chapter]');
  items.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.chapter;
      loadChapter(target);
    });
  });
}

// ── 심화 학습 ────────────────────────────────────
function advanced(name) {
  window.open(`https://cookiejibsa.github.io/SecLab/tools/${name}/`, "_blank");
}

// ── 챕터 로드 ────────────────────────────────────
let currentChapter = null;

async function loadChapter(name) {
  if (currentChapter === name) return;
  currentChapter = name;

  // nav active
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chapter === name);
  });

  const main = document.getElementById('main-content');
  main.style.opacity = '0';
  main.style.transform = 'translateY(8px)';

  try {
    const res = await fetch(`chapter/${name}.html`);
    const html = await res.text();
    main.innerHTML = html;
    initTabs();
    updateProgress();
    window.scrollTo(0, 0);
  } catch (e) {
    main.innerHTML = `<p style="color:var(--text-muted)">챕터를 불러오는 중 오류가 발생했습니다.</p>`;
  }

  requestAnimationFrame(() => {
    main.style.transition = 'opacity 0.25s, transform 0.25s';
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  });
}

// ── 진행도 ──────────────────────────────────────
const CHAPTERS = [
  'ch01','ch02','ch03','ch04',
  'ch05','ch06','ch07',
  'ch08','ch09','ch10','ch11',
  'ch12','ch13','ch14',
  'ch15','ch16',
  'ch17','ch18','ch19',
];

function updateProgress() {
  const visited = JSON.parse(sessionStorage.getItem('visited') || '[]');
  if (currentChapter && !visited.includes(currentChapter)) {
    visited.push(currentChapter);
    sessionStorage.setItem('visited', JSON.stringify(visited));
  }
  const pct = Math.round((visited.length / CHAPTERS.length) * 100);
  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = pct + '%';
}

// ── 초기화 ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTabs();
  loadChapter('index');
});
