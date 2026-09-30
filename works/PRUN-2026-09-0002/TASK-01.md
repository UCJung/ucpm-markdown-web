# TASK-01: 확장 타입과 확장 가능 문서 스키마 정의

## WORK

PRUN-2026-09-0002: 프레임워크 중립 편집 코어와 확장 API 구현

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 후속 코어·Markdown 확장이 공유할 타입과 충돌 검증 가능한 스키마 구성 |
| 매핑 요구사항 | FR-02, FR-03, NFR-01 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | 없음 |
| Phase | Phase 1 |

## Scope

- `extension-api`에 `Extension`·`ExtensionContext`와 node/mark spec, plugin, keymap, command, `onCreate`·`onDestroy` 계약을 정의한다.
- `core`에 기본 `doc`·`paragraph`·`text`와 기본 서식용 schema spec을 구성한다.
- 확장 목록으로 인스턴스별 스키마를 조립하고 중복 확장명·node/mark명 충돌을 거부한다.
- GFM 표와 미지원 raw 블록 spec을 후속 확장으로 등록할 수 있도록 node/mark 합성 경계를 제공한다. GFM/raw 변환 로직은 추가하지 않는다.
- `core`·`extension-api`의 React/Vue runtime import와 dependencies가 없음을 유지한다.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/extension-api/src/index.ts` | MODIFY | 확장 타입·lifecycle 계약 공개 |
| `packages/extension-api/package.json` | MODIFY | ProseMirror 타입 의존 선언 |
| `packages/core/src/schema.ts` | CREATE | 기본 schema와 확장 spec 병합 |
| `packages/core/src/index.ts` | MODIFY | 스키마 API 공개 |
| `packages/core/package.json` | MODIFY | ProseMirror 런타임 의존 선언 |
| `packages/core/src/schema.test.ts` | CREATE | 확장 및 충돌 검증 |

## Acceptance Criteria

- [x] 확장 타입이 `extension-api` 공개 진입점에서 TypeScript로 소비 가능.
- [x] 기본 문서와 확장 node/mark spec으로 Schema 생성 가능.
- [x] 중복 이름에 명시적 오류 발생.
- [x] `core`·`extension-api`에 React/Vue 런타임 의존성 없음.
- [x] 향후 raw 블록 node spec을 확장으로 추가할 수 있는 테스트 통과.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
```

---
