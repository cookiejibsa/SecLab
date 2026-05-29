// ============================================================
// 공용 컴포넌트 — Callout, CodeBlock, KeyTerm, DefBox, ...
// ============================================================

const { useState, useEffect, useRef, useMemo } = React;

// ---- Callout: info / tip / warn / note --------------------
function Callout({ type = "info", title, children }) {
  const icons = { info: "i", tip: "✓", warn: "!", note: "?" };
  const defaultTitles = { info: "참고", tip: "팁", warn: "주의", note: "노트" };
  return (
    <div className={`callout ${type}`}>
      <div className="callout-icon">{icons[type]}</div>
      <div className="callout-body">
        <div className="callout-title">{title || defaultTitles[type]}</div>
        {children}
      </div>
    </div>);

}

// ---- KeyTerm: 호버 시 툴팁이 뜨는 용어 ---------------------
function KeyTerm({ term, children }) {
  return (
    <span className="kterm">
      {children}
      <span className="kterm-tip">{term}</span>
    </span>);

}

// ---- Definition Box ---------------------------------------
function DefBox({ term, en, children }) {
  return (
    <div className="defbox">
      <div className="defbox-label">정의</div>
      <div className="defbox-term">
        {term}
        {en && <span className="term-en">{en}</span>}
      </div>
      <div className="defbox-body">{children}</div>
    </div>);

}

// ---- KeyPoint --------------------------------------------
function KeyPoint({ n, children }) {
  return (
    <div className="keypoint">
      <div className="keypoint-num">{String(n).padStart(2, "0")}</div>
      <div className="keypoint-text">{children}</div>
    </div>);

}

// ---- Code highlighting -----------------------------------
// 가벼운 어셈블리/C 구문 강조 — 정규식 토큰 기반
function highlightAsm(code) {
  // 행 단위로 처리하여 주석 토큰을 깔끔히 잡음
  const KW = /\b(mov|movq|movl|movw|movb|add|sub|imul|idiv|inc|dec|push|pop|call|ret|jmp|je|jne|jg|jl|jge|jle|cmp|test|lea|xor|and|or|not|shl|shr|nop|syscall|leave|enter|section|global|extern)\b/gi;
  const REG = /\b(r[abcd]x|r[sd]i|r[bs]p|r8|r9|r10|r11|r12|r13|r14|r15|e[abcd]x|e[sd]i|e[bs]p|[abcd]x|[abcd][hl]|rip|rflags)\b/gi;
  const NUM = /\b(0x[0-9a-f]+|\d+)\b/gi;
  const LBL = /^(\s*)([._a-zA-Z]\w*):/;

  return code.split("\n").map((line, i) => {
    // 주석 분리 (; 또는 //)
    let body = line,comment = "";
    const cIdx = line.search(/;|\/\//);
    if (cIdx >= 0) {
      body = line.slice(0, cIdx);
      comment = line.slice(cIdx);
    }
    // label
    let labelMatch = body.match(LBL);
    let prefix = "";
    if (labelMatch) {
      prefix = `${labelMatch[1]}<span class="syn-lbl">${labelMatch[2]}</span>:`;
      body = body.slice(labelMatch[0].length);
    }
    body = body.
    replace(KW, '<span class="syn-kw">$&</span>').
    replace(REG, '<span class="syn-reg">$&</span>').
    replace(NUM, '<span class="syn-num">$&</span>');
    if (comment) comment = `<span class="syn-cmt">${escapeHtml(comment)}</span>`;
    return prefix + body + comment;
  }).join("\n");
}

function highlightC(code) {
  const KW = /\b(int|char|void|return|if|else|while|for|struct|typedef|const|static|unsigned|long|short|sizeof|include|define)\b/g;
  const FN = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
  const NUM = /\b(\d+)\b/g;
  const STR = /"([^"\\]|\\.)*"/g;
  const CMT = /\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

  return code.
  replace(CMT, (m) => `\u0001${m}\u0002`).
  replace(STR, (m) => `\u0003${m}\u0004`).
  replace(KW, '<span class="syn-kw">$&</span>').
  replace(FN, '<span class="syn-fn">$1</span>').
  replace(NUM, '<span class="syn-num">$&</span>').
  replace(/\u0003([^\u0004]*)\u0004/g, '<span class="syn-str">"$1"</span>').
  replace(/\u0001([^\u0002]*)\u0002/g, '<span class="syn-cmt">$1</span>');
}

