// ============================================================
// 시뮬레이터 — 레지스터/메모리 단계별 실행, 스택 시뮬레이터
// ============================================================

// ---- RegisterSim ------------------------------------------
// program: [{ line: "mov rax, 5", explain: "...", apply: state => state, line_number }]
// initialState: { rax: 0, rbx: 0, ... }
function RegisterSim({ title = "단계별 실행", program, initialState, lines }) {
  const [step, setStep] = React.useState(0);
  const [autoPlay, setAutoPlay] = React.useState(false);
  const totalSteps = program.length;

  // 누적 상태 계산
  const { state, prevState } = React.useMemo(() => {
    let s = { ...initialState };
    let prev = { ...initialState };
    for (let i = 0; i < step; i++) {
      prev = { ...s };
      s = program[i].apply({ ...s });
    }
    return { state: s, prevState: prev };
  }, [step, program, initialState]);

  React.useEffect(() => {
    if (!autoPlay) return;
    if (step >= totalSteps) { setAutoPlay(false); return; }
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [autoPlay, step, totalSteps]);

  const activeIdx = step > 0 ? step - 1 : -1;
  const explanation = step > 0 ? program[step - 1].explain : "▶ 재생을 눌러 한 줄씩 실행해보세요.";

  return (
    <div className="sim-card">
      <div className="sim-header">
        <div className="sim-header-title">⚙ {title}</div>
        <div className="sim-step-indicator">{step} / {totalSteps}</div>
      </div>
      <div className="sim-body">
        <div className="sim-code">
          {lines.map((line, i) => (
            <div key={i} className={`sim-code-line ${i === activeIdx ? "active" : ""}`}>
              <span className="ln">{i + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: window.highlightAsm ? window.highlightAsm(line) : line }} />
            </div>
          ))}
        </div>
        <div className="sim-state">
          <div className="sim-reg-grid">
            {Object.entries(state).map(([name, val]) => {
              const changed = prevState[name] !== val;
              return (
                <div key={name} className={`sim-reg ${changed ? "changed" : ""}`}>
                  <div className="sim-reg-name">{name}</div>
                  <div className="sim-reg-val">{formatReg(val)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="sim-explanation">{explanation}</div>
      <div className="sim-controls">
        <div className="sim-controls-left">
          <button className="sim-btn" onClick={() => { setStep(0); setAutoPlay(false); }}>
            ⟲ 처음으로
          </button>
        </div>
        <div className="sim-controls-right">
          <button className="sim-btn" disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>
            ← 이전
          </button>
          <button
            className="sim-btn primary"
            disabled={step >= totalSteps && !autoPlay}
            onClick={() => {
              if (autoPlay) { setAutoPlay(false); return; }
              if (step >= totalSteps) { setStep(0); setTimeout(() => setAutoPlay(true), 100); return; }
              setAutoPlay(true);
            }}
          >
            {autoPlay ? "■ 정지" : step >= totalSteps ? "↻ 다시" : "▶ 재생"}
          </button>
          <button className="sim-btn" disabled={step >= totalSteps} onClick={() => setStep(s => Math.min(totalSteps, s + 1))}>
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}

// highlightAsm을 전역 노출 (components.jsx에서 정의되었으니 window에 push)
// — components.jsx가 먼저 로드되니 거기서 window.highlightAsm을 노출해도 되지만 안전하게 여기서도 확인
window.highlightAsm = window.highlightAsm || ((c) => c);

function formatReg(v) {
  if (typeof v !== "number") return String(v);
  if (v === 0) return "0x0";
  if (v < 0) return v.toString();
  return "0x" + v.toString(16).toUpperCase();
}

// ---- StackSim ---------------------------------------------
// 스택은 높은 주소에서 낮은 주소로 자라남 (실제 x86)
// 시각화 컨벤션: 위쪽이 base(높은 주소), 아래쪽이 낮은 주소 — push할수록 아래로 자람
function StackSim({ initialBase = 0x7FFEC0 }) {
  const [stack, setStack] = React.useState([]); // [{ val, addr }]
  const SLOT = 8; // 8바이트씩

  function push(val) {
    setStack(prev => {
      const addr = initialBase - (prev.length + 1) * SLOT;
      return [...prev, { val, addr }];
    });
  }
  function pop() {
    setStack(prev => prev.slice(0, -1));
  }
  function reset() {
    setStack([]);
  }

  const topAddr = stack.length > 0 ? stack[stack.length - 1].addr : initialBase;
  const slotsToShow = Math.max(6, stack.length + 1);
  const placeholders = Array.from({ length: slotsToShow - stack.length });

  return (
    <div className="stack-card">
      <div>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>스택 시각화</div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", marginBottom: 12, lineHeight: 1.6 }}>
          x86 스택은 <strong>높은 주소</strong>에서 <strong>낮은 주소</strong> 방향으로 자랍니다.
          <C>push</C>는 <C>rsp</C>를 8만큼 감소시킨 뒤 값을 기록하고,
          <C>pop</C>은 값을 꺼낸 뒤 <C>rsp</C>를 8만큼 증가시킵니다.
        </div>
        <div className="stack-controls-row">
          <button className="sim-btn primary" onClick={() => push(prompt("push할 값을 입력하세요 (예: 42)", "42") || "42")}>
            push
          </button>
          <button className="sim-btn" onClick={pop} disabled={stack.length === 0}>
            pop
          </button>
          <button className="sim-btn" onClick={() => push("0xA")}>push 0xA</button>
          <button className="sim-btn" onClick={() => push("0xB")}>push 0xB</button>
          <button className="sim-btn" onClick={() => push("0xC")}>push 0xC</button>
          <button className="sim-btn" onClick={reset}>⟲ 초기화</button>
        </div>
      </div>
      <div className="stack-side">
        <div className="stack-side-label">스택 (위가 base)</div>
        <div className="stack-vis">
          {/* 위쪽이 base(높은 주소) — push할수록 아래로 자란다 */}
          {stack.map((s) => (
            <div className="stack-slot" key={`s-${s.addr}`}>
              <span className="stack-slot-addr">0x{s.addr.toString(16).toUpperCase()}</span>
              <span className="stack-slot-val">{s.val}</span>
            </div>
          ))}
          {placeholders.map((_, i) => (
            <div className="stack-slot empty" key={`e-${i}`}>—</div>
          ))}
          {stack.length > 0 && (
            <div
              className="stack-top-marker"
              style={{ top: `${6 + (stack.length - 1) * 34 + 7}px` }}
            >
              rsp →
            </div>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-muted)", textAlign: "center" }}>
          rsp = 0x{topAddr.toString(16).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RegisterSim, StackSim, formatReg });
