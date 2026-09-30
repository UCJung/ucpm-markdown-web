# TASK-05 Result

> WORK: PRUN-2026-09-0006 — 유효 GFM 혼합 목록 보존
> Completed: 2026-09-30
> Status: **DONE**

## 요약
일반·checked·unchecked 항목과 중첩 내용을 보존하도록 혼합 목록 import/직렬화를 수정했다.

## 완료 체크리스트
- [x] 유효 GFM 혼합 목록의 초기화 예외 제거.
- [x] 항목 순서·체크 상태·중첩 parse/serialize/parse 보존.
- [x] 기존 일반/체크 목록·입력 규칙·paste 회귀 통과.

## 검증 결과
- Builder/독립 Verifier: pnpm build, pnpm typecheck, pnpm test PASS.
- 독립 개별 확인: markdown11/core17/extensions27/extension-api1/adapter5/playground1 = 62 PASS.
- lint N/A; 검증 전후 git 상태 동일.

## 변경 파일
- packages/markdown/src/schema.ts, parser.ts, serializer.ts, index.test.ts.

## 발생 이슈
- 기존 parser가 유효 GFM의 일반/체크 혼합 목록을 거부했다.
- task_list content를 (list_item | task_item)+로 확장하고 각 항목 타입/checked를 보존한다.

## 후속 TASK 참고사항
- task_list를 직접 소비하는 확장은 일반 list_item도 처리해야 한다.
- 실제 브라우저 혼합 목록 회귀는 TASK-01에서 별도로 확인한다.

## 컨텍스트 핸드오프
### Builder Context
- what: schema/parser/serializer와 중첩 roundtrip 회귀 수정.
- why: 유효 GFM 초기화 실패와 데이터 유실 방지.
- caution: fixture 정규화는 제품 수정과 별개, task_list 항목 가정 확장.
- incomplete: 없음.
### Verifier Context
- what: 독립 build/typecheck/test와 혼합·중첩/기존 명령 회귀 PASS.
- why: TASK-05 인수 기준 충족.
- caution: 동시 browser 작업 및 사용자 문서 보존.
- incomplete: browser 회귀 TASK-01, WebKit 환경 차단.
