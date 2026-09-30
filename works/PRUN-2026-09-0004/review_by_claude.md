# Claude 교차검증 — PRUN-2026-09-0004 (REQ-2026-09-0004)

> Status: PERFORMED
> Mode: auto · interactive
> Executor: Codex orchestrator · Claude CLI headless · claude 2.1.266
> Base: 8b2054cd0a3d857e7ffbd289f6e4a3e5ad2d0677
> Head: 4aac1c252c8b16d98271d5cff5d7e5263d5fc94f
> Range: 8b2054cd0a3d857e7ffbd289f6e4a3e5ad2d0677..4aac1c252c8b16d98271d5cff5d7e5263d5fc94f
> Verdict: needs-attention
> Findings: Critical 0 / High 3 / Medium 6 / Low 7
> Executed: 2026-09-30T08:20:17Z
> 렌즈 5종: 로직결함·경계·보안·동시성·공통화/재사용

## Critical

없음

## High

- [high] blockquote input rule이 삭제 전 NodeRange 위치로 wrap → 위치 범위 초과 예외 또는 오범위 래핑 (packages/extensions/src/input-rules.ts:9-13, 0.78) — `input-rules.ts:11`에서 `range`를 `state.tr.doc`(=`state.doc`, 삭제 전) 기준으로 계산한 뒤, `state.tr.delete(start, end).wrap(range, ...)`로 **삭제 후 문서**에 stale 좌표를 적용한다. `Transform.wrap`은 `range.start`/`range.end`를 숫자로 그대로 사용하므로 삭제로 2만큼 줄어든 문서에 이전 좌표가 들어간다.

예: `doc(paragraph("> "))` 에서 rule 발동 시 start=1, end=3, `blockRange()`는 start=0/end=4. `delete(1,3)` 후 문서 content.size는 2인데 `wrap`은 `ReplaceAroundStep(0,4,...)`을 만들고 `doc.slice(0,4)`에서 `RangeError: Position 4 out of range`가 발생한다(확인: prosemirror-transform의 `wrap`/`ReplaceAroundStep.apply` 구현 기준 추론 — 실제 실행으로는 확인 안 함). 뒤에 다른 블록이 있으면 예외 없이 **2만큼 밀린 잘못된 범위**를 감싸 문서가 손상된다.

`interaction.test.ts`는 `# `·`- `·"``` "만 입력하고 `> ` 규칙을 전혀 실행하지 않아 이 경로가 회귀 테스트에서 비어 있다(FR-01 인수기준 "지원 문법을 편집 구조로 전환" 미검증). 권고: 삭제 트랜잭션을 먼저 만들고 그 문서에서 범위를 재계산한다. 예: `const tr = state.tr.delete(start, end); const range = tr.doc.resolve(tr.mapping.map(start)).blockRange(); return range === null ? null : tr.wrap(range, [{ type: quote }]);` 그리고 `> ` 입력 규칙에 대한 interaction 테스트(구조 + textContent)를 추가한다.
- [high] 목록 input rule이 wrapInList 이후 매핑하지 않은 좌표로 delete → 목록 마커 텍스트가 남을 수 있음 (packages/extensions/src/input-rules.ts:20-24, 0.62) — `listRule`은 `wrapInList(type)(state, (transaction) => { result = transaction.delete(start, end); })`로 **래핑이 적용된 트랜잭션**에 원본 문서 좌표 `start`/`end`를 그대로 넣는다. 래핑으로 `bullet_list`/`list_item` 열림 토큰 2개가 앞에 삽입되므로 텍스트 `- `는 3..5로 이동한다. 따라서 `delete(1,3)`은 노드 경계를 가로지르는 범위가 되고, `Transform.replace`는 `replaceStep`이 `null`을 반환하면 아무 step도 추가하지 않고 조용히 통과한다(구현 기준 추론 — 실행으로 확인 안 함). 이 경우 결과 문서는 `bullet_list(list_item(paragraph("- ")))`가 되어 마커 텍스트가 그대로 남는다.

