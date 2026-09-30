# TASK-01: workspace와 6개 패키지 스캐폴드 구성

## WORK

PRUN-2026-09-0001: WYSIWYG Markdown 에디터 모노레포 기반 구성

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | pnpm 설치·빌드·타입검사·단위테스트가 실행되는 6개 패키지 workspace 구성 |
| 매핑 요구사항 | FR-01, FR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

- 저장소 루트에 pnpm workspace, TypeScript 공통 설정, build·typecheck·test 스크립트를 구성한다.
- Vite library mode로 라이브러리 5개를 빌드하고 선언 파일을 생성한다.
- `core`, `markdown`, `extension-api`, `adapter-vanilla`, `extensions`에 `src/index.ts`, `package.json`의 `exports`/`types`, package별 빌드·타입검사·테스트 스크립트를 제공한다.
- `playground`를 private 소비 앱 패키지로 구성하고 편집 기능 없는 최소 진입점을 제공한다.
- 로컬 workspace 식별용 `@uc-markdown-web/*`와 전 패키지 `private: true`를 사용한다. npm 공개 이름·게시 설정은 REQ-2026-09-0006에서 확정한다.
- `extension-api`는 프레임워크 의존성 없이 구성하고 의존 그래프의 순환을 방지한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `package.json` | CREATE | 루트 스크립트·개발 도구 |
| `pnpm-workspace.yaml` | CREATE | `packages/*` workspace 선언 |
| `pnpm-lock.yaml` | CREATE | 의존성 설치 결과 고정 |
| `tsconfig.base.json` | CREATE | 공통 TypeScript 규칙 |
| `packages/{core,markdown,extension-api,adapter-vanilla,extensions}/package.json` | CREATE | private 패키지·exports·빌드 스크립트 |
| `packages/{core,markdown,extension-api,adapter-vanilla,extensions}/tsconfig.json` | CREATE | 패키지 타입검사·선언 파일 설정 |
| `packages/{core,markdown,extension-api,adapter-vanilla,extensions}/vite.config.ts` | CREATE | 라이브러리 빌드 구성 |
| `packages/{core,markdown,extension-api,adapter-vanilla,extensions}/src/index.ts` | CREATE | 최소 공개 진입점 |
| `packages/playground/package.json` | CREATE | private 소비 앱·검증 명령 |
| `packages/playground/tsconfig.json` | CREATE | playground 타입검사 |
| `packages/playground/index.html` | CREATE | 앱 HTML 진입점 |
| `packages/playground/src/main.ts` | CREATE | 앱 초기 진입점 |

## Acceptance Criteria

- [x] `pnpm install --frozen-lockfile` 실행 성공.
- [x] 루트 `pnpm build`, `pnpm typecheck`, `pnpm test` 실행 성공.
- [x] 6개 패키지의 `package.json`과 공개 진입점 확인.
- [x] 라이브러리 5개의 빌드 산출물 및 선언 파일 확인.
- [x] 패키지 의존 그래프의 순환과 `core`의 프레임워크 의존성 없음.
- [x] 편집기 문서 모델·Markdown 변환·Vanilla mount 기능은 구현하지 않음.

## Verify

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
```

---
