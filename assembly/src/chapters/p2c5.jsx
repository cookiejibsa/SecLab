// Part 2 · 2.5 플래그 레지스터와 조건 점프
function P2C5() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.5"
        title="플래그 레지스터와 조건 점프"
        subtitle="어셈블리에서 if문과 반복문은 플래그와 조건 점프 명령어로 만들어집니다. 이것이 어셈블리의 ‘제어 흐름’입니다."
      />

      <p data-bridge="cc-intro-bridge-p2c5">
        지금까지의 명령어들은 모두 ‘위에서 아래로’ 차례차례 실행됐습니다.
        그런데 C엔 <C>if</C>도 있고 <C>for</C>도 있죠. 어셈블리에선 그 분기와 반복이 어떻게 만들어질까요?
        답은 단순한 두 박자입니다 — ① 연산하면서 상태(<strong>플래그</strong>)를 남긴다,
        ② 그 플래그를 보고 <strong>점프</strong>한다.
        이 메커니즘이 <C>if</C>, <C>else</C>, <C>while</C>, <C>switch</C>, <C>&&</C>, <C>||</C>를 전부 만들어냅니다.
        어셈블리의 ‘제어 흐름’을 다루는 챕터입니다.
      </p>

      <h2>RFLAGS — 상태 플래그 레지스터</h2>

      <p>
        <strong>RFLAGS</strong>는 연산 결과의 ‘상태’를 기억하는 특별한 레지스터입니다.
        각 비트가 하나의 플래그를 나타내며, <C>cmp</C>나 <C>add</C> 같은 연산이 끝날 때마다
        자동으로 갱신됩니다. 실전에서 마주칠 일은 아래 6개 — 그중에서도 위쪽 4개가 핵심입니다.
      </p>

      <div className="flag-grid">
        <div className="flag-card">
          <span className="flag-tag">je / jne</span>
          <div className="flag-name">ZF</div>
          <div className="flag-full">Zero Flag</div>
          <div className="flag-desc">
            연산 결과가 <strong>0</strong>이면 1. <C>cmp a, b</C>에서{" "}
            <C>a == b</C>이면 두 값의 차가 0이므로 ZF=1.
          </div>
        </div>

        <div className="flag-card">
          <span className="flag-tag">jb / jae</span>
          <div className="flag-name">CF</div>
          <div className="flag-full">Carry Flag</div>
          <div className="flag-desc">
            덧셈에서{" "}
            <KeyTerm term="올림수(Carry): 덧셈 결과가 표현 범위를 넘을 때 윗 자리로 올라가는 1입니다. 예: 8비트 255 + 1 = 256인데, 256은 8비트로 표현 불가 → CF=1, 결과=0.">
              올림수(carry)
            </KeyTerm>
            {" "}발생 시, 또는 뺄셈에서{" "}
            <KeyTerm term="빌림(Borrow): 뺄셈 결과가 음수가 될 때 윗 자리에서 빌려오는 개념입니다. 부호없는 숫자에서 작은 수에서 큰 수를 빼면 CF=1이 됩니다.">
              빌림(borrow)
            </KeyTerm>
            {" "}발생 시 1. <strong>부호없는</strong> 비교에 사용.
          </div>
        </div>

        <div className="flag-card">
          <span className="flag-tag">js / jns</span>
          <div className="flag-name">SF</div>
          <div className="flag-full">Sign Flag</div>
          <div className="flag-desc">
            결과의{" "}
            <KeyTerm term="최상위 비트(MSB, Most Significant Bit): 이진수에서 가장 왼쪽에 있는 비트입니다. 부호있는 정수에서 최상위 비트가 1이면 음수, 0이면 양수입니다. 예: 1000 0000 = -128 (8비트 부호있는 정수).">
              최상위 비트(부호 비트)
            </KeyTerm>
            와 같습니다. 음수면 SF=1.
          </div>
        </div>

        <div className="flag-card">
          <span className="flag-tag">jg / jl 내부</span>
          <div className="flag-name">OF</div>
          <div className="flag-full">Overflow Flag</div>
          <div className="flag-desc">
            부호있는 연산에서{" "}
            <KeyTerm term="오버플로(Overflow): 연산 결과가 해당 데이터 타입이 표현할 수 있는 범위를 초과하는 것입니다. 예: 8비트 부호있는 정수 최대값 127에 1을 더하면 -128이 됩니다 (OF=1).">
              오버플로
            </KeyTerm>
            (표현 범위 초과) 발생 시 1.
          </div>
        </div>

        <div className="flag-card muted">
          <span className="flag-tag">희귀</span>
          <div className="flag-name">PF</div>
          <div className="flag-full">Parity Flag</div>
          <div className="flag-desc">
            결과 하위 8비트에서 1인 비트 수가 <strong>짝수</strong>면 1.{" "}
            <KeyTerm term="패리티(Parity): 데이터 전송 오류 검출에 쓰이던 개념입니다. 현대 프로그래밍에서는 거의 사용되지 않지만, 일부 암호화 연산에서 가끔 등장합니다.">
              현대에는 거의 안 씁니다.
            </KeyTerm>
          </div>
        </div>

        <div className="flag-card muted">
          <span className="flag-tag">문자열</span>
          <div className="flag-name">DF</div>
          <div className="flag-full">Direction Flag</div>
          <div className="flag-desc">
            문자열 명령어 방향. 0=증가, 1=감소.{" "}
            <KeyTerm term="cld(Clear Direction Flag): DF를 0으로 설정합니다. rsi, rdi가 증가 방향으로 이동합니다. std(Set Direction Flag): DF를 1로 설정합니다. rsi, rdi가 감소 방향으로 이동합니다.">
              <C>cld</C>/<C>std</C>로 설정.
            </KeyTerm>
          </div>
        </div>
      </div>

      <Callout type="info" title="플래그는 ‘자동으로’ 세팅된다">
        <p>
          <C>add</C>, <C>sub</C>, <C>and</C>, <C>or</C>, <C>xor</C>, <C>cmp</C>, <C>test</C> 같은
          산술·논리 명령은 결과를 만들면서 <em>덤으로</em> 플래그를 갱신합니다.
          반면 <C>mov</C>는 <strong>플래그를 건드리지 않습니다</strong> — 값을 옮길 뿐 ‘연산’이 아니기 때문입니다.
        </p>
      </Callout>

      <h2>cmp와 test — ‘리허설’ 명령</h2>

      <p>
        <C>cmp a, b</C>는 내부적으로 <C>a − b</C>를 계산하긴 하지만{" "}
        <strong>결과는 버립니다</strong>. 그때 켜진 플래그만 남깁니다 — 그래서 다음 줄의 점프가
        “크다·작다·같다”를 알 수 있습니다. <C>test a, b</C>도 같은 원리로{" "}
        <C>a AND b</C>를 해보고 결과는 버립니다. 두 명령 모두{" "}
        <strong>피연산자를 변경하지 않습니다</strong>.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`if (a == b) { ... }
if (a != 0) { ... }
if (x & 0x01) { ... }   // 홀수?`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 — 두 박자">{`; rax = a, rbx = b
cmp  rax, rbx       ; ① 빼본다 → 플래그만 세팅
je   equal_label    ; ② ZF=1 이면 점프

