# TASK-00: 공용 검증 도구·명령 설정

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | Playwright·접근성·VitePress 실행 기반을 한 번에 고정 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | S |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

1. 기존 루트 스크립트 확인 → `build`, `typecheck`, `test`를 보존하고 Playwright·문서 실행 명령 추가 → 루트 명령 계약.
2. 도구 버전 선택 → Playwright Test, axe Playwright 연동, VitePress 개발 의존성 추가 → lockfile 동기화.
3. 재현성 확인 → frozen lockfile 설치와 각 CLI 실행 가능 여부 확인 → 후속 Task에 버전 전달.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `package.json` | MODIFY | 공용 devDependency와 E2E·문서 명령; 이 Task 단독 소유 |
| `pnpm-lock.yaml` | MODIFY | 루트 의존성 잠금; 이 Task 단독 소유 |
| `pnpm-workspace.yaml` | MODIFY | esbuild 빌드만 명시 허용(D-04) |

## Acceptance Criteria

- [x] 루트 기존 build/typecheck/test 명령을 유지한다.
- [x] Playwright Test·axe 연동·VitePress 버전을 lockfile에 고정한다.
- [x] `pnpm install --frozen-lockfile`이 성공한다.
- [x] TASK-01/02가 루트 manifest·lockfile을 수정하지 않고 도구를 실행할 수 있다.

## Verify

```bash
pnpm install --frozen-lockfile
pnpm exec playwright --version
node -p "require('vitepress/package.json').version"
```

---
