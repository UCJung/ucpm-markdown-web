# 릴리스 게시·되돌림 체크리스트

| 항목 | 내용 |
|---|---|
| 설명 | 공개 npm `0.x` 후보의 승인·게시·사고 대응 절차 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

## 현재 상태: `CANDIDATE BLOCKED`

현재 후보에서 `npm publish` 실행 금지. WebKit E2E와 외부 게시 결정값을 완료한 뒤 체크리스트 재개.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 승인 게이트 | 게시 전 필수 차단 조건 |
| 2 | 게시 전 검증 | 명령·결과 기록 절차 |
| 3 | 게시 실행·확인 | 승인 후 npm·Git 태그 절차 |
| 4 | 중단·되돌림 | 사고 대응과 소비자 안내 |
| 5 | 병합 후 E2E | 사용자 테스트 결과 기록 경계 |

## 1. 승인 게이트

| 게이트 | 현재 상태 | 게시 조건 |
|---|---|---|
| Chromium·Firefox·WebKit E2E | Playwright WebKit revision `2359` 시작 FAIL; 실제 실행 브라우저 버전 확인 불가 | WebKit 실행 가능한 환경에서 세 엔진 PASS |
| axe critical·serious | WebKit 미실행 | 세 엔진 결과 0건 |
| 실제 브라우저·수동 접근성 | 미검증 | 검증 범위·결과 승인 |
| npm 조직·공개 이름·권한 | 미확정 | 소유자 확인 |
| 라이선스·repository | 미확정 | 승인된 메타데이터 반영 |
| 버전·태그 | `0.0.0`; 공개 값 미확정 | 승인된 `0.x` 값 확정 |

- [ ] [릴리스 후보 증빙]([NOTE]_RELEASE_CANDIDATE.md)의 모든 차단 해제 조건 완료
- [ ] npm 로그인 계정·조직·패키지명·게시 권한 확인
- [ ] 라이선스·repository·공개 버전·dist-tag 승인
- [ ] 후보 패키지 `private` 설정을 승인된 공개 설정으로 변경

## 2. 게시 전 검증

| 순서 | 명령 또는 확인 | 기록 |
|---|---|---|
| 1 | `pnpm build` | build 결과 |
| 2 | `pnpm typecheck` | typecheck 결과 |
| 3 | `pnpm test` | Vitest 수와 결과 |
| 4 | `pnpm exec playwright test` | Chromium·Firefox·WebKit·axe 결과 |
| 5 | `pnpm docs:build` | VitePress 산출 결과 |
| 6 | `node scripts/release/verify-pack.mjs` | tarball 설치·JS·TypeScript import 결과 |
| 7 | 실제 브라우저·수동 접근성 절차 | 버전·도구·발견 사항 |

- [ ] 각 명령 PASS 기록
- [ ] axe `critical`·`serious` 0건 확인
- [ ] WebKit·실제 브라우저·수동 접근성 미검증 항목 없음 또는 승인된 예외 기록
- [ ] `docs/[NOTE]_RELEASE_CANDIDATE.md` 상태를 승인 가능한 결과로 갱신

## 3. 게시 실행·확인

승인 게이트 통과 후 실행.

| 순서 | 행동 | 확인 |
|---|---|---|
| 1 | 승인된 패키지별 `npm publish --access public --tag <approved-tag>` 실행 | npm 패키지·버전·tarball 확인 |
| 2 | 격리 소비자에서 공개 패키지 설치·JS·TypeScript import 실행 | registry 소비 확인 |
| 3 | 승인된 Git 태그 생성·원격 확인 | 태그와 게시 버전 일치 |
| 4 | 릴리스 노트·지원 범위 게시 | `0.x` 실험 API 경고 유지 |

- [ ] npm 레지스트리 패키지·버전·dist-tag 확인
- [ ] 공개 tarball 파일·exports·types 확인
- [ ] Git 태그·릴리스 노트·게시 버전 일치
- [ ] 게시 시각·실행자·검증 결과 기록

## 4. 중단·되돌림

| 트리거 | 행동 | 기록·안내 |
|---|---|---|
| 게시 전 검증 FAIL | 게시 중단 | 실패 명령·원인·재개 조건 |
| 보안·데이터 손실·설치 불가 | 배포 중단, 영향 버전 식별 | 이슈·릴리스 노트·소비자 공지 |
| 게시 후 결함 | `npm deprecate <package>@<version> "<reason>"` 실행 | deprecate 사유·대체 버전 |
| 수정 가능 결함 | 후속 수정 `0.x` 버전 게시 | 변경·마이그레이션·고정 버전 안내 |

- [ ] 영향 패키지·버전·사용자 영향 확인
- [ ] 신규 설치 중단을 위한 deprecate 실행 여부 결정
- [ ] 후속 수정 버전 또는 안전한 대체 버전 제공
- [ ] README·릴리스 노트·이슈에 소비자 조치 안내
- [ ] 원인·재발 방지·검증 결과 기록

## 5. 병합 후 E2E

병합 후 별도 E2E 단계에서 사용자 테스트 절차·결과를 `works/PRUN-2026-09-0006/e2e_result.md`에 작성. 이 기록은 자동 품질 E2E와 분리.

## 참조 파일

- `docs/[NOTE]_RELEASE_CANDIDATE.md` — 현재 증빙·차단 해제 조건
- `docs/[NOTE]_RELEASE_NOTES_0X.md` — `0.x` 경고·제한
- `docs/[SPEC]_BROWSER_SUPPORT.md` — 지원·검증 경계
- `works/PRUN-2026-09-0006/DECISIONS.md` — D-01, D-06

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 게시 차단·승인·검증·되돌림·후속 E2E 절차 추가 |