; a != 0 검사
test rax, rax       ; rax AND rax → ZF 세팅
jne  not_zero

; 홀수 검사 — 마지막 비트만 본다
test al, 1          ; (al & 1) → ZF
jnz  odd_label`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="한 줄 외우기">
        <p>
          <strong><C>cmp a, b</C></strong> — <em>“a를 b와 비교하라”</em>. 내부적으로 <C>a − b</C>.<br/>
          <strong><C>test a, b</C></strong> — <em>“a의 비트를 b로 마스킹해 봐라”</em>. 내부적으로 <C>a AND b</C>.<br/>
          둘 다 <strong>대상 레지스터를 바꾸지 않는다</strong>. 플래그만 건드린다.
        </p>
      </Callout>

      <h2>조건 점프 명령어 전체 목록</h2>

      <p>
        같은 <C>cmp</C> 한 줄이라도 그 다음 어떤 점프를 쓰느냐에 따라 의미가 완전히 달라집니다.
        가장 중요한 분기는 <strong>signed</strong>(부호 있음)와{" "}
        <strong>unsigned</strong>(부호 없음) 비교가 따로 있다는 점입니다 — 같은 비트 패턴이라도
        해석이 다르기 때문입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>명령어</th><th>별칭</th><th>조건</th><th>플래그</th><th>C 조건</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="mono">je</td>  <td className="mono">jz</td>   <td>같음 / 0</td>                  <td className="mono">ZF=1</td>             <td className="mono">a == b</td></tr>
            <tr><td className="mono">jne</td> <td className="mono">jnz</td>  <td>같지 않음 / 0 아님</td>          <td className="mono">ZF=0</td>             <td className="mono">a != b</td></tr>
            <tr><td className="mono">jg</td>  <td className="mono">jnle</td> <td>크다 (부호있음)</td>            <td className="mono">ZF=0, SF=OF</td>      <td className="mono">a &gt; b (signed)</td></tr>
            <tr><td className="mono">jge</td> <td className="mono">jnl</td>  <td>크거나 같음 (부호있음)</td>      <td className="mono">SF=OF</td>            <td className="mono">a &gt;= b (signed)</td></tr>
            <tr><td className="mono">jl</td>  <td className="mono">jnge</td> <td>작다 (부호있음)</td>            <td className="mono">SF≠OF</td>            <td className="mono">a &lt; b (signed)</td></tr>
            <tr><td className="mono">jle</td> <td className="mono">jng</td>  <td>작거나 같음 (부호있음)</td>      <td className="mono">ZF=1 또는 SF≠OF</td>  <td className="mono">a &lt;= b (signed)</td></tr>
            <tr>
              <td className="mono">ja</td>
              <td className="mono">jnbe</td>
              <td>
                <KeyTerm term="Above(위): 부호없는(unsigned) 비교에서 ‘크다’를 의미합니다. jg(부호있음)와 혼동하지 마세요. 예: 0xFF는 부호없음으로 255, 부호있음으로 -1입니다.">
                  Above (부호없음 &gt;)
                </KeyTerm>
              </td>
              <td className="mono">CF=0, ZF=0</td>
              <td className="mono">a &gt; b (unsigned)</td>
            </tr>
            <tr>
              <td className="mono">jb</td>
              <td className="mono">jnae</td>
              <td>
                <KeyTerm term="Below(아래): 부호없는(unsigned) 비교에서 ‘작다’를 의미합니다. jl(부호있음)과 혼동하지 마세요.">
                  Below (부호없음 &lt;)
                </KeyTerm>
              </td>
              <td className="mono">CF=1</td>
              <td className="mono">a &lt; b (unsigned)</td>
            </tr>
            <tr><td className="mono">jae</td> <td className="mono">jnb</td>  <td>Above or Equal</td>           <td className="mono">CF=0</td>             <td className="mono">a &gt;= b (unsigned)</td></tr>
            <tr><td className="mono">jbe</td> <td className="mono">jna</td>  <td>Below or Equal</td>           <td className="mono">CF=1 또는 ZF=1</td>   <td className="mono">a &lt;= b (unsigned)</td></tr>
            <tr><td className="mono">js</td>  <td>—</td>                    <td>음수</td>                     <td className="mono">SF=1</td>             <td className="mono">결과 &lt; 0</td></tr>
            <tr><td className="mono">jns</td> <td>—</td>                    <td>양수 또는 0</td>               <td className="mono">SF=0</td>             <td className="mono">결과 &gt;= 0</td></tr>
            <tr><td className="mono">jmp</td> <td>—</td>                    <td>무조건 점프</td>               <td>—</td>                              <td className="mono">goto</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="warn" title="⚠️ signed인지 unsigned인지가 명령을 바꾼다">
        <p>
          기억하는 법: <strong>g/l</strong>은 <em>greater/less</em> — signed 세계의 단어.{" "}
          <strong>a/b</strong>는 <em>above/below</em> — unsigned 세계의 단어.
          C 변수의 타입(<C>int</C> vs <C>unsigned int</C>)에 따라 컴파일러가 둘을 골라 씁니다.
          예: <C>-1</C>은 signed로는 작지만 unsigned로 보면 <C>0xFFFFFFFF</C> — 가장 큰 수입니다.
        </p>
      </Callout>

      <FlowDiagram nodes={[
        { label: "① 연산", val: "cmp rax, rbx" },
        { label: "② 플래그", val: "ZF·SF·CF·OF" },
        { label: "③ 점프", val: "je / jg / jb …", highlight: true },
      ]} />

      <h2>C의 if-else를 어셈블리로</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`if (x > 0) {
    result = x * 2;
} else {
    result = -x;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rdi=x, rax=result)">{`    cmp  rdi, 0          ; x - 0, 플래그 세팅
    jle  .else           ; x <= 0 이면 else로
    ; --- if body ---
    lea  rax, [rdi*2]    ; result = x * 2
    jmp  .end