`interaction.test.ts:19-21`은 `firstChild.type.name === "bullet_list"`만 단언하고 `textContent`를 확인하지 않아, 마커 잔존 여부가 테스트로 걸러지지 않는다. `paste.test.ts`/`index.test.ts`에도 동일 단언이 없다. 권고: `wrapInList` 콜백에서 받은 트랜잭션의 매핑을 사용해 삭제한다. 예: `result = transaction.delete(transaction.mapping.map(start), transaction.mapping.map(end));` 또는 먼저 `tr.delete` 후 `wrapInList`를 적용한다. 함께 `expect(doc.textContent).toBe("")` 형태의 단언을 `- `·`1. ` 두 규칙 모두에 추가한다.
- [high] 스키마에 toDOM이 전혀 없어 view가 nodeViews 전량 커버에 의존 — 복사/잘라내기(clipboardSerializer) 경로가 실패 (packages/extensions/src/safe-view.ts:17-45, 0.6) — `packages/core/src/schema.ts`·`packages/markdown/src/schema.ts`의 어떤 NodeSpec/MarkSpec에도 `toDOM`이 없다(`Grep toDOM|parseDOM` 결과 0건). 이번 변경으로 실제 `EditorView`가 생겨 DOM 상호작용이 시작되었는데, 렌더링은 `safeNodeViews`/`safeMarkViews`가 모든 타입을 덮어 동작한다. 반면 prosemirror-view의 클립보드 직렬화는 `view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(schema)`를 쓰고, `createSafeEditorView`는 `clipboardSerializer`를 지정하지 않는다. `DOMSerializer.fromSchema`는 `toDOM`이 없는 타입을 아예 등록하지 않으므로 복사·잘라내기·드래그 시 직렬화 단계에서 예외가 발생한다(프레임워크 구현 기준 추론 — 테스트가 없어 실행 확인 안 함).

또한 `safeNodeViews`에 없는 노드가 스키마에 추가되면(향후 확장) 렌더링 자체가 즉시 실패한다 — 안전 view 정책이 allowlist의 누락에 취약한 구조다. 권고: `EditorView` 옵션에 안전한 `clipboardSerializer`(nodeView와 동일한 allowlist 기반 `DOMSerializer`)를 명시하고, `safeNodeViews`가 `schema.nodes`를 전부 덮는지 런타임/테스트에서 단언한다(예: `Object.keys(schema.nodes)` 차집합 검사). 복사(copy) 이벤트 회귀 테스트를 추가한다.

## Medium

- [medium] 붙여넣기 슬라이스가 항상 openStart/openEnd=0 — 인라인 붙여넣기가 블록을 쪼개고, 표 셀·코드 블록 안에서 구조가 깨질 수 있음 (packages/extensions/src/paste.ts:10-31, 0.6) — `parsePastedHtml`은 항상 `new Slice(fragment, 0, 0)`(완전 닫힌 슬라이스)를 만들고 `handlePaste`가 선택 컨텍스트를 보지 않고 `tr.replaceSelection(...)`을 호출한다.

