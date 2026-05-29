// Part 3 · 3.3 배열과 구조체
function P3C3() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 3 · Chapter 3.3"
        title="배열과 구조체"
        subtitle="C에서 배열·구조체를 ‘당연하게’ 쓰던 문법은, 어셈블리에선 모두 ‘주소 + 오프셋’이라는 한 가지 패턴으로 환원됩니다. 이 패턴을 알면 리버싱에서 데이터 구조를 거꾸로 복원하는 일이 한결 쉬워집니다."
      />

      <p>
        2.4에서 우리는 한 줄짜리 주소 공식 — <C>{`[base + index*scale + displacement]`}</C> — 을 봤습니다.
        그땐 “이런 표현이 있다”까지였다면, 이번 챕터에선 그 공식이 <strong>왜 그렇게 생겼는지</strong>가 드러납니다.
        C의 <C>{`arr[i]`}</C>와 <C>{`p->z`}</C>가 어셈블리에서 <em>정확히 그 공식의 일부</em>로 환원되기 때문입니다.
        리버싱 관점에서 보면 반대편에서 같은 그림 — <strong>오프셋 패턴만 보고 C의 데이터 구조를 거꾸로 복원하기</strong> — 의 첫 발이기도 합니다.
      </p>

      <h2>배열 — 연속된 같은 크기의 칸들</h2>

      <DefBox term="배열" en="Array">
        <p>
          <strong>같은 타입의 원소가 메모리에 연속으로 놓인 블록</strong>입니다.
          <C>{`int arr[5]`}</C>는 4바이트 × 5칸 = 20바이트 짜리 덩어리. <C>arr</C>이라는 이름은
          그 덩어리의 <em>시작 주소</em>를 가리킵니다 — 그래서 C에서 배열명을 함수에 넘기면 자동으로 포인터가 됩니다.
        </p>
      </DefBox>

      <p>
        “i번째 원소가 어디 있느냐”를 계산하는 공식은 단 한 줄입니다 —
        <strong> 시작 주소 + i × (한 칸의 크기)</strong>. 이걸 어셈블리는 <C>{`[base + index*scale]`}</C> 한 번에 해냅니다.
        <C>scale</C>이 1·2·4·8뿐인 이유가 여기서 보입니다 — 정확히 C의 기본 타입 크기와 같죠.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int  arr[5] = {10, 20, 30, 40, 50};
int  x = arr[2];        // x = 30
arr[i] = 99;            // i번째 원소 = 99

long la[3];
la[i] = 100;            // 8바이트 원소`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rbx=&arr, rcx=i)">{`; int arr[] — 한 칸 = 4바이트
mov  eax, [rbx + 2*4]            ; x = arr[2]
mov  DWORD PTR [rbx + rcx*4], 99 ; arr[i] = 99

; long la[] — 한 칸 = 8바이트
mov  QWORD PTR [rbx + rcx*8], 100`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="‘scale 값’ = ‘원소의 크기’">
        <p>
          <C>{`*4`}</C>를 보면 → <C>int</C> 배열, <C>{`*8`}</C>을 보면 → <C>long</C>/포인터 배열,
          <C>{`*1`}</C>이면 → <C>char</C> 배열, <C>{`*2`}</C>면 → <C>short</C> 배열.
          리버싱할 때 디스어셈블리의 <em>scale 값 하나만 봐도 원소 타입이 거의 다 보입니다</em>.
        </p>
      </Callout>

      <FlowDiagram nodes={[
        { label: "rbx", val: "arr 시작" },
        { label: "rcx", val: "i" },
        { label: "× 4", val: "원소 크기" },
        { label: "주소", val: "&arr[i]", highlight: true },
      ]} />

      <Callout type="warn" title="⚠️ 어셈블리는 ‘배열 길이’를 모른다">
        <p>
          C의 배열도 사실은 <strong>경계 검사가 없습니다</strong> — <C>arr[5]</C>에 <C>arr[100]</C>을 써도 컴파일러는 통과시킵니다.
          어셈블리에선 그 사실이 더 적나라합니다. <C>{`[rbx + rcx*4]`}</C>는 <C>rcx</C>가 음수든 100만이든 그저 주소를 계산할 뿐 —
          이게 곧 <strong>버퍼 오버플로</strong>가 가능한 이유의 출발점입니다 (4.5에서 본격적으로 다룹니다).
        </p>
      </Callout>

      <h2>2차원 배열 — ‘한 줄을 통째로 건너뛴다’</h2>

      <p>
        C의 <C>{`mat[i][j]`}</C>는 사실 그저 <strong>줄 단위로 나열된 1차원 배열</strong>입니다 — 메모리는 한 줄이니까요.
        <C>{`int mat[3][4]`}</C>라면 4개씩 묶인 줄이 3개 — 총 12개 정수가 일렬로 놓입니다 (이걸 <em>row-major</em> 순서라고 합니다).
        그래서 i번째 줄의 j번째 칸으로 가려면 <em>“줄을 i개 건너뛰고, 줄 안에서 j칸 더 가기”</em>를 계산해야 합니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`int mat[3][4];
