# TASK-02: VitePress 소비자 문서

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 설치·Vanilla 사용·지원 문법·알려진 제한을 탐색 가능한 문서로 제공 |
| 매핑 요구사항 | FR-04, FR-03, NFR-02, NFR-03, NFR-04 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00 완료 후 |
| Phase | Phase 2 |

## Scope

1. 기존 공개 API·README 확인 → VitePress 내비게이션과 설치·Vanilla·문법·제한 페이지 작성 → 소비자 문서.
2. 예제 검토 → `createVanillaEditor({ element, markdown })`, `getMarkdown()`, `destroy()`와 필요한 패키지 설치 순서 확인 → 실행 가능한 코드 예제.
3. 문법 계약 확인 → Markdown/GFM 지원과 raw 보존·미지원 시각 편집 동작 구분 → 문법 표.
4. 브라우저·접근성 범위 확인 → 지원 정책, 엔진 검증 근거, 실제 최신/직전 메이저 미검증, WCAG 2.2 AA 목표·수동 한계·알려진 이슈 기록 → 제한 페이지.
5. `docs/[GUIDE]_AUTHORING_STYLE.md` 적용 → 메타·목차·참조·갱신 이력 정리 → 문서 스타일 검증.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `docs/.vitepress/config.ts` | CREATE | VitePress 사이트·내비게이션 구성 |
| `docs/index.md` | CREATE | 문서 진입점과 0.x 실험 API 경고 |
| `docs/guide/installation.md` | CREATE | 설치 전제·패키지 관계·공개 진입점 |
| `docs/guide/vanilla.md` | CREATE | 생성·설정·조회·종료 예제 |
| `docs/guide/syntax.md` | CREATE | MVP 지원 Markdown/GFM와 raw 보존 경계 |
| `docs/guide/limitations.md` | CREATE | 기능·브라우저·접근성 제한과 미해결 이슈 |
| `docs/[SPEC]_BROWSER_SUPPORT.md` | MODIFY | 정책과 이번 실행 검증 범위 연결 |

## Acceptance Criteria

- [x] 문서에서 소비자 설치 전제와 공개 API 진입점을 확인할 수 있다.
- [x] Vanilla 생성·Markdown 설정·조회·종료 코드 예제가 현재 API와 일치한다.
- [x] 지원 문법과 미지원·raw 보존·알려진 제한이 구분된다.
- [x] `0.x` 실험 API 경고와 브라우저 정책·실제 버전 미검증 범위가 표시된다.
- [x] WCAG 2.2 AA 목표·자동 점검 기준·수동/보조공학 미검증 범위가 표시된다.
- [x] VitePress 빌드가 성공하고 모든 내부 링크가 유효하다.

## Verify

```bash
pnpm docs:build
```

---
