# 요구사항 명세서 — 기본 편집 경험과 안전한 HTML 붙여넣기 구현

> WORK: PRUN-2026-09-0004
> REQ: REQ-2026-09-0004 (ID: 8146)
> 복잡도: Large
> 예상 영향 범위: `packages/core`, `packages/extensions`, `packages/markdown`, 편집 상호작용 테스트

## 1. 원본 요청

> TODO REQ 번호 순서로 순차적으로 자동 실행

## 2. 배경 및 목적

- 해결하려는 문제: WYSIWYG Markdown 편집에 필요한 입력·선택·명령·되돌리기와 안전한 HTML 붙여넣기 규칙을 제공한다.
- 이해관계자: WYSIWYG 편집기 사용자, 라이브러리 소비자, 후속 Vanilla 어댑터 REQ 개발자.
- 기존 시스템/프로세스 관계: `REQ-2026-09-0003`의 GFM 변환과 raw 보존 계약을 사용하며, MVP 로드맵의 단계 3을 수행한다.

## 3. 범위

### In-Scope

- Markdown input rules, 선택 영역·cursor 처리, undo/redo, 키보드 단축키를 제공한다.
- 목록, 표, 코드 블록 명령을 제공한다.
- 허용 HTML을 안전한 편집 문서와 Markdown 구조로 정규화한다.
- script, event handler, 허용 외 속성을 문서 모델에 반영하지 않는다.
- raw HTML을 텍스트로 표현하고 실행하지 않는다.
- 목록, 표, 코드 블록, undo/redo, 붙여넣기 상호작용 테스트를 제공한다.

### Out-of-Scope

- Vanilla 공개 mount API와 playground.
- React·Vue 어댑터, UI 패키지, 협업 기능.
- raw Markdown 전환·분할 화면.
- 실제 npm publish와 main 릴리스.

## 4. 기능 요구사항

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|----------|----------|
| FR-01 | 시스템은 Markdown input rules, 선택 영역·cursor 처리, undo/redo, 키보드 단축키를 제공해야 한다. | M | - [ ] Markdown 입력 규칙으로 지원 문법을 편집 구조로 전환할 수 있다.<br>- [ ] 선택 영역과 cursor 상태를 변경할 수 있다.<br>- [ ] undo/redo와 키보드 단축키 상호작용을 검증할 수 있다. |
| FR-02 | 시스템은 목록, 표, 코드 블록의 편집 명령을 제공해야 한다. | M | - [ ] 목록 명령을 실행할 수 있다.<br>- [ ] 표 명령을 실행할 수 있다.<br>- [ ] 코드 블록 명령을 실행할 수 있다.<br>- [ ] 표 명령은 `table_cell`의 단일 paragraph 계약을 유지한다. |
| FR-03 | 시스템은 허용 HTML 요소를 안전한 편집 문서와 Markdown 구조로 변환해야 한다. | M | - [ ] 제목, 문단, 목록, 링크, 표, 코드의 허용 HTML 입력을 구조화된 편집 문서로 변환할 수 있다.<br>- [ ] 변환 결과를 Markdown 구조로 export할 수 있다. |
| FR-04 | 시스템은 HTML 붙여넣기에서 script, event handler, 허용 외 속성을 문서 모델에 반영하지 않아야 한다. | M | - [ ] script와 event handler가 포함된 HTML 붙여넣기 결과에 해당 요소·속성이 없다.<br>- [ ] raw HTML은 텍스트로 표현되며 실행되지 않는다.<br>- [ ] 안전하지 않은 URL은 클릭 가능한 탐색 동작을 제공하지 않는다. |
| FR-05 | 시스템은 목록, 표, 코드 블록, undo/redo, 붙여넣기 상호작용 테스트를 제공해야 한다. | M | - [ ] 목록·표·코드 블록 상호작용 테스트를 실행할 수 있다.<br>- [ ] undo/redo 상호작용 테스트를 실행할 수 있다.<br>- [ ] 허용·비허용 HTML 붙여넣기 테스트를 실행할 수 있다. |

