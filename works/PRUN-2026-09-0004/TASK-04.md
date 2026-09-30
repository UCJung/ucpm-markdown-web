# TASK-04: 입력 규칙 매핑과 목록 키보드 결함 수정

## WORK

PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 교차검증 High 실수정 및 관련 경계 보강 |
| 매핑 요구사항 | FR-01~05, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-03 완료 후 |
| Phase | Phase 4 |

## Scope

- review_by_claude.md High 입력규칙 2건을 실제 View 입력으로 재현하고 수정한다. 삭제·wrap 전후 좌표는 트랜잭션 mapping 또는 변경 문서 기준으로 계산한다.
- 인용문·bullet·ordered 입력의 node 구조뿐 아니라 마커 제거와 텍스트 내용, 뒤 블록 무변경을 단언한다. ordered 입력 시작 번호도 보존한다.
- 목록 Enter 새 항목·Tab 중첩·Shift-Tab 해제 키맵을 prosemirror-schema-list 명령으로 구성한다. core baseKeymap보다 확장 키맵이 우선하도록 순서를 수정하고 기존 core 회귀를 검증한다.
- 잘못된 cursor 위치 거부 테스트의 실제 인자를 수정한다. 인자 고정 extensionCommands와 매개변수 명명 export 사용 차이를 문서화한다.
- 새 표 cell header/align은 기존 행/열 의미를 보존한다. 미사용 prosemirror-tables 의존성을 제거하고 ProseMirror Node 타입을 재사용한다.
- 후속 TASK-05 safeview/paste와 충돌을 피한다. 교차검증 재실행 없음.

## Files

| Path | Action | Description |
|------|--------|-------------|
| packages/extensions/src/input-rules.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/keymap.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/commands.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/index.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/*test.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/core/src/editor.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/core/src/*test.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/package.json | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/vite.config.ts | MODIFY/CREATE | 수정·회귀 검증 |
| pnpm-lock.yaml | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/README.md | MODIFY/CREATE | 수정·회귀 검증 |

## Acceptance Criteria

- [x] 인용/목록 입력 marker 잔존·범위 예외·다른 블록 손상 없음.
- [x] ordered 시작번호 보존, 목록 Enter/Tab/Shift-Tab 실제 keydown 회귀 통과.
- [x] 확장/base keymap 우선순위와 기존 core 동작 회귀 통과.
- [x] invalid cursor 및 표속성 보존 테스트 통과.
- [x] 전체 build/typecheck/test/diff check PASS.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```
