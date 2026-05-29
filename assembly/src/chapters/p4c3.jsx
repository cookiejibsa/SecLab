// Part 4 · 4.3 C → ASM 패턴 사전
function P4C3() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 4 · Chapter 4.3"
        title="C → ASM 패턴 사전"
        subtitle="리버싱의 핵심 기술은 ‘어셈블리 조각을 보고 원래 C 코드를 머릿속에 그리기’입니다. 4.1의 최적화 변환, 4.2의 SIMD 명령에 이어 — 이번엔 제어 흐름과 자료구조 단위의 패턴을 사전처럼 정리합니다."
      />

      <p>
        디스어셈블리를 처음 마주하면 명령어 한 줄 한 줄을 다 읽으려 하기 쉽지만, 숙련자는 그렇게 읽지 않습니다.
        <strong>‘이 모양은 switch다’, ‘저건 vtable이다’, ‘이건 NULL 체크다’</strong>처럼 단번에 패턴으로 인식하죠.
        이번 챕터의 표와 예제들이 그 ‘눈’을 만드는 재료입니다.
      </p>

      <Callout type="info" title="이 챕터를 보는 방법">
        <p>
          오른쪽 어셈블리만 보고 왼쪽 C 코드를 추측해 보세요. 시그니처 명령어 조합(<C>test reg, reg + jz</C>, <C>jmp [table + rax*8]</C> 같은)을 통째로
          ‘하나의 단어처럼’ 기억해 두면, 실전에서 디컴파일러 없이도 흐름이 보입니다. 디컴파일러는 패턴을 알아본 뒤 검증 도구로 쓰는 게 가장 효율적입니다.
        </p>
      </Callout>

      <h2>① <C>switch</C>-case → 점프 테이블</h2>

      <DefBox term="점프 테이블" en="Jump Table">
        <p>
          여러 <C>case</C>의 코드 주소를 배열로 만들어 두고, 인덱스로 한 번에 해당 case로 점프하는 방식입니다.
          <C>if/else</C> 체인은 case가 늘면 비교 횟수도 같이 늘지만, 점프 테이블은 case 수와 무관하게 <em>O(1)</em>로 분기합니다.
          디스어셈블리에서 <C>jmp [reg*8 + 주소]</C> 같은 ‘인덱스로 점프’ 패턴이 보이면 거의 확실히 <C>switch</C>입니다.
        </p>
      </DefBox>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`switch (x) {
  case 0: foo(); break;
  case 1: bar(); break;
  case 2: baz(); break;
  default: def(); break;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="점프 테이블 방식">{`; rdi = x
cmp  rdi, 2                  ; x > 2 ?
ja   .default                ; 범위 밖이면 default로
jmp  [jmp_table + rdi*8]     ; 테이블로 한 번에 점프

jmp_table:
    dq .case0                ; [0] = case0 주소
    dq .case1                ; [1] = case1 주소
    dq .case2                ; [2] = case2 주소

.case0: call foo
        jmp  .end
.case1: call bar
        jmp  .end
.case2: call baz
        jmp  .end
.default:
        call def
.end:`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 컴파일러는 항상 점프 테이블을 만들까?">
        <p>
          아닙니다. case 값이 <strong>촘촘하고 충분히 많을 때만</strong> 점프 테이블을 씁니다. 값이 띄엄띄엄하거나 두세 개뿐이면 그냥 <C>cmp + je</C> 체인,
          값이 매우 많지만 듬성듬성하면 <em>이진 검색 트리</em>를 만들기도 합니다. 그래서 같은 <C>switch</C>가 케이스 분포에 따라 전혀 다른 어셈블리로 나옵니다.
          <C>ja</C>(부호 없음 비교)로 범위 체크하는 것도 관찰 포인트 — 음수와 큰 값을 한 번에 걸러내는 트릭이죠.
        </p>
      </Callout>

      <h2>② 함수 포인터 → 간접 호출</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`// 함수 포인터
void (*fp)(int) = get_handler();
fp(42);

// 함수 포인터 배열
void (*handlers[3])() = { a, b, c };
handlers[i]();`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 — 간접 호출">{`; 함수 포인터
call get_handler         ; rax = 함수 주소
mov  edi, 42
call rax                 ; 간접 호출

