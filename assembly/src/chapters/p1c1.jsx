// Part 1 · 1.1 컴퓨터 기본 구조
function P1C1() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 1 · Chapter 1.1"
        title="컴퓨터 기본 구조"
        subtitle={"어셈블리어는 CPU가 직접 이해하는 언어입니다. 그러므로 CPU가 어떻게 생겼는지,\n메모리와 어떻게 대화하는지부터 알아야 합니다."}
      />

      <p data-bridge="cc-intro-bridge-p1c1">
        어셈블리를 배우려면 먼저 그 어셈블리가 ‘말 거는 대상’이 누구인지 알아야 합니다.
        그 대상이 곧 컴퓨터 — 정확히는 CPU와 메모리, 그리고 그 둘 사이를 끊임없이 오가는 데이터의 흐름입니다.
        이 1장에서는 코드를 한 줄도 보지 않습니다. 대신 <em>“CPU는 도대체 무엇을 하고 있는가?”</em>,{" "}
        <em>“프로그램이 실행된다는 건 메모리에선 어떤 모습인가?”</em> 같은 질문에 답합니다.
        이 토대가 단단해야 2장부터 나오는 <C>mov</C>, <C>push</C>, <C>call</C>이
        ‘마법의 주문’이 아니라 <strong>‘너무 당연한 결과’</strong>로 보입니다.
      </p>

      <h2>컴퓨터는 무엇으로 이루어져 있나?</h2>

      <p>
        컴퓨터는 크게 <strong>CPU(중앙처리장치)</strong>, <strong>메모리(RAM)</strong>,
        <strong> 저장장치(SSD/HDD)</strong>, <strong>입출력장치</strong>로 이루어집니다.
        이 네 부품이 <strong>버스(bus)</strong>라는 통로로 연결되어 끊임없이 데이터를 주고받습니다.
      </p>

      <FlowDiagram nodes={[
        { label: "Storage", val: "SSD / HDD" },
        { label: "Memory",  val: "RAM",  highlight: true },
        { label: "CPU",     val: "레지스터 + ALU", highlight: true },
      ]} />

      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: -12, marginBottom: 24 }}>
        프로그램은 저장장치에 잠들어 있다가, 실행되는 순간 RAM으로 올라오고,
        CPU는 RAM에서 명령어와 데이터를 가져와 실행합니다.
      </p>

      <DefBox term="CPU" en="Central Processing Unit · 중앙처리장치">
        <p>
          컴퓨터의 “뇌”입니다. 덧셈, 비교, 점프 같은
          <KeyTerm term="연산(Operation): 더하기·빼기·비교·데이터 읽기·쓰기 같이 CPU가 수행하는 작업 하나하나를 뜻합니다.">
            {" 연산 "}
          </KeyTerm>
          을 초당 수십억 번 실행합니다. 어셈블리 명령어는 결국 CPU에게 보내는 직접 지시입니다.
          “이 두 숫자를 더해라”, “여기 주소의 값을 읽어라” 같은 명령들입니다.
        </p>
      </DefBox>

      <DefBox term="RAM" en="Random Access Memory">
        <p>
          프로그램이 실행 중일 때 데이터를 임시로 저장하는 공간입니다.
          책상 위의 메모지 같은 개념으로, 전원이 꺼지면 사라집니다.
          어셈블리에서 <C>mov</C>로 읽고 쓰는 대부분의 공간이 이 RAM입니다.
          <KeyTerm term="주소(Address): 메모리 안의 특정 위치를 가리키는 번호입니다. 마치 아파트 호수처럼, 메모리 내 모든 바이트는 고유한 번호를 가집니다.">
            {" 주소(번지) "}
          </KeyTerm>
          로 접근하며, 모든 바이트는 고유한 주소를 가집니다.
        </p>
      </DefBox>

      <DefBox term="저장장치" en="SSD / HDD">
        <p>
          전원이 꺼져도 남아있는 영구 저장공간입니다. 파일들이 여기 있습니다.
          프로그램을 실행하면 저장장치에서 RAM으로 복사되어 올라갑니다.
          <KeyTerm term="SSD(Solid State Drive): 반도체 기반 저장장치. 빠르고 충격에 강합니다. HDD(Hard Disk Drive): 자기 디스크를 회전시키는 방식. 느리지만 용량 대비 저렴합니다.">
            {" SSD는 HDD보다 훨씬 빠르지만 "}
          </KeyTerm>
          , 둘 다 RAM보다는 수십~수천 배 느립니다.
        </p>
      </DefBox>

      <Callout type="info" title="속도의 위계 — 왜 레지스터를 따로 두는가">
        <p>
          저장장치는 ms(밀리초), RAM은 ns(나노초), CPU 레지스터는 ps(피코초) 단위로 동작합니다.
          속도 차이가 <strong>수백만 배</strong>나 나기 때문에, CPU는 자주 쓰는 값을
          자기 손이 닿는 레지스터에 두고 일합니다. 이 위계가 어셈블리어 전체의 행간을 만듭니다.
        </p>
      </Callout>

      <h2>폰 노이만 구조 — 현대 컴퓨터의 설계 철학</h2>

      <p>
        <strong>폰 노이만 구조(Von Neumann Architecture)</strong>는 1945년에 만들어진
        컴퓨터 설계 방식으로, 현재 여러분의 PC가 그대로 따르고 있습니다. 핵심 아이디어는 딱 하나입니다.
      </p>

      <Callout type="note" title="💡 폰 노이만의 핵심 아이디어">
        <p>
          <strong>프로그램 코드(명령어)와 데이터를 같은 메모리에 저장한다.</strong>
          {" "}덕분에 프로그램을 메모리에서 읽어와서 순서대로 실행할 수 있습니다.
          어셈블리 코드도 결국 메모리의 특정 주소에 저장된 바이트들입니다.
        </p>
      </Callout>

      <p>
        나중에 보게 될 어셈블리 파일의 <C>.text</C> 섹션(명령어)과 <C>.data</C> 섹션(데이터) 구분도,
        결국 “같은 메모리 안에서 코드와 데이터의 영역을 나눠 쓰는” 폰 노이만 모델 위에서의 약속입니다.
      </p>

      <h2>비트(Bit)와 바이트(Byte)</h2>

      <DefBox term="비트" en="Bit">
        <p>
          컴퓨터가 다룰 수 있는 가장 작은 정보 단위입니다. 0 또는 1, 두 가지 값만 가집니다.
          왜 0과 1밖에 없냐면? 전기가 흐르면 1, 안 흐르면 0으로
          물리적으로 표현하기 가장 쉽기 때문입니다.
        </p>
      </DefBox>

      <DefBox term="바이트" en="Byte">
        <p>
          8개의 비트를 묶은 단위입니다. <C>00000000</C>부터 <C>11111111</C>까지,
          즉 0부터 255까지의 값을 표현할 수 있습니다.
          메모리의 주소는 바이트 단위로 매겨집니다. 1KB = 1024바이트, 1MB = 1024KB입니다.
        </p>
      </DefBox>

      <MemDiagram rows={[
        { addr: "1 bit",   width: "12.5%", color: "oklch(0.7 0.13 30)",   tag: "1b",   label: "0 또는 1" },
        { addr: "1 byte",  width: "25%",   color: "oklch(0.7 0.13 60)",   tag: "8b",   label: "0 ~ 255" },
        { addr: "1 word",  width: "37.5%", color: "oklch(0.65 0.13 200)", tag: "16b",  label: "0 ~ 65,535" },
        { addr: "1 dword", width: "62.5%", color: "oklch(0.55 0.13 255)", tag: "32b",  label: "약 ±21억" },
        { addr: "1 qword", width: "100%",  color: "oklch(0.5 0.13 285)",  tag: "64b",  label: "약 ±9.2 × 10¹⁸" },
      ]} />

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>단위</th><th>크기</th><th>예시</th><th>어셈블리 표현</th></tr>
          </thead>
          <tbody>
            <tr><td>비트 (bit)</td><td>1 bit</td><td>0 또는 1</td><td className="mono">—</td></tr>
            <tr><td>바이트 (byte)</td><td>8 bit</td><td>문자 'A' = 65</td><td className="mono">BYTE PTR</td></tr>
            <tr><td>워드 (word)</td><td>16 bit = 2 byte</td><td>0 ~ 65,535</td><td className="mono">WORD PTR</td></tr>
            <tr><td>더블워드 (dword)</td><td>32 bit = 4 byte</td><td>int 변수</td><td className="mono">DWORD PTR</td></tr>
            <tr><td>쿼드워드 (qword)</td><td>64 bit = 8 byte</td><td>포인터, long</td><td className="mono">QWORD PTR</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 PTR이 뭔가요?">
        <p>
          <C>PTR</C>은 <strong>Pointer(포인터)</strong>의 약자입니다.
          여기서는 “이 주소에 있는 값을 ○○ 크기로 해석하라”는 뜻입니다.
          <C>DWORD PTR [rbx]</C>는 “rbx가 가리키는 주소에 있는 4바이트를 읽어라”라는 의미입니다.
        </p>
      </Callout>

      <Callout type="tip" title="왜 워드/더블워드 같은 이름을 따로 둘까">
        <p>
          명령어 한 줄로 한 번에 처리할 데이터의 크기를 CPU에게 알려주기 위해서입니다.
          같은 <C>mov</C>라도 1바이트를 옮길지 8바이트를 옮길지에 따라 동작이 달라지므로,
          어셈블리어는 항상 <strong>“얼마만큼”</strong>을 명시할 수 있어야 합니다.
        </p>
      </Callout>

      <Summary items={[
        "컴퓨터의 4대 부품: CPU · RAM · 저장장치 · 입출력장치. 버스로 연결되어 데이터를 주고받는다.",
        "속도 위계: 레지스터 ≫ RAM ≫ 저장장치. 차이가 수백만 배라 CPU는 자주 쓰는 값을 레지스터에 둔다.",
        "폰 노이만 구조 — 프로그램 코드와 데이터를 같은 메모리에 저장한다. 어셈블리의 .text / .data 구분의 뿌리.",
        "정보 단위: bit(1) → byte(8) → word(16) → dword(32) → qword(64).",
        "어셈블리의 BYTE/WORD/DWORD/QWORD PTR은 “이 주소를 몇 바이트짜리로 해석할지” 알려주는 약속이다.",
      ]} />
    </article>
  );
}

window.P1C1 = P1C1;
