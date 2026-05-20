// Shared sidebar HTML
function renderSidebar(rootPath = '') {
  return `
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      Metasploit 가이드북
    </div>
    <p>침투 테스트 완전 정복</p>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-section-label">시작하기</div>
    <a href="${rootPath}index.html"><span class="nav-num">00</span> 목차 &amp; 개요</a>
    <a href="${rootPath}chapters/chapter1.html"><span class="nav-num">01</span> Metasploit이란?</a>
    <a href="${rootPath}chapters/chapter2.html"><span class="nav-num">02</span> 설치 &amp; 환경 구성</a>

    <div class="nav-section-label">핵심 개념</div>
    <a href="${rootPath}chapters/chapter3.html"><span class="nav-num">03</span> MSF 콘솔 기초</a>
    <a href="${rootPath}chapters/chapter4.html"><span class="nav-num">04</span> Exploit &amp; Payload</a>
    <a href="${rootPath}chapters/chapter5.html"><span class="nav-num">05</span> Meterpreter 완전 정복</a>

    <div class="nav-section-label">실전 기술</div>
    <a href="${rootPath}chapters/chapter6.html"><span class="nav-num">06</span> 정보 수집 &amp; 스캔</a>
    <a href="${rootPath}chapters/chapter7.html"><span class="nav-num">07</span> 취약점 분석 &amp; 공격</a>
    <a href="${rootPath}chapters/chapter8.html"><span class="nav-num">08</span> 포스트 익스플로잇</a>

    <div class="nav-section-label">심화 &amp; 윤리</div>
    <a href="${rootPath}chapters/chapter9.html"><span class="nav-num">09</span> 커스텀 모듈 개발</a>
    <a href="${rootPath}chapters/chapter10.html"><span class="nav-num">10</span> 윤리 &amp; 법적 기준</a>
  </nav>
  <div class="sidebar-footer">
    ⚠️ 교육 목적 전용 — 무단 사용 금지
  </div>
</aside>`;
}
