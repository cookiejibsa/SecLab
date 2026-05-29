// Part 2 · 2.4 메모리 접근
function P2C4() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 2 · Chapter 2.4"
        title="메모리 접근"
        subtitle="C에서 포인터를 어렵게 느꼈다면, 어셈블리에서 메모리 접근 방식을 보면 오히려 명확하게 이해됩니다. 대괄호 [ ]가 C의 역참조 *와 같습니다."
      />

      <p data-bridge="cc-intro-bridge-p2c4">
        앞 챕터의 <C>mov</C>는 ‘레지스터끼리’ 값을 옮기는 것이었습니다.
        그런데 진짜 프로그램의 데이터는 대부분 메모리에 있죠 — 배열, 구조체, 전역 변수, 그리고 포인터.
        C에서 <C>*p</C>나 <C>arr[i]</C>를 쓸 때, 어셈블리에선 정확히 어떻게 표현될까요?
        이 챕터의 한 줄짜리 비밀은 단순합니다 — <strong>대괄호 <C>[ ]</C>가 C의 <C>*</C>와 같다</strong>.
        이 한 줄을 머리에 박는 순간, 어셈블리에서 포인터가 오히려 C보다 명료해집니다.
      </p>

      <h2>대괄호 [ ] = C의 * (역참조)</h2>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int x = 10;
int *p = &x;

// 포인터로 읽기
int val = *p;

