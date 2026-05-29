// Part 2 · 2.1 어셈블리 파일 구조
function P2C1() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.1"
        title="어셈블리 파일의 전체 구조"
        subtitle="C에 #include와 main()이 있듯, 어셈블리 파일도 반드시 지켜야 하는 기본 뼈대가 있습니다. 이 챕터에서는 ‘빈 파일에서 실행 가능한 프로그램까지’의 전체 틀을 C와 1:1로 비교합니다."
      />

      <p data-bridge="cc-intro-bridge-p2c1">
        1장이 ‘무대’를 설명했다면, 2장은 그 무대 위에서 실제로 코드를 씁니다.
        그런데 C 파일을 처음 본 사람이 <C>#include</C>와 <C>main()</C>의 의미를 몰라 당황하듯,
        어셈블리 파일도 첫 줄부터 낯섭니다 — <C>.section</C>, <C>.global</C>, <C>_start</C> ... 이건 다 뭘 하는 걸까요?
        명령어 하나하나를 배우기 전에, 어셈블리 파일 자체의 ‘목차’부터 잡고 가야 합니다.
        이 챕터의 목표는 단 하나 — <strong>빈 <C>.s</C> 파일 한 장을 보고도 두렵지 않게 만드는 것</strong>입니다.
      </p>

      <h2>C 파일 구조 vs 어셈블리 파일 구조 — 한눈에 비교</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 파일 전체 구조">{`// 1. 헤더 포함 (라이브러리 가져오기)
#include <stdio.h>

// 2. 전역 변수 선언
int global_var = 42;

// 3. 함수 정의
void say_hello() {
    printf("Hello\\n");
}

