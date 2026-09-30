# TASK-02: raw 원문 보존·정규화 fixture와 회귀 검증

## WORK

PRUN-2026-09-0003: GFM Markdown 변환과 미지원 블록 원문 보존 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | raw HTML·미지원 블록을 실행 없이 원문 그대로 보존하고 변환 판정 기준 고정 |
| 매핑 요구사항 | FR-02, FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- `raw_markdown_block` node를 정의하고 원본 블록 source slice를 문자열 속성으로 저장한다.
- mdast `html` block과 명시적 remark math/directive recognizer의 블록 node를 raw로 분류한다. 지원하지 않는 다른 mdast block node도 source position으로 fallback한다.
- 블록 시작/끝 offset을 사용하고 code fence 내부의 `$$`·`:::` 문자열을 raw로 오인하지 않는다. 임의의 미식별 문법은 보존 보장 대상에서 제외하고 fixture 계약의 식별 패턴을 명시한다.
- serializer는 raw source를 수정·escape·해석하지 않는다. 블록 간 구분 줄바꿈만 정규화한다.
- fixture에 raw HTML, math, directive, 혼합 문서, code fence 내부 유사 패턴, CRLF, trailing newline, 중첩·인접 블록을 포함한다.
- 지원 문법은 의미 비교와 허용 정규화 표, raw 블록은 source 일치 비교로 검증한다. raw 입력/기대 export를 fixture에 기록한다.
- 위험 href는 원문 의미로 유지하되 DOM 렌더 단계의 안전 scheme 제한을 후속 REQ-0004/0005에 인계한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/markdown/src/schema.ts` | MODIFY | raw block node |
| `packages/markdown/src/parser.ts` | MODIFY | 위치 기반 raw source slice·recognizer |
| `packages/markdown/src/serializer.ts` | MODIFY | raw 무변형 출력 |
| `packages/markdown/src/fixtures/*` | CREATE | GFM·raw·정규화 입출력 fixture |
| `packages/markdown/src/*.test.ts` | CREATE/MODIFY | 의미·원문 보존·오인식 회귀 테스트 |
| `packages/markdown/README.md` | CREATE | fixture 계약·지원/미지원 범위·정규화 표 |

## Acceptance Criteria

- [ ] raw HTML·math·directive 보존 fixture의 raw source가 import/export 중 동일.
- [ ] raw 블록이 코드에서 HTML/DOM으로 렌더·실행되지 않음.
- [ ] fence 내부 math/directive 유사 문자열은 코드 블록으로 유지.
- [ ] 지원 GFM fixture의 의미 보존·정규화 허용 차이가 문서와 테스트에서 일치.
- [ ] raw 보존 fixture의 입력과 기대 export 원문 기록.
- [ ] 혼합 블록·CRLF·trailing newline 테스트 통과.
- [ ] `pnpm build`, `pnpm typecheck`, `pnpm test` 통과.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
git diff --check
```

---
