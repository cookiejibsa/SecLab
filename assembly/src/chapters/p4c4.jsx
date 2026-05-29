// Part 4 · 4.4 리버싱 기법
function P4C4() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 4 · Chapter 4.4"
        title="리버스 엔지니어링 실전 기법"
        subtitle="4.1~4.3에서 모은 패턴들을 ‘실제 바이너리’ 앞에 풀어놓는 챕터. 도구 선택, 분석 순서, 동·정적 분석을 엮는 작업 흐름까지 — 처음 바이너리를 받았을 때 무엇부터 보는지를 정리합니다."
      />

      <p>
        리버싱은 ‘어셈블리를 읽는 기술’이라기보다 <strong>‘무엇부터 볼지’를 정하는 기술</strong>에 가깝습니다.
        같은 바이너리도 5분 만에 핵심 함수에 도달하기도 하고, 한 시간을 길을 잃기도 합니다.
        차이는 분석 순서와 도구 사용법 — 이 챕터의 주제입니다.
      </p>

      <h2>정적 vs 동적 — 두 시야를 번갈아 쓴다</h2>

      <DefBox term="정적 분석" en="Static Analysis">
        <p>
          프로그램을 <strong>실행하지 않고</strong> 코드와 데이터만 들여다보는 방식입니다.{" "}
          <KeyTerm term="Ghidra: NSA(미국 국가안보국)가 개발하고 오픈소스로 공개한 무료 리버싱 도구. 디스어셈블러 + 디컴파일러가 통합돼 있어 IDA Pro에 필적하는 기능을 무료로 제공합니다.">
            Ghidra
          </KeyTerm>
          {" "}나{" "}
          <KeyTerm term="IDA Pro(Interactive Disassembler Professional): 리버싱 업계 표준 도구. 매우 강력하지만 라이선스가 비쌉니다. 기능이 제한된 IDA Free 버전도 있습니다.">
            IDA Pro
          </KeyTerm>
          로 디스어셈블/디컴파일해서 전체 흐름을 그립니다. 빠르고 전역적이지만,{" "}
          <KeyTerm term="난독화(Obfuscation): 코드를 분석하기 어렵게 만드는 기술. 의미 없는 명령어 삽입, 암호화된 코드, 가짜 함수 이름, 자가 수정 코드 등이 있고 — 악성코드와 DRM 소프트웨어가 자주 씁니다.">
            난독화
          </KeyTerm>
          나 런타임에 만들어지는 코드 앞에서는 막히기 쉽습니다.
        </p>
      </DefBox>

      <DefBox term="동적 분석" en="Dynamic Analysis">
        <p>
          프로그램을 <strong>실제로 실행하면서</strong> 레지스터·메모리·시스템 콜을 관찰합니다.{" "}
          <KeyTerm term="GDB(GNU Debugger): Linux/macOS의 표준 무료 디버거. 소스 없이도 어셈블리 레벨에서 분석 가능. pwndbg/GEF 플러그인을 얹으면 더 강력해집니다.">
            GDB
          </KeyTerm>
          ,{" "}
          <KeyTerm term="x64dbg: Windows용 무료 오픈소스 디버거. GUI 기반으로 초보자가 쓰기 편하고, 32비트용 x32dbg가 함께 설치됩니다.">
            x64dbg
          </KeyTerm>
          {" "}로{" "}
          <KeyTerm term="브레이크포인트(Breakpoint): 프로그램 실행을 특정 위치에서 일시 정지시킵니다. GDB에선 `break *0x401234`나 `break main`. 정지 후 레지스터/메모리 값을 확인하고 한 명령어씩 진행할 수 있습니다.">
            브레이크포인트
          </KeyTerm>
          를 걸고 값을 들여다보는 식이죠. 진짜로 실행돼야만 확인되는 것들 — 암호화 키, 안티디버깅 우회 후의 코드, 입력에 따른 분기 — 을 잡아냅니다.
        </p>
      </DefBox>

      <Callout type="info" title="실전에선 ‘정적 → 동적 → 정적’의 핑퐁">
        <p>
          정적 분석으로 <strong>지도를 만들고</strong>, 막히는 자리에서 <strong>동적으로 한 점을 찍어</strong> 값을 확인한 뒤, 다시 정적 분석으로 돌아와
          그 지점에 ‘여기 입력값이 들어옴’ 식으로 주석을 답니다. 좋은 리버서는 이 두 시야를 5분 단위로 오갑니다 — 하나만 고집하면 거의 항상 길을 잃어요.
        </p>
      </Callout>

      <h2>Ghidra로 첫 5분 — 지도 만들기</h2>

      <ol style={{ paddingLeft: 22, margin: "16px 0" }}>
        <li style={{ marginBottom: 12 }}>
          <strong>프로젝트 생성 + 바이너리 임포트</strong> — File → New Project → Non-Shared → 이름.
          그다음 File → Import File로 바이너리를 끌어옵니다.{" "}
          <KeyTerm term="ELF(Executable and Linkable Format): Linux/Unix가 사용하는 실행 파일 형식. Windows의 PE(.exe/.dll)에 대응합니다. 셸에서 `file ./binary`로 종류와 아키텍처를 확인할 수 있습니다.">
            ELF
          </KeyTerm>
          ,{" "}
          <KeyTerm term="PE(Portable Executable): Windows의 실행 파일 형식. .exe(실행파일), .dll(동적 라이브러리), .sys(드라이버)가 모두 PE.">
            PE
          </KeyTerm>
          , Mach-O(macOS) 모두 지원합니다.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>자동 분석 실행</strong> — “Analyze Now?” → 기본값 OK. 수십 초 정도. 함수 자동 인식, 심볼 복구, 문자열 추출이 이때 일어납니다.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>
            <KeyTerm term="Symbol Tree(심볼 트리): Ghidra 왼쪽 패널. 프로그램 안의 함수, 레이블, 네임스페이스 목록을 보여줍니다. 이름이 벗겨진 바이너리에선 FUN_00401234 같은 자동 생성 이름으로 표시됩니다.">
              Symbol Tree
            </KeyTerm>
            에서 함수 탐색
          </strong>{" "}
          — 좌측 Symbol Tree → Functions 폴더. <C>main</C>이 보이면 더블클릭. 없으면 <C>_start</C> 또는 <C>entry</C>에서 시작해 <C>main</C>으로 들어가는 <C>call</C>을 따라갑니다.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>
            <KeyTerm term="Decompiler 창: Ghidra 우측 패널. 선택한 함수를 C 유사 코드로 자동 변환해 보여줍니다. 100% 정확하지는 않지만 어셈블리를 직접 읽는 것보다 훨씬 빠르고, 변수/타입을 직접 고쳐가며 분석할 수 있습니다.">
              Decompiler
            </KeyTerm>
            로 흐름 잡기
          </strong>{" "}
          — 우측 Decompiler 패널에서 C 유사 코드를 봅니다. 변수/함수 이름은 직접 편집 가능(<C>L</C> 키 = 이름 변경, <C>Y</C> 키 = 타입 변경) — 알게 된 정보를 그 자리에 즉시 기록해두는 게 핵심.
        </li>
        <li style={{ marginBottom: 12 }}>
          <strong>문자열 → 로직 역추적</strong> — Search → For Strings → <C>"password"</C>, <C>"flag"</C>, <C>"correct"</C>, <C>"Wrong"</C> 등을 검색.
          결과를 더블클릭해 위치로 점프하고, 우클릭 → References → Show References to로 그 문자열을 <em>사용하는 함수</em>를 한 번에 찾습니다.
        </li>
      </ol>

      <Callout type="tip" title="✅ ‘문자열 → 참조’가 가장 빠른 진입점">
        <p>
          소형 바이너리(<C>CTF</C> 문제, 작은 유틸리티, 라이선스 체크)는 거의 항상 <strong>유의미한 문자열이 핵심 로직 가까이</strong>에 있습니다.
          “비밀번호가 틀렸습니다” 같은 메시지를 찾아 그 참조를 따라 올라가면, 곧장 검증 로직 한가운데로 떨어집니다 — 5분 만에 분석의 절반이 끝나는 자리.
        </p>
      </Callout>

      <h2>GDB — 동적 분석의 표준</h2>

      <p>
        리눅스 바이너리 동적 분석은 사실상 GDB로 통일돼 있습니다. 명령어가 많지만 실전에서 쓰는 건 한 줌입니다 — 아래가 그 한 줌이에요.
      </p>

      <CodeBlock lang="text" filename="gdb — 가장 자주 쓰는 명령어">{`# ── 시작 ──
gdb ./program                    # 프로그램 로드
gdb -p 1234                      # 실행 중 프로세스에 attach
gdb --args ./prog arg1 arg2      # 인자와 함께 실행

# ── 설정 (권장 — ~/.gdbinit에 넣어두면 좋음) ──
set disassembly-flavor intel     # Intel 문법으로 보기 (AT&T 디폴트 회피)
set pagination off               # 화면 멈춤 비활성화

# ── 실행 제어 ──
run (r)         # 프로그램 시작
continue (c)    # 다음 브레이크포인트까지 계속
next (n)        # 소스 한 줄 (함수 안 들어감)
nexti (ni)      # 어셈블리 한 명령어 (함수 안 들어감)
step (s)        # 소스 한 줄 (함수 내부로)
stepi (si)      # 어셈블리 한 명령어 (함수 내부로)
finish          # 현재 함수가 ret할 때까지 실행
kill            # 프로세스 종료

# ── 브레이크포인트 ──
break main                       # 함수 이름
break *0x401234                  # 정확한 주소 (* 필수)
break *main + 0x20               # 함수 시작에서 0x20 오프셋
watch *0x601000                  # 해당 주소 값이 바뀌면 정지 (하드웨어 BP)
info breakpoints                 # 목록
delete 1                         # 1번 삭제
disable 2                        # 2번 비활성화 (삭제 X)

# ── 레지스터/메모리 조회 ──
info registers                   # 모든 레지스터
print $rax                       # 단일 ($는 레지스터 의미)
print/x $rax                     # 16진수로

x/16xb $rsp                      # rsp부터 16바이트 (헥스)
x/8xg $rsp                       # rsp부터 8개 qword (64비트)
x/s 0x402000                     # 해당 주소의 NUL-종료 문자열
x/20i $rip                       # rip부터 20개 명령어 디스어셈블
x/20i main                       # main 함수 디스어셈블

# ── 값 수정 (패치 / 우회) ──
set $rax = 0                     # 레지스터
set *((int*)0x601020) = 42       # 메모리 (캐스팅 필수)

# ── 디스어셈블 ──
disassemble main                 # 함수 전체
disassemble $rip,+50             # 현재 위치부터 50바이트`}</CodeBlock>

      <Callout type="note" title="📌 하드웨어 vs 소프트웨어 브레이크포인트">
        <p>
          일반 <C>break</C>는 코드의 해당 위치 1바이트를 <C>0xCC</C>(INT3 명령)로 바꿔서 정지시킵니다 —{" "}
          <KeyTerm term="소프트웨어 브레이크포인트(Software Breakpoint): CPU가 INT3(0xCC) 명령을 만나면 디버거에 트랩이 걸리는 구조. 디버거가 원래 바이트를 기억해두고 그 자리에 0xCC를 심어두는 것. 코드를 수정하므로 자기 자신을 검사하는 안티디버깅엔 잡힙니다.">
            소프트웨어 브레이크포인트
          </KeyTerm>
          . 반면 <C>watch</C>나 <C>hbreak</C>는 CPU의{" "}
          <KeyTerm term="하드웨어 브레이크포인트(Hardware Breakpoint): CPU의 디버그 레지스터(DR0~DR3)에 ‘이 주소가 읽히거나 쓰이면 멈춰라’를 등록하는 방식. 코드를 수정하지 않으므로 자가 검사식 안티디버깅을 우회하지만, x86-64에선 동시 4개까지만 가능합니다.">
            디버그 레지스터(DR0~DR3)
          </KeyTerm>
          를 써서 코드 수정 없이 감시합니다. 안티디버깅 우회와 ‘이 변수 값이 언제 바뀌나’를 잡을 때 필수 — 다만 동시 4개 제한.
        </p>
      </Callout>

      <h3>pwndbg / GEF — GDB를 사람 친화적으로</h3>

      <p>
        맨 GDB는 텍스트가 빽빽하고 색이 없어 한 곳에 머무르면 금방 길을 잃습니다.{" "}
        <KeyTerm term="pwndbg: GDB를 강화하는 무료 플러그인. 브레이크포인트마다 레지스터·스택·코드 세 패널이 자동으로 색깔 입혀 표시되고, heap 분석, ROP 가젯 검색 같은 CTF용 명령이 더해집니다.">
          pwndbg
        </KeyTerm>
        나{" "}
        <KeyTerm term="GEF(GDB Enhanced Features): pwndbg와 같은 갈래의 GDB 강화 플러그인. 단일 파일로 설치가 더 간단합니다.">
          GEF
        </KeyTerm>
        를 얹으면, 멈출 때마다 ‘레지스터 + 스택 + 코드’ 3패널이 자동으로 펼쳐집니다.
      </p>

      <CodeBlock lang="text" filename="bash — 설치와 추가 명령">{`# pwndbg 설치
git clone https://github.com/pwndbg/pwndbg
cd pwndbg && ./setup.sh

# GEF 설치 (한 줄로 끝)
bash -c "$(curl -fsSL https://gef.blah.cat/sh)"

# pwndbg에 추가되는 명령어 (GEF도 거의 동일)
context          # 레지스터 + 스택 + 코드 한 번에
heap             # 힙 청크 상태 분석 (UAF·overflow 추적)
rop              # ROP 가젯 검색 (4.5 보안 챕터에서 다시)
vmmap            # 메모리 맵 (섹션별 권한 — rwxp 확인)
got              # GOT 테이블 출력 (PLT 후킹 추적)
checksec         # 바이너리 보안 기법 한 줄 요약`}</CodeBlock>

      <h2>실전 워크플로 — 처음 받은 바이너리에 1시간 쓰는 법</h2>

      <ol style={{ paddingLeft: 22, margin: "16px 0" }}>
        <li style={{ marginBottom: 18 }}>
          <strong>1) 기본 정보 5분</strong> — 셸에서 끝나는 일부터.
          <CodeBlock lang="text" filename="bash">{`file ./binary          # 파일 형식, 아키텍처
checksec ./binary      # 보안 기법 확인 (pwntools 설치 시)
strings ./binary | grep -iE "flag|pass|key|secret|wrong|correct"
                       # 평문 문자열 한 번에 훑기
ldd ./binary           # 동적 라이브러리 의존성
nm -D ./binary         # 동적 심볼 (어떤 외부 함수를 부르는가)`}</CodeBlock>
        </li>
        <li style={{ marginBottom: 18 }}>
          <strong>2) 정적 — Ghidra로 지도 만들기</strong> — 임포트 → 자동 분석 → <C>main</C> 찾기 →
          문자열 참조로 핵심 로직 점프 → 보이는 변수/함수에 의미 있는 이름을 붙입니다. 분석은 ‘메모리’가 아니라 ‘이름 붙이기’입니다.
        </li>
        <li style={{ marginBottom: 18 }}>
          <strong>3) 핵심 분기 특정</strong> — <C>strcmp</C>·<C>memcmp</C> 같은 호출, 또는 <C>cmp</C>/<C>test</C> + 조건 점프 패턴을 찾습니다.
          <em>“틀렸습니다”/“맞았습니다”</em> 문자열의 reference를 거꾸로 올라가면 거의 항상 도착합니다.
        </li>
        <li style={{ marginBottom: 18 }}>
          <strong>4) 동적 — GDB로 한 점만 찍어 본다</strong> — 핵심 비교 직전에 BP를 걸고 <em>실제 비교되는 값</em>을 레지스터에서 꺼냅니다.
          <CodeBlock lang="text" filename="gdb — strcmp 인자 훔쳐보기">{`break strcmp
run
x/s $rdi     # 1번째 인자 (보통 입력한 값)
x/s $rsi     # 2번째 인자 (보통 정답 / 비교 대상)`}</CodeBlock>
          ‘정답 문자열’이 평문으로 보이면 그대로 끝, 안 보이면 그 값을 만든 직전 함수를 따라 올라갑니다.
        </li>
        <li style={{ marginBottom: 18 }}>
          <strong>5) 자동화 — 복잡하면 푸는 대신 풀게 시킨다</strong> — 조건이 수백 개여서 손으로 못 풀 때{" "}
          <KeyTerm term="angr: Python 기반 바이너리 분석 프레임워크. 내부적으로 z3 SMT 솔버를 써서 ‘성공 경로의 조건을 모두 만족시키는 입력값’을 자동으로 찾아냅니다. CTF 리버싱 자동화의 대명사.">
            angr
          </KeyTerm>
          나{" "}
          <KeyTerm term="z3: Microsoft Research의 SMT 솔버. SMT(Satisfiability Modulo Theories)는 ‘주어진 수학적 제약을 만족하는 값이 있는가, 있다면 무엇인가’를 푸는 엔진입니다. 예: x XOR 0x42 == 0x61을 만족하는 x를 즉시 구해줍니다.">
            z3 SMT 솔버
          </KeyTerm>
          에게 입력값을 역산시킵니다.
        </li>
      </ol>

      <h2>안티디버깅 — 바이너리가 ‘뒤를 돌아보는’ 순간</h2>

      <p>
        악성코드, DRM, 일부 상용 SW는 디버거가 붙어 있는지 검사하고 다르게 동작합니다. 그중 가장 흔한 한 가지 패턴 — <C>rdtsc</C>로 <em>“코드 한 토막의 실행 시간이 비정상적으로 길지”</em>를 재는 트릭입니다.
      </p>

      <DefBox term="rdtsc" en="Read Time-Stamp Counter">
        <p>
          CPU 내부의{" "}
          <KeyTerm term="TSC(Time-Stamp Counter): CPU 안의 64비트 카운터. 클럭 한 사이클마다 1씩 증가합니다. 3GHz CPU라면 1초에 30억 번 증가 — 그래서 마이크로초 단위의 시간 측정 분해능을 줍니다.">
            64비트 타임스탬프 카운터(TSC)
          </KeyTerm>
          를 읽어 <C>edx:eax</C>에 담는 명령. 성능 측정 본업 외에,{" "}
          <KeyTerm term="안티디버깅(Anti-Debugging): 디버거가 붙어 있는지 탐지해서 다르게 동작하는 기법. 디버거에선 사람이 한 명령씩 진행해 코드 한 토막이 수 초 걸리지만, 정상 실행에선 마이크로초로 끝납니다. rdtsc 두 번의 차이가 임계값을 넘으면 디버거가 있다고 판정.">
            안티디버깅
          </KeyTerm>
          용 ‘시간 측정 함정’으로 자주 쓰입니다.
        </p>
      </DefBox>

      <CodeBlock lang="asm" filename="안티디버깅 rdtsc 패턴">{`; rdtsc로 ‘얼마나 오래 걸렸지?’를 잰다
rdtsc                      ; edx:eax = TSC 현재값
mov  esi, eax              ; t1 = TSC 하위 32비트 저장
; ... 보호하려는 코드 ...
rdtsc                      ; t2
sub  eax, esi              ; 경과 사이클 = t2 - t1
cmp  eax, 0x1000           ; 4096 사이클 넘었나?
ja   .debugger_detected    ; 넘었으면 디버거 의심 → 분기`}</CodeBlock>

      <Callout type="warn" title="⚠️ 이 패턴을 우회하는 두 가지 길">
        <p>
          ① <strong>하드웨어 브레이크포인트</strong>로 단계 진행을 안 하면 시간 차이가 안 벌어집니다.
          ② GDB에서 <C>set $eax = 0</C>로 <C>sub</C> 결과를 강제로 0으로 만들거나, <C>jmp</C>를 <C>nop</C>으로 패치해버립니다.
          더 본격적인 안티디버깅(<C>ptrace</C> 자기 호출, INT3 카운트, <C>TF</C> 플래그 검사 등)도 같은 사고방식으로 깨집니다 — <em>“어디서 판정하는가”</em>만 찾으면 됩니다.
        </p>
      </Callout>

      <h2>‘쓸 만한 사실’ 모음 — 실전 치트시트</h2>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>상황 / 의문</th><th>먼저 해볼 일</th></tr>
          </thead>
          <tbody>
            <tr><td>이 바이너리, 어떤 종류인가?</td><td className="mono">file ./bin · readelf -h ./bin</td></tr>
            <tr><td>어떤 보안 기법이 켜져 있나?</td><td className="mono">checksec ./bin (NX · PIE · Canary · RELRO)</td></tr>
            <tr><td>인상적인 문자열이 있나?</td><td className="mono">strings -n 6 ./bin | less</td></tr>
            <tr><td>이 함수, 어디서 불리지?</td><td>Ghidra: 우클릭 → References → Show References to</td></tr>
            <tr><td>이 변수 값이 언제 바뀌지?</td><td className="mono">gdb: watch *(int*)0x601000</td></tr>
            <tr><td>비교되는 ‘진짜 값’이 뭐지?</td><td className="mono">break strcmp; run; x/s $rdi; x/s $rsi</td></tr>
            <tr><td>이 함수가 받는 인자는?</td><td>BP 걸고 <C>rdi · rsi · rdx · rcx · r8 · r9</C> 확인 (3.1 참고)</td></tr>
            <tr><td>이 분기를 그냥 통과시키고 싶다</td><td className="mono">set $rip = &lt;다음 명령 주소&gt; · 또는 jmp를 nop으로 패치</td></tr>
            <tr><td>벽돌처럼 큰 입력 검증을 풀어야</td><td>angr로 ‘성공 경로’ 자동 탐색</td></tr>
            <tr><td>실행 중에 메모리 맵 보기</td><td className="mono">cat /proc/&lt;PID&gt;/maps · pwndbg: vmmap</td></tr>
            <tr><td>libc 함수 정체 확인</td><td className="mono">ldd ./bin · gdb: info sharedlibrary</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="✅ 한 가지만 습관으로 들이라면 — ‘이름 붙이기’">
        <p>
          분석 중에 알게 된 사실은 <strong>그 자리에 즉시 이름으로 기록</strong>합니다 — Ghidra의 <C>L</C>(레이블), <C>Y</C>(타입), <C>;</C>(주석).
          <C>FUN_00401234</C>를 <C>checkPassword</C>로, <C>local_18</C>을 <C>userInput</C>으로 바꾸는 순간 디컴파일 결과가 갑자기 ‘읽히게’ 됩니다.
          머릿속 메모리는 빨리 새지만, 함수 이름은 그대로 남아요.
        </p>
      </Callout>

      <Summary items={[
        "리버싱은 ‘어셈블리 읽기 기술’이 아니라 ‘무엇부터 볼지 정하는 기술’. 정적과 동적을 5분 단위로 핑퐁한다.",
        "Ghidra 첫 5분: 임포트 → 자동 분석 → main → 문자열 참조로 핵심 로직 점프. 보는 즉시 변수·함수에 이름 붙이기.",
        "동적 분석은 GDB(+ pwndbg/GEF). 자주 쓰는 건 break/run/continue/x/print/set 한 줌. ~/.gdbinit에 intel 문법 + pagination off는 기본.",
        "하드웨어 브레이크포인트(watch/hbreak)는 코드를 수정하지 않아 안티디버깅 회피에 강하다. 단, 동시 4개 제한.",
        "처음 받은 바이너리: file/checksec/strings/ldd 5분 → Ghidra 지도 → 핵심 비교 분기 특정 → GDB로 한 점 확인 → 복잡하면 angr/z3에 맡긴다.",
        "Ghidra의 ‘문자열 → Show References to’는 거의 모든 소형 바이너리의 최단 경로. ‘틀렸습니다/맞았습니다’가 시작점.",
        "안티디버깅 rdtsc 패턴: ‘코드 한 토막이 오래 걸리면 디버거’. 하드웨어 BP로 단계 진행을 피하거나, sub 결과를 0으로 패치해서 우회.",
        "한 가지 습관으로 들이라면 — 알게 된 즉시 이름 붙이기(L/Y/;). 디컴파일 결과가 ‘갑자기 읽히는’ 순간이 거기서 온다.",
      ]} />
    </article>
  );
}

window.P4C4 = P4C4;
