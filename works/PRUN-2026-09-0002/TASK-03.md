# TASK-03: 교차검증 명령 성공 계약 및 문서 입력 경계 수정

## WORK
PRUN-2026-09-0002: 프레임워크 중립 편집 코어와 확장 API 구현

## Task 개요
| 항목 | 내용 |
|---|---|
| 목적 | 교차검증 High 1건과 관련 입력 검증 누락 수정 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-02 완료 후 |
| Phase | Phase 3 |

## Scope
- review_by_claude.md의 High 원문을 읽고, filterTransaction으로 거부된 기본·확장 명령이 false를 반환하도록 수정.
- 명령 결과와 실제 transaction 적용 결과를 조합하고 회귀 테스트 추가.
- 초기 문서의 Node·JSON 양쪽 경로에서 schema.topNodeType 검증.
- options.schema와 확장 node/mark spec 동시 사용의 무시 경로 제거. 외부 스키마를 확장 병합의 기반으로 사용하고 실제 기반과의 충돌을 거부.
- listener 오류는 이미 적용된 transaction을 되돌리지 않는 계약을 API 주석과 오류 메시지에 명시. snapshot 통지 정책 유지.

## Files
| Path | Action | Description |
|---|---|---|
| packages/core/src/editor.ts | MODIFY | 명령 적용 반환값 및 초기 문서 검사 |
| packages/core/src/schema.ts | MODIFY | 외부 기반 스키마의 확장 병합·충돌 검사 |
| packages/core/src/*.test.ts | MODIFY | 필터 거부·top node·custom schema 회귀 검증 |

## Acceptance Criteria
- [x] 필터 거부 기본·확장 명령은 false, 적용된 명령은 true 반환.
- [x] 잘못된 최상위 Node·JSON 명시적 오류.
- [x] 외부 기반 스키마에 확장 노드 병합 및 충돌 검사 통과.
- [x] listener 오류의 적용 이후 발생 계약 명시.
- [x] 전체 build/typecheck/test 통과.

## Verify
```bash
pnpm typecheck
pnpm test
git diff --check
```
