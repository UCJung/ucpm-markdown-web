# 릴리스 후보 증빙

| 항목 | 내용 |
|---|---|
| 설명 | `0.x` 후보의 재현 명령·실측 결과·차단 판정 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

## 후보 판정: `CANDIDATE BLOCKED`

WebKit E2E 실행 실패와 외부 npm 게시 결정값 미확정으로 후보 승인·게시 중단.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 실행 환경 | 재현 환경과 고정 도구 버전 |
| 2 | 품질 증빙 | 명령·결과·출처 |
| 3 | 브라우저·접근성 증빙 | 엔진별 결과와 검증 경계 |
| 4 | 패키지 증빙 | tarball 소비 검증과 외부 차단값 |
| 5 | 차단 해제 조건 | 승인·게시 전 완료 항목 |

## 1. 실행 환경

| 항목 | 값 |
|---|---|
| OS | Windows 11 Home `10.0.26200` x64 |
| Node.js | `v24.17.0` |
| pnpm | `11.25.0` |
| Playwright | `1.63.0` |
| axe-core | `4.13.0` |
| VitePress | `1.6.4` |
| 공개 후보 | `@uc-markdown-web/extension-api`, `core`, `markdown`, `extensions`, `adapter-vanilla` |
| 후보 버전 | 각 패키지 `0.0.0`; 공개 버전·태그 미확정 |

## 2. 품질 증빙

| 검증 | 명령 | 결과 | 출처 |
|---|---|---|---|
| workspace build | `pnpm build` | PASS; 6개 workspace 빌드 | TASK-04 재실행 |
| typecheck | `pnpm typecheck` | PASS | TASK-05 독립 검증 |
| Vitest | `pnpm test` | PASS; 총 62건 (`markdown` 11, `core` 17, `extensions` 27, `extension-api` 1, `adapter-vanilla` 5, `playground` 1) | TASK-05 독립 검증 |
| VitePress | `pnpm docs:build` | PASS; HTML 5페이지 | TASK-04 재실행 |
| tarball 소비 | `node scripts/release/verify-pack.mjs` | PASS; 5개 tarball 설치, JS import, TypeScript import | TASK-04 재실행 |

린트 스크립트 미정의로 린트 결과 `N/A`. 품질 통과는 WebKit·외부 게시 차단을 해제하지 않음.

## 3. 브라우저·접근성 증빙

| 대상 | 실행 명령 또는 범위 | 결과 | 후보 판정 영향 |
|---|---|---|---|
| Chromium `153.0.8010.12` | `pnpm exec playwright test --project=chromium --project=firefox --timeout=30000` | 독립 검증에서 6/6 PASS | 통과 근거 |
| Firefox `155.0` | `pnpm exec playwright test --project=chromium --project=firefox --timeout=30000` | 독립 검증에서 6/6 PASS; 두 엔진 전체 12건 PASS | 통과 근거; 동시 HMR 중 이전 전체 timeout은 무효 |
| Playwright WebKit revision `2359` | `pnpm exec playwright test --project=webkit` | 시작 FAIL; 실제 실행 브라우저 버전 확인 불가 | 후보 차단 |
| axe | WCAG 2.2 A/AA 태그, critical·serious 필터 | 완료 엔진에서 0건 | WebKit 미실행으로 전체 통과 아님 |
| 키보드 | 탭 이동·편집·명령 | 완료 엔진 시나리오 PASS | 수동 접근성 대체 불가 |
| 수동·보조공학 | 스크린 리더·수동 평가 | 미검증 | 승인 근거 미제공 |
| 실제 브라우저 | Chrome·Edge·Firefox·Safari 최신·직전 메이저 | 미검증 | 엔진 결과로 보증 금지 |

독립 Chromium·Firefox 전체 실행은 12건 PASS, 1.1분. 완료한 자동 시나리오: Markdown 입력·키보드 편집, 키보드 명령, 허용·위험 HTML 붙여넣기, 혼합 GFM 목록, axe, `pagehide` 종료.

Playwright WebKit revision `2359`는 설치 폴더에 파일이 있어도 `icuin77.dll`, `nghttp3.dll`, `jpeg62.dll`, `psl-5.dll` 누락으로 시작하지 못함. 실제 실행 브라우저 버전은 확인하지 못함. 공식 `playwright install --with-deps`와 프로세스 `PATH` 보정은 해결하지 못함. WSL은 Docker Desktop만 존재. 새 OS·컨테이너·DLL 복사·검증 우회는 수행하지 않음.

## 4. 패키지 증빙

| 항목 | 결과 |
|---|---|
| `files` | 후보 5개에 `dist` 한정 확인 |
| public entry | `exports["."].import` = `./dist/index.js`, types = `./dist/index.d.ts` 확인 |
| 소비자 설치 | 임시 소비자에서 tarball 5개 설치 PASS |
| 소비자 import | JS·TypeScript import PASS |
| 게시 상태 | 모든 후보 `private: true` 유지 |
| 외부 메타데이터 | npm 조직·공개 이름·게시 권한·라이선스·repository 미확정 |

## 5. 차단 해제 조건

- [ ] WebKit 실행 가능한 환경 확보 → 6개 E2E와 axe 포함 결과 PASS 기록
- [ ] 실제 Chrome·Edge·Firefox·Safari 최신·직전 메이저와 수동·보조공학 결과 기록
- [ ] npm 조직·공개 패키지명·배포 권한·라이선스·repository 메타데이터 확정
- [ ] 모든 후보의 `private` 해제와 공개 버전·태그를 승인된 값으로 반영
- [ ] 게시 전 검증·게시 확인·태그 확인을 [릴리스 체크리스트]([GUIDE]_RELEASE_CHECKLIST.md)로 완료

## 참조 파일

- `works/PRUN-2026-09-0006/TASK-00_result.md` — 도구 버전과 공용 명령
- `works/PRUN-2026-09-0006/TASK-02_result.md` — VitePress 독립 빌드
- `works/PRUN-2026-09-0006/TASK-03_result.md` — tarball 소비 검증
- `works/PRUN-2026-09-0006/TASK-05_result.md` — 제품 수정 후 독립 품질 검증
- `works/PRUN-2026-09-0006/DECISIONS.md` — D-01, D-06 게시·WebKit 차단 결정
- `tests/e2e/playground.spec.ts` — 자동 E2E·axe 시나리오

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 후보 증빙·WebKit 실패·게시 차단 조건 기록 |
