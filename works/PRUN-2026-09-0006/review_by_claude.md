# Claude 교차검증 — PRUN-2026-09-0006 (REQ-2026-09-0006)

> Status: PERFORMED
> Mode: auto · interactive
> Executor: Codex orchestrator · Claude CLI headless · claude 2.1.266
> Base: 80dcd99b4ef1588b4a3f7e2e7e3ce4444ac0c6c1
> Head: 6c60c6a6ed90fdd9717719ee856844fe85af2bc1
> Range: 80dcd99b4ef1588b4a3f7e2e7e3ce4444ac0c6c1..6c60c6a6ed90fdd9717719ee856844fe85af2bc1
> Verdict: needs-attention
> Findings: Critical 0 / High 0 / Medium 6 / Low 7
> Executed: 2026-10-01T03:44:27Z
> 렌즈 5종: 로직결함·경계·보안·동시성·공통화/재사용

## Critical

없음.

## High

없음.

## Medium

- [medium] 순서 목록에 섞인 task 항목의 ordered 속성이 조용히 소실됨 (예외 → 무음 데이터 변형) (packages/markdown/src/parser.ts:116-135, confidence 0.65) — `parseList`는 항목 중 하나라도 `checked`가 boolean이면 `node.ordered` 값을 보지 않고 `task_list`로 변환한다. `task_list` 스키마에는 `ordered`/`order` 속성이 없고(`schema.ts:12`), `serializeTaskList`는 항상 `ordered: false`를 출력한다(`serializer.ts:59-75`).

수정 전에는 혼합 목록이 `Mixed task and regular list items are not supported.` 예외로 즉시 드러났지만, 이제는 `1. 일반` + `2. [x] 완료`처럼 순서 목록에 체크 항목이 섞인 유효 GFM 입력이 예외 없이 통과한 뒤 `* 일반 / * [x] 완료` 형태의 불릿 목록으로 직렬화되어 번호 목록 성질이 유실될 것으로 보인다. `packages/markdown/README.md`가 선언한 "구조·텍스트·속성 의미 보존" 계약과 어긋난다.

확인한 사실: `parseList`가 `node.ordered`를 전혀 참조하지 않음, `task_list`에 order 속성 없음, 직렬화가 `ordered: false` 고정. 추측: remark-gfm가 순서 목록 항목에도 `checked`를 설정한다(GitHub 렌더링 동작과 micromark gfm-task-list-item 적용 범위에 근거). 이 세션에서는 도구 제약으로 실제 파싱 실행 확인은 하지 않음.

부수 문제로 `task_list`가 `list_item`만 담는 문서도 스키마상 유효해졌는데, 그 경우 직렬화 결과가 평범한 불릿 목록이라 재import 시 `bullet_list`로 노드 타입이 바뀌어 문서 구조 왕복이 비대칭이다.

  권고: `task_list`에 `ordered`·`order` 속성을 추가해 parser에서 `node.ordered`/`node.start`를 보존하고 serializer가 이를 반영하도록 한다(또는 순서 목록 + task 항목 혼합을 명시적 미지원으로 되돌려 예외를 유지한다). 어느 쪽이든 `1. [x] a` / `1. 일반 + 2. [x] 완료` 입력의 parse→serialize→parse 회귀 테스트를 추가하고, task 항목이 없는 `task_list`의 재import 타입 변화도 테스트로 고정한다.

- [medium] 새로 게시하는 소비자 문서가 이번 혼합 목록 수정과 모순됨 (docs/guide/syntax.md:28-28, confidence 0.9) — `docs/guide/syntax.md:28`은 "체크리스트와 일반 목록을 한 목록에 혼합하면 변환 오류 발생"이라고 기술한다. 그러나 같은 변경에 포함된 TASK-05 수정(`parser.ts`, `schema.ts`, `serializer.ts`)은 바로 그 혼합을 보존하도록 예외를 제거했고, `docs/[NOTE]_RELEASE_NOTES_0X.md`는 "혼합 GFM 목록 보존 수정"을 변경 요약으로 기록한다. VitePress로 실제 게시되는 4개 소비자 가이드 중 하나이므로 소비자에게 잘못된 제약을 공표한다.

  권고: 해당 문장을 혼합 목록 지원 사실로 갱신하고, 남는 실제 제약(예: ordered 목록의 번호 소실 여부, 표 셀 단일 문단 제약)만 기술한다. 문서 갱신 이력에도 반영한다.

