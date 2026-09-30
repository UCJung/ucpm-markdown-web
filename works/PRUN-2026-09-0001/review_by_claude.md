# Claude 교차검증 — PRUN-2026-09-0001 (REQ-2026-09-0001)

> Status: PERFORMED
> Mode: auto · interactive
> Executor: Codex orchestrator · Claude CLI headless · claude 2.1.266
> Base: bf872ecc34ab132da8f95d999437e89abce5d67b
> Head: 8ecf140e30c888660c831d38c35c035577f7b69a
> Range: bf872ecc34ab132da8f95d999437e89abce5d67b..8ecf140e30c888660c831d38c35c035577f7b69a
> Verdict: needs-attention
> Findings: Critical 0 / High 0 / Medium 2 / Low 6
> Executed: 2026-09-30T06:02:00Z
> 렌즈 5종: 로직결함·경계·보안·동시성·공통화/재사용

## Critical

없음

## High

없음

## Medium

- [medium] playground의 typecheck·test가 선행 build에 암묵적으로 의존함 (packages/playground/package.json:6-10, 0.72) — `packages/playground/src/entrypoints.test.ts`와 `tsconfig.json`(include: src)은 workspace 패키지를 `@uc-markdown-web/*` 이름으로 해석하며, 각 라이브러리 `package.json`의 `exports`/`types`는 `./dist/index.js`·`./dist/index.d.ts`만 가리킨다(예: packages/core/package.json:6-12). playground의 `typecheck`·`test` 스크립트에는 선행 빌드 단계나 pre 스크립트가 없어, 신규 clone에서 `pnpm install` 직후 `pnpm test` 또는 `pnpm typecheck`만 실행하면 dist 미생성으로 모듈 해석에 실패한다(확인 안 함 — 실제 실행은 하지 않았고, dist가 이미 존재하는 작업 트리에서 판단함). 또한 dist가 낡은 상태로 남아 있으면 playground typecheck은 최신 소스가 아니라 stale 선언 파일을 검증하게 되어 FR-01의 '명령 실행 가능' 계약이 실행 순서에 종속된다. README는 build→typecheck→test 순서를 문서로만 안내한다(README.md:29-34). 권고: playground `typecheck`·`test`를 `pnpm -w --filter ...@uc-markdown-web/playground^ run build` 선행 또는 `pretest`/`pretypecheck` 스크립트로 묶고, 대안으로 라이브러리 package.json에 개발용 조건부 exports(`"development": "./src/index.ts"`) 또는 vitest `resolve.alias`를 추가해 소스 직접 해석 경로를 확보한다.
- [medium] 패키지 tsconfig의 include가 src/index.ts 한 파일로 제한되어 테스트·설정 파일이 타입검사에서 제외됨 (packages/core/tsconfig.json:11-11, 0.85) — 라이브러리 5개 tsconfig가 모두 `"include": ["src/index.ts"]`이다(packages/core/tsconfig.json:11, markdown·extension-api·extensions는 동일 내용, adapter-vanilla/tsconfig.json:12). 따라서 `typecheck`(`tsc --noEmit`)는 유일한 실제 단위 테스트인 `packages/core/src/index.test.ts`와 각 패키지 `vite.config.ts`를 전혀 검사하지 않는다. vitest는 기본적으로 타입 검사를 수행하지 않으므로 테스트 코드의 타입 오류는 어떤 검증 명령에서도 드러나지 않는다. 향후 `src/`에 index.ts 외 모듈이 추가되면 선언 파일 생성 대상에서도 조용히 빠진다(emitDeclarationOnly 대상 동일 tsconfig 공유). 권고: 빌드용 tsconfig(include: src/index.ts, emitDeclarationOnly)와 타입검사용 tsconfig(include: src 전체, noEmit)를 분리하거나, include를 `["src"]`로 넓히고 선언 생성 시 테스트 파일을 `exclude`로 제외한다.

## Low