int x = mat[i][j];
//     ↑ 의미: *(mat + i*4 + j)`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rbx=&mat, rdi=i, rsi=j)">{`; 한 줄(row) 크기 = 4칸 × 4바이트 = 16바이트
mov  rax, rdi
shl  rax, 4              ; rax = i * 16  (= i*sizeof(row))
add  rax, rbx            ; rax = &mat[i][0]
mov  eax, [rax + rsi*4]  ; x = mat[i][j]`}</CodeBlock>
      </Compare>

      <Callout type="info" title="row-major가 만드는 ‘캐시 친화 패턴’">
        <p>
          <C>{`for(i) for(j) mat[i][j]`}</C>는 <strong>연속된 메모리</strong>를 차례로 읽으므로 캐시에 매우 친화적입니다.
          반대로 <C>{`for(j) for(i) mat[i][j]`}</C>는 매번 한 줄 크기만큼 점프해서 캐시 미스가 폭증 — 같은 결과인데 수십 배 느려질 수 있습니다.
          4.1 최적화 챕터에서 자세히 다룰 주제의 미리보기입니다.
        </p>
      </Callout>

      <h2>구조체 — ‘이름 붙은 오프셋들’</h2>

      <p>
        배열이 ‘<em>같은 크기</em>의 칸들’이라면, 구조체는 <strong>‘서로 다른 크기의 칸들이 정해진 순서로 붙어 있는’</strong> 묶음입니다.
        각 멤버는 <strong>고정된 오프셋</strong>을 가지며, 어셈블리에선 <C>{`[base + offset]`}</C> 패턴으로 접근됩니다.
        <em>이름은 사라지고 숫자만 남는다</em> — 이게 디스어셈블리에서 구조체를 알아보는 첫 단서입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`struct Point {
    int   x;    // offset 0  (4바이트)
    int   y;    // offset 4  (4바이트)
    long  z;    // offset 8  (8바이트)
};              // 합계: 16바이트

struct Point p;
p.x = 10;
p.y = 20;
p.z = 30;
int a = p.x + p.y;`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rbx=&p)">{`; p.x = 10   (offset 0)
mov  DWORD PTR [rbx],     10
; p.y = 20   (offset 4)
mov  DWORD PTR [rbx + 4], 20
; p.z = 30   (offset 8)
mov  QWORD PTR [rbx + 8], 30

