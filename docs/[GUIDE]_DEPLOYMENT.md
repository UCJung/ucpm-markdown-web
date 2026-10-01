# 자동 테스트 배포 가이드

| 항목 | 내용 |
|---|---|
| 제목 | 자동 테스트 배포 가이드 |
| 설명 | Docker Linux 자동 테스트 및 로컬 브라우저 확인 실행 지침 |
| 생성일 | 2026-10-01 |
| 수정일 | 2026-10-01 |
| 버전 | 0.1.2 |
| 상태 | 초기·로그 제외 최종 이미지 자동 검증 PASS; 수동 UI 미수행 |

## 목차

| 절 | 제목 | 간략설명 |
|---|---|---|
| 1 | 구성 | 실행 환경·서비스·포트 |
| 2 | 준비 | 배포 파일 구현 계약 |
| 3 | 실행 | RUN_ID·빌드·자동 테스트·브라우저 확인 |
| 4 | 검증·종료 | 판정·증적·자원 보존 |

## 1. 구성

| 항목 | 적용 값 |
|---|---|
| 배포 범위 | 자동 테스트 + 현재 PC 브라우저 확인 |
| 실행 환경 | Docker Linux 엔진·Docker Compose |
| 테스트 이미지 | `mcr.microsoft.com/playwright:v1.63.0-noble` 기반; Node.js 24·pnpm 11.25.0 준비 |
| 브라우저 | Chromium·Firefox·WebKit; 이미지와 `@playwright/test` 버전 일치 |
| Compose 프로젝트 | `uc-markdown-web-test` |
| `test` 서비스 | 일회성 실행; 내부 `127.0.0.1:4173`; 호스트 포트 게시 없음 |
| `playground` 서비스 | 내부 `0.0.0.0:4173`; `127.0.0.1:4180:4173` 게시 |
| 브라우저 접속 | `http://localhost:4180` |
| 결과 보관 | 호스트 `playwright-report/`, `test-results/` |

`4180` → 2026-10-01 점검 시 기존 컨테이너 설정·호스트 TCP 리스너·Windows TCP 제외 범위와 충돌 없음; 기동 전 재확인.

## 2. 준비

아래 파일 구현 완료 후 3절 명령 실행.

| 파일 | 구현 지침 |
|---|---|
| `deploy/Dockerfile.test` | 지정 Playwright 이미지 기반 Node.js 24·pnpm 11.25.0 준비; 작업 경로 `/app`; `pnpm install --frozen-lockfile` 및 `pnpm build` 수행 |
| `.dockerignore` | `.git`, 호스트 `node_modules` 및 패키지별 `node_modules`, 기존 `dist`, `.logs`, 테스트 결과 제외; 소스·잠금 파일·테스트 설정 포함 |
| `deploy/compose.test.yaml` | 저장소 루트를 빌드 컨텍스트로 지정; 동일 이미지의 `test`·`playground` 서비스 정의; 1절 포트·결과 경로 적용 |

- 현재 작업 트리의 미커밋 소스까지 이미지에 포함; Linux 의존성은 이미지 내부 설치.
- `test` → `CI=1`; 기본 명령 `pnpm exec playwright test`; 결과 폴더만 호스트 bind mount.
- `playground` → `pnpm --filter @uc-markdown-web/playground exec vite --host 0.0.0.0 --port 4173 --strictPort` 실행.
- `playwright.config.ts` → 같은 컨테이너 안에서 테스트 서버 자동 기동; 기존 `127.0.0.1:4173` 사용.
- 기존 컨테이너·포트·볼륨 유지; 테스트와 playground는 별도 컨테이너로 실행.

## 3. 실행

저장소 루트 PowerShell 기준; 각 Compose 실행 전에 고유 `RUN_ID`를 설정하고 각 명령 종료 코드 `0` 확인 후 다음 단계 실행. 같은 검사 재실행에는 새 `RUN_ID` 사용.

