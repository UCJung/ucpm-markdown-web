# TASK-01: GFM 스키마와 Markdown import/export 구현

## WORK

PRUN-2026-09-0003: GFM Markdown 변환과 미지원 블록 원문 보존 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 지원 Markdown·GFM 문법을 구조화 문서로 변환하고 다시 Markdown으로 출력 |
| 매핑 요구사항 | FR-01, FR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

- core schema의 기존 블록·인라인 노드를 재사용하고, 체크 상태·코드 언어·표 정렬에 필요한 속성 및 표/행/셀 node·취소선 mark를 추가한다.
- `createMarkdownSchema()`를 공개하고 생성한 schema를 core `createEditor({ schema, doc })`에 전달 가능하게 한다.
- unified/remark-parse/remark-gfm으로 기본 블록·인라인 및 표·체크리스트·취소선·자동 링크를 ProseMirror doc으로 변환한다.
- ProseMirror doc을 Markdown으로 직렬화한다. heading level, ordered list start, task checked, table alignment, code language, link href/title, soft/hard break를 유지한다.
- 지원 문법의 왕복 의미를 구조·텍스트·속성 기반으로 비교한다. 허용 정규화는 TASK-02 fixture 계약에 따른다.
- `markdown` → `core` 의존 방향을 유지한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/markdown/package.json` | MODIFY | remark/GFM 의존성·테스트 명령 |
| `packages/markdown/src/index.ts` | MODIFY | 공개 변환 API |
| `packages/markdown/src/schema.ts` | CREATE | GFM/표/체크리스트 스키마 |
| `packages/markdown/src/parser.ts` | CREATE | mdast → ProseMirror 변환 |
| `packages/markdown/src/serializer.ts` | CREATE | ProseMirror → Markdown 변환 |
| `packages/markdown/src/*.test.ts` | CREATE | 기본/GFM 왕복 테스트 |
| `packages/core/src/schema.ts` | MODIFY | 필요한 범용 노드 속성·표현 조정 시 |
| `packages/markdown/tsconfig.json` | MODIFY | 전체 소스·테스트 타입검사 |
| `packages/markdown/tsconfig.build.json` | CREATE | 선언 빌드에서 테스트 제외 |

## Acceptance Criteria

- [x] 기본 블록·인라인 및 GFM 표·체크리스트·취소선·자동 링크 import/export 테스트 통과.
- [x] 링크·표 정렬·체크 상태·코드 언어·목록 시작 번호 등 의미 속성 유지.
- [x] `createMarkdownSchema()`의 schema로 core 편집기 생성 가능.
- [x] `core`에서 `markdown` import 없음.
- [x] `pnpm build`, `pnpm typecheck`, `pnpm test` 통과.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
```

---