- [medium] 체크리스트 "시각 편집 지원" 표기가 실제 view·클립보드 동작과 불일치 (docs/guide/syntax.md:22-26, confidence 0.85) — `docs/guide/syntax.md:26`은 GFM 체크리스트를 시각 편집 지원으로 표기한다. 그러나 `createSafeEditorView`의 노드 뷰와 클립보드 직렬화는 `task_item`을 속성 없는 `<li>`로만 렌더링해(`packages/extensions/src/safe-view.ts:99`, `:177`) 체크 상태가 DOM에 전혀 드러나지 않고, 체크박스 토글 UI도 없다. 편집 키맵은 `list_item`만 처리하므로(`packages/extensions/src/keymap.ts:20-22`) task 항목에서는 Enter/Tab 목록 동작이 적용되지 않는다. 클립보드 HTML에 checked가 실리지 않으므로 복사·붙여넣기 왕복에서 체크 상태가 소실된다.

구현 자체는 기존 상태이지만, 소비자 문서로 "지원"을 공표하는 문장이 이번 변경에서 새로 추가되었다.

  권고: 체크리스트 행을 "import/serialize 보존, 시각적 체크 표시·토글 미제공"으로 정정하거나, `task_item` 노드 뷰에 비편집 체크 표시와 `data-checked` 속성, 클립보드 직렬화의 checked 반영, task 항목용 목록 키맵을 추가한다.

- [medium] verify-pack의 private 강제와 릴리스 체크리스트 절차가 서로 차단됨 (docs/[GUIDE]_RELEASE_CHECKLIST.md:39-50, confidence 0.75) — `scripts/release/verify-pack.mjs`는 각 tarball 매니페스트가 `private: true`가 아니면 실패한다. 반면 `docs/[GUIDE]_RELEASE_CHECKLIST.md`는 1절 승인 게이트에서 "후보 패키지 `private` 설정을 승인된 공개 설정으로 변경"을 요구한 뒤, 2절 게시 전 검증 6단계에서 같은 `node scripts/release/verify-pack.mjs`를 PASS 조건으로 요구한다. 문서 순서대로 수행하면 private 해제 직후 6단계가 반드시 FAIL하여 게시 전 검증을 완료할 수 없다.

  권고: verify-pack의 private 검사를 환경변수·CLI 플래그(예: `--expect-private=false`)로 전환하거나 경고로 낮추고, 체크리스트에 private 해제 전/후 각각 어떤 모드로 실행하는지를 명시한다.

- [medium] 단일 RUN_ID로 두 번 실행하도록 기술된 절차가 앞선 증적을 덮어씀 (docs/[GUIDE]_DEPLOYMENT.md:58-68, confidence 0.8) — `deploy/compose.test.yaml:10-16`은 `playwright-report/${RUN_ID}`, `test-results/${RUN_ID}`를 bind mount하고, Playwright는 같은 경로에 HTML 보고서와 trace를 그대로 덮어쓴다. 그런데 `docs/[GUIDE]_DEPLOYMENT.md` 3절 예시는 `RUN_ID`를 `20261001-121500-all` 하나로 설정한 뒤 `playwright test --project=webkit`과 전체 실행을 연달아 수행하도록 적어 두었다. 이 순서대로면 WebKit 단독 결과가 전체 실행 결과로 덮여 사라지는데, 같은 문서와 `docs/[NOTE]_RELEASE_CANDIDATE.md`의 증적 표는 WebKit 단독을 `20261001-121500-webkit`, 전체를 `20261001-121500-all`로 분리해 기록한다. 같은 절에 있는 "같은 검사 재실행에는 새 RUN_ID 사용" 규칙과도 어긋나 NFR-01 재현성 기록이 손상된다.

  권고: 3절 명령 블록을 검사 단위마다 `RUN_ID`를 재설정하는 형태로 분리하고(예: `-webkit`, `-all`), 기존 디렉터리가 있으면 덮어쓰지 않고 실패하도록 실행 전 존재 확인 단계를 추가한다.

- [medium] 릴리스 판정용 Docker 이미지가 Node.js tarball을 무검증으로 설치 (deploy/Dockerfile.test:10-14, confidence 0.85) — `deploy/Dockerfile.test`는 `curl`로 `nodejs.org`의 Node.js tarball을 받아 체크섬(SHASUMS256.txt)·서명 검증 없이 `/usr/local`에 바로 풀어 넣는다. 이 이미지가 릴리스 후보 판정(18/18 PASS, typecheck, axe)의 유일한 근거 환경이므로, 받은 산출물이 바뀌어도 판정은 그대로 통과한다. 공급망 무결성 검증이 빠진 지점이다.

