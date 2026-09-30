# 사용자 테스트 절차 — PRUN-2026-09-0004

> REQ: REQ-2026-09-0004
> 날짜: 2026-09-30
> 단계 결과: PASS — 사용자 테스트 절차 작성 완료
> 별도 E2E 실행: 미수행 — docs/UCPM_PIPELINE_GUIDE.md §3.6 적용

## 확인된 결과
- 독립 verifier: build/typecheck/Vitest 56개/diffcheck PASS.
- Claude 리뷰 High 3건을 TASK-04·05로 수정했다.
- PR #4 dev 병합 완료.
- 배포 가이드 파일이 없어 배포는 수행하지 않았다.

## 사용자 테스트 방법
1. `pnpm install --frozen-lockfile`로 의존성을 설치한다.
2. `pnpm --filter @uc-markdown-web/extensions test`로 입력·clipboard·paste 회귀를 실행한다.
3. 후속 REQ-0005 playground에서 `# `, `> `, `- `, `3. ` 입력 후 마커 제거와 구조 전환을 확인한다.
4. 목록 Enter·Tab·Shift-Tab과 undo/redo를 확인한다.
5. 문단 중간·표 셀·코드 블록에 HTML을 붙여넣고 주변 텍스트와 표 셀 단일 문단을 확인한다.
6. copy/cut, 빈 HTML+평문, script/event/위험 URL 입력을 확인한다.
7. raw 블록의 텍스트 표시·편집금지 및 editor/view 정리 순서를 확인한다.

## 후속 검증
- REQ-0006에서 실제 브라우저 clipboard·MutationObserver·native drop·키보드 동작을 검증한다.
- 이 기록의 PASS는 절차 작성 결과이며 실제 브라우저 사용자 테스트 통과를 뜻하지 않는다.
