# PRUN-2026-09-0005: Vanilla 어댑터와 편집기 playground

> Created: 2026-09-30
> Requirement: REQ-2026-09-0005
> Project: UCMARKDOWNWEB
> Tech Stack: TypeScript, pnpm workspace, Vite, Vitest, jsdom, ProseMirror
> Language: ko
> Status: PLANNED

## 목표

`HTMLElement` 수명주기와 Markdown 입출력·변경 구독·기존 명령을 하나의 Vanilla 공개 API로 연결한다. 빌드 JavaScript 자산을 참조하는 단일 HTML playground에서 MVP 편집·붙여넣기 흐름을 제공한다.

## 설계

### 1. 아키텍처 방향

| 항목 | 결정 |
|------|------|
| 접근 방식 | 기존 `adapter-vanilla` 골격과 `playground` 스캐폴딩 확장 |
| 구조 | `adapter-vanilla` → `core`·`markdown`·`extensions`; playground → 어댑터 공개 진입점 |
| 데이터 흐름 | 초기 Markdown → `createMarkdownSchema`/`parseMarkdown` → `createEditor` + `createEditingExtension` → `createSafeEditorView` → 편집 트랜잭션 → `serializeMarkdown` |
| 안전 계약 | 기존 `createSafeEditorView`와 `createEditingExtension` 사용; raw 표시와 붙여넣기 정책 재구현 금지 |
| DOM 소유 | 대상 요소 안에 어댑터 전용 자식 mount 생성; destroy 시 해당 자식만 제거 |
| 종료 순서 | 전용 view destroy → 구독 해제 → editor destroy → 전용 mount 제거; 부분 생성 실패 시 생성된 자원 역순 정리 |

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 없음; 기존 Markdown 스키마 사용 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | 어댑터 인스턴스가 editor/view/구독 해제 함수를 메모리에서 소유 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| `createVanillaEditor` | TypeScript 함수 | `{ element: HTMLElement; markdown?: string }` → `VanillaEditor`; 기존 `VanillaEditorConfiguration`을 필수 element 계약으로 정리 | FR-01, FR-02 |
| `VanillaEditor.getMarkdown` | 인스턴스 메서드 | `() => string`; 현 editor 문서 직렬화 | FR-02 |
| `VanillaEditor.subscribe` | 인스턴스 메서드 | `(listener: (markdown: string) => void) => () => void`; 문서 변경 트랜잭션에만 통지 | FR-03 |
| `VanillaEditor.commands` | 인스턴스 프로퍼티 | 기존 core `EditorCommands` 노출 | FR-03 |
| `VanillaEditor.extensionCommands` | 인스턴스 프로퍼티 | 기존 editing extension 명령 맵 노출 | FR-03 |
| `VanillaEditor.destroy` | 인스턴스 메서드 | `() => void`; 반복 호출 안전; 종료 후 명령·구독 등록 차단 | FR-01, FR-03 |
| playground | HTML + Vite 모듈 | `packages/playground/index.html` → `src/main.ts`; 초기/현재 Markdown, 편집 표면, 명령·시나리오 컨트롤 | FR-04, FR-05 |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | 프레임워크 없는 단일 HTML 소비 | 어댑터 DOM API만 사용; playground의 기존 Vite 모듈 빌드와 단일 HTML 진입점 유지 |
| NFR-02 | destroy 자원 정리 | 어댑터 소유 DOM·view 이벤트·구독 해제 후 core 종료; jsdom 통합 테스트로 종료 후 무통지·무변경 확인 |

### 5. 영향 범위

| 영역 | 대상 | 계획 |
|------|------|------|
| 공개 어댑터 | `packages/adapter-vanilla/src/index.ts` | 생성·조회·구독·명령·destroy 구현 |
| 패키지 구성 | `packages/adapter-vanilla/package.json`, `vite.config.ts`, `pnpm-lock.yaml` | `extensions` 런타임 의존성과 jsdom 테스트 의존성·외부화 추가 |
| 통합 테스트 | `packages/adapter-vanilla/src/*.test.ts` | DOM 편집·Markdown·명령·수명주기·안전 붙여넣기 확인 |
| 예제 | `packages/playground/index.html`, `src/main.ts`, 선택적 스타일/fixture 파일 | 단일 HTML 통합 UI와 MVP 시나리오 제공 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | Vanilla 공개 API와 수명주기 구현 | 없음 | 1 | Must | FR-01, FR-02, FR-03, NFR-01, NFR-02 | M |
| TASK-02 | Vanilla DOM 통합 테스트 | TASK-01 | 2 | Must | FR-01, FR-02, FR-03, NFR-02 | M |
| TASK-03 | 단일 HTML playground 구현 | TASK-01 | 2 | Must | FR-04, FR-05, NFR-01 | M |

## Task 의존성 그래프

```text
TASK-01 ──┬──> TASK-02
          └──> TASK-03
```

TASK-01 완료 → TASK-02와 TASK-03 병렬 실행 가능.

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | core 구독은 선택 영역 트랜잭션도 통지 | 중 | 중 | 완화: `transaction.docChanged` 필터 후 Markdown 통지 | `packages/core/src/editor.ts` |
| R-02 | view와 editor 종료 순서 불일치 시 이벤트·콜백 잔존 | 중 | 높 | 완화: view 우선 종료·전용 DOM 제거·종료 후 이벤트 테스트 | `packages/extensions/src/safe-view.ts` |
| R-03 | jsdom과 실제 브라우저의 붙여넣기 이벤트 차이 | 중 | 중 | 완화: 기존 paste fixture 재사용; 실제 브라우저 검증은 REQ-2026-09-0006에 이관 | `packages/extensions/README.md` |
| R-04 | HTML 시나리오가 안전 처리 경로를 우회 | 중 | 높 | 회피: 편집 DOM의 paste 이벤트로 기존 확장 처리 경로 사용 | `packages/extensions/src/paste.ts` |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| HTMLElement mount/destroy | FR-01 | TASK-01, TASK-02 | AC-FR-01 | jsdom DOM·종료 후 이벤트 검증 |
| Markdown 초기화·조회 | FR-02 | TASK-01, TASK-02 | AC-FR-02 | 지원 문법·raw 왕복 통합 테스트 |
| 구독·명령 연결 | FR-03 | TASK-01, TASK-02 | AC-FR-03 | 명령 결과·해제·destroy 통합 테스트 |
| 단일 HTML 사용 예제 | FR-04 | TASK-03 | AC-FR-04 | playground 빌드·UI 동작 확인 |
| MVP 문법·붙여넣기 | FR-05 | TASK-03 | AC-FR-05 | 예제 fixture·편집 DOM paste 시나리오 확인 |
| 프레임워크 비의존 | NFR-01 | TASK-01, TASK-03 | AC-NFR-01 | 의존성 확인·playground 빌드 |
| 자원 정리 | NFR-02 | TASK-01, TASK-02 | AC-NFR-02 | destroy 후 DOM 이벤트·구독 무반응 테스트 |

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