## 5. 비기능 요구사항

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 보안 | HTML 붙여넣기와 링크 입력은 스크립트 실행, 이벤트 실행, 안전하지 않은 URL 탐색을 유발하지 않아야 한다. | - [ ] script와 event handler를 포함한 붙여넣기 테스트에서 실행 가능한 코드가 문서 모델에 없다.<br>- [ ] 안전하지 않은 URL 테스트에서 탐색 동작이 발생하지 않는다. |
| NFR-02 | 구조 일관성 | 표 편집 명령은 `table_cell`의 단일 paragraph 구조를 유지해야 한다. | - [ ] 표 편집 상호작용 테스트가 단일 paragraph 구조를 검증한다. |

## 6. 제약조건

- CON-01: core는 프레임워크 비의존성을 유지한다.
- CON-02: view 책임의 위치는 planner가 설계 단계에서 정한다.
- CON-03: raw HTML은 텍스트 표현만 허용하고 실행하지 않는다.
- CON-04: 위험 URL의 원문은 Markdown에 남을 수 있으나 클릭 가능한 탐색 동작은 허용하지 않는다.
- CON-05: `table_cell`은 단일 paragraph 계약을 유지한다.
- CON-06: `REQ-2026-09-0005`의 Vanilla 공개 mount API와 playground 기능을 포함하지 않는다.

## 7. 가정사항

- ASM-01: `REQ-2026-09-0003`의 GFM parser·raw 보존·core API가 완료되어 있다. [합의 완료]
- ASM-02: 허용 HTML 요소는 제목, 문단, 목록, 링크, 표, 코드로 한정한다. [합의 완료]
- ASM-03: 위험 URL은 href 없는 비탐색 span으로 표시한다. [자동 결정: DECISIONS.md D-01]

## 8. 용어 정의

| 용어 | 정의 |
|------|------|
| input rule | 특정 입력 패턴을 감지해 문서 구조로 전환하는 규칙 |
| HTML 정규화 | 허용 요소만 편집 문서 구조로 변환하고 나머지를 제거 또는 텍스트화하는 처리 |
| event handler | `onclick`처럼 HTML 요소에서 이벤트 실행을 지정하는 속성 |
| 안전하지 않은 URL | 스크립트 실행이나 신뢰되지 않은 탐색을 유발할 수 있는 URL |
| table_cell 단일 paragraph 계약 | 표 셀의 직접 자식이 하나의 paragraph 구조여야 하는 규칙 |

## 9. 추적성 매트릭스

| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 |
|--------------|------------|----------|
| REQ-2026-09-0004: 입력·선택·undo/redo·keymap | FR-01 | AC-FR-01 |
| REQ-2026-09-0004: 목록·표·코드 블록 명령 | FR-02, NFR-02 | AC-FR-02, AC-NFR-02 |
| REQ-2026-09-0004: 안전한 HTML 붙여넣기 | FR-03, FR-04, NFR-01 | AC-FR-03, AC-FR-04, AC-NFR-01 |
| REQ-2026-09-0004: 상호작용 테스트 | FR-05 | AC-FR-05 |

## 10. 질의응답 기록

| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| Q1 | raw HTML과 안전하지 않은 URL을 실행하는가? | raw HTML은 텍스트로 표현하고, 안전하지 않은 URL은 클릭 가능한 탐색 동작을 제공하지 않는다. | 2026-09-30 |

## 자체 검증 체크리스트

- [x] 입력·명령·상호작용·HTML 정규화 범위를 요구사항으로 분리했다.
- [x] script, event handler, 위험 URL의 보안 조건을 인수 기준에 포함했다.
- [x] `table_cell` 단일 paragraph 계약을 반영했다.
- [x] Vanilla mount API와 playground를 다음 REQ 범위로 제외했다.
- [x] 모든 FR/NFR에 검증 가능한 인수 기준이 있다.
