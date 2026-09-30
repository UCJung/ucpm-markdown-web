# TASK-05: 안전 클립보드와 View·붙여넣기 경계 수정

## WORK

PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 교차검증 High 실수정 및 관련 경계 보강 |
| 매핑 요구사항 | FR-01~05, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-04 완료 후 |
| Phase | Phase 5 |

## Scope

- High 클립보드 직렬화 경로를 실제 재현한다. 동일 safe DOM allowlist 기반 clipboardSerializer를 제공하고 copy/cut 이벤트 회귀를 추가한다. 확장 schema 미지원 node는 안전한 텍스트 fallback 또는 명시적 mount 오류로 처리한다.
- 문단 중간 inline paste는 문단을 불필요하게 분할하지 않는다. table_cell에서는 inline/평문으로, code에서는 평문으로 붙여넣고 주변 구조·선택 전후 텍스트를 보존한다.
- 정규화 빈 결과는 text/plain fallback을 사용하며 평문이 없으면 선택 내용을 삭제하지 않는다. 평문 붙여넣기 경로를 명시한다.
- raw atom DOM을 명시적으로 noneditable로 하고 text-only 보존 계약을 검증한다.
- View updateState 중 core dispatch 재진입과 editor-first destroy를 방어한다. 실제 재현 가능한 경로를 테스트하며 core의 일반 reentrant dispatch 금지 계약을 임의 폐기하지 않는다. 필요 시 최소 lifecycle/query API로 안전하게 연결하고 문서화한다.
- 중첩 table paste의 행 중복 수집을 제거한다. drop도 동일 allowlist 안전 경로를 거치게 하거나 명시적으로 거부한다. zero-width/soft-hyphen URL 우회는 보수적으로 차단한다.
- jsdom 한계와 실제브라우저 후속검증 필요를 명시한다. 교차검증 재실행 없음.

## Files

| Path | Action | Description |
|------|--------|-------------|
| packages/extensions/src/safe-view.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/paste.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/safe-url.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/*test.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/src/fixtures/* | MODIFY/CREATE | 수정·회귀 검증 |
| packages/extensions/README.md | MODIFY/CREATE | 수정·회귀 검증 |
| packages/core/src/editor.ts | MODIFY/CREATE | 수정·회귀 검증 |
| packages/core/src/*test.ts | MODIFY/CREATE | 수정·회귀 검증 |

## Acceptance Criteria

- [x] copy/cut에 예외 없고 raw/위험href clipboard DOM도 비실행.
- [x] inline/표셀/code paste에서 기존 텍스트/구조와 단일paragraph 유지.
- [x] 빈 HTML 안전 변환이 선택내용을 삭제하지 않고 평문 fallback 가능.
- [x] raw noneditable 및 View update/destroy 순서 회귀 통과.
- [x] 중첩표/drop/난독화URL 정책과 회귀 일치.
- [x] 전체 build/typecheck/test/diffcheck PASS.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```
