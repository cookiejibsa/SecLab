// Part 3 · 3.1 함수 호출 규약 (Calling Convention)
function P3C1() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 3 · Chapter 3.1"
        title="함수 호출 규약 (Calling Convention)"
        subtitle="여러 함수가 ‘소통’하려면 약속이 필요합니다 — 인수를 어디에 넣어 넘길까? 리턴값은 어디로 받을까? 어떤 레지스터는 건드리면 안 될까? 이 약속이 호출 규약입니다."
      />

      <p>
        2.6에서 본 <C>call</C>과 <C>ret</C>은 그저 ‘리턴 주소를 스택에 넣고/빼는’ 단순한 명령어였습니다.
        그런데 막상 진짜 함수를 호출하려면 더 많은 질문이 따라옵니다 — <em>인수는 어디로 넘기지?</em>{" "}
        <em>리턴값은 어디서 받지?</em> <em>함수 안에서 내 <C>rax</C>를 망가뜨리면 어떡하지?</em>
        이 질문에 대한 답을 <strong>모든 함수가 동일하게 지키기로 합의</strong>한 것 —
        그것이 바로 호출 규약(Calling Convention)입니다.
      </p>

      <Callout type="info" title="규약이 없으면 어떻게 될까?">
        <p>
          A가 만든 라이브러리와 B가 만든 프로그램이 만났을 때, A는 “인수를 <C>rax</C>에 넣어라”라고 했고
          B는 “인수는 <C>rdi</C>에 넣었어”라고 한다면? — 함수는 쓰레기 값을 받아 폭주합니다.
          호출 규약은 <strong>컴파일러·OS·라이브러리가 서로 만난 적 없어도 호환되도록</strong> 만드는 표준 약속입니다.
        </p>
      </Callout>

      <Callout type="note" title="📌 인수(Argument)와 매개변수(Parameter)의 차이">
        <p>
          이 두 단어는 자주 섞여 쓰이지만 엄밀히 다릅니다.
        </p>
        <p>
          <strong>매개변수(Parameter)</strong>: 함수를 <em>정의</em>할 때 쓰는 변수 이름.
          {" "}<C>{`int add(int a, int b)`}</C>에서 <C>a</C>, <C>b</C>가 매개변수.<br/>
          <strong>인수(Argument)</strong>: 함수를 <em>호출</em>할 때 실제로 전달하는 값.
          {" "}<C>add(3, 4)</C>에서 <C>3</C>, <C>4</C>가 인수.
        </p>
        <p>
          호출 규약은 곧 <strong>“인수를 어디에 어떻게 놓을지”</strong>의 약속이므로,
          이 챕터에선 거의 항상 ‘인수’ 쪽을 다룹니다.
        </p>
      </Callout>

      <h2>System V AMD64 ABI — Linux의 기본 규약</h2>

      <p>
        리눅스(그리고 macOS, FreeBSD)는{" "}
        <KeyTerm term="System V는 1980년대 AT&T가 만든 UNIX 표준의 한 갈래입니다. 그 위에 ‘AMD64 부속서(Supplement)’가 64비트 x86용 ABI를 정의했고, Linux/macOS/BSD 모두 이를 따릅니다.">
          <strong>System V AMD64 ABI</strong>
        </KeyTerm>
        를 따릅니다. 이게 곧 <em>Linux x86-64에서 함수가 호출되는 방식</em>의 표준이고,
        리버싱·익스플로잇·인라인 어셈블리 모두 이 규약을 전제로 합니다.
      </p>

      <DefBox term="ABI" en="Application Binary Interface">
        <p>
          API가 <strong>소스코드 수준</strong>의 약속(“이 함수는 <C>int</C>를 받는다”)이라면,
          ABI는 <strong>컴파일된 바이너리 수준</strong>의 약속입니다 —{" "}
          <em>“그 <C>int</C>는 정확히 <C>edi</C> 레지스터에 들어 있고, 리턴값은 <C>eax</C>로 돌아온다”</em>.
          여기엔 레지스터 사용법, 스택 구조, 데이터 정렬, 구조체 패딩 등이 모두 포함됩니다.
        </p>
      </DefBox>

      <h3>① 인수 전달 — “정수형 6개까지는 레지스터”</h3>

      <p>
        System V ABI는 <strong>처음 6개의 정수/포인터 인수</strong>를 정해진 레지스터에 순서대로 넣고,
        7번째부터는 스택을 씁니다. 이 순서는 외워둘 가치가 있습니다 — 디스어셈블리에서
        <C>rdi → rsi → rdx → ...</C> 패턴을 보면 “아, 함수 호출 준비 중이구나”가 즉시 보이기 때문입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>인수 순서</th>
              <th>레지스터</th>
              <th>32비트 별칭</th>
              <th>예: <C>{`func(a, b, c, d, e, f, g, h)`}</C></th>
            </tr>
          </thead>
          <tbody>
            <tr><td>1번째</td><td className="mono">rdi</td><td className="mono">edi</td><td className="mono">a</td></tr>
            <tr><td>2번째</td><td className="mono">rsi</td><td className="mono">esi</td><td className="mono">b</td></tr>
            <tr><td>3번째</td><td className="mono">rdx</td><td className="mono">edx</td><td className="mono">c</td></tr>
            <tr><td>4번째</td><td className="mono">rcx</td><td className="mono">ecx</td><td className="mono">d</td></tr>
            <tr><td>5번째</td><td className="mono">r8</td><td className="mono">r8d</td><td className="mono">e</td></tr>
            <tr><td>6번째</td><td className="mono">r9</td><td className="mono">r9d</td><td className="mono">f</td></tr>
            <tr><td>7번째 이상</td><td colSpan="2">스택 (오른쪽 → 왼쪽 순서로 push)</td><td className="mono">g, h, ...</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="외우는 법 — “Diane’s silk dress costs $89”">
        <p>
          유명한 영어 암기법입니다. 각 단어의 첫 글자가 레지스터 순서를 알려줍니다 —{" "}
          <strong>D</strong>iane(<C>rdi</C>), <strong>s</strong>ilk(<C>rsi</C>),{" "}
          <strong>d</strong>ress(<C>rdx</C>), <strong>c</strong>osts(<C>rcx</C>),{" "}
          $<strong>8</strong>(<C>r8</C>), <strong>9</strong>(<C>r9</C>).
          한국식으로는 “디씨디씨 8 9 (DI-SI-DX-CX-8-9)” 정도로 외워도 좋습니다.
        </p>
      </Callout>

      <FlowDiagram nodes={[
        { label: "arg1", val: "rdi" },
        { label: "arg2", val: "rsi" },
        { label: "arg3", val: "rdx" },
        { label: "arg4", val: "rcx" },
        { label: "arg5", val: "r8" },
        { label: "arg6", val: "r9" },
        { label: "arg7+", val: "stack", highlight: true },
      ]} />

      <h3>② 리턴값 — <C>rax</C></h3>

      <p>
        함수의 리턴값은 거의 모든 경우에 <strong><C>rax</C></strong>로 돌아옵니다.
        정수든 포인터든 마찬가지입니다. 두 개의 값이나 큰 구조체는 예외 처리가 있습니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>리턴 타입</th><th>저장 위치</th><th>비고</th></tr>
          </thead>
          <tbody>
            <tr><td>정수 ≤ 64bit, 포인터</td><td className="mono">rax</td><td>가장 흔한 경우</td></tr>
            <tr><td>정수 128bit 또는 두 값</td><td className="mono">rax : rdx</td><td>하위 64는 rax, 상위 64는 rdx</td></tr>
            <tr>
              <td>
                <KeyTerm term="부동소수점(Floating Point): 소수점이 있는 실수를 표현하는 방식. float은 32비트, double은 64비트. SSE/SSE2 명령어 집합과 XMM 레지스터로 처리합니다.">
                  부동소수점 (float/double)
                </KeyTerm>
              </td>
              <td className="mono">xmm0</td>
              <td>16바이트 SIMD 레지스터의 하위</td>
            </tr>
            <tr><td>큰 구조체 (&gt; 16바이트)</td><td>호출자가 공간 마련 후 <C>rdi</C>로 주소 전달</td><td>‘숨은 첫 인수’가 생김</td></tr>
            <tr><td>void</td><td>없음</td><td>rax의 값은 보장되지 않음</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="‘큰 구조체 리턴’이 인수 순서를 한 칸씩 미는 이유">
        <p>
          C에서 <C>struct Big foo(int x)</C>처럼 큰 구조체를 리턴하면, 컴파일러는 이를
          {" "}<em>“호출자가 미리 만든 빈 공간에 결과를 ‘써넣어 달라’”</em>로 바꿉니다.
          그래서 <strong>실제 첫 인수 자리(<C>rdi</C>)는 ‘결과를 받을 주소’가 차지</strong>하고,
          원래 첫 인수 <C>x</C>는 한 칸 밀려 <C>rsi</C>로 갑니다.
          리버싱하다 “인수가 한 칸씩 어긋난 것 같다” 싶으면 십중팔구 이 케이스입니다.
        </p>
      </Callout>

      <h3>③ Caller-saved vs Callee-saved — “누가 백업할 책임이 있는가”</h3>

      <p>
        함수 호출은 결국 <em>레지스터를 공유</em>해서 일어납니다.
        그래서 “호출 후에도 살아남아야 할 값”과 “호출하면 사라질 수 있는 값”을 미리 약속해 둬야 합니다.
        이 책임 분담을 두 종류의 레지스터로 나눈 것이 <strong>caller-saved / callee-saved</strong>입니다.
      </p>

      <DefBox term="Caller-saved 레지스터" en="호출자가 저장 / scratch · volatile">
        <p>
          <strong>호출하기 전에 ‘내가’(caller가) 백업할 책임</strong>이 있는 레지스터입니다.
          피호출 함수는 이 레지스터들을 마음대로 망가뜨려도 됩니다 — 그래서 ‘scratch(임시)’라고도 부릅니다.
        </p>
        <p style={{marginTop: 8}}>
          📋 <C>rax, rcx, rdx, rsi, rdi, r8, r9, r10, r11</C> — 그리고 인수 전달용 레지스터들이 여기 포함됩니다.
        </p>
      </DefBox>

      <DefBox term="Callee-saved 레지스터" en="피호출자가 저장 / non-volatile">
        <p>
          <strong>호출된 함수가 ‘사용 전에 백업하고, 리턴 전에 복원’</strong>해야 하는 레지스터입니다.
          호출자는 <em>“함수가 끝나도 이 값들은 그대로일 것”</em>이라고 신뢰할 수 있습니다.
        </p>
        <p style={{marginTop: 8}}>
          📋 <C>rbx, rbp, rsp, r12, r13, r14, r15</C>.
          그래서 어떤 함수든 시작부에서 <C>push rbx</C>, <C>push r12</C> 등을 흔히 보게 됩니다 — 백업 중인 것이죠.
        </p>
      </DefBox>

      <Callout type="tip" title="누가 누구인지 헷갈릴 때 — 한 줄 구분법">
        <p>
          <strong>Caller</strong> = ‘부르는 쪽’ (call하는 쪽). <strong>Callee</strong> = ‘불리는 쪽’ (called된 함수).<br/>
          예: <C>main()</C>이 <C>add()</C>를 호출하면 <C>main</C>이 caller, <C>add</C>가 callee.
        </p>
        <p>
          기억하는 한 줄 — <em>“함수 호출은 <strong>임시값</strong>은 caller가 챙기고,{" "}
          <strong>장기보존값</strong>은 callee가 챙긴다.”</em>
        </p>
      </Callout>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>레지스터</th><th>구분</th><th>역할</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">rax</td><td>caller-saved</td><td>리턴값</td></tr>
            <tr><td className="mono">rdi rsi rdx rcx r8 r9</td><td>caller-saved</td><td>인수 1~6번</td></tr>
            <tr><td className="mono">r10 r11</td><td>caller-saved</td><td>임시 (scratch)</td></tr>
            <tr><td className="mono">rbx</td><td><strong>callee-saved</strong></td><td>장기 임시</td></tr>
            <tr><td className="mono">rbp</td><td><strong>callee-saved</strong></td><td>스택 프레임 베이스 (3.2에서)</td></tr>
            <tr><td className="mono">r12 r13 r14 r15</td><td><strong>callee-saved</strong></td><td>장기 임시</td></tr>
            <tr><td className="mono">rsp</td><td>특수</td><td>스택 포인터 (항상 보존)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>한눈에 보는 호출 — <C>add(3, 4)</C></h2>

      <p>
        규약이 실제 코드에서 어떻게 드러나는지 가장 단순한 예로 봅시다.
        2개짜리 정수 인수, 정수 리턴값 — 교과서적인 케이스입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int add(int a, int b) {
    return a + b;
}

