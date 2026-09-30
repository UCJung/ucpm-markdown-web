# E2E 사용자 테스트 절차 — PRUN-2026-09-0001

> REQ: REQ-2026-09-0001
> 기준: docs/UCPM_PIPELINE_GUIDE.md §3.6
> 절차 작성: 완료
> 별도 E2E 실행: 미수행 — 프로젝트 운영 가이드 적용
> 사용자 테스트 결과: 미확인

## 사전 조건
- dev 최신 커밋으로 동기화.
- Node 24 이상, pnpm 11 설치.

## 사용자 테스트
| 단계 | 실행 | 기대 결과 |
|---|---|---|
| 1 | pnpm install --frozen-lockfile | lockfile 변경 없이 설치 성공 |
| 2 | pnpm build | 라이브러리 5개 및 playground 빌드 성공 |
| 3 | pnpm typecheck | 타입 오류 0건 |
| 4 | pnpm test | core 및 공개 진입점 소비 테스트 통과 |
| 5 | pnpm --filter @uc-markdown-web/playground dev | 안내용 scaffold 페이지 표시 |
| 6 | README와 브라우저 정책 SPEC 검토 | 패키지 경계·최근 2개 버전 지원 목표 확인 |

## 구현 검증 근거
- 독립 verifier: TASK-01·TASK-02 build/typecheck/test PASS.
- Claude 교차검증: PERFORMED, Critical 0 / High 0 / Medium 2 / Low 6.
- dev 병합: PR #1, 912fab25a9af01bff5977d6e914bd5bace809d38.

## 제한사항
- 현재 에디터 기능은 후속 REQ 구현 대상.
- 별도 배포 가이드 부재로 호스팅 배포 미수행.
- 브라우저별 실제 최신·직전 버전 검증 미수행.
