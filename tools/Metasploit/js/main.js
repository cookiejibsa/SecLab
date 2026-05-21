// ── Reading progress bar ──
function initProgress() {
  const bar = document.querySelector('.reading-progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (window.scrollY / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  });
}

// ── Active nav link ──
function initActiveNav() {
  const links = document.querySelectorAll('.sidebar-nav a');
  const current = window.location.pathname.split('/').pop();
  links.forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Tabs ──
function initTabs() {
  // .tab-group 또는 .tab-container 둘 다 지원
  document.querySelectorAll('.tab-group, .tab-container').forEach(group => {
    const btns = group.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        // 같은 container 안의 버튼만 비활성화
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.getAttribute('data-tab');
        if (tabId) {
          // data-tab 방식: id로 콘텐츠 찾기
          group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          const target = group.querySelector('#' + tabId);
          if (target) target.classList.add('active');
        } else {
          // fallback: 인덱스 방식
          const contents = group.querySelectorAll('.tab-content');
          const i = Array.from(btns).indexOf(btn);
          contents.forEach(c => c.classList.remove('active'));
          if (contents[i]) contents[i].classList.add('active');
        }
      });
    });
    if (btns.length) { btns[0].click(); }
  });
}

// ── Accordion ──
function initAccordion() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const acc = header.parentElement;
      acc.classList.toggle('open');
    });
  });
}

// ── Copy buttons ──
function initCopy() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block').querySelector('pre');
      const text = pre.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓ 복사됨';
        btn.style.color = 'var(--green)';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
      });
    });
  });
}

// ── Smooth scroll for anchor links ──
function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initProgress();
  initActiveNav();
  initTabs();
  initAccordion();
  initCopy();
  initAnchorScroll();
});
