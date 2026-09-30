# 요구사항 명세서 — Vanilla 어댑터와 편집기 playground 구현

> WORK: PRUN-2026-09-0005
> REQ: REQ-2026-09-0005 (ID: 8147)
> 명세 상태: auto 확정 — DECISIONS.md D-01
> 복잡도: Medium
> 예상 영향 범위: Vanilla 공개 어댑터, 브라우저 통합 수명주기, playground, 통합 테스트

## 1. 원본 요청

> TODO REQ 번호 순서로 순차적으로 자동 실행

REQ-2026-09-0005: 프레임워크 비의존 HTMLElement mount/destroy, Markdown 초기화·조회, 변경 구독, 명령 연결, playground를 구현한다. 단일 HTML 로드·시각 편집·조회, destroy 후 이벤트·구독 정리, MVP 문법·붙여넣기 시나리오를 검증한다.

## 2. 배경 및 목적

- 해결하려는 문제: 프레임워크 없이 브라우저 애플리케이션이 WYSIWYG Markdown 편집기를 수명주기와 상태 조회까지 일관되게 사용할 통합 경로를 제공한다.
- 이해관계자: 브라우저 애플리케이션 개발자, Markdown 문서 작성자, 라이브러리 소비자, 후속 브라우저·문서·배포 준비 REQ 개발자.
- 기존 시스템/프로세스 관계: `REQ-2026-09-0003`의 GFM 변환·raw 보존 계약과 `REQ-2026-09-0004`의 편집·안전 붙여넣기 계약을 소비하는 MVP 로드맵 단계로 수행한다.

## 3. 범위

### In-Scope

- `HTMLElement`에 편집기를 mount하고 destroy하는 Vanilla 통합 경로를 제공한다.
- 초기 Markdown 설정, 편집 결과 Markdown 조회, 변경 구독, 기존 편집 명령 연결을 제공한다.
- 단일 HTML 환경에서 Markdown 로드·시각 편집·Markdown 조회를 보이는 playground를 제공한다.
- playground에서 현재 MVP 지원 Markdown 문법과 허용·비허용 HTML 붙여넣기 시나리오를 제공한다.
- destroy 뒤 DOM 이벤트와 변경 구독이 정리됨을 통합 수준에서 검증한다.

### Out-of-Scope

- React·Vue 등 프레임워크별 어댑터와 UI 패키지.
- raw Markdown 전환·분할 화면·협업·이미지 업로드·수식·Mermaid·멘션·콜아웃의 시각 편집.
- 실제 npm publish, main 릴리스, 운영 배포.
- `REQ-2026-09-0003`과 `REQ-2026-09-0004`에서 확정한 Markdown 변환·편집·안전 붙여넣기 규칙의 변경.

## 4. 기능 요구사항

| ID | 요구사항 | 우선순위 | 인수 기준 |
|----|---------|----------|----------|
| FR-01 | 시스템은 프레임워크 의존성 없이 지정된 `HTMLElement`에 편집기를 mount하고 해당 인스턴스를 destroy해야 한다. | M | - [ ] 브라우저 애플리케이션은 `HTMLElement`를 대상으로 편집기를 mount할 수 있다.<br>- [ ] destroy 뒤 편집기 DOM과 편집기 소유 DOM 이벤트가 제거됨을 검증할 수 있다.<br>- [ ] destroy 뒤 기존 편집기 상호작용으로 상태 변경이 발생하지 않음을 검증할 수 있다. |
| FR-02 | 시스템은 mount 시 초기 Markdown을 적용하고, 시각 편집 뒤 현재 Markdown을 조회해야 한다. | M | - [ ] 초기 Markdown을 로드한 편집 결과를 시각적으로 확인할 수 있다.<br>- [ ] 시각 편집 뒤 조회한 Markdown이 현재 편집 상태를 반영한다.<br>- [ ] `REQ-2026-09-0003`의 지원 문법 의미 보존과 raw 원문 보존 계약을 유지한다. |
| FR-03 | 시스템은 문서 변경 구독과 기존 편집 명령의 애플리케이션 연결을 제공해야 한다. | M | - [ ] 문서 변경 때 구독자가 변경을 수신함을 검증할 수 있다.<br>- [ ] 구독 해제 또는 destroy 뒤 해당 구독자가 추가 변경을 수신하지 않음을 검증할 수 있다.<br>- [ ] 연결한 목록·표·코드 블록 등 기존 편집 명령을 실행하고 결과 Markdown을 조회할 수 있다. |
| FR-04 | 시스템은 단일 HTML 환경에서 초기 Markdown 로드, 시각 편집, 현재 Markdown 조회를 보이는 사용 예제 playground를 제공해야 한다. | M | - [ ] 단일 HTML 환경에서 playground를 열어 초기 Markdown을 로드할 수 있다.<br>- [ ] playground에서 시각 편집을 수행할 수 있다.<br>- [ ] playground에서 편집 후 Markdown을 조회할 수 있다.<br>- [ ] playground 사용 경로가 프레임워크별 런타임을 요구하지 않는다. |
| FR-05 | 시스템은 playground에서 MVP 지원 Markdown 문법과 붙여넣기 시나리오를 제공해야 한다. | M | - [ ] playground는 기본 Markdown 블록·인라인 문법, GFM 표·체크리스트·취소선·자동 링크의 시각 편집 예시를 제공한다.<br>- [ ] playground는 허용 HTML 붙여넣기 결과를 확인하는 시나리오를 제공한다.<br>- [ ] playground는 script, event handler, 안전하지 않은 URL을 포함한 붙여넣기 결과가 실행 또는 탐색을 유발하지 않음을 확인하는 시나리오를 제공한다. |

