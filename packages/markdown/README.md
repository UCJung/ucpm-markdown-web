# @uc-markdown-web/markdown

## 변환 계약

| 입력 범위 | import 결과 | export 기준 |
|---|---|---|
| 기본 Markdown·GFM 표·체크리스트·취소선·자동 링크 | 구조화된 ProseMirror 문서 | 구조·텍스트·속성 의미 보존 |
| raw HTML block | `raw_markdown_block.attrs.source` | source 무변형 출력 |
| `$$` display math block | `raw_markdown_block.attrs.source` | source 무변형 출력 |
| `:::name` directive block | `raw_markdown_block.attrs.source` | source 무변형 출력 |
| 다른 mdast block | `raw_markdown_block.attrs.source` | source 무변형 출력 |

## 정규화 규칙

| 대상 | 허용 차이 | 검증 |
|---|---|---|
| 지원 Markdown | 목록 기호·표 공백·fence·문서 경계 줄바꿈 | 재파싱 문서 JSON 비교 |
| raw source | 없음 | `attrs.source`와 fixture source 문자열 동일 비교 |
| raw 블록 경계 | 인접 블록 구분과 문서 끝 개행 | fixture export 문자열 비교 |

## raw 식별 범위

- HTML: remark의 block `html` node를 source offset으로 보존한다.
- Math: 독립된 `$$` 시작·종료 줄을 display math block으로 보존한다.
- Directive: 독립된 `:::name` 시작과 `:::` 종료 줄을 directive block으로 보존한다.
- Fence: fenced 또는 들여쓴 code block 내부의 `$$`·`:::`은 code로 유지한다.
- Inline HTML·미식별 임의 문법은 raw 보존 대상이 아니며 조용히 유실하지 않고 오류를 반환한다.

raw source는 문자열일 뿐 HTML·DOM·스크립트로 렌더링하거나 실행하지 않는다. URL scheme의 DOM 안전 정책은 후속 어댑터 범위다.