; 함수 포인터 배열
; rbx = handlers, rcx = i
call [rbx + rcx*8]       ; handlers[i]()`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="✅ ‘call reg’ / ‘call [mem]’이 보이면 둘 중 하나">
        <p>
          <C>call rax</C>, <C>call [rbx + 8]</C> 같은{" "}
          <KeyTerm term="간접 호출(Indirect Call): 함수 이름/주소가 아닌 레지스터나 메모리에 저장된 주소로 호출하는 방식. 호출 대상이 정적 분석만으로는 안 보여서, 동적 분석이 필요합니다 — GDB에서 call 직전에 해당 레지스터를 인쇄해 보는 게 정석.">
            간접 호출
          </KeyTerm>
          은 거의 항상 <strong>함수 포인터</strong>이거나{" "}
          <KeyTerm term="vtable(Virtual Function Table): C++ 클래스에서 virtual 함수들의 주소를 모아놓은 포인터 배열. 객체의 첫 8바이트가 이 테이블을 가리키는 vptr이고, 가상 함수 호출은 ‘vptr 로드 → 테이블에서 함수 주소 꺼내기 → 그 주소로 call’의 3단으로 일어납니다.">
            C++ vtable
          </KeyTerm>{" "}
          호출입니다. GDB로 <C>call</C> 직전에 해당 레지스터/메모리를 인쇄해 보면 실제 호출 대상이 무엇인지 바로 잡힙니다.
        </p>
      </Callout>

      <h2>③ C++ 가상 함수 → vtable 패턴</h2>

      <DefBox term="vtable" en="Virtual Function Table, 가상 함수 테이블">
        <p>
          C++에서{" "}
          <KeyTerm term="virtual 함수: 자식 클래스에서 재정의(override)할 수 있는 함수. 실행 시점에 어떤 구현이 불릴지 결정됩니다(동적 디스패치). 부모 포인터로 자식 객체를 다룰 수 있게 해주는 다형성의 핵심.">
            virtual 함수
          </KeyTerm>
          가 하나라도 있는 클래스는 vtable을 가집니다. vtable은 그 클래스의 virtual 함수들의 <strong>주소 배열</strong>이고,
          각 객체의 첫 8바이트(64비트 시스템 기준)에는 자신이 속한 vtable의 주소(<strong>vptr</strong>)가 들어 있습니다.
        </p>
      </DefBox>

      <CodeBlock lang="asm" filename="C++ virtual 호출의 정형 패턴">{`; obj->method() 호출 (rdi = this 포인터)
mov  rax, [rdi]           ; vptr 로드 (객체 첫 8바이트 = vtable 주소)
call [rax]                ; vtable[0] = 첫 번째 virtual 함수

; 또는
call [rax + 0x10]         ; vtable[2] = 세 번째 virtual 함수 (0x10 = 2*8)

; 리버싱 팁: 오프셋만 보면 몇 번째 virtual 함수인지 알 수 있다
; 0x00 = 1번째, 0x08 = 2번째, 0x10 = 3번째 ...`}</CodeBlock>

      <Callout type="info" title="‘this 포인터 → vptr → 함수 주소’의 3단 점프가 시그니처">
        <p>
          C++ 가상 호출의 디스어셈블리는 항상 <em>두 번의 메모리 접근</em>으로 끝납니다 —
          ① 객체에서 vptr 꺼내기, ② vtable에서 함수 주소 꺼내기, ③ 그 주소로 <C>call</C>.
          그래서 <C>mov rax, [rdi]</C> 직후 <C>call [rax + N]</C>이 보이면 ‘C++ virtual 호출 + 오프셋 N/8번째 함수’라고 거의 단정할 수 있습니다.
          Ghidra/IDA에서 vtable에 심볼을 붙이면, 이 오프셋이 그대로 함수 이름으로 복원됩니다.
        </p>
      </Callout>

      <h2>④ NULL 체크 — <C>test reg, reg + jz</C></h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`if (p != NULL) {
    *p = 10;
}
// NULL = 0, 아무것도 가리키지 않는 포인터`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`test rdi, rdi          ; rdi & rdi → ZF=1이면 0(NULL)
jz   .skip             ; NULL이면 건너뜀
mov  QWORD PTR [rdi], 10
.skip:`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 왜 ‘test reg, reg’가 ‘cmp reg, 0’보다 자주 쓰일까">
        <p>
          둘은 결과가 같지만 <C>test reg, reg</C>가 <strong>기계어 1바이트 더 짧고</strong>, 일부 CPU에서 더 빠릅니다 — 컴파일러가 항상 이쪽을 고릅니다.
          이 패턴은 NULL 체크 외에도 <em>“값이 0인지”</em>를 확인하는 모든 자리에 등장하니, <C>test eax, eax; jz</C>가 보이면 머릿속에서 <C>if (x == 0)</C>로 즉시 번역하세요.
          참고로 NULL 포인터 역참조는 거의 항상{" "}
          <KeyTerm term="Segmentation Fault(SIGSEGV): NULL 포인터나 매핑되지 않은 메모리, 또는 권한 없는 메모리에 접근했을 때 OS가 발생시키는 시그널. 프로그램이 즉시 종료되며, 리버싱 대상에서 자주 보이는 충돌 원인입니다.">
            SIGSEGV
          </KeyTerm>
          로 이어집니다.
        </p>
      </Callout>

      <h2>⑤ 구조체 반환 — 두 레지스터에 나눠 담기</h2>

      <p>
        “함수는 값 하나만 리턴할 수 있다”는 통념과 달리, 64비트 System V ABI는 <strong>최대 16바이트(2×64비트)까지 단순 집계 타입을 두 레지스터에 나눠 리턴</strong>합니다.
        그래서 <C>{`struct { long a, b; }`}</C> 같은 페어는 메모리를 거치지 않고 <C>rax</C>·<C>rdx</C>로 돌아오죠.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`typedef struct { long a, b; } Pair;