1. 인라인 HTML(`<span>hi</span>`)도 `paragraph`로 감싸 닫힌 블록이 되므로, 문단 중간 붙여넣기가 인라인 삽입이 아니라 문단 분할로 처리될 가능성이 크다(ProseMirror 기본 paste는 `parseSlice`로 open depth를 계산한다).
2. `table_cell`의 content는 `"paragraph"`(정확히 1개)이고 `code_block`은 `"text*"`이므로, 셀/코드 블록 안에서 `heading`·`table`·다중 블록 슬라이스는 셀 내부에 들어갈 수 없다. `replaceRange`는 유효한 위치를 찾아 범위를 바깥으로 확장하므로 표가 분할·치환되어 사용자 데이터가 손상될 수 있다. NFR-02(단일 paragraph 계약)를 붙여넣기 경로에서 검증하는 테스트가 없다 — `interaction.test.ts`의 paste 테스트는 모두 빈 문서에서만 실행된다. 권고: (a) 정규화 결과가 단일 textblock이면 인라인 슬라이스(openStart/openEnd=1)로 만들거나 `Slice` open depth를 계산한다. (b) `handlePaste`에서 선택 위치가 `code_block`·`raw_markdown_block`이면 `text/plain`으로 폴백하고, `table_cell` 안이면 인라인만 삽입한다. (c) 표 셀·코드 블록 안 붙여넣기 후 `table_cell.childCount === 1` 회귀 테스트를 추가한다.
- [medium] 허용 요소가 하나도 없으면 빈 슬라이스를 dispatch하고 true를 반환해 text/plain 대체 내용까지 삭제 (packages/extensions/src/paste.ts:12-21, 0.7) — `handlePaste`는 `text/html`이 존재하면 무조건 처리하고 `true`를 반환한다. 정규화 결과가 비는 경우(예: 클립보드 HTML이 `<iframe>`/`<script>`만 포함하거나 지원 요소가 전혀 없는 경우) 빈 `Slice`로 선택 영역을 대체하므로, 같은 클립보드의 `text/plain` 텍스트도 붙지 않고 **선택 영역이 삭제**된다. 악성 입력 차단은 의도대로지만, 정상 앱에서 온 비표준 HTML+평문 조합에서는 사용자 내용 손실이 된다.

또한 shift+paste(평문 붙여넣기) 구분이 없어 사용자가 평문 경로를 선택할 수 없다. 권고: 정규화 결과 `blocks.length === 0`이면 `false`를 반환해 ProseMirror 기본 `text/plain` 처리에 넘기고(또는 `text/plain`을 직접 삽입), `event.shiftKey`/`view.shiftKey` 상황에서는 평문 경로를 사용한다.
- [medium] raw_markdown_block nodeView가 편집 가능한 DOM — 입력 시 모델과 DOM이 어긋난다 (packages/extensions/src/safe-view.ts:112-117, 0.65) — `rawTextNode`는 `contentDOM` 없는 atom nodeView를 만들지만 `contentEditable="false"`를 설정하지 않고 `stopEvent`/`ignoreMutation`도 제공하지 않는다. `view.dom`이 contenteditable이므로 이 `<pre>` 안에도 캐럿이 들어가 타이핑·삭제가 가능하고, contentDOM이 없어 변경은 모델에 반영되지 않는다. 결과적으로 화면에는 사용자가 넣은 텍스트가 보이지만 문서 모델·Markdown 직렬화에는 없는 상태(DOM/모델 desync)가 되며, 이후 `updateState`로 임의 시점에 되돌려진다. CON-03의 "텍스트 표현만 허용" 의도는 지키지만 편집 경계가 정의되지 않았다. 권고: `dom.contentEditable = "false"`를 설정하고 필요 시 `stopEvent: () => true`, `ignoreMutation: () => true`를 nodeView 스펙에 추가한다. raw 블록 내부 타이핑이 모델을 바꾸지 않음을 단언하는 테스트를 추가한다.
- [medium] view.updateState 중 재진입 dispatch가 core의 notifying 가드와 충돌해 예외를 던질 수 있음 (packages/extensions/src/safe-view.ts:24-32, 0.5) — `dispatchTransaction`은 `editor.dispatch`로 위임하고, `editor.dispatch`는 리스너 통지 중(`notifying === true`) 재진입 dispatch를 `throw new Error("Cannot dispatch while notifying subscribers.")`로 막는다(`packages/core/src/editor.ts:77-79`). 그런데 리스너가 하는 일이 `view.updateState(state)`이고, prosemirror-view의 `updateStateInner`는 내부적으로 `domObserver.flush()`를 거치며 DOM 변경이 남아 있으면 `readDOMChange → view.dispatch`로 새 트랜잭션을 발생시킬 수 있다. 이 경로가 열리면 통지 도중 `editor.dispatch`가 호출되어 예외가 전파되고 편집이 중단된다.

