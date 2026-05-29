// Part 1 · 1.4 CPU 작동 원리
function P1C4() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 1 · Chapter 1.4"
        title="CPU 작동 원리"
        subtitle="어셈블리 명령어 하나가 CPU에서 어떻게 처리되는지 이해하면, 왜 레지스터가 필요한지 · 왜 캐시가 중요한지 자연스럽게 이해됩니다."
      />

      <p data-bridge="cc-intro-bridge-p1c4">
        앞 두 챕터에서 <em>“CPU가 메모리에서 명령을 가져와 실행한다”</em>고 했습니다.
        그런데 그 ‘가져온다’와 ‘실행한다’는 정확히 어떻게 일어날까요? CPU 안엔 어떤 톱니바퀴들이 돌아가고,
        명령어 하나를 처리하는 데 정확히 몇 박자가 걸릴까요?
        이 챕터에선 그 박자 — <strong>Fetch · Decode · Execute · Writeback</strong> — 를 살펴봅니다.
        이걸 알면 <em>왜 어떤 명령이 다른 명령보다 빠른지</em>, <em>왜 분기 예측이 그렇게 중요한지</em>가
        자연스럽게 따라옵니다.
      </p>

      <h2>명령어 사이클 — CPU가 하는 일의 반복</h2>

      <p>
        CPU는 매우 단순한 일을 엄청 빠르게 반복합니다.
        이 반복을 <strong>명령어 사이클(Instruction Cycle)</strong>이라고 합니다.
        네 단계의 무한 루프라고 생각하면 됩니다.
      </p>

      <FlowDiagram nodes={[
        { label: "1", val: "Fetch" },
        { label: "2", val: "Decode" },
        { label: "3", val: "Execute" },
        { label: "4", val: "Writeback" },
      ]} />

      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: -12, marginBottom: 24 }}>
        한 사이클이 끝나면 다시 처음으로 돌아갑니다. <C>rip</C>가 다음 명령어 주소로 갱신되어 있을 뿐이지요.
      </p>

      <KeyPoint n={1}>
        <strong>Fetch — 명령어 가져오기.</strong>{" "}
        <C>rip</C>
        {" "}
        (
        <KeyTerm term="명령 포인터(Instruction Pointer): '다음에 실행할 명령어가 메모리의 어디에 있는지'를 저장하는 레지스터입니다. x86-64에서는 rip라고 부릅니다. 명령어를 실행할 때마다 자동으로 증가합니다.">
          명령 포인터 레지스터
        </KeyTerm>
        )가 가리키는 메모리 주소에서 다음 명령어
        {" "}
        (
        <KeyTerm term="기계어 바이트: CPU가 직접 이해하는 숫자 코드입니다. 예를 들어 'mov rdi, rax'는 '48 89 c7'라는 3바이트로 표현됩니다.">
          기계어 바이트
        </KeyTerm>
        )를 읽어옵니다. 예: 주소 <C>0x401234</C>에서 <C>48 89 c7</C> 같은 바이트를 읽습니다.
      </KeyPoint>

      <KeyPoint n={2}>
        <strong>Decode — 명령어 해석.</strong>
        읽어온 바이트가 무슨 명령인지 해석합니다.
        <C>48 89 c7</C>이 <C>mov rdi, rax</C>라는 명령임을 알아냅니다.
        명령어마다 길이가 다릅니다(1~15바이트). 이 해석 과정을
        {" "}
        <KeyTerm term="디코드(Decode): '해독하다'라는 뜻입니다. 암호화된 메시지를 해독하듯, CPU가 기계어 바이트를 읽어서 '이건 덧셈 명령이구나', '이건 점프구나' 하고 파악하는 과정입니다.">
          디코딩
        </KeyTerm>
        이라고 합니다.
      </KeyPoint>

      <KeyPoint n={3}>
        <strong>Execute — 명령 수행.</strong>
        {" "}
        <KeyTerm term="ALU(Arithmetic Logic Unit, 산술논리장치): CPU 안에서 실제 계산을 담당하는 부품입니다. 덧셈·뺄셈·AND·OR·비교 같은 연산을 수행합니다. 계산기의 ‘계산 엔진’ 역할을 합니다.">
          ALU(산술논리장치)
        </KeyTerm>
        가 실제 연산을 수행합니다.
        <C>add rax, rbx</C>라면 두 레지스터 값을 더하는 회로가 작동합니다.
      </KeyPoint>

      <KeyPoint n={4}>
        <strong>Writeback — 결과 저장.</strong>
        연산 결과를 레지스터나 메모리에 씁니다.
        {" "}
        <KeyTerm term="플래그 레지스터(Flags Register): 연산 결과의 상태를 기록하는 레지스터입니다. 결과가 0인지, 음수인지, 넘침이 있는지 등을 각 비트(플래그)로 표시합니다. 자세한 내용은 2.5에서 다룹니다.">
          플래그 레지스터(rflags)
        </KeyTerm>
        도 이때 갱신됩니다.
      </KeyPoint>

      <Callout type="info" title="실제 CPU는 동시에 여러 단계를 진행합니다 — 파이프라이닝">
        <p>
          현대 x86-64 CPU는 한 번에 한 명령씩 순서대로 처리하지 않습니다.
          명령 A의 Writeback이 끝나기를 기다리지 않고, 명령 B의 Decode와 명령 C의 Fetch를
          <strong> 동시에 진행</strong>합니다 (파이프라이닝).
          더 나아가 <strong>비순차 실행(OoO)</strong>·<strong>분기 예측</strong>·<strong>슈퍼스칼라</strong>{" "}
          같은 기법으로 한 사이클에 여러 명령을 동시에 처리하기까지 합니다.
          이 모든 마법은 “네 단계 사이클”이라는 단순한 모델 위에서 펼쳐집니다.
        </p>
      </Callout>

      <h2>캐시(Cache) — CPU와 RAM 사이의 고속 메모리</h2>

      <DefBox term="캐시" en="Cache">
        <p>
          RAM은 CPU에 비해 매우 느립니다. 그래서 CPU 내부에 더 빠른 소용량 메모리(캐시)를 두고,
          자주 쓰는 데이터를 미리 복사해둡니다. L1(가장 빠름, 작음) → L2 → L3 순으로 계층이 있습니다.
          어셈블리 최적화에서 “
          <KeyTerm term="캐시 히트(Cache Hit): 필요한 데이터가 캐시에 이미 있어서 빠르게 가져오는 경우입니다. 캐시 미스(Cache Miss): 필요한 데이터가 캐시에 없어서 느린 RAM에서 가져와야 하는 경우입니다. 히트가 많을수록 프로그램이 빠릅니다.">
            캐시 히트 / 미스
          </KeyTerm>
          ”가 중요한 성능 요소입니다.
        </p>
      </DefBox>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>메모리 유형</th><th>속도 (지연)</th><th>용량</th><th>위치</th></tr>
          </thead>
          <tbody>
            <tr><td>레지스터</td><td className="mono">1 사이클</td><td>수십 개</td><td>CPU 내부</td></tr>
            <tr><td>L1 캐시</td><td className="mono">~4 사이클</td><td>32 ~ 64 KB</td><td>CPU 코어 내부</td></tr>
            <tr><td>L2 캐시</td><td className="mono">~12 사이클</td><td>256 KB ~ 1 MB</td><td>CPU 코어 내부</td></tr>
            <tr><td>L3 캐시</td><td className="mono">~40 사이클</td><td>8 ~ 32 MB</td><td>CPU 칩(코어 공유)</td></tr>
            <tr><td>RAM</td><td className="mono">~200 사이클</td><td>8 ~ 64 GB</td><td>별도 칩</td></tr>
            <tr><td>SSD</td><td className="mono">수만 사이클</td><td>수백 GB ~ TB</td><td>별도 장치</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 사이클이란?">
        <p>
          <strong>사이클(Cycle)</strong>은 CPU 클럭 한 번의 단위입니다.
          3 GHz CPU는 1초에 30억 번 클럭이 뜁니다.
          1 사이클 ≈ <strong>0.33 나노초</strong>(0.00000000033초)입니다.
          레지스터는 1 사이클이면 끝나지만, RAM은 200 사이클이나 기다려야 합니다.
          그래서 레지스터 접근이 압도적으로 빠릅니다.
        </p>
      </Callout>

      <Callout type="tip" title="캐시 친화적 코드 — 한 가지만 기억한다면">
        <p>
          <strong>“메모리를 순서대로 읽어라.”</strong>{" "}
          캐시는 한 번에 한 바이트가 아니라 <strong>64바이트 묶음(캐시 라인)</strong>을 가져옵니다.
          배열을 순차적으로 도는 코드는 캐시가 미리 따라오면서(prefetch)
          거의 모든 접근이 히트로 끝납니다. 반면 무작위 접근이나 큰 보폭의 점프는
          매번 200 사이클짜리 RAM 왕복을 일으킵니다 — 같은 알고리즘이라도 10배 차이가 나는 이유입니다.
        </p>
      </Callout>

      <h2>한 줄로 정리하면</h2>
      <p>
        CPU는 <strong>rip를 따라가며 Fetch–Decode–Execute–Writeback을 영원히 반복</strong>합니다.
        모든 어셈블리 코드는 이 사이클을 따라 한 줄씩 흘러갑니다.
        우리가 앞으로 배울 모든 명령어는 결국 이 네 단계 안에서 일어나는 일을 다르게 정의한 것뿐입니다.
      </p>

      <Summary items={[
        "CPU는 Fetch → Decode → Execute → Writeback의 4단계를 반복한다.",
        "rip는 다음 실행할 명령어의 주소, rflags는 직전 연산의 부수 효과를 담는다.",
        "실제 CPU는 파이프라이닝·비순차 실행·분기 예측으로 여러 명령을 겹쳐서 처리한다.",
        "메모리 계층: 레지스터(1) ≫ L1(4) ≫ L2(12) ≫ L3(40) ≫ RAM(200) ≫ SSD(수만) 사이클.",
        "캐시는 64바이트 라인 단위로 가져온다 — 메모리를 순서대로 읽는 코드가 빠르다.",
      ]} />
    </article>
  );
}

window.P1C4 = P1C4;
