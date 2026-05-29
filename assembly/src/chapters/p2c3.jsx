// Part 2 · 2.3 기본 명령어
function P2C3() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.3"
        title="기본 명령어"
        subtitle="어셈블리 명령어는 수백 개가 있지만, 실제 코드의 대부분은 여기 나오는 명령어들로 이루어집니다. 각 명령어를 C와 1:1로 대응시켜 이해합시다."
      />

      <p data-bridge="cc-intro-bridge-p2c3">
        앞 챕터에서 레지스터라는 ‘작업대’를 배웠습니다. 이제 그 작업대 위에서 실제로 일을 시킬 <strong>‘도구들’</strong>을 만날 차례입니다.
        어셈블리엔 수백 가지 명령어가 있지만, 실제 코드의 90%는 <C>mov</C>, <C>add</C>, <C>sub</C>, <C>cmp</C>, <C>jmp</C> 같은
        한 줌의 명령으로 이루어집니다.
        이 챕터에선 그 핵심 도구들을 C 코드와 1:1로 짝지어 익힙니다 —
        <em>“C의 <C>a = b</C>는 어셈블리에선 정확히 어떻게 쓰이지?”</em>라는 질문에 답하는 챕터입니다.
      </p>

      <h2>어셈블리 명령어 기본 형식</h2>

      <CodeBlock lang="asm" filename="Intel 문법 — 목적지가 먼저">{`명령어  목적지, 소스

mov  rax, rbx       ; rax = rbx  (rbx를 rax로 복사)
add  rax, 5         ; rax = rax + 5
sub  rdi, rsi       ; rdi = rdi - rsi`}</CodeBlock>

      <Callout type="note" title="📌 Intel 문법 vs AT&T 문법">
        <p>
          어셈블리에는 두 가지 문법이 있습니다.
          {" "}<strong>Intel 문법</strong>: <C>mov rax, rbx</C> (목적지 먼저).
          {" "}<strong>AT&T 문법</strong>: <C>movq %rbx, %rax</C> (소스 먼저, <C>%</C> 붙음).
          이 교재는 Intel 문법을 씁니다. Ghidra도 기본이 Intel입니다.
          {" "}
          <KeyTerm term="GDB(GNU Debugger)는 기본이 AT&T 문법입니다. ‘set disassembly-flavor intel’을 GDB에서 실행하면 Intel 문법으로 바꿀 수 있습니다.">
            GDB는 기본이 AT&T이지만 <C>set disassembly-flavor intel</C>로 바꿀 수 있습니다.
          </KeyTerm>
        </p>
      </Callout>

      <h2>MOV — 데이터 이동</h2>

      <p>
        <C>mov</C>는 어셈블리에서 가장 많이 쓰이는 명령어입니다.
        “이동”이라는 이름이지만 실제로는 <strong>복사</strong>입니다. 원본은 그대로 남습니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int  a = 42;
int  b = a;
long c = 0x1234567890;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (Intel)">{`mov  eax, 42
mov  ebx, eax
mov  rcx, 0x1234567890`}</CodeBlock>
      </Compare>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>명령어</th><th>의미</th><th>예시</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">mov dst, src</td><td>src 값을 dst로 복사</td><td className="mono">mov rax, rbx</td></tr>
            <tr><td className="mono">movsx dst, src</td><td>복사 +{" "}
              <KeyTerm term="부호 확장(Sign Extension): 작은 크기의 값을 큰 크기로 늘릴 때 음수(부호)를 보존하는 방식입니다. 예: 8비트 -1(0xFF)을 64비트로 확장하면 -1(0xFFFFFFFFFFFFFFFF)이 됩니다.">
                부호 확장
              </KeyTerm>
              {" "}(음수 보존)</td><td className="mono">movsx rax, eax</td></tr>
            <tr><td className="mono">movzx dst, src</td><td>복사 +{" "}
              <KeyTerm term="0 확장(Zero Extension): 작은 크기의 값을 큰 크기로 늘릴 때 남은 상위 비트를 모두 0으로 채웁니다. 예: 8비트 0xFF를 64비트로 확장하면 0x00000000000000FF가 됩니다.">
                0으로 확장
              </KeyTerm>
            </td><td className="mono">movzx rax, al</td></tr>
            <tr><td className="mono">lea dst, [src]</td><td>
              <KeyTerm term="LEA(Load Effective Address): 메모리에서 값을 읽는 것이 아니라 ‘주소 계산 결과’를 레지스터에 넣습니다. 곱셈/덧셈 최적화에도 자주 사용됩니다.">
                주소 계산 결과를 dst에 저장
              </KeyTerm>
            </td><td className="mono">lea rax, [rbx+8]</td></tr>
            <tr><td className="mono">xchg dst, src</td><td>두 값 교환 (swap)</td><td className="mono">xchg rax, rbx</td></tr>
          </tbody>
        </table>
      </div>

      <h3>LEA — 주소 계산의 만능 도구</h3>

      <p>
        <strong>LEA (Load Effective Address)</strong>는 겉보기엔 주소를 계산하는 명령어이지만,
        {" "}
        <KeyTerm term="컴파일러(Compiler): C/C++ 같은 고수준 언어 코드를 CPU가 직접 실행할 수 있는 기계어로 변환하는 프로그램입니다. gcc, clang, MSVC 등이 대표적입니다.">
          컴파일러
        </KeyTerm>
        가 곱셈/덧셈을 할 때도 씁니다!
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`// 포인터 주소 계산
int *p = arr + i;