jsdom 테스트는 `handleTextInput`을 직접 호출하고 실제 DOM 변경/MutationObserver 플러시를 거치지 않으므로(PLAN R-04) 이 경로가 검증되지 않았다. 다중 view를 한 editor에 붙이는 REQ-0005 adapter 시나리오에서도 같은 위험이 있다. 권고: `dispatchTransaction`에서 `editor.dispatch` 호출을 재진입 안전하게 만든다(큐에 쌓아 순차 적용하거나, core가 통지 중 dispatch를 큐잉하도록 계약을 바꾼다). 최소한 실제 브라우저 매트릭스(REQ-0006) 전에 이 제약을 DECISIONS/문서에 명시하고, 재진입 시 예외로 편집이 죽지 않도록 방어한다.
- [medium] 목록 편집 키맵 누락 — 목록 안 Enter가 새 항목이 아니라 같은 항목의 두 번째 문단을 만든다 (packages/extensions/src/keymap.ts:1-3, 0.75) — `editingKeymap`은 undo/redo 3개만 바인딩한다. core는 `baseKeymap`(prosemirror-commands)만 등록하므로 Enter는 `splitBlock`으로 처리되고, `list_item` content가 `"paragraph block*"`이므로 목록 항목 안에서 Enter는 **같은 list_item 안에 두 번째 paragraph**를 만든다. Tab/Shift-Tab 중첩, 빈 항목에서 Backspace로 lift도 없다. 패키지는 이미 `prosemirror-schema-list`에 의존하면서 `wrapInList`만 쓰고 `splitListItem`/`liftListItem`/`sinkListItem`을 재사용하지 않는다(공통화 렌즈). FR-01의 "키보드 단축키", FR-02의 목록 편집 경험 인수기준이 실질적으로 undo/redo만으로 충족된 상태다.

덧붙여 core는 `keymap(baseKeymap)`을 확장 키맵보다 **앞에** 넣으므로(`packages/core/src/editor.ts:205`) 확장이 Enter/Backspace를 덮어쓰지 못한다 — 목록 키맵을 추가하려면 이 우선순위 계약도 함께 봐야 한다. 권고: `prosemirror-schema-list`의 `splitListItem(list_item)`·`liftListItem`·`sinkListItem`을 Enter/Shift-Tab/Tab에 바인딩하고, 확장 키맵이 baseKeymap보다 우선하도록 core의 플러그인 순서를 조정(또는 확장 키맵 우선 슬롯 제공)한다. 목록 안 Enter/Tab interaction 테스트를 추가한다.
- [medium] destroy 순서에 따라 view 입력이 "Editor has been destroyed" 예외로 이어진다 (packages/extensions/src/safe-view.ts:20-44, 0.6) — `createSafeEditorView`의 `dispatchTransaction`은 `editor.dispatch`를 무조건 호출한다. `editor.destroy()`가 `safeView.destroy()`보다 먼저 호출되면(소비자 측 순서 실수, 또는 `editor.destroy()`가 리스너를 clear해 unsubscribe만으로는 view가 정리되지 않는 경우) 살아 있는 view의 키 입력마다 `assertActive`가 던지는 예외가 DOM 이벤트 핸들러로 전파된다. 또 `editor.destroy()`는 `listeners.clear()`만 하므로 view가 자동으로 무력화되지 않는다 — 생명주기 계약이 한 방향으로만 정의되어 있다.

`interaction.test.ts:146-149`는 항상 `safeView.destroy()`를 먼저 호출해 이 순서 위반 경로를 검증하지 않는다. 권고: `dispatchTransaction`에서 `destroyed` 플래그를 확인하고, editor가 파괴된 경우 no-op 처리(또는 view를 자동 destroy)한다. editor 파괴 → view 비활성화 경로의 테스트를 추가하고 생명주기 계약을 문서화한다.