; a = p.x + p.y
mov  eax, [rbx]
add  eax, [rbx + 4]`}</CodeBlock>
      </Compare>

      <MemDiagram rows={[
        { addr: "rbx + 0",  width: "30%", color: "var(--accent)",          tag: "x : int",  label: "4바이트" },
        { addr: "rbx + 4",  width: "30%", color: "oklch(0.65 0.12 250)",   tag: "y : int",  label: "4바이트" },
        { addr: "rbx + 8",  width: "60%", color: "oklch(0.6 0.13 30)",     tag: "z : long", label: "8바이트" },
        { addr: "rbx + 16", width: "45%", color: "var(--fg-faint)",        tag: "다음 데이터", label: "구조체 끝" },
      ]} />

      <Callout type="tip" title="<C>p-&gt;x</C>와 <C>p.x</C>의 차이는 어셈블리에서 사라진다">
        <p>
          C 문법에서 <C>p.x</C>(p가 구조체)와 <C>p-&gt;x</C>(p가 포인터)는 다르게 보이지만,
          어셈블리에선 둘 다 <C>{`[base + offset]`}</C> 한 줄로 끝납니다 — 다른 점은 <em>“base를 어떻게 얻었느냐”</em>뿐.
          구조체의 주소를 레지스터에 넣고 나면, 멤버 접근은 모두 같은 패턴입니다.
        </p>
      </Callout>

      <h2>구조체 패딩 — “왜 16바이트인 줄 알았는데 24바이트지?”</h2>

      <p>
        구조체의 크기는 단순히 멤버 크기의 합이 아닙니다. 컴파일러가 성능을 위해 <strong>중간에 빈 바이트를 끼워 넣기</strong> 때문입니다 —
        이걸 <strong>패딩(Padding)</strong>이라고 합니다. 이유는 단 하나, <strong>정렬(Alignment)</strong>.
      </p>

      <DefBox term="정렬 (Alignment)">
        <p>
          CPU가 메모리를 가장 빠르게 읽으려면, <strong>N바이트 데이터는 N의 배수 주소</strong>에 놓여 있어야 합니다.
          4바이트 <C>int</C>는 4의 배수 주소에, 8바이트 <C>long</C>은 8의 배수 주소에 — 이게 ‘자연 정렬(natural alignment)’입니다.
          x86-64는 ‘덜 정렬된’ 접근도 어느 정도 허용하지만 느려지고, SSE 명령(<C>movaps</C> 등)은 아예 정렬을 어기면 즉시 SIGSEGV입니다.
        </p>
      </DefBox>

      <Callout type="warn" title="🔴 같은 멤버, 다른 순서 — 크기가 두 배">
        <p>
          아래 두 구조체는 멤버가 똑같지만 <strong>순서</strong>가 다릅니다. 멤버 크기 합은 둘 다 14바이트.
          그런데 패딩 때문에 한 쪽은 24바이트, 다른 쪽은 16바이트로 끝납니다.
        </p>
      </Callout>

      <Compare>
        <CodeBlock lang="c" filename="❌ 나쁜 배치 — sizeof = 24">{`struct BadLayout {
    char  a;    // offset 0,  1바이트
                // [3바이트 패딩]   ← int 정렬용
    int   b;    // offset 4,  4바이트
    char  c;    // offset 8,  1바이트
                // [7바이트 패딩]   ← long 정렬용
    long  d;    // offset 16, 8바이트
};              // sizeof = 24`}</CodeBlock>
        <CodeBlock lang="c" filename="✅ 좋은 배치 — sizeof = 16">{`struct GoodLayout {
    long  d;    // offset 0,  8바이트
    int   b;    // offset 8,  4바이트
    char  a;    // offset 12, 1바이트
    char  c;    // offset 13, 1바이트
                // [2바이트 패딩]   ← 다음 long 정렬용
};              // sizeof = 16`}</CodeBlock>
      </Compare>

      <MemDiagram rows={[
        { addr: "0",  width: "10%", color: "var(--accent)",          tag: "a",    label: "char" },
        { addr: "1",  width: "30%", color: "var(--fg-faint)",        tag: "pad",  label: "패딩 3바이트" },
        { addr: "4",  width: "30%", color: "oklch(0.65 0.12 250)",   tag: "b",    label: "int" },
        { addr: "8",  width: "10%", color: "var(--accent)",          tag: "c",    label: "char" },
        { addr: "9",  width: "55%", color: "var(--fg-faint)",        tag: "pad",  label: "패딩 7바이트" },
        { addr: "16", width: "60%", color: "oklch(0.6 0.13 30)",     tag: "d",    label: "long" },
      ]} />

      <Callout type="tip" title="‘큰 멤버 먼저’ 한 줄 규칙">
        <p>
          멤버를 <strong>크기 내림차순</strong>으로 배치하면 패딩이 거의 사라집니다 — long(8) → int(4) → short(2) → char(1) 순.
          끝의 패딩은 ‘이 구조체를 배열로 만들 때 다음 원소도 정렬되게’ 하려고 붙는 거라 어쩔 수 없는 경우가 많습니다.
          메모리가 정말 빠듯한 임베디드에선 <C>#pragma pack(1)</C>이나 <C>__attribute__((packed))</C>로 패딩을 강제 제거하기도 하는데,
          속도 손실과 SIGBUS 위험을 감수해야 하는 트레이드오프입니다.
        </p>
      </Callout>

      <Callout type="info" title="구조체의 총 크기도 ‘배수’가 된다">
        <p>
          <C>GoodLayout</C>의 마지막 char 뒤에 패딩 2바이트가 붙은 이유 — 구조체 자체의 정렬은
          <strong>가장 큰 멤버의 정렬</strong>과 같습니다. 여기선 <C>long</C>의 8바이트.
          그래서 <C>sizeof</C>는 항상 그 배수가 됩니다. 13으로 끝나면 안 되고 16이 되어야 하죠.
        </p>
      </Callout>

      <h2>배열 안의 구조체 — 공식의 완전체</h2>

      <p>
        구조체를 배열로 만들면 2.4의 그 한 줄 — <C>{`[base + index*scale + displacement]`}</C> — 의
        네 부분이 한꺼번에 다 쓰입니다. 디스어셈블리에서 가장 자주 만날 패턴입니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C 코드">{`struct Point pts[100];   // 한 칸 = 16바이트
