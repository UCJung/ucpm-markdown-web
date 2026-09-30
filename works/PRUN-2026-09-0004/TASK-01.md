# TASK-01: 입력 규칙·선택·목록/표/코드 명령 구현

## WORK

PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 지원 Markdown 패턴과 구조 편집 명령을 상태 transaction으로 제공 |
| 매핑 요구사항 | FR-01, FR-02, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

- `extensions`에 Markdown input rules와 shortcut keymap을 등록한다. heading/blockquote/목록/fenced code 시작 패턴을 처리하고 코드·raw 내부를 제외한다.
- 선택 영역·cursor를 transaction으로 변경하는 명령을 제공하고 유효하지 않은 위치는 명시적으로 거부한다.
- 목록 생성·전환, 표 삽입·행/셀 편집, 코드 블록 전환 명령을 제공한다. 기존 core undo/redo와 함께 사용한다.
- 모든 표 명령의 결과에서 `table_cell` 직접 자식을 단일 `paragraph`로 유지한다.
- `core`에는 DOM 의존성을 추가하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/extensions/src/index.ts` | MODIFY | 공개 편집 확장·명령 |
| `packages/extensions/src/input-rules.ts` | CREATE | Markdown 입력 규칙 |
| `packages/extensions/src/commands.ts` | CREATE | 선택·목록·표·코드 명령 |
| `packages/extensions/src/keymap.ts` | CREATE | 단축키 매핑 |
| `packages/extensions/package.json` | MODIFY | ProseMirror inputrules/list/table 의존성 |
| `packages/extensions/tsconfig.json` | MODIFY | 전체 소스·테스트 타입검사 |
| `packages/extensions/tsconfig.build.json` | CREATE | 선언 빌드 대상 |
| `packages/extensions/src/*.test.ts` | CREATE | 명령·셀 구조 테스트 |

## Acceptance Criteria

- [x] heading·인용문·목록·코드 입력 규칙이 구조를 전환하고 코드/raw 내부에서 오작동하지 않음.
- [x] 선택·cursor, 목록·표·코드 명령을 transaction으로 실행 가능.
- [x] undo/redo와 shortcut keymap이 실제 편집 view에서 사용 가능하도록 plugin 연결.
- [x] 모든 표 명령의 결과에서 각 `table_cell` 직접 자식이 `paragraph` 1개.
- [x] core 런타임·import에 DOM 의존성 없음.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
```

---
