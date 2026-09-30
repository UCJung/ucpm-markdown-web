# 사용자 테스트 절차 — PRUN-2026-09-0005

> REQ: REQ-2026-09-0005
> 날짜: 2026-09-30
> 단계 결과: PASS — 사용자 테스트 절차 작성 완료
> 별도 E2E 실행: 미수행 — docs/UCPM_PIPELINE_GUIDE.md §3.6 적용

## 확인된 결과
- 독립 build/typecheck/Vitest 61개 PASS.
- PR #5 dev 병합 완료.
- Claude 교차검증 미수행(timeout: preflight-timeout). auto 정책으로 기록 후 계속했다.
- 배포 가이드 파일 부재로 배포 미수행.

## 사용자 테스트 방법
1. `pnpm install --frozen-lockfile` 및 `pnpm build`를 실행한다.
2. `pnpm --filter @uc-markdown-web/playground dev`를 실행하고 표시된 로컬 주소를 연다.
3. 기본·GFM 예제를 불러와 WYSIWYG에서 편집한다.
4. Markdown 조회 결과와 변경 구독 출력이 현재 문서를 반영하는지 확인한다.
5. 목록·표·코드·undo/redo 명령을 실행한다.
6. 허용/위험 HTML 붙여넣기 시나리오의 안전 DOM 및 Markdown 결과를 확인한다.
7. Markdown 가져오기로 새 문서를 생성하고 이전 구독·DOM이 중복되지 않는지 확인한다.

## 한계
- 현재 PASS는 절차 작성 결과이며 실제 브라우저 UI 테스트 통과가 아니다.
- REQ-0006의 Playwright에서 브라우저 상호작용을 검증한다.