long z = pts[i].z;       // ↑ 구조체 안의 멤버 z`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rbx=&pts, rcx=i)">{`mov  rax, [rbx + rcx*16 + 8]
;             ↑base ↑index ↑scale  ↑displacement(=z의 오프셋)`}</CodeBlock>
      </Compare>

      <FlowDiagram nodes={[
        { label: "base", val: "rbx" },
        { label: "index", val: "rcx" },
        { label: "× scale", val: "× 16 (sizeof)" },
        { label: "+ disp", val: "+ 8 (z 오프셋)", highlight: true },
      ]} />

      <Callout type="warn" title="⚠️ scale은 1·2·4·8만 — 그럼 16은 어디서?">
        <p>
          x86-64의 scale은 <strong>1, 2, 4, 8 네 가지만</strong> 가능합니다. 그래서 16바이트 구조체 배열을
          한 줄로 인덱싱하려면 <em>scale 8 + index를 2배로</em> 같은 트릭을 쓰거나, 별도의 <C>imul</C> / <C>shl</C>로 곱셈을 해야 합니다.
          Ghidra/IDA에서 <C>{`shl rcx, 4`}</C>(= ×16) 뒤에 <C>{`[rbx + rcx + 8]`}</C> 같은 패턴이 보이면 “구조체 배열 인덱싱이구나”라고 읽으세요.
        </p>
      </Callout>

      <h2>리버싱 관점 — 구조체를 ‘거꾸로 복원하기’</h2>

      <p>
        디스어셈블리에서 <C>{`[rbx + 8]`}</C>, <C>{`[rbx + 16]`}</C>, <C>{`[rbx + 24]`}</C> 같은 접근이
        같은 함수에서 반복적으로 나타난다면 — 그건 <strong>구조체</strong>입니다.
        오프셋 패턴을 모으면 구조체의 모습이 거꾸로 떠오릅니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>관찰한 접근 패턴</th><th>유력한 해석</th><th>복원</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">mov eax, [rbx]<br/>mov ecx, [rbx+4]</td><td>오프셋 0, 4 — 둘 다 4바이트(eax/ecx)</td><td className="mono">struct {`{`} int a; int b; {`}`}</td></tr>
            <tr><td className="mono">mov rax, [rbx+8]</td><td>오프셋 8, 8바이트(rax)</td><td className="mono">+ long c;</td></tr>
            <tr><td className="mono">movzx eax, BYTE PTR [rbx+16]</td><td>오프셋 16, 1바이트</td><td className="mono">+ char d;</td></tr>
            <tr><td className="mono">mov rax, [rbx + rcx*24]</td><td>scale로 24 → shl 후 add 형태</td><td>위 구조체의 <strong>배열</strong></td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="✅ Ghidra/IDA의 무기 — Data Type Manager">
        <p>
          리버싱 도구에는 ‘이 주소부터 N바이트는 이런 구조체’라고 알려주는 기능이 있습니다 — Ghidra의 <strong>Data Type Manager</strong>,
          IDA의 <strong>Structures</strong>. 추정한 구조체를 등록해 두면 디스어셈블리에 <C>{`[rbx+8]`}</C> 대신
          <C>p-&gt;z</C> 같은 멤버 이름으로 보여줍니다. <em>패딩까지 정확히 입력</em>해야 뒤따르는 멤버 오프셋이 어긋나지 않으니,
          이 챕터의 정렬 규칙은 도구를 다룰 때 곧장 무기가 됩니다.
        </p>
      </Callout>

      <h2>특수 케이스 — 비트필드, 유니온, 가변 배열</h2>

      <Callout type="info" title="① 비트필드 (Bitfield)">
        <p>
          <C>{`struct { unsigned a:3; unsigned b:5; };`}</C> 처럼 1바이트 안에 여러 멤버를 비트 단위로 끼워넣는 문법입니다.
          어셈블리에선 멤버 하나를 읽고 쓸 때마다 <C>{`shr/and/or`}</C> 같은 비트 연산이 동반되어 알아보기가 쉽습니다 — 그게 곧 비트필드의 서명입니다.
        </p>
      </Callout>

      <Callout type="info" title="② 유니온 (Union)">
        <p>
          모든 멤버가 <strong>같은 오프셋(0)을 공유</strong>합니다. 어셈블리에선 그냥 “같은 메모리를 다른 타입으로 해석한다”로만 보입니다 —
          멤버 이름은 사라지고 오프셋 0의 데이터를 <C>eax</C>로 읽었느냐 <C>al</C>로 읽었느냐가 유니온의 흔적입니다.
        </p>
      </Callout>

      <Callout type="info" title="③ 가변 배열 / flexible array member">
        <p>
          <C>{`struct Pkt { int len; char data[]; };`}</C> 같은 마지막 멤버가 “0길이 배열”인 패턴입니다.
          <C>malloc(sizeof(Pkt) + N)</C>으로 잡고 <C>pkt-&gt;data[i]</C>로 접근 — 네트워크 패킷 파서에서 자주 보입니다.
          어셈블리에선 그냥 ‘구조체 끝 + 오프셋’의 일반적인 인덱싱으로 보입니다.
        </p>
      </Callout>

      <Summary items={[
        "배열은 ‘같은 크기 칸의 연속’. 어셈블리에선 [base + index*scale]. scale 값(1·2·4·8)이 곧 원소 크기.",
        "C에는 배열 경계 검사가 없다 — 어셈블리에선 그게 더 적나라하게 드러난다. 4.5 버퍼 오버플로의 출발점.",
        "2차원 배열은 row-major 1차원. mat[i][j] = base + i*row_size + j*elem_size. 캐시 친화 순서가 성능을 가른다.",
        "구조체는 ‘이름 붙은 오프셋들’의 묶음. 어셈블리에선 [base + offset]. 이름은 사라지고 오프셋만 남는다.",
        "패딩은 정렬을 위해 컴파일러가 끼워넣는 빈 바이트. ‘큰 멤버 먼저’ 배치하면 패딩이 거의 사라진다.",
        "scale은 1·2·4·8뿐 — 16/24/32 짜리 구조체 배열은 shl이나 imul로 곱한 뒤 인덱싱한다. 디스어셈블리의 흔한 패턴.",
        "리버싱 팁: [rbx], [rbx+4], [rbx+8] ... 의 반복 = 구조체. 오프셋 패턴을 모으면 구조체가 거꾸로 떠오른다. 패딩까지 정확히 복원해야 도구가 멤버를 맞춰준다.",
      ]} />
    </article>
  );
}

window.P3C3 = P3C3;
