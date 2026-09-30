# E2E 사용자 테스트 절차 — PRUN-2026-09-0002

> REQ: REQ-2026-09-0002
> 기준: docs/UCPM_PIPELINE_GUIDE.md §3.6
> 절차 작성: 완료
> 별도 E2E 실행: 미수행 — 운영 가이드 적용
> 사용자 테스트 결과: 미확인

## 사용자 테스트 절차

1. dev 동기화 후 pnpm install --frozen-lockfile 실행.
2. pnpm typecheck와 pnpm test 실행 → 19건 포함 코어 테스트 통과 확인.
3. core createEditor로 문서 생성·기본 명령·undo/redo·subscribe/unsubscribe·destroy 확인.
4. 확장 등록·중복 이름 거부·초기 topNode 오류·필터 거부 명령 false 반환 확인.
5. Markdown 변환·DOM mount는 후속 REQ에서 검증.

## 구현 검증 근거

독립 verifier build/typecheck/test 19건 PASS. Claude PERFORMED C0/H1/M4/L6. High 및 관련 입력경계 TASK-03 수정·검증 완료.

- dev 병합: PR #2, 2b339c9f208491ed869b4136b82c10fc8e2f1af6
- 별도 배포 가이드 부재: 호스팅 배포 미수행.
- 실제 최근 2개 브라우저 버전 검증 결과와 구분.