또한 `USER root`로 고정되어 브라우저가 root로 구동된다(Playwright 이미지는 비권한 `pwuser`를 제공한다). 악의적 입력을 렌더링하는 붙여넣기 시나리오를 포함하므로 샌드박스 경계가 약화된다.

  권고: `SHASUMS256.txt`(가능하면 GPG 서명까지) 검증 단계를 추가하고 실패 시 빌드를 중단한다. 설치·빌드 이후에는 `USER pwuser`로 권한을 낮춘 뒤 테스트를 실행한다.

## Low

- [low] win32에서 shell:true + 인용 없는 경로 인자 전달 (scripts/release/verify-pack.mjs:51-56, confidence 0.6) — `command()`는 win32·pnpm 호출 시 `shell: true`로 `execFile`을 실행한다. 이때 `--dir <packageDirectory>` 같은 인자는 셸에 그대로 이어붙여지므로 저장소 경로에 공백이나 `&`, `^`, `(` 등의 셸 메타문자가 있으면 명령이 깨지거나 의도치 않은 명령이 실행될 수 있다. 현재 경로(`C:\\work\\uc-markdown-web`)에서는 재현되지 않으며 입력원이 저장소 위치라 악용 가능성은 낮다.

  권고: `shell: true` 대신 `pnpm.cmd`를 직접 `execFile`로 호출하거나, 셸이 필요하면 인자를 명시적으로 인용한다.

- [low] 릴리스 게이트 패키지 목록이 workspace와 중복 하드코딩 (scripts/release/verify-pack.mjs:13-19, confidence 0.7) — `packages` 배열이 디렉터리·패키지명·내보내기 심볼을 손으로 나열한다. workspace에 공개 후보 패키지가 추가되면 `verify-pack.mjs`는 조용히 그 패키지를 검사하지 않고 PASS를 출력한다(누락 분기 없음). 공용 게이트 절차가 약화되는 중복이다.

  권고: `pnpm -r list --json`(또는 `pnpm-workspace.yaml` 글롭) 결과에서 비private 후보 목록을 산출해 하드코딩 목록과 교차 비교하고, 목록에 없는 패키지가 있으면 실패하도록 한다.

- [low] 자작 tar 파서가 typeflag·GNU longname·PAX 헤더·헤더 체크섬을 무시 (scripts/release/verify-pack.mjs:25-47, confidence 0.55) — `tarEntries`는 512바이트 헤더에서 name/prefix/size만 읽고 typeflag(offset 156)와 헤더 체크섬을 검사하지 않는다. GNU longname(`L`)·PAX(`x`/`g`) 엔트리가 포함된 tarball에서는 가짜 경로가 엔트리로 등록되거나 실제 긴 경로가 누락되어 `package/dist/index.js` 존재 판정이 잘못될 수 있다. 현재 pnpm pack 산출물에서는 경로가 짧아 문제로 드러나지 않는다.

  권고: typeflag를 확인해 일반 파일(`0`/`\0`)만 엔트리로 수집하고 알 수 없는 확장 헤더는 실패 처리하거나, `tar`(node-tar) 의존성을 사용해 파싱을 표준 구현에 위임한다.

- [low] webServer에 --strictPort 없음 + 로컬 reuseExistingServer로 외부 서버에 붙을 수 있음 (playwright.config.ts:20-25, confidence 0.7) — `playwright.config.ts`의 webServer 명령에는 `--strictPort`가 없다(compose의 `playground` 서비스에는 있다). 4173이 점유된 환경에서 vite는 다른 포트로 떠서 `url` 대기가 타임아웃되고, 로컬(`CI` 미설정)에서는 `reuseExistingServer: true`이므로 4173에 떠 있는 무관한 서버를 playground로 간주해 테스트를 수행할 수 있다.

  권고: webServer 명령에 `--strictPort`를 추가하고, 재사용 시 playground 고유 마커(예: h1 텍스트)를 확인하는 사전 단계를 둔다.

- [low] 신규 루트 TypeScript 파일이 typecheck 게이트 밖에 있음 (package.json:15-17, confidence 0.8) — `pnpm typecheck`는 `pnpm -r`로 패키지별 typecheck만 실행하고 루트 tsconfig가 없다(`tsconfig.base.json`과 패키지별 tsconfig만 존재). 따라서 새로 추가된 `tests/e2e/playground.spec.ts`와 `playwright.config.ts`, `docs/.vitepress/config.ts`는 어떤 타입 검사 대상에도 포함되지 않는다. Playwright는 타입 검사 없이 트랜스파일만 하므로 타입 오류가 게이트에서 드러나지 않는다.

  권고: 루트에 `tests/e2e`, `playwright.config.ts`, `docs/.vitepress`를 포함하는 tsconfig와 `typecheck:e2e` 스크립트를 추가해 `pnpm typecheck`에 연결한다.

