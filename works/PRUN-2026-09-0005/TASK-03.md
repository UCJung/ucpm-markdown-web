# TASK-03: 단일 HTML playground 구현

## WORK
PRUN-2026-09-0005: Vanilla 어댑터와 편집기 playground

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | Vanilla 공개 API를 사용하는 단일 HTML 편집 예제와 MVP 문법·붙여넣기 시나리오 제공 |
| 매핑 요구사항 | FR-04, FR-05, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- HTML 로드 → Markdown 입력·편집 mount·조회 출력·명령·시나리오 컨트롤 표시 → 단일 HTML 진입점 제공.
- 로드 버튼 → 기존 인스턴스 destroy 후 입력 Markdown으로 재생성 → 시각 편집 결과 표시.
- 문서 변경 → `subscribe()`로 현재 Markdown 출력 갱신 → 편집·조회 흐름 확인.
- 조회 버튼 → `getMarkdown()` 호출 → 현재 Markdown 출력 갱신.
- 명령 버튼 → 공개 `commands`/`extensionCommands` 호출 → 목록·표·코드 블록 등 실행.
- 문법 시나리오 선택 → 기본 블록·인라인 및 GFM 표·체크리스트·취소선·자동 링크 fixture 로드 → 시각 편집 예제 제공.
- 붙여넣기 시나리오 실행 → 허용 HTML 및 script·event handler·위험 URL fixture를 편집 DOM paste 경로로 전달 → 결과 Markdown과 안전한 DOM 표시.
- 예제 수명 종료 → 등록한 playground 이벤트·구독 및 어댑터 인스턴스 정리 → 중복 핸들러 방지.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/playground/index.html` | MODIFY | 단일 HTML 예제 컨트롤과 편집 영역 제공 |
| `packages/playground/src/main.ts` | MODIFY | Vanilla API 소비·시나리오·출력 연결 |
| `packages/playground/src/*.ts` | CREATE | 필요한 경우 fixture 또는 UI 헬퍼 분리 |
| `packages/playground/src/*.css` | CREATE | 필요한 경우 편집 영역·안전 시나리오 상태 표시 |

## Acceptance Criteria

- [x] 기존 Vite 빌드의 단일 `index.html`에서 UI 프레임워크 없이 Markdown 로드·시각 편집·조회가 동작한다.
- [x] 기본 블록·인라인 및 GFM 표·체크리스트·취소선·자동 링크 예제가 보인다.
- [x] 목록·표·코드 블록 등 기존 명령을 공개 어댑터 경유로 실행한다.
- [x] 허용 HTML paste 결과와 script·event handler·위험 URL 차단 결과를 편집 DOM과 Markdown 출력으로 확인한다.
- [x] 시나리오 변경 시 이전 인스턴스와 구독이 정리되어 중복 통지가 없다.
- [x] raw 전환·분할 화면은 추가하지 않는다.

## Verify

```bash
pnpm --filter @uc-markdown-web/playground build
pnpm --filter @uc-markdown-web/playground typecheck
```

---
