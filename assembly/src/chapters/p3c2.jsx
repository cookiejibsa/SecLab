// Part 3 · 3.2 스택 프레임 (Stack Frame)
function P3C2() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 3 · Chapter 3.2"
        title="스택 프레임 (Stack Frame)"
        subtitle="함수가 실행되는 동안 스택 위에 차지하는 자기만의 영역 — 그것이 스택 프레임입니다. 지역 변수, 백업한 레지스터, 리턴 주소가 모두 이 한 칸 안에 모여 삽니다."
      />

      <p>
        2.6에서 “스택 프레임이란 한 함수가 점유하는 스택 영역”이라고 슬쩍 보여줬고,
        3.1에서 호출 규약을 따라 인수가 어떻게 전달되는지 봤습니다. 이번 챕터는 그 두 그림을 합쳐 — 
        <em>“함수가 호출된 직후 스택은 정확히 어떻게 생겼는가?”</em>와 <em>“함수가 어떻게 그 공간을 만들고 부수는가?”</em>에 답합니다.
        리버싱에서 가장 자주 보게 될 패턴이고, 4.5의 익스플로잇 기초도 여기 토대를 둡니다.
      </p>

      <h2>스택 프레임이란?</h2>

      <DefBox term="스택 프레임" en="Stack Frame · Activation Record">
        <p>
          한 함수 호출이 살아있는 동안 스택 위에 잡아두는 <strong>고정된 한 칸의 영역</strong>입니다.
          그 안에는 보통 세 종류의 데이터가 들어 있습니다 —
          ① <strong>리턴 주소</strong> (call이 push해 둠), ② <strong>저장된 레지스터들</strong> (callee-saved 백업), 
          ③ <strong>지역 변수</strong>.
        </p>
        <p>
          함수가 시작될 때 만들어지고, <C>ret</C> 직전에 통째로 회수됩니다. 그래서 지역 변수의 수명은
          정확히 “함수가 살아있는 동안”입니다 — C에서 지역 변수의 주소를 리턴하면 안 되는 이유가 여기에 있습니다.
        </p>
      </DefBox>

      <Callout type="info" title="‘프레임’이라는 이름의 감각">
        <p>
          함수가 호출되면 새 프레임이 <strong>위에 쌓이고</strong>(스택은 아래로 자라니까 주소상으론 더 낮은 곳),
          함수가 끝나면 그 프레임이 <strong>사라지면서</strong> 호출자의 프레임이 다시 ‘맨 위’가 됩니다.
          여러 함수가 호출되고 있는 상황은 결국 <em>스택 위에 프레임들이 차곡차곡 쌓인 모습</em> —
          디버거의 ‘call stack’ 창이 그걸 그대로 보여줍니다.
        </p>
      </Callout>

      <h2>스택 프레임의 한 장 그림</h2>

      <p>
        아래는 어떤 함수가 호출된 직후, 프롤로그까지 끝낸 시점의 스택입니다. 위쪽이 낮은 주소(스택 top),
        아래쪽이 높은 주소(스택 base) — 2.6에서 본 그 약속입니다. <C>rbp</C>가 어디에 박혀 있는지,
        <C>rbp + N</C>은 무엇이고 <C>rbp − N</C>은 무엇인지가 핵심입니다.
      </p>

      <MemDiagram rows={[
        { addr: "rsp →",     width: "70%", color: "var(--accent)",                tag: "지역변수 3",   label: "스택 TOP — 가장 최근 확보" },
        { addr: "rbp - 16",  width: "70%", color: "oklch(0.65 0.12 250)",         tag: "지역변수 2",   label: "long b" },
        { addr: "rbp - 8",   width: "70%", color: "oklch(0.65 0.12 250)",         tag: "지역변수 1",   label: "long a" },
        { addr: "rbp →",     width: "55%", color: "oklch(0.6 0.13 320)",          tag: "saved rbp",  label: "이전 함수의 rbp (프레임 기준)" },
        { addr: "rbp + 8",   width: "85%", color: "oklch(0.6 0.13 30)",           tag: "리턴 주소",     label: "★ call이 push해 둔 rip" },
        { addr: "rbp + 16",  width: "60%", color: "oklch(0.7 0.08 60)",           tag: "arg7+",      label: "7번째 이상 인수 (있을 때)" },
        { addr: "↓",          width: "45%", color: "var(--fg-faint)",             tag: "호출자",       label: "이전 함수의 스택 프레임" },
      ]} />

      <Callout type="tip" title="이 그림은 평생 외워둘 가치가 있다">
        <p>
          리버싱에서 어떤 주소가 <C>rbp + 양수</C>면 <strong>인수 또는 리턴 주소</strong>,
          <C>rbp − 양수</C>면 <strong>지역 변수</strong> — 거의 예외 없이 이 한 줄로 풀립니다.
          <C>rbp + 8</C>은 항상 리턴 주소, <C>rbp + 0</C>은 저장된 rbp — 이 두 자리는 절대 변하지 않습니다.
        </p>
      </Callout>

      <h2>프롤로그와 에필로그 — 프레임을 짓고 허무는 의식</h2>

      <p>
        모든 함수는 시작과 끝에 정해진 패턴을 따라 자기 프레임을 만들고 부숩니다.
        이 두 의식을 각각 <strong>프롤로그(Prologue)</strong>와 <strong>에필로그(Epilogue)</strong>라고 합니다.
        리버싱에서 ‘함수의 시작과 끝’을 찾을 때 가장 먼저 보는 표지가 바로 이 패턴입니다.
      </p>

      <DefBox term="프롤로그 (Prologue)">
        <p>
          함수가 시작될 때 <strong>자기 프레임을 짓는</strong> 코드입니다.
          ‘프롤로그’는 본래 연극·소설의 ‘머리말’을 뜻하는 말이죠. 정형 패턴은 단 세 줄입니다.
        </p>
        <CodeBlock lang="asm" filename="표준 프롤로그">{`push rbp           ; ① 호출자의 rbp를 백업 (callee-saved)
mov  rbp, rsp      ; ② rbp = 현재 rsp — 새 프레임의 ‘기준’ 박기
sub  rsp, 16       ; ③ 지역변수 공간 N바이트 확보`}</CodeBlock>
      </DefBox>

      <DefBox term="에필로그 (Epilogue)">
        <p>
          함수가 끝날 때 <strong>자기 프레임을 허무는</strong> 코드입니다. 프롤로그를 역순으로 풀어내면 끝.
        </p>
        <CodeBlock lang="asm" filename="표준 에필로그">{`mov  rsp, rbp      ; ① 지역변수 공간 통째로 회수
pop  rbp           ; ② 호출자의 rbp 복원
ret                ; ③ 리턴 주소(rbp+8 위치였던 그 값)로 점프

; ※ 위 ①②를 한 줄로 처리하는 단축 명령이 leave`}</CodeBlock>
      </DefBox>

      <Compare>
        <CodeBlock lang="c" filename="C 함수">{`long example(long x) {
    long a = x * 2;
    long b = a + 1;
    return b;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rdi = x)">{`example:
    ; ── 프롤로그 ──
    push rbp                ; saved rbp
    mov  rbp, rsp           ; 프레임 기준 박기
    sub  rsp, 16            ; 지역변수 a, b 자리

    ; ── 본문 ──
    lea  rax, [rdi*2]       ; rax = x * 2
    mov  [rbp - 8], rax     ; a = rax
    add  rax, 1             ; rax = a + 1
    mov  [rbp - 16], rax    ; b = rax
    mov  rax, [rbp - 16]    ; 리턴값 = b

    ; ── 에필로그 ──
    leave                   ; = mov rsp, rbp; pop rbp
    ret`}</CodeBlock>
      </Compare>

      <FlowDiagram nodes={[
        { label: "call", val: "리턴 주소 push" },
        { label: "프롤로그", val: "push rbp / mov rbp,rsp / sub rsp,N" },
        { label: "본문", val: "rbp±N로 접근" },
        { label: "에필로그", val: "leave; ret", highlight: true },
      ]} />

      <Callout type="note" title="📌 leave 명령어 — 한 줄짜리 정리꾼">
        <p>
          <C>leave</C> = <C>{`mov rsp, rbp`}</C> + <C>pop rbp</C>. 두 줄을 한 명령으로 합친 거라 더 짧고 빠릅니다.
          짝이 되는 <C>enter</C>(프롤로그를 한 줄로) 명령어도 있긴 한데, 마이크로코드가 무거워서{" "}
          <strong>현대 컴파일러는 거의 안 씁니다</strong>. 디스어셈블리에서 <C>leave</C>는 자주 보지만 <C>enter</C>는 거의 안 보이는 이유.
        </p>
      </Callout>

      <h2>왜 굳이 rbp를 따로 두는가? — 두 가지 이유</h2>

      <p>
        “지역변수를 <C>rsp</C> 기준으로 접근하면 되지 굳이 <C>rbp</C>가 왜 필요할까?” 좋은 질문입니다.
        결론부터 말하면 답은 두 가지 — <strong>안정성</strong>과 <strong>디버깅 용이성</strong>입니다.
      </p>

      <KeyPoint n={1}>
        <strong>안정성</strong> — 함수 본문 안에서 <C>push</C>/<C>pop</C>이 일어나면 <C>rsp</C>는 매번 움직입니다.
        그러면 <C>{`[rsp + 8]`}</C>이 가리키는 것이 시점마다 달라져 헷갈리죠. <C>rbp</C>는 프롤로그 이후 절대 안 움직이므로
        <C>{`[rbp - 8]`}</C>은 함수 안 어디서든 <em>항상 같은 지역 변수</em>를 가리킵니다.
      </KeyPoint>

      <KeyPoint n={2}>
        <strong>스택 추적 (Backtrace)</strong> — 디버거가 “지금 어디서 호출됐어?”를 알아낼 때, <C>rbp</C>로 연결된
        프레임 체인을 거꾸로 따라갑니다. 각 프레임의 <C>{`[rbp]`}</C>는 이전 프레임의 <C>rbp</C>를 가리키므로,
        링크드 리스트처럼 거슬러 올라가면 전체 호출 스택이 풀립니다. <C>rbp</C>를 안 쓰면 디버거는 <em>“다른 단서”</em>로 추적해야 합니다.
      </KeyPoint>

      <FlowDiagram nodes={[
        { label: "현재 프레임", val: "rbp" },
        { label: "[rbp]", val: "→ caller rbp" },
        { label: "[caller rbp]", val: "→ caller’s caller", highlight: true },
        { label: "...", val: "main까지" },
      ]} />

      <Callout type="info" title="‘프레임 체인’이 GDB의 bt 명령의 정체">
        <p>
          GDB에서 <C>bt</C>(backtrace)를 치면 죽 나열되는 함수 호출 목록 — 그 출력의 원료가 바로 위 프레임 체인입니다.
          각 프레임마다 <C>{`[rbp + 8]`}</C>의 리턴 주소를 읽어 어느 함수에서 호출했는지 알아내고,
          <C>{`[rbp]`}</C>로 한 칸 거슬러 올라가는 식이죠. 이걸 알면 “왜 -O2로 컴파일하면 백트레이스가 망가지지?”의 답도 보입니다.
        </p>
      </Callout>

      <h2>Frame Pointer Omission (FPO) — 최적화의 함정</h2>

      <p>
        gcc/clang에 <C>-O2</C> 이상 최적화를 켜면 컴파일러는 <strong>프레임 포인터를 아예 안 만듭니다</strong>.
        프롤로그의 <C>{`push rbp; mov rbp, rsp`}</C>가 통째로 사라지고, 지역 변수는 모두 <C>rsp</C> 기준으로 접근됩니다.
        그 결과 <C>rbp</C>는 “하나 더 쓸 수 있는 범용 레지스터”로 풀려납니다 — 작지만 누적되면 의미 있는 성능 이득이죠.
      </p>

      <Compare>
        <CodeBlock lang="asm" filename="-O0 (프레임 포인터 사용)">{`example:
    push rbp
    mov  rbp, rsp
    sub  rsp, 16
    mov  [rbp - 8],  rdi    ; rbp 기준
    mov  rax, [rbp - 8]
    leave
    ret`}</CodeBlock>
        <CodeBlock lang="asm" filename="-O2 (FPO — 프레임 없음)">{`example:
    sub  rsp, 16
    mov  [rsp + 8], rdi     ; rsp 기준!
    mov  rax, [rsp + 8]
    add  rsp, 16
    ret`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ 리버싱에서 ‘프레임이 없는 함수’를 만나면">
        <p>
          최적화된 바이너리에선 <C>push rbp</C>로 시작하지 않는 함수가 많습니다. 이때는 <C>rsp</C> 기준 접근을 그대로 읽어야 하는데,
          <C>rsp</C>는 함수 안에서도 움직이기 때문에 <em>같은 변수의 오프셋이 코드 위치마다 달라집니다</em>.
          Ghidra/IDA는 이를 자동 추적해서 통합된 이름(<C>local_8</C> 등)으로 보여주지만, 손으로 읽을 땐 헷갈리니 주의하세요.
          GDB 백트레이스가 깨질 때는 <C>-fno-omit-frame-pointer</C>로 다시 컴파일하면 살아납니다.
        </p>
      </Callout>

      <Callout type="tip" title="‘진짜 프레임 없는 함수’는 더 짧을 수도 있다">
        <p>
          지역 변수가 모두 레지스터에 들어가는 작은 함수라면, 컴파일러는 <C>sub rsp, N</C>조차 안 만듭니다.
          <C>{`add eax, edi; ret`}</C> 같은 두세 줄짜리 함수를 만나면 “이건 프레임도 없는 ‘리프 함수’구나”라고 읽으면 됩니다.
          이런 함수에선 “128바이트의 red zone”이라는 또 다른 ABI 규칙이 활용되는데, 호기심 있다면 System V 문서를 찾아보세요.
        </p>
      </Callout>

      <h2>여러 프레임이 동시에 살아있을 때 — 호출 스택의 모습</h2>

      <p>
        <C>main()</C> → <C>foo()</C> → <C>bar()</C>로 호출이 이어지고 있는 순간, 스택에는 세 프레임이 동시에 살아 있습니다.
        각 프레임의 saved rbp가 이전 프레임을 가리켜 연결 고리를 만들죠. 이게 곧 <strong>call stack</strong>의 물리적 실체입니다.
      </p>

      <MemDiagram rows={[
        { addr: "rsp →",   width: "75%", color: "var(--accent)",          tag: "bar의 지역변수", label: "현재 실행 중 (스택 TOP)" },
        { addr: "bar rbp", width: "55%", color: "oklch(0.6 0.13 320)",    tag: "saved rbp",  label: "→ foo의 rbp를 가리킴" },
        { addr: "",        width: "85%", color: "oklch(0.6 0.13 30)",     tag: "ret addr",   label: "foo로 돌아갈 주소" },
        { addr: "",        width: "70%", color: "oklch(0.65 0.12 250)",   tag: "foo 로컬",    label: "foo의 지역변수" },
        { addr: "foo rbp", width: "55%", color: "oklch(0.6 0.13 320)",    tag: "saved rbp",  label: "→ main의 rbp를 가리킴" },
        { addr: "",        width: "85%", color: "oklch(0.6 0.13 30)",     tag: "ret addr",   label: "main으로 돌아갈 주소" },
        { addr: "",        width: "60%", color: "oklch(0.65 0.12 250)",   tag: "main 로컬",   label: "main의 지역변수" },
        { addr: "main rbp",width: "45%", color: "var(--fg-faint)",        tag: "↓",          label: "더 깊은 곳: 시작 환경" },
      ]} />

      <h2>스택 프레임을 ‘공격’하면? — 4.5 미리보기</h2>

      <p>
        2.6 끝에서 본 그 위협 — <strong>지역 변수와 리턴 주소가 같은 프레임 안의 이웃</strong>이라는 사실은
        이 그림에서 더 분명해집니다. <C>{`char buf[64]`}</C>가 <C>rbp - 64 ~ rbp - 1</C>에 있다면,
        <C>buf</C>를 64바이트 넘게 채우는 순간 <strong>saved rbp(rbp + 0)</strong>와{" "}
        <strong>리턴 주소(rbp + 8)</strong>가 순차적으로 덮어써집니다.
      </p>

      <Callout type="warn" title="🔴 ‘buf의 끝’과 ‘리턴 주소’ 사이의 거리는 정확히 8바이트 + saved rbp">
        <p>
          이게 고전적인 스택 버퍼 오버플로의 산수입니다. 64바이트 버퍼 + 8바이트 saved rbp + 8바이트 리턴 주소 = 80바이트만 채우면,
          공격자가 마지막 8바이트로 <em>“이 함수가 끝나면 어디로 점프할지”</em>를 결정할 수 있습니다.
          현대 컴파일러의 스택 카나리(<C>-fstack-protector</C>)는 saved rbp 바로 위에 <em>매번 다른 마법값</em>을 박아두고
          에필로그에서 그 값이 그대로인지 검사 — 깨져 있으면 즉시 abort. 자세한 공격·방어는 4.5에서 다룹니다.
        </p>
      </Callout>

      <h2>한눈 비교 — 디스어셈블리에서 ‘이건 함수다’ 알아보기</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>패턴</th><th>의미</th><th>어디서 보이나</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">push rbp / mov rbp, rsp / sub rsp, N</td><td>표준 프롤로그</td><td>-O0/-O1 함수 시작</td></tr>
            <tr><td className="mono">sub rsp, N (rbp 안 건드림)</td><td>FPO 프롤로그</td><td>-O2 이상</td></tr>
            <tr><td className="mono">push rbx / push r12 ...</td><td>callee-saved 백업 (3.1 참고)</td><td>장기 변수가 있는 함수</td></tr>
            <tr><td className="mono">leave; ret</td><td>표준 에필로그</td><td>프레임 있는 함수의 끝</td></tr>
            <tr><td className="mono">add rsp, N; ret</td><td>FPO 에필로그</td><td>-O2 함수의 끝</td></tr>
            <tr><td className="mono">pop r12 / pop rbx / ret</td><td>callee-saved 복원 후 리턴</td><td>3.1 패턴의 짝</td></tr>
          </tbody>
        </table>
      </div>

      <Summary items={[
        "스택 프레임은 한 함수 호출이 살아있는 동안 점유하는 스택 위의 한 칸. 지역변수·saved rbp·리턴 주소가 같이 산다.",
        "rbp는 프레임의 ‘기준 못’ — 함수 안 어디서든 [rbp - N]은 지역변수, [rbp + 8]은 리턴 주소.",
        "프롤로그 3종 세트: push rbp; mov rbp, rsp; sub rsp, N — 프레임을 짓는 의식.",
        "에필로그: leave; ret — leave는 ‘mov rsp,rbp; pop rbp’의 단축어. 프레임을 허무는 의식.",
        "rbp를 따로 두는 이유 두 가지 — ① 함수 안에서 rsp가 움직여도 안정적 ② 디버거가 프레임 체인을 거꾸로 따라가 backtrace 생성.",
        "-O2부터는 FPO — push rbp가 사라지고 rsp 기준 접근만 남는다. 리버싱에선 흔히 본다.",
        "지역 버퍼가 리턴 주소의 ‘바로 옆자리’라는 사실이 곧 스택 버퍼 오버플로 공격의 기하학적 토대 (4.5).",
        "디스어셈블리에서 함수 경계를 찾는 첫 표지: 함수 시작의 push rbp 또는 sub rsp, N, 끝의 leave/ret 또는 add rsp/ret.",
      ]} />
    </article>
  );
}

window.P3C2 = P3C2;
