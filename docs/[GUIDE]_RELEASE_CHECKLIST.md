# 릴리스 게시·되돌림 체크리스트

| 항목 | 내용 |
|---|---|
| 설명 | 공개 npm `0.x` 후보의 승인·게시·사고 대응 절차 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-10-01 |
| 버전 | 0.1.2 |

## 현재 상태: 자동 품질 `PASS`, 공개 게시 `CANDIDATE BLOCKED`

현재 후보에서 `npm publish` 실행 금지. 초기·최종 자동 E2E는 통과했으나 외부 게시 결정값과 릴리스 승인 전 체크리스트 완료 금지.

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
| Chromium·Firefox·WebKit E2E | 초기 이미지 18/18 PASS; 최종 이미지 `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`, `RUN_ID=20261001-verifier-all18`, 독립 18/18 PASS | 자동 품질 PASS 기록 유지 |
| axe critical·serious | Docker 세 엔진 자동 결과 0건 | 독립 verifier 결과와 함께 기록 |
| 실제 브라우저·수동 UI·접근성 | 미검증·미수행 | 검증 범위·결과 또는 승인된 예외 기록 |
| npm 조직·공개 이름·권한 | 미확정 | 소유자 확인 |
| 라이선스·repository | 미확정 | 승인된 메타데이터 반영 |
| 버전·태그 | `0.0.0`; 공개 값 미확정 | 승인된 `0.x` 값 확정 |

- [x] 독립 Docker verifier 최종 결과를 [릴리스 후보 증빙]([NOTE]_RELEASE_CANDIDATE.md)에 반영
- [ ] 로컬 수동 표시·입력과 수동·보조공학 범위를 기록
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
- `docs/[GUIDE]_DEPLOYMENT.md` — Docker RUN_ID·결과 보관 절차

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 게시 차단·승인·검증·되돌림·후속 E2E 절차 추가 |
| 0.1.1 | 2026-10-01 | Docker 세 엔진 자동 PASS와 독립·수동 검증 대기 상태 반영 |
| 0.1.2 | 2026-10-01 | 로그 제외 최종 이미지 독립 18/18 PASS 반영 |