Pair make_pair(long x) {
    return (Pair){ x, x + 1 };
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rax + rdx 리턴)">{`make_pair:                ; rdi = x
    mov  rax, rdi         ; a = x → rax
    lea  rdx, [rdi + 1]   ; b = x + 1 → rdx
    ret
; 2개의 long이 rax, rdx에 각각 담겨 리턴!`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ 16바이트를 넘으면 ‘숨은 인자’가 등장한다">
        <p>
          반환 구조체가 16바이트보다 크면 ABI는 다른 길을 택합니다 — <em>호출자가 결과를 담을 공간을 스택에 미리 잡고, 그 주소를 함수의 ‘0번째 인자’처럼 <C>rdi</C>에 넣어 호출</em>합니다.
          그래서 함수가 ‘반환값이 없는 것처럼’ <C>void</C>로 보이고, 진짜 인자는 <C>rsi</C>부터 시작하죠. 디스어셈블리에서 함수의 첫 동작이 <C>mov [rdi], ...</C> 식이면 큰 구조체 리턴을 의심하세요.
        </p>
      </Callout>

      <h2>⑥ 가변 길이 배열(VLA) / <C>alloca</C></h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`void foo(int n) {
    // 런타임에 크기가 결정되는 지역 배열
    int arr[n];
    // alloca(n * sizeof(int))도 동일한 효과
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 — rsp를 직접 깎는다">{`foo:                       ; rdi = n
    push rbp
    mov  rbp, rsp
    ; n * sizeof(int) 바이트 동적 확보
    lea  rax, [rdi*4 + 15] ; 정렬 패딩 추가
    and  rax, -16          ; 16바이트 정렬
    sub  rsp, rax          ; rsp를 동적으로 감소
    ; arr = rsp`}</CodeBlock>
      </Compare>

      <Callout type="info" title="‘rsp를 변수만큼 깎는다’가 VLA의 시그니처">
        <p>
          일반 지역 변수는 <C>sub rsp, &lt;상수&gt;</C>로 한 번에 잡히지만, VLA/<C>alloca</C>는 <strong>레지스터 값만큼 <C>rsp</C>를 깎습니다</strong>.
          그래서 <C>sub rsp, rax</C> 같은 ‘런타임 의존 스택 조정’이 보이면 VLA 또는 <C>alloca</C>입니다.
          크기 검사가 없으면 스택을 통째로 넘기는 공격(스택 오버플로우)으로 이어질 수 있어, 4.5 보안 챕터에서 다시 만나게 됩니다.
        </p>
      </Callout>

      <h2>⑦ 짧은 루프 → <C>rep</C> 문자열 명령</h2>

      <p>
        “바이트 N개를 복사/채우는” 단순 루프는 컴파일러가 한 줄짜리 <C>rep</C> 명령으로 바꿔 넣곤 합니다.
        하드웨어가 직접 반복을 처리하므로 작은 크기에 유리합니다 — 큰 메모리는 보통 SIMD 기반 <C>memcpy</C>로 빠집니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`memcpy(dst, src, n);
memset(buf, 0, n);`}</CodeBlock>
        <CodeBlock lang="asm" filename="rep 명령으로 컴파일">{`; memcpy(dst, src, n)
mov  rdi, dst             ; 목적지
mov  rsi, src             ; 원본
mov  rcx, n               ; 바이트 수
rep movsb                 ; n바이트 복사

; memset(buf, 0, n)
mov  rdi, buf
xor  eax, eax             ; 채울 값 = 0
mov  rcx, n
rep stosb                 ; n바이트에 al 채우기`}</CodeBlock>
      </Compare>

      <h2>전체 패턴 인식 표</h2>

      <p>
        지금까지 본 패턴(과 4.1·4.2에서 나온 것들까지) 한눈에. 어셈블리 시그니처만 보고 C 의도를 떠올리는 연습이 되도록,
        ‘오른쪽을 가리고 왼쪽만 보며 맞히기’가 가장 좋은 학습법입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>어셈블리 패턴</th>
              <th>원래 C/C++ 코드</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="mono">xor reg, reg</td><td><C>reg = 0;</C></td></tr>
            <tr><td className="mono">test reg, reg; jz</td><td><C>if (reg == NULL)</C> 또는 <C>if (reg == 0)</C></td></tr>
            <tr><td className="mono">cmp reg, N; ja + jmp [table + reg*8]</td><td><C>switch (reg)</C> — 점프 테이블</td></tr>
            <tr><td className="mono">call reg / call [reg + offset]</td><td>함수 포인터 호출 또는 vtable</td></tr>
            <tr><td className="mono">mov rax, [rdi]; call [rax + N]</td><td>C++ 가상 함수 호출 (N/8 번째 메서드)</td></tr>
            <tr><td className="mono">imul + sar + 큰 상수</td><td><C>x / 상수</C> — 마법의 상수 나눗셈 (4.1)</td></tr>
            <tr><td className="mono">and reg, (2^N - 1)</td><td><C>x % 2^N</C></td></tr>
            <tr><td className="mono">lea rax, [rax*N + rax]</td><td><C>rax * (N + 1)</C> — 강도 감소</td></tr>
            <tr><td className="mono">cmp + mov + cmovX</td><td>삼항 연산자 <C>a ? b : c</C> — 분기 없는 if</td></tr>
            <tr><td className="mono">sub rsp, &lt;상수&gt;; mov [rbp - x]</td><td>지역 변수 영역 확보</td></tr>
            <tr><td className="mono">sub rsp, &lt;reg&gt;</td><td>VLA 또는 <C>alloca</C></td></tr>
            <tr><td className="mono">rep movs / rep stos</td><td><C>memcpy</C> / <C>memset</C> (작은 크기)</td></tr>
            <tr><td className="mono">movdqu/movaps + pcmpeqb + pmovmskb</td><td><C>strcmp</C> / <C>memchr</C> / <C>strlen</C> (SIMD, 4.2)</td></tr>
            <tr><td className="mono">movaps + addps / mulps</td><td>float 배열 연산 (SIMD)</td></tr>
            <tr><td className="mono">jmp &lt;다른 함수&gt; (함수 끝)</td><td>꼬리 재귀 / 테일 콜 (4.1)</td></tr>
            <tr><td className="mono">push rbp; mov rbp, rsp / leave; ret</td><td>함수 프롤로그 / 에필로그</td></tr>
            <tr><td className="mono">syscall</td><td>커널 호출 (3.5)</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="✅ 패턴 사전을 ‘쓰는’ 가장 빠른 방법">
        <p>
          ① 디스어셈블리를 보다가 모르는 모양이 나오면, 먼저 <strong>이 표에 비춰 보고</strong> 1차 추측을 만듭니다.
          ② 그 추측을 <C>godbolt.org</C>에 같은 C로 적어 보고 <em>같은 모양이 나오는지</em> 역검증합니다.
          ③ 안 맞으면 <C>-O0</C> → <C>-O3</C>로 옵션을 바꿔 보면서 어떤 옵션에서 그 모양이 나오는지 좁힙니다.
          이걸 몇 번 반복하면, 디컴파일러가 막힌 자리에서도 손으로 흐름을 복원할 수 있게 됩니다.
        </p>
      </Callout>

      <Summary items={[
        "리버싱의 핵심은 ‘명령어를 다 읽기’가 아니라 ‘패턴을 단어처럼 인식하기’. 시그니처 명령 조합을 통째로 외워두면 흐름이 즉시 잡힌다.",
        "switch — cmp + ja + jmp [table + reg*8]: 케이스가 촘촘하고 충분히 많을 때만. 적으면 if/else 체인, 듬성하면 이진 검색으로 갈리기도.",
        "함수 포인터 / vtable — call reg, call [mem]: 정적 분석만으론 호출 대상이 안 보임. mov rax, [rdi] + call [rax + N]은 C++ 가상 함수 호출의 표준 시그니처.",
        "NULL/0 체크 — test reg, reg + jz: cmp reg, 0보다 1바이트 짧아서 컴파일러가 늘 이쪽을 고른다.",
        "구조체 반환 — 16바이트 이하는 rax + rdx에 나눠 담아 리턴. 그 이상은 호출자가 결과 영역을 미리 잡고 그 주소를 rdi로 넘긴다(‘숨은 인자’).",
        "VLA / alloca — sub rsp, <reg>: 런타임 의존 스택 조정이 시그니처. 일반 지역 변수는 sub rsp, <상수>로 한 번에 잡힌다.",
        "memcpy/memset 작은 크기는 rep movs/rep stos로, 큰 크기는 SIMD 기반 라이브러리로 갈린다.",
        "학습법: 표 한 줄 보고 C로 옮겨 godbolt에서 같은 모양이 나오는지 역검증. -O0 → -O3 옵션 바꿔가며 시그니처가 어디서 등장하는지 좁히기.",
      ]} />
    </article>
  );
}

window.P4C3 = P4C3;
