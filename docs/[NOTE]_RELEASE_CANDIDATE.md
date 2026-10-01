# 릴리스 후보 증빙

| 항목 | 내용 |
|---|---|
| 설명 | `0.x` 후보의 재현 명령·실측 결과·차단 판정 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-10-01 |
| 버전 | 0.1.2 |

## 후보 판정: 자동 품질 `PASS`, 공개 게시 `CANDIDATE BLOCKED`

승인된 Docker Linux 초기·최종 이미지에서 Chromium·Firefox·WebKit 자동 검증을 완료했다. npm 조직·공개 이름·권한·라이선스·repository 미확정으로 공개 게시와 릴리스 승인은 계속 중단.

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
| 자동 검증 OS | Docker Linux `linux/amd64`, Ubuntu `24.04.4` |
| 초기 자동 증빙 이미지 | `sha256:15973d3d7015b9a19ac6d4512a54e66fe569ede48d6b5f6970090f790bf2a72d` |
| 로그 제외 최종 이미지 | `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`; 독립 verifier 18/18 PASS |
| Playwright base digest | `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27` |
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
| Docker 초기 품질 | Compose `test` 서비스의 build·typecheck·Vitest 62건·docs | PASS; 초기 자동 증빙 이미지 | `20261001-121500-all` |
| Docker 최종 typecheck | Compose `test` 서비스의 `pnpm typecheck` | PASS; 로그 제외 최종 이미지 | `20261001-verifier-all18` |

린트 스크립트 미정의로 린트 결과 `N/A`. 자동 품질 통과는 공개 게시·릴리스 승인을 의미하지 않음.

## 3. 브라우저·접근성 증빙

| 대상 | 실행 명령 또는 범위 | 결과 | 후보 판정 영향 |
|---|---|---|---|
| Chromium `153.0.8010.12` | `pnpm exec playwright test --project=chromium --project=firefox --timeout=30000` | 독립 검증에서 6/6 PASS | 통과 근거 |
| Firefox `155.0` | `pnpm exec playwright test --project=chromium --project=firefox --timeout=30000` | 독립 검증에서 6/6 PASS; 두 엔진 전체 12건 PASS | 통과 근거; 동시 HMR 중 이전 전체 timeout은 무효 |
| Docker Playwright WebKit revision `2359` | `RUN_ID=20261001-121500-webkit`; WebKit 단독 실행 | 6/6 PASS | 자동 통과 근거 |
| Docker 세 엔진 | `RUN_ID=20261001-121500-all`; `pnpm exec playwright test` | 초기 자동 증빙 이미지에서 Chromium `153.0.8010.12`·Firefox `155`·WebKit, 18/18 PASS | 초기 자동 통과 근거 |
| Docker 최종 세 엔진 | `RUN_ID=20261001-verifier-all18`; `pnpm exec playwright test` | 로그 제외 최종 이미지에서 18/18 PASS, 1.5분 | 독립 자동 통과 근거 |
| axe | WCAG 2.2 A/AA 태그, critical·serious 필터 | 세 엔진 자동 결과 0건 | 자동 통과 근거 |
| 키보드 | 탭 이동·편집·명령 | 세 엔진 자동 시나리오 PASS | 수동 접근성 대체 불가 |
| HTTP | Docker `playground`, `http://localhost:4180` | `200` | 서비스 기동 근거 |
| 수동 UI·보조공학 | 로컬 표시·입력, 스크린 리더·수동 평가 | 미수행 | 승인 근거 미제공 |
| 실제 브라우저 | Chrome·Edge·Firefox·Safari 최신·직전 메이저 | 미검증 | 엔진 결과로 보증 금지 |

Docker 자동 실행 결과는 `playwright-report/20261001-121500-webkit/`, `test-results/20261001-121500-webkit/`, `playwright-report/20261001-121500-all/`, `test-results/20261001-121500-all/`에 보관. 완료한 자동 시나리오: Markdown 입력·키보드 편집, 키보드 명령, 허용·위험 HTML 붙여넣기, 혼합 GFM 목록, axe, `pagehide` 종료.

`.dockerignore`의 `logs/**` 제외를 반영한 최종 이미지 `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`는 독립 verifier에서 typecheck PASS, `RUN_ID=20261001-verifier-all18` 세 엔진 18/18 PASS, playground HTTP `200` 확인. 원시 결과는 `playwright-report/20261001-verifier-all18/`, `test-results/20261001-verifier-all18/`에 보관.

Windows의 Playwright WebKit revision `2359` DLL validator 실패는 기존 환경 증빙으로 유지. D-07 사용자 승인 범위의 Docker Linux 검증으로 자동 차단은 해소. Linux WebKit 결과는 실제 Safari 또는 vendor 최근 2개 버전 검증이 아님. 이 실행에서는 사용 가능한 자동화에 브라우저가 없고 Main 브라우저 탭 접근도 보안 정책으로 차단되어 로컬 수동 표시·입력 확인을 수행하지 않음; 우회 미수행.

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

- [x] Docker Linux WebKit 실행 환경 확보 → WebKit 단독 6/6, 세 엔진 18/18, axe 포함 결과 PASS 기록
- [x] 최종 이미지 `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`의 독립 Docker verifier 결과 수집
- [ ] 로컬 수동 표시·입력과 수동·보조공학 결과 기록
- [ ] 실제 Chrome·Edge·Firefox·Safari 최신·직전 메이저와 수동·보조공학 결과 기록
- [ ] npm 조직·공개 패키지명·배포 권한·라이선스·repository 메타데이터 확정
- [ ] 모든 후보의 `private` 해제와 공개 버전·태그를 승인된 값으로 반영
- [ ] 게시 전 검증·게시 확인·태그 확인을 [릴리스 체크리스트]([GUIDE]_RELEASE_CHECKLIST.md)로 완료

## 참조 파일

- `works/PRUN-2026-09-0006/TASK-00_result.md` — 도구 버전과 공용 명령
- `works/PRUN-2026-09-0006/TASK-02_result.md` — VitePress 독립 빌드
- `works/PRUN-2026-09-0006/TASK-03_result.md` — tarball 소비 검증
- `works/PRUN-2026-09-0006/TASK-05_result.md` — 제품 수정 후 독립 품질 검증
- `works/PRUN-2026-09-0006/DECISIONS.md` — D-01, D-06, D-07 게시·WebKit 환경 결정
- `docs/[GUIDE]_DEPLOYMENT.md` — Docker 실행·RUN_ID·결과 보관 절차
- `tests/e2e/playground.spec.ts` — 자동 E2E·axe 시나리오

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 후보 증빙·WebKit 실패·게시 차단 조건 기록 |
| 0.1.1 | 2026-10-01 | Docker Linux WebKit 6/6·세 엔진 18/18 자동 PASS와 수동 UI 미수행 반영 |
| 0.1.2 | 2026-10-01 | 로그 제외 최종 이미지 독립 18/18·typecheck·HTTP PASS 반영 |