- [low] declarationMap을 켰지만 files에 src가 없어 선언 소스맵이 끊김 (packages/core/package.json:13-13, 0.8) — 각 라이브러리 tsconfig가 `declarationMap: true`(packages/core/tsconfig.json:7)로 `dist/index.d.ts.map`을 생성하고, package.json의 `files`는 `["dist"]`만 포함한다(packages/core/package.json:13). 게시 시점에 `.d.ts.map`이 참조하는 `../src/index.ts`가 패키지에 포함되지 않아 소비자 IDE의 정의 이동이 깨진다. 현재는 전 패키지 `private: true`라 영향이 없고 CON-01(공개 npm 배포 전제)과 REQ-2026-09-0006 배포 준비 시점에 문제가 된다. 권고: `files`에 `"src"`를 추가하거나 `declarationMap`을 끄는 정책을 배포 준비 REQ 전에 확정한다.
- [low] rollup external이 정확한 문자열 목록이라 향후 서브패스 import가 번들에 흡수됨 (packages/adapter-vanilla/vite.config.ts:10-12, 0.7) — `rollupOptions.external`이 패키지 이름 문자열만 나열한다(packages/adapter-vanilla/vite.config.ts:10-12, extensions/vite.config.ts:10-13, core·markdown 동일 패턴). Rollup의 문자열 external은 정확 일치만 처리하므로, 후속 REQ에서 `@uc-markdown-web/core/commands` 같은 서브패스 진입점을 도입하면 해당 모듈이 external로 분류되지 않고 소비자 번들에 중복 포함된다. 현재 진입점이 `.` 하나뿐이므로 지금은 동작에 영향이 없다. 권고: external을 `[/^@uc-markdown-web\//]` 정규식으로 바꾸거나 `dependencies`/`peerDependencies` 키를 읽어 생성하는 공통 vite 설정 팩토리를 도입한다.
- [low] 빌드 도구가 루트 devDependencies에만 선언되어 패키지 매니페스트가 자기 빌드 요건을 표현하지 않음 (package.json:16-20, 0.75) — `vite`·`typescript`·`vitest`는 루트 package.json에만 있고(package.json:16-20) 각 패키지는 이를 devDependency로 선언하지 않는다. pnpm이 workspace 루트 `node_modules/.bin`을 스크립트 PATH에 넣어주기 때문에 현재는 동작하지만(TASK 결과 문서상 build/test PASS), 패키지 단위로 분리·게시·외부 재사용될 때 빌드 요건이 매니페스트에서 추적되지 않는다. 공통 절차가 루트 환경에만 의존하는 형태다. 권고: 공통 도구 버전은 루트에 고정하되, 각 패키지에 `"vite": "catalog:"` 등 pnpm catalog 참조 devDependency를 추가해 빌드 요건을 매니페스트에 명시한다.
- [low] 커밋된 SPEC 문서가 미추적 문서를 참조해 clone 시 끊긴 링크가 됨 (docs/[SPEC]_BROWSER_SUPPORT.md:65-69, 0.78) — `docs/[SPEC]_BROWSER_SUPPORT.md`의 참조 파일 목록이 `docs/[SPEC]_TECH_STACK.md`를 가리키지만(해당 파일 68행), 세션 시작 시 git 상태에서 `docs/[SPEC]_TECH_STACK.md`는 미추적(`??`) 상태다. TASK-02는 기존 기획문서 3개를 '보존'만 했고 추적 대상에 넣지 않았으므로, 새로 clone한 저장소에서는 이 참조가 존재하지 않는 파일을 가리킨다. Requirement의 ASM/TASK 범위상 의도된 결정으로 보이나 참조 계약이 저장소 상태와 불일치한다. 권고: `docs/[SPEC]_TECH_STACK.md`를 함께 커밋하거나, 커밋되지 않는 문서라면 참조 항목에서 제거하고 미추적 사유를 문서에 명시한다.
- [low] 라이브러리 4개의 test가 --passWithNoTests로 공허하게 통과함 (packages/extension-api/package.json:13-17, 0.85) — `extension-api`·`markdown`·`adapter-vanilla`·`extensions`의 test 스크립트는 `vitest run --passWithNoTests`이며 실제 테스트 파일이 없다(packages/extension-api/package.json:16, 동일 패턴 3건). 전체 `pnpm test`가 검증하는 것은 core 1건과 playground smoke 1건뿐이어서 PLAN의 R-03(빈 테스트 명령의 무의미한 통과)은 playground smoke test로 부분 완화된 상태다. 기반 구성 단계로서는 수용 가능하나, 이후 패키지별 테스트가 추가되지 않아도 녹색으로 남는다. 권고: 후속 REQ에서 실제 테스트가 추가되는 시점에 `--passWithNoTests`를 제거하거나, 패키지별 최소 진입점 테스트를 추가해 플래그 의존을 없앤다.
- [low] 패키지 의존 경계가 문서로만 정의되고 자동 강제 수단이 없음 (README.md:38-47, 0.8) — README 표와 PLAN 인터페이스 설계가 허용 의존 방향(`core`→`extension-api`, `markdown`→`core` 등)을 정의하지만(README.md:38-45), 이를 위반하는 import(예: `markdown`이 `adapter-vanilla`를 참조)를 차단하는 ESLint 규칙·dependency-cruiser·`tsconfig` project references가 없다. FR-02 인수 기준('허용 의존성 경계를 확인할 수 있다')은 문서 확인으로 충족되지만, 후속 REQ에서 경계가 조용히 침식될 수 있다. 권고: dependency-cruiser 또는 eslint-plugin-import의 `no-restricted-imports`로 허용 그래프를 규칙화하고 `pnpm lint`에 연결하는 작업을 후속 REQ에 등록한다.

