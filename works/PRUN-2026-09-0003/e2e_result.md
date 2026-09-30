# E2E 사용자 테스트 절차 — PRUN-2026-09-0003

> REQ: REQ-2026-09-0003
> 기준: docs/UCPM_PIPELINE_GUIDE.md §3.6
> 절차 작성: 완료
> 별도 E2E 실행: 미수행 — 운영 가이드 적용
> 사용자 테스트 결과: 미확인

## 사용자 테스트 절차

1. `pnpm install --frozen-lockfile` 후 `pnpm build`, `pnpm typecheck`, `pnpm test`를 실행한다.
2. `packages/markdown/src/index.test.ts`에서 지원 GFM 구조·속성 roundtrip fixture를 확인한다.
3. raw-preservation/raw-boundaries fixture의 HTML·math·directive·CRLF·컨테이너·부분 겹침 source와 export 일치를 확인한다.
4. raw 포함 컨테이너 전체 강등 및 미지원 inline 블록 fallback 계약을 README와 비교한다.
5. 브라우저 편집·안전 DOM 렌더링은 후속 REQ-0004/0005 구현 후 별도 확인한다.

## 구현 검증 근거

GFM 변환·raw 원문 보존 및 High2 수정 완료. build/typecheck/Vitest29 PASS. Claude C0/H2/M4/L4 검토 후 TASK03 반영.

- dev 병합: PR #3, 15b61bbc494b5b73c8b9882f6ce307c7603ae304
- 별도 배포 가이드 부재: 호스팅 배포 미수행.
- 실제 최근 2개 브라우저 버전 검증 결과와 구분.