.else:
    mov  rax, rdi        ; result = x
    neg  rax             ; result = -x
.end:`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 레이블(Label)이란?">
        <p>
          <strong>레이블(Label)</strong>은 코드의 특정 위치에 붙이는 이름표입니다.
          <C>.else:</C>, <C>.end:</C>처럼 콜론(<C>:</C>)으로 끝납니다. 점프 명령어가 이 이름을
          목적지로 사용하며, 어셈블 시점에 <strong>실제 주소로 변환</strong>됩니다.
          앞에 점(<C>.</C>)을 붙이면 보통 <em>로컬 라벨</em> — 같은 함수 안에서만 보이는 임시 이름표입니다.
        </p>
      </Callout>

      <Callout type="info" title="조건이 ‘뒤집혀서’ 점프된다">
        <p>
          C에서 <C>if (x &gt; 0)</C>일 때, 어셈블리는 “<strong>조건이 아닐 때</strong> else로 뛰는”
          모양으로 짭니다 — 그래서 <C>jg</C>가 아니라 <C>jle</C>가 쓰입니다.
          ‘fall-through(그냥 흘러내려가기)’가 기본 경로이므로,{" "}
          <strong>자주 가는 쪽을 위에 두면 빠릅니다</strong>. 분기 예측기와도 친합니다.
        </p>
      </Callout>

      <h2>C의 for 루프를 어셈블리로</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int sum = 0;
for (int i = 0; i < 10; i++) {
    sum += i;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rax=sum, rcx=i)">{`    xor  eax, eax        ; sum = 0
    xor  ecx, ecx        ; i   = 0
