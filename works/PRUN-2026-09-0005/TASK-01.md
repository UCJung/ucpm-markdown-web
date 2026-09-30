# TASK-01: Vanilla 공개 API와 수명주기 구현

## WORK
PRUN-2026-09-0005: Vanilla 어댑터와 편집기 playground

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | `HTMLElement`에 안전한 편집 뷰를 연결하고 Markdown·구독·명령·destroy 공개 API 제공 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

- 생성 호출 → 필수 `element`와 선택 `markdown` 수신 → `VanillaEditor` 인스턴스 반환.
- 초기화 → Markdown 스키마 생성 및 입력 파싱 → editing extension이 포함된 core editor 생성.
- editor 준비 → 대상 요소 안에 전용 자식 mount 생성 후 `createSafeEditorView` 호출 → 기존 안전 뷰·붙여넣기 계약 적용.
- 조회 호출 → 현재 editor 문서 직렬화 → Markdown 문자열 반환.
- 구독 호출 → core 구독 연결 및 `docChanged` 트랜잭션만 필터 → Markdown 콜백·해제 함수 반환.
- 명령 요청 → core `commands` 및 editing `extensionCommands` 노출 → 목록·표·코드 블록 등 기존 명령 실행.
- destroy 호출 → view·구독·editor·전용 DOM 정리 → 반복 호출 안전 및 종료 뒤 추가 상태 변경 차단.
- 생성 중 오류 → 생성된 자원 역순 정리 → 원래 오류 전파.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/adapter-vanilla/src/index.ts` | MODIFY | `createVanillaEditor` 및 공개 타입·수명주기 구현 |
| `packages/adapter-vanilla/package.json` | MODIFY | `@uc-markdown-web/extensions` 런타임 의존성 추가 |
| `packages/adapter-vanilla/vite.config.ts` | MODIFY | `extensions` 번들 외부화 추가 |
| `pnpm-lock.yaml` | MODIFY | workspace 의존성 변경 반영 |

## Acceptance Criteria

- [x] `createVanillaEditor({ element, markdown })`가 전용 편집 DOM을 대상 요소에 추가한다.
- [x] `getMarkdown()`이 현재 편집 문서를 기존 직렬화 규칙으로 반환한다.
- [x] `subscribe()`가 문서 변경에만 Markdown을 통지하고 반환한 함수가 구독을 해제한다.
- [x] `commands`와 `extensionCommands`가 기존 목록·표·코드 블록 명령에 접근할 수 있다.
- [x] `destroy()`가 view 및 어댑터 소유 DOM·구독을 정리하고 반복 호출에 안전하다.
- [x] raw 원문 표시와 붙여넣기는 기존 `extensions` 안전 경로를 사용한다.
- [x] 런타임 의존성에 UI 프레임워크가 추가되지 않는다.

## Verify

```bash
pnpm --filter @uc-markdown-web/adapter-vanilla build
pnpm --filter @uc-markdown-web/adapter-vanilla typecheck
```

---
