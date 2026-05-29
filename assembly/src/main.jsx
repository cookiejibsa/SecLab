// ============================================================
// App — 라우팅, 사이드바, 진행률, 다크/라이트 토글
// ============================================================

const PARTS = [
{ id: "part1", num: "Part 1", label: "CS 기초", chapters: [
  { id: "p1c1", num: "1.1", title: "컴퓨터 기본 구조" },
  { id: "p1c2", num: "1.2", title: "수 체계와 진법" },
  { id: "p1c3", num: "1.3", title: "메모리 구조" },
  { id: "p1c4", num: "1.4", title: "CPU 작동 원리" },
  { id: "p1c5", num: "1.5", title: "운영체제 기초" }]
},
{ id: "part2", num: "Part 2", label: "어셈블리 기초", chapters: [
  { id: "p2c1", num: "2.1", title: "어셈블리 파일 구조" },
  { id: "p2c2", num: "2.2", title: "레지스터" },
  { id: "p2c3", num: "2.3", title: "기본 명령어" },
  { id: "p2c4", num: "2.4", title: "메모리 접근" },
  { id: "p2c5", num: "2.5", title: "플래그와 점프" },
  { id: "p2c6", num: "2.6", title: "스택 동작" }]
},
{ id: "part3", num: "Part 3", label: "중급 문법", chapters: [
  { id: "p3c1", num: "3.1", title: "함수 호출 규약" },
  { id: "p3c2", num: "3.2", title: "스택 프레임" },
  { id: "p3c3", num: "3.3", title: "배열과 구조체" },
  { id: "p3c4", num: "3.4", title: "문자열 조작" },
  { id: "p3c5", num: "3.5", title: "시스템 콜" }]
},
{ id: "part4", num: "Part 4", label: "고급 문법", chapters: [
  { id: "p4c1", num: "4.1", title: "최적화 패턴" },
  { id: "p4c2", num: "4.2", title: "SIMD 명령어" },
  { id: "p4c3", num: "4.3", title: "C → ASM 패턴" },
  { id: "p4c4", num: "4.4", title: "리버싱 기법" },
  { id: "p4c5", num: "4.5", title: "보안 취약점" }]
}];


// 챕터 id → 컴포넌트 매핑 (window.P1C1 등으로 등록되어 있음)
function getChapterComponent(id) {
  const name = id.toUpperCase();
  return window[name] || (() =>
  <div>
      <h1>준비 중</h1>
      <p>이 챕터의 컴포넌트({name})가 로드되지 않았습니다.</p>
    </div>);

}

const FLAT = PARTS.flatMap((p) => p.chapters.map((c) => ({ ...c, partId: p.id, partNum: p.num })));
const ALL_IDS = new Set(["cover", ...FLAT.map((c) => c.id)]);

function App() {
  const [current, setCurrent] = React.useState(() => {
    const h = window.location.hash.replace("#", "");
    return ALL_IDS.has(h) ? h : "cover";
  });

  const [progress, setProgress] = React.useState(() => {
    try {return JSON.parse(localStorage.getItem("asm-progress") || "{}");}
    catch {return {};}
  });

  const [theme, setTheme] = React.useState(() => localStorage.getItem("asm-theme") || "light");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(() => localStorage.getItem("asm-sidebar-collapsed") === "1");

  React.useEffect(() => {
    localStorage.setItem("asm-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("asm-theme", theme);
  }, [theme]);

  React.useEffect(() => {
    function onHash() {
      const h = window.location.hash.replace("#", "");
      if (ALL_IDS.has(h)) setCurrent(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setSidebarOpen(false);
  }, [current]);

  React.useEffect(() => {
    localStorage.setItem("asm-progress", JSON.stringify(progress));
  }, [progress]);

  function navigate(id) {
    window.location.hash = id;
    setCurrent(id);
  }

  function toggleComplete(id) {
    setProgress((p) => ({ ...p, [id]: !p[id] }));
  }

  const done = FLAT.filter((c) => progress[c.id]).length;
  const pct = Math.round(done / FLAT.length * 100);

  // prev/next 계산 — cover는 첫 챕터로 연결, 챕터들은 FLAT 인덱스로
  let prev = null,next = null;
  if (current === "cover") {
    next = FLAT[0];
  } else {
    const idx = FLAT.findIndex((c) => c.id === current);
    if (idx > 0) prev = FLAT[idx - 1];
    if (idx < FLAT.length - 1) next = FLAT[idx + 1];
    if (idx === 0) prev = { id: "cover", title: "표지 · 목차" };
  }

  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <button className="menu-btn" onClick={() => setSidebarOpen((v) => !v)}>
        ☰ 목차
      </button>

      {collapsed &&
      <button
        className="sidebar-expand"
        onClick={() => setCollapsed(false)}
        title="사이드바 열기"
        aria-label="사이드바 열기">
        
          ›
        </button>
      }

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-collapse-wrap">
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed(true)}
              title="사이드바 접기"
              aria-label="사이드바 접기">
              
              ‹
            </button>
          </div>
          <div className="sidebar-brand">x86-64 Guidebook</div>
          <h2 className="sidebar-title" onClick={() => navigate("cover")} style={{ cursor: "pointer" }}>
            어셈블리어 완벽 정복
          </h2>
          <div className="sidebar-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="progress-pct">{pct}%</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <button
              className={`sidebar-nav-item ${current === "cover" ? "active" : ""}`}
              onClick={() => navigate("cover")}>
              
              <span className="sidebar-nav-num">Intro</span>
              <span>표지 · 목차</span>
            </button>
          </div>

          {PARTS.map((part) =>
          <div key={part.id} className="sidebar-nav-section">
              <div className="sidebar-nav-label">
                <span>{part.num}</span>
                <span className="sidebar-part-label">{part.label}</span>
              </div>
              {part.chapters.map((c) =>
            <button
              key={c.id}
              className={`sidebar-nav-item ${current === c.id ? "active" : ""}`}
              onClick={() => navigate(c.id)}>
              
                  <span className="sidebar-nav-num">{c.num}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{c.title}</span>
                  <span className={`sidebar-nav-check ${progress[c.id] ? "done" : ""}`}>
                    {progress[c.id] ? "✓" : ""}
                  </span>
                </button>
            )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <span style={{ fontSize: 11, color: "var(--fg-faint)", fontFamily: "var(--font-mono)" }}>
            v0.2 · draft
          </span>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => t === "light" ? "dark" : "light")}
            title={theme === "light" ? "다크 모드로" : "라이트 모드로"}>
            
            {theme === "light" ? "☾ 다크" : "☀ 라이트"}
          </button>
        </div>
      </aside>

      <main className="content">
        {current === "cover" ?
        <ChapterCover parts={PARTS} navigate={navigate} progress={progress} totalChapters={FLAT.length} /> :

        (() => {
          const Comp = getChapterComponent(current);
          return <Comp />;
        })()
        }

        {current !== "cover" &&
        <>
            <CompleteButton
            chapterId={current}
            done={!!progress[current]}
            onToggle={() => toggleComplete(current)} />
          
            <ChapterNav prev={prev} next={next} navigate={navigate} />
          </>
        }
      </main>
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);