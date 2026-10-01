# TASK-06: Docker Linux 자동 검증·로컬 playground 환경

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요
| 항목 | 내용 |
|---|---|
| 목적 | 승인된 Docker 환경에서 WebKit 차단 해소 및 재현 가능한 3엔진 검증 |
| 매핑 요구사항 | FR-01, FR-02, FR-03, NFR-01, NFR-02 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00, TASK-05 완료; D-07 사용자 승인 |
| Phase | Phase 2 |

## Scope
1. 배포 가이드 계약 확인 → Dockerfile/ignore/Compose 작성 → 승인된 test·playground 서비스.
2. 기존 컨테이너·4180 충돌 재확인 → 이미지 빌드 및 가이드 검증 명령 실행 → 명령별 종료 코드/환경/이미지 ID 증빙.
3. WebKit 및 전체 3엔진 실행 → 실행별 결과 별도 보존 → 실패 원인 수정 후 재검증.
4. 로컬 playground 기동 → HTTP200 확인 → orchestrator 실제 브라우저 확인 인계.

## Files
| Path | Action | Description |
|---|---|---|
| deploy/Dockerfile.test | CREATE | Playwright 이미지·Node24·pnpm11.25.0·frozen install/build |
| deploy/compose.test.yaml | CREATE | test 및 loopback4180 playground |
| .dockerignore | CREATE | 호스트 의존성/생성물/불필요 민감 설정 제외 |

## Acceptance Criteria
- [x] 가이드에 지정한 이미지·버전·서비스·포트로 구성한다.
- [x] Linux build/typecheck/Vitest/docsbuild 및 WebKit/3엔진 테스트가 통과한다.
- [x] 기존 컨테이너·포트·볼륨을 변경하지 않는다.
- [x] 실패/성공 실행 결과를 별도 보존하고 실제 이미지 ID/명령/환경을 기록한다.
- [x] HTTP200 및 실제 브라우저 확인 진입점을 제공한다.
- [x] 이미지에 호스트 node_modules·비밀 설정을 포함하지 않는다.

## Verify
docs/[GUIDE]_DEPLOYMENT.md §3의 명령을 순서대로 실행한다. 실제 브라우저 확인은 orchestrator 인계 후 수행한다.
