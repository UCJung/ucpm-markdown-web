# TASK-02: Vanilla DOM 통합 테스트

## WORK
PRUN-2026-09-0005: Vanilla 어댑터와 편집기 playground

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 공개 어댑터의 Markdown·명령·안전 붙여넣기·종료 동작을 DOM 통합 수준에서 검증 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01 완료 후 |
| Phase | Phase 2 |

## Scope

- 초기 Markdown mount → 렌더링 DOM 및 `getMarkdown()` 확인 → 기본/GFM·raw 의미 보존 기록.
- 편집 DOM 트랜잭션 → 공개 구독과 `getMarkdown()` 확인 → 최신 문서 상태 반영 기록.
- 공개 명령 실행 → 목록·코드 블록·표 변경 확인 → 직렬화 결과 기록.
- 구독 해제 → 후속 문서 변경 실행 → 기존 콜백 무통지 확인.
- destroy → 전용 DOM 제거 후 이전 편집 DOM에 입력·붙여넣기 이벤트 전달 → 상태 변경·콜백 무발생 확인.
- 허용·비허용 HTML paste → 기존 확장 경로에 이벤트 전달 → script·event handler·위험 URL 실행/탐색 경로 없음 확인.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/adapter-vanilla/src/index.test.ts` | CREATE | jsdom 기반 공개 API 통합 테스트 |
| `packages/adapter-vanilla/package.json` | MODIFY | jsdom 테스트 의존성 추가 |
| `pnpm-lock.yaml` | MODIFY | 테스트 의존성 반영 |

## Acceptance Criteria

- [x] 대상 `HTMLElement` mount와 destroy 뒤 편집 DOM 제거를 검증한다.
- [x] 초기/수정 Markdown 및 기본·GFM·raw 의미 보존을 검증한다.
- [x] 문서 변경 구독·해제와 선택 영역만 변경한 트랜잭션의 무통지를 검증한다.
- [x] 목록·표·코드 블록 명령의 Markdown 결과를 검증한다.
- [x] destroy 뒤 기존 DOM 이벤트와 core 변경 시도에서 구독 통지·상태 변경이 없음을 검증한다.
- [x] 허용 HTML 및 script·event handler·위험 URL paste가 기존 안전 정책을 통과함을 검증한다.

## Verify

```bash
pnpm --filter @uc-markdown-web/adapter-vanilla test
pnpm --filter @uc-markdown-web/adapter-vanilla typecheck
```

---