function escapeHtml(s) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

// ---- CodeBlock --------------------------------------------
function extractText(node) {
  if (node == null || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props && "children" in node.props) return extractText(node.props.children);
  return "";
}

function CodeBlock({ lang = "asm", filename, children }) {
  const [copied, setCopied] = useState(false);
  const code = extractText(children).replace(/^\n/, "").replace(/\n\s*$/, "");

  const highlighted = useMemo(() => {
    if (lang === "asm") return highlightAsm(code);
    if (lang === "c") return highlightC(code);
    return escapeHtml(code);
  }, [code, lang]);

  function copy() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span className="codeblock-lang">{filename || lang}</span>
        <button className={`codeblock-copy ${copied ? "copied" : ""}`} onClick={copy}>
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>
      <pre><code dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
    </div>);

}

// ---- CompareGrid: 좌우 비교 2-column 컨테이너 ---------------
function Compare({ children }) {
  return <div className="compare">{children}</div>;
}

// ---- Inline code ------------------------------------------
function C({ children }) {
  return <code className="inline">{children}</code>;
}

// ---- Mark Complete button ---------------------------------
function CompleteButton({ chapterId, done, onToggle }) {
  return (
    <button className={`complete-btn ${done ? "done" : ""}`} onClick={onToggle}>
      {done ? "✓ 완료 처리됨 — 다시 표시" : "이 챕터 완료로 표시"}
    </button>);

}

// ---- Chapter navigation -----------------------------------
function ChapterNav({ prev, next, navigate }) {
  return (
    <div className="chapter-nav">
      {prev ?
      <button className="chapter-nav-btn" onClick={() => navigate(prev.id)}>
          <div className="chapter-nav-dir">← 이전</div>
          <div className="chapter-nav-title">{prev.title}</div>
        </button> :
      <div />}
      {next ?
      <button className="chapter-nav-btn next" onClick={() => navigate(next.id)}>
          <div className="chapter-nav-dir">다음 →</div>
          <div className="chapter-nav-title">{next.title}</div>
        </button> :
      <div />}
    </div>);

}

// ---- Chapter Header --------------------------------------
function ChapterHeader({ eyebrow, title, subtitle }) {
  return (
    <header>
      <div className="chapter-eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      {subtitle && <p className="chapter-subtitle">{subtitle}</p>}
    </header>);

}

// ---- Summary block ---------------------------------------
function Summary({ title = "이 챕터 요약", items }) {
  return (
    <div className="summary">
      <div className="summary-title">{title}</div>
      <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>);

}

// ---- Memory diagram --------------------------------------
function MemDiagram({ rows }) {
  return (
    <div className="mem-diagram">
      {rows.map((r, i) =>
      <div className="mem-row" key={i}>
          <div className="mem-row-addr">{r.addr}</div>
          <div className="mem-row-bar">
            <div className="mem-row-bar-fill" style={{ width: r.width, background: r.color }}>{r.tag}</div>
          </div>
          <div className="mem-row-label">{r.label}</div>
        </div>
      )}
    </div>);

}

// ---- Flow diagram ----------------------------------------
function FlowDiagram({ nodes }) {
  return (
    <div className="flow-diagram">
      {nodes.map((n, i) =>
      <React.Fragment key={i}>
          <div className={`flow-node ${n.highlight ? "highlight" : ""}`}>
            <div className="flow-node-label">{n.label}</div>
            <div className="flow-node-val">{n.val}</div>
          </div>
          {i < nodes.length - 1 && <div className="flow-arrow">→</div>}
        </React.Fragment>
      )}
    </div>);

}

Object.assign(window, {
  Callout, KeyTerm, DefBox, KeyPoint, CodeBlock, C, Compare,
  CompleteButton, ChapterNav, ChapterHeader, Summary,
  MemDiagram, FlowDiagram,
  highlightAsm, highlightC, escapeHtml
});