# TASK-04: 릴리스 증빙·노트·게시/되돌림 절차

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 실행 결과를 합쳐 릴리스 후보 판정과 게시·되돌림 절차를 완성 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, NFR-01, NFR-02, NFR-03, NFR-04 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-01, TASK-02, TASK-03 완료 후 |
| Phase | Phase 3 |

## Scope

1. 선행 Task 증빙 수집 → 실행 명령·환경·빌드/타입/Vitest 수·Playwright 엔진·axe·VitePress·tarball 소비 결과 정리 → 릴리스 후보 검증 기록.
2. 실패/미검증 항목 판정 → 실패 후보 차단, 엔진과 실제 브라우저 최신/직전 버전 차이·수동 접근성 한계 기록 → 판정표.
3. 확정된 버전·변경 내용 수집 → `0.x` 실험 API 안정성 경고와 알려진 제한을 포함한 릴리스 노트 작성 → 후보 노트.
4. 게시 선행조건 확인 → npm 조직·이름·권한·라이선스, 인증·버전·검증 결과·게시 확인·태그 확인 체크리스트 작성 → 공개 게시 대기 절차.
5. 게시 후 사고 절차 정리 → 중단 기준·npm deprecate/후속 수정 버전·소비자 안내 체크리스트 작성 → 되돌림 절차.
6. 운영 가이드 확인 → 병합 후 별도 E2E 단계에는 사용자 테스트 수행절차를 `e2e_result.md`에 작성하도록 orchestrator에 전달 → 단계 경계 기록.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `docs/[NOTE]_RELEASE_CANDIDATE.md` | CREATE | 재현 명령·환경·실측 결과·차단 판정 |
| `docs/[NOTE]_RELEASE_NOTES_0X.md` | CREATE | 0.x 변경 요약·실험 API 경고·제한 |
| `docs/[GUIDE]_RELEASE_CHECKLIST.md` | CREATE | 게시 선행조건·실행·확인·되돌림 절차 |

## Acceptance Criteria

- [ ] AC-01~15 실측 명령·결과와 미해결 항목을 출처와 함께 기록한다.
- [ ] 자동 axe critical/serious, 세 엔진 E2E, build/typecheck/Vitest, pack/import 실패 시 후보를 차단한다.
- [ ] 실제 브라우저 최신/직전 버전과 수동·보조공학 미검증은 별도 표시한다.
- [ ] 릴리스 노트에 후보 버전·변경 요약·0.x 실험 API 경고·알려진 제한을 포함한다.
- [ ] 게시 체크리스트에 인증·패키지명·버전·검증 결과·게시 확인·태그 확인을 포함한다.
- [ ] 되돌림 체크리스트에 중단 기준·deprecate 또는 후속 수정 버전·소비자 안내를 포함한다.
- [ ] 외부 미확정 결정값을 게시 차단 항목으로 유지하고 실제 publish를 실행하지 않는다.
- [ ] `docs/[GUIDE]_AUTHORING_STYLE.md`의 메타·목차·명사형 문체·참조·갱신 이력을 적용한다.

## Verify

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm exec playwright test
pnpm docs:build
node scripts/release/verify-pack.mjs
```

---