## 5. 비기능 요구사항

| ID | 구분 | 요구사항 | 인수 기준 |
|----|------|---------|----------|
| NFR-01 | 호환성 | Vanilla 통합 경로와 playground는 특정 UI 프레임워크에 의존하지 않고 브라우저의 단일 HTML 환경에서 사용할 수 있어야 한다. | - [ ] 단일 HTML 환경의 사용 예제가 외부 UI 프레임워크 없이 동작한다.<br>- [ ] `HTMLElement` 기반 mount·destroy와 Markdown 입출력을 검증할 수 있다. |
| NFR-02 | 자원 수명주기 | destroy는 어댑터가 등록한 DOM 이벤트와 변경 구독을 남기지 않아야 한다. | - [ ] destroy 뒤 DOM 이벤트 정리를 통합 테스트로 검증한다.<br>- [ ] destroy 뒤 변경 구독 정리를 통합 테스트로 검증한다. |

## 6. 제약조건

- CON-01: 통합 경로는 프레임워크 비의존성을 유지한다.
- CON-02: 공식 입출력 형식은 Markdown으로 유지한다.
- CON-03: 지원 문법은 `REQ-2026-09-0003`의 기본 Markdown·GFM 범위와 의미 보존 계약을 따른다.
- CON-04: raw HTML과 미지원 블록은 실행하지 않고 원문 보존 계약을 유지한다.
- CON-05: 붙여넣기 안전성은 `REQ-2026-09-0004`의 script·event handler·안전하지 않은 URL 처리 계약을 유지한다.
- CON-06: 공개 API의 내부 구현 방법과 UI 구성 방식은 설계 단계에서 결정한다.

## 7. 가정사항

- ASM-01: `REQ-2026-09-0003`의 GFM 변환·raw 보존 계약과 `REQ-2026-09-0004`의 편집 명령·안전 붙여넣기 계약이 완료되어 있다. [합의 완료]
- ASM-02: playground의 MVP 지원 문법은 기본 Markdown 블록·인라인 문법과 GFM 표·체크리스트·취소선·자동 링크로 한정한다. [합의 완료: REQ-2026-09-0003]
- ASM-03: 단일 HTML 환경은 빌드 JavaScript 자산을 참조하는 프레임워크 비의존 HTML 사용 예제를 의미한다. [auto 확정: DECISIONS.md D-01]
- ASM-04: API 명칭, 옵션 구조, playground의 시각 디자인은 사용자 기능을 바꾸지 않는 설계 세부사항으로 처리한다. [auto 확정: DECISIONS.md D-01]

## 8. 용어 정의

| 용어 | 정의 |
|------|------|
| Vanilla 어댑터 | 특정 UI 프레임워크 없이 브라우저 애플리케이션과 편집기를 연결하는 공개 통합 경로 |
| mount | 지정 `HTMLElement`에 편집기 인스턴스와 상호작용 표면을 연결하는 수명주기 시작 동작 |
| destroy | 편집기 인스턴스가 소유한 DOM·이벤트·구독을 정리하는 수명주기 종료 동작 |
| 변경 구독 | 문서 상태 변경을 애플리케이션에 알리는 등록 가능한 통지 경로 |
| playground | 실제 통합 흐름과 MVP 편집 시나리오를 실행해 볼 수 있는 사용 예제 |
| 단일 HTML 환경 | 외부 UI 프레임워크 없이 브라우저가 해석하는 HTML 문서 환경 |

## 9. 추적성 매트릭스

| 원본 요청 항목 | 관련 FR/NFR | 인수 기준 |
|--------------|------------|----------|
| 프레임워크 의존성 없는 브라우저 통합 경로 | FR-01, FR-04, NFR-01 | AC-FR-01, AC-FR-04, AC-NFR-01 |
| `HTMLElement` mount/destroy | FR-01, NFR-02 | AC-FR-01, AC-NFR-02 |
| Markdown 초기화·조회 | FR-02 | AC-FR-02 |
| 변경 구독·명령 연결 | FR-03 | AC-FR-03 |
| 단일 HTML Markdown 로드·시각 편집·조회 | FR-04 | AC-FR-04 |
| MVP 지원 문법·붙여넣기 playground | FR-05 | AC-FR-05 |

## 10. 질의응답 기록

| # | 질문 | 답변 | 일시 |
|---|------|------|------|
| Q1 | playground의 MVP 지원 문법 범위는 무엇인가? | 기본 Markdown 블록·인라인 문법과 GFM 표·체크리스트·취소선·자동 링크를 사용한다. | 2026-09-30 |
| Q2 | raw HTML과 위험 URL을 playground에서 실행 또는 탐색하는가? | 실행하지 않으며, `REQ-2026-09-0004`의 안전 붙여넣기 계약을 유지한다. | 2026-09-30 |
| Q3 | 공개 API 명칭과 playground UI 디자인을 이번 명세에서 확정하는가? | 사용자 기능을 바꾸지 않는 설계 세부사항으로 후속 설계에서 결정한다. | 2026-09-30 |

## 자체 검증 체크리스트

- [x] mount·destroy, Markdown 입출력, 구독, 명령 연결을 기능 요구사항으로 분리했다.
- [x] 단일 HTML 환경의 로드·시각 편집·Markdown 조회 기준을 포함했다.
- [x] destroy 뒤 DOM 이벤트와 구독 정리 기준을 포함했다.
- [x] MVP 지원 문법과 허용·비허용 HTML 붙여넣기 playground 시나리오를 포함했다.
- [x] 이전 REQ의 GFM·raw 보존·안전 붙여넣기 계약을 변경 범위에서 제외했다.
- [x] 모든 FR/NFR에 검증 가능한 인수 기준이 있다.
