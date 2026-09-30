# PRUN-2026-09-0004: 기본 편집 경험과 안전한 HTML 붙여넣기 구현

> Created: 2026-09-30
> Requirement: REQ-2026-09-0004
> Project: UCMARKDOWNWEB
> Tech Stack: TypeScript, ProseMirror, Vitest, jsdom
> Language: ko
> Status: PLANNED

## 목표

목록·표·코드 블록·선택·undo/redo·Markdown 입력 규칙을 편집 동작으로 제공한다. HTML 붙여넣기를 허용 구조로 정규화하고 위험 링크와 raw HTML의 실행 경로를 차단한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 `core`의 headless 상태 API 유지, `extensions`에 편집 plugin·명령·내부 view 연결 구현.
- **구조**: `core`는 DOM 비의존. `extensions`가 ProseMirror input rules·keymap·안전한 view schema·paste 처리기를 제공. REQ-0005의 `adapter-vanilla`가 이를 공개 mount API로 연결.
- **데이터 흐름**: 키 입력/선택/붙여넣기 → 내부 `EditorView` plugin·정규화 → core transaction → ProseMirror 문서 → Markdown serializer.
- **view 경계**: `extensions`의 내부 interaction view를 테스트와 후속 adapter에서 사용. 공개 Vanilla mount·lifecycle·playground는 REQ-0005에서 구현.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 필요 시 `markdown` schema에 안전 DOM spec·paste 변환용 속성 추가 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | `table_cell` 직접 자식 `paragraph` 1개 유지. raw Markdown source는 불투명 텍스트로 표시 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| 편집 확장 | ProseMirror plugin/command | Markdown input rules, keymap, selection/transaction 명령 | FR-01 |
| 구조 명령 | TypeScript API | 목록 생성·전환, 표 삽입·행/셀 편집, 코드 블록 전환 | FR-02 |
| 안전 HTML 변환 | TypeScript API | `parsePastedHtml(html, schema)` → ProseMirror Slice/Node | FR-03, FR-04 |
| 안전 view schema | ProseMirror DOM spec | raw는 텍스트, 링크는 안전 URL만 `<a href>` | FR-04 |
| 상호작용 fixture | Vitest/jsdom | 실제 EditorView 입력·선택·undo·paste 결과 | FR-05 |

- 허용 요소: 제목·문단·목록·링크·표·코드·기본 인라인 서식. script/style/iframe 등 실행·비허용 요소와 event/스타일/비허용 속성을 문서 모델로 전달하지 않는다. 비허용 블록의 텍스트 처리 규칙을 fixture에 기록한다.
- 붙여넣기 링크는 HTML entity 디코딩 이후 scheme을 검증한다. `http:`, `https:`, `mailto:`, 상대 경로·fragment만 링크로 허용하고 제어문자/공백 분리·`javascript:`·`data:`·`vbscript:`·protocol-relative 탐색은 비활성화한다.
- Markdown에서 가져온 위험 href 원문은 문서 모델·serializer에 유지한다. view는 위험 href를 클릭 가능한 `<a>`로 만들지 않고 텍스트 span으로 표시한다. 이 정책을 URL obfuscation fixture로 검증한다.
- raw HTML/raw Markdown block의 view DOM은 escape된 텍스트 노드만 사용한다. `innerHTML` 삽입과 raw 실행 경로를 제공하지 않는다.
- input rules는 지원 문법의 시작 패턴(`# `, `> `, 목록, fenced code 등)을 대상으로 하고 코드 블록·raw 블록 내부에서는 비활성화한다. keymap·history·selection은 실제 view 입력으로 검증한다.

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | HTML/URL로 스크립트·이벤트·위험 탐색 발생 방지 | allowlist 변환, 속성 제거, URL scheme 정규화, safe DOM spec, 악성 fixture와 클릭 검사 |
| NFR-02 | 표 셀 단일 paragraph 유지 | 모든 표 명령에서 `table_cell` 직접 자식 1개 검증, 경계 선택·삽입 테스트 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | 입력 규칙·선택·목록/표/코드 명령 구현 | 없음 | 1 | Must | FR-01, FR-02, NFR-02 | M |
| TASK-02 | 안전 view·HTML 붙여넣기 정규화 구현 | TASK-01 | 2 | Must | FR-03, FR-04, NFR-01 | M |
| TASK-03 | 실제 편집 상호작용·보안 회귀 테스트 | TASK-01, TASK-02 | 3 | Must | FR-01~05, NFR-01, NFR-02 | M |
| TASK-04 | 입력규칙 매핑·목록 키보드 결함 수정 | TASK-03 | 4 | Must | FR-01, FR-02, FR-05 | M |
| TASK-05 | 안전 클립보드·View·paste 경계 수정 | TASK-04 | 5 | Must | FR-03~05, NFR-01, NFR-02 | M |

## Task 의존성 그래프

```text
TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | raw/링크 원문 보존과 DOM 안전 표시 충돌 | 중 | 높 | 완화: 모델 속성과 view DOM 정책 분리, 위험 href 비탐색 테스트 | Markdown serializer 유지 |
| R-02 | HTML entity·제어문자 URL 우회 | 중 | 높 | 완화: DOM 파싱 후 URL 검증과 악성 fixture | 보안 AC 직접 검증 |
| R-03 | 표 명령이 셀에 중첩 문단 생성 | 중 | 중 | 완화: 삽입·변환 후 `table_cell` 구조 단언 | 단일 paragraph 계약 |
| R-04 | jsdom과 실제 브라우저 입력 차이 | 중 | 중 | 완화: DOM 상호작용을 실행하고 한계 기록, 실제 브라우저 매트릭스는 REQ-0006 | 별도 E2E stage 없음 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| REQ-0004 입력·선택·undo/keymap | FR-01 | TASK-01, TASK-03 | 규칙 전환·선택·undo/redo·shortcut | jsdom EditorView 테스트 |
| REQ-0004 구조 명령 | FR-02 | TASK-01, TASK-03 | 목록·표·코드 명령 | 상태·view 테스트 |
| REQ-0004 허용 HTML 변환 | FR-03 | TASK-02, TASK-03 | 문서 변환·Markdown export | paste fixture |
| REQ-0004 위험 HTML/링크 | FR-04, NFR-01 | TASK-02, TASK-03 | script/event/위험 탐색 없음 | 악성 paste·DOM 클릭 테스트 |
| REQ-0004 상호작용 검증 | FR-05 | TASK-03 | 모든 대상 시나리오 실행 | Vitest/jsdom |
| REQ-0004 표 구조 | NFR-02 | TASK-01, TASK-03 | 셀 직접 자식 문단 1개 | 구조 단언 |

---

## 자체 검증 체크리스트

- [x] 모든 FR이 최소 1개 Task에 매핑됨
- [x] 모든 NFR이 설계 또는 Task에 반영됨
- [x] Task 간 순환 의존 없음
- [x] 제약조건 내 실현 가능
- [x] 각 Task에 완료 조건이 있음
- [x] 리스크가 식별되고 대응 전략이 있음
- [x] 실행 순서가 의존관계와 일치함

---
