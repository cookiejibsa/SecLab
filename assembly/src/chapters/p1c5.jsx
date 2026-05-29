// Part 1 · 1.5 운영체제 기초
function P1C5() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 1 · Chapter 1.5"
        title="운영체제 기초"
        subtitle="어셈블리로 시스템 콜을 하거나, 리버싱으로 프로그램을 분석할 때 운영체제가 하는 역할을 알아야 합니다."
      />

      <p data-bridge="cc-intro-bridge-p1c5">
        지금까지의 그림에서 빠진 게 하나 있습니다 — 그 위에서 일하는 <strong>‘관리자’</strong>.
        프로그램은 혼자 실행되지 않습니다. 운영체제가 메모리를 나눠주고, CPU 시간을 쪼개주고,
        시스템 콜로 하드웨어 접근을 중개하죠. 어셈블리에서 <C>syscall</C> 한 줄을 쓰려면
        이 관리자가 누구이고 무엇을 하는지 알아야 합니다.
        1장의 마지막 — 그리고 3.5 시스템 콜의 사전 준비입니다.
      </p>

      <h2>커널(Kernel)과 유저 공간(User Space)</h2>

      <DefBox term="커널" en="Kernel">
        <p>
          운영체제의 핵심입니다. 하드웨어(메모리,
          {" "}
          <KeyTerm term="파일시스템(File System): 하드디스크에 파일을 어떻게 저장하고 찾는지 정하는 방식입니다. Windows의 NTFS, Linux의 ext4가 대표적입니다.">
            파일시스템
          </KeyTerm>
          , 네트워크)를 직접 관리하며,
          {" "}
          <KeyTerm term="특권 명령어(Privileged Instruction): 일반 프로그램이 실행할 수 없고 커널만 실행할 수 있는 위험한 명령어입니다. 메모리 접근 권한 설정·하드웨어 직접 제어 등이 여기에 해당합니다.">
            특권 명령어
          </KeyTerm>
          를 실행할 수 있습니다. “
          <KeyTerm term="링 0(Ring 0): x86 CPU가 지원하는 권한 레벨 중 가장 높은 단계입니다. 링 0~3이 있으며, 숫자가 낮을수록 권한이 높습니다. 링 0 = 커널 모드(모든 명령어 가능), 링 3 = 유저 모드(제한됨).">
            링 0(Ring 0)
          </KeyTerm>
          ”이라는 최고 권한 모드에서 실행됩니다.
        </p>
      </DefBox>

      <DefBox term="유저 공간" en="User Space">
        <p>
          우리가 만드는 프로그램이 실행되는 공간입니다. 직접 하드웨어를 건드릴 수 없고,
          커널에 요청(시스템 콜)을 해야 합니다. “링 3(Ring 3)”에서 실행됩니다.
          <strong> 이 구분이 보안의 핵심입니다.</strong>
        </p>
      </DefBox>

      <FlowDiagram nodes={[
        { label: "Ring 3", val: "User Space" },
        { label: "syscall", val: "경계" },
        { label: "Ring 0", val: "Kernel", highlight: true },
        { label: "직접 접근", val: "Hardware" },
      ]} />

      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: -12, marginBottom: 24 }}>
        유저 프로그램은 절대 하드웨어를 직접 만질 수 없습니다.
        반드시 <C>syscall</C>이라는 “문”을 통과해 커널에게 부탁해야 합니다.
      </p>

      <h2>시스템 콜(System Call)</h2>

      <p>
        유저 프로그램이 커널에 서비스를 요청하는 방법입니다.
        C의 <C>printf()</C>는 내부적으로 <C>write</C> 시스템 콜을 씁니다.
        어셈블리에서는 <C>syscall</C> 명령어로 직접 호출합니다.
        자세한 사용법은 3.5에서 다룹니다.
      </p>

      <CodeBlock lang="asm" filename="hello.asm — 가장 간단한 시스템 콜">{`; Linux x86-64: write(1, "hi\\n", 3)
mov rax, 1          ; syscall 번호: 1 = sys_write
mov rdi, 1          ; 첫 번째 인자: fd = 1 (stdout)
mov rsi, msg        ; 두 번째 인자: 버퍼 주소
mov rdx, 3          ; 세 번째 인자: 길이
syscall             ; 커널로 진입 — 여기서 Ring 3 → Ring 0`}</CodeBlock>

      <Callout type="note" title="📌 왜 시스템 콜이 필요한가?">
        <p>
          만약 모든 프로그램이 하드웨어를 마음대로 건드릴 수 있다면?
          악성 프로그램이 다른 프로그램의 메모리를 훔쳐보거나, 디스크를 마음대로 지울 수 있습니다.
          커널이 문지기 역할을 해서 “파일을 읽고 싶다면 나(커널)한테 요청해라”라고 통제합니다.
        </p>
      </Callout>

      <Callout type="info" title="syscall은 비싸다">
        <p>
          <C>syscall</C> 한 번의 비용은 보통 수백~수천 사이클입니다 (CPU 모드 전환·캐시 무효화 등).
          일반 명령어가 1~수 사이클이라는 점을 생각하면 굉장히 비쌉니다.
          그래서 표준 라이브러리는 <C>printf</C> 같은 함수가 내부적으로
          <strong> 버퍼를 모아뒀다가 한 번에 write</strong>하는 식으로 syscall 횟수를 줄입니다.
        </p>
      </Callout>

      <h2>프로세스와 쓰레드</h2>

      <DefBox term="프로세스" en="Process">
        <p>
          실행 중인 프로그램의
          {" "}
          <KeyTerm term="인스턴스(Instance): ‘실체’·‘사례’라는 뜻입니다. 같은 프로그램을 두 번 실행하면 두 개의 ‘인스턴스’(독립된 실행 복사본)가 생깁니다. 붕어빵 틀(프로그램)로 구운 붕어빵(인스턴스)에 비유하면 이해하기 쉽습니다.">
            인스턴스
          </KeyTerm>
          입니다. 자체 메모리 공간(주소 공간)을 가집니다.
          다른 프로세스의 메모리를 함부로 읽을 수 없습니다 (OS가 가상 메모리로 분리).
        </p>
      </DefBox>

      <DefBox term="쓰레드" en="Thread">
        <p>
          프로세스 안에서 동시에 실행되는 여러 실행 흐름 중 하나입니다.
          같은 프로세스 내 쓰레드들은 <strong>메모리를 공유</strong>합니다.
          예: 웹 브라우저에서 동영상 재생 쓰레드, 사용자 입력 처리 쓰레드가 동시에 돌아갑니다.
          어셈블리에서는 <strong>각 쓰레드마다 고유한 스택과 레지스터 세트</strong>가 있습니다.
        </p>
      </DefBox>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>구분</th><th>프로세스</th><th>쓰레드</th></tr>
          </thead>
          <tbody>
            <tr><td>메모리 공간</td><td>독립</td><td>같은 프로세스 내에서 <strong>공유</strong></td></tr>
            <tr><td>스택</td><td>각자</td><td>각자 (쓰레드별로 별도)</td></tr>
            <tr><td>전환 비용</td><td>비쌈 (MMU 갱신)</td><td>저렴</td></tr>
            <tr><td>통신</td><td>IPC, 파이프, 소켓</td><td>전역 변수 직접 공유</td></tr>
          </tbody>
        </table>
      </div>

      <h2>가상 메모리 — 모든 프로세스가 “혼자 사는 것처럼” 보이게 하는 마술</h2>

      <DefBox term="가상 메모리" en="Virtual Memory">
        <p>
          각 프로세스는 메모리 전체를 혼자 쓰는 것처럼 보이는 <em>가상 주소 공간</em>을 받습니다.
          실제 RAM 주소와의 변환은
          {" "}
          <KeyTerm term="MMU(Memory Management Unit, 메모리 관리 장치): CPU 안에 있는 하드웨어로, 프로그램이 쓰는 ‘가상 주소’를 실제 RAM의 ‘물리 주소’로 변환합니다. 덕분에 여러 프로그램이 서로 충돌 없이 메모리를 쓸 수 있습니다.">
            MMU(메모리 관리 장치)
          </KeyTerm>
          가 담당합니다. 그래서 다른 프로그램과 주소가 충돌하지 않습니다.
        </p>
      </DefBox>

      <FlowDiagram nodes={[
        { label: "Process A", val: "Virtual 0x400000" },
        { label: "MMU", val: "주소 변환", highlight: true },
        { label: "Physical RAM", val: "0x1A2B3000" },
      ]} />

      <p>
        프로세스 A의 <C>0x400000</C>과 프로세스 B의 <C>0x400000</C>은
        <strong> 같은 가상 주소이지만 전혀 다른 물리 RAM</strong>을 가리킵니다.
        디버거에서 보이는 모든 주소는 가상 주소입니다.
      </p>

      <Callout type="tip" title="✅ 리버싱에서 중요한 이유">
        <p>
          리버싱 도구(
          <KeyTerm term="GDB(GNU Debugger): Linux/macOS에서 가장 많이 쓰이는 무료 디버거입니다. 프로그램 실행을 중간에 멈추고, 레지스터/메모리 값을 확인하고, 한 줄씩 실행할 수 있습니다.">
            gdb
          </KeyTerm>
          ,
          {" "}
          <KeyTerm term="x64dbg: Windows용 무료 오픈소스 디버거입니다. 64비트/32비트 바이너리를 분석하는 데 사용합니다. GUI가 있어 GDB보다 직관적입니다.">
            x64dbg
          </KeyTerm>
          )로 프로세스를 분석할 때 보이는 주소들은 가상 주소입니다.
          {" "}
          <KeyTerm term="ASLR(Address Space Layout Randomization, 주소 공간 배치 난수화): 프로그램을 실행할 때마다 스택·힙·라이브러리 등의 주소를 무작위로 배치하는 보안 기법입니다. 공격자가 특정 주소를 미리 알 수 없게 해서 공격을 어렵게 만듭니다.">
            ASLR(주소 공간 배치 난수화)
          </KeyTerm>
          이 켜져 있으면 실행할 때마다 주소가 달라집니다. 이것도 보안 기법 중 하나입니다.
        </p>
      </Callout>

      <Summary items={[
        "운영체제는 커널(Ring 0, 특권 모드)과 유저 공간(Ring 3, 제한 모드)으로 나뉜다.",
        "유저 프로그램은 하드웨어를 직접 못 만지고, syscall로 커널에 요청해야 한다.",
        "syscall은 비싸므로 표준 라이브러리는 호출을 줄이려고 버퍼링을 한다 (printf 등).",
        "프로세스는 독립된 주소 공간, 쓰레드는 같은 프로세스 안에서 메모리를 공유한다 (스택은 별도).",
        "MMU가 가상 주소를 물리 주소로 변환 — 디버거에 보이는 주소는 모두 가상 주소다. ASLR이 켜지면 실행마다 달라진다.",
      ]} />
    </article>
  );
}

window.P1C5 = P1C5;
