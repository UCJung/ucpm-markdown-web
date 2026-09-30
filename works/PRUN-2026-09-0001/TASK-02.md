# TASK-02: 패키지 경계·브라우저 정책 문서화 및 실행 검증

## WORK

PRUN-2026-09-0001: WYSIWYG Markdown 에디터 모노레포 기반 구성

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 후속 REQ가 따를 패키지 의존 방향과 브라우저 지원 기준 확정 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- `README.md`에 설치·검증 명령과 6개 패키지 책임·공개 진입점·허용 의존성 표를 작성한다.
- `docs/[SPEC]_BROWSER_SUPPORT.md`에 Chrome·Edge·Firefox·Safari 최신·직전 주요 버전 지원 정책과 갱신 기준을 작성한다. `docs/[GUIDE]_AUTHORING_STYLE.md`의 메타·목차·참조·이력 형식을 적용한다.
- Playwright Chromium·Firefox·WebKit 엔진과 브라우저별 검증 대상의 대응 관계 및 Edge/Safari 실제 릴리스 버전 보증 한계를 구분한다. 버전별 E2E 매트릭스 구현은 REQ-2026-09-0006에 연결한다.
- 패키지 공개 진입점을 소비하는 smoke test를 추가하여 build·typecheck·test 명령이 실제 파일을 검증하도록 한다.
- 기존 `docs/[SPEC]_TECH_STACK.md`, `docs/[PLAN]_MVP_ROADMAP.md`, `docs/[PLAN]_REQ_CREATION.md`를 보존한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `README.md` | CREATE | workspace 사용법·패키지 책임·의존 방향 |
| `docs/[SPEC]_BROWSER_SUPPORT.md` | CREATE | 지원 브라우저 및 향후 검증 정책 |
| `packages/*/src/*.test.ts` | CREATE | 공개 진입점 소비 smoke test, 필요한 패키지에 한정 |
| `package.json` | MODIFY | smoke test 실행 조정 시 |

## Acceptance Criteria

- [x] 6개 패키지 책임·진입점·허용 의존성이 README와 manifest에서 일치.
- [x] Chrome·Edge·Firefox·Safari 최근 2개 주요 버전이 문서에 명시.
- [x] Playwright 엔진 검증과 실제 브라우저 버전 지원 정책의 차이 및 REQ-2026-09-0006 후속 검증 연결 확인.
- [x] 공개 진입점 소비 smoke test가 workspace `pnpm test`에 포함.
- [x] `pnpm build`, `pnpm typecheck`, `pnpm test` 통과.
- [x] 기존 미추적 기획문서 3개 내용 유지.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

---
