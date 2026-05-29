// Part 2 · 2.6 스택 동작
function P2C6() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.6"
        title="스택 동작"
        subtitle="스택은 함수 호출, 지역 변수, 리턴 주소를 모두 관리하는 메모리 구조입니다. 스택을 완전히 이해하면 함수가 ‘어떻게 돌아오는지’, 그리고 버퍼 오버플로 공격이 ‘왜 가능한지’까지 한 번에 보입니다."
      />

      <p data-bridge="cc-intro-bridge-p2c6">
        2.5에서 우리는 “플래그와 점프”로 if/while을 만들었습니다. 하지만 이걸로는 부족합니다 — 진짜 프로그램에는 <strong>함수</strong>가 있죠.
        함수가 끝나면 정확히 ‘부른 자리’로 돌아와야 하고, 그 함수 안에서 만든 임시 변수들은 깔끔히 사라져야 합니다.
        이 마법 같은 일을 가능하게 만드는 한 가지 도구가 — 그 이름도 단순한 — <strong>스택</strong>입니다.
        스택을 완전히 이해하면 <C>call</C>이 ‘어떻게 돌아오는지’, 그리고 4.5의 버퍼 오버플로 공격이 <em>‘왜 가능한지’</em>까지 한 번에 보입니다.
      </p>

      <h2>스택이란? — LIFO 자료구조</h2>

      <p>
        스택은 우리가 1.3 메모리 구조에서 잠깐 봤던{" "}
        <KeyTerm term="자료구조(Data Structure): 데이터를 효율적으로 저장·접근하기 위한 구조입니다. 배열, 연결 리스트, 큐, 트리 등이 있으며, 스택은 그중 ‘마지막에 넣은 것이 먼저 나오는’ 가장 단순한 구조 중 하나입니다.">
          자료구조
        </KeyTerm>
        의 한 종류입니다. 핵심 규칙은 단 하나 —{" "}
        <strong>마지막에 넣은 것이 가장 먼저 나옵니다</strong>. 책상에 책을 쌓는 모습과 똑같습니다.
        새 책은 항상 맨 위에 놓이고, 꺼낼 때도 맨 위에서부터 꺼냅니다.
      </p>

      <DefBox term="LIFO" en="Last In, First Out">
        <p>
          가장 마지막에 들어간 데이터가 가장 먼저 나오는 규칙입니다. x86-64에서 스택을 다루는 도구는
          단 세 가지입니다 — <C>push</C>(맨 위에 올리기), <C>pop</C>(맨 위에서 꺼내기), 그리고{" "}
          <C>rsp</C>(<strong>S</strong>tack <strong>P</strong>ointer, <em>지금 스택의 맨 위가 어디인지</em>를 가리키는 레지스터).
        </p>
      </DefBox>

      <Callout type="info" title="rsp는 ‘스택의 TOP’을 가리킨다">
        <p>
          정확히 말하면 <C>rsp</C>는 <strong>현재 스택에 마지막으로 쌓인 8바이트의 시작 주소</strong>를 가리킵니다.
          그 위(더 낮은 주소)는 비어 있고, 그 아래(더 높은 주소)는 이전 데이터들이 차곡차곡 쌓여 있습니다.
          “비어있는 칸을 가리키는 게 아니라 <em>꽉 찬 칸의 머리</em>를 가리킨다” — 이게 x86 스택의 약속입니다.
        </p>
      </Callout>

      <h2>PUSH와 POP의 정확한 동작</h2>

      <p>
        두 명령어는 “스택에 넣는다 / 뺀다”라는 한 단어지만, 실제로는 각각{" "}
        <strong>두 가지 일</strong>을 동시에 합니다. 등가 C 코드로 보면 한눈에 들어옵니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="push rax 의 정체">{`// 두 줄짜리 동작
rsp = rsp - 8;          // ① 스택 포인터를 8 감소
*(long*)rsp = rax;      // ② 그 위치에 값을 저장`}</CodeBlock>
        <CodeBlock lang="c" filename="pop rax 의 정체">{`// 순서가 반대다
rax = *(long*)rsp;      // ① 현재 rsp 위치 값을 읽음
rsp = rsp + 8;          // ② 스택 포인터를 8 증가`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ 스택은 ‘아래로’ 자란다">
        <p>
          상식과 반대입니다. <strong>높은 주소에서 낮은 주소로</strong> 자랍니다.
          그래서 <C>push</C>는 <C>rsp</C>를 <em>빼고</em>, <C>pop</C>은 <em>더합니다</em>.
          이 방향은 인텔이 1970년대에 정한 약속이고, 지금도 그대로입니다 —
          처음엔 이상해도 그림 한 번 그려보면 익숙해집니다.
        </p>
      </Callout>

      <FlowDiagram nodes={[
        { label: "push 전", val: "rsp = 0x7FFEC0" },
        { label: "rsp -= 8", val: "rsp = 0x7FFEB8" },
        { label: "메모리에 기록", val: "[rsp] = rax", highlight: true },
      ]} />

      <h2>스택 시각화 — 직접 push / pop 해보기</h2>

      <p>
        아래는 실제 x86 스택을 그대로 시뮬레이션한 것입니다. <C>push</C> 버튼을 누를 때마다
        새 슬롯이 <strong>위쪽(낮은 주소)</strong>에 추가되고, <C>rsp</C> 마커가 따라 올라갑니다.
        <C>pop</C>은 그 반대입니다. 직접 몇 번 눌러보면 “스택이 아래로 자란다”의 의미가 손에 잡힙니다.
      </p>

      <StackSim />

      <Callout type="tip" title="시뮬레이터에서 주소를 보라">
        <p>
          처음 <C>rsp</C>는 <C>0x7FFEC0</C>입니다. 한 번 <C>push</C>할 때마다{" "}
          <strong>주소가 8씩 줄어듭니다</strong>(<C>0x7FFEB8</C> → <C>0x7FFEB0</C> → …).
          16진수에서 8을 빼면 끝자리가 <C>0 → 8 → 0 → 8</C>로 반복되는 것도 같이 확인해보세요.
        </p>
      </Callout>

      <h2>스택 메모리 레이아웃 — 한 장의 그림</h2>

      <p>
        세 번 <C>push</C>를 한 직후의 메모리를 옆에서 본 모습입니다. 위쪽이 <strong>낮은 주소</strong>(스택 top),
        아래쪽이 <strong>높은 주소</strong>(스택 base). 가장 마지막에 넣은 <C>3</C>이 top에 있고,
        가장 먼저 넣은 <C>1</C>이 가장 깊은 곳에 있습니다.
      </p>

      <MemDiagram rows={[
        { addr: "rsp - 8",  width: "30%", color: "var(--fg-faint)",                tag: "free",       label: "↑ 비어있음 (낮은 주소)" },
        { addr: "rsp →",    width: "82%", color: "var(--accent)",                  tag: "0x3",        label: "스택 TOP — 가장 최근 push" },
        { addr: "rsp + 8",  width: "82%", color: "oklch(0.7 0.1 250)",             tag: "0x2",        label: "두 번째 push" },
        { addr: "rsp + 16", width: "82%", color: "oklch(0.7 0.08 280)",            tag: "0x1",        label: "첫 번째 push" },
        { addr: "rsp + 24", width: "60%", color: "var(--fg-faint)",                tag: "이전 프레임", label: "↓ 호출한 함수의 데이터" },
      ]} />

      <Callout type="info" title="“스택의 위/아래”가 헷갈리는 이유">
        <p>
          책에서는 흔히 위쪽에 top을 그리지만, 메모리 주소로 보면 top이{" "}
          <strong>더 작은 숫자</strong>입니다. 그래서 “위/아래”라는 말이 두 가지 뜻으로 쓰입니다 —
          <em>시각적 위쪽 = 주소상 낮은 곳 = 가장 최근에 넣은 데이터</em>.
          이 셋이 다 같은 자리를 가리킨다는 걸 머릿속에 묶어두면 평생 헷갈리지 않습니다.
        </p>
      </Callout>

      <h2>CALL과 RET — 함수 호출의 본질</h2>

      <p>
        지금까지의 내용을 알면 <C>call</C>과 <C>ret</C>이 어떻게 만들어진 명령어인지 자연스럽게 보입니다.
        둘 다 <strong>스택을 이용해서</strong> “나중에 돌아올 자리”를 기억하는 트릭입니다.
      </p>

      <DefBox term="CALL 명령어">
        <p>
          <C>call func</C> 한 줄은 사실 <strong>두 가지 일</strong>을 합니다.
        </p>
        <ol>
          <li>현재 <C>rip</C>(다음에 실행할 명령어 주소)를 스택에 <C>push</C></li>
          <li><C>func</C>의 주소로 점프(<C>rip = func</C>)</li>
        </ol>
        <p>
          즉 <C>call func</C> ≡ <C>push rip; jmp func</C>. 이때 스택에 저장된 그 주소를{" "}
          <strong>리턴 주소(Return Address)</strong>라고 부릅니다. 함수가 끝나고 돌아갈 위치죠.
        </p>
      </DefBox>

      <DefBox term="RET 명령어">
        <p>
          <C>ret</C>은 스택 최상단의 값을 꺼내 <C>rip</C>에 넣습니다. 즉 <C>pop rip</C>와 같습니다.
          <C>call</C>이 저장해둔 리턴 주소로 돌아가는 것 — 그게 “함수에서 돌아온다”의 정체입니다.
        </p>
      </DefBox>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int square(int x) {
    return x * x;
}

int main() {
    int r = square(5);  // ← 이 줄
    return r;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (개념적)">{`main:
    mov  edi, 5
    call square         ; ① 다음 줄 주소(.after)를 push
                        ; ② square로 점프
.after:
    mov  ebx, eax       ; r = 리턴값
    ret

square:
    imul edi, edi
    mov  eax, edi
    ret                 ; pop rip → .after 로 돌아감`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="call/ret은 ‘마법’이 아니다">
        <p>
          많은 입문자가 <C>call</C>을 “알아서 돌아오는 마법 명령어”로 외웁니다. 하지만 보다시피
          그저 <strong>스택에 주소를 push하는 평범한 명령어</strong>입니다.
          이걸 깨닫는 순간 — 스택 위의 리턴 주소를 <em>덮어쓰면 어떻게 될까?</em> 라는 다음 질문이 자연스럽게 따라옵니다.
        </p>
      </Callout>

      <h2>스택 프레임 — 함수가 자기 공간을 잡는 방식</h2>

      <p>
        함수는 자기 안에서만 쓸 지역 변수, 인자 백업, 임시 계산 공간 등이 필요합니다.
        함수 시작 시 <C>rsp</C>를 한 번 더 빼서 자기 몫의 공간을 통째로 확보하는데,
        이 한 함수가 점유한 스택 영역을 <strong>스택 프레임(Stack Frame)</strong>이라고 부릅니다.
        자세한 동작은 3.2에서 다루지만, 큰 그림은 지금 잡아두는 게 좋습니다.
      </p>

      <MemDiagram rows={[
        { addr: "rsp →",    width: "70%", color: "var(--accent)",       tag: "지역 변수",     label: "func의 임시 공간 (rbp - N)" },
        { addr: "rbp →",    width: "55%", color: "oklch(0.7 0.1 250)",  tag: "saved rbp",   label: "이전 함수의 프레임 베이스" },
        { addr: "rbp + 8",  width: "85%", color: "oklch(0.6 0.13 30)",  tag: "리턴 주소",     label: "← call이 저장한 그 주소" },
        { addr: "rbp + 16", width: "55%", color: "var(--fg-faint)",     tag: "호출자 인자",   label: "이전 함수의 스택 프레임" },
      ]} />

      <Callout type="note" title="📌 스택 프레임 한 줄 요약">
        <p>
          “한 함수가 살아있는 동안 차지하는 스택 위의 한 칸” — 함수가 끝나면 그 칸은 통째로 회수되고,
          그 안의 지역 변수들은 함께 사라집니다. C에서 “함수가 끝난 뒤 지역 변수 포인터를 반환하면 안 된다”는
          규칙이 어디서 나오는지 보이죠.
        </p>
      </Callout>

      <h2>위험한 이웃 — 버퍼 오버플로의 원리</h2>

      <p>
        앞 그림을 다시 보세요. <strong>지역 변수</strong>와 <strong>리턴 주소</strong>가
        스택 위에 <em>바로 옆자리</em>에 앉아 있습니다. 만약 지역 변수에 경계 검사 없이
        데이터를 쏟아부어 <strong>옆자리까지 침범</strong>한다면?
      </p>

      <Compare>
        <CodeBlock lang="c" filename="고전적인 취약 코드">{`void greet(char *name) {
    char buf[64];          // ← 스택 위의 64바이트
    strcpy(buf, name);     // 길이 검사 없음!
    printf("Hello, %s\\n", buf);
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="스택 레이아웃 (대략)">{`; greet 진입 직후의 스택:
;
;   [rbp - 64] ┐
;     ...      │ buf[64]
;   [rbp -  1] ┘
;   [rbp     ]  ← saved rbp
;   [rbp +  8]  ← 리턴 주소  ⚠
;
; name이 64바이트보다 길면 buf를 넘쳐
; saved rbp → 리턴 주소까지 덮어쓴다.`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="🔴 스택 기반 버퍼 오버플로 (Stack Buffer Overflow)">
        <p>
          공격자가 <C>name</C>에 72바이트짜리 문자열을 넣고, 마지막 8바이트를 자신이 원하는 주소로 채우면,
          <C>greet</C>이 <C>ret</C>하는 순간 CPU는 그 주소로 점프합니다 —{" "}
          <strong>공격자가 함수의 ‘돌아갈 곳’을 가로챈 것입니다</strong>.
          1988년 모리스 웜부터 2000년대 수많은 익스플로잇까지, 모두 이 한 줄짜리 원리의 변주입니다.
          현대의 <C>-fstack-protector</C>, ASLR, NX 비트는 전부 <em>이 공격을 막기 위해</em> 추가된 방어막입니다.
          자세한 내용은 4.5에서 다룹니다.
        </p>
      </Callout>

      <h2>스택을 다룰 때 주의할 점</h2>

      <Callout type="warn" title="① push / pop 짝을 반드시 맞춰라">
        <p>
          함수 중간에 <C>push</C>만 하고 <C>pop</C>을 안 하면 <C>ret</C> 시점의 <C>rsp</C>가
          엉뚱한 곳을 가리켜 <strong>리턴 주소가 아닌 데이터로 점프</strong>합니다. 거의 확실히 크래시입니다.
          “이 함수의 시작과 끝에서 <C>rsp</C>가 같은 값이어야 한다” — 이게 모든 함수의 암묵적 계약입니다.
        </p>
      </Callout>

      <Callout type="warn" title="② 스택은 무한하지 않다 (Stack Overflow)">
        <p>
          일반적인 리눅스 프로세스의 스택은 보통 <strong>8MB</strong> 정도입니다.
          깊은 재귀나 거대한 지역 배열(<C>char buf[10_000_000]</C>)로 다 써버리면
          OS가 페이지를 더 못 주고 <em>SIGSEGV</em>를 발생시킵니다 — 이게 흔히 말하는 “스택 오버플로 크래시”입니다.
          참고로 같은 이름의 웹사이트와는 아무 관련이 없습니다.
        </p>
      </Callout>

      <Callout type="tip" title="③ 16바이트 정렬 (System V ABI)">
        <p>
          x86-64 리눅스/macOS에서는 <C>call</C> 직전에 <C>rsp</C>가 <strong>16의 배수</strong>여야 한다는 규칙이 있습니다.
          <C>call</C>이 리턴 주소 8바이트를 push하므로 함수 진입 시점의 <C>rsp</C>는 <C>16n + 8</C>이 되고,
          이어 프롤로그의 <C>push rbp</C>가 마저 8을 빼면 다시 16바이트 정렬이 맞춰지죠.
          SSE/AVX 명령이 16바이트 정렬된 메모리를 요구하기 때문에 둔 약속입니다.
          손으로 어셈블리를 짤 때 <C>printf</C>가 갑자기 죽으면 99% 이 규칙 위반입니다 —
          프롤로그를 생략한 함수라면 <C>sub rsp, 8</C>을 한 번 해서 정렬을 맞춰 주면 됩니다.
        </p>
      </Callout>

      <Summary items={[
        "스택은 LIFO 자료구조 — 마지막에 push한 게 가장 먼저 pop된다.",
        "x86 스택은 ‘아래로’ 자란다 — 높은 주소 → 낮은 주소. push는 rsp를 빼고, pop은 rsp를 더한다.",
        "push rax = (rsp -= 8; *rsp = rax), pop rax = (rax = *rsp; rsp += 8). 단 두 줄짜리 동작.",
        "call func = push rip; jmp func. ret = pop rip. 함수가 ‘돌아오는’ 마법의 정체.",
        "스택 프레임은 한 함수가 점유하는 스택 영역. 지역 변수·saved rbp·리턴 주소가 이 안에 인접해 산다.",
        "지역 버퍼와 리턴 주소가 이웃이라는 사실이 곧 버퍼 오버플로 공격의 발판이다 (자세한 건 4.5).",
        "황금 규칙: 함수 시작과 끝의 rsp가 같아야 하고, call 직전엔 16-byte 정렬이 맞아야 한다.",
      ]} />
    </article>
  );
}

window.P2C6 = P2C6;
