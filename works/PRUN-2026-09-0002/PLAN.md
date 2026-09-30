# PRUN-2026-09-0002: 프레임워크 중립 편집 코어와 확장 API 구현

> Created: 2026-09-30
> Requirement: REQ-2026-09-0002
> Project: UCMARKDOWNWEB
> Tech Stack: TypeScript, ProseMirror, pnpm workspace, Vitest
> Language: ko
> Status: PLANNED

## 목표

DOM과 프레임워크에 의존하지 않는 편집기 상태·명령·구독 API를 제공한다. 확장 타입과 lifecycle을 정의하고 단위 테스트로 계약을 검증한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 기존 `core`·`extension-api` 패키지 확장.
- **구조**: `extension-api`가 타입 계약을 제공하고 `core`가 ProseMirror `Schema`·`EditorState`·`Transaction`·`Plugin`을 조립하는 headless 구조.
- **데이터 흐름**: 초기 문서 또는 기본 문서 → `EditorState` 생성 → 명령/transaction 적용 → 새 상태 저장 → 구독자 통지. DOM `EditorView`는 후속 REQ에서 연결.
- **스키마 확장**: 기본 `doc`·`paragraph`·`text`와 최소 서식 노드·마크를 제공하고 확장의 node/mark spec을 생성 시 병합. GFM 표·미지원 raw 블록은 후속 확장의 spec을 등록할 수 있게 경계를 남긴다.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | ProseMirror 메모리 문서 스키마 추가 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | `Schema`를 인스턴스 생성 시 고정. 초기 문서는 해당 스키마의 `Node` 또는 JSON으로 검증 후 생성 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| `createEditor(options)` | TypeScript API | 확장 목록·초기 문서 입력, `Editor` 반환 | FR-01, FR-03 |
| `getState()`·`dispatch(tr)` | TypeScript API | 상태 조회·transaction 적용 | FR-02 |
| `commands` | TypeScript API | 기본 서식·문단·undo/redo 명령. 성공 시 `true`, 적용 불가 시 `false` | FR-02 |
| `subscribe(listener)` | TypeScript API | 상태 변경 알림, 해제 함수 반환 | FR-02, FR-04 |
| `destroy()` | TypeScript API | 인스턴스 정리, 확장 종료 hook 역순 호출 | FR-01, FR-03 |
| `Extension` | TypeScript 타입 | 이름, node/mark spec, plugin/keymap/command 제공 및 생성·종료 hook | FR-03 |

- 확장 이름·node/mark 이름 충돌은 생성 중 오류로 보고한다. `onCreate` 실패 시 초기화 완료 확장을 역순 정리한다.
- transaction 적용 후 구독자를 등록 순서의 스냅샷으로 동기 통지한다. 통지 중 재진입 `dispatch`는 명시적 오류로 거부한다. 구독 해제는 멱등 처리한다.
- `destroy()`는 멱등 처리한다. 종료 후 상태 변경 명령과 dispatch는 오류로 거부한다. `getState()`는 마지막 상태 조회를 허용한다.
- 구독자 또는 종료 hook 오류가 발생하면 나머지 callback/hook을 계속 실행한 뒤 오류를 집계해 반환한다.
- `history`와 `keymap` 플러그인을 상태에 구성한다. 키 이벤트 실행은 후속 DOM 연결 단계에서 검증한다.

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | `core`·`extension-api`의 React/Vue 런타임 비의존성 | 매니페스트와 정적 import를 검증하고 DOM 없이 Node/Vitest에서 코어 테스트 실행 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | 확장 타입과 확장 가능 문서 스키마 정의 | 없음 | 1 | Must | FR-02, FR-03, NFR-01 | M |
| TASK-02 | headless 편집기 lifecycle·명령·구독 및 테스트 구현 | TASK-01 | 2 | Must | FR-01, FR-02, FR-03, FR-04, NFR-01 | M |
| TASK-03 | 교차검증 명령 성공 계약 및 문서 입력 경계 수정 | TASK-02 | 3 | Must | FR-01, FR-02, FR-03, FR-04 | M |

## Task 의존성 그래프

```text
TASK-01 → TASK-02 → TASK-03
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | ProseMirror 스키마 고정 후 GFM/raw 블록 확장 불가 | 중 | 높 | 완화: 인스턴스 생성 전 확장 spec 병합, 충돌 검사 테스트 | 후속 REQ-0003 입력 |
| R-02 | lifecycle 오류로 listener 또는 extension 정리 누락 | 중 | 중 | 완화: 오류 집계·역순 정리·재진입·멱등 테스트 | 상태 전이 명시 |
| R-03 | 현 workspace `typecheck`·`test`가 선행 build에 의존하고 테스트 소스 타입검사 누락 | 높 | 중 | 완화: 실행 순서를 스크립트로 보장하고 빌드용·타입검사용 tsconfig 분리 | 전 WORK 교차검증 medium 2건 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| REQ-0002 코어 생성·정리 | FR-01 | TASK-02 | DOM 없이 생성·멱등 정리 | Vitest |
| REQ-0002 상태·명령·구독 | FR-02 | TASK-01, TASK-02 | 명령/transaction/undo·redo·keymap 구성 | Vitest·타입검사 |
| REQ-0002 확장 계약 | FR-03 | TASK-01, TASK-02 | 타입과 hook 동작 | 타입검사·Vitest |
| REQ-0002 단위 테스트 | FR-04 | TASK-02 | 명령·구독 테스트 실행 | `pnpm test` |
| REQ-0002 프레임워크 비의존 | NFR-01 | TASK-01, TASK-02 | React/Vue 런타임 의존 없음 | 매니페스트·import 확인, Node 테스트 |

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