## 렌즈별 확인

렌즈별 확인 요약 — (1) 로직결함: 런타임 로직이 거의 없는 스캐폴드로, 상태 전이·조건 오류는 발견하지 않음. playground main.ts의 null 가드는 정상 처리됨. 계약 측면에서 README·PLAN의 의존 방향과 각 package.json의 dependencies는 일치함(core→extension-api, markdown→core, adapter-vanilla→core·markdown, extensions→core·markdown·extension-api, playground→라이브러리 5개)로 확인됨. (2) 경계: 실패 경로 2건 확인 — playground의 typecheck·test가 선행 build 없이는 dist 미존재로 실패하거나 stale 선언을 검증할 수 있음(medium), 라이브러리 tsconfig include가 src/index.ts로 제한되어 유일한 단위 테스트와 vite.config가 타입검사에서 누락됨(medium). (3) 보안: 인증·권한·비밀정보 취급 코드가 없고 playground는 textContent만 사용하여 주입 경로 없음. 커밋 파일에서 자격증명·토큰 노출 없음. 전 패키지 private: true로 의도치 않은 게시 위험도 차단됨. (4) 동시성: 경합 지점 없음. pnpm -r의 병렬 실행은 workspace 의존 그래프상 topological 순서가 보장되어 build 산출물 경합은 확인되지 않음. 다만 typecheck·test는 build 산출물에 순서 의존이 있어 (2)의 지적과 동일 원인. (5) 공통화/재사용: 라이브러리 5개의 package.json·tsconfig·vite.config가 거의 동일한 내용으로 중복되고, 빌드 도구가 루트 devDependencies에만 선언되며, 문서화된 의존 경계를 강제하는 자동화 수단이 없음(각 low). critical·high 없음, medium 2건·low 6건.

- playground의 typecheck·test에 선행 빌드 보장(pre 스크립트 또는 개발용 조건부 exports/alias)을 추가해 명령 단독 실행 가능성을 확보한다.
- 라이브러리 tsconfig를 빌드용/타입검사용으로 분리해 테스트·vite.config 파일이 타입검사 범위에 들어오게 한다.
- docs/[SPEC]_TECH_STACK.md의 추적 여부를 결정해 SPEC 참조 목록과 저장소 상태를 일치시킨다.
- 배포 준비 REQ(REQ-2026-09-0006) 착수 전 declarationMap/files 정책과 rollup external 규칙, 의존 경계 자동 강제 수단을 확정한다.

## 격리 검증

- mcp_servers: []
- tools: ["Glob","Grep","Read","StructuredOutput"]
- envSanitized: true
- argv(발췌): -p ... --strict-mcp-config --mcp-config ... --tools Read,Glob,Grep --permission-prompts none --no-session-persistence
- S1/S2: git HEAD·status·diff stat, REQ status, run status 전부 동일

## 반영

기록만. Critical/High 없음. Medium 2건·Low 6건을 후속 구현·품질 검증의 참고로 인계.

