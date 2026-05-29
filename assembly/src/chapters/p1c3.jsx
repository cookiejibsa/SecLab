// Part 1 · 1.3 메모리 구조
function P1C3() {
  const seg = {
    stack: "oklch(0.55 0.16 25)",
    heap:  "oklch(0.55 0.14 145)",
    bss:   "oklch(0.55 0.13 60)",
    data:  "oklch(0.6 0.13 60)",
    text:  "oklch(0.5 0.14 285)",
  };

  return (
    <article>
      <ChapterHeader
        eyebrow="Part 1 · Chapter 1.3"
        title="메모리 구조"
        subtitle="프로그램이 실행될 때 메모리는 어떻게 나뉘어 있을까요? 이것을 모르면 스택 오버플로우, 버퍼 오버플로우 같은 개념을 이해할 수 없습니다."
      />

      <p data-bridge="cc-intro-bridge-p1c3">
        앞에서 <em>“메모리는 바이트의 거대한 일렬 배열”</em>이라고 봤습니다.
        그런데 그 안엔 코드가 있고, 전역 변수가 있고, 스택이 있고, 힙도 있죠 —
        어떤 칸이 무엇이고, 누가 그 자리를 정할까요? 또 ‘주소’라는 단어는 정확히 어떤 값을 가리킬까요?
        이 챕터에선 한 프로세스의 메모리가 어떻게 ‘구역’으로 나뉘는지를 짚습니다.
        2.4 메모리 접근, 2.6 스택의 토대가 됩니다.
      </p>

      <h2>메모리 주소란?</h2>

      <DefBox term="메모리 주소" en="Memory Address">
        <p>
          RAM의 각 바이트는 고유한 번호(주소)를 가집니다. 아파트 호수처럼요.
          x86-64에서 주소는 64비트(8바이트)입니다. 보통 <C>0x7fffffffe5a0</C> 같은
          16진수로 표시됩니다. <strong>포인터(pointer)</strong>는 이 주소를 담는 변수입니다.
          C에서 <C>int *p</C>라고 쓸 때 p가 바로 주소를 담는 포인터입니다.
        </p>
      </DefBox>

      <Callout type="info" title="64비트 주소의 실제 폭">
        <p>
          이론적으로 64비트면 약 1,800경 개의 바이트를 가리킬 수 있지만, 현재
          x86-64 CPU는 그 중 <strong>하위 48비트</strong>만 사용합니다 (약 256TB).
          그래서 실제 주소가 <C>0x00007fff...</C>처럼 상위가 0으로 보이는 것입니다.
        </p>
      </Callout>

      <h2>프로세스 메모리 레이아웃</h2>

      <p>
        <KeyTerm term="프로세스(Process): 실행 중인 프로그램 하나를 뜻합니다. 같은 프로그램을 두 번 실행하면 프로세스 두 개가 생깁니다. 각 프로세스는 자신만의 메모리 공간을 가집니다.">
          {" 프로세스(실행 중인 프로그램) "}
        </KeyTerm>
        가 받는 메모리는 다음과 같이 구역(세그먼트)이 나뉩니다.
        위쪽이 높은 주소, 아래쪽이 낮은 주소입니다.
      </p>

      <div className="mem-layout">
        <div className="mem-layout-row">
          <div className="mem-layout-addr">높은 주소<br/>0x7FFF…</div>
          <div className="mem-layout-seg">
            <span className="mem-layout-seg-name">
              <span className="mem-layout-tag" style={{ background: seg.stack }}>STACK</span>
              스택
            </span>
            <span className="mem-layout-seg-desc">함수 호출 · 지역변수</span>
          </div>
        </div>
        <div className="mem-layout-row gap">
          <div className="mem-layout-addr">↓ 자람</div>
          <div className="mem-layout-seg">스택이 아래로 자람 (rsp 감소)</div>
        </div>
        <div className="mem-layout-row gap">
          <div className="mem-layout-addr">⋮</div>
          <div className="mem-layout-seg">…… 빈 공간 ……</div>
        </div>
        <div className="mem-layout-row gap">
          <div className="mem-layout-addr">↑ 자람</div>
          <div className="mem-layout-seg">힙이 위로 자람</div>
        </div>
        <div className="mem-layout-row">
          <div className="mem-layout-addr">&nbsp;</div>
          <div className="mem-layout-seg">
            <span className="mem-layout-seg-name">
              <span className="mem-layout-tag" style={{ background: seg.heap }}>HEAP</span>
              힙
            </span>
            <span className="mem-layout-seg-desc">malloc · 동적 할당</span>
          </div>
        </div>
        <div className="mem-layout-row">
          <div className="mem-layout-addr">&nbsp;</div>
          <div className="mem-layout-seg">
            <span className="mem-layout-seg-name">
              <span className="mem-layout-tag" style={{ background: seg.bss }}>BSS</span>
              BSS
            </span>
            <span className="mem-layout-seg-desc">초기화 안 된 전역변수</span>
          </div>
        </div>
        <div className="mem-layout-row">
          <div className="mem-layout-addr">&nbsp;</div>
          <div className="mem-layout-seg">
            <span className="mem-layout-seg-name">
              <span className="mem-layout-tag" style={{ background: seg.data }}>DATA</span>
              데이터
            </span>
            <span className="mem-layout-seg-desc">초기화된 전역변수</span>
          </div>
        </div>
        <div className="mem-layout-row">
          <div className="mem-layout-addr">낮은 주소<br/>0x400000…</div>
          <div className="mem-layout-seg">
            <span className="mem-layout-seg-name">
              <span className="mem-layout-tag" style={{ background: seg.text }}>TEXT</span>
              텍스트
            </span>
            <span className="mem-layout-seg-desc">실행 코드 (어셈블리)</span>
          </div>
        </div>
      </div>

      <h2>각 구역 자세히 보기</h2>

      <h3>텍스트(Text) 세그먼트 — 코드가 사는 곳</h3>
      <p>
        여러분이 작성한 C / 어셈블리 코드가
        <KeyTerm term="컴파일(Compile): 사람이 읽을 수 있는 C/C++ 소스코드를 CPU가 직접 실행할 수 있는 기계어(바이트)로 변환하는 과정입니다. gcc·clang 같은 ‘컴파일러’가 이 일을 합니다.">
          {" 컴파일 "}
        </KeyTerm>
        되면,
        <KeyTerm term="기계어(Machine Code): CPU가 직접 이해하고 실행하는 0과 1로 이루어진 바이트입니다. 어셈블리어와 거의 1:1로 대응됩니다. 예: 'mov rax, 1'은 기계어로 '48 C7 C0 01 00 00 00'입니다.">
          {" 기계어 바이트 "}
        </KeyTerm>
        들이 이 구역에 저장됩니다. <strong>읽기 전용</strong>입니다.
        {" "}
        <KeyTerm term="Ghidra: 미국 NSA가 개발하고 무료로 공개한 리버싱 도구입니다. 바이너리를 어셈블리어로 보거나 유사 C 코드로 디컴파일해줍니다.">
          Ghidra
        </KeyTerm>
        나
        {" "}
        <KeyTerm term="IDA(Interactive Disassembler): 업계 표준 리버싱 도구입니다. 유료이지만 무료 버전(IDA Free)도 있습니다.">
          IDA
        </KeyTerm>
        로
        {" "}
        <KeyTerm term="바이너리(Binary): 컴파일된 실행 파일입니다. Windows의 .exe, Linux의 ELF 파일이 바이너리입니다.">
          바이너리
        </KeyTerm>
        를 열면 이 구역을 분석합니다. <C>rip</C> 레지스터(명령 포인터)가 현재 실행 중인 명령의 주소를 가리킵니다.
      </p>

      <h3>데이터(Data) / BSS 세그먼트 — 전역변수</h3>
      <p>
        <KeyTerm term="전역변수(Global Variable): 함수 밖에 선언된 변수입니다. 프로그램 전체에서 접근 가능하고, 프로그램이 시작될 때부터 끝날 때까지 메모리에 존재합니다. 반대는 지역변수(Local Variable)로 함수 안에서만 존재합니다.">
          {" 전역변수 "}
        </KeyTerm>
        가 저장되는 공간입니다. 초기값이 있는 것은 Data, 없는 것은 BSS에 들어갑니다.
      </p>

      <CodeBlock lang="c" filename="global-vars.c">{`// 전역변수의 위치
int initialized = 42;   // Data 세그먼트 (초기값 있음)
int uninitialized;      // BSS 세그먼트 (0으로 초기화됨)

static int counter = 0; // Data 세그먼트
const char *msg = "hi"; // 포인터는 Data, 문자열 "hi"는 Text(읽기 전용)`}</CodeBlock>

      <Callout type="note" title="📌 BSS란?">
        <p>
          <strong>BSS</strong>는 “Block Started by Symbol”의 약자입니다 (역사적 이유로 이상한 이름이 됐습니다).
          실행 파일에는 실제 0 데이터를 넣지 않고
          {" "}<strong>“이 크기만큼 0으로 채워진 공간이 필요하다”</strong>{" "}
          는 정보만 넣습니다. 덕분에 실행 파일 용량이 줄어듭니다.
        </p>
      </Callout>

      <h3>힙(Heap) — 동적으로 할당하는 메모리</h3>
      <p>
        C의 <C>malloc()</C>으로 요청하는 메모리가 여기서 옵니다.
        <KeyTerm term="동적 할당(Dynamic Allocation): 프로그램이 실행되는 도중에 필요한 만큼 메모리를 요청하는 방법입니다. 얼마나 필요한지 컴파일 시점에 모를 때 사용합니다. malloc()이 이 방법입니다.">
          {" 힙 "}
        </KeyTerm>
        은 낮은 주소에서 높은 주소 방향으로 자랍니다. 직접 해제(<C>free()</C>)하지 않으면
        {" "}
        <KeyTerm term="메모리 누수(Memory Leak): 동적으로 할당한 메모리를 free()로 해제하지 않아 프로그램이 끝날 때까지 메모리가 계속 낭비되는 현상입니다. 장시간 실행되는 서버 프로그램에서 특히 치명적입니다.">
          메모리 누수(Memory Leak)
        </KeyTerm>
        가 발생합니다. 리버싱에서
        {" "}
        <KeyTerm term="힙 취약점(Heap Exploitation): 힙 영역의 버그(이중 해제·버퍼 오버플로우 등)를 이용해 임의 코드 실행이나 권한 상승을 노리는 공격 기법입니다.">
          힙 취약점(Heap Exploitation)
        </KeyTerm>
        이 중요한 이유입니다.
      </p>

      <h3>스택(Stack) — 함수가 쓰는 임시 공간</h3>
      <p>
        가장 중요합니다. 함수를 호출할 때마다 스택에 새 공간(스택 프레임)이 생기고,
        함수가 끝나면 사라집니다. <strong>높은 주소에서 낮은 주소 방향으로 자랍니다.</strong>{" "}
        즉, <C>push</C>하면 <C>rsp</C>(스택 포인터)가 감소합니다.
        이 역방향 성장이 버퍼 오버플로우 공격의 핵심 요소입니다.
      </p>

      <Callout type="tip" title="✅ 핵심 암기">
        <p>
          스택은 <strong>위에서 아래로</strong> 자랍니다 (주소 감소).
          힙은 <strong>아래에서 위로</strong> 자랍니다 (주소 증가).
          <C>push rax</C>는 rsp를 8 감소시키고 rax 값을 씁니다.
        </p>
      </Callout>

      <h2>엔디안(Endianness) — 바이트 저장 순서</h2>

      <DefBox term="리틀 엔디안" en="Little Endian">
        <p>
          x86 / x86-64가 사용하는 방식입니다. 숫자를 메모리에 저장할 때
          <strong> 작은(낮은) 바이트가 낮은 주소</strong>에 먼저 옵니다.
          예를 들어 <C>0x12345678</C>이라는 4바이트 값은 메모리에
          <C>78 56 34 12</C> 순서로 저장됩니다.
          “리틀”은 “작은 쪽(낮은 바이트)이 먼저”라는 의미입니다.
        </p>
      </DefBox>

      <p>같은 값 <C>0x12345678</C>을 두 방식으로 저장하면 다음과 같이 다릅니다.</p>

      <div className="endian-compare">
        <div className="endian-col">
          <div className="endian-col-head">
            <span>리틀 엔디안 (x86)</span><span className="badge">우리 PC</span>
          </div>
          <div className="endian-col-body">
            <div><span className="addr">0x100:</span> <span className="byte">0x78</span> ← LSB</div>
            <div><span className="addr">0x101:</span> <span className="byte">0x56</span></div>
            <div><span className="addr">0x102:</span> <span className="byte">0x34</span></div>
            <div><span className="addr">0x103:</span> <span className="byte head">0x12</span></div>
          </div>
        </div>
        <div className="endian-col">
          <div className="endian-col-head">
            <span>빅 엔디안 (네트워크)</span><span className="badge">TCP/IP</span>
          </div>
          <div className="endian-col-body">
            <div><span className="addr">0x100:</span> <span className="byte head">0x12</span> ← MSB</div>
            <div><span className="addr">0x101:</span> <span className="byte">0x34</span></div>
            <div><span className="addr">0x102:</span> <span className="byte">0x56</span></div>
            <div><span className="addr">0x103:</span> <span className="byte">0x78</span></div>
          </div>
        </div>
      </div>

      <Callout type="warn" title="⚠️ 리버싱에서 중요">
        <p>
          {" "}
          <KeyTerm term="Ghidra: NSA가 만든 무료 역공학 도구. 바이너리를 어셈블리/유사 C 코드로 보여줍니다.">
            Ghidra
          </KeyTerm>
          나
          {" "}
          <KeyTerm term="xxd: 파일이나 메모리를 16진수로 보여주는 Linux 명령줄 도구입니다. 예: xxd program.exe 를 실행하면 바이트를 16진수로 나열해서 보여줍니다.">
            xxd(헥스 덤프 도구)
          </KeyTerm>
          로 바이너리를 볼 때 바이트가 거꾸로 보일 수 있습니다.
          x86은 리틀 엔디안이므로 4바이트 이상의 값을 읽을 때는
          <strong> 항상 뒤집어서 해석</strong>하세요.
        </p>
      </Callout>

      <Callout type="info" title="왜 두 가지 방식이 공존할까">
        <p>
          리틀 엔디안은 <strong>같은 주소에서 더 작은 크기로 읽기 쉽다</strong>는 장점이 있습니다
          (4바이트 정수의 하위 1바이트를 그대로 8비트로 읽으면 됨).
          빅 엔디안은 <strong>사람이 16진수로 출력할 때 자연스럽게 읽힌다</strong>는 장점이 있어
          네트워크 프로토콜(TCP/IP)이 사용하는 표준이 되었습니다. 그래서 “네트워크 바이트 오더”라는 별명이 있습니다.
        </p>
      </Callout>

      <Summary items={[
        "메모리는 바이트 단위로 주소가 매겨지며, 포인터는 그 주소를 담는 변수다.",
        "프로세스 메모리는 위에서부터 Stack · (빈 공간) · Heap · BSS · Data · Text로 구분된다.",
        "스택은 높은 주소→낮은 주소로 자라고(push 시 rsp 감소), 힙은 그 반대다.",
        "Data는 초기화된 전역변수, BSS는 0으로 초기화될 전역변수 — 실행 파일에는 BSS의 0 바이트가 들어있지 않다.",
        "x86은 리틀 엔디안 — 0x12345678은 메모리에 78 56 34 12 순서로 저장된다.",
      ]} />
    </article>
  );
}

window.P1C3 = P1C3;
