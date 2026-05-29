// Part 4 · 4.2 SIMD 명령어
function P4C2() {
  return (
    <article>
      <ChapterHeader
        eyebrow="Part 4 · Chapter 4.2"
        title="SIMD 명령어 기초"
        subtitle="‘하나의 명령어로 여러 데이터를 동시에’. 멀티미디어 · 암호화 · AI 연산 · 그리고 최신 libc의 memcpy/strlen까지 — 진짜 바이너리를 열어 보면 거의 모든 핫한 루프 자리에 SIMD가 들어앉아 있습니다."
      />

      <p>
        4.1에서 본 최적화들은 ‘같은 일을 더 짧게’ 였습니다. SIMD는 한 단계 더 나갑니다 —
        <strong>“같은 일을 여러 개 한꺼번에”</strong>. <C>for (i = 0; i &lt; 16; i++)</C> 짜리 바이트 비교가
        디스어셈블리에선 단 세 줄(<C>movdqu</C> + <C>pcmpeqb</C> + <C>pmovmskb</C>)로 바뀌어 있는 식이죠.
        이번 챕터는 ‘리버싱하다 마주칠 SIMD’를 알아보는 데 필요한 최소한의 지도입니다.
      </p>

      <h2>SIMD란?</h2>

      <DefBox term="SIMD" en="Single Instruction, Multiple Data">
        <p>
          하나의 명령어(<em>Single Instruction</em>)로 여러 데이터(<em>Multiple Data</em>)를 동시에 처리하는 방식입니다.
          예를 들어 <C>addps</C> 한 줄이 4개의 <C>float</C>을 한꺼번에 더하고, <C>pcmpeqb</C> 한 줄이 16개 바이트를 동시에 비교합니다.
          그래서 루프 회수를 <C>1/4</C>, <C>1/16</C>, 심지어 <C>1/64</C>로 줄일 수 있죠. 다른 이름으로{" "}
          <KeyTerm term="스칼라(Scalar) vs 벡터(Vector): 스칼라는 숫자 하나를 다루는 일반 연산, 벡터는 여러 숫자를 묶어 한꺼번에 다루는 연산입니다. SIMD는 후자 — 머신러닝의 행렬곱, 게임 물리, 이미지/영상 처리, 암호 라이브러리 모두 그 위에 올라가 있습니다.">
            벡터(Vector) 연산
          </KeyTerm>
          이라고도 부릅니다.
        </p>
      </DefBox>

      <Callout type="info" title="‘왜 진작부터 안 썼지?’가 안 통하는 이유 — 두 가지 단서">
        <p>
          ① SIMD는 <strong>같은 연산을 똑같이 반복</strong>할 때만 위력이 납니다. 조건 분기가 매 원소마다 다르면 일반 스칼라 코드가 더 빠릅니다.
          ② <strong>데이터가 메모리에서 ‘쪼개지지 않고 연속해 있어야’</strong> 합니다 — 4바이트씩 떨어진 4개 <C>float</C>이 메모리에서도 16바이트 연속이어야 한 번에 들어오죠.
          이 두 조건이 맞는 자리(이미지 픽셀, 오디오 샘플, 문자열 바이트, 행렬 행)에 컴파일러가 자동으로 SIMD를 꽂아 넣습니다 — 이걸 <em>오토 벡터화(auto-vectorization)</em>라고 부릅니다.
        </p>
      </Callout>

      <h2>SIMD 레지스터 계층 — XMM · YMM · ZMM</h2>

      <p>
        SIMD는 일반 정수 레지스터(<C>rax</C>, <C>rbx</C>, …)와는 <strong>완전히 다른 한 묶음의 레지스터</strong>를 씁니다.
        세대가 올라갈수록 폭이 두 배씩 늘어났고, 이름도 바뀌었습니다 — 다만 <em>물리적으로는 같은 레지스터의 상·하위 부분일 뿐</em>이라는 점이 핵심입니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>레지스터</th><th>크기</th><th>명령어 세트</th><th>동시 처리</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">xmm0 ~ xmm15</td><td>128비트</td><td><KeyTerm term="SSE(Streaming SIMD Extensions): Intel이 1999년에 도입한 SIMD 명령어 세트. SSE → SSE2 → SSE3 → SSSE3 → SSE4.1 → SSE4.2로 발전했으며, 오늘날 모든 x86-64 CPU가 최소 SSE2까지는 무조건 지원합니다. 그래서 컴파일러가 ‘기본값’으로 가장 자주 끼워 넣는 SIMD입니다.">
                  SSE ~ SSE4.2
                </KeyTerm></td><td>4×float, 2×double, 16×byte</td></tr>
            <tr><td className="mono">ymm0 ~ ymm15</td><td>256비트</td><td><KeyTerm term="AVX/AVX2: Intel이 2011년에 도입한 256비트 SIMD가 AVX, 2013년에 정수 벡터 연산을 추가한 게 AVX2입니다. Sandy Bridge(2011) 이후 데스크탑 CPU 대부분이 지원합니다.">
                  AVX, AVX2
                </KeyTerm></td><td>8×float, 4×double, 32×byte</td></tr>
            <tr><td className="mono">zmm0 ~ zmm31</td><td>512비트</td><td><KeyTerm term="AVX-512: 512비트 SIMD. 레지스터 수도 32개로 두 배 늘었고, ‘마스크 레지스터(k0~k7)’로 원소 단위 조건 실행도 가능합니다. 주로 서버용 Xeon, 그리고 일부 최신 데스크탑 CPU에 탑재 — 일반 노트북에선 빠져 있는 경우가 많습니다.">
                  AVX-512
                </KeyTerm></td><td>16×float, 8×double, 64×byte</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="note" title="📌 XMM ↔ YMM ↔ ZMM은 ‘같은 레지스터의 다른 이름’">
        <p>
          <C>xmm0</C>는 <C>ymm0</C>의 하위 128비트, <C>ymm0</C>는 <C>zmm0</C>의 하위 256비트입니다.
          즉 물리적으로 같은 한 덩어리의 레지스터를 폭이 다른 세 이름으로 부를 뿐입니다.
          그래서 AVX 명령({" "}
          <KeyTerm term="VEX 인코딩(VEX Encoding): AVX 명령어가 사용하는 인코딩 방식. 3-operand 형식(목적지, 소스1, 소스2)을 지원해서 SSE의 2-operand보다 유연하고, 무엇보다 ymm 레지스터를 쓸 때 ‘상위 비트를 자동으로 0으로 정리’해줍니다 — 이게 SSE↔AVX 혼용 시의 지연 문제를 피하는 핵심.">
            VEX 인코딩
          </KeyTerm>{" "}
          )으로 <C>ymm0</C>을 쓰면 같은 자원의 상위 128비트가 0으로 정리됩니다 — 옛 SSE 코드와 새 AVX 코드를 섞을 때의 성능 함정을 막아주는 장치죠.
        </p>
      </Callout>

      <h2>SSE 명령어 명명 규칙 — <em>연산 + 데이터 타입</em></h2>

      <p>
        SSE/AVX 명령어 이름은 <strong>접미사 두 글자가 데이터 모양을 결정</strong>합니다. 외울 게 많아 보이지만,
        <em>‘p/s 첫 글자 = packed인가 scalar인가’</em>, <em>‘s/d 두 번째 글자 = single인가 double인가’</em>로 끊어 읽으면 단순합니다.
      </p>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>접미사</th><th>의미</th><th>예시</th><th>설명</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">ps</td><td><KeyTerm term="Packed Single: 128비트 레지스터를 32비트 float 4개로 나눠서 동시에 처리. xmm0 = [1.0 | 2.0 | 3.0 | 4.0] 네 슬롯을 한 번의 명령으로 연산.">
                  Packed Single
                </KeyTerm></td><td className="mono">addps, mulps, divps</td><td>float 4개 동시</td></tr>
            <tr><td className="mono">pd</td><td><KeyTerm term="Packed Double: 128비트 레지스터를 64비트 double 2개로 나눠서 동시 처리.">
                  Packed Double
                </KeyTerm></td><td className="mono">addpd, mulpd</td><td>double 2개 동시</td></tr>
            <tr><td className="mono">ss</td><td><KeyTerm term="Scalar Single: XMM 레지스터의 하위 32비트(1개 float)만 연산. 나머지 96비트는 변경되지 않습니다. 일반 ‘하나짜리’ float 연산이 64비트 OS의 함수 호출 규약상 XMM을 쓰기 때문에 만나게 됩니다.">
                  Scalar Single
                </KeyTerm></td><td className="mono">addss, sqrtss, movss</td><td>float 1개</td></tr>
            <tr><td className="mono">sd</td><td><KeyTerm term="Scalar Double: XMM의 하위 64비트(1개 double)만 연산.">
                  Scalar Double
                </KeyTerm></td><td className="mono">addsd, sqrtsd, movsd</td><td>double 1개</td></tr>
            <tr><td className="mono">b · w · d · q</td><td>정수 (SSE2+)</td><td className="mono">paddb · paddw · paddd · paddq</td><td>byte · word · dword · qword 동시</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="info" title="이름이 ‘p’로 시작하면 정수, ‘v’가 앞에 붙으면 AVX">
        <p>
          정수 SIMD 명령엔 보통 <strong><C>p</C></strong>가 접두로 붙습니다 — <C>paddb</C>(packed add byte), <C>pcmpeqb</C>(packed compare equal byte), <C>pshufb</C>(packed shuffle bytes).
          AVX 명령은 같은 이름 앞에 <strong><C>v</C></strong>가 한 글자 더 붙습니다 — <C>vaddps</C>, <C>vpaddb</C>, <C>vmovdqu</C>. 디스어셈블리에서 <C>v</C>로 시작하는 SIMD 명령을 보면
          “AVX 이상이 켜진 채로 컴파일된 바이너리”라는 신호입니다.
        </p>
      </Callout>

      <h3>예제 — 4개 float 더하기</h3>

      <Compare>
        <CodeBlock lang="c" filename="C 코드 (루프 4회)">{`float a[4] = {1, 2, 3, 4};
float b[4] = {5, 6, 7, 8};
float c[4];
for (int i = 0; i < 4; i++)
    c[i] = a[i] + b[i];`}</CodeBlock>
        <CodeBlock lang="asm" filename="SSE — 명령어 한 줄로 끝">{`; rbx=&a, rcx=&b, rdx=&c
movaps xmm0, [rbx]      ; xmm0 = [1|2|3|4]
movaps xmm1, [rcx]      ; xmm1 = [5|6|7|8]
addps  xmm0, xmm1       ; xmm0 = [6|8|10|12]
                        ; 덧셈 4번이 1 사이클에!
movaps [rdx], xmm0      ; c에 저장`}</CodeBlock>
      </Compare>

      <Callout type="note" title="📌 movaps vs movups — 메모리 정렬의 함정">
        <p>
          <C>movaps</C>는{" "}
          <KeyTerm term="정렬된(Aligned) 주소: 메모리 주소가 데이터 크기의 배수인 경우. 128비트(16바이트) SIMD 데이터는 16의 배수 주소에 놓여야 ‘정렬됐다’고 합니다. 컴파일러는 스택 위에 잡은 SIMD 변수를 자동으로 정렬해주지만, malloc으로 받은 메모리나 구조체 안의 배열은 그렇지 않을 수 있습니다.">
            16바이트 정렬된
          </KeyTerm>{" "}
          주소에서만 작동하며, 안 맞으면 <C>SIGSEGV</C>로 즉시 죽습니다.
          <C>movups</C>는{" "}
          <KeyTerm term="비정렬(Unaligned) 접근: 정렬 요건을 만족하지 않는 메모리 접근. movups/movdqu는 이런 주소도 허용합니다. 옛날엔 정렬 접근보다 눈에 띄게 느렸지만, 현대 CPU에선 차이가 거의 사라져 컴파일러가 안전한 movups를 기본으로 깔아두는 경우가 많아졌습니다.">
            비정렬 주소
          </KeyTerm>
          에서도 작동합니다. 그래서 현실 바이너리에서는 <C>movups</C> / <C>movdqu</C>가 훨씬 자주 보입니다 — “이 코드는 정렬을 가정 못 하는 일반 경로”라는 뜻입니다.
        </p>
      </Callout>

      <h2>정수 SIMD — <C>memcmp</C>, <C>strlen</C>의 진짜 모습</h2>

      <p>
        리버싱 중에 <C>pcmpeqb</C> + <C>pmovmskb</C> 콤보가 보이면 거의 무조건{" "}
        <strong>최적화된 문자열/배열 검색</strong>입니다.
        16바이트를 한꺼번에 비교해 ‘같다’의 결과를 16비트 비트맵으로 압축한 뒤, 일반 정수 명령(<C>bsf</C>, <C>tzcnt</C>)으로 첫 차이의 위치를 찾는 패턴이죠.
        libc의 <C>strcmp</C>, <C>memchr</C>, <C>strlen</C>이 모두 이렇게 구현돼 있습니다.
      </p>

      <Compare>
        <CodeBlock lang="c" filename="C: 단순 구현">{`// 한 글자씩 비교 — O(n)
while (*p == *q && *p != '\\0') {
    p++; q++;
}`}</CodeBlock>
        <CodeBlock lang="asm" filename="SSE2 최적화 버전 (16바이트씩)">{`; 16바이트를 한 번에 비교
movdqu   xmm0, [rdi]      ; 문자열1: 16바이트 로드
movdqu   xmm1, [rsi]      ; 문자열2: 16바이트 로드
pcmpeqb  xmm0, xmm1       ; 각 바이트 비교 → 같으면 0xFF
pmovmskb eax, xmm0        ; 각 바이트 최상위 비트 → 16비트 비트맵
xor      eax, 0xFFFF      ; 비트=1인 자리 = 다른 바이트
bsf      ecx, eax         ; 첫 번째 차이의 인덱스`}</CodeBlock>
      </Compare>

      <Callout type="tip" title="✅ 자주 만나는 SIMD 패턴 사전">
        <p>
          디스어셈블리를 빠르게 ‘번역’하는 데 도움이 되는 시그니처 모음입니다 — 명령어 조합만 보면 원본 의도가 거의 보입니다.
        </p>
      </Callout>

      <div className="table-wrap">
        <table className="reg-table">
          <thead>
            <tr><th>패턴</th><th>의미</th></tr>
          </thead>
          <tbody>
            <tr><td className="mono">movdqu/movaps + pcmpeqb + pmovmskb + bsf</td><td><strong>문자열 비교 / 검색</strong> — <C>strcmp</C>, <C>memchr</C>, <C>strlen</C>의 핫 루프</td></tr>
            <tr><td className="mono">movaps + addps / mulps</td><td><strong>float 배열 연산</strong> — DSP, 벡터 수학, 그래픽 변환</td></tr>
            <tr><td className="mono">pshufb / pshufd</td><td><strong>바이트/워드 셔플</strong> — 암호화(AES 외) · 해시 · 인코딩 변환에서 자주 등장.{" "}
                <KeyTerm term="pshufb: 16바이트 입력을 또 다른 16바이트의 ‘인덱스 테이블’대로 재배치. SHA-256, MD5 같은 해시, base64 인코딩, AES의 S-box 룩업까지 — ‘바이트를 위치 바꿔 가며 휘젓는’ 모든 곳에 등장합니다.">
                  pshufb
                </KeyTerm>
                는 거의 ‘암호 시그니처’.
              </td></tr>
            <tr><td className="mono">aesenc / aesenclast / pclmulqdq</td><td><strong>AES 암호화</strong> 또는{" "}
                <KeyTerm term="AES-NI / PCLMULQDQ: x86 CPU에 박힌 ‘하드웨어 AES’ 명령어 세트. 디스어셈블리에 aesenc/aesenclast가 보이면 그 함수는 AES 라운드를 직접 돌리고 있는 거고, pclmulqdq는 GCM 모드의 카운터 곱셈 — 즉 TLS/HTTPS 트래픽 처리.">
                  GCM 카운터 곱셈
                </KeyTerm>
                . 보면 거의 100% 암호 코드.
              </td></tr>
            <tr><td className="mono">vmovdqu (ymm) / vpaddb (ymm)</td><td><strong>AVX2로 32바이트씩 처리</strong> — 같은 일을 두 배로. 최신 컴파일러 디폴트.</td></tr>
            <tr><td className="mono">vpternlogd, vpermt2d</td><td>AVX-512 전용 — 보이면 서버용 바이너리거나 ICX/SKX 이상 빌드 타깃.</td></tr>
          </tbody>
        </table>
      </div>

      <Callout type="warn" title="⚠️ SIMD 코드는 ‘끝부분 처리’가 따로 있다 (tail handling)">
        <p>
          16바이트씩 처리하는 코드는 길이가 16의 배수가 아닐 때를 따로 다뤄야 합니다.
          그래서 핫 루프 뒤엔 보통 <em>“길이가 16 미만이면 스칼라 루프로 떨어지는”</em> 잔여 처리(tail)가 따라옵니다 —
          디스어셈블리에서 ‘메인 SIMD 루프 → 작은 스칼라 루프 → 종료’의 3단 구조를 자주 보게 되는 이유입니다.
          또 페이지 경계(4KB) 직전에서는{" "}
          <KeyTerm term="페이지 폴트(Page Fault): 매핑되지 않은 메모리 페이지에 접근하면 발생하는 예외. SIMD는 16/32바이트를 통째로 읽기 때문에, 문자열의 NUL 종료자 바로 직전에서 다음 페이지로 넘어가 ‘읽을 권한 없는’ 메모리에 닿으면 SIGSEGV가 납니다. libc의 strlen은 이걸 피하려고 페이지 경계 검사 코드를 따로 두고 있습니다.">
            페이지 폴트
          </KeyTerm>
          가 걱정되어, 페이지를 넘기지 않는 ‘과한 안전 코드’도 같이 묶여 있습니다.
        </p>
      </Callout>

      <h2>리버싱에서 SIMD를 만났을 때</h2>

      <p>
        하지 말아야 할 것은 <em>“레지스터 이름이 낯서니 통째로 건너뛰기”</em>. 의외로 시간을 가장 많이 잡아먹는 자리가 SIMD 핫 루프인데,
        대부분은 <strong>이미 알려진 패턴의 라이브러리 함수</strong>입니다. 정체만 짚으면 그 안을 한 줄씩 따라가지 않아도 됩니다.
      </p>

      <KeyPoint n={1}>
        <strong>먼저 ‘어떤 데이터 폭인가’를 확인</strong>합니다 — 명령어 접미사(<C>b/w/d/q</C> 또는 <C>ps/pd</C>)가 직접 알려줍니다.
      </KeyPoint>
      <KeyPoint n={2}>
        <strong>패턴 사전과 대조</strong>합니다 — <C>pcmpeqb + pmovmskb</C>면 문자열, <C>aesenc</C>면 AES, <C>pshufb + xor</C> 반복이면 해시일 가능성이 큽니다.
      </KeyPoint>
      <KeyPoint n={3}>
        <strong>디컴파일러의 힘을 빌립니다</strong> — Ghidra · IDA Hex-Rays는 이 패턴들 대부분을 자동으로 <C>memcmp</C>, <C>strlen</C>, <C>memcpy</C> 같은 표준 함수 호출로 복원해 보여줍니다. 그게 안 풀리는 자리만 손으로 읽으면 충분합니다.
      </KeyPoint>

      <Callout type="tip" title="✅ 직접 확인하는 가장 빠른 길">
        <p>
          <C>godbolt.org</C>에 <C>strlen</C>·<C>memcmp</C> 같은 표준 함수의 호출을 <C>-O2 -mavx2</C>로 빌드해 보면,
          libc 헤더에서 인라인되는 SIMD 구현이 바로 보입니다. 또 <C>objdump -d --disassembler-options=intel</C>로 자신이 만든 작은 프로그램을 떼어 보면,
          “내가 짠 단순 루프”가 어떻게 SIMD로 변신했는지 한눈에 잡힙니다.
        </p>
      </Callout>

      <Summary items={[
        "SIMD = Single Instruction, Multiple Data — 같은 연산을 여러 원소에 한 번에. 이미지/오디오/문자열/암호/머신러닝 모든 핫한 자리에 들어가 있다.",
        "레지스터 계층: XMM(128) ⊂ YMM(256) ⊂ ZMM(512). 같은 물리 자원의 다른 이름. AVX 명령은 ymm을 쓸 때 상위 비트를 자동으로 0으로 정리(VEX).",
        "명령어 이름 = 연산 + 접미사. ps/pd = packed float·double, ss/sd = scalar, b/w/d/q = 정수 폭. ‘p’ 접두는 정수, ‘v’ 접두는 AVX.",
        "movaps = 정렬 강제, movups/movdqu = 비정렬 허용. 실제 바이너리에선 후자가 훨씬 흔하다.",
        "pcmpeqb + pmovmskb + bsf 콤보는 strcmp/strlen/memchr의 시그니처. 16바이트를 한꺼번에 비교하고 첫 차이의 인덱스를 뽑는 패턴.",
        "그 외 사전: pshufb는 암호/해시, aesenc는 AES, pclmulqdq는 GCM, vpaddb(ymm)은 AVX2 32바이트 처리.",
        "SIMD 루프 뒤엔 잔여(tail) 처리 + 페이지 경계 안전 코드가 묶여 다닌다. 3단 구조에 놀라지 말 것.",
        "리버싱 전략: ① 데이터 폭 확인 → ② 패턴 사전과 대조 → ③ 디컴파일러가 표준 함수로 복원해주는지 확인. 그래도 남은 자리만 손으로 읽는다.",
      ]} />
    </article>
  );
}

window.P4C2 = P4C2;