int main(void) {
    int r = add(3, 4);
    return r;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (gcc -O1)">{`add:
    ; a는 edi, b는 esi에 들어옴
    lea  eax, [rdi + rsi]   ; eax = a + b (리턴값)
    ret

main:
    mov  edi, 3             ; 1번째 인수 a = 3
    mov  esi, 4             ; 2번째 인수 b = 4
    call add                ; → 호출
    ; 이제 eax = 7
    ret`}</CodeBlock>
      </Compare>

      <Callout type="info" title="왜 add 명령 대신 lea가 보일까?">
        <p>
          <C>{`lea eax, [rdi + rsi]`}</C>는 “주소 계산”의 도구처럼 보이지만, 실은{" "}
          <strong>덧셈을 한 줄로 처리하면서 플래그도 안 건드리는 트릭</strong>입니다.
          기능은 <C>{`mov eax, edi`}</C> + <C>{`add eax, esi`}</C>와 같지만 한 명령어로 끝나죠.
          이건 2.4에서 본 LEA의 또 다른 얼굴 — 컴파일러가 매우 자주 씁니다.
        </p>
      </Callout>

      <h2>호출 직전·직후 스택의 모습</h2>

      <p>
        2.6에서 본 스택 그림을 호출 규약 관점에서 다시 봅시다.
        인수가 6개를 넘는 경우(<C>{`func(a,b,c,d,e,f,g,h)`}</C>)를 가정하면 —
        <strong>7번째부터는 스택에 ‘오른쪽에서 왼쪽 순서’로 push</strong>됩니다.
        그러면 <C>call</C> 직후, 피호출 함수가 본 스택은 다음과 같습니다.
      </p>

      <MemDiagram rows={[
        { addr: "rsp →",     width: "82%", color: "var(--accent)",            tag: "리턴 주소",   label: "call이 push한 그 주소" },
        { addr: "rsp + 8",   width: "70%", color: "oklch(0.7 0.1 250)",       tag: "arg7 = g",  label: "7번째 인수 (먼저 push됨)" },
        { addr: "rsp + 16",  width: "70%", color: "oklch(0.7 0.1 250)",       tag: "arg8 = h",  label: "8번째 인수" },
        { addr: "rsp + 24",  width: "50%", color: "var(--fg-faint)",          tag: "호출자",      label: "↓ 호출자의 스택 프레임" },
      ]} />

      <Callout type="tip" title="‘오른쪽 → 왼쪽’ push 규칙이 만드는 효과">
        <p>
          C 함수 인자 목록을 거꾸로 push하면, 결과적으로 스택 위에서 인수들은{" "}
          <strong>왼쪽 인수가 더 낮은 주소에 놓이는</strong> 모양이 됩니다 — 즉 메모리상에서 ‘소스코드 순서’대로 나란히.
          또 이 규칙은 <C>printf</C> 같은{" "}
          <KeyTerm term="가변 인자 함수(Variadic Function): 인자의 개수가 정해지지 않은 함수. C의 printf, scanf가 대표적이며, 첫 인수(포맷 문자열)를 보고 나머지 개수와 타입을 추론합니다.">
            가변 인자 함수
          </KeyTerm>
          {" "}구현을 쉽게 만듭니다 — 첫 인수 위치만 알면 나머지는 그 뒤에 차곡차곡이니까요.
        </p>
      </Callout>

      <h2>인수가 많을 때 — 7개 이상의 예</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`long bigfun(long a, long b, long c,
            long d, long e, long f,
            long g, long h);

int main(void) {
    bigfun(1, 2, 3, 4, 5, 6, 7, 8);
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (개념적)">{`main:
    sub  rsp, 16           ; 7·8번 인수 자리 + 정렬
    mov  qword [rsp+8], 8  ; arg8 = h (오른쪽부터)
    mov  qword [rsp],   7  ; arg7 = g
    mov  r9d,  6           ; arg6 = f
    mov  r8d,  5           ; arg5 = e
    mov  ecx,  4           ; arg4 = d
    mov  edx,  3           ; arg3 = c
    mov  esi,  2           ; arg2 = b
    mov  edi,  1           ; arg1 = a
    call bigfun
    add  rsp, 16           ; 스택 정리`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ ‘sub rsp, 16’ — 정렬을 잊지 말 것">
        <p>
          2.6에서 본 <strong>16바이트 정렬 규칙</strong>이 여기서도 발동합니다.
          <C>call</C> 직전의 <C>rsp</C>는 16의 배수여야 하므로, 8바이트짜리 인수 하나만 push하면 정렬이 깨집니다 —
          그래서 8바이트 패딩까지 묶어 16바이트를 한 번에 빼는 거죠 (위 예제는 main이 프롤로그를 이미 거쳐
          <C>rsp</C>가 16의 배수에서 시작한다고 가정).
          이 규칙을 어기면 <C>printf</C>가 SSE 명령에서 죽는 식의 ‘이상한 크래시’가 납니다.
        </p>
      </Callout>

      <h2>레지스터 보존을 보여주는 예</h2>

      <p>
        함수 안에서 <strong>callee-saved 레지스터</strong>(<C>rbx</C>, <C>r12</C>…)를 쓰고 싶으면
        반드시 <em>입장에서 백업, 퇴장 전 복원</em>해야 합니다. 컴파일러가 자동으로 해주는 일이지만,
        디스어셈블리에서 함수 시작·끝의 <C>push</C>/<C>pop</C> 쌍을 보면 정확히 이게 보입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`long work(long n) {
    long sum = 0;          // 오래 살아남을 변수
    for (long i = 0; i < n; i++) {
        sum += helper(i);  // 함수 호출이 끼어든다
    }
    return sum;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 — rbx에 sum 보관">{`work:
    push rbx                ; ① callee-saved 백업
    push r12
    mov  r12, rdi           ; r12 = n  (호출 너머로 살아남아야)
    xor  ebx, ebx           ; rbx = sum = 0
    xor  ebp, ebp           ; (i 자리, 생략 단순화)
.loop:
    cmp  rbp, r12
    jge  .done
    mov  rdi, rbp
    call helper             ; ⚠ rax·rcx·rdx·rsi·rdi·... 망가져도 OK
                            ;    rbx·r12는 helper가 보존해줌
    add  rbx, rax           ; sum += 리턴값
    inc  rbp
    jmp  .loop
.done:
    mov  rax, rbx           ; 리턴값
    pop  r12                ; ② 백업한 것 복원
    pop  rbx
    ret`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="이 패턴을 보면 디스어셈블리가 즉시 풀린다">
        <p>
          함수 시작부의 <C>push rbx / push r12 / ...</C> 시퀀스는 <strong>“이 함수가 몇 개의 장기 변수를 쓰는지”</strong>를
          알려주는 표지입니다. 끝에는 같은 순서를 거꾸로 <C>pop</C>합니다.
          중간에 <C>call</C>이 끼어 있다면 — 그 함수는 “호출 너머로 살아남아야 할 값이 있다”라는 뜻입니다.
        </p>
      </Callout>

      <h2>Windows x64 호출 규약 — 비교용</h2>

      <p>
        리눅스 기준으로 공부 중이라도, Windows 바이너리를 만나거나{" "}
        <KeyTerm term="CTF(Capture The Flag): 해킹 대회 형식. 숨겨진 ‘플래그(flag)’ 문자열을 찾으면 점수를 얻습니다. 리버싱·취약점·암호·포렌식 등 여러 분야 문제가 출제됩니다.">
          CTF
        </KeyTerm>
        에서 Windows 문제가 나오면 알아둘 필요가 있습니다. 핵심은{" "}
        <strong>레지스터 4개만 쓴다 + Shadow Space</strong> 두 가지입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>인수 순서</th><th>Linux (System V)</th><th>Windows x64</th></tr>
          </thead>
          <tbody>
            <tr><td>1번째</td><td className="mono">rdi</td><td className="mono">rcx</td></tr>
            <tr><td>2번째</td><td className="mono">rsi</td><td className="mono">rdx</td></tr>
            <tr><td>3번째</td><td className="mono">rdx</td><td className="mono">r8</td></tr>
            <tr><td>4번째</td><td className="mono">rcx</td><td className="mono">r9</td></tr>
            <tr><td>5~6번째</td><td className="mono">r8, r9</td><td>스택</td></tr>
            <tr><td>7번째 이상</td><td>스택</td><td>스택</td></tr>
            <tr>
              <td>특이사항</td>
              <td>—</td>
              <td>
                <KeyTerm term="Shadow Space(쉐도우 공간, Home Space라고도 함): Windows x64에서 함수 호출 전 스택에 반드시 32바이트(레지스터 4개 분량)를 미리 비워둬야 합니다. 피호출 함수가 레지스터 인수를 ‘저장할 자기 자리’를 호출자가 마련해 주는 것입니다. Linux에는 이 개념이 없습니다.">
                  Shadow Space 32바이트 예약 필수
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td>Callee-saved</td>
              <td className="mono">rbx, rbp, r12-r15</td>
              <td className="mono">rbx, rbp, rdi, rsi, r12-r15, xmm6-15</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="가장 헷갈리는 한 줄">
        <p>
          <strong>리눅스의 <C>rdi</C>가 윈도우에선 <C>rcx</C></strong>. 가장 자주 헷갈리는 차이입니다.
          그래서 같은 함수라도 디스어셈블리 시작이 <C>{`mov edx, edi`}</C>(리눅스)냐 <C>{`mov edx, ecx`}</C>(윈도우)냐로
          어느 ABI인지 한 줄 만에 판별 가능합니다.
        </p>
      </Callout>

      <h2>호출 규약을 ‘어기면’ 무슨 일이?</h2>

      <Callout type="warn" title="① 인수를 엉뚱한 레지스터에 넣으면 — 쓰레기 값">
        <p>
          손으로 어셈블리를 짤 때 “인수는 <C>rax</C>에 넣어야지” 라고 착각하고 <C>{`mov rax, 3; call printf`}</C>를 하면,
          <C>printf</C>는 첫 인수를 <C>rdi</C>에서 읽으니 <strong>무작위 메모리 주소를 포맷 문자열로 해석</strong>하다 SIGSEGV.
          “왜 죽지?” 싶을 때 가장 흔한 실수입니다.
        </p>
      </Callout>

      <Callout type="warn" title="② Callee-saved를 복원 안 하면 — 호출자가 망함">
        <p>
          내 함수가 <C>rbx</C>를 막 쓰고 복원 없이 <C>ret</C>하면, 호출자는 <C>rbx</C>에 자기 데이터가 그대로 있을 거라 믿고 계속 진행합니다.
          결과는 <em>“이상한 시점에 변수 하나가 갑자기 바뀐다”</em> — 디버깅 최악의 시나리오입니다.
          gcc로 짠 C 코드는 자동으로 push/pop을 해주지만, 인라인 어셈블리에선 <C>clobber list</C>를 빠뜨리면 똑같이 발생합니다.
        </p>
      </Callout>

      <Callout type="warn" title="③ 16-byte 정렬 위반 — printf/SSE 함수가 죽는다">
        <p>
          앞에서 본 그 규칙입니다. 직접 어셈블리로 함수를 짤 때 <C>sub rsp, 8</C>을 한 번 빠뜨리면,
          <C>printf</C> 안에서 SSE 명령(<C>movaps</C> 등)이 정렬 안 된 메모리를 만나 SIGSEGV.
          “나는 <C>printf</C>를 호출했을 뿐인데?!” 라고 분노하게 됩니다 — 99% 정렬 위반입니다.
        </p>
      </Callout>

      <Summary items={[
        "호출 규약은 컴파일러·OS·라이브러리가 만난 적 없어도 호환되도록 만든 ‘함수 호출의 표준 약속’.",
        "Linux x86-64는 System V AMD64 ABI. 첫 6개 정수/포인터 인수는 rdi, rsi, rdx, rcx, r8, r9. 7번째부터 스택(오른쪽→왼쪽 push).",
        "리턴값은 rax. 부동소수점은 xmm0. 큰 구조체는 ‘숨은 첫 인수(rdi)’로 결과 주소를 받는다.",
        "Caller-saved(rax, rcx, rdx, rsi, rdi, r8-r11)는 호출자가 백업. Callee-saved(rbx, rbp, r12-r15)는 피호출자가 백업.",
        "함수 시작부의 push rbx/r12/... 시퀀스는 ‘이 함수가 장기 변수를 쓴다’는 신호다.",
        "Windows x64는 다르다 — rcx, rdx, r8, r9 (4개) + Shadow Space 32바이트. 리눅스 rdi ↔ 윈도우 rcx가 가장 헷갈리는 차이.",
        "어기면 일어나는 일: ① 엉뚱한 레지스터에 인수 → 쓰레기 값 ② callee-saved 복원 누락 → 호출자 깨짐 ③ 16-byte 정렬 위반 → printf/SSE 크래시.",
        "다음 챕터(3.2)에서는 이 규약을 따라 함수가 ‘자기 공간(스택 프레임)’을 만들고 부수는 과정을 본다.",
      ]} />
    </article>
  );
}

window.P3C1 = P3C1;