- [low] 종료 시나리오 E2E가 사실상 단언하지 않음 (tests/e2e/playground.spec.ts:87-94, confidence 0.65) — `disposes the editor cleanly when the page exits` 테스트는 `page.goto("about:blank")` 후 `pageErrors`가 빈 배열인지만 확인한다. 언로드 중 `pagehide` 핸들러에서 발생한 예외가 파기되는 페이지의 `pageerror`로 전달될 보장이 없고, `listeners.abort()`/`disposeEditor()`가 실제로 실행되었는지에 대한 단언도 없다. 그런데 `docs/[NOTE]_RELEASE_CANDIDATE.md`는 이 테스트를 "`pagehide` 종료" 자동 시나리오 근거로 인용한다. 또한 CI `retries: 2` 설정이 있으나 증적 문서의 18/18 PASS 기록에는 재시도 발생 여부가 드러나지 않는다.

  권고: `pagehide` 핸들러에서 관찰 가능한 표식(예: `sessionStorage`/`navigator.sendBeacon` 대체로 DOM 속성 기록)을 남기고 그 값을 단언하거나, 어댑터 `destroy()` 호출을 직접 검증하는 테스트로 대체한다. 증적 문서에는 재시도 사용 여부와 실제 attempt 수를 함께 기록한다.

- [low] compose playground 서비스가 build 섹션 없이 test 서비스 빌드 순서에 암묵 의존 (deploy/compose.test.yaml:19-24, confidence 0.65) — `playground` 서비스는 `build` 없이 `image: uc-markdown-web-test:local`만 지정한다. `docker compose build`는 `test`만 빌드하므로, 빌드 전에 `up -d playground`를 수행하면 로컬에 없는 이미지를 레지스트리에서 pull하려다 실패한다. 가이드 3절의 명령 순서에만 의존하는 순서 결합이다.

  권고: `playground`에도 동일한 `build` 섹션(또는 `pull_policy: never`)을 지정해 이미지 준비 여부가 선언으로 보장되게 한다.

## 렌즈별 확인

PRUN-2026-09-0006(릴리스 후보 준비: Playwright E2E·axe, VitePress 소비자 문서, Docker 검증 환경, tarball 소비 검증, 혼합 GFM 목록 parser 수정)을 5종 렌즈로 검토했다. 차단급(critical/high) 결함은 확인하지 못했고, medium 6건·low 6건을 기록한다.

(1) 로직결함: `parseList`가 task 항목이 하나라도 있으면 항상 `task_list`(ordered 속성 없음)로 변환한다. 기존에는 혼합 목록이 예외로 드러났으나 이제 조용히 통과하므로, `1. [x] a` / `1. [x] a` + `2. 일반`처럼 순서 목록에 체크 항목이 섞이면 번호 목록 성질이 직렬화에서 소실될 것으로 보인다(remark-gfm가 ordered listItem에도 `checked`를 설정한다는 전제; 이 세션에서 실행 확인은 하지 않음). `task_list`가 `list_item`만 담을 수 있게 된 결과 재import 시 `bullet_list`로 노드 타입이 바뀌는 비대칭도 남는다.
(2) 경계: `playwright.config.ts`의 webServer에 `--strictPort`가 없고 로컬에서는 `reuseExistingServer`가 참이어서 4173을 쓰는 타 프로세스에 붙을 수 있다. `tests/e2e/*`와 `playwright.config.ts`는 어떤 tsconfig에도 포함되지 않아 `pnpm typecheck` 게이트 밖에 있다. `pagehide` 종료 테스트는 네비게이션 이후의 `pageerror`만 보므로 사실상 무조건 통과하는 형태인데 증빙 문서는 이를 종료 시나리오 근거로 인용한다. CI `retries: 2`는 18/18 PASS 기록에 재시도 여부가 드러나지 않는다.
(3) 보안: `deploy/Dockerfile.test`가 Node.js tarball을 체크섬·서명 검증 없이 다운로드해 릴리스 판정용 이미지에 설치한다. 컨테이너는 `USER root` 상태로 브라우저를 구동한다. 반면 `.dockerignore`는 `.env*`, `.claude`, `.mcp*`를 제외해 비밀값 유입은 차단되어 있고, paste 경로의 위험 HTML 차단 E2E 단언(script/iframe/onclick/javascript:)은 적절하다. 비밀정보 하드코딩은 발견하지 못했다.
(4) 동시성·순서: 결과 보관이 `RUN_ID` 단일 디렉터리에 비원자적으로 덮어써지는데, 배포 가이드 3절은 하나의 `RUN_ID`로 WebKit 단독 실행과 세 엔진 전체 실행을 연달아 수행하도록 적어 두어 앞 실행 증적이 소실된다(증적 표의 RUN_ID 분리와 불일치). compose `playground` 서비스는 `build` 섹션이 없어 `test` 빌드 선행 순서에 암묵적으로 의존한다. Playwright는 `workers: 1`·`fullyParallel: false`로 경합 요소가 적다.
(5) 공통화·재사용: 새로 게시된 소비자 문서 `docs/guide/syntax.md`가 "체크리스트와 일반 목록 혼합 시 변환 오류"라고 적어 이번 수정과 정면으로 모순되고, 같은 표는 체크리스트 시각 편집을 지원으로 표기하지만 view·클립보드 직렬화는 `task_item`을 속성 없는 `<li>`로만 그린다. `verify-pack.mjs`는 `private: true`를 강제하는데 릴리스 체크리스트는 private 해제 후 같은 스크립트를 실행하도록 적어 절차가 자기 차단된다. 또한 패키지 목록 하드코딩, 자작 tar 파서, Playwright 버전의 3중 중복(이미지 태그·package.json·문서)이 남아 있다.

