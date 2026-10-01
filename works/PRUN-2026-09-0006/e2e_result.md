# 사용자 테스트 절차 — PRUN-2026-09-0006

> REQ: REQ-2026-09-0006
> 날짜: 2026-10-01
> 단계 결과: PASS — 운영 가이드에 따른 사용자 테스트 절차 작성 완료
> 병합 후 별도 E2E 실행: 미수행 — docs/UCPM_PIPELINE_GUIDE.md §3.6
> 제품 품질 자동 E2E: 구현/검증 단계에서 Linux 세 엔진 18개 PASS
> 실제 로컬 가시 UI 수동 확인: 미수행 — 브라우저 도구 보안 정책 차단, 우회 없음

## 확인된 결과
- PR #6 dev 병합: https://github.com/UCJung/ucpm-markdown-web/pull/6.
- 병합 커밋: f93513a6c70b9f519dc12756b5ca5ea7ef73281e.
- build/typecheck/Vitest62 PASS, VitePress 빌드 PASS, 5개 tarball 설치/JS·TS import PASS.
- 최종 Docker 독립 검증: Chromium153.0.8010.12/Firefox155.0/WebKit26.6 각6개, 총18개 PASS.
- 최종 이미지: sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1, Ubuntu24.04.4 linux/amd64, Node24.17.0, pnpm11.25.0, Playwright1.63.0.
- 증적: playwright-report/20261001-verifier-all18/ 및 test-results/20261001-verifier-all18/.
- playground: uc-markdown-web-test-playground-1, 최종 검증 이미지, 127.0.0.1:4180→4173, HTTP200.
- 사용자 로컬 확인을 위해 playground 실행 유지. 일회성 test 컨테이너는 --rm 정리. 기존 서비스·이미지·호스트 보고서 보존.
- Claude 교차검증 PERFORMED, needs-attention, Critical0/High0/Medium6/Low7. Medium/Low는 계약대로 기록만 했으며 미해결이다.

## 사용자 로컬 확인
1. http://localhost:4180 에 접속한다.
2. 편집기 표시와 초기 문서를 확인하고 본문에 텍스트를 입력한다.
3. Markdown 조회에 입력 결과가 반영되는지 확인한다.
4. 키보드 이동·명령·undo/redo 및 허용/위험 paste 시나리오를 확인한다.
5. 혼합 GFM 예제를 불러와 일반/checked/unchecked 항목의 직렬화 결과를 확인한다.
6. 개발자 콘솔 오류 및 재생성 후 중복 DOM/구독 여부를 확인한다.

## 자동 검증 재현
1. docs/[GUIDE]_DEPLOYMENT.md의 Docker 구성·빌드 절차를 따른다.
2. 모든 Playwright 실행마다 새 RUN_ID를 지정한다. 이미 있는 호스트 보고서 디렉터리는 재사용하지 않는다.
3. WebKit 단독 실행과 전체 실행에 서로 다른 RUN_ID를 사용한다. 가이드 명령 블록을 그대로 같은 ID로 반복하면 이전 보고서가 덮일 수 있다는 교차검증 Medium 항목을 함께 확인한다.
4. 아래처럼 전체 검증을 실행하고 종료 코드와 보고서를 확인한다.

```powershell
$env:RUN_ID = (Get-Date -Format 'yyyyMMdd-HHmmss') + '-all'
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml run --rm test
```

## 사용자 종료
다른 Compose 프로젝트에는 적용하지 않는다. 호스트 보고서는 보존한다.

```powershell
docker compose -p uc-markdown-web-test -f deploy/compose.test.yaml down
```

Compose 설정 평가에는 RUN_ID 환경변수가 필요하다. 새 셸에서는 종료 명령 전에도 고유 RUN_ID를 설정한다.

## 한계와 후속 검토
- 자동 엔진 검증은 실제 Chrome·Edge·Firefox·Safari 최근2개 버전 및 수동·보조공학/WCAG 전체 적합성 검증을 대신하지 않는다.
- 로컬 가시 UI 수동 확인은 아직 완료하지 않았다. HTTP200을 표시·입력 수동 검증으로 취급하지 않는다.
- review_by_claude.md의 Medium6/Low7을 공개 게시 전 후속 검토한다. ordered+task 목록 보존 의심은 리뷰에서 실행 확인하지 않은 추정이며, 소비자 문서/게시 체크리스트 모순 및 RUN_ID 덮어쓰기 위험 등도 미해결이다.
- npm 조직·공개 이름·권한·라이선스·메타데이터 확정 전 게시 금지. 실제 npm publish·main 릴리스 미수행.
