// 표지 + 서문 + 목차 (Part 구조)
function ChapterCover({ parts, navigate, progress, totalChapters }) {
  const totalRead = parts.flatMap(p => p.chapters).filter(c => progress[c.id]).length;
  return (
    <div className="cover">
      <div className="cover-eyebrow">x86-64 Assembly · 입문 가이드북</div>
      <h1>어셈블리어<br />완벽 정복</h1>
      <div className="cover-en">A Practical Guide to x86-64 Assembly</div>

      <p className="cover-lede">
        C 언어를 한 번이라도 만져본 적이 있다면, 이미 절반은 온 것입니다.
        이 책은 컴파일러가 만들어내는 그 낯선 코드를 <strong>한 줄씩</strong> 읽고,
        직접 <strong>실행해보며</strong>, 기계와 대화하는 법을 배우는 짧은 여정입니다.
      </p>

      <div className="cover-meta">
        <div>
          <div className="cover-meta-item-label">대상</div>
          <div className="cover-meta-item-value">C 경험이 있는 학습자</div>
        </div>
        <div>
          <div className="cover-meta-item-label">아키텍처</div>
          <div className="cover-meta-item-value">x86-64 (Intel)</div>
        </div>
        <div>
          <div className="cover-meta-item-label">진행률</div>
          <div className="cover-meta-item-value">{totalRead} / {totalChapters} 챕터</div>
        </div>
      </div>

      {parts.map(part => (
        <section key={part.id} className="cover-part">
          <div className="cover-part-header">
            <div className="cover-part-num">{part.num}</div>
            <div className="cover-part-label">{part.label}</div>
          </div>
          <div className="cover-toc">
            {part.chapters.map(c => (
              <div className="cover-toc-item" key={c.id} onClick={() => navigate(c.id)}>
                <div className="cover-toc-num">{c.num}</div>
                <div className="cover-toc-body">
                  <div className="cover-toc-title-text">{c.title}</div>
                  {c.desc && <div className="cover-toc-desc">{c.desc}</div>}
                </div>
                <div className="cover-toc-meta">
                  {progress[c.id] ? "✓ 완료" : ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <button className="cover-start-btn" onClick={() => navigate(parts[0].chapters[0].id)}>
        시작하기 →
      </button>

      <p style={{ fontSize: 13, color: "var(--fg-faint)", marginTop: 48, lineHeight: 1.6 }}>
        ※ 이 가이드북의 모든 코드는 Linux x86-64 (System V AMD64 ABI), Intel 문법(NASM 호환)을 기준으로 작성되었습니다.
        macOS·Windows 환경에서는 함수 호출 규약·심볼 접두사 등이 다를 수 있습니다.
      </p>
    </div>
  );
}

window.ChapterCover = ChapterCover;