## Low

- [low] parseTable이 querySelectorAll("tr")로 중첩 표의 행까지 외부 표에 끌어올린다 (packages/extensions/src/paste.ts:123-146, 0.7) — `parseTable`은 `element.querySelectorAll("tr")`로 후손 전체의 `tr`을 수집하므로, `<td>` 안에 중첩된 `<table>`의 행들이 외부 표의 행으로 편입된다. 또 셀 파싱은 `inlineChildren(cell, ...)`이므로 중첩 표의 텍스트가 셀 텍스트로 한 번 더 중복 등장할 수 있다. 결과 문서는 스키마상 유효하지만 원본과 구조가 달라지고 행 폭 패딩(`width`)도 중첩 표 기준으로 부풀 수 있다. 권고: 직계 `thead`/`tbody`/`tfoot`/`tr`만 순회하도록 바꾸고(예: `:scope > tr, :scope > thead > tr, ...`), 중첩 표는 텍스트로 평탄화하거나 무시하는 규칙을 fixture에 기록한다.
- [low] prosemirror-tables를 의존성으로 추가했지만 어디서도 사용하지 않고 표 명령을 직접 구현 (packages/extensions/package.json:25-26, 0.85) — `packages/extensions/package.json:28`과 `vite.config.ts:20`에 `prosemirror-tables`가 추가됐으나 소스 어디에서도 import하지 않는다(`Grep prosemirror-tables` 결과: 설정 파일 2건뿐). 동시에 `addTableRow`/`addTableCell`/`rectangularTableWidth`는 표 구조 연산을 자체 구현하고, `rectangularTableWidth`는 duck-typed 구조 인터페이스를 따로 선언해 `ProseMirrorNode` 계약과 이중화된다. 미사용 런타임 의존성은 소비자 번들·설치 비용과 라이선스 표면만 늘린다(공통화/재사용 렌즈). 권고: `prosemirror-tables`를 실제로 사용해 표 명령을 대체하거나, 사용하지 않는다면 dependencies와 vite external 목록에서 제거한다. `rectangularTableWidth`의 파라미터 타입은 `ProseMirrorNode`로 통일한다.
- [low] extensionCommands가 인자 고정 바인딩으로 등록되어 setCursor/setSelection/insertTable이 사실상 상수 동작 (packages/extensions/src/index.ts:12-15, 0.75) — `index.ts:13-14`는 `setCursor(1)`, `setSelection(1, 1)`, `insertTable()`처럼 인자를 고정해 등록한다. core의 `extensionCommands` 계약이 `() => boolean`이므로 소비자는 커서 위치·표 크기를 지정할 수 없고, 공개 API로는 항상 위치 1, 2x2 표만 만들 수 있다. 관련해 `index.test.ts:39-44`의 "rejects invalid cursor positions" 테스트는 `setCursor()`가 `true`가 되는 것만 단언해 거부 경로를 전혀 검증하지 않는다(테스트 제목과 내용 불일치). 권고: 인자를 받는 커맨드는 `commands` 레지스트리 대신 명명 export(이미 존재)로만 노출하거나, core의 커맨드 계약을 인자 전달 가능한 형태로 확장한다. 거부 경로 테스트는 `setCursor(-1)`·`setCursor(doc.content.size + 1)`을 직접 호출해 `false`를 단언하도록 수정한다.
- [low] ordered_list input rule이 입력된 시작 번호를 order 속성에 반영하지 않음 (packages/extensions/src/input-rules.ts:20-24, 0.8) — `listRule(/^\d+[.)] $/, "ordered_list")`는 매치된 숫자를 버리고 `wrapInList(type)`을 기본 attrs로 호출하므로, `3. `을 입력해도 `order`는 기본값 1이 된다. 반면 붙여넣기 경로(`paste.ts:97` `parseOrder`)는 `start` 속성을 보존한다 — 두 입력 경로의 계약이 어긋난다. 권고: `listRule`이 match를 받아 `ordered_list`에 `{ order }`를 전달하도록 하고(또는 order 미지원을 명시적 결정으로 기록), 붙여넣기와 동일한 규칙임을 테스트로 고정한다.
- [low] 표 명령의 header 속성 결정이 기존 행의 실제 header 값과 무관 (packages/extensions/src/commands.ts:45-69, 0.7) — `addTableCell`은 새 셀의 `header`를 행 인덱스(`index === 0`)로만 정하고, `addTableRow`는 `cell.create(null, ...)`로 항상 기본값 `false`를 쓴다. 기존 표의 첫 행이 header가 아닌 경우(붙여넣기로 만든 표는 `thead`/`th` 여부에 따라 달라짐) 같은 행 안에서 `th`/`td`가 섞여 렌더링된다. Markdown serializer는 `header`를 무시하므로(`serializer.ts:82-113`) 왕복 테스트로는 드러나지 않고 view 표시에서만 어긋난다. 권고: 새 셀의 `header`/`align`은 같은 행의 기존 셀 속성에서 상속하도록 바꾸고, 혼합 header 행이 생기지 않음을 단언하는 테스트를 추가한다.
- [low] 드롭(drop) 경로는 붙여넣기 allowlist 정규화를 거치지 않는다 (packages/extensions/src/paste.ts:10-24, 0.55) — `createSafePastePlugin`은 `handlePaste`만 제공하고 `handleDrop`/`transformPasted`를 제공하지 않는다. 드롭된 HTML은 ProseMirror 기본 `DOMParser.fromSchema` 경로로 처리되는데, 스키마에 `parseDOM` 규칙이 전혀 없어 실질적으로 텍스트만 남을 것으로 보인다(즉 즉시 보안 문제로는 보이지 않음 — 실행 확인 안 함). 그러나 FR-03/FR-04의 정규화 계약이 paste에만 걸려 있어, 향후 `parseDOM`이 추가되면 드롭이 allowlist를 우회하는 구멍이 된다. 권고: 정규화를 `transformPasted`(또는 `handleDrop` 포함)로 옮겨 paste·drop이 동일 경로를 쓰게 하고, 드롭 시나리오 회귀 테스트를 추가한다.
- [low] URL 안전성 검사가 zero-width/soft-hyphen 문자를 걸러내지 않음 (packages/extensions/src/safe-url.ts:1-53, 0.5) — `CONTROL_OR_WHITESPACE`는 ` - `, `-`, `\s`를 막지만 U+200B~U+200D, U+2060, U+00AD는 포함하지 않는다. 이 문자들이 섞인 `java​script:`는 scheme 정규식(`^([a-z][a-z0-9+.-]*):`)에 걸리지 않아 "scheme 없음 → 상대경로"로 판정되어 `isSafeUrl`이 true를 반환한다. URL 표준은 이 문자들을 제거하지 않으므로 브라우저도 scheme으로 인식하지 않아 현재로서는 탐색이 일어나지 않을 것으로 보이며(브라우저 실행 확인 안 함), 실질 위험은 낮다. 다만 방어 심층성 관점에서 obfuscation fixture(R-02) 범위에서 빠져 있다. 권고: `CONTROL_OR_WHITESPACE`에 `­​-‍⁠﻿`를 추가하고 해당 fixture를 `unsafeHrefs`에 넣는다.