// 곱셈 (최적화 시)
int x = a * 3;
// = a + a*2`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`; rbx = arr 주소, rax = i
lea  rcx, [rbx + rax*4]

; rax = a
lea  rax, [rax + rax*2]
; rax = a + a*2 = a*3`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="LEA로 만드는 곱셈 — 인수 분해 외우기">
        <p>
          <C>[base + index*scale + disp]</C>에서 <C>scale</C>은 <strong>1·2·4·8</strong>만 가능합니다.
          이 제약 하나로 컴파일러는 한 줄에 다음 곱셈을 만들어냅니다:
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 13, marginLeft: 12 }}>
          ×2 → <C>lea rax, [rax + rax]</C> 또는 <C>[rax*2]</C><br/>
          ×3 → <C>lea rax, [rax + rax*2]</C><br/>
          ×5 → <C>lea rax, [rax + rax*4]</C><br/>
          ×9 → <C>lea rax, [rax + rax*8]</C>
        </p>
        <p>
          한 사이클짜리 LEA로 <C>imul</C>(보통 3~4 사이클)을 대체할 수 있어
          최적화 빌드의 어셈블리에 자주 등장합니다.
        </p>
      </Callout>

      <h2>산술 명령어</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`a = a + b;
a = a - b;
a = a * b;
a = a / b;   // 몫
c = a % b;   // 나머지
a++;
a--;
a = -a;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`add  rax, rbx
sub  rax, rbx
imul rax, rbx
idiv rbx              ; rdx:rax ÷ rbx
                      ; 몫 → rax, 나머지 → rdx
inc  rax
dec  rax
neg  rax`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ idiv 주의사항">
        <p>
          <C>idiv rbx</C>는 <C>rdx:rax</C>(128비트 값으로 취급)를 <C>rbx</C>로 나눕니다.
          나누기 전에 반드시 <C>rdx</C>를 설정해야 합니다.
          양수를 나눈다면 <C>xor rdx, rdx</C>(부호없음) 또는
          {" "}
          <KeyTerm term="cqo(Convert Quadword to Octword): rax의 값을 rdx:rax 128비트로 부호 확장합니다. rax가 양수면 rdx=0, 음수면 rdx=0xFFFFFFFFFFFFFFFF로 설정합니다. 부호있는 나눗셈 전에 반드시 사용해야 합니다.">
            <C>cqo</C>(부호있음 확장)
          </KeyTerm>
          를 먼저 하세요.
        </p>
      </Callout>

      <CodeBlock lang="asm" filename="안전한 나눗셈 패턴">{`; 부호없는 나눗셈
xor  rdx, rdx       ; rdx = 0
mov  rax, 100
mov  rcx, 7
div  rcx            ; rax = 14 (몫), rdx = 2 (나머지)

; 부호있는 나눗셈
mov  rax, -100
cqo                 ; rax 부호를 rdx로 확장
mov  rcx, 7
idiv rcx            ; rax = -14, rdx = -2`}</CodeBlock>

      <h2>비트 연산 명령어</h2>

      <p>
        비트 연산은
        {" "}
        <KeyTerm term="암호화(Encryption): 데이터를 읽기 어렵게 변환하는 기술입니다. 비트 연산(XOR, AND, 시프트)은 암호화 알고리즘의 기본 구성요소입니다. 예: AES, ChaCha20 같은 암호화 알고리즘이 비트 연산으로 구성됩니다.">
          암호화
        </KeyTerm>
        , 플래그 체크, 최적화에서 자주 나옵니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>명령어</th><th>C 연산자</th><th>설명</th><th>예시 (rax=0b1010, rbx=0b1100)</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">and</td><td className="mono">&amp;</td><td>둘 다 1이면 1</td><td className="mono">and rax, rbx → 0b1000</td></tr>
            <tr><td className="mono">or</td><td className="mono">|</td><td>하나라도 1이면 1</td><td className="mono">or rax, rbx → 0b1110</td></tr>
            <tr><td className="mono">xor</td><td className="mono">^</td><td>서로 다르면 1</td><td className="mono">xor rax, rbx → 0b0110</td></tr>
            <tr><td className="mono">not</td><td className="mono">~</td><td>비트 반전</td><td className="mono">not rax → 0b…10110101</td></tr>
            <tr><td className="mono">shl</td><td className="mono">&lt;&lt;</td><td>
              <KeyTerm term="왼쪽 시프트(Left Shift): 비트를 왼쪽으로 n칸 밀어냅니다. 1칸 이동할 때마다 값이 2배가 됩니다. shl rax, 3은 rax * 8 과 같습니다.">
                왼쪽 시프트 (×2ⁿ)
              </KeyTerm>
            </td><td className="mono">shl rax, 2 → rax*4</td></tr>
            <tr><td className="mono">shr</td><td className="mono">&gt;&gt;</td><td>
              <KeyTerm term="오른쪽 논리 시프트(Logical Right Shift): 비트를 오른쪽으로 n칸 밀고, 빈 상위 비트는 0으로 채웁니다. 부호없는 나눗셈에 해당합니다. shr rax, 1은 rax / 2 와 같습니다(양수 기준).">
                오른쪽 시프트 (÷2ⁿ, 부호없음)
              </KeyTerm>
            </td><td className="mono">shr rax, 1 → rax/2</td></tr>
            <tr><td className="mono">sar</td><td className="mono">&gt;&gt; (부호)</td><td>
              <KeyTerm term="오른쪽 산술 시프트(Arithmetic Right Shift): 비트를 오른쪽으로 n칸 밀되, 빈 상위 비트를 부호 비트(최상위 비트)와 같은 값으로 채웁니다. 음수를 2로 나눠도 음수가 유지됩니다.">
                오른쪽 산술 시프트 (부호 보존)
              </KeyTerm>
            </td><td className="mono">sar rax, 1</td></tr>
          </tbody>
        </table>
      </div>

      <h3>XOR 자기 자신 — 0 초기화 트릭</h3>

      <p>
        <C>xor rax, rax</C>는 rax를 0으로 만드는
        {" "}
        <KeyTerm term="관용구(Idiom): 어셈블리에서 자주 반복적으로 쓰이는 특정 패턴/표현입니다. 영어의 ‘piece of cake(식은 죽 먹기)’처럼 글자 그대로의 의미가 아닌 관례적 의미를 가집니다.">
          관용구
        </KeyTerm>
        입니다. <C>mov rax, 0</C>보다 기계어가 짧고 빠르기 때문에 컴파일러가 자주 씁니다.
        리버싱에서 자주 보이므로 반드시 외우세요.
      </p>

      <CodeBlock lang="asm" filename="0 초기화 — 가장 짧은 형태">{`xor  eax, eax       ; rax = 0  (가장 짧은 0 초기화)
xor  rcx, rcx       ; rcx = 0`}</CodeBlock>

      <Callout type="info" title="왜 xor가 mov 0보다 짧은가">
        <p>
          <C>mov eax, 0</C>은 기계어로 <strong>5바이트</strong>(<C>B8 00 00 00 00</C>)인 반면,
          <C>xor eax, eax</C>는 <strong>2바이트</strong>(<C>31 C0</C>)에 불과합니다.
          최신 CPU는 이 패턴을 “레지스터를 0으로 만드는 의도”로 인식해서
          실제 ALU 계산도 건너뛰는(zeroing idiom) 최적화까지 합니다.
        </p>
      </Callout>

      <h2>비교 명령어 — CMP와 TEST</h2>

      <p>
        비교는 실제로 빼기 / AND를 수행하지만,
        <strong> 결과를 저장하지 않고 플래그만 바꿉니다.</strong>
        다음에 오는 조건 점프 명령어가 이 플래그를 읽습니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`if (a == b) { ... }
if (a != 0) { ... }
if (flags & 0x1) { ... }`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`cmp  rax, rbx       ; a-b 계산, 플래그만 변경
je   .equal         ; ZF=1이면 점프

test rax, rax       ; rax & rax → ZF 설정
jnz  .nonzero

test rax, 0x1       ; 비트 체크
jnz  .bit_set`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="CMP vs TEST — 언제 무엇을 쓰나">
        <p>
          <strong>CMP a, b</strong> — 같은가/큰가/작은가를 볼 때 (사실상 <C>a − b</C>).
          {" "}<C>je</C>, <C>jne</C>, <C>jg</C>, <C>jl</C> 등과 짝.
        </p>
        <p>
          <strong>TEST a, b</strong> — 비트가 켜져 있는가 / 0인가를 볼 때 (사실상 <C>a &amp; b</C>).
          {" "}<C>test rax, rax</C>는 “rax가 0인지” 가장 짧게 확인하는 관용구.
        </p>
        <p>
          둘 다 다음 챕터 2.5(플래그와 점프)에서 분기와 함께 자세히 다룹니다.
        </p>
      </Callout>

      <Summary items={[
        "Intel 문법: 명령어 dst, src — 목적지가 먼저, %나 $ 접두사가 없다.",
        "mov는 복사. movsx는 부호 확장, movzx는 0 확장. lea는 ‘주소 계산’이지만 곱셈 최적화에도 쓰인다.",
        "산술: add/sub/imul/inc/dec/neg. div/idiv는 rdx:rax를 피제수로 — 부호있는 나눗셈은 cqo 먼저.",
        "비트: and/or/xor/not + 시프트(shl/shr/sar). 시프트는 빠른 ×2ⁿ/÷2ⁿ.",
        "xor reg, reg는 가장 짧은 0 초기화 관용구 (2바이트 + zeroing idiom 최적화).",
        "cmp는 빼기로 플래그만 갱신, test는 and로 플래그만 갱신 — 둘 다 결과는 버린다.",
      ]} />
    </article>
  );
}

window.P2C3 = P2C3;
