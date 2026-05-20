async function loadChapter(name) {
  const src = name === 'index' ? 'chapters/intro.html' : `chapters/${name}.html`;
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error();
    document.getElementById('main-content').innerHTML = await res.text();
    initPageFeatures();
    window.scrollTo(0, 0);
  } catch {
    document.getElementById('main-content').innerHTML = `
      <div class="page-header">
        <h2>준비 중</h2>
        <p class="subtitle">이 챕터는 아직 작성 중입니다.</p>
      </div>`;
  }
}

function setActive(chapter) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.chapter === chapter));
}

function updateProgress() {
  const items = [...document.querySelectorAll('.nav-item[data-chapter]')];
  const active = document.querySelector('.nav-item.active');
  if (!active) return;
  const pct = Math.round((items.indexOf(active) / (items.length - 1)) * 100);
  document.querySelector('.progress-fill').style.width = pct + '%';
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    setActive(btn.dataset.chapter);
    updateProgress();
    loadChapter(btn.dataset.chapter);
  });
});

function initPageFeatures() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = btn.closest('.tabs');
      g.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      g.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      g.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
    });
  });
  document.querySelectorAll('.collapsible-header').forEach(h => {
    h.addEventListener('click', () => {
      const body = h.nextElementSibling;
      const open = body.style.display !== 'none';
      body.style.display = open ? 'none' : 'block';
      h.querySelector('.collapse-icon').textContent = open ? '▶' : '▼';
    });
  });
}

function navTo(ch) {
  setActive(ch);
  updateProgress();
  loadChapter(ch);
}

loadChapter('index');
initPageFeatures();
