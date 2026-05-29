// Part 4 · 4.5 보안 취약점과 보호 기법
function P4C5() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 4 · Chapter 4.5"
        title="보안 취약점과 보호 기법"
        subtitle="어셈블리를 배우는 가장 중요한 이유 중 하나. 취약점이 어셈블리 레벨에서 어떻게 ‘생겨나는지’와, 현대 OS·컴파일러·CPU가 그것을 어떻게 막는지를 — 공격과 방어의 시점을 번갈아 가며 정리합니다."
      />

      <p>
        지금까지 본 모든 챕터가 한 곳에 모이는 자리입니다. 스택 프레임(3.2), 함수 호출 규약(3.1), 시스템 콜(3.5), 그리고 4.1~4.4의 패턴 인식 — 이 모든 게
        결국 “바이너리의 제어 흐름을 누가 쥐고 있느냐”라는 한 가지 질문을 다룹니다. 이 챕터의 절반은 <strong>공격자의 시야</strong>, 절반은 <strong>수비자의 도구</strong>입니다.
      </p>

      <h2>버퍼란 무엇이고, 왜 ‘오버플로우’가 위험한가</h2>

      <DefBox term="버퍼" en="Buffer">
        <p>
          데이터를 임시로 담아 두는 메모리 공간입니다 — <C>char buf[64]</C>는 스택 위에 잡힌 64바이트짜리 버퍼.
          <strong>버퍼 오버플로우(Buffer Overflow)</strong>는 그 크기를 넘겨 데이터를 쓰는 행위로, 넘친 바이트들은 <em>스택 위 이웃들(saved rbp · 리턴 주소)</em>을 덮어씁니다.
          그 ‘이웃’이 누구냐에 따라 단순 충돌로 끝나기도 하고, 공격자에게 제어를 통째로 넘기기도 하죠.
        </p>
      </DefBox>

      <h2>① 스택 기반 BOF — 가장 고전적인 한 줄</h2>

      <p>
        스택에 잡힌 버퍼를 넘쳐 흐르게 해서 같은 프레임의 <strong>리턴 주소</strong>를 덮어쓰는 게 시작입니다.
        <C>ret</C>이 실행되는 순간 CPU는 ‘덮어쓴 그 값’으로 점프하므로, 공격자는 그 한 줄로 PC(<C>rip</C>)를 차지합니다.
      </p>

      <CodeBlock lang="c" filename="C — 취약 함수">{`void vulnerable() {
    char buf[64];      // 스택에 64바이트 버퍼
    gets(buf);         // ★ 입력 길이 제한이 전혀 없음
    // scanf("%s", buf), strcpy도 같은 카테고리
}`}</CodeBlock>

      <p style={{ marginTop: 22 }}>
        함수 진입 직후의 스택은 다음과 같이 생겼습니다. <C>gets</C>는 <C>buf</C>의 시작부터 끝없이 바이트를 받아 적기 때문에,
        72바이트(buf 64 + saved rbp 8)를 채운 뒤 이어지는 8바이트가 그대로 <strong>리턴 주소</strong>가 됩니다.
      </p>

      <MemDiagram rows={[
        { addr: "rbp + 8",  width: "100%", color: "oklch(0.6 0.18 30)",  tag: "★ 리턴 주소 — 공격 목표", label: "8 byte" },
        { addr: "rbp",      width: "100%", color: "oklch(0.55 0.04 90)", tag: "saved rbp",              label: "8 byte" },
        { addr: "rbp - 64", width: "100%", color: "oklch(0.55 0.1 240)", tag: "buf[64] — gets() 입력",   label: "64 byte" },
        { addr: "rsp",      width: "60%",  color: "oklch(0.7 0.03 90)",  tag: "…",                       label: "free" },
      ]} />

      <CodeBlock lang="text" filename="익스플로잇 — pwntools">{`# pwntools: Python 기반 CTF/익스플로잇 라이브러리
from pwn import *

p = process('./vulnerable')

# 72바이트 채우고, 이어서 원하는 주소 8바이트
payload  = b'A' * 72              # buf(64) + saved_rbp(8)
payload += p64(0x401234)          # 점프할 주소 (리틀엔디안)

p.sendline(payload)
p.interactive()                   # 셸 획득 후 상호작용`}</CodeBlock>

      <Callout type="note" title="📌 셸코드(Shellcode)란?">
        <p>
          <strong>셸코드</strong>는 ‘공격자가 실행하고 싶은 어셈블리’를 바이트열로 만든 것입니다. 이름처럼 보통 목표는 <C>/bin/sh</C> 셸 띄우기 —
          3.5에서 본 <C>execve("/bin/sh", 0, 0)</C> 페이로드가 대표 예. <em>스택이 실행 가능</em>하다면 버퍼에 셸코드를 넣고 <C>buf</C> 주소로 리턴하면 그만이었지만,
          오늘날엔 NX 보호로 그 자체가 어려워졌습니다 — 그래서 ROP가 등장하죠 (뒤에서).
        </p>
      </Callout>

      <h2>② 현대 바이너리의 5중 방어</h2>

      <p>
        지난 20년의 OS · 컴파일러 · CPU 진화는 거의 이 한 줄을 막기 위한 군비 경쟁이었습니다. 각 방어는 BOF의 ‘다음 단계’ 한 가지씩을 차단합니다 —
        모두 켜진 채로 컴파일된 현대 바이너리에선 단순한 BOF만으로는 거의 아무것도 못 합니다.
      </p>

      <div className="flag-grid">
        <div className="flag-card">
          <div className="flag-name">ASLR</div>
          <div className="flag-full">Address Space Layout Randomization</div>
          <div className="flag-desc">
            <KeyTerm term="ASLR(Address Space Layout Randomization): 실행할 때마다 스택, 힙, 라이브러리, mmap 영역의 베이스 주소를 무작위로 배치합니다. Linux: /proc/sys/kernel/randomize_va_space = 2 면 완전 활성화. 공격자가 ‘하드코딩한 주소’를 쓸 수 없게 만드는 첫 번째 방어선.">
              실행할 때마다 라이브러리·스택·힙의 베이스 주소를 무작위로
            </KeyTerm>
            . 하드코딩 주소가 통하지 않음.
          </div>
        </div>
        <div className="flag-card">
          <div className="flag-name">NX / DEP</div>
          <div className="flag-full">Non-Executable Stack / Data Execution Prevention</div>
          <div className="flag-desc">
            <KeyTerm term="NX bit / DEP: CPU의 페이지 테이블에 ‘이 메모리 영역은 실행 불가’ 표시를 켭니다. 스택/힙에 셸코드를 올려도 CPU가 그 페이지의 명령을 거부합니다. Windows 쪽 이름이 DEP(Data Execution Prevention).">
              스택·힙 페이지를 실행 불가로 표시
            </KeyTerm>
            . 셸코드 직접 실행이 막힘 → ROP로 우회 필요.
          </div>
        </div>
        <div className="flag-card">
          <div className="flag-name">Stack Canary</div>
          <div className="flag-full">스택 카나리 (Stack Guard)</div>
          <div className="flag-desc">
            <KeyTerm term="카나리(Canary): 광부들이 탄광에서 유독가스 탐지용으로 데려간 카나리아 새에서 유래. 리턴 주소 바로 앞에 랜덤한 8바이트를 심어두고, ret 직전에 그 값이 변조되지 않았는지 확인합니다. 변조되면 즉시 __stack_chk_fail로 프로그램 종료.">
              리턴 주소 앞에 랜덤 8바이트를 심고
            </KeyTerm>
            , ret 직전 검사. 변조 시 즉시 종료.
          </div>
        </div>
        <div className="flag-card">
          <div className="flag-name">PIE</div>
          <div className="flag-full">Position Independent Executable</div>
          <div className="flag-desc">
            <KeyTerm term="PIE: 실행 파일의 코드 영역까지 매 실행마다 랜덤 주소에 로드합니다. PIE가 꺼져 있으면 코드 베이스가 보통 0x400000으로 고정 — 공격자가 함수 주소를 추측할 수 있습니다. checksec에서 PIE enabled / No PIE로 표시.">
              실행 파일의 코드 영역도 랜덤 배치
            </KeyTerm>
            . ASLR과 합쳐져 코드 주소까지 매번 달라짐.
          </div>
        </div>
        <div className="flag-card">
          <div className="flag-name">RELRO</div>
          <div className="flag-full">Relocation Read-Only</div>
          <div className="flag-desc">
            <KeyTerm term="GOT(Global Offset Table): 동적 라이브러리 함수의 실제 주소를 담는 테이블. printf()를 부르면 GOT에서 진짜 주소를 꺼내 점프합니다. GOT가 쓰기 가능하면 ‘printf의 진짜 주소’를 system으로 바꿔치기하는 공격이 가능 — Full RELRO는 프로그램 시작 시 모든 심볼을 미리 해석하고 GOT를 읽기 전용으로 잠가 이걸 막습니다.">
              GOT 영역을 읽기 전용으로 잠금
            </KeyTerm>
            . Full RELRO면 GOT 덮어쓰기 공격 불가.
          </div>
        </div>
        <div className="flag-card">
          <div className="flag-name">CFI / CET</div>
          <div className="flag-full">Control Flow Integrity</div>
          <div className="flag-desc">
            <KeyTerm term="CFI(Control Flow Integrity) / Intel CET: 간접 호출·리턴이 ‘허용된 목적지’만 가도록 컴파일러나 CPU가 검사합니다. LLVM CFI는 컴파일 타임에 체크 코드를 삽입하고, Intel CET는 CPU 레벨에서 Shadow Stack과 IBT를 강제합니다. ROP/JOP를 직접 어렵게 만드는 신세대 방어.">
              간접 호출·리턴의 목적지가 ‘합법’인지 검사
            </KeyTerm>
            . ROP 자체를 어렵게 만드는 신세대 방어.
          </div>
        </div>
      </div>

      <h2>③ 스택 카나리의 진짜 모습</h2>

      <p>
        함수 프롤로그에 카나리 삽입 한 쌍, 에필로그 직전에 카나리 검사 한 쌍이 자동으로 들어갑니다. <C>fs:[0x28]</C>는 스레드 로컬 스토리지(TLS)에 저장된 ‘이 프로세스의 비밀 카나리 값’ —
        <strong>주소가 메모리에 떠다니지 않으므로 일반 BOF로는 못 훔칩니다</strong>.
      </p>

      <MemDiagram rows={[
        { addr: "rbp + 8",  width: "100%", color: "oklch(0.55 0.04 90)",  tag: "리턴 주소",                       label: "8 byte" },
        { addr: "rbp",      width: "100%", color: "oklch(0.55 0.04 90)",  tag: "saved rbp",                       label: "8 byte" },
        { addr: "rbp - 8",  width: "100%", color: "oklch(0.55 0.13 145)", tag: "★ 카나리 (랜덤, ret 직전 검사)",  label: "8 byte" },
        { addr: "rbp - 72", width: "100%", color: "oklch(0.55 0.1 240)",  tag: "buf[64]",                          label: "64 byte" },
      ]} />

      <CodeBlock lang="asm" filename="카나리 삽입/검사 패턴">{`vulnerable:
    ; ── 프롤로그 ──
    push rbp
    mov  rbp, rsp
    sub  rsp, 72                ; buf(64) + 카나리(8)

    ; ★ 카나리 심기
    mov  rax, fs:[0x28]         ; TLS의 비밀 카나리 값
    mov  [rbp - 8], rax         ; 스택에 저장
    xor  eax, eax

    ; ── 함수 본문 ──
    ; ... gets(buf) 등 ...

    ; ★ 카나리 검사
    mov  rdx, [rbp - 8]         ; 스택의 카나리
    xor  rdx, fs:[0x28]         ; 원본과 XOR
    jnz  __stack_chk_fail       ; 다르면 → 즉시 종료
    leave
    ret`}</CodeBlock>

      <Callout type="warn" title="⚠️ 카나리도 부서진다 — ‘유출’과 ‘브루트포스’">
        <p>
          ① <strong>포맷 스트링 취약점</strong>(<C>printf(user_input)</C> 같은 코드)으로 스택 메모리를 읽을 수 있으면 카나리가 평문으로 새어 나갑니다.
          ② <strong>포크 서버</strong>는 자식이 죽어도 부모는 살고, 카나리도 부모로부터 그대로 상속됩니다 — 한 바이트씩 추측해 가며 8바이트를 맞히는 브루트포스가 가능하죠.
          그래서 카나리는 ‘단독 방어’가 아니라 ASLR/NX/RELRO와 묶여 있어야 의미가 있습니다.
        </p>
      </Callout>

      <h2>④ ROP — NX 시대의 우회로</h2>

      <DefBox term="ROP" en="Return-Oriented Programming">
        <p>
          NX로 셸코드를 직접 실행할 수 없을 때, <strong>이미 메모리에 존재하는 짧은 코드 조각들</strong>을 이어 붙여 원하는 동작을 만들어내는 기법입니다.
          각 조각(<em>가젯, Gadget</em>)은 보통 <C>ret</C>으로 끝나는 1~5개 명령이고, 스택에 차곡차곡 쌓인 ‘가젯 주소 + 인자값’ 시퀀스를
          <C>ret</C>이 한 칸씩 꺼내며 실행해 나갑니다. 레고 블록을 쌓아 새 함수를 만드는 셈이죠.
        </p>
      </DefBox>

      <CodeBlock lang="asm" filename="ROP 가젯과 체인">{`; ── 바이너리에서 찾은 가젯들 ──
; 가젯 1: pop rdi; ret           (예: 0x401234)
;   → rdi(=1번째 인수)에 값 채우는 용도
pop  rdi
ret

; 가젯 2: ret                    (예: 0x401200)
;   → 스택 16바이트 정렬 보정용
ret

; 가젯 3: syscall; ret            (예: 0x401256)
syscall
ret

; ── 스택에 쌓을 ROP 체인 ──
; [덮어쓴 ret] 0x401234   → pop rdi; ret
; [+8]        &"/bin/sh"  → 이 값이 pop으로 rdi에 들어감
; [+16]       0x401200   → ret (정렬)
; [+24]       &system    → system("/bin/sh") 실행!`}</CodeBlock>

      <Callout type="note" title="📌 ROP 가젯을 찾는 도구">
        <p>
          가젯은 손으로 찾는 게 아니라 도구로 긁어옵니다 —{" "}
          <KeyTerm term="ROPgadget: 바이너리에서 ret으로 끝나는 코드 조각을 자동으로 모두 긁어내 보여주는 도구. pip install ROPgadget으로 설치. `ROPgadget --binary ./prog --rop` 또는 `--string '/bin/sh'`.">
            ROPgadget
          </KeyTerm>
          ,{" "}
          <KeyTerm term="ropper: ROPgadget과 같은 갈래의 가젯 검색 도구. UI가 좀 더 친화적이고 jop/sysrop 같은 변종도 잘 찾아줍니다. pip install ropper.">
            ropper
          </KeyTerm>
          가 표준.
        </p>
        <CodeBlock lang="text" filename="bash">{`ROPgadget --binary ./prog --rop
ROPgadget --binary ./prog --string "/bin/sh"
ropper --file ./prog --search "pop rdi"`}</CodeBlock>
      </Callout>

      <Callout type="info" title="‘ret2libc’ — ROP가 본격화되기 전의 친척">
        <p>
          NX가 처음 등장했을 때 가장 먼저 나온 우회가 <strong>ret2libc</strong>입니다 — 리턴 주소를 <em>libc의 <C>system()</C>처럼 이미 매핑된 함수</em>로 돌려 버리는 것.
          ASLR이 켜지면 libc 베이스가 무작위라 함수 주소를 알아야 했고, 그래서 다시 <em>libc 주소를 한 번 ‘유출(leak)’</em>한 뒤 ROP를 짜는 패턴이 표준이 됐습니다.
          현실 익스플로잇은 거의 항상 <strong>leak → calculate → ROP</strong>의 3단입니다.
        </p>
      </Callout>

      <h2>⑤ <C>checksec</C> — 첫 1분에 해야 할 일</h2>

      <p>
        새 바이너리를 받으면 가장 먼저 <C>checksec</C>으로 켜진 방어를 확인합니다. ‘무엇이 꺼져 있냐’가 곧 ‘어디로 들어갈 수 있냐’의 지도가 되거든요.
      </p>

      <CodeBlock lang="text" filename="bash — pwntools 설치 + checksec">{`pip install pwntools
checksec ./binary

# 출력 예시 (해석)
# [*] Arch:    amd64-64-little   ← 64비트 x86, little-endian
# [*] RELRO:   Partial RELRO     ← Full이면 GOT 보호. Partial은 GOT 일부만
# [*] Stack:   Canary found      ← 카나리 활성. No canary면 BOF 쉬움
# [*] NX:      NX enabled        ← 스택/힙 실행 불가. disabled면 셸코드 직접 실행 가능
# [*] PIE:     No PIE            ← 코드 주소 고정 (0x400000부터). enabled면 매번 다름`}</CodeBlock>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>출력</th><th>의미</th><th>공격자가 보는 신호</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">No PIE</td><td>코드가 고정 주소</td><td>가젯 주소 하드코딩 가능 → ROP가 쉬움</td></tr>
            <tr><td className="mono">No canary</td><td>스택 카나리 없음</td><td>BOF로 곧장 리턴 주소까지 도달</td></tr>
            <tr><td className="mono">NX disabled</td><td>스택 실행 가능</td><td>버퍼에 셸코드 → buf 주소로 점프 (고전 BOF)</td></tr>
            <tr><td className="mono">Partial RELRO</td><td>GOT 일부만 보호</td><td>GOT 덮어쓰기로 함수 호출 가로채기 시도 가능</td></tr>
            <tr><td className="mono">Full RELRO + PIE + Canary + NX</td><td>모두 활성</td><td>leak 한 번 + ROP — 가장 흔한 현대 시나리오</td></tr>
          </tbody>
        </table>
      </div>

      <h2>⑥ CTF 리버싱 — 한 문제를 푸는 순서</h2>

      <DefBox term="CTF" en="Capture The Flag">
        <p>
          해킹 대회 형식입니다. 문제를 풀어 숨겨진{" "}
          <KeyTerm term="플래그(Flag): CTF 문제의 정답. 보통 FLAG{...} 또는 CTF{...} 형식의 문자열로 문제 안에 숨겨져 있고, 풀어서 제출하면 점수가 들어옵니다.">
            플래그
          </KeyTerm>
          (보통 <C>FLAG{"{...}"}</C> 형식)를 제출해 점수를 얻습니다. 입문하기 좋은 곳:{" "}
          <KeyTerm term="picoCTF: 카네기멜런대학교가 운영하는 입문용 CTF. 난이도가 낮고 상시 열려 있어 처음 시작하기 좋습니다. 무료.">
            picoCTF
          </KeyTerm>
          ,{" "}
          <KeyTerm term="pwn.college: 미국 애리조나주립대학교의 실습 플랫폼. 리버싱·바이너리 익스플로잇을 체계적으로 가르칩니다. 무료.">
            pwn.college
          </KeyTerm>
          , <C>crackmes.one</C>.
        </p>
      </DefBox>

      <ol style={{ paddingLeft: 22, margin: "16px 0" }}>
        <li style={{ marginBottom: 10 }}><strong>file / checksec</strong> — 아키텍처 + 켜진 방어. 어떤 방어가 꺼져 있냐가 공략 방향을 결정.</li>
        <li style={{ marginBottom: 10 }}><strong>strings</strong> — 평문 힌트. <C>FLAG</C>, <C>correct</C>, <C>wrong</C> 등의 시그니처가 그대로 박혀 있는 경우 의외로 많음.</li>
        <li style={{ marginBottom: 10 }}><strong>Ghidra 임포트 → <C>main</C> 찾기</strong> — 자동 분석 후 문자열 참조로 핵심 함수 점프. 변수·함수에 이름 붙이기(<C>L</C>/<C>Y</C>).</li>
        <li style={{ marginBottom: 10 }}><strong>비교 로직 특정</strong> — <C>strcmp</C>·<C>memcmp</C>·<C>cmp+je</C>·<C>test+jz</C>(4.3의 시그니처들)를 따라 검증 자리에 도달.</li>
        <li style={{ marginBottom: 10 }}><strong>GDB로 한 점 확인</strong> — 비교 직전 BP, 실제 비교 대상 값을 <C>x/s $rsi</C>로 인쇄. 운이 좋으면 거기서 끝.</li>
        <li style={{ marginBottom: 10 }}><strong>angr / z3</strong> — 손으로 풀기 버거운 다중 조건(XOR 마스크, 비트 셔플, 큰 수식)은 솔버에게 위임.</li>
      </ol>

      <Callout type="tip" title="✅ ‘무엇이 꺼져 있나’가 곧 ‘어디로 들어갈까’">
        <p>
          공략 방향은 거의 항상 <C>checksec</C> 출력에서 결정됩니다 — NX가 꺼져 있으면 셸코드, 카나리가 없으면 곧장 BOF, PIE가 꺼져 있으면 가젯 주소 하드코딩.
          현대 CTF의 ‘레이트 라운드’ 문제는 모두 켜져 있는 게 디폴트라, leak → calculate → ROP 3단 흐름이 표준입니다.
        </p>
      </Callout>

      <h2>다음 단계 — 책을 닫고 무엇을 할까</h2>

      <p>
        여기까지 따라왔다면 어셈블리는 더 이상 ‘낯선 기호의 벽’이 아닐 거예요. 이제 남은 건 손에 익히는 일 — 책 안에서가 아니라 바이너리 앞에서.
      </p>

      <Callout type="info" title="📚 학습을 이어 갈 자료">
        <p style={{ marginBottom: 8 }}>
          <strong>실습 플랫폼</strong> — picoCTF(입문) · pwn.college(체계적 심화) · crackmes.one(리버싱 전용) · pwnable.kr(중급).
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>책</strong> — <em>Hacking: The Art of Exploitation</em> (Jon Erickson) · <em>Computer Systems: A Programmer's Perspective</em> (Bryant &amp; O'Hallaron, 통칭 CSAPP) · <em>Practical Binary Analysis</em> (Dennis Andriesse).
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>영상</strong> — LiveOverflow 유튜브 채널 · <em>Nightmare</em> 리버싱 강의 노트 (guyinatuxedo).
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>도구</strong> — Ghidra · IDA Free · pwndbg/GEF · pwntools · ROPgadget · angr.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>레퍼런스</strong> — Intel® 64 and IA-32 Architectures Software Developer's Manual (모든 명령어의 정의가 여기에) · System V AMD64 ABI 문서 · <C>man syscalls</C>.
        </p>
      </Callout>

      <Callout type="tip" title="🎯 8주 학습 로드맵">
        <p style={{ marginBottom: 8 }}>
          <strong>1~2주차 — Part 1·2 복습</strong>: 레지스터 16개, 기본 명령 30개, 스택 동작을 ‘설명할 수 있을 만큼’ 만든다.
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>3~4주차 — Part 3 손에 익히기</strong>: 작은 C 프로그램을 직접 짜고 <C>gcc -O0</C>으로 컴파일, Ghidra로 열어 한 줄씩 자기 코드와 비교. <strong>이게 모든 것의 핵심</strong>입니다.
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>5~6주차 — Part 4 + 실전</strong>: 4.1~4.4 패턴 사전을 옆에 두고 picoCTF 리버싱 10문제. GDB가 손에 완전히 붙는다.
        </p>
        <p style={{ marginBottom: 8 }}>
          <strong>7~8주차 — pwn.college</strong>: Reverse Engineering + Binary Exploitation 모듈을 끝낸다. 끝나면 4.5의 모든 단어가 ‘체험으로’ 이해된다.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>핵심 조언</strong> — 어셈블리는 <em>읽는 것보다 손으로 쳐 보는 것</em>이 압도적으로 빠릅니다. 컴파일하고, 디스어셈블하고, 디버거에서 한 줄씩 따라가는 그 반복이 전부예요.
        </p>
      </Callout>

      <Summary items={[
        "스택 BOF의 본질: 버퍼를 넘쳐 같은 프레임의 ‘리턴 주소’를 덮어쓰면 ret이 공격자의 주소로 점프 → 제어 흐름 탈취.",
        "셸코드는 ‘공격자가 실행하고 싶은 어셈블리 바이트열’. NX 시대엔 직접 실행 불가 → ROP로 우회.",
        "현대 5중 방어: ASLR(주소 무작위) · NX(스택 실행 금지) · Canary(리턴 주소 앞 랜덤 8B) · PIE(코드도 무작위) · RELRO(GOT 잠금) · CFI(목적지 검사).",
        "카나리도 깨진다: 포맷 스트링으로 leak, 포크 서버에서 한 바이트씩 브루트포스. 단독 방어는 의미 없고 묶음으로 의미.",
        "ROP: ret으로 끝나는 짧은 코드 조각(가젯)을 스택에 쌓아 이어 붙임. ROPgadget/ropper로 가젯 검색. 현대 익스플로잇은 leak → calculate → ROP 3단.",
        "checksec가 공략 방향을 결정한다 — NX off면 셸코드, no canary면 BOF, no PIE면 가젯 하드코딩, 모두 켜졌으면 leak + ROP.",
        "CTF 리버싱 순서: file/checksec → strings → Ghidra(main + 문자열 참조) → 비교 로직 특정 → GDB로 한 점 확인 → 복잡하면 angr/z3.",
        "마무리 — 어셈블리는 손으로 쳐 봐야 는다. gcc -O0 → Ghidra → GDB의 작은 사이클을 매일 한 번. picoCTF → pwn.college로 이어가면 책 한 권을 ‘체험’으로 바꿀 수 있다.",
      ]} />
    </article>
  );
}

window.P4C5 = P4C5;
