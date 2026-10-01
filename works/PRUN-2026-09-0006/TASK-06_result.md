# TASK-06 Result

> WORK: PRUN-2026-09-0006 — Docker Linux 검증 환경
> Completed: 2026-10-01
> Status: **DONE**

## 요약
승인된 Docker test/playground를 구축했다. Linux 세 엔진 자동 검증 통과와 HTTP200을 확인했다. 로컬 UI 수동 확인은 미수행이다.

## 완료 체크리스트
- [x] 지정 이미지·Node24·pnpm11.25.0·frozen install/build.
- [x] 테스트는 호스트 포트 없이 실행, playground만 loopback4180 게시.
- [x] 실행별 RUN_ID 보고서 보존 및 기존 컨테이너 유지.
- [x] Linux WebKit 포함 18개 자동 테스트 독립 PASS.

## 검증 결과
- base: mcr.microsoft.com/playwright:v1.63.0-noble, digest sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27.
- 최종 이미지: sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1 (linux/amd64).
- 환경: Ubuntu24.04.4 LTS, Node24.17.0, pnpm11.25.0, Playwright1.63.0.
- Builder 초기 이미지15973d3d7015: build/typecheck/Vitest62/docs/WebKit6/all18 PASS. RUN_ID 20261001-121500-webkit 및 20261001-121500-all.
- 로그 디렉터리 추가 제외 후 최종 이미지로 독립 typecheck/Vitest62/docsbuild(2.98s)/18개 PASS(1.5m), RUN_ID 20261001-verifier-all18 및 verifier-unit62/verifier-docs.
- 엔진: Chromium153.0.8010.12, Firefox155.0, WebKit26.6.
- Compose config exit0, playground127.0.0.1:4180→4173, HTTP200.
- 보고서: playwright-report/<RUN_ID>/, test-results/<RUN_ID>/ (ignored, 호스트 보존).
- 실제 가시 UI 확인: 도구 가용성/보안 정책 차단으로 미수행(D-08), HTTP/자동 테스트와 구분.

## 변경 파일
- deploy/Dockerfile.test, deploy/compose.test.yaml, .dockerignore.

## 발생 이슈
- RUN_ID 누락 초기 config exit1 → 프로세스 환경 변수 설정 후 정상 확인.
- playground 재생성 직후 HTTP startup race → 상태 확인 후 단일 재시도200.
- Windows DLL validation 실패는 Linux 우회 검증 환경으로 해소; Windows 자체 실행 실패는 여전히 과거 제한으로 기록.
- Node 다운로드는 공식 HTTPS x64 아카이브이며 고정 SHA256 검사는 미적용.

## 후속 TASK 참고사항
- compose 명령 전 고유 RUN_ID를 설정한다.
- Linux WebKit은 실제 Safari 최근 버전 검증의 대체가 아니다.
- 종료 시 이 Compose 프로젝트만 down, 호스트 증적 보존.

## 컨텍스트 핸드오프
### Builder Context
- what: Docker 이미지/서비스 및 Linux 검증·HTTP 진입점 구성.
- why: 승인된 Windows WebKit 차단 해소 경로.
- caution: 기존 리소스 보존, RUN_ID필수, x64 이미지.
- incomplete: 수동 UI 확인은 정책 차단으로 미수행.
### Verifier Context
- what: 최종 이미지 식별·Linux18/typecheck/HTTP200 독립 확인.
- why: 이미지와 실제 실행 증거 일치 확인.
- caution: 가시 UI를 통과로 주장하지 않는다.
- incomplete: vendor 최근2버전·보조공학 수동 검증 범위 밖.
