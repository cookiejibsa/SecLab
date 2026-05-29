// Part 3 · 3.4 문자열 조작 명령어
function P3C4() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 3 · Chapter 3.4"
        title="문자열 조작 명령어"
        subtitle="x86엔 ‘바이트 묶음(=문자열·메모리 블록)을 한 번에 다루는’ 전용 명령어가 따로 있습니다. memcpy, memset, strlen 같은 함수가 내부에서 이걸 쓰고, 디스어셈블리에서 가장 압축적이고 강력한 한 줄짜리 패턴들이 여기서 나옵니다."
      />

      <p>
        3.3에서 배열·구조체가 결국 <strong>‘메모리 위 연속된 바이트 블록’</strong>이라는 걸 봤습니다.
        그렇다면 ‘한 블록을 다른 블록으로 통째로 복사’하거나 ‘블록을 0으로 통째로 채우거나’ ‘블록 안에서 0을 찾는’ 식의
        반복 작업도 굉장히 흔하겠죠 — 실제로 <C>memcpy</C>, <C>memset</C>, <C>strlen</C>이 그 작업입니다.
        x86은 이런 일을 위해 <em>거의 한 줄짜리 전용 명령어</em>를 가지고 있습니다. 이 챕터에선 그 패턴들을 ‘리버싱에서 바로 알아볼 수 있도록’ 익힙니다.
      </p>

      <Callout type="note" title="📌 memcpy / memset / strlen — 한 줄씩만">
        <p>
          <strong><C>memcpy(dst, src, n)</C></strong> — <C>src</C>의 <C>n</C>바이트를 <C>dst</C>에 복사. C 라이브러리에서 가장 자주 쓰이는 함수 중 하나.<br/>
          <strong><C>memset(ptr, val, n)</C></strong> — <C>ptr</C>부터 <C>n</C>바이트를 모두 <C>val</C>로 채움. 흔히 0으로 초기화할 때.<br/>
          <strong><C>strlen(s)</C></strong> — 문자열 <C>s</C>에서 <strong>널 종단자(<C>\0</C>)가 나올 때까지의 바이트 수</strong>를 셈.
        </p>
      </Callout>

      <h2>주역 셋 — RSI · RDI · DF</h2>

      <p>
        문자열 명령어들은 모두 <strong>고정된 레지스터 두 개와 한 플래그</strong>를 씁니다.
        이 셋의 역할만 외워두면 나머지 명령어는 ‘응용’입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>이름</th><th>역할</th><th>외우기</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">rsi</td><td><strong>Source</strong> Index — 읽을 곳의 주소</td><td><em>S</em> = Source</td></tr>
            <tr><td className="mono">rdi</td><td><strong>Destination</strong> Index — 쓸 곳의 주소</td><td><em>D</em> = Destination</td></tr>
            <tr>
              <td className="mono">DF</td>
              <td>방향 플래그 — 0이면 주소 <strong>증가</strong>, 1이면 <strong>감소</strong></td>
              <td><C>cld</C>=clear(↑), <C>std</C>=set(↓)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="이름이 단서다 — “SI는 Source, DI는 Destination”">
        <p>
          2.2에서 봤듯 <C>rsi</C>·<C>rdi</C>는 호출 규약에선 그냥 ‘1·2번째 인수 자리’지만, 본래 이름엔 의미가 있습니다.
          <C>SI</C>(Source Index), <C>DI</C>(Destination Index) — 인텔이 8086 시절 <em>문자열 명령용으로</em> 정해둔 역할이고,
          그 이름이 64비트 시대까지 그대로 남아 있습니다.
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ DF는 거의 항상 0이지만 ‘가정’은 위험">
        <p>
          System V ABI는 <strong>함수 진입/리턴 시 DF=0</strong>을 요구합니다 — 즉 “기본은 증가 방향”.
          그래서 어셈블리에서 문자열 명령을 쓰기 전에 보통 <C>cld</C> 한 줄로 보장해 두는 게 관례입니다.
          본인이 <C>std</C>를 썼다면 <strong>리턴 전에 반드시 <C>cld</C>로 되돌려야</strong> 다음 함수에서 라이브러리가 꼬이지 않습니다.
        </p>
      </Callout>

      <h2>한 원소 명령 — MOVS · STOS · LODS · SCAS · CMPS</h2>

      <p>
        다섯 명령은 모두 <strong>“한 원소를 처리하고 <C>rsi</C>/<C>rdi</C>를 한 칸 옮긴다”</strong>는 공통 골격을 가집니다.
        끝의 글자 <C>b</C>/<C>w</C>/<C>d</C>/<C>q</C>는 한 번에 다루는 바이트 수입니다.
      </p>

      <Callout type="note" title="📌 접미사 b · w · d · q">
        <p>
          <strong>b</strong> = byte (1바이트), <strong>w</strong> = word (2바이트),
          <strong> d</strong> = dword (4바이트), <strong>q</strong> = qword (8바이트).
          <C>movsb</C>는 1바이트씩, <C>movsq</C>는 8바이트씩 복사합니다.
        </p>
      </Callout>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>명령어</th><th>동작 (DF=0 가정)</th><th>대응되는 C</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">movsb</td><td className="mono">[rdi] = [rsi]; rsi++; rdi++;</td><td><C>{`*dst++ = *src++;`}</C></td></tr>
            <tr><td className="mono">stosb</td><td className="mono">[rdi] = al; rdi++;</td><td><C>{`*dst++ = val;`}</C></td></tr>
            <tr><td className="mono">lodsb</td><td className="mono">al = [rsi]; rsi++;</td><td><C>{`val = *src++;`}</C></td></tr>
            <tr><td className="mono">scasb</td><td className="mono">cmp al, [rdi]; rdi++;</td><td>찾기 한 칸</td></tr>
            <tr><td className="mono">cmpsb</td><td className="mono">cmp [rsi], [rdi]; rsi++; rdi++;</td><td>비교 한 칸</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="패턴은 단 하나 — ‘읽거나 쓴 뒤 포인터 자동 증가’">
        <p>
          이게 ‘<C>p++</C>로 다음 칸 가기’ 한 줄을 명령어 안에 통합해 둔 것입니다.
          그래서 명시적인 <C>{`add rsi, 1`}</C>가 보이지 않는데도 다음 줄에서 <C>rsi</C>가 한 칸 옮겨져 있는,
          처음 보면 다소 ‘마법 같은’ 디스어셈블리가 나옵니다.
        </p>
      </Callout>

      <h2>REP — “이걸 rcx번 반복해라” 접두사</h2>

      <DefBox term="REP 접두사" en="Repeat Prefix">
        <p>
          <strong>접두사(prefix)</strong>는 명령어 앞에 붙여서 그 동작을 수정하는 특수 바이트입니다.
          <C>rep</C>는 뒤에 오는 명령어를 <C>rcx</C>번 반복합니다 — 매 반복마다 <C>rcx</C>를 1 감소시키고, 0이 되면 멈춥니다.
        </p>
        <p style={{marginTop: 8}}>
          변형이 두 개 더 있습니다 —
          <strong> <C>repe</C>/<C>repz</C></strong>(ZF=1인 <em>동안</em> 반복, ZF=0이면 즉시 중단),
          <strong> <C>repne</C>/<C>repnz</C></strong>(ZF=0인 동안 반복).
          두 변형은 비교 명령(<C>scas</C>/<C>cmps</C>)과만 의미 있게 짝지어집니다.
        </p>
      </DefBox>

      <FlowDiagram nodes={[
        { label: "조건", val: "rcx > 0 ?" },
        { label: "실행", val: "한 원소 처리" },
        { label: "갱신", val: "rcx--, rsi/rdi±" },
        { label: "반복", val: "다시 조건", highlight: true },
      ]} />

      <h2>memcpy = <C>rep movsb</C> — 한 줄짜리 복사</h2>

      <Compare>
        <CodeBlock lang="c" filename="C: memcpy 호출">{`memcpy(dst, src, 1024);  // dst에 src의 1024바이트 복사`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (인라인 구현)">{`    mov  rdi, dst     ; 목적지
    mov  rsi, src     ; 출처
    mov  rcx, 1024    ; 개수
    cld               ; DF=0 (증가 방향)
    rep movsb         ; [rdi++] = [rsi++], rcx회`}</CodeBlock>
      </Compare>

      <Callout type="info" title="‘바이트 단위 movsb’가 정말 느리지 않나?">
        <p>
          예전엔 <C>rep movsq</C>(8바이트씩)가 8배 빨랐습니다. 하지만 최근 인텔/AMD CPU는
          <strong> ERMS(Enhanced REP MOVSB)</strong>·<strong>FSRM(Fast Short REP MOV)</strong> 기능을 가지고 있어
          <C>rep movsb</C> 한 줄을 <em>내부적으로 캐시 라인 단위(64바이트)로 묶어 처리</em>합니다.
          그래서 glibc도 큰 복사에 <C>rep movsb</C>를 그대로 씁니다. 짧은 복사엔 SIMD가 더 빠를 수 있지만, 일반적인 경우엔 충분히 빠릅니다.
        </p>
      </Callout>

      <h2>memset = <C>rep stosb</C> — 한 줄짜리 채우기</h2>

      <Compare>
        <CodeBlock lang="c" filename="C: memset 호출">{`memset(buf, 0, 256);     // buf의 256바이트를 0으로`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리">{`    mov  rdi, buf
    xor  eax, eax     ; al = 0 (실제론 eax 전체 0)
    mov  rcx, 256
    cld
    rep stosb         ; [rdi++] = al, rcx회`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="‘큰 0-초기화’의 정형 패턴">
        <p>
          C에서 <C>{`memset(arr, 0, N)`}</C>이나 <C>{`int arr[1000] = {0};`}</C>는 거의 항상 <C>rep stosb</C> 또는 <C>rep stosq</C>로 컴파일됩니다.
          디스어셈블리에서 <C>{`xor eax, eax; mov ecx, N; rep stos`}</C> 패턴을 보면 — <em>“이건 0으로 초기화하는 코드구나”</em>로 즉시 읽으세요.
        </p>
      </Callout>

      <h2>strlen = <C>repne scasb</C> — 한 줄짜리 ‘0 찾기’의 트릭</h2>

      <p>
        <C>strlen</C>은 “문자열에서 첫 0을 찾으면 그 위치 − 시작 위치 = 길이” 라는 단순한 공식인데,
        x86은 이걸 <strong>한 줄로 끝내는</strong> 우아하지만 처음엔 헷갈리는 패턴을 가지고 있습니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C: strlen 구현">{`size_t strlen(const char *s) {
    const char *p = s;
    while (*p != '\\0') p++;
    return p - s;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (rdi = s)">{`strlen:
    mov  rcx, -1         ; 최대 길이 = 0xFFFF...F (가장 큰 수)
    xor  al, al          ; al = 0 (찾을 값 = 널 문자)
    cld                  ; DF = 0 (증가 방향)
    repne scasb          ; al ≠ [rdi]인 동안 반복
                         ; → 매번 rcx--, rdi++
                         ; → '0'을 만나면 멈춤
    not  rcx             ; rcx = ~rcx
    dec  rcx             ; rcx -= 1 (널 문자 자리 빼기)
    mov  rax, rcx
    ret`}</CodeBlock>
      </Compare>

      <Callout type="info" title="-1, not, dec — 이 트릭의 정체">
        <p>
          처음엔 “왜 -1로 시작하지?”가 의아합니다. 정리해보면 —
        </p>
        <ol>
          <li><C>rcx</C>를 <strong>매우 큰 수(0xFFFF...F)</strong>로 시작 → <C>repne</C>가 <em>“길이 제한이 사실상 무한”</em>인 양 돌게 함.</li>
          <li>매 반복마다 <C>rcx--</C>. 길이 <C>L</C>짜리 문자열이라면 ‘0을 찾을 때까지’ <strong>L+1번</strong> 비교(0 자체도 비교됨)하고 멈춥니다. 그러면 <C>rcx = -1 - (L+1) = -(L+2)</C>.</li>
          <li><C>not rcx</C> = <C>-rcx - 1</C> = <C>(L+2) - 1</C> = <C>L+1</C>. 한 끗 모자라죠.</li>
          <li><C>dec rcx</C>로 마지막 1을 빼서 <C>L</C> — 진짜 길이.</li>
        </ol>
        <p>
          한 번에 와닿지 않는 게 정상입니다. 핵심만 잡으면 됩니다 —
          <strong>‘0을 만나면 멈추는 반복 + 음수 거리로 길이 역산’</strong>.
        </p>
      </Callout>

      <Callout type="warn" title="⚠️ glibc는 실제로 이걸 쓰지 않는다">
        <p>
          위 코드는 ‘교과서적’ <C>strlen</C> 구현입니다. 실제 glibc의 <C>strlen</C>은 SSE/AVX의 SIMD 명령으로
          <strong>16/32바이트를 한 번에 비교</strong>해 5~10배 빠릅니다 (4.2 SIMD에서 다룹니다).
          그래도 <C>repne scasb</C> 패턴은 인라인 어셈블리·임베디드·소형 바이너리에서 흔히 만나니 읽을 수 있어야 합니다.
        </p>
      </Callout>

      <h2>memcmp = <C>repe cmpsb</C> — 두 블록 비교</h2>

      <Compare>
        <CodeBlock lang="c" filename="C: memcmp 호출">{`int r = memcmp(a, b, 64); // 64바이트 비교 (같으면 0)`}</CodeBlock>
        <CodeBlock lang="asm" filename="어셈블리 (간략화)">{`    mov  rsi, a
    mov  rdi, b
    mov  rcx, 64
    cld
    repe cmpsb           ; [rsi]==[rdi]인 동안 반복
                         ; → 첫 차이 발견 시 멈춤
    ; ZF로 결과 확인 가능 (같으면 ZF=1)`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="‘rep / repe / repne’ — 한 줄 구분">
        <p>
          <strong><C>rep</C></strong>: 단순 N번 반복 (조건 없음). <em>복사·채우기</em>에 쓴다 — <C>movs</C>·<C>stos</C>.<br/>
          <strong><C>repe</C></strong> (=repz): <em>같은 동안</em> 반복. <em>“언제 처음 다르냐”</em>를 찾을 때 — <C>cmps</C> + <em>memcmp</em>.<br/>
          <strong><C>repne</C></strong> (=repnz): <em>다른 동안</em> 반복. <em>“언제 처음 같냐”</em>를 찾을 때 — <C>scas</C> + <em>strlen / memchr</em>.
        </p>
      </Callout>

      <h2>한눈 패턴표 — 디스어셈블리에서 즉시 알아보기</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>본 적 있는 패턴</th><th>읽는 법</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">rep movsb (또는 movsq)</td><td><strong>memcpy</strong> — rsi→rdi로 rcx바이트 복사</td></tr>
            <tr><td className="mono">xor eax, eax; rep stosb</td><td><strong>memset(_, 0, n)</strong> — 0으로 초기화</td></tr>
            <tr><td className="mono">mov al, val; rep stosb</td><td><strong>memset(_, val, n)</strong></td></tr>
            <tr><td className="mono">repne scasb (+ not / dec rcx)</td><td><strong>strlen</strong> — 0을 찾으면 길이</td></tr>
            <tr><td className="mono">repne scasb (al = 임의 값)</td><td><strong>memchr</strong> — 그 값을 찾기</td></tr>
            <tr><td className="mono">repe cmpsb</td><td><strong>memcmp / strcmp</strong> — 첫 차이 찾기</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="이 패턴을 ‘함수처럼’ 묶어서 읽어라">
        <p>
          리버싱에서 <C>rep movsb</C> 한 줄을 보면 <em>그 줄 전체를 <C>memcpy(rdi, rsi, rcx)</C> 한 줄로 머릿속에서 치환</em>하는 게 정석입니다.
          그러면 함수의 ‘의도’가 보이지, 디스어셈블리의 한 줄에 묶이지 않게 됩니다. Ghidra/IDA의 디컴파일러도 이 패턴들을 인식해서
          C 함수 호출처럼 보여줍니다.
        </p>
      </Callout>

      <h2>최신 CPU에선 어떻게 처리되나? — ERMS · FSRM</h2>

      <p>
        “바이트 한 개씩 옮기는 <C>rep movsb</C>가 정말 느리지 않을까?” — 옛날엔 그랬습니다. 그래서 한동안 컴파일러는 짧은 복사엔 인라인 SIMD,
        긴 복사엔 <C>rep movsq</C>(8바이트씩)를 선호했죠. 하지만 인텔이 두 가지 마이크로아키텍처 기능을 추가했습니다.
      </p>

      <KeyPoint n={1}>
        <strong>ERMS (Enhanced REP MOVSB)</strong> — Ivy Bridge 이후. <C>rep movsb</C>를 만나면 CPU가 내부적으로
        <strong>캐시 라인(64바이트) 단위로 묶어 처리</strong>합니다. 즉 ‘바이트 단위’는 명세상 그렇게 보일 뿐, 실제론 훨씬 큰 단위로 옮깁니다.
      </KeyPoint>

      <KeyPoint n={2}>
        <strong>FSRM (Fast Short REP MOV)</strong> — Ice Lake 이후. ERMS가 작은 복사에선 오버헤드가 컸던 문제를 보완해,
        몇 바이트짜리 짧은 복사도 빠르게 처리합니다. 덕분에 현대 glibc는 거의 모든 복사를 <C>rep movsb</C>로 통일했습니다.
      </KeyPoint>

      <Callout type="warn" title="⚠️ 그래도 ‘아주 큰 블록’엔 SIMD가 이긴다">
        <p>
          NT-store(non-temporal store)나 AVX-512를 적극 활용한 SIMD 복사는 <strong>캐시 오염을 피하면서</strong> GB 단위 복사를 처리합니다.
          그래서 OS의 <C>copy_user</C> 같은 핫패스는 여전히 SIMD 기반이고, 일반 코드에서만 <C>rep movsb</C>가 표준입니다.
          “언제 SIMD가 더 좋은가?”는 4.2에서 다룹니다.
        </p>
      </Callout>

      <h2>주의사항 — 손으로 쓸 때 자주 하는 실수</h2>

      <Callout type="warn" title="① cld를 빠뜨림 — 방향이 거꾸로 돈다">
        <p>
          이전 함수가 <C>std</C>를 켜둔 상태로 리턴했거나, 시그널 핸들러에서 DF가 1로 바뀌었을 수 있습니다.
          문자열 명령 직전에 <C>cld</C> 한 줄 — 비용 없는 보험입니다.
        </p>
      </Callout>

      <Callout type="warn" title="② 메모리 영역이 겹치면 movsb는 망가진다">
        <p>
          <C>memcpy</C>는 <em>겹치지 않음(non-overlapping)</em>이 전제 — 겹치면 <C>memmove</C>를 써야 합니다.
          <C>rep movsb</C>도 마찬가지로, <C>dst</C>가 <C>src</C>보다 뒤쪽에 있을 때는 결과가 깨집니다.
          이때는 DF=1로 뒤에서부터 거꾸로 복사하거나, 그냥 <C>memmove</C>를 호출하세요.
        </p>
      </Callout>

      <Callout type="warn" title="③ rcx를 안 세팅하고 rep만 쓰면 — 임의 길이 폭주">
        <p>
          <C>rep</C>는 <C>rcx = 0</C>이면 <em>아무 일도 안 하지만</em>, 쓰레기 값이 들어 있으면 <strong>억 단위 반복</strong>이 됩니다.
          순식간에 메모리 보호 영역까지 침범해 SIGSEGV. 디스어셈블리에서 <C>rep</C> 직전엔 항상 <C>mov rcx, …</C>가 있어야 정상입니다.
        </p>
      </Callout>

      <Summary items={[
        "문자열 명령의 세 주역: rsi(Source) · rdi(Destination) · DF(방향, cld=↑/std=↓).",
        "한 원소 명령 5종 — movs(복사), stos(쓰기), lods(읽기), scas(검색), cmps(비교). 끝의 b/w/d/q가 한 번에 다루는 크기.",
        "REP 접두사로 rcx번 반복. rep(단순 반복), repe(같은 동안), repne(다른 동안) 세 종류.",
        "memcpy = rep movsb, memset = mov al,v + rep stosb, strlen = repne scasb + not/dec, memcmp = repe cmpsb.",
        "현대 CPU(Ivy Bridge+ ERMS, Ice Lake+ FSRM)는 rep movsb를 내부에서 캐시라인 단위로 가속 — 더 이상 ‘느린 명령’ 아님.",
        "그래도 거대 블록 복사·캐시 회피 복사엔 SIMD가 이긴다 — glibc strlen/memcpy의 핫패스는 SIMD (4.2 미리보기).",
        "리버싱에선 rep 패턴을 ‘함수 호출처럼 묶어’ 읽기 — rep movsb 한 줄을 ‘memcpy(...)’ 한 줄로 머릿속 치환.",
        "주의 3종: ① cld 빠뜨리지 말기 ② 겹치는 영역엔 movsb 금지 → memmove ③ rcx 안 세팅하면 폭주.",
      ]} />
    </article>
  );
}

window.P3C4 = P3C4;
