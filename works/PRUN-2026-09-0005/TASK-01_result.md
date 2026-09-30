# TASK-01 Result

> WORK: PRUN-2026-09-0005 — Vanilla 공개 API와 수명주기
> Completed: 2026-09-30
> Status: **DONE**

## 요약
Vanilla 공개 API를 기존 core/Markdown/안전 view에 연결했다.

## 완료 체크리스트
- [x] 전용 mount, 초기 Markdown·조회, docChanged 구독, 명령 연결.
- [x] 생성 실패 정리 및 멱등 destroy.
- [x] extensions 의존성·외부화·lock 반영.

## 검증 결과
- adapter build/typecheck: 독립 PASS.
- adapter test: 파일 0개, exit 0. 통합 검증은 TASK-02.
- lint N/A. 검증 전후 git 상태 동일.

## 변경 파일
- packages/adapter-vanilla/src/index.ts, package.json, vite.config.ts.
- pnpm-lock.yaml.

## 발생 이슈
없음.

## 후속 TASK 참고사항
- TASK-02 통합검증·TASK-03 playground를 병렬 수행한다.

## 컨텍스트 핸드오프
### Builder Context
- what: 전용 mount·직렬화·문서변경 구독·명령·destroy 구현.
- why: 기존 safeView/editingExtension 재사용.
- caution: destroy 후 getMarkdown/subscribe 오류, 명령은 core 종료보호.
- incomplete: None.
### Verifier Context
- what: adapter build/typecheck 통과. tests0 확인.
- why: core/extensions/Markdown 연결 확인.
- caution: 수명주기 자동통합검증 미수행.
- incomplete: TASK-02 DOM 통합 테스트.
