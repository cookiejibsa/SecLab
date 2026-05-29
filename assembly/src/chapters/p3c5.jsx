// Part 3 · 3.5 시스템 콜 (System Call)
function P3C5() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 3 · Chapter 3.5"
        title="시스템 콜 (System Call)"
        subtitle="유저 프로그램이 ‘커널에게 부탁’하는 유일한 공식 통로. printf 한 줄에서 ROP 익스플로잇까지, 모든 ‘바깥 세계와의 접촉’은 결국 이 한 줄짜리 명령 — syscall —을 거칩니다."
      />

      <p>
        1.5에서 우리는 OS가 <em>“커널과 유저 공간을 갈라놓는 관리자”</em>라고 했고, 3.1~3.4까지는
        ‘유저 공간 안에서’ 함수가 어떻게 호출되고 데이터가 어떻게 움직이는지를 봤습니다.
        그런데 진짜 프로그램은 결국 <strong>바깥 세계</strong>와 통해야 합니다 — 파일을 읽고, 화면에 출력하고, 메모리를 할당하고, 종료하고.
        그 모든 일은 유저 공간만의 힘으로는 불가능합니다. <em>커널에게 “이거 해 주세요”라고 부탁해야</em> 가능하죠.
        그 부탁의 공식 창구가 바로 <strong>시스템 콜</strong>이고, x86-64 Linux에선 단 한 줄짜리 명령어 <C>syscall</C>로 이루어집니다.
      </p>

      <h2>시스템 콜이란? — ‘유저 ↔ 커널’ 사이의 유일한 문</h2>

      <DefBox term="시스템 콜" en="System Call · syscall">
        <p>
          유저 공간에서 실행되던 프로그램이 <strong>커널 공간으로 진입해 OS 서비스를 요청</strong>하는 메커니즘입니다.
          파일 입출력, 프로세스 생성, 메모리 할당, 네트워크 통신처럼 <em>하드웨어를 직접 만지거나 보호된 자원에 손대는 일</em>은
          모두 시스템 콜을 통해서만 일어납니다.
        </p>
        <p>
          x86-64 Linux에선 <C>syscall</C> 명령 한 줄이 CPU를 <strong>유저 모드(ring 3) → 커널 모드(ring 0)</strong>로 전환시키고,
          커널이 일을 처리한 뒤 다시 유저 모드로 돌려놓습니다.
        </p>
      </DefBox>

      <FlowDiagram nodes={[
        { label: "유저 코드", val: "printf(...)" },
        { label: "glibc 래퍼", val: "write(...)" },
        { label: "syscall", val: "→ 커널 진입" },
        { label: "커널", val: "실제 출력", highlight: true },
        { label: "복귀", val: "→ 유저 모드" },
      ]} />

      <Callout type="info" title="‘ring 0’과 ‘ring 3’이라는 단어">
        <p>
          x86은 보호 등급을 ring 0(가장 강함)에서 ring 3(가장 약함)까지 4단계로 나눕니다.
          현실에선 OS가 두 단계만 씁니다 — <strong>커널 = ring 0, 유저 프로그램 = ring 3</strong>.
          ring 3에선 메모리의 어떤 페이지를 못 만지고, 어떤 명령(예: <C>hlt</C>)도 못 쓰죠.
          <C>syscall</C>은 이 ‘벽’을 안전하게 넘어가는 <em>지정된 통로</em>입니다.
        </p>
      </Callout>

      <h2>시스템 콜 규약 — 함수 호출 규약과 ‘닮았지만 다른 한 글자’</h2>

      <p>
        3.1에서 본 System V ABI의 함수 호출 규약(<C>rdi, rsi, rdx, rcx, r8, r9</C>)을 떠올려보세요.
        시스템 콜도 비슷합니다. 다만 <strong>한 자리만 다릅니다</strong> — 4번째 인수가 <C>rcx</C>가 아니라 <C>r10</C>입니다.
        이 한 글자 차이가 손코딩에서 가장 잘 틀리는 부분입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>역할</th><th>레지스터</th><th>함수 호출과의 차이</th></tr>
          </thead>
          <tbody>
            <tr><td>시스템 콜 번호</td><td className="mono">rax</td><td>어떤 기능을 쓸지 (예: write=1, exit=60)</td></tr>
            <tr><td>1번째 인수</td><td className="mono">rdi</td><td>같음</td></tr>
            <tr><td>2번째 인수</td><td className="mono">rsi</td><td>같음</td></tr>
            <tr><td>3번째 인수</td><td className="mono">rdx</td><td>같음</td></tr>
            <tr><td>4번째 인수</td><td className="mono">r10</td><td><strong>함수는 rcx — 시스템 콜만 r10!</strong></td></tr>
            <tr><td>5번째 인수</td><td className="mono">r8</td><td>같음</td></tr>
            <tr><td>6번째 인수</td><td className="mono">r9</td><td>같음</td></tr>
            <tr><td>리턴값</td><td className="mono">rax</td><td>음수면 <C>-errno</C> (오류 코드)</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="왜 rcx만 r10으로 ‘비켜난’ 걸까?">
        <p>
          <C>syscall</C> 명령어는 실행되는 순간 <strong>다음 명령어 주소를 <C>rcx</C>에 자동으로 저장</strong>합니다 (커널이 끝나면 그리로 돌아갈 자리니까요).
          그래서 <C>rcx</C>는 syscall 직후 망가집니다. 만약 4번째 인수도 <C>rcx</C>로 약속했다면 — 호출하자마자 그 값이 날아가버려 의미가 없죠.
          그래서 인텔/리눅스가 4번째 인수만 <C>r10</C>으로 옮긴 것입니다. 같은 이유로 <C>r11</C>도 망가집니다 (RFLAGS 백업용).
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ syscall이 망가뜨리는 레지스터 — 손코딩 시 주의">
        <p>
          <C>syscall</C>은 <C>rax</C>(리턴값) · <strong><C>rcx</C></strong>(저장된 rip) · <strong><C>r11</C></strong>(저장된 RFLAGS) — 이 셋을 항상 변경합니다.
          나머지 레지스터는 보존됩니다. 그래서 <em>syscall 직전에 <C>rcx</C>나 <C>r11</C>에 뭔가 들어 있다면 잃을 각오를 해야</em> 합니다.
          반대로 라이브러리 <C>write()</C>를 호출하면(=일반 함수 호출), 함수 호출 규약에 따라 더 많은 레지스터(rdi·rsi 등 caller-saved 전체)가 망가질 수 있습니다.
        </p>
      </Callout>

      <h2>주요 시스템 콜 — 외울 만한 한 줌</h2>

      <p>
        Linux x86-64엔 시스템 콜이 약 350개 있지만, 실전에서 직접 만나는 건 대부분 아래의 한 줌입니다.
        번호는 <C>/usr/include/asm/unistd_64.h</C> 또는 <C>man syscalls</C>에서 확인할 수 있습니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>번호</th><th>이름</th><th>기능</th><th>대응 C 함수</th></tr>
          </thead>
          <tbody>
            <tr><td>0</td>  <td className="mono">read</td>   <td>파일/소켓에서 읽기</td><td className="mono">read(fd, buf, n)</td></tr>
            <tr><td>1</td>  <td className="mono">write</td>  <td>파일/소켓에 쓰기</td>  <td className="mono">write(fd, buf, n)</td></tr>
            <tr><td>2</td>  <td className="mono">open</td>   <td>파일 열기 (구버전)</td><td className="mono">open(path, flags)</td></tr>
            <tr><td>3</td>  <td className="mono">close</td>  <td>파일 닫기</td>          <td className="mono">close(fd)</td></tr>
            <tr><td>9</td>  <td className="mono">mmap</td>   <td>
              <KeyTerm term="mmap(Memory Map): 파일이나 익명 메모리를 프로세스 주소 공간에 직접 매핑합니다. 파일을 읽지 않고 메모리처럼 접근하거나, 실행 가능한 메모리를 할당할 때 씁니다. ROP 익스플로잇에서 셸코드 실행용 RWX 메모리 확보에도 사용됩니다.">
                메모리 매핑
              </KeyTerm>
            </td>      <td className="mono">mmap(...)</td></tr>
            <tr><td>11</td> <td className="mono">munmap</td> <td>매핑 해제</td>          <td className="mono">munmap(...)</td></tr>
            <tr><td>57</td> <td className="mono">fork</td>   <td>
              <KeyTerm term="fork(): 현재 프로세스를 복제해 자식 프로세스를 만듭니다. 부모와 자식은 코드를 공유하지만 메모리는 독립됩니다. 부모에게는 자식 PID가, 자식에게는 0이 리턴됩니다.">
                프로세스 복제
              </KeyTerm>
            </td>            <td className="mono">fork()</td></tr>
            <tr><td>59</td> <td className="mono">execve</td> <td>
              <KeyTerm term="execve(): 현재 프로세스를 새 프로그램으로 ‘교체’해서 실행합니다. 익스플로잇의 최종 목표가 흔히 execve('/bin/sh', 0, 0)인 이유 — 셸을 얻는 가장 짧은 길입니다. 성공하면 리턴하지 않습니다.">
                프로그램 실행
              </KeyTerm>
            </td>            <td className="mono">execve(path, argv, envp)</td></tr>
            <tr><td>60</td> <td className="mono">exit</td>   <td>프로세스 종료</td>      <td className="mono">_exit(code)</td></tr>
            <tr><td>231</td><td className="mono">exit_group</td><td>모든 스레드 종료</td><td className="mono">exit(code)</td></tr>
            <tr><td>257</td><td className="mono">openat</td> <td>파일 열기 (현재)</td>   <td className="mono">openat(dirfd, path, flags)</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="시스템 콜 번호를 ‘외울’ 필요는 없다 — 단 몇 개만">
        <p>
          현장에서 진짜 외워야 하는 건 셋입니다 — <strong><C>write = 1</C></strong>, <strong><C>execve = 59</C></strong>, <strong><C>exit = 60</C></strong>.
          나머지는 cheat sheet나 <C>man 2 <em>name</em></C>으로 찾으면 충분합니다. 익스플로잇 쪽에서 자주 더 나오는 건 <C>mmap=9</C>, <C>mprotect=10</C> 정도.
        </p>
      </Callout>

      <h2>Hello, World — 순수 어셈블리</h2>

      <p>
        C 라이브러리 없이, <C>libc</C>도 안 거치고 <C>syscall</C>만으로 동작하는 가장 짧은 프로그램입니다.
        <C>write</C>와 <C>exit</C> 두 번의 시스템 콜이 전부입니다.
      </p>

      <CodeBlock lang="asm" filename="hello.asm — NASM 문법">{`; hello.asm — NASM, Linux x86-64
; Hello World를 syscall만으로 출력하고 종료한다.

section .data
    msg db  "Hello, World!", 0x0a   ; 문자열 + '\\n' (0x0a)
    len equ $ - msg                 ; $ = 현재 위치, len = 14

section .text
    global _start                   ; 진입점 (main 대신 _start)

_start:
    ; write(1, msg, len)
    mov  rax, 1                     ; syscall 번호 = 1 (write)
    mov  rdi, 1                     ; fd = 1 (stdout)
    mov  rsi, msg                   ; 버퍼 주소
    mov  rdx, len                   ; 바이트 수
    syscall

    ; exit(0)
    mov  rax, 60                    ; syscall 번호 = 60 (exit)
    xor  edi, edi                   ; 종료 코드 = 0
    syscall`}</CodeBlock>

      <Callout type="note" title="📌 fd(File Descriptor)란?">
        <p>
          <strong>fd (File Descriptor, 파일 서술자)</strong>는 열린 파일·소켓·파이프를 가리키는 <em>작은 정수</em>입니다.
          리눅스에선 모든 것이 fd로 다뤄지며, 기본 3개는 자동 열려 있습니다 —
          <C>0 = stdin</C>(표준 입력), <C>1 = stdout</C>(표준 출력), <C>2 = stderr</C>(표준 에러).
          <C>write(1, msg, len)</C>은 “화면에 출력하라”는 뜻이 됩니다.
        </p>
      </Callout>

      <h3>컴파일 · 실행</h3>

      <CodeBlock lang="text" filename="bash">{`nasm -f elf64 hello.asm -o hello.o
#  ↑ 어셈블러. -f elf64 = 64비트 Linux 오브젝트 형식

ld hello.o -o hello
#  ↑ 링커. .o 파일을 실행 가능한 ELF로 변환

./hello
# → Hello, World!`}</CodeBlock>

      <DefBox term="링킹 (Linking)">
        <p>
          컴파일된{" "}
          <KeyTerm term="오브젝트 파일(.o): 소스 하나를 컴파일한 결과. 기계어 코드는 있지만 ‘다른 파일의 함수를 어디서 찾을지’가 빈칸으로 남아 있어 아직 실행 불가능합니다.">
            오브젝트 파일(.o)
          </KeyTerm>
          {" "}여러 개와{" "}
          <KeyTerm term="라이브러리(Library): 자주 쓰는 함수들을 묶은 파일. 정적 라이브러리(.a)는 실행 파일에 통째로 합쳐지고, 동적 라이브러리(.so)는 실행 시 OS가 메모리에 로드합니다. libc(예: libc.so.6)가 대표적입니다.">
            라이브러리
          </KeyTerm>
          를 합쳐 <strong>실행 가능한 단일 파일(ELF)</strong>로 만드는 과정입니다.
          빈칸으로 남아 있던 ‘외부 함수의 주소’가 이때 채워집니다.
          리눅스에선 <C>ld</C>가 그 일을 하고, <C>ldd ./binary</C>로 어떤 동적 라이브러리에 의존하는지 볼 수 있습니다.
        </p>
      </DefBox>

      <Callout type="info" title="왜 main이 아니라 _start인가?">
        <p>
          <C>main()</C>은 C 표준 라이브러리(<C>libc</C>)의 일부일 뿐입니다 — 진짜 시작점은 <C>_start</C>고,
          libc가 그 안에서 환경 변수·argc/argv를 준비한 뒤 <em>마지막에 <C>main()</C>을 호출</em>하는 것이죠.
          libc 없이 <C>ld</C>만으로 링크하면 그 ‘준비 과정’이 통째로 빠지므로 직접 <C>_start</C>를 정의해야 합니다.
        </p>
      </Callout>

      <h2>printf의 진짜 모습 — “함수 안의 함수 안의 syscall”</h2>

      <p>
        C에서 <C>printf("Hello\n")</C> 한 줄이 실제로 어떤 길을 거쳐 화면에 닿는지 풀어보면 시스템 콜의 위치가 명확해집니다.
        <strong>‘유저 공간의 라이브러리 함수’</strong>와 <strong>‘커널의 시스템 콜’</strong>은 다른 층입니다 — 후자가 항상 더 깊습니다.
      </p>

      <FlowDiagram nodes={[
        { label: "유저 코드", val: "printf" },
        { label: "libc 1단", val: "포맷팅" },
        { label: "libc 2단", val: "write 래퍼" },
        { label: "syscall", val: "rax=1", highlight: true },
        { label: "커널", val: "tty/파일 출력" },
      ]} />

      <Callout type="tip" title="‘printf가 system call이다’는 흔한 오해">
        <p>
          엄밀히 <C>printf</C>는 시스템 콜이 <strong>아닙니다</strong>. 그저 <em>포맷팅을 한 뒤 결국 <C>write(1, ...)</C>을 호출하는</em> libc 함수일 뿐이죠.
          시스템 콜은 그 안쪽의 <C>write</C> 래퍼가 <C>syscall</C> 명령어를 실행하는 시점에 일어납니다.
          <C>strace ./your_prog</C>를 돌려보면 <em>“정말 어떤 syscall이 일어났는지”</em>가 한 줄씩 다 보입니다 — 시스템 콜 학습의 최고의 도구입니다.
        </p>
      </Callout>

      <h2>리턴값과 오류 — <C>errno</C>의 비밀</h2>

      <p>
        C에서 <C>read()</C>가 실패하면 <C>-1</C>을 리턴하고 <C>errno</C> 전역 변수에 오류 코드가 담깁니다.
        그런데 시스템 콜 자체엔 <C>errno</C> 같은 게 없습니다. 어떻게 변환되는 걸까요?
      </p>

      <KeyPoint n={1}>
        <strong>커널의 약속</strong> — syscall 결과로 <C>rax</C>에 <em>음수</em>(엄밀히는 <C>-4096</C>~<C>-1</C> 구간)가 들어 있으면 그 절댓값이 errno입니다.
        성공하면 0 또는 양수가 들어옵니다.
      </KeyPoint>

      <KeyPoint n={2}>
        <strong>libc 래퍼의 변환</strong> — libc는 syscall 직후 <C>rax &lt; 0</C>이면 <C>errno = -rax</C>를 세팅하고 <C>-1</C>을 리턴합니다.
        그래서 C 입장에선 <em>“성공하면 결과값, 실패하면 -1 + errno”</em>의 모습이 됩니다.
      </KeyPoint>

      <Callout type="warn" title="⚠️ 순수 어셈블리로 syscall을 쓸 땐 errno가 없다">
        <p>
          libc 없이 직접 <C>syscall</C>을 호출하면 <C>rax</C>의 음수값을 <em>본인이</em> 검사해야 합니다.
          그래서 <C>read</C> 실패 같은 케이스를 무시하면 “읽지도 못한 버퍼”를 진짜인 양 처리해 버그가 생기곤 합니다.
          가장 흔한 검사 패턴은 <C>{`cmp rax, 0; js .error`}</C> — “음수면(<C>js</C>) 오류 처리로 점프”.
        </p>
      </Callout>

      <h2>시스템 콜은 비싸다 — vDSO라는 우회로</h2>

      <p>
        <C>syscall</C> 한 번은 ‘유저↔커널’ 컨텍스트 전환을 포함하므로 일반 함수 호출보다 <strong>수십~수백 배 비쌉니다</strong>.
        그래서 리눅스는 가장 빈번한 몇몇 호출(<C>gettimeofday</C>, <C>clock_gettime</C>, <C>getcpu</C> 등)에 대해 우회로를 만들어 뒀습니다 —
        <strong>vDSO (virtual Dynamic Shared Object)</strong>. 커널이 일부 코드를 유저 공간에 미리 매핑해 둬서,
        <C>syscall</C> 없이 <em>그 함수를 그냥 호출</em>하면 됩니다.
      </p>

      <Callout type="info" title="‘시간 함수가 왜 이렇게 빠르지?’의 답">
        <p>
          <C>clock_gettime</C>은 1초에 수백만 번 호출되어도 거의 공짜처럼 동작합니다 — 진짜 syscall이 아니라 vDSO를 통한 일반 함수 호출이기 때문.
          <C>cat /proc/self/maps</C>에서 <C>[vdso]</C> 영역을 보면 그 정체를 직접 확인할 수 있습니다.
        </p>
      </Callout>

      <h2>보안 관점 — syscall이 곧 ‘공격의 최종 목표’</h2>

      <p>
        취약점 익스플로잇의 최종 목표는 거의 항상 <strong>특정 시스템 콜을 공격자가 원하는 인수로 호출하기</strong>입니다.
        가장 유명한 한 줄은 — <C>execve("/bin/sh", 0, 0)</C>. 이게 성공하면 공격자는 셸을 얻습니다.
        그래서 4.4 리버싱, 4.5 보안 챕터의 핵심 도구가 바로 이 챕터의 syscall 규약입니다.
      </p>

      <Compare>
        <CodeBlock lang="asm" filename="ROP 가젯의 ‘최종 페이로드’">{`; execve("/bin/sh", NULL, NULL)
mov  rax, 59           ; syscall = execve
lea  rdi, [rel sh]     ; arg1: "/bin/sh"
xor  esi, esi          ; arg2: NULL (argv)
xor  edx, edx          ; arg3: NULL (envp)
syscall

sh: db "/bin/sh", 0`}</CodeBlock>
        <CodeBlock lang="asm" filename="방어 — seccomp 필터">{`; 커널 측 (개념적)
; 프로세스가 시작 직후 syscall 화이트리스트 등록:
;   read, write, exit  ← 허용
;   execve             ← 차단 (SIGSYS)
;
; 이러면 위 페이로드는 syscall 진입 직후 즉시 죽는다.
; Chrome 렌더러, Docker 컨테이너 등이 이렇게 막는다.`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="🔴 ‘syscall 한 줄을 누가 어떻게 호출할 수 있나’의 싸움">
        <p>
          공격자는 ROP/JOP로 <em>이미 메모리에 존재하는 syscall 명령을 호출하는 코드 조각</em>을 모아 페이로드를 만듭니다.
          수비자는 <strong>seccomp</strong>·<strong>Landlock</strong>·<strong>SELinux</strong> 같은 메커니즘으로
          “이 프로세스는 어떤 syscall을 어떤 인수로만 부를 수 있다”라는 화이트리스트를 강제합니다.
          4.5에서 이 두 진영의 무기를 자세히 다룹니다.
        </p>
      </Callout>

      <h2>유용한 도구 한 줌</h2>

      <Callout type="tip" title="✅ strace — 살아있는 시스템 콜 로그">
        <p>
          <C>strace ./your_program</C> 한 줄로 <em>실행 중 발생하는 모든 syscall</em>을 함수 호출처럼 보여줍니다.
          “이 프로그램이 어떤 파일을 여나?”, “왜 멈춰 있나?”, “어디서 SIGSEGV가 나나?” — 가장 빠르게 답을 얻는 방법입니다.
          시스템 콜을 배우는 사람에게 가장 좋은 학습 도구이기도 합니다.
        </p>
      </Callout>

      <Callout type="tip" title="✅ syscall 번호 찾기">
        <p>
          <C>{`grep '__NR_write' /usr/include/asm/unistd_64.h`}</C>
          {" "}또는 <C>man 2 write</C>의 “SYNOPSIS” 절을 보면 됩니다.
          웹에서는 <em>“Linux x86_64 syscall table”</em>로 검색하면 한 페이지짜리 cheat sheet가 잔뜩 나옵니다.
        </p>
      </Callout>

      <Summary items={[
        "시스템 콜은 ‘유저 ↔ 커널’의 유일한 공식 통로. x86-64 Linux에선 syscall 명령 한 줄.",
        "syscall 규약: rax = 번호, 인수는 rdi · rsi · rdx · r10 · r8 · r9. 함수 호출과 다른 곳은 단 한 자리 — 4번째가 rcx가 아닌 r10!",
        "이유: syscall 명령 자체가 rcx(=리턴 주소)와 r11(=RFLAGS 백업)을 망가뜨리기 때문.",
        "외울 만한 번호 세 개: write=1, execve=59, exit=60. 나머지는 man/cheat sheet.",
        "printf는 syscall이 아니다 — libc가 포맷팅 후 write 래퍼를 통해 syscall을 호출하는 것. strace로 정체 확인.",
        "errno의 비밀: 커널은 rax에 음수(-errno)로 오류를 리턴. libc 래퍼가 그걸 errno에 옮기고 -1을 리턴.",
        "syscall은 비싸다 — gettimeofday/clock_gettime 같은 핫한 호출은 vDSO로 우회.",
        "보안의 최종 무대: execve('/bin/sh',0,0)가 공격자의 목표, seccomp/Landlock이 수비자의 무기. 4.5의 핵심.",
        "도구: strace는 학습/디버깅 모두 최고. ldd로 동적 라이브러리 의존도, /proc/self/maps로 vDSO 위치 확인.",
      ]} />
    </article>
  );
}

window.P3C5 = P3C5;