## 렌즈별 확인

렌즈별 확인 요약 — (1) 로직결함: Markdown input rules 2건에서 트랜잭션 좌표 매핑 누락을 확인했다. blockquote 규칙은 삭제 후 문서에 삭제 전 `blockRange()` 좌표로 `wrap`을 적용해 위치 범위 초과 예외 또는 잘못된 범위 래핑이 발생할 구조이고(`input-rules.ts:9-13`), 목록 규칙은 `wrapInList` 이후 매핑하지 않은 좌표로 `delete`해 마커 텍스트 `- `가 남을 수 있다(`input-rules.ts:20-24`). heading·fenced code 규칙과 `commands.ts`의 표/코드/목록 명령(가드·직사각형 검증·단일 paragraph 생성)은 계약상 문제를 찾지 못했다. (2) 경계: `> ` 입력 규칙, 복사/잘라내기, 표 셀·코드 블록 안 붙여넣기, editor 먼저 destroy, 빈 정규화 결과(text/plain 폴백 없음), 중첩 표 붙여넣기가 모두 테스트되지 않은 실패 경로다. 스키마에 `toDOM`이 전혀 없어 클립보드 직렬화 경로가 깨지는 점이 가장 영향이 크다. (3) 보안: `isSafeUrl`의 엔티티 다중 디코딩 후 scheme/공백·제어문자/protocol-relative 차단은 보수적으로 동작하고, href는 `setAttribute`로만 기록되므로 재해석 우회는 발견하지 못했다. allowlist 파싱이 DOM 속성을 전혀 복사하지 않아 `onclick`/`style`/`script`/`iframe`이 모델에 도달하지 않고, raw 블록은 `textContent`만 쓴다. zero-width 문자 누락(low)과 drop 경로가 정규화를 거치지 않는 점(low)만 남는다. (4) 동시성: 단일 스레드지만 재진입 위험을 확인했다 — core가 리스너 통지 중 dispatch를 예외로 막는데(`editor.ts:77-79`) 리스너가 `view.updateState`를 호출하고 그 내부 domObserver 플러시가 다시 dispatch할 수 있어, 실제 브라우저에서 편집이 예외로 중단될 경로가 열려 있다(jsdom 테스트는 `handleTextInput` 직접 호출이라 미검증). destroy 순서 의존성도 보호되지 않는다. (5) 공통화/재사용: `prosemirror-tables`를 의존성에 추가했으나 전혀 사용하지 않고 표 연산을 자체 구현했으며, `prosemirror-schema-list`도 `wrapInList`만 쓰고 목록 키맵 명령을 재사용하지 않았다. 붙여넣기의 허용 요소 목록이 `parseBlock`/`isInlineElement`/`isBlockElement` 3곳에 분산되어 드리프트 위험이 있고, input rule과 붙여넣기의 `order` 처리 계약이 불일치한다. 판정: high 3건(입력 규칙 2건, 클립보드/toDOM 1건)이 FR-01·FR-05 인수기준의 실제 충족을 위협하므로 수정 후 재검토가 필요하다.

