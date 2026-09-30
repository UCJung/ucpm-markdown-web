# TASK-02: 안전 view·HTML 붙여넣기 정규화 구현

## WORK

PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | raw와 링크를 안전하게 표시하고 HTML 붙여넣기를 허용 구조로 변환 |
| 매핑 요구사항 | FR-03, FR-04, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- `extensions` 내부에 ProseMirror `EditorView`용 안전 DOM spec과 paste 처리기를 제공한다. Vanilla 공개 mount·lifecycle은 추가하지 않는다.
- 허용 HTML 제목·문단·목록·링크·표·코드·기본 인라인 서식을 ProseMirror Slice/Node로 변환하고 Markdown export로 검증 가능하게 한다.
- script/style/iframe 등 실행·비허용 요소와 event/style/비허용 속성을 문서 모델에 반영하지 않는다. 비허용 콘텐츠의 텍스트 처리 규칙을 고정한다.
- href는 entity 디코딩 후 제어문자·공백·scheme을 검사한다. 위험 붙여넣기 링크는 텍스트로 남기고 링크 mark를 제거한다.
- 기존 Markdown 위험 href mark는 보존하되 view에서 `<a href>` 대신 비탐색 span으로 표시한다.
- raw HTML/raw Markdown block은 source를 escape된 텍스트로 표시하고 `innerHTML` 사용을 배제한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/extensions/src/safe-view.ts` | CREATE | 내부 EditorView schema/DOM spec |
| `packages/extensions/src/paste.ts` | CREATE | HTML allowlist 변환·paste plugin |
| `packages/extensions/src/safe-url.ts` | CREATE | href 검증·탐색 차단 |
| `packages/extensions/src/index.ts` | MODIFY | 후속 어댑터가 소비할 내부 연결 API |
| `packages/extensions/src/*.test.ts` | CREATE | 허용/위험 HTML·URL fixture |
| `packages/markdown/src/schema.ts` | MODIFY | 안전 view에 필요한 schema 경계 조정 시 |
| `packages/extensions/package.json` | MODIFY | `prosemirror-view`·jsdom 의존성 |

## Acceptance Criteria

- [ ] 허용 HTML이 문서 구조로 변환되고 Markdown으로 export 가능.
- [ ] script·event·비허용 속성이 문서 모델·view DOM에 없음.
- [ ] raw source는 텍스트로 표시되고 실행되지 않음.
- [ ] Markdown 위험 href 원문은 유지되나 클릭 가능한 링크 DOM 없음.
- [ ] entity/제어문자/공백으로 우회한 위험 URL도 탐색 불가.
- [ ] `adapter-vanilla` 공개 mount API·playground 기능 변경 없음.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
```

---