```powershell
$env:RUN_ID = '20261001-121500-all' # 실행마다 고유 값 설정
docker info --format '{{.OSType}}'
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml config --quiet
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml build
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test node --version
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test pnpm --version
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test pnpm typecheck
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test pnpm test
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test pnpm docs:build
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test pnpm exec playwright test --project=webkit
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml up -d playground
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml ps
Invoke-WebRequest -Uri http://localhost:4180 -UseBasicParsing
```

`RUN_ID` 설정은 `config`, `build`, `run`, `up`, `down` 이전에 필수. 원시 결과는 `playwright-report/<RUN_ID>/`, `test-results/<RUN_ID>/`에 보관.

| 검증 실행 | RUN_ID | 결과 |
|---|---|---|
| WebKit 단독 | `20261001-121500-webkit` | 6/6 PASS |
| 세 엔진 전체 | `20261001-121500-all` | 18/18 PASS |
| playground HTTP | `20261001-121500-all` | `http://localhost:4180` → `200` |
| 로그 제외 최종 이미지 | `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`, `20261001-verifier-all18` | typecheck PASS, 독립 18/18 PASS, 1.5분, playground HTTP `200`; `playwright-report/20261001-verifier-all18/`, `test-results/20261001-verifier-all18/` |

초기 18건 증빙 이미지는 `sha256:15973d3d7015b9a19ac6d4512a54e66fe569ede48d6b5f6970090f790bf2a72d`. `.dockerignore`의 `logs/**` 제외를 반영한 최종 이미지는 위 표의 별도 검증 대상으로 유지.

## 4. 검증·종료

| 항목 | 완료 기준 |
|---|---|
| 환경 | Linux 엔진·Node.js 24·pnpm 11.25.0 확인 |
| 자동 테스트 | builder Docker: build·타입 검사·Vitest 62건·문서 빌드·3종 브라우저 18건 PASS |
| 접근성 | axe critical·serious 위반 `0` |
| 브라우저 확인 | HTTP `200`; 로컬 실제 브라우저의 에디터 표시·입력은 별도 수동 확인 |
| 포트 | `playground`만 `127.0.0.1:4180` 게시; 기존 서비스 유지 |
| 증적 | 실행 일시·RUN_ID·Git HEAD·미커밋 변경 여부·실제 이미지 ID·명령별 종료 코드 기록; 실행별 결과 별도 보관 |
| 실패 | 실패 로그·HTML 보고서·생성된 trace 보존; 원인 수정 후 해당 검사 및 전체 테스트 재실행 |
| 지원 범위 | Linux WebKit 결과와 실제 Safari 버전 검증 구분 |

종료 → 해당 Compose 프로젝트 컨테이너·네트워크 정리; 호스트 테스트 결과 보존.

```powershell
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml down
```

이번 builder 실행은 자동화에서 사용할 수 있는 브라우저가 없고 Main 브라우저 탭 접근도 보안 정책으로 차단되어 수동 표시·입력을 수행하지 않음. 보안 정책 우회 없이 별도 수동 확인으로 기록.

## 참조

- [문서 작성 지침](<[GUIDE]_AUTHORING_STYLE.md>)
- [프로젝트 실행 명령](../package.json)
- [브라우저 테스트 설정](../playwright.config.ts)
- 참고 형식: `C:/work/uc-aiagentic-flow/docs/[GUIDE]_DEPLOYMENT.md`

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경 |
|---|---|---|
| 0.1.0 | 2026-10-01 | 1번 구성 기반 자동 테스트·로컬 확인 배포 지침 작성 |
| 0.1.1 | 2026-10-01 | RUN_ID 보관 규칙, Docker builder PASS, 수동 UI 미수행 상태 추가 |
| 0.1.2 | 2026-10-01 | 로그 제외 최종 이미지 독립 18/18·typecheck·HTTP PASS 반영 |
