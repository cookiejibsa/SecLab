// Part 2 · 2.2 레지스터 완전 해부
function P2C2() {
  const colors = {
    r64: "oklch(0.5 0.14 285)",
    r32: "oklch(0.55 0.13 255)",
    r16: "oklch(0.6 0.13 200)",
    r8h: "oklch(0.65 0.13 60)",
    r8l: "oklch(0.65 0.14 30)",
  };

  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.2"
        title="레지스터 완전 해부"
        subtitle="레지스터는 CPU 안에 있는 초고속 저장 공간입니다. 어셈블리의 모든 연산은 레지스터를 중심으로 돌아갑니다."
      />

      <p data-bridge="cc-intro-bridge-p2c2">
        앞에서 CPU가 메모리에서 데이터를 가져와 처리한다고 했지만, 사실 CPU는 매번 메모리에 손을 뻗지 않습니다 — 너무 느리니까요.
        대신 CPU 안에는 ‘책상 위 메모’ 같은 초고속 저장공간이 있습니다. 그게 바로 <strong>레지스터</strong>입니다.
        어셈블리의 거의 모든 명령은 결국 <em>‘레지스터에 무엇을 넣고, 레지스터끼리 어떻게 처리할지’</em>의 이야기 —
        그래서 명령어를 배우기 전에 레지스터부터 외워야 합니다.
        x86-64엔 어떤 레지스터가 있고, 각각 어떤 별명과 역할을 가지고 있을까요?
      </p>

      <h2>레지스터란?</h2>

      <DefBox term="레지스터" en="Register">
        <p>
          CPU 안에 있는 극소량의 저장 공간입니다. RAM보다 수백 배 빠릅니다.
          x86-64에는 16개의{" "}
          <KeyTerm term="범용 레지스터(General Purpose Register): 특정 용도에 고정되지 않고 다양한 목적으로 자유롭게 사용할 수 있는 레지스터입니다. rax, rbx, rcx 등이 범용 레지스터입니다. 반면 rip(명령 포인터)는 특수목적 레지스터입니다.">
            범용 레지스터
          </KeyTerm>
          가 있으며, 각각 64비트(8바이트)입니다. C 변수를 메모리에 저장하는 것과 달리,
          어셈블리에서는 가능한 한 레지스터를 이용해 연산합니다.
        </p>
      </DefBox>

      <h2>레지스터 크기별 이름 — 같은 물리 레지스터, 다른 이름</h2>

      <p>
        중요합니다! x86-64의 레지스터는 크기별로 다른 이름을 가집니다.
        <C>rax</C>의 하위 32비트가 <C>eax</C>, 하위 16비트가 <C>ax</C>,
        하위 8비트가 <C>al</C>입니다. 이들은 <em>같은 물리 공간의 일부</em>입니다.
      </p>

      <div className="reg-aliases">
        <div className="reg-alias-row">
          <div className="reg-alias-name">RAX</div>
          <div className="reg-alias-bar">
            <div className="reg-alias-seg" style={{ flex: "0 0 100%", background: colors.r64 }}>RAX · 64-bit</div>
          </div>
        </div>
        <div className="reg-alias-row">
          <div className="reg-alias-name">EAX</div>
          <div className="reg-alias-bar">
            <div className="reg-alias-seg unused" style={{ flex: "0 0 50%" }}>상위 32비트 · 자동 0</div>
            <div className="reg-alias-seg" style={{ flex: "0 0 50%", background: colors.r32 }}>EAX · 32-bit</div>
          </div>
        </div>
        <div className="reg-alias-row">
          <div className="reg-alias-name">AX</div>
          <div className="reg-alias-bar">
            <div className="reg-alias-seg unused" style={{ flex: "0 0 75%" }}>상위 48비트 · 보존</div>
            <div className="reg-alias-seg" style={{ flex: "0 0 25%", background: colors.r16 }}>AX · 16-bit</div>
          </div>
        </div>
        <div className="reg-alias-row">
          <div className="reg-alias-name">AH / AL</div>
          <div className="reg-alias-bar">
            <div className="reg-alias-seg unused" style={{ flex: "0 0 75%" }}>상위 48비트 · 보존</div>
            <div className="reg-alias-seg" style={{ flex: "0 0 12.5%", background: colors.r8h }}>AH</div>
            <div className="reg-alias-seg" style={{ flex: "0 0 12.5%", background: colors.r8l }}>AL</div>
          </div>
        </div>
        <div className="reg-bits-scale">
          <div></div>
          <div className="scale">
            <span>bit 63</span>
            <span>bit 31</span>
            <span>bit 15</span>
            <span>bit 7</span>
            <span>bit 0</span>
          </div>
        </div>
      </div>

      <Callout type="note" title="📌 이름의 의미">
        <p>
          이름에는 역사가 있습니다.
          {" "}<strong>R</strong>AX = Register AX (64비트 확장),
          {" "}<strong>E</strong>AX = Extended AX (32비트),
          {" "}<strong>AX</strong> = 16비트 원래 이름,
          {" "}<strong>AH</strong> = AX High (상위 8비트),
          {" "}<strong>AL</strong> = AX Low (하위 8비트).
          e(Extended / 확장), r(Register / 64비트 시대)가 붙은 것입니다.
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ 32비트 쓰면 상위가 0이 됩니다">
        <p>
          <C>mov eax, 1</C>을 실행하면 rax의 상위 32비트는 <strong>자동으로 0</strong>이 됩니다.
          이건 x86-64의 중요한 특성입니다. 반면 <C>mov ax, 1</C>은 상위 48비트를 건드리지 않습니다.
        </p>
      </Callout>

      <CodeBlock lang="asm" filename="비트 폭별 쓰기 동작 비교">{`mov rax, 0xFFFFFFFFFFFFFFFF   ; rax = 모든 비트 1

mov eax, 0                    ; → rax = 0x0000000000000000  (상위 32비트도 0!)
mov ax,  0                    ; → rax = 0xFFFFFFFF00000000  (하위 16비트만 0)
mov al,  0                    ; → rax = 0xFFFFFFFFFFFFFF00  (하위 8비트만 0)`}</CodeBlock>

      <h2>16개 범용 레지스터와 각자의 역할</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr>
              <th>64</th><th>32</th><th>16</th><th>8(L)</th><th>주된 역할 / 관례</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">rax</td><td className="mono">eax</td><td className="mono">ax</td><td className="mono">al</td>
              <td>함수 <strong>리턴값</strong>,{" "}
                <KeyTerm term="누산기(Accumulator): ‘쌓는 것’이라는 뜻으로, 연산 결과를 반복적으로 누적(더하거나 쌓아가는)하는 데 주로 쓰이는 레지스터입니다. 예전 CPU에서는 거의 모든 연산 결과가 이 레지스터에 담겼습니다.">
                  누산기(accumulator)
                </KeyTerm>
                . <C>return</C> 결과가 여기 담김
              </td>
            </tr>
            <tr>
              <td className="mono">rbx</td><td className="mono">ebx</td><td className="mono">bx</td><td className="mono">bl</td>
              <td>
                <KeyTerm term="Callee-saved(피호출자 보존): 호출된 함수(callee)가 사용하기 전에 값을 저장해두고 함수 종료 전에 원래 값으로 복원해야 하는 레지스터입니다. 호출한 함수 입장에서는 이 레지스터가 함수 호출 후에도 값이 변하지 않는다고 믿을 수 있습니다.">
                  Callee-saved
                </KeyTerm>
                {" "}(호출받은 함수가 보존해야 함)
              </td>
            </tr>
            <tr>
              <td className="mono">rcx</td><td className="mono">ecx</td><td className="mono">cx</td><td className="mono">cl</td>
              <td>함수 <strong>4번째 인수</strong>,{" "}
                <KeyTerm term="루프 카운터: 반복문(for, while)에서 반복 횟수를 세는 변수입니다. 예전 x86에서 loop 명령어가 rcx를 자동으로 1씩 줄이며 반복했기 때문에 관례적으로 카운터로 씁니다.">
                  루프 카운터
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">rdx</td><td className="mono">edx</td><td className="mono">dx</td><td className="mono">dl</td>
              <td>함수 <strong>3번째 인수</strong>,{" "}
                <KeyTerm term="나머지(Remainder): 나눗셈의 나머지 결과가 rdx에 저장됩니다. 예: 10 ÷ 3 = 몫 3 (rax에), 나머지 1 (rdx에).">
                  나눗셈 나머지
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">rsi</td><td className="mono">esi</td><td className="mono">si</td><td className="mono">sil</td>
              <td>함수 <strong>2번째 인수</strong>,{" "}
                <KeyTerm term="문자열 소스(Source): 문자열 복사 명령어(movsb 등)에서 복사할 원본 데이터의 주소를 가리킵니다. SI = Source Index의 약자입니다.">
                  문자열 소스
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">rdi</td><td className="mono">edi</td><td className="mono">di</td><td className="mono">dil</td>
              <td>함수 <strong>1번째 인수</strong>,{" "}
                <KeyTerm term="문자열 목적지(Destination): 문자열 복사 명령어(movsb 등)에서 데이터를 복사할 대상 주소를 가리킵니다. DI = Destination Index의 약자입니다.">
                  문자열 목적지
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">rsp</td><td className="mono">esp</td><td className="mono">sp</td><td className="mono">spl</td>
              <td><strong>스택 포인터</strong> — 현재 스택 최상단 주소.{" "}
                <KeyTerm term="SP = Stack Pointer의 약자입니다. push하면 rsp가 8 감소하고, pop하면 8 증가합니다. 절대 임의로 변경하면 안 되는 매우 중요한 레지스터입니다.">
                  SP = Stack Pointer
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">rbp</td><td className="mono">ebp</td><td className="mono">bp</td><td className="mono">bpl</td>
              <td><strong>베이스 포인터</strong> — 스택 프레임 기준점.{" "}
                <KeyTerm term="BP = Base Pointer의 약자입니다. 함수 실행 중 스택 프레임의 기준점(바닥)을 가리킵니다. 지역변수에 rbp-8, rbp-16 같이 rbp 기준으로 접근합니다.">
                  BP = Base Pointer
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">r8</td><td className="mono">r8d</td><td className="mono">r8w</td><td className="mono">r8b</td>
              <td>함수 <strong>5번째 인수</strong></td>
            </tr>
            <tr>
              <td className="mono">r9</td><td className="mono">r9d</td><td className="mono">r9w</td><td className="mono">r9b</td>
              <td>함수 <strong>6번째 인수</strong></td>
            </tr>
            <tr>
              <td className="mono">r10, r11</td><td className="mono">…d</td><td className="mono">…w</td><td className="mono">…b</td>
              <td>임시 (scratch),{" "}
                <KeyTerm term="Caller-saved(호출자 보존): 함수를 호출하기 전에 호출하는 쪽(caller)이 저장해야 하는 레지스터입니다. 피호출 함수가 이 레지스터를 마음대로 바꿔도 됩니다.">
                  Caller-saved
                </KeyTerm>
              </td>
            </tr>
            <tr>
              <td className="mono">r12 ~ r15</td><td className="mono">…d</td><td className="mono">…w</td><td className="mono">…b</td>
              <td>장기 임시, <strong>Callee-saved</strong> (피호출자가 보존)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>함수 인자가 들어가는 순서 — 한눈에</h2>

      <FlowDiagram nodes={[
        { label: "1st", val: "rdi", highlight: true },
        { label: "2nd", val: "rsi", highlight: true },
        { label: "3rd", val: "rdx" },
        { label: "4th", val: "rcx" },
        { label: "5th", val: "r8" },
        { label: "6th", val: "r9" },
      ]} />

      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: -12, marginBottom: 24 }}>
        7번째 인자부터는 스택에 쌓입니다. 반환값은 항상 <C>rax</C>.
        이 순서는 Linux/macOS의 <strong>System V AMD64 ABI</strong> 규약입니다 (Windows는 다름).
      </p>

      <h2>특수 목적 레지스터</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>레지스터</th><th>이름</th><th>역할</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">rip</td><td>Instruction Pointer</td><td>다음에 실행할 명령어의 주소. 직접 수정 불가 — <C>jmp</C>·<C>call</C>로만 변경</td></tr>
            <tr><td className="mono">rflags</td><td>Flags Register</td><td>연산 결과의 상태 플래그 모음 (ZF, CF, SF, OF 등). 조건 점프에 사용 — 2.5에서 자세히</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Callee-saved vs Caller-saved — 한 번에 정리</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>분류</th><th>레지스터</th><th>의미</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Callee-saved</strong><br/><span style={{fontSize:11, color:"var(--fg-muted)"}}>피호출자가 보존</span></td>
              <td className="mono">rbx, rbp, r12, r13, r14, r15, rsp</td>
              <td>함수가 끝났을 때 호출 전과 같은 값이어야 함. 쓰려면 함수 시작에 push, 끝에 pop.</td>
            </tr>
            <tr>
              <td><strong>Caller-saved</strong><br/><span style={{fontSize:11, color:"var(--fg-muted)"}}>호출자가 보존</span></td>
              <td className="mono">rax, rcx, rdx, rsi, rdi, r8 ~ r11</td>
              <td>함수 호출 후 값이 변할 수 있다고 가정. 보존이 필요하면 부르기 전에 저장.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 C와 연결해서 기억하기">
        <p>C 함수 <C>int add(int a, int b)</C>를 호출하면:</p>
        <p style={{ marginLeft: 12 }}>
          → <C>a</C>는 <C>rdi</C>(또는 32비트면 <C>edi</C>)에 들어있고<br/>
          → <C>b</C>는 <C>rsi</C>(또는 <C>esi</C>)에 들어있으며<br/>
          → <C>return</C> 값은 <C>rax</C>에 넣고 함수를 종료합니다.
        </p>
      </Callout>

      <CodeBlock lang="asm" filename="add(3, 5) 호출 ⇆ 어셈블리">{`; --- 호출하는 쪽 ---
mov  edi, 3       ; 첫 번째 인자 a = 3
mov  esi, 5       ; 두 번째 인자 b = 5
call add          ; → 이후 rax에 결과

; --- add 함수 본문 ---
add:
    lea  eax, [edi + esi]   ; rax(eax) = a + b
    ret                     ; 호출자에게 복귀`}</CodeBlock>

      <Summary items={[
        "x86-64는 64비트 범용 레지스터 16개 + 특수 레지스터(rip, rflags)를 갖는다.",
        "rax/eax/ax/ah/al은 모두 같은 물리 레지스터의 다른 비트 폭 이름이다.",
        "32비트 쓰기는 상위 32비트를 0으로 지운다 (16/8비트 쓰기는 보존).",
        "함수 인자 순서: rdi, rsi, rdx, rcx, r8, r9 → 그 이상은 스택. 반환값은 rax.",
        "Callee-saved(rbx, rbp, r12~r15, rsp)는 피호출자가, 나머지(Caller-saved)는 호출자가 보존한다.",
      ]} />
    </article>
  );
}

window.P2C2 = P2C2;
