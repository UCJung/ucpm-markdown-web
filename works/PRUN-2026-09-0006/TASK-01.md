# TASK-01: 품질·브라우저·접근성 자동 검증

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 전체 공개 후보의 기본 품질과 playground 사용자 흐름을 실제 실행해 검증 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-01, NFR-02, NFR-03 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00 완료 후 |
| Phase | Phase 2 |

## Scope

1. playground 진입 확인 → Playwright webServer·Chromium/Firefox/WebKit 프로젝트 구성 → 엔진별 실행 환경.
2. 핵심 사용자 흐름 확인 → Markdown 초기화·시각 편집·Markdown 조회·허용/위험 HTML 붙여넣기·페이지 종료 시나리오 구현 → E2E 테스트.
3. 키보드 경로 확인 → 탭 이동·편집 영역 조작·명령 실행과 상태 갱신 검증 → 접근성 수동 보조 시나리오.
4. WCAG 2.2 AA 목표 적용 → axe 자동 점검에서 critical/serious 발견 시 테스트 실패 처리 → 엔진별 결과.
5. 전체 workspace 검증 → build/typecheck/Vitest와 테스트 수 실행·기록 → TASK-04 전달 자료.
6. 브라우저 결함 발견 → 소유 범위의 playground 수정·재검증, 다른 패키지 결함은 orchestrator에 파일·재현 절차 보고 → 보정 Task 경로.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `playwright.config.ts` | CREATE | 개발 서버·세 엔진·실행 설정 |
| `tests/e2e/*.spec.ts` | CREATE | 사용자 흐름·키보드·axe 검사 |
| `packages/playground/src/main.ts` | MODIFY IF NEEDED | 테스트로 확인한 playground 결함 수정 |
| `packages/playground/index.html` | MODIFY IF NEEDED | 편집 표면 접근성 결함 수정 |
| `packages/playground/src/styles.css` | MODIFY IF NEEDED | 가시적 포커스 등 결함 수정 |

## Acceptance Criteria

- [x] 전체 공개 후보 5개의 build·typecheck·Vitest가 성공하고 테스트 수를 기록한다.
- [x] 초기화·시각 편집·조회·붙여넣기·종료 시나리오가 Chromium·Firefox·WebKit에서 성공한다.
- [x] 키보드 조작과 편집 상태 변화를 검증한다.
- [x] axe critical/serious 0건을 릴리스 후보 통과 기준으로 적용한다.
- [x] 실행 OS·Node·pnpm·Playwright/브라우저 버전, 명령, 결과, 발견 사항을 TASK 결과에 기록한다.
- [x] 수동·보조공학 검증은 별도 미검증 항목으로 TASK-04에 전달한다.

## Verify

2026-10-01 재개: D-07 승인 Docker Linux 경로는 docs/[GUIDE]_DEPLOYMENT.md §3을 적용한다. Windows WebKit 실행 실패와 Linux PASS를 구분한다.

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm exec playwright install chromium firefox webkit
pnpm exec playwright test
```

---
