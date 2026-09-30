# TASK-02: headless 편집기 lifecycle·명령·구독 및 테스트 구현

## WORK

PRUN-2026-09-0002: 프레임워크 중립 편집 코어와 확장 API 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | DOM 없이 동작하는 편집기 상태·명령·구독·정리 API 제공 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- `createEditor({ extensions, doc })`로 schema·`EditorState`·history·keymap·확장 plugin을 구성한다.
- `getState`·`dispatch`·기본 명령·`subscribe`·`destroy`를 제공한다. 명령은 성공 여부를 boolean으로 반환한다.
- transaction 적용 시 새 상태를 저장한 뒤 listener를 동기 통지한다. listener 목록은 통지 시작 시 스냅샷으로 고정한다.
- 통지 중 재진입 dispatch는 오류 처리한다. 해제·destroy는 멱등 처리하고 destroy 후 dispatch/명령을 거부한다.
- 확장 `onCreate` 호출·실패 시 정리·`onDestroy` 역순 호출을 구현한다. listener/hook 오류는 나머지 처리 후 집계한다.
- Node/Vitest에서 명령, 상태 변경, subscribe/unsubscribe, undo/redo, lifecycle, 예외 경로를 검증한다. keymap은 plugin 등록을 확인한다.
- 전 WORK 교차검증의 medium 2건을 반영하여 root `typecheck`·`test` 단독 실행 시 빌드 선행을 보장하고, core/extension-api의 타입검사에 전체 `src`·테스트·설정 파일을 포함한다. 선언 빌드에는 테스트 파일을 제외한다.
- `--passWithNoTests`를 실제 테스트가 생긴 `core`·`extension-api`에서 제거한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/core/src/editor.ts` | CREATE | headless 편집기 상태·구독·lifecycle |
| `packages/core/src/commands.ts` | CREATE | 기본 명령·undo/redo |
| `packages/core/src/index.ts` | MODIFY | 코어 API 공개 |
| `packages/core/src/*.test.ts` | CREATE/MODIFY | 명령·구독·lifecycle 테스트 |
| `packages/extension-api/src/*.test.ts` | CREATE | 타입·계약 테스트 |
| `packages/core/package.json` | MODIFY | ProseMirror 의존·테스트 명령 |
| `packages/extension-api/package.json` | MODIFY | 타입·테스트 명령 |
| `packages/core/tsconfig.json` | MODIFY | 소스·테스트 타입검사 구성 |
| `packages/core/tsconfig.build.json` | CREATE | 선언 빌드 대상 분리 |
| `packages/extension-api/tsconfig.json` | MODIFY | 소스·테스트 타입검사 구성 |
| `packages/extension-api/tsconfig.build.json` | CREATE | 선언 빌드 대상 분리 |
| `package.json` | MODIFY | 독립 typecheck·test 전에 workspace build 보장 |

## Acceptance Criteria

- [x] React/Vue·DOM 없이 편집기 생성, transaction 적용, 명령 실행, 상태 구독, 정리 가능.
- [x] 명령·구독·undo/redo·keymap 구성 테스트 통과.
- [x] 확장 생성·역순 정리·생성 실패 cleanup 테스트 통과.
- [x] 재진입, listener/hook 오류, 중복 해제·destroy, 종료 후 명령의 동작 테스트 통과.
- [x] `pnpm install --frozen-lockfile` 직후 `pnpm typecheck` 및 `pnpm test`를 각각 단독 실행 가능.
- [x] core/extension-api의 새 소스·테스트·설정 파일이 타입검사에 포함되고 선언 빌드에 테스트 파일 미포함.
- [x] Markdown 변환과 Vanilla DOM mount 기능 미구현.

## Verify

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
git diff --check
```

---
