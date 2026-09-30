# Claude 교차검증 — PRUN-2026-09-0003 (REQ-2026-09-0003)

> Status: PERFORMED
> Mode: auto · interactive
> Executor: Codex orchestrator · Claude CLI headless · claude 2.1.266
> Base: 468734e515c9261355d547a7f141c12d8e541afe
> Head: 2d87c4646088c8001e25526b8cf63a5674452b6a
> Range: 468734e515c9261355d547a7f141c12d8e541afe..2d87c4646088c8001e25526b8cf63a5674452b6a
> Verdict: needs-attention
> Findings: Critical 0 / High 2 / Medium 4 / Low 4
> Executed: 2026-09-30T07:15:26Z
> 렌즈 5종: 로직결함·경계·보안·동시성·공통화/재사용

## Critical

없음

## High

- [high] blockquote·list 내부의 block HTML이 raw 보존되지 않고 예외를 던진다 (packages/markdown/src/parser.ts:104-116, 0.78) — raw 식별은 `parseRootChildren`(root 레벨)에서만 수행된다. `parseBlock`의 blockquote/list 분기는 자식을 그대로 `parseBlock`에 재귀시키므로, mdast `html` 블록이 컨테이너 내부에 있으면 switch의 default로 떨어져 `Unsupported Markdown block: html.`을 throw한다.

예: `> <div>raw</div>` 또는 `- <div>raw</div>`. 이 입력은 `findExplicitRawRanges`의 `$$`/`:::` 패턴에도 걸리지 않으므로 root의 html 분기(parser.ts:73)에도 도달하지 않는다.

README는 "HTML: remark의 block `html` node를 source offset으로 보존한다"고 선언하고 FR-03은 raw HTML block의 무손실 import/export를 요구하므로 계약 위반이다. 유효한 GFM 문서에서 `parseMarkdown`이 전체 실패한다.

(테스트 fixture에 컨테이너 내부 HTML 사례가 없어 회귀로 잡히지 않음 — 실행 검증은 하지 않았고 코드 경로 기준 판단이다.) 권고: 블록 파싱을 컨테이너 재귀에서도 공통 진입점으로 통일하고(예: `parseBlock` 내부에서 `html`·미지원 타입을 root와 동일하게 `rawBlock(schema, source.slice(...))`로 fallback), blockquote/list item 내부 HTML fixture를 추가하라. raw_markdown_block이 blockquote/list_item content에 들어갈 수 있도록 schema group 확인도 필요하다.
- [high] explicit raw range가 노드와 부분 겹침일 때 range 앞 본문이 조용히 유실된다 (packages/markdown/src/parser.ts:79-84, 0.68) — `containsRange(nodeRange, explicitRawRange)`가 false면 raw slice를 `explicitRawRange`로 잡고(parser.ts:80-81) `skipOverlappingNodes`로 겹치는 후속 노드를 모두 건너뛴다. 이때 첫 노드가 explicit range보다 **앞에서 시작**하는 경우 `nodeRange.start`부터 `explicitRawRange.start` 직전까지의 원문이 어떤 노드에도 담기지 않고 사라진다.

재현 후보(lazy continuation):
```
text
:::note

:::
```
remark는 `text\n:::note`를 한 paragraph(라인1-2), `:::`를 별도 paragraph(라인4)로 파싱한다. explicit range는 라인2 시작~라인4 끝이므로 첫 paragraph는 range를 포함하지 못하고, slice는 `:::note\n\n:::`가 되어 `text`가 문서에서 완전히 사라진다.

NFR-01(변환 과정에서 텍스트 손실 금지)에 직접 반하며, 조용한 손실이라 사용자가 감지하기 어렵다. remark의 정확한 position은 실행 확인하지 않았고 CommonMark lazy continuation 규칙에 근거한 추정이다. 권고: 부분 겹침일 때 raw 범위를 `min(nodeRange.start, explicitRawRange.start)`부터 흡수하도록 확장하거나, explicit range가 노드 경계와 정합하지 않으면 raw 분류를 포기하도록 방어하라. 어느 쪽이든 "입력 source의 모든 offset이 정확히 하나의 출력 블록에 매핑된다"는 불변식을 테스트로 고정하는 것을 권한다(전체 slice 재조립 == 입력).

## Medium