- packages/markdown: 순서 목록 + task 항목 혼합 입력의 parse→serialize→parse 왕복 테스트를 추가해 ordered 소실 여부를 실측 확인하고, 결과에 따라 task_list에 order 속성을 추가하거나 명시적 미지원으로 되돌린다.
- docs/guide/syntax.md의 혼합 목록 오류 서술과 체크리스트 시각 편집 표기를 실제 구현 동작에 맞게 정정한다(게시 대상 소비자 문서).
- verify-pack.mjs의 private 강제와 릴리스 체크리스트 절차의 상호 차단을 해소한다(플래그화 또는 체크리스트 순서 수정).
- deploy/Dockerfile.test에 Node.js tarball 체크섬 검증을 추가하고 테스트 실행 단계에서 비권한 사용자로 전환한다.
- docs/[GUIDE]_DEPLOYMENT.md 3절을 검사 단위별 RUN_ID 재설정 형태로 분리하고, 기존 결과 디렉터리 덮어쓰기를 차단한다.
- 루트 tsconfig를 추가해 tests/e2e·playwright.config.ts·docs/.vitepress를 typecheck 게이트에 포함하고, webServer에 --strictPort를 지정한다.

## 격리 검증

- mcp_servers: []
- tools: ["Glob","Grep","Read","StructuredOutput"]
- envSanitized: true
- argv(options): ["--output-format","stream-json","--verbose","--json-schema","{\"type\":\"object\",\"additionalProperties\":false,\"required\":[\"verdict\",\"summary\",\"findings\",\"next_steps\"],\"properties\":{\"verdict\":{\"enum\":[\"approve\",\"needs-attention\"]},\"summary\":{\"type\":\"string\"},\"findings\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"additionalProperties\":false,\"required\":[\"severity\",\"title\",\"body\",\"file\",\"line_start\",\"line_end\",\"confidence\",\"recommendation\"],\"properties\":{\"severity\":{\"enum\":[\"critical\",\"high\",\"medium\",\"low\"]},\"title\":{\"type\":\"string\"},\"body\":{\"type\":\"string\"},\"file\":{\"type\":\"string\"},\"line_start\":{\"type\":\"integer\"},\"line_end\":{\"type\":\"integer\"},\"confidence\":{\"type\":\"number\",\"minimum\":0,\"maximum\":1},\"recommendation\":{\"type\":\"string\"}}}},\"next_steps\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}","--strict-mcp-config","--mcp-config","C:\\Users\\ucjun\\AppData\\Local\\Temp\\ucpm-PRUN-2026-09-0006-review\\input\\mcp-empty.json","--tools","Read,Glob,Grep","--permission-prompts","none","--no-session-persistence","--add-dir","C:\\Users\\ucjun\\AppData\\Local\\Temp\\ucpm-PRUN-2026-09-0006-review\\input"]
- S1/S2: Git HEAD/status/diff 및 REQ/run 상태 5항목 동일.

## 반영

기록만. Critical/High 0건이므로 파이프라인 정책에 따라 Medium6/Low7은 백로그 후보로 남긴다. 추가 교차검증은 수행하지 않는다. 실제 수정·해결을 주장하지 않는다.

