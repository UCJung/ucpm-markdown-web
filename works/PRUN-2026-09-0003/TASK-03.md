# TASK-03: raw 변환 경계 결함 수정

## WORK

PRUN-2026-09-0003: GFM Markdown 변환과 미지원 블록 원문 보존 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | Claude High 2건 재현·수정 및 관련 parser 경계 회귀 방지 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-02 완료 후 |
| Phase | Phase 3 |

## Scope

- review_by_claude.md High 2건을 실제 입력으로 재현하고 회귀 테스트로 고정한다.
- 인용·목록 내부 HTML을 예외 없이 원문 보존한다. 원본 prefix를 중복 생성하지 않도록 보수적 컨테이너 전체 raw 보존을 허용하고 그 강등 규칙을 README/fixture에 명시한다.
- explicit raw range와 mdast 노드가 부분 겹치는 경우 앞·뒤 지원 텍스트가 유실되지 않게 처리한다. `text\n:::note\n\n:::\n`와 반대 방향 겹침 회귀를 포함한다.
- 같은 parser의 관련 Medium 경계를 함께 수정한다: 컨테이너의 암묵 종료 fence 뒤 raw 탐지, indented code 오인식, 닫힘 탐색의 컨테이너/fence 제한 및 반복 전체 스캔 방지.
- 미지원 인라인(image/reference/inline HTML 등)이 담긴 블록은 원문 raw fallback한다. 이미지 시각 편집·업로드 기능은 추가하지 않는다. 과거 TASK-02 미구현 오류 문구를 제거한다.
- table_cell 스키마를 serializer의 단일 paragraph 계약과 일치시키고 회귀 검증한다.
- raw 마지막 개행과 컨테이너 강등 계약을 명시한다. 지원 블록 간 개별 stringify의 인접 목록 경계는 회귀로 확인하고 유실 또는 의미 변화가 재현되면 수정한다.
- 중복 타입/지원목록 공통화 Low는 이번 수정에 필요할 때만 수행한다. 재교차검증을 수행하지 않는다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| packages/markdown/src/parser.ts | MODIFY | raw fallback/overlap/fence 경계 |
| packages/markdown/src/schema.ts | MODIFY | table cell 계약 |
| packages/markdown/src/serializer.ts | MODIFY | 재현된 경계 직렬화 |
| packages/markdown/src/fixtures/* | MODIFY | High/Medium 회귀 입력 |
| packages/markdown/src/*.test.ts | MODIFY | 데이터 무손실 회귀 |
| packages/markdown/README.md | MODIFY | 보존·강등·정규화 계약 |

## Acceptance Criteria

- [x] 인용·목록 내부 HTML import/export 원문 보존, 예외 없음.
- [x] raw 부분 겹침 사례의 전후 텍스트 유실 없음.
- [x] fence 컨테이너 종료·indented code와 후속 raw 인식 회귀 통과.
- [x] 닫힘 탐색의 컨테이너/fence 경계 및 다수 미닫힘 입력 회귀 통과.
- [x] 미지원 inline 블록 fallback 계약과 fixture 일치.
- [x] table_cell 스키마·serializer 계약 일치.
- [x] 전체 build/typecheck/test 및 diff check 통과.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```