- [medium] fenced code 상태가 컨테이너·문서 경계를 넘어 유지되어 이후 raw 탐지를 비활성화한다 (packages/markdown/src/parser.ts:239-258, 0.75) — `findExplicitRawRanges`의 `fencedCode`는 문서 전역 단일 변수이며, blockquote·list item 같은 컨테이너 안에서 열린 fence가 컨테이너 종료로 암묵 종료되는 CommonMark 규칙을 반영하지 않는다.

예:
```
> ```
> code

:::note
x
:::
```
라인1에서 `fencedCode`가 설정되고 닫는 fence가 없으므로 이후 모든 줄이 `continue`로 건너뛰어져, root 레벨의 `:::note` 블록이 raw로 식별되지 않는다. 해당 문서 뒷부분 전체가 raw 보존 대상에서 제외된다.

부수적으로 `codeFence`는 `containerContent`가 선행 공백을 최대 3칸만 제거한 문자열에 다시 `^ {0,3}`을 허용하므로, 4-6칸 들여쓴(=indented code) 백틱 줄도 fence 개시로 오인할 수 있다. `isIndentedCode` 가드는 raw opening 판정에만 적용되고 fence 판정에는 적용되지 않는다(parser.ts:255-259). 권고: fence 추적을 컨테이너 prefix(인용/목록 깊이)별 상태로 분리하고, 컨테이너 prefix가 끊기면 열린 fence를 닫힌 것으로 처리하라. fence 판정에도 `isIndentedCode` 가드를 적용하고, 미닫힌 fence 뒤의 directive/math fixture를 추가하라.
- [medium] 닫는 줄 탐색이 무제한이라 무관한 블록을 raw로 흡수하고 최악 O(n²)가 된다 (packages/markdown/src/parser.ts:263-294, 0.8) — `findRawClosingLine`은 빈 줄·다른 블록·fence 내부를 구분하지 않고 문서 끝까지 첫 번째 `$$`/`:::` 줄을 찾는다.

- 정확성: `:::note` 뒤에 수십 개 블록이 지나 등장하는 `:::` 한 줄이 그 사이의 제목·문단·표를 전부 하나의 raw 블록으로 흡수한다. 원문은 보존되지만 지원 문법이 통째로 편집 불가 raw로 강등되며 README의 "독립된 `:::name` 시작과 `:::` 종료" 계약보다 훨씬 공격적이다.
- 성능: 닫히지 않는 opening이 k개면 각각 문서 끝까지 스캔하여 O(k·n) → 붙여넣기 등으로 들어온 대용량 입력에서 입력 크기 제곱의 스캔이 발생한다. 라이브러리 소비자 입장에서 신뢰할 수 없는 입력을 파싱하는 경로이므로 입력검증 관점의 리스크이기도 하다. 권고: 닫는 줄 탐색에 경계를 부여하라: 빈 줄 하나로 종료하지 않더라도 최소한 (a) 컨테이너 prefix가 동일한 줄만 후보로 인정, (b) fence 내부 제외, (c) opening과 같은 mdast 블록 범위 내로 제한. 미닫힘 시 빠르게 포기하도록 스캔 상한을 두면 O(n²)도 함께 해소된다.
- [medium] 컨테이너가 raw range를 포함하면 컨테이너 전체가 raw로 강등된다 (packages/markdown/src/parser.ts:80-82, 0.8) — `containsRange(nodeRange, explicitRawRange)`가 true면 raw slice가 노드 전체(`nodeRange`)로 확장된다. nested quote/list fixture가 통과하는 것도 이 경로 덕분이지만, 지원 문법과 directive가 한 컨테이너에 섞이면 지원 문법까지 raw가 된다.

예:
```
> 인용 문단
>
> :::note
> body
> :::
```
blockquote 전체가 `raw_markdown_block` 하나가 되어 "인용 문단"의 구조·인라인 마크가 문서 모델에서 사라진다. 텍스트는 보존되므로 NFR-01 위반은 아니지만, FR-01(지원 문법 import)과 README 계약에 이 강등 규칙이 명시되어 있지 않다. 권고: 컨테이너 내부에서 raw를 블록 단위로 재귀 분류하도록 개선하거나(권장), 최소한 README "raw 식별 범위"에 "컨테이너 내부에 raw가 있으면 컨테이너 전체를 raw로 보존한다"는 강등 규칙과 그 fixture를 명시하라.
- [medium] inline image·footnote·HTML에 fallback이 없어 일반 Markdown 문서에서 파싱이 실패하고, 오류 메시지가 낡았다 (packages/markdown/src/parser.ts:150-163, 0.85) — `parseInline`의 default 분기는 `image`, `imageReference`, `footnoteReference`, `linkReference` 등 remark-gfm가 정상 생성하는 인라인 노드를 모두 throw한다. 이미지(`![alt](url)`)는 흔한 기본 Markdown 문법이며 요구사항이 명시적으로 out-of-scope로 배제한 항목도 아니다(Out-of-Scope는 "이미지 업로드"와 "수식·Mermaid의 시각 편집"이다).

또한 parser.ts:160의 메시지 `"Raw inline HTML preservation is not available until TASK-02."`는 TASK-02가 완료된 현재 시점에 사실과 다르며, README의 "inline HTML은 raw 보존 대상이 아님" 계약과도 문구가 어긋난다. 권고: 최소한 오류 메시지를 현재 계약대로 수정하고("inline HTML은 raw 보존 범위 밖"), 지원하지 않는 인라인이 담긴 블록은 throw 대신 해당 블록 전체를 raw_markdown_block으로 fallback하는 방안을 검토하라. 이미지 지원 여부는 범위 판단이 필요하므로 별도 결정 항목으로 올리는 것을 권한다.

## Low

- [low] schema 허용 구조와 serializer 요구 구조가 불일치한다 (packages/markdown/src/schema.ts:15-19, 0.85) — `table_cell`은 content가 `block+`로 정의되어 여러 블록·비paragraph 블록을 허용하지만, serializer는 "정확히 1개의 paragraph"가 아니면 throw한다(serializer.ts:104-106). 스키마상 유효한 문서가 export 시점에 실패하는 계약 불일치이며, 편집 명령이 붙는 후속 REQ에서 런타임 오류로 드러날 수 있다. 권고: `table_cell` content를 `paragraph`로 좁히거나(권장, GFM 표는 블록을 담을 수 없음), serializer가 다중 블록을 허용 정규화(예: 블록을 인라인으로 평탄화)하도록 계약을 한쪽으로 통일하라.
- [low] 문서 끝 개행이 마지막 블록 종류에 따라 달라진다 (packages/markdown/src/serializer.ts:18-23, 0.9) — `serializeMarkdown`은 마지막 블록이 raw일 때만 trailing newline을 붙이지 않는다. README의 허용 차이 표에 기재되어 있어 의도된 계약이지만, export 산출물이 파일로 저장될 때 마지막 개행 유무가 입력 내용에 따라 달라져 소비자 측 diff·lint에 비결정적으로 보인다. raw fixture의 입력(`...\n`)과 expectedExport(개행 없음)가 다른 것도 같은 원인이다. 권고: 항상 단일 trailing newline으로 정규화하고(raw source 자체는 무변형 유지), fixture의 expectedExport를 그에 맞춰 조정하는 방안을 검토하라. 현행 유지 시에는 README에 "마지막 블록이 raw면 개행 없음" 규칙을 규칙 표에 한 줄로 못박는 것이 좋다.
- [low] 블록을 개별 stringify 후 join하여 블록 간 컨텍스트가 사라진다 (packages/markdown/src/serializer.ts:20-32, 0.6) — `serializeDocumentBlock`이 블록마다 독립적인 `root`를 만들어 stringify하고 `\n\n`으로 이어 붙인다. 현재 fixture는 통과하지만, 인접한 동일 종류 리스트가 두 노드로 존재하면 export 문자열에서 한 리스트로 합쳐져 재파싱 시 문서 구조가 달라진다(왕복 불안정). 현재는 parse가 그런 문서를 만들지 않아 드러나지 않지만, 편집 명령이 추가되는 후속 REQ에서 발생 가능하다. 권고: raw 블록만 placeholder로 분리하고 나머지는 하나의 mdast root로 한 번에 stringify한 뒤 placeholder를 원문으로 치환하는 방식으로 바꾸면 블록 간 컨텍스트와 무변형 보존을 동시에 만족할 수 있다.
- [low] 지원 블록 목록과 MarkdownNode 타입이 이중 관리된다 (packages/markdown/src/parser.ts:186-188, 0.9) — `isSupportedBlock`의 문자열 배열(parser.ts:187)과 `parseBlock` switch(parser.ts:99-116)가 같은 집합을 각각 관리하여 한쪽만 수정되면 조용히 raw fallback 되거나 throw로 갈린다. 또한 `MarkdownNode` 인터페이스가 parser.ts:8-21과 serializer.ts:6-9에 서로 다른 형태로 중복 정의되어 있어 mdast 계약이 한 곳에 모이지 않는다. 권고: 지원 블록 집합을 단일 상수(또는 switch의 exhaustive 처리)로 일원화하고, mdast 타입 정의는 `@types/mdast`(이미 전이 의존성으로 설치됨)를 직접 사용하거나 공용 모듈로 추출하라.

## 렌즈별 확인

GFM Markdown import/export와 raw 블록 원문 보존 구현(packages/markdown 신규 parser/serializer/schema, core code_block language 속성 추가, fixture·테스트·README)을 5개 렌즈로 검토했다.

(1) 로직결함 — raw 식별이 root 레벨 mdast 노드에만 적용되어, blockquote·list item 내부의 block HTML은 raw 보존되지 않고 `Unsupported Markdown block: html.`로 예외를 던진다(FR-03/README 계약과 불일치). 또한 explicit raw range가 노드 범위를 부분적으로만 겹칠 때 range 앞쪽 본문이 조용히 유실되는 경로가 있다.

(2) 경계 — fenced code 상태(`fencedCode`)가 컨테이너·문서 경계와 무관하게 전역 유지되어, blockquote 안의 미닫힌 fence 이후 문서 전체에서 raw 탐지가 비활성화된다. 닫는 줄 탐색(`findRawClosingLine`)이 빈 줄·다른 블록을 무시하고 문서 끝까지 스캔해 무관한 블록을 raw로 흡수하며, 닫히지 않은 opening이 많은 입력에서 O(n²) 스캔이 된다. inline image·footnote·HTML은 fallback 없이 throw한다.

(3) 보안 — 인증·권한·비밀정보 영역 없음. raw source는 문자열 속성으로만 보관되고 DOM/HTML로 렌더링하거나 실행하는 경로가 없음을 확인했다(serializer.ts:27은 문자열 그대로 출력). link href·code lang 미검증은 PLAN R-03에 따라 후속 어댑터로 이관된 설계 결정으로 확인했다. 입력검증 측면의 잔여 위험은 위 O(n²) 스캔뿐이다.

(4) 동시성 — parser/serializer 모두 동기 함수이며 모듈 수준 `unified()` 프로세서는 freeze 후 상태를 공유하지 않는다. 가변 전역 상태·순서 의존·비원자적 갱신 없음. 이 렌즈에서 발견 없음.

(5) 공통화/재사용 — `MarkdownNode` 타입이 parser/serializer에 각각 중복 정의되고, 지원 블록 목록이 `isSupportedBlock` 배열과 `parseBlock` switch에 이중 관리되어 드리프트 위험이 있다. schema가 허용하는 구조(table_cell `block+`)와 serializer 요구(단일 paragraph)가 어긋난다.

- packages/markdown/src/parser.ts의 컨테이너 내부 block HTML 경로를 raw fallback으로 통일하고 blockquote/list item HTML fixture를 추가한다(FR-03 계약 복구).
- explicit raw range 부분 겹침 시 앞쪽 원문 유실 여부를 실제 실행으로 재현 확인하고(입력: `text\n:::note\n\n:::\n`), "입력 offset 전량이 출력 블록에 매핑된다" 불변식 테스트를 추가한다.
- findExplicitRawRanges의 fence 상태를 컨테이너별로 분리하고, 닫는 줄 탐색에 컨테이너·fence·블록 경계 제한을 두어 과대 흡수와 O(n^2) 스캔을 함께 해소한다.
- inline 미지원 노드(이미지·footnote·inline HTML)의 처리 방침을 결정한다: 오류 유지 시 메시지에서 'until TASK-02' 문구를 제거하고, 블록 단위 raw fallback으로 바꿀지 결정 항목으로 올린다.
- table_cell의 schema content(`block+`)와 serializer 요구(단일 paragraph) 중 한쪽으로 계약을 통일한다.

## 격리 검증

- mcp_servers: []
- tools: ["Glob","Grep","Read","StructuredOutput"]
- envSanitized: true
- argv(발췌): -p ... --strict-mcp-config --mcp-config ... --tools Read,Glob,Grep --permission-prompts none --no-session-persistence
- S1/S2: 5항목 동일

## 반영

후속 TASK 실수정 예정.