// 포인터로 쓰기
*p = 20;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`; rbx = p (포인터, 주소를 가짐)

; 포인터로 읽기 (역참조)
mov  rax, [rbx]
; = rax = *p

; 포인터로 쓰기
mov  QWORD PTR [rbx], 20`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="한 줄 외우기">
        <p>
          <strong><C>mov rax, rbx</C></strong> — <em>rbx의 ‘값’</em>을 rax에 복사.<br/>
          <strong><C>mov rax, [rbx]</C></strong> — <em>rbx가 ‘가리키는 주소의 값’</em>을 rax에 복사.
        </p>
        <p>이 두 줄의 차이를 머릿속에서 분명히 가르는 것이 어셈블리 입문의 가장 큰 관문입니다.</p>
      </Callout>

      <h2>메모리 주소 계산 공식</h2>

      <p>Intel x86-64의 메모리 주소는 다음 한 줄 공식으로 모든 패턴을 만들어낼 수 있습니다.</p>

      <CodeBlock lang="text" filename="주소 표현 공식">{`[ base + index * scale + displacement ]
   베이스   인덱스   배율(1·2·4·8)     변위(상수)`}</CodeBlock>

      <FlowDiagram nodes={[
        { label: "base", val: "rbx" },
        { label: "index", val: "rax" },
        { label: "× scale", val: "× 4" },
        { label: "+ disp", val: "+ 16" },
      ]} />

      <p style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: -12, marginBottom: 24 }}>
        예) <C>[rbx + rax*4 + 16]</C> — 구조체 배열에서 i번째 원소의 두 번째 필드를 접근하는 전형 패턴.
      </p>

      <Callout type="note" title="📌 오프셋(Offset)이란?">
        <p>
          <strong>오프셋(Offset)</strong>은 “기준 위치에서 얼마나 떨어져 있는가”입니다.
          예를 들어 구조체의 두 번째 멤버는 시작 주소에서 4바이트 떨어진 곳(오프셋 4)에 있습니다.
          <strong> 디스플레이스먼트(Displacement)</strong>는 어셈블리에서 같은 개념을 부르는 이름입니다.
        </p>
      </Callout>

      <Callout type="info" title="scale이 1·2·4·8뿐인 이유">
        <p>
          C의 기본 정수 타입 크기 — <C>char</C>(1), <C>short</C>(2), <C>int</C>(4), <C>long/포인터</C>(8) — 와
          정확히 일치합니다. 즉 어떤 자료형 배열의 i번째 원소라도{" "}
          <strong>한 줄로 주소를 계산할 수 있도록 의도된 설계</strong>입니다.
        </p>
      </Callout>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>표현식</th><th>계산되는 주소</th><th>C에 대응</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">[rbx]</td><td className="mono">rbx</td><td className="mono">*p</td></tr>
            <tr><td className="mono">[rbx + 8]</td><td className="mono">rbx + 8</td><td className="mono">*(p + 2){"  "}/* int 기준 */</td></tr>
            <tr><td className="mono">[rbx + rax*4]</td><td className="mono">rbx + rax*4</td><td className="mono">arr[i]{"  "}/* int 배열 */</td></tr>
            <tr><td className="mono">[rbp - 8]</td><td className="mono">rbp - 8</td><td>지역 변수</td></tr>
            <tr><td className="mono">[rbx + rax*8 + 16]</td><td className="mono">rbx + rax*8 + 16</td><td>구조체 배열 접근</td></tr>
          </tbody>
        </table>
      </div>

      <h2>배열과 구조체 접근 — 공식이 실제로 쓰이는 모습</h2>

      <Compare>
        <CodeBlock lang="c" filename="배열 인덱싱">{`int arr[10];
int x = arr[i];
arr[i] = 42;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`; rbx = arr (배열 시작 주소)
; rax = i

mov  edx, [rbx + rax*4]     ; x = arr[i]
mov  DWORD PTR [rbx + rax*4], 42`}</CodeBlock>
      </Compare>

      <Compare>
        <CodeBlock lang="c" filename="구조체 필드 접근">{`struct Point {
    int x;   // 오프셋 0
    int y;   // 오프셋 4
    long id; // 오프셋 8
};

struct Point *p = ...;
int x = p->x;
long id = p->id;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`; rbx = p (구조체 포인터)

mov  eax, [rbx]          ; p->x   (오프셋 0)
mov  rcx, [rbx + 8]      ; p->id  (오프셋 8)`}</CodeBlock>
      </Compare>

      <h2>크기 지정자 — BYTE / WORD / DWORD / QWORD PTR</h2>

      <p>
        메모리에서 몇 바이트를 읽고 쓸지 명시해야 할 때가 있습니다.
        레지스터가 함께 있으면 크기가 자동으로 정해지지만,
        <strong> 즉시값을 쓸 때처럼 모호한 경우엔 반드시 명시</strong>해야 합니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`char  *p1 = ...;
short *p2 = ...;
int   *p3 = ...;
long  *p4 = ...;

*p1 = 0x41;     // 1바이트
*p2 = 0x1234;   // 2바이트
*p3 = 0x5678;   // 4바이트
*p4 = 0x9ABC;   // 8바이트`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`; rbx = 주소

mov BYTE  PTR [rbx], 0x41
mov WORD  PTR [rbx], 0x1234
mov DWORD PTR [rbx], 0x5678
mov QWORD PTR [rbx], 0x9ABC`}</CodeBlock>
      </Compare>

      <Callout type="warn" title="⚠️ 크기 지정 안 하면 어셈블 에러">
        <p>
          <C>mov [rbx], 1</C>처럼 적으면 어셈블러가 “1바이트인가 8바이트인가” 알 수 없어 에러를 냅니다.
          반면 레지스터가 끼면 자동으로 정해집니다 — <C>mov [rbx], rax</C>는 8바이트,
          <C>mov [rbx], al</C>은 1바이트.
        </p>
      </Callout>

      <h2>LEA vs MOV [ ] — 한 번에 정리</h2>

      <p>
        두 명령은 똑같이 대괄호를 쓰지만, 의미가 정반대입니다.
        이 표 하나만 머릿속에 들고 다니면 됩니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>명령</th><th>대괄호의 뜻</th><th>결과</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">mov rax, [rbx + 8]</td>
              <td><strong>역참조</strong> — 메모리를 실제로 읽음</td>
              <td>rax = *(rbx + 8) — <em>주소가 가리키는 값</em></td>
            </tr>
            <tr>
              <td className="mono">lea rax, [rbx + 8]</td>
              <td><strong>주소 계산만</strong> — 메모리 안 만짐</td>
              <td>rax = rbx + 8 — <em>주소 자체</em></td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="C로 비유하면">
        <p>
          <C>mov rax, [rbx + 8]</C> ↔ <C>{`rax = *(rbx + 8);`}</C><br/>
          <C>lea rax, [rbx + 8]</C> ↔ <C>{`rax = (rbx + 8);`}</C>{" "}
          (또는 C++의 <C>{`&p[2]`}</C>)
        </p>
      </Callout>

      <Summary items={[
        "대괄호 [ ]는 C의 역참조 *와 같다 — 메모리에서 실제로 값을 읽고 쓴다.",
        "주소 공식: [base + index*scale + displacement]. scale은 1·2·4·8 (C 자료형 크기와 일치).",
        "BYTE/WORD/DWORD/QWORD PTR로 접근 크기를 명시. 즉시값과 함께 쓸 땐 필수.",
        "mov는 메모리를 ‘읽고/쓰지만’, lea는 ‘주소만 계산’해서 레지스터에 넣는다.",
        "배열·구조체 접근은 결국 모두 [base + index*scale + disp] 한 줄로 환원된다.",
      ]} />
    </article>
  );
}

window.P2C4 = P2C4;
