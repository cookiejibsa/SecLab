// Chapter content loader
const chapters = {
  index: null, // loaded from inline
};

async function loadChapter(name) {
  if (name === 'index') {
    try {
      const res = await fetch('chapters/intro.html');
      if (!res.ok) throw new Error();
      const html = await res.text();
      document.getElementById('main-content').innerHTML = html;
      initPageFeatures();
      window.scrollTo(0, 0);
    } catch {
      renderIndex();
    }
    return;
  }
  try {
    const res = await fetch(`chapters/${name}.html`);
    if (!res.ok) throw new Error('not found');
    const html = await res.text();
    document.getElementById('main-content').innerHTML = html;
    initPageFeatures();
    window.scrollTo(0, 0);
  } catch (e) {
    document.getElementById('main-content').innerHTML = `
      <div class="page-header">
        <h2>준비 중</h2>
        <p class="subtitle">이 챕터는 아직 작성 중입니다.</p>
      </div>`;
  }
}

function setActive(chapter) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.chapter === chapter);
  });
}

function updateProgress() {
  const items = document.querySelectorAll('.nav-item[data-chapter]');
  const active = document.querySelector('.nav-item.active');
  if (!active) return;
  const idx = Array.from(items).indexOf(active);
  const pct = Math.round((idx / (items.length - 1)) * 100);
  document.querySelector('.progress-fill').style.width = pct + '%';
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const ch = btn.dataset.chapter;
    setActive(ch);
    updateProgress();
    loadChapter(ch);
  });
});

// Tab UI
function initPageFeatures() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tabs');
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      tabGroup.querySelector(`.tab-panel[data-panel="${target}"]`).classList.add('active');
    });
  });

  // Collapsible
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      header.querySelector('.collapse-icon').textContent = isOpen ? '▶' : '▼';
    });
  });
}

// Index page
function renderIndex() {
  document.getElementById('main-content').innerHTML = `
    <div class="hero">
      <div class="hero-badge">GHIDRA DEEP DIVE</div>
      <h1>Ghidra를 완전히 다루는 기술</h1>
      <p>
        NSA가 만든 무료 리버스 엔지니어링 프레임워크 — 설치와 기초 UI부터
        PCode 데이터 흐름 분석, 스크립팅 자동화, Headless 대량 처리까지
      </p>
      <button class="start-btn" onclick="navTo('ch01')">
        Part 1 부터 시작하기 →
      </button>
      <div class="hero-meta">
        <span>📖 6개 챕터</span>
        <span>🔧 실전 스크립트 6개</span>
        <span>🐍 Python/Java API</span>
        <span>⚡ IDA Pro 경험자 환영</span>
      </div>
    </div>

    <hr style="border-color: var(--border); margin: 8px 0 32px" />

    <!-- PART 1 -->
    <div class="part-title">Part 1 — 기초 & 설치</div>
    <div class="chapter-grid">
      <a class="chapter-card" onclick="navTo('ch01')">
        <div class="ch-num">Chapter 01</div>
        <h3>Ghidra란 무엇인가</h3>
        <p>
          NSA가 왜 만들었고, IDA Pro와 솔직하게 어디서 앞서고 어디서 뒤지는지.
          내부 처리 파이프라인 5단계와 PCode 리프팅의 의미까지.
        </p>
      </a>
      <a class="chapter-card" onclick="navTo('ch02')">
        <div class="ch-num">Chapter 02</div>
        <h3>설치 & 환경 구성</h3>
        <p>
          Java 버전 충돌 완전 해결, OS별 설치 가이드, 프로젝트 구조 이해,
          Auto Analysis 분석기별 용도, 추천 플러그인 목록, 메모리 최적화.
        </p>
      </a>
    </div>

    <!-- PART 2 -->
    <div class="part-title">Part 2 — CodeBrowser 완전 정복</div>
    <div class="chapter-grid">
      <a class="chapter-card" onclick="navTo('ch03')">
        <div class="ch-num">Chapter 03</div>
        <h3>UI 심층 해부 & 분석 워크플로우</h3>
        <p>
          Listing ↔ Decompiler 동기화 원리, XRef 5가지 타입 완전 활용,
          Function Graph, 단축키 총정리, 주석 5종 활용법,
          실전 분석 워크플로우 3가지, Binary Patching.
        </p>
      </a>
      <a class="chapter-card" onclick="navTo('ch04')">
        <div class="ch-num">Chapter 04</div>
        <h3>데이터 타입 & 구조체 정의</h3>
        <p>
          커스텀 struct/union/enum 정의 3가지 방법, C 헤더를 GDT로 임포트,
          구조체 적용 전후 Decompiler 품질 비교, 패딩 주의사항,
          함수 typedef, Version Tracking.
        </p>
      </a>
    </div>

    <!-- PART 3 -->
    <div class="part-title">Part 3 — 자동화 & 고급 기능</div>
    <div class="chapter-grid">
      <a class="chapter-card" onclick="navTo('ch05')">
        <div class="ch-num">Chapter 05</div>
        <h3>스크립팅 자동화 (Python/Java)</h3>
        <p>
          Script Manager 사용법, Ghidra 핵심 API 객체, 실전 스크립트 6개 —
          API XRef 탐색, XOR 문자열 복호화 자동 주석, API 해시 해석,
          함수 복잡도 분류, 바이트 패턴으로 함수 정의, Transaction 패턴.
        </p>
      </a>
      <a class="chapter-card" onclick="navTo('ch06')">
        <div class="ch-num">Chapter 06</div>
        <h3>PCode & Headless 모드</h3>
        <p>
          PCode 70여 가지 연산자와 Varnode 개념, Listing에서 PCode 보기,
          데이터 흐름 역추적, PCode 에뮬레이터로 코드 실행 없이 값 계산,
          analyzeHeadless 완전 가이드, 배치 분석 Shell 파이프라인, BSim.
        </p>
      </a>
    </div>
  `;
}

function navTo(ch) {
  setActive(ch);
  updateProgress();
  loadChapter(ch);
}

// Init
loadChapter('index');
initPageFeatures();
