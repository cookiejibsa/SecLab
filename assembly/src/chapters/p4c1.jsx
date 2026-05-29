// Part 4 · 4.1 최적화 패턴
function P4C1() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 4 · Chapter 4.1"
        title="컴파일러 최적화 패턴"
        subtitle="실제 바이너리를 리버싱하면 사람이 직접 짠 어셈블리와 달리 ‘이상하게 생긴 코드’가 자주 나옵니다. 그것들은 대부분 컴파일러 최적화의 결과 — 패턴을 알면 원래 C 코드를 거의 그대로 복원할 수 있습니다."
      />

      <p>
        Part 2~3에서 본 어셈블리는 사람이 손으로 짠 ‘교과서 코드’였습니다. 하지만 <C>gcc -O2</C>나 <C>clang -O3</C>로
        컴파일된 진짜 바이너리를 열어 보면, 같은 C 코드가 전혀 다른 모양으로 변해 있습니다 —
        나눗셈은 사라지고, <C>if/else</C>는 <C>jmp</C> 없이 표현되고, <C>for</C> 루프는 그냥 명령어 4개가 펼쳐져 있죠.
        이번 챕터에선 그 가장 흔한 다섯 가지 변환을 정리합니다. 4.4 리버싱 챕터에서 디스어셈블리를 읽을 때
        <strong> ‘이 모양은 원래 무엇이었나’</strong>를 즉시 판단하기 위한 패턴 사전입니다.
      </p>

      <Callout type="info" title="왜 컴파일러는 코드를 비틀까?">
        <p>
          이유는 단 하나, <strong>CPU 사이클</strong>입니다. 같은 결과를 더 짧고 빠르게 내는 방법이 있다면 컴파일러는 망설임 없이 바꿉니다.
          나눗셈이 곱셈+시프트로 둔갑하고, 조건 점프가 <C>cmov</C>로 바뀌는 건 전부 <em>“이 명령어가 더 빠르니까”</em>가 동기입니다.
          그 비용표는 보통 <C>Agner Fog</C>의 명령어 지연(latency) 테이블에서 확인할 수 있습니다 — <C>idiv</C>는 약 20~80 사이클,
          <C>imul</C>은 3~5 사이클, <C>and</C>는 1 사이클. 그래서 컴파일러가 그렇게 행동하는 겁니다.
        </p>
      </Callout>

      <h2>① 나눗셈 → 곱셈 + 시프트</h2>

      <p>
        <C>idiv</C>는 x86-64에서 가장 느린 정수 명령 중 하나입니다.
        컴파일러는 <strong>상수로 나누는 경우</strong>(나누는 값이 컴파일 타임에 결정된 경우) 이 무거운 명령어를
        <em>곱셈 한 번 + 시프트 두 번</em>으로 대체합니다. 결과는 정확히 같지만 수 배~수십 배 빠릅니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드 (원본 의도)">{`int x = n / 7;`}</CodeBlock>
        <CodeBlock lang="asm" filename="컴파일러가 생성한 코드">{`; n / 7 최적화
mov   eax, edi          ; n
mov   ecx, 0x92492493   ; '마법의 상수' (Magic Number)
imul  ecx               ; edx:eax = n * 상수
add   edx, edi
sar   edx, 2            ; 오른쪽 시프트
sar   edi, 31           ; 부호 처리
sub   edx, edi
; edx = n / 7`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="리버싱 팁 — ‘마법의 상수’를 보면 나눗셈이다">
        <p>
          이 패턴의 시그니처는 <strong>비현실적으로 큰 상수 + <C>imul</C> + <C>sar</C></strong> 조합입니다.
          상수가 <C>0x92492493</C>처럼 의미 없어 보이면 그건 거의 확실히{" "}
          <KeyTerm term="마법의 상수(Magic Number): 나눗셈을 곱셈으로 바꾸기 위한 특별한 값. 예를 들어 7로 나누기 위해 0x92492493을 곱하고 적절히 시프트합니다. 본질은 2^N / divisor에 가까운 값이며, Hacker's Delight라는 책에서 그 유도 과정을 자세히 다룹니다.">
            마법의 상수(Magic Number)
          </KeyTerm>{" "}
          입니다. 온라인 도구 <C>MagicDivider Calculator</C>나{" "}
          <KeyTerm term="디컴파일러(Decompiler): 기계어/어셈블리를 고수준 언어(C 유사 코드)로 변환해주는 도구. 디스어셈블러(Disassembler)가 기계어 → 어셈블리라면, 디컴파일러는 기계어 → C 코드입니다. Ghidra, IDA Pro의 Hex-Rays가 대표적이며, 이 마법의 상수 패턴을 자동으로 원래 나눗셈으로 복원해줍니다.">
            디컴파일러
          </KeyTerm>
          (Ghidra의 Decompile View, IDA Hex-Rays)가 자동으로 원래 나눗셈으로 복원해줍니다.
        </p>
      </Callout>

      <Callout type="note" title="📌 그 ‘마법의 상수’는 어떻게 나오나?">
        <p>
          개념적으로는 <C>n / d ≈ n × (2^N / d) / 2^N</C>입니다. <C>2^N / d</C>를 미리 계산해 두면(이게 마법의 상수),
          런타임엔 <em>곱셈 한 번 + 오른쪽 시프트 N비트</em>로 끝납니다. 부호 있는 정수에선 <C>n</C>의 부호에 따른
          반올림 방향 차이를 보정하려고 <C>sar edi, 31</C> (부호 추출) + <C>sub</C>이 추가로 붙는 겁니다.
        </p>
      </Callout>

      <h2>② 모듈로(<C>%</C>) 최적화 — 2의 거듭제곱이면 그냥 AND</h2>

      <p>
        나누는 값이 <strong>2의 거듭제곱</strong>이면 나눗셈도 모듈로도 거의 사라집니다.
        <C>n % 2^k</C>는 <em>“하위 k비트만 남기기”</em>와 정확히 같기 때문에, 한 줄짜리 <C>and</C>로 바뀝니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`// 2의 거듭제곱으로 나눈 나머지
int x = n % 8;   // 8 = 2^3
int y = n % 16;  // 16 = 2^4`}</CodeBlock>
        <CodeBlock lang="asm" filename="최적화된 어셈블리">{`; n % 8 = n & 7   (2^3 - 1 = 0b0111)
; 하위 3비트만 남기면 0~7 반복 = 나머지와 같음
and  eax, 7

; n % 16 = n & 15   (0xF)
and  eax, 0xF`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 왜 AND가 나머지와 같나요?">
        <p>
          2의 거듭제곱 <C>N</C>으로 나눈 나머지는 <em>하위 <C>log₂(N)</C>비트</em>와 같습니다.
          예: <C>13 % 8</C> → <C>13 = 0b1101</C>, 하위 3비트 = <C>0b101 = 5</C>. 실제로 <C>13 ÷ 8 = 1 나머지 5</C>.
          <C>and eax, 7</C>이 정확히 그 하위 3비트만 남깁니다(<C>7 = 0b0111</C>).
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ 부호 있는 정수에선 함정이 하나 있다">
        <p>
          C의 <C>%</C>는 <strong>피연산자의 부호를 따라갑니다</strong> — <C>-13 % 8</C>은 C에선 <C>-5</C>지만,
          단순한 <C>and</C>는 항상 양수를 만듭니다(<C>-13 &amp; 7 = 3</C>). 그래서 컴파일러는 부호 있는 변수의 <C>%</C>엔
          <em>이 단순 AND를 적용하지 않습니다</em>. 디스어셈블리에서 한 줄 <C>and</C>로 끝나 있으면
          원본은 <C>unsigned</C>이거나, 컴파일러가 비음수를 추론해낸 상황입니다.
        </p>
      </Callout>

      <h2>③ 테일 콜 최적화 (Tail Call Optimization)</h2>

      <p>
        함수의 <em>마지막 동작</em>이 다른 함수 호출이라면, <C>call + ret</C>의 2단 구조 대신 한 줄짜리 <C>jmp</C>로 대체할 수 있습니다.
        스택 프레임을 새로 쌓지 않으므로 한 칸을 통째로 아끼고,{" "}
        <KeyTerm term="재귀 함수(Recursive Function): 함수가 자기 자신을 호출하는 함수. 예: factorial(n) = n * factorial(n-1). 너무 깊이 재귀하면 스택이 넘칩니다(스택 오버플로우). 테일 콜 최적화가 적용된 ‘꼬리 재귀’는 스택을 추가로 쌓지 않아 이 문제를 피합니다.">
          재귀 함수
        </KeyTerm>
        가 깊어져도 스택이 넘치지 않습니다.
      </p>

      <DefBox term="테일 콜" en="Tail Call">
        <p>
          함수의 <strong>마지막 동작(꼬리, tail)</strong>이 다른 함수를 호출하는 것입니다.
          “호출이 끝난 뒤 할 일이 더 이상 없다”는 게 핵심 — 그래서 현재 스택 프레임이 더 이상 필요 없고,
          컴파일러는 <C>call/ret</C> 대신 <C>jmp</C>로 바꿔 스택을 재활용합니다.
          호출된 함수가 끝나면, 호출자의 호출자(grandparent)에게 직접 <C>ret</C>로 돌아갑니다.
        </p>
      </DefBox>

      <Compare>
        <CodeBlock lang="c" filename="C 코드 (꼬리 재귀)">{`// 꼬리 재귀 — 마지막 동작이 자기 호출
void foo(int x) {
    if (x == 0) return;
    bar(x - 1);   // 마지막 동작
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="TCO 적용 (call → jmp)">{`foo:
    test edi, edi    ; x == 0?
    jz   .done
    dec  edi         ; x - 1
    jmp  bar         ; call + ret 대신 jmp!
                     ; bar가 foo의 호출자에게 직접 ret
.done:
    ret`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="리버싱 팁 — ‘함수 끝에 jmp’가 보이면 테일 콜이다">
        <p>
          함수의 마지막 명령이 <C>ret</C>가 아니라 <strong>다른 함수로의 <C>jmp</C></strong>로 끝나 있으면,
          그건 거의 항상 테일 콜입니다. 디컴파일러는 보통 이걸 <em>“마지막 줄 함수 호출 + return”</em>으로 자동 복원합니다.
          PLT(Procedure Linkage Table) 엔트리도 같은 구조(<C>jmp [GOT]</C>)라 헷갈리기 쉬우니, 점프 대상이 라이브러리 PLT인지 일반 함수인지 한 번 더 확인하세요.
        </p>
      </Callout>

      <h2>④ 조건부 이동 — <C>CMOV</C></h2>

      <p>
        삼항 연산자(<C>a ? b : c</C>)나 짧은 <C>if/else</C>는 분기 점프(<C>jmp</C>)로 컴파일되는 게 ‘자연스러워’ 보이지만,
        실제로는{" "}
        <KeyTerm term="분기 예측(Branch Prediction): 현대 CPU는 성능을 위해 조건 점프 결과를 미리 예측하고 실행합니다. 예측이 맞으면 빠르지만, 틀리면 잘못 실행한 작업을 모두 버리고 다시 시작해야 합니다(수십 사이클 낭비). 이를 분기 예측 실패(Branch Misprediction)라고 합니다. 데이터에 따라 결과가 랜덤하면 예측이 자주 빗나가므로, 분기 자체를 없애는 게 더 빠릅니다.">
          분기 예측 실패(branch misprediction)
        </KeyTerm>
        를 피하려고 <C>jmp</C> 없이 <strong>조건부 복사</strong>로 처리하는 경우가 더 많습니다. 그 주역이 <C>cmov</C> 계열 명령어입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`// 삼항 연산자 → CMOV로 최적화
int max     = (a > b) ? a : b;
int abs_val = (x < 0) ? -x : x;`}</CodeBlock>
        <CodeBlock lang="asm" filename="CMOV 최적화 (분기 없음)">{`; rdi = a, rsi = b  → rax = max
cmp    rdi, rsi    ; a - b, 플래그 설정
mov    rax, rsi    ; rax = b (기본값)
cmovg  rax, rdi    ; a > b이면 rax = a

; rdi = x  → rax = abs(x)
mov    rax, rdi    ; rax = x
neg    rax         ; rax = -x
cmovns rax, rdi    ; x >= 0이면 rax = x (원래값 복구)`}</CodeBlock>
      </Compare>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>명령어</th><th>조건 (플래그)</th><th>의미</th><th>C 연산자 유사</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">cmove / cmovz</td><td>ZF=1</td><td>같음</td><td className="mono">== 0</td></tr>
            <tr><td className="mono">cmovne / cmovnz</td><td>ZF=0</td><td>다름</td><td className="mono">!= 0</td></tr>
            <tr><td className="mono">cmovg</td><td>부호 있음 &gt;</td><td>크다</td><td className="mono">a &gt; b</td></tr>
            <tr><td className="mono">cmovl</td><td>부호 있음 &lt;</td><td>작다</td><td className="mono">a &lt; b</td></tr>
            <tr><td className="mono">cmova</td><td>부호 없음 &gt;</td><td>크다 (unsigned)</td><td className="mono">(unsigned) a &gt; b</td></tr>
            <tr><td className="mono">cmovb</td><td>부호 없음 &lt;</td><td>작다 (unsigned)</td><td className="mono">(unsigned) a &lt; b</td></tr>
            <tr><td className="mono">cmovs</td><td>SF=1</td><td>음수</td><td className="mono">x &lt; 0</td></tr>
            <tr><td className="mono">cmovns</td><td>SF=0</td><td>0 또는 양수</td><td className="mono">x &gt;= 0</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="‘분기 없는(branchless) 코드’가 항상 빠른 건 아니다">
        <p>
          <C>cmov</C>는 <strong>양쪽 갈래를 모두 계산</strong>한 뒤 하나를 골라 복사합니다. 따라서 한 쪽 계산이 비싸거나,
          예측이 거의 항상 맞는 분기라면 오히려 일반 <C>jmp</C>가 더 빠릅니다.
          컴파일러는 <C>-fprofile-use</C>로 실측 데이터를 받았을 때 이런 트레이드오프를 가장 잘 결정합니다.
          또 <C>cmov</C>는 <em>비밀 정보로 분기하지 않는다</em>는 점에서 사이드채널 공격 방어용으로도 쓰입니다 — 암호 라이브러리가 <C>memcmp</C>를 직접 안 쓰는 이유가 여기 있습니다.
        </p>
      </Callout>

      <h2>⑤ 루프 언롤링 (Loop Unrolling)</h2>

      <DefBox term="루프 언롤링" en="Loop Unrolling">
        <p>
          반복문을 여러 번 ‘펼쳐서’ 반복 횟수 자체를 줄이는 최적화입니다.{" "}
          <KeyTerm term="루프 오버헤드(Loop Overhead): 반복문에서 카운터를 증가시키고, 종료 조건을 체크하고, 다시 위로 점프하는 데 드는 추가 비용. 본문이 짧을수록 이 오버헤드의 비율이 커집니다. 언롤링으로 이 비용을 한꺼번에 줄입니다.">
            루프 오버헤드
          </KeyTerm>
          (카운터 증가, 조건 체크, 점프)가 줄어들고, 펼쳐진 명령어들이 CPU의{" "}
          <KeyTerm term="명령어 수준 병렬성(Instruction-Level Parallelism, ILP): 현대 CPU가 한 사이클에 여러 명령어를 동시에 실행하는 능력. 명령어 사이에 의존성이 없을수록 더 많이 병렬화됩니다. 같은 루프 본문을 4번 펼치면 4개의 독립적인 명령어가 동시에 흘러갈 수 있어 처리량이 늘어납니다.">
            명령어 수준 병렬성(ILP)
          </KeyTerm>
          을 활용할 여지가 커집니다.
        </p>
      </DefBox>

      <Compare>
        <CodeBlock lang="c" filename="C 코드 (원본)">{`for (int i = 0; i < 4; i++)
    arr[i] *= 2;`}</CodeBlock>
        <CodeBlock lang="asm" filename="언롤링 후 (루프 없음)">{`; rbx = arr, 4번 반복을 완전히 펼침
shl  DWORD PTR [rbx],      1   ; arr[0] *= 2
shl  DWORD PTR [rbx + 4],  1   ; arr[1] *= 2
shl  DWORD PTR [rbx + 8],  1   ; arr[2] *= 2
shl  DWORD PTR [rbx + 12], 1   ; arr[3] *= 2
; cmp/jmp 4번 → 0번!`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 곱셈 *2가 ‘shl ..., 1’이 된 이유">
        <p>
          이 예시엔 두 가지 최적화가 동시에 들어 있습니다 — <strong>언롤링</strong>과{" "}
          <KeyTerm term="강도 감소(Strength Reduction): 비싼 연산을 같은 결과를 내는 더 싼 연산으로 바꾸는 최적화. *2 → shl 1, *4 → shl 2, x % 8 → x & 7, x / 4 → x >> 2 등이 모두 강도 감소의 예입니다.">
            강도 감소(Strength Reduction)
          </KeyTerm>
          . <C>x * 2</C>는 비트를 한 칸 왼쪽으로 미는 것과 같으므로 <C>imul</C> 대신 <C>shl ..., 1</C>이 쓰였습니다.
          나중에 보게 될 <C>x * 5</C> → <C>lea eax, [rax + rax*4]</C> 같은 변환도 같은 가족의 기법입니다.
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ 언롤링은 항상 좋은 게 아니다">
        <p>
          코드 크기가 커지면 <strong>L1 명령어 캐시 압박</strong>이 늘어, 캐시 미스가 잦아지는 함수에선 오히려 느려집니다.
          그래서 컴파일러는 보통 반복 횟수가 컴파일 타임에 알려져 있고, 본문이 충분히 작을 때만 완전 언롤링을 합니다.
          반복 횟수가 큰 일반 루프에선 <em>‘부분 언롤링’</em>(예: 한 번에 4개씩 처리하고 나머지는 잔여 루프) 형태가 더 흔합니다.
        </p>
      </Callout>

      <h2>그 외 알아두면 좋은 패턴들</h2>

      <p>
        위의 다섯 가지가 가장 자주 만나는 패턴이지만, 디스어셈블리에서 빈번히 보이는 ‘작은 트릭’도 몇 개만 더 정리하면 다음 챕터들이 한결 수월해집니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>패턴</th><th>실제 어셈블리</th><th>원본 의도</th></tr>
          </thead>
          <tbody>
            <tr><td>레지스터 0 만들기</td><td className="mono">xor eax, eax</td><td><C>eax = 0</C> — <C>mov eax, 0</C>보다 짧고 빠름</td></tr>
            <tr><td><C>* 5</C> 같은 작은 상수 곱셈</td><td className="mono">lea eax, [rax + rax*4]</td><td><C>x * 5</C> — <C>imul</C> 안 쓰고 주소 계산기로 곱셈</td></tr>
            <tr><td><C>x * 3</C></td><td className="mono">lea eax, [rax + rax*2]</td><td><C>x * 3</C> — 같은 원리, 1× + 2×</td></tr>
            <tr><td>부호 있는 <C>/ 2^k</C></td><td className="mono">sar eax, k</td><td><C>x &gt;&gt; k</C> — 부호 비트 유지 산술 시프트</td></tr>
            <tr><td>부호 없는 <C>/ 2^k</C></td><td className="mono">shr eax, k</td><td><C>(unsigned)x &gt;&gt; k</C> — 0으로 채우는 논리 시프트</td></tr>
            <tr><td>인라이닝 (Inlining)</td><td className="mono">함수 호출 자리가 통째로 사라짐</td><td>짧은 함수 본문을 호출 지점에 직접 펼침</td></tr>
            <tr><td>상수 접기 (Constant Folding)</td><td className="mono">mov eax, 42</td><td>원래 <C>2 + 5 * 8</C>이었을 식이 컴파일 타임에 미리 계산</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="✅ 학습 도구 — godbolt.org를 켜두자">
        <p>
          이런 패턴들은 직접 눈으로 확인하는 게 가장 빨리 익숙해집니다. <C>godbolt.org</C>(Compiler Explorer)에
          C 코드를 붙여 넣고 <C>-O0</C>부터 <C>-O3</C>까지 옵션을 바꿔 보면, 같은 코드가 어떻게 단계적으로 비틀리는지가 바로 보입니다.
          “이 C가 저 어셈블리로 변하더라”의 매핑을 머릿속에 쌓아두면, 4.4 리버싱에서 디컴파일러 없이도 흐름을 따라갈 수 있게 됩니다.
        </p>
      </Callout>

      <Summary items={[
        "최적화는 ‘같은 결과를 더 적은 사이클로’ 내기 위한 변환 — 그래서 idiv는 imul+sar로, jmp는 cmov로, for 루프는 펼쳐진 명령어들로 바뀐다.",
        "나눗셈 → 곱셈+시프트: 정체불명의 큰 상수 + imul + sar 조합을 보면 ‘상수로 나누는 코드’의 시그니처.",
        "모듈로 % 2^k → and: 하위 k비트만 남기는 것이 곧 나머지. 단, 부호 있는 정수엔 단순 AND가 그대로 쓰이지 않는다.",
        "테일 콜 최적화: 함수 끝이 ret이 아니라 다른 함수로의 jmp면 거의 항상 TCO — 스택 프레임을 아끼고 깊은 재귀를 가능하게 한다.",
        "CMOV: 짧은 if/else와 삼항 연산자를 분기 없이 처리. 분기 예측 실패 + 사이드채널 모두에 강하지만, 양쪽 갈래를 모두 계산한다는 비용이 있다.",
        "루프 언롤링: 본문이 짧고 반복 횟수가 작을 때 컴파일러가 펼쳐버린다. 강도 감소(*2 → shl 1)와 자주 함께 등장.",
        "곁다리 패턴: xor reg, reg(=0), lea를 동원한 작은 곱셈, sar/shr로 갈리는 부호 유무, 인라이닝, 상수 접기.",
        "익숙해지는 가장 빠른 길은 godbolt.org에서 -O0 → -O3 비교 — 그 다음이 4.4 리버싱 챕터의 실전 디스어셈블리 읽기.",
      ]} />
    </article>
  );
}

window.P4C1 = P4C1;