.loop:
    cmp  ecx, 10         ; i < 10 ?
    jge  .end            ; i >= 10 이면 탈출
    add  eax, ecx        ; sum += i
    inc  ecx             ; i++
    jmp  .loop
.end:`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="while / do-while도 같은 골격이다">
        <p>
          <strong>while</strong>은 위 패턴에서 초기화 두 줄(<C>xor</C>)을 빼면 끝납니다.
          <strong>do-while</strong>은 cmp/jmp 순서를 뒤집어{" "}
          <em>“바디 먼저 실행 → 끝에서 조건 검사 → 참이면 위로”</em> 모양입니다 —
          즉 점프 한 번이 빠집니다. 그래서 do-while이 더 빠를 수 있고, 컴파일러도 종종 그렇게 변환합니다.
        </p>
      </Callout>

      <h2>알아둘 만한 관용구 두 개</h2>

      <Callout type="tip" title="① test reg, reg — ‘0인가?’의 정석">
        <p>
          <C>cmp rax, 0</C> 대신 <C>test rax, rax</C>를 쓰는 게 표준입니다.
          기능은 같지만 <strong>명령 크기가 더 짧고 빠릅니다</strong> —
          즉시값 0을 인코딩하지 않아도 되니까요. 디스어셈블리에서 <C>test reg, reg</C>를 보면
          반사적으로 “이건 0 검사구나”라고 읽으면 됩니다.
        </p>
      </Callout>

      <Callout type="tip" title="② xor reg, reg — ‘0으로 만들기’의 정석">
        <p>
          레지스터를 0으로 만들 땐 <C>mov rax, 0</C>이 아니라 <C>xor eax, eax</C>를 씁니다.
          어떤 값이든 자기 자신과 XOR하면 0이 되니까요. 이 한 줄은{" "}
          <strong>더 짧고, 더 빠르고, ZF까지 1로 세팅</strong>해줍니다.
          어셈블리를 처음 읽을 때 가장 당황스러운 관용구지만, 한 번 알면 사방에서 보입니다.
        </p>
      </Callout>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int x = 0;
if (p == NULL) return;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 관용구">{`    xor  eax, eax        ; x = 0
    test rdi, rdi        ; p == NULL ?
    jz   .return`}</CodeBlock>
      </Compare>

      <Summary items={[
        "어셈블리의 모든 분기는 ‘① 플래그를 만든다 → ② 플래그를 보고 점프한다’ 두 박자다.",
        "RFLAGS의 핵심은 ZF(0?), SF(음수?), CF(unsigned 자리올림), OF(signed 오버플로) 4개. PF·DF는 거의 안 쓴다.",
        "cmp는 ‘리허설 sub’, test는 ‘리허설 AND’ — 결과는 버리고 플래그만 남긴다. 피연산자는 안 바뀐다.",
        "조건 점프는 signed(jg·jl·jge·jle)와 unsigned(ja·jb·jae·jbe)가 따로 있다 — 타입이 명령을 바꾼다.",
        "C의 if는 ‘조건을 뒤집어서’ else로 뛰는 모양으로 컴파일된다. fall-through가 빠른 경로다.",
        "관용구: test reg, reg = ‘0인가?’, xor reg, reg = ‘0으로 만들기’. 디스어셈블리에서 무한히 본다.",
      ]} />
    </article>
  );
}

window.P2C5 = P2C5;
