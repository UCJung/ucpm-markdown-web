# TASK-05: 유효 GFM 혼합 목록 import 결함 수정

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요
| 항목 | 내용 |
|---|---|
| 목적 | 일반 항목과 체크 항목이 섞인 유효 GFM 목록 import 예외 및 데이터 유실 방지 |
| 매핑 요구사항 | FR-01, FR-02, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00 |
| Phase | Phase 2 |

## Scope
1. 혼합 목록 재현 → parser/schema/serializer의 최소 호환 수정 → 항목 순서·체크 상태·중첩 의미 보존.
2. 일반·체크 혼합 목록과 중첩 fixture → parse/serialize/parse 회귀 테스트 → 예외와 데이터 유실 차단.
3. 기존 명령·입력 규칙·paste와 호환성 확인 → 전체 build/typecheck/test → 회귀 결과.

## Files
| Path | Action | Description |
|---|---|---|
| packages/core/src/** | MODIFY | 목록 schema/검증 및 회귀 테스트 |
| packages/markdown/src/** | MODIFY | parser/serializer 및 roundtrip 회귀 테스트 |
| packages/extensions/src/** | MODIFY | 필요 시 목록 명령 호환성 및 테스트 |

## Acceptance Criteria
- [x] 같은 bullet 목록 내 일반·checked·unchecked 항목을 예외 없이 import한다.
- [x] 항목 순서·체크 상태·중첩 내용이 roundtrip 후 보존된다.
- [x] 일반 목록과 순수 task 목록의 기존 동작이 유지된다.
- [x] 전체 build/typecheck/Vitest가 통과한다.
- [x] fixture workaround와 실제 제품 수정 범위를 명확히 분리한다.

## Verify
```bash
pnpm build
pnpm typecheck
pnpm test
```
