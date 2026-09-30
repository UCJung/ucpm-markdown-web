# TASK-04 Result

> WORK: PRUN-2026-09-0004 — 입력 규칙 매핑과 목록 키보드 결함 수정
> Completed: 2026-09-30
> Status: **DONE**

## 요약
입력 규칙 좌표 매핑, 목록 키맵 우선순위, 표 속성 보존을 수정했다.

## 완료 체크리스트
- [x] 인용·목록 마커 제거와 ordered 시작번호 보존.
- [x] 목록 Enter/Tab/Shift-Tab, 기본 키맵 fallback 검증.
- [x] 표 header/align 보존, 잘못된 cursor 거부 검증.
- [x] 미사용 의존성 제거 및 매개변수 명령 문서화.

## 검증 결과
- Build/typecheck/test/diff check: PASS.
- 독립 verifier 확인: extension-api 1, core 17, markdown 10, extensions 21 = 49 tests PASS.
- Lint: N/A — 스크립트 없음.
- 검증 전후 git 상태 동일.

## 변경 파일
- packages/extensions/src/{input-rules,keymap,commands,index}.ts 및 관련 테스트.
- packages/core/src/editor.ts — 키맵 우선순위.
- packages/extensions/package.json, vite.config.ts, pnpm-lock.yaml — 미사용 의존성 제거.
- packages/extensions/README.md — API 설명.

## 발생 이슈
- 중단된 builder의 변경을 보존해 재개했다.

## 후속 TASK 참고사항
- TASK-05에서 clipboard·paste·view 경계를 보강한다. 교차검증 재실행 없음.

## 컨텍스트 핸드오프
### Builder Context
- what: quote/list 마커 삭제 후 mapping, ordered order, 목록 키맵, 표 속성 회귀 추가.
- why: wrap/delete 좌표 변동과 baseKeymap 선점 결함 제거.
- caution: TASK-05 safeview/paste 및 사용자 docs 미변경.
- incomplete: None.

### Verifier Context
- what: build/typecheck/test/diff PASS, 입력·목록·표 회귀 확인.
- why: 확장 키맵 우선 등록과 schema-list 사용, 확인된 49 tests PASS.
- caution: 기존 미커밋·미추적 파일을 보존했으며 검증 전후 동일.
- incomplete: None.