// 4. 진입점 (프로그램 시작)
int main() {
    say_hello();
    return 0;   // 5. 종료
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 파일 전체 구조 (NASM)">{`; 1. section .data — 전역 데이터 / 문자열
section .data
    msg     db "Hello", 0x0a
    msg_len equ $ - msg

; 2. section .bss — 초기화 안 된 버퍼
section .bss
    buf     resb 64

; 3. section .text — 실행 코드
section .text
    global _start    ; 진입점 외부 공개

; 4. 함수 정의
say_hello:
    mov  rax, 1
    mov  rdi, 1
    mov  rsi, msg
    mov  rdx, msg_len
    syscall
    ret

; 5. 진입점 (프로그램 시작)
_start:
    call say_hello
    mov  rax, 60     ; 6. exit(0)
    xor  rdi, rdi
    syscall`}</CodeBlock>
      </Compare>

      <h2>① 섹션(Section) — C의 영역 구분 대신 파일을 나눈다</h2>

      <DefBox term="섹션" en="Section">
        <p>
          어셈블리 파일은 용도에 따라 공간을 나눕니다. 이 구역 하나하나를
          <strong> 섹션(Section)</strong>이라고 합니다.
          C에서 <C>#include</C>가 “이 라이브러리를 가져와라”라는 선언이라면,
          섹션 선언은 “여기서부터는 코드다 / 여기서부터는 데이터다”를 구분하는 선언입니다.
          {" "}
          <KeyTerm term="어셈블러(Assembler): 어셈블리 소스코드(.asm)를 기계어 바이트(.o)로 변환하는 프로그램입니다. NASM, GAS, MASM 등이 있습니다.">
            어셈블러
          </KeyTerm>
          가 이 구분을 읽고 실행 파일을 올바르게 만들어냅니다.
        </p>
      </DefBox>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>섹션</th><th>C에 대응</th><th>내용</th><th>특성</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">section .text</td><td>함수 본문, 실행 코드</td><td>CPU가 실행하는 명령어들</td><td>읽기 전용, 실행 가능</td></tr>
            <tr><td className="mono">section .data</td><td><C>int x = 5;</C> 초기화 전역</td><td>초기값이 있는 데이터, 문자열</td><td>읽기 / 쓰기 가능</td></tr>
            <tr><td className="mono">section .bss</td><td><C>int buf[64];</C> 미초기화 전역</td><td>0으로 채워지는 공간 예약</td><td>실행 파일 크기에 안 잡힘</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 .bss와 .data의 차이가 왜 중요한가요?">
        <p>
          <C>.data</C>에 쓴 값은 실행 파일 안에 실제 바이트로 저장됩니다.
          반면 <C>.bss</C>는 “이 크기만큼 빈 공간이 필요하다”는 정보만 저장하고,
          실제 0 바이트는 프로그램이 시작할 때 OS가 채워줍니다.
          덕분에 <C>char buf[1024*1024];</C>처럼 큰 버퍼를 선언해도
          실행 파일 크기가 늘지 않습니다.
        </p>
      </Callout>

      <h2>② .data 섹션 — 데이터 선언 문법</h2>

      <p>C에서 <C>int x = 42;</C>처럼 변수를 선언하듯, <C>.data</C> 섹션에는 데이터를 선언합니다.</p>

      <Compare>
        <CodeBlock lang="c" filename="C 전역변수 선언">{`char  msg[] = "Hello\\n";
int   count = 10;
long  big   = 0x1234;
short small = 5;`}</CodeBlock>
        <CodeBlock lang="asm" filename="NASM .data 선언">{`section .data
    msg   db "Hello", 0x0a, 0  ; byte(s)
    count dd 10                ; 4바이트 정수
    big   dq 0x1234            ; 8바이트 정수
    small dw 5                 ; 2바이트 정수`}</CodeBlock>
      </Compare>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>지시어</th><th>크기</th><th>의미</th><th>C 타입</th><th>예시</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">db</td><td>1 byte</td><td>
              <KeyTerm term="Define Byte: 1바이트 값을 정의합니다. 문자열 선언에 가장 많이 씁니다. 쉼표로 여러 값을 나열할 수 있습니다. 예: db 'H','i',0 → Hi 문자열(널 종료)">
                Define Byte
              </KeyTerm>
            </td><td className="mono">char</td><td className="mono">msg db "Hi", 0</td></tr>
            <tr><td className="mono">dw</td><td>2 byte</td><td>
              <KeyTerm term="Define Word: 2바이트 값을 정의합니다.">Define Word</KeyTerm>
            </td><td className="mono">short</td><td className="mono">val dw 1000</td></tr>
            <tr><td className="mono">dd</td><td>4 byte</td><td>
              <KeyTerm term="Define Dword: 4바이트 값을 정의합니다. int에 해당합니다.">Define Dword</KeyTerm>
            </td><td className="mono">int</td><td className="mono">num dd 42</td></tr>
            <tr><td className="mono">dq</td><td>8 byte</td><td>
              <KeyTerm term="Define Qword: 8바이트 값을 정의합니다. long·포인터에 해당합니다.">Define Qword</KeyTerm>
            </td><td className="mono">long</td><td className="mono">ptr dq 0</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 equ와 $ — 상수와 현재 위치">
        <p>
          <C>equ</C>는{" "}
          <KeyTerm term="equ(EQUate): ‘같다’는 뜻의 지시어입니다. 메모리를 할당하지 않고, 이름에 숫자 값을 붙여두는 것입니다. C의 #define NUM 100 과 같은 역할입니다.">
            C의 #define과 같은 상수 정의
          </KeyTerm>
          입니다. <C>$</C>는{" "}
          <KeyTerm term="$(달러): NASM에서 현재 어셈블리 위치(주소)를 의미합니다. len equ $ - msg 는 ‘지금 위치 − msg 시작 위치 = msg의 바이트 수’입니다. 문자열 길이를 자동 계산하는 관용구입니다.">
            “현재 어셈블리 위치”
          </KeyTerm>
          를 뜻합니다. <C>len equ $ - msg</C>는 현재 위치에서 msg 시작 위치를 빼서
          msg의 바이트 수를 자동으로 계산하는 관용구입니다.
        </p>
      </Callout>

      <h2>③ .bss 섹션 — 버퍼/배열 예약</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 미초기화 전역변수">{`char  buf[64];
int   arr[10];
long  bigbuf[8];`}</CodeBlock>
        <CodeBlock lang="asm" filename="NASM .bss 선언">{`section .bss
    buf    resb 64    ; 64 × 1바이트
    arr    resd 10    ; 10 × 4바이트
    bigbuf resq 8     ;  8 × 8바이트`}</CodeBlock>
      </Compare>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>지시어</th><th>크기</th><th>의미</th><th>C 대응</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">resb N</td><td>N × 1 byte</td><td>
              <KeyTerm term="Reserve Byte: N개의 바이트 공간을 예약합니다. 실행 파일에는 크기 정보만 남고, OS가 0으로 채워줍니다.">
                Reserve Byte
              </KeyTerm>
            </td><td className="mono">char buf[N]</td></tr>
            <tr><td className="mono">resw N</td><td>N × 2 byte</td><td>Reserve Word</td><td className="mono">short arr[N]</td></tr>
            <tr><td className="mono">resd N</td><td>N × 4 byte</td><td>Reserve Dword</td><td className="mono">int arr[N]</td></tr>
            <tr><td className="mono">resq N</td><td>N × 8 byte</td><td>Reserve Qword</td><td className="mono">long arr[N]</td></tr>
          </tbody>
        </table>
      </div>

      <h2>④ 진입점 선언 — global _start</h2>

      <DefBox term="_start와 global" en="프로그램의 출발점">
        <p>
          C의 <C>int main()</C>처럼, 어셈블리에서는 <C>_start</C> 레이블이
          “프로그램이 여기서 시작한다”는 뜻입니다.
          <C>global _start</C>는 이 레이블을{" "}
          <KeyTerm term="global 지시어: 이 레이블/심볼을 링커가 볼 수 있도록 외부에 공개합니다. C에서 함수를 extern으로 선언하는 것과 비슷합니다. global이 없으면 해당 레이블은 이 파일 안에서만 사용할 수 있습니다.">
            링커에게 공개
          </KeyTerm>
          하는 선언입니다. <C>ld</C>(링커)가 이 이름을 찾아서 프로그램의 시작 주소로 지정합니다.
        </p>
      </DefBox>

      <Callout type="note" title="📌 _start vs main — 언제 무엇을 쓰나?">
        <p>
          <strong>순수 어셈블리로 직접 링크할 때</strong> (<C>ld</C> 사용): <C>_start</C>를 씁니다.
        </p>
        <p>
          <strong>C 표준 라이브러리(libc)와 함께 링크할 때</strong> (<C>gcc</C> 사용): <C>main</C>을 씁니다.
        </p>
        <p>
          <C>gcc</C>를 쓰면 libc가 자동으로 <C>_start</C>를 만들고 그 안에서 초기화 후
          <C>main</C>을 호출해줍니다. 리버싱할 때 <C>_start</C> → <C>__libc_start_main</C> → <C>main</C>{" "}
          순서로 호출되는 이유가 바로 이 때문입니다.
        </p>
      </Callout>

      <h2>⑤ 함수 정의 — 레이블 + 본문 + ret</h2>

      <p>
        C에서 <C>void func() {"{...}"}</C>처럼 함수를 만들 수 있듯,
        어셈블리에서도 함수를 정의합니다.
        <strong> 레이블(이름) + 프롤로그 + 본문 + ret(끝)</strong>이 기본 구조입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 함수 정의">{`// 반환값 없는 함수
void greet() {
    printf("Hi\\n");
}  // 닫는 } = 함수 끝

// 값 반환 함수
int add(int a, int b) {
    return a + b;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 함수 정의">{`; void greet()
greet:                  ; ← 함수 이름 = 레이블
    push rbp
    mov  rbp, rsp       ; 프롤로그
    ; ... 함수 내용 ...
    leave
    ret                 ; ← 함수 끝 = ret

; int add(int a, int b)
; a=rdi, b=rsi, 반환값=rax
add:
    lea  eax, [edi+esi]
    ret`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 함수 정의 핵심 3가지">
        <p>1. <strong>레이블</strong> — 함수 이름 + 콜론 (<C>greet:</C>). 이 주소가 함수의 시작점입니다.</p>
        <p>2. <strong>프롤로그/에필로그</strong> — <C>push rbp; mov rbp, rsp</C>로 시작, <C>leave</C>로 끝. 짧은 함수는 생략 가능합니다.</p>
        <p>3. <strong><C>ret</C></strong> — 함수 종료 명령. C의 닫는 중괄호 <C>{`}`}</C>에 해당합니다. 반드시 있어야 합니다.</p>
      </Callout>

      <h2>⑥ 프로그램 종료 — C의 return 0에 대응</h2>

      <p>
        C에서 <C>main()</C>이 <C>return 0</C>으로 끝나듯,
        어셈블리에서는 반드시 <C>exit</C> 시스템 콜로 <strong>명시적으로</strong> 끝내야 합니다.
        없으면 CPU가 코드 다음에 있는 메모리를 계속 실행하다가 충돌합니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 종료">{`int main() {
    // ... 코드 ...
    return 0;   // 정상 종료
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 종료 (필수!)">{`; exit(0) — Linux x86-64
mov  rax, 60        ; syscall 번호 60 = exit
xor  rdi, rdi       ; 종료 코드 0 (정상)
syscall             ; 커널에 종료 요청

; libc와 함께 쓸 때 (main에서 ret)
xor  eax, eax       ; return 0
ret`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ exit를 빼먹으면 무슨 일이 일어나는가">
        <p>
          <C>_start</C> 끝에 <C>ret</C>만 적고 끝내면, 돌아갈 곳이 없으므로(스택에 복귀 주소가 없음)
          {" "}<strong>세그멘테이션 폴트</strong>가 발생하거나 무작위 명령어를 실행하다 죽습니다.
          C와 가장 큰 차이입니다 — libc가 우리 대신 정리해주지 않습니다.
        </p>
      </Callout>

      <h2>완전한 Hello World — 모든 구조 총정리</h2>

      <p>지금까지 배운 모든 구조가 들어간 완전한 예제입니다.</p>

      <Compare>
        <CodeBlock lang="c" filename="C Hello World">{`#include <stdio.h>

void say_hello() {
    printf("Hello, World!\\n");
}

int main() {
    say_hello();
    return 0;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 Hello World (NASM)">{`section .data
    msg    db "Hello, World!", 0x0a
    msglen equ $ - msg

section .text
    global _start

say_hello:               ; void say_hello()
    mov  rax, 1          ; write syscall
    mov  rdi, 1          ; stdout
    mov  rsi, msg        ; 문자열 주소
    mov  rdx, msglen
    syscall
    ret                  ; 함수 종료

_start:                  ; int main()
    call say_hello
    mov  rax, 60         ; return 0
    xor  rdi, rdi
    syscall`}</CodeBlock>
      </Compare>

      <h2>빌드 방법 — C vs 어셈블리</h2>

      <Compare>
        <CodeBlock lang="text" filename="C 빌드 (gcc)">{`# 한 줄로 끝
gcc hello.c -o hello
./hello`}</CodeBlock>
        <CodeBlock lang="text" filename="어셈블리 빌드 (nasm + ld)">{`# 1단계: 어셈블 (소스 → 오브젝트)
nasm -f elf64 hello.asm -o hello.o

# 2단계: 링크 (오브젝트 → 실행파일)
ld hello.o -o hello

./hello`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="✅ gcc로 C 라이브러리 함수 쓰기 (printf 등)">
        <p>
          <C>printf</C> 같은 C 표준 라이브러리 함수를 어셈블리에서 쓰려면
          <C>ld</C> 대신 <C>gcc</C>로 링크하고 <C>_start</C> 대신 <C>main</C>을 진입점으로 씁니다.
          외부 함수는 <C>extern printf</C>처럼 선언하면 됩니다.
        </p>
      </Callout>

      <CodeBlock lang="text" filename="libc와 함께 빌드">{`nasm -f elf64 hello.asm -o hello.o
gcc hello.o -o hello -no-pie`}</CodeBlock>

      <h2>C ↔ 어셈블리 구조 대응 요약</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>C 구성요소</th><th>어셈블리 대응</th><th>설명</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">{`#include <...>`}</td><td className="mono">extern 함수이름</td><td>외부 함수 사용 선언</td></tr>
            <tr><td className="mono">int x = 5;{" "}(전역)</td><td className="mono">section .data + dd 5</td><td>초기값 있는 전역변수</td></tr>
            <tr><td className="mono">char buf[64];{" "}(전역)</td><td className="mono">section .bss + resb 64</td><td>초기화 안 된 버퍼 예약</td></tr>
            <tr><td className="mono">int main() {`{ }`}</td><td className="mono">global _start + _start:</td><td>진입점 선언</td></tr>
            <tr><td className="mono">void func() {`{ }`}</td><td className="mono">레이블 + 본문 + ret</td><td>함수 정의</td></tr>
            <tr><td className="mono">return 0;{" "}(main)</td><td className="mono">mov rax,60; xor rdi,rdi; syscall</td><td>프로그램 종료</td></tr>
            <tr><td className="mono">{`}`} (함수 닫기)</td><td className="mono">ret</td><td>함수 종료 및 호출자로 복귀</td></tr>
            <tr><td className="mono">지역변수 int a;</td><td className="mono">sub rsp, 8 + [rbp-8]</td><td>스택에 공간 확보</td></tr>
            <tr><td className="mono">func();</td><td className="mono">call func</td><td>함수 호출</td></tr>
            <tr><td className="mono">"Hello" 문자열</td><td className="mono">db "Hello", 0</td><td>널 종료 문자열</td></tr>
          </tbody>
        </table>
      </div>

      <Summary items={[
        "어셈블리 파일은 .text(코드) · .data(초기화 전역) · .bss(미초기화 전역) 세 섹션으로 나뉜다.",
        ".data는 실행 파일에 실제 바이트로 들어가고, .bss는 크기 정보만 들어가 실행 파일 용량을 절약한다.",
        "데이터 선언: db(1) · dw(2) · dd(4) · dq(8). 예약: resb · resw · resd · resq. equ는 #define, $는 현재 위치.",
        "진입점은 _start(ld 직접 링크) 또는 main(gcc + libc). global로 외부에 공개.",
        "함수는 ‘레이블 + 프롤로그 + 본문 + ret’ 구조. 프로그램은 반드시 exit syscall로 명시 종료.",
        "빌드: nasm -f elf64 hello.asm -o hello.o  →  ld hello.o -o hello.",
      ]} />
    </article>
  );
}

window.P2C1 = P2C1;
