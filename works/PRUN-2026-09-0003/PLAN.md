# PRUN-2026-09-0003: GFM Markdown 변환과 미지원 블록 원문 보존 구현

> Created: 2026-09-30
> Requirement: REQ-2026-09-0003
> Project: UCMARKDOWNWEB
> Tech Stack: TypeScript, ProseMirror, unified, remark-parse, remark-gfm, remark-stringify, Vitest
> Language: ko
> Status: PLANNED

## 목표

Markdown을 편집 문서로 import하고 GFM 지원 문법의 의미를 보존해 export한다. raw HTML 및 식별 가능한 미지원 블록은 실행 없이 원문 그대로 보존한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: `markdown` 패키지 구현 및 필요한 `core` 스키마 확장.
- **구조**: `markdown` → `core` 단방향 의존. `createMarkdownSchema()`가 편집용 스키마를 생성하고 `parseMarkdown(source, schema?)`·`serializeMarkdown(doc)`가 변환을 담당한다.
- **데이터 흐름**: source → remark/GFM mdast와 source offset → ProseMirror Node → mdast/Markdown 문자열. raw 블록은 source slice를 Node 속성에 저장하고 serializer에서 그대로 출력한다.
- **스키마**: 기본 블록·인라인 외 표/행/셀, 취소선 mark, 링크·코드 블록 속성, 체크리스트 상태를 표현한다. `createEditor({schema, doc})`로 연결하며 `core`가 `markdown`을 참조하지 않는다.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | ProseMirror 메모리 문서 모델에 GFM 표현 추가 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | 표 정렬, 체크 상태, 코드 언어, 링크 href/title, raw Markdown source 보존 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| `createMarkdownSchema()` | TypeScript API | GFM 및 raw block 수용 `Schema` 반환 | FR-01, FR-03 |
| `parseMarkdown(source, schema?)` | TypeScript API | Markdown 문자열 → ProseMirror `doc` Node | FR-01, FR-03 |
| `serializeMarkdown(doc)` | TypeScript API | ProseMirror `doc` Node → Markdown 문자열 | FR-01, FR-02, FR-03 |
| fixture 계약 | 파일·테스트 | 지원 문법 의미 비교, 허용 정규화, raw 원문 일치 | FR-02, FR-04 |

- 지원 블록: 문단·제목·인용문·구분선·순서/비순서 목록·체크리스트·fenced/indented 코드·GFM 표.
- 지원 인라인: 굵게·기울임·취소선·링크·인라인 코드·GFM 자동 링크. Markdown 특성에 따라 soft/hard break와 이스케이프를 fixture에 포함한다.
- raw HTML block은 mdast `html`의 source position으로 원문 slice를 보존한다. `$$` 수식 블록과 `:::` directive 블록은 명시적 remark recognizer로 식별하고 같은 방식으로 보존한다. 알 수 없는 mdast 블록도 raw fallback한다.
- recognizer로 해석되지 않는 임의 문법까지 자동 분류한다고 가정하지 않는다. 보존 대상 패턴·경계·예외를 fixture 계약에 명시한다. fence·코드 블록 내부의 `$$`/`:::`은 raw로 오인하지 않는다.
- raw source 속성은 HTML 해석·DOM 실행을 수행하지 않는 불투명 문자열이다. source slice에는 블록 자체와 내부 공백/줄바꿈을 포함한다. 문서 전체 경계의 구분 줄바꿈은 serializer 정규화 대상이다.
- 지원 문법은 문자열 동일성 대신 파싱된 구조·속성·텍스트 의미를 비교한다. raw 블록 source는 바이트/문자 단위 동일성으로 비교한다.
- 링크 href 원문은 의미 보존을 위해 저장한다. `javascript:` 등 위험 scheme의 클릭 가능 DOM 반영은 후속 어댑터/붙여넣기 단계에서 안전한 URL 정책으로 제한한다.

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | raw HTML·미지원 블록 텍스트 무변형 보존 | mdast source position/offset slice 저장, serializer의 raw 그대로 출력, 혼합 문서·CRLF·trailing newline fixture 검증 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | GFM 스키마와 Markdown import/export 구현 | 없음 | 1 | Must | FR-01, FR-02 | M |
| TASK-02 | raw 원문 보존·정규화 fixture와 회귀 검증 | TASK-01 | 2 | Must | FR-02, FR-03, FR-04, NFR-01 | M |
| TASK-03 | raw 변환 경계 결함 수정 | TASK-02 | 3 | Must | FR-01, FR-02, FR-03, FR-04, NFR-01 | M |

## Task 의존성 그래프

```text
TASK-01 → TASK-02 → TASK-03
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | 지원 문법을 raw로 오분류하거나 fence 내부 문법을 raw로 오인 | 중 | 높 | 완화: mdast 위치·명시적 recognizer 사용, 중첩/fence fixture | 정규식 단독 탐지 배제 |
| R-02 | raw 블록 주변 직렬화로 원문 공백 손실 | 중 | 높 | 완화: source slice와 문서 경계 구분, isolated/mixed/CRLF fixture | raw 내부 무변형 |
| R-03 | 링크 href를 후속 DOM에서 위험 scheme으로 노출 | 중 | 높 | 완화: 원문 보존과 안전 렌더링 분리, URL 정책을 REQ-0004/0005에 인계 | 본 REQ는 DOM 없음 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| REQ-0003 기본/GFM 변환 | FR-01 | TASK-01 | 지원 문법 import/export | fixture·Vitest |
| REQ-0003 의미 보존 | FR-02 | TASK-01, TASK-02 | 구조·속성 동일성 및 정규화 계약 | 왕복 fixture |
| REQ-0003 raw 보존 | FR-03 | TASK-02 | HTML·math·directive raw source 일치, 실행 없음 | raw fixture·코드 확인 |
| REQ-0003 fixture 계약 | FR-04 | TASK-02 | 정규화/무변형 기준 기록 | fixture 문서 확인 |
| REQ-0003 데이터 보존 | NFR-01 | TASK-02 | raw source 무변형 export | byte/character 비교 |

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
