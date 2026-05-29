// Part 1 · 1.2 수 체계와 진법
function P1C2() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 1 · Chapter 1.2"
        title="수 체계와 진법"
        subtitle="어셈블리 코드에는 숫자가 넘쳐납니다. 그런데 0x7fff, 0b1010 같은 이상한 표기가 나옵니다. 이게 뭔지부터 알아야 합니다."
      />

      <p data-bridge="cc-intro-bridge-p1c2">
        앞 챕터에서 컴퓨터가 <em>“비트와 바이트로 모든 걸 다룬다”</em>고 했습니다.
        그런데 막상 디스어셈블리를 열어보면 <C>0x7FFEC0</C>이나 <C>0xDEADBEEF</C> 같은 16진수가 쏟아져 나옵니다 —
        왜 컴퓨터는 굳이 16진법으로 표시할까요? 왜 10진법이 아닐까요? 그리고 음수는 어떻게 표현할까요?
        이 챕터는 그 질문들에 답합니다. <strong>“진법은 다른 표기 방식일 뿐, 값은 같다”</strong>는 감각을 손에 잡으면,
        앞으로 만날 모든 주소·플래그·비트 연산이 한결 편해집니다.
      </p>

      <h2>우리가 쓰는 10진법 (Decimal)</h2>
      <p>
        우리는 일상에서 <strong>10진법(Decimal)</strong>을 씁니다.
        0~9까지 10개의 숫자를 쓰며, 9 다음에는 자리가 올라가 10이 됩니다.
        예: 42, 255, 1000.
      </p>

      <h2>컴퓨터가 쓰는 2진법 (Binary)</h2>
      <p>
        컴퓨터는 <strong>2진법(Binary)</strong>을 씁니다. 0과 1만 사용합니다.
        1 다음에 바로 자리가 올라가서 <C>10</C>(이진수)이 됩니다.
        2진수 한 자리, 즉 1비트의 값은 자릿수마다 2의 거듭제곱입니다.
        오른쪽이 가장 작은 자리(LSB), 왼쪽이 가장 큰 자리(MSB)입니다.
      </p>

      <div className="byte-bits">
        {[7,6,5,4,3,2,1,0].map(n => (
          <div className="bb-cell" key={n}>
            <div className="bb-pos">bit {n}</div>
            <div className="bb-val">{(1 << n)}</div>
            <div className="bb-exp">2<sup>{n}</sup></div>
          </div>
        ))}
      </div>
      <div className="byte-bits-caption">
        <span>← MSB (최상위)</span>
        <span>LSB (최하위) →</span>
      </div>

      <p>
        예를 들어 <C>1010 0011</C><sub>(2)</sub>은 어느 비트가 켜져 있는지 보고 자릿값을 더하면 됩니다.
      </p>

      <div className="byte-bits example">
        {[
          { n: 7, b: 1 }, { n: 6, b: 0 }, { n: 5, b: 1 }, { n: 4, b: 0 },
          { n: 3, b: 0 }, { n: 2, b: 0 }, { n: 1, b: 1 }, { n: 0, b: 1 },
        ].map(({ n, b }) => (
          <div className={`bb-cell ${b ? "on" : ""}`} key={n}>
            <div className={`bb-bit ${b ? "on" : "off"}`}>{b}</div>
            <div className="bb-exp">{b ? (1 << n) : "·"}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 14, color: "var(--fg-muted)", marginTop: -8 }}>
        켜진 비트의 값을 모두 더하면 <strong>128 + 32 + 2 + 1 = 163</strong>.
        즉 <C>1010 0011</C><sub>(2)</sub> = <strong>163</strong><sub>(10)</sub> = <C>0xA3</C>.
      </p>

      <h2>어셈블리에서 자주 쓰는 16진법 (Hexadecimal, Hex)</h2>
      <p>
        <strong>16진법(Hexadecimal)</strong>은 0~9, A~F까지 16개의 기호를 씁니다.
        A=10, B=11, C=12, D=13, E=14, F=15입니다. 왜 쓰냐고요?
        <strong> 2진수 4비트가 정확히 16진수 1자리에 대응되기 때문입니다.</strong>
        8비트(1바이트)는 16진수 두 자리 <C>FF</C>로 표현됩니다. 훨씬 읽기 편합니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>10진수</th><th>2진수</th><th>16진수</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">0</td><td className="mono">0000</td><td className="mono">0</td></tr>
            <tr><td className="mono">1</td><td className="mono">0001</td><td className="mono">1</td></tr>
            <tr><td className="mono">5</td><td className="mono">0101</td><td className="mono">5</td></tr>
            <tr><td className="mono">10</td><td className="mono">1010</td><td className="mono">A</td></tr>
            <tr><td className="mono">15</td><td className="mono">1111</td><td className="mono">F</td></tr>
            <tr><td className="mono">16</td><td className="mono">0001 0000</td><td className="mono">10</td></tr>
            <tr><td className="mono">255</td><td className="mono">1111 1111</td><td className="mono">FF</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="암산 팁 — 4비트 묶기">
        <p>
          긴 2진수가 나오면 <strong>오른쪽부터 4비트씩 끊어서</strong> 각 묶음을 16진수 한 자리로 바꾸세요.
          예) <C>1100 1010 1111 0001</C><sub>(2)</sub> → <C>C A F 1</C> → <C>0xCAF1</C>.
          반대로 16진수에서 2진수로 갈 때도 한 자리씩 4비트로 펼치면 됩니다.
        </p>
      </Callout>

      <Callout type="note" title="📌 표기법">
        <p>
          C / 어셈블리에서 <C>0x</C>를 앞에 붙이면 16진수입니다.
          <C>0xFF</C> = 255, <C>0x41</C> = 65 = 문자 <C>'A'</C>.
          메모리 주소는 대부분 <C>0x7fffffffe5a0</C> 같은 16진수로 표시됩니다.
        </p>
        <p>
          2진수는 <C>0b</C>를 붙입니다 (<C>0b1010</C> = 10).
          NASM에서는 끝에 <C>h</C>(hex)나 <C>b</C>(binary)를 붙이는 표기도 흔합니다 — <C>0FFh</C>, <C>1010b</C>.
        </p>
      </Callout>

      <h2>음수 표현 — 2의 보수 (Two's Complement)</h2>
      <p>
        컴퓨터는 음수를 어떻게 저장할까요? <strong>2의 보수(Two's Complement)</strong> 방식을 사용합니다.
        규칙은 단순합니다.
      </p>

      <KeyPoint n={1}>비트를 모두 <strong>뒤집고</strong> (0↔1)</KeyPoint>
      <KeyPoint n={2}>거기에 <strong>1을 더합니다.</strong></KeyPoint>

      <CodeBlock lang="text" filename="예시: +5의 2의 보수 = -5">{`+5 = 0000 0101   (8비트 이진수)

  1단계: 비트 반전     →  1111 1010
  2단계: 1 더하기      →  1111 1011

따라서  -5 = 1111 1011 = 0xFB`}</CodeBlock>

      <p>
        왜 이 방식을 쓸까요?
        <KeyTerm term="덧셈 회로(Adder Circuit): CPU 안에서 두 수를 더하는 전자 회로입니다. 이 회로 하나로 덧셈과 뺄셈을 모두 처리하면 CPU 설계가 훨씬 간단해집니다.">
          {" 덧셈 회로 "}
        </KeyTerm>
        하나로 덧셈과 뺄셈을 모두 처리할 수 있기 때문입니다.
        <C>5 + (-3)</C>을 그냥 비트 덧셈으로 하면 정확히 2가 나옵니다. 직접 확인해봅시다.
      </p>

      <CodeBlock lang="text" filename="5 + (-3) = 2  (8비트, 2의 보수)">{`   0000 0101    (+5)
 + 1111 1101    (-3)
 ─────────────
 1 0000 0010    ← 9번째 비트(자리올림)는 버려집니다
 = 0000 0010    = 2  ✓`}</CodeBlock>

      <Callout type="info" title="최상위 비트(MSB)가 곧 부호">
        <p>
          2의 보수에서 가장 왼쪽 비트(MSB)가 <C>0</C>이면 양수, <C>1</C>이면 음수입니다.
          그래서 8비트 signed의 범위는 <strong>−128 ~ +127</strong>,
          unsigned의 범위는 <strong>0 ~ 255</strong>가 됩니다.
        </p>
      </Callout>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>크기</th><th>Unsigned 범위</th><th>Signed 범위 (2의 보수)</th></tr>
          </thead>
          <tbody>
            <tr><td>8 bit</td><td className="mono">0 ~ 255</td><td className="mono">-128 ~ 127</td></tr>
            <tr><td>16 bit</td><td className="mono">0 ~ 65,535</td><td className="mono">-32,768 ~ 32,767</td></tr>
            <tr><td>32 bit</td><td className="mono">0 ~ 4,294,967,295</td><td className="mono">±21억 정도</td></tr>
            <tr><td>64 bit</td><td className="mono">0 ~ 약 1.8 × 10¹⁹</td><td className="mono">±9.2 × 10¹⁸</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="warn" title="⚠️ 부호있는(Signed) vs 부호없는(Unsigned)">
        <p>
          <C>0xFF</C>는
          <KeyTerm term="부호 없음(Unsigned): 음수 없이 0 이상의 정수만 표현합니다. 8비트 기준 0~255까지.">
            {" 부호 없이 "}
          </KeyTerm>
          보면 <strong>255</strong>이고,
          <KeyTerm term="부호 있음(Signed): 음수와 양수 모두 표현합니다. 8비트 기준 -128~127. 최상위 비트가 1이면 음수입니다.">
            {" 부호 있게 "}
          </KeyTerm>
          보면 <strong>-1</strong>입니다! 같은 비트 패턴이지만 해석이 달라집니다.
          어셈블리에서 <C>movsx</C>(부호 확장)와 <C>movzx</C>(0 확장)의 차이가 여기서 생깁니다.
        </p>
      </Callout>

      <CodeBlock lang="asm" filename="movzx vs movsx — 같은 0xFF, 다른 결과">{`mov al, 0xFF        ; al = 0xFF (8비트)

movzx eax, al       ; eax = 0x000000FF = 255   (0으로 채움)
movsx eax, al       ; eax = 0xFFFFFFFF = -1    (부호 비트로 채움)`}</CodeBlock>

      <Summary items={[
        "10진(0~9), 2진(0~1), 16진(0~9, A~F) — 같은 수를 자릿수만 다르게 표현한 것.",
        "2진수 4비트 = 16진수 1자리. 그래서 어셈블리·디버거에서 16진수를 즐겨 쓴다.",
        "표기 약속: 0xFF (hex), 0b1010 (binary), 1010b·0FFh (NASM 스타일).",
        "음수는 2의 보수로 저장 — 비트 반전 후 1 더하기. 덧셈 회로 하나로 뺄셈까지 처리.",
        "같은 비트 패턴이라도 unsigned/signed 해석에 따라 값이 달라진다. movzx와 movsx의 차이의 근원.",
      ]} />
    </article>
  );
}

window.P1C2 = P1C2;
