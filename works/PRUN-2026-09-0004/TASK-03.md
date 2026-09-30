# TASK-03: 실제 편집 상호작용·보안 회귀 테스트

## WORK

PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | EditorView 상호작용과 악성 붙여넣기 차단을 실행 테스트로 입증 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, FR-05, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01, TASK-02 완료 후 |
| Phase | Phase 3 |

## Scope

- Vitest/jsdom의 내부 EditorView fixture에서 타이핑, 선택·cursor 이동, shortcut, undo/redo를 실행한다.
- 목록·표·코드 블록 명령을 실행하고 문서·selection·Markdown export를 단언한다.
- 허용 HTML 붙여넣기 결과와 script/event/iframe/style 제거, raw 텍스트 표시를 검증한다.
- `javascript:`·`data:`·entity·공백/제어문자 변형 URL의 비탐색 DOM을 검증한다.
- 표 삽입·행/셀 편집 후 모든 `table_cell`의 단일 paragraph를 단언한다.
- jsdom이 실제 브라우저 엔진 호환성을 입증하지 않는 한계를 결과에 기록한다. 별도 E2E stage는 실행하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/extensions/src/interaction.test.ts` | CREATE | 입력·선택·undo·구조 명령 상호작용 |
| `packages/extensions/src/paste.test.ts` | CREATE | 안전/위험 HTML 붙여넣기 |
| `packages/extensions/src/fixtures/*` | CREATE | 악성 URL·raw·표 fixture |
| `packages/extensions/package.json` | MODIFY | jsdom 테스트 환경 설정 시 |

## Acceptance Criteria

- [x] 목록·표·코드·undo/redo·input rule·shortcut·selection 상호작용 테스트 실행.
- [x] 허용 HTML 변환 및 Markdown export 테스트 실행.
- [x] script/event/raw HTML 비실행, 위험 URL 비탐색 테스트 실행.
- [x] 표 셀 단일 paragraph 계약 검증.
- [x] `pnpm build`, `pnpm typecheck`, `pnpm test` 통과.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

---