- input-rules.ts의 blockquote·목록 규칙을 트랜잭션 매핑 기반으로 수정하고, `> `·`- `·`1. ` 입력 후 구조와 textContent를 모두 단언하는 회귀 테스트를 추가한다.
- 안전한 clipboardSerializer를 EditorView에 지정하거나 스키마에 allowlist toDOM을 정의하고, copy/cut 이벤트 회귀 테스트를 추가한다.
- handlePaste에 선택 컨텍스트(code_block·raw_markdown_block·table_cell) 분기와 빈 결과 시 text/plain 폴백을 추가하고, 표 셀 안 붙여넣기의 단일 paragraph(NFR-02) 테스트를 보강한다.
- raw_markdown_block nodeView에 contentEditable=false/stopEvent를 적용하고 DOM 입력이 모델을 바꾸지 않음을 검증한다.
- 목록 키맵(splitListItem/liftListItem/sinkListItem)을 추가하면서 core의 baseKeymap 우선순위 계약을 함께 결정한다.
- 미사용 prosemirror-tables 의존성을 제거하거나 실제 표 명령 구현에 사용한다.

## 격리 검증

- mcp_servers: []
- tools: ["Glob","Grep","Read","StructuredOutput"]
- envSanitized: true
- argv(발췌): -p ... --strict-mcp-config --mcp-config ... --tools Read,Glob,Grep --permission-prompts none --no-session-persistence
- S1/S2: 5항목 동일

## 반영

후속 TASK 실수정 예정.

