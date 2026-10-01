# 제한사항

| 항목 | 내용 |
|---|---|
| 설명 | 브라우저·접근성·기능·배포 제한 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-10-01 |
| 버전 | 0.1.3 |

현재 `0.x` API는 실험 단계임. 실제 브라우저 버전·수동 접근성·npm 공개 배포는 검증 또는 결정 완료 전 상태임.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 기능 제한 | raw 보존과 시각 편집 경계 |
| 2 | 브라우저 범위 | 지원 정책과 엔진 검증 구분 |
| 3 | 접근성 범위 | 목표·자동 차단·수동 미검증 |
| 4 | 배포 제한 | 외부 결정값과 게시 차단 |

## 1. 기능 제한

| 범위 | 제한 |
|---|---|
| raw Markdown | 텍스트 전용·비편집 상태로 표시 |
| 미지원 Markdown | 해당 블록 또는 컨테이너를 raw로 보존 |
| HTML | raw 원문 실행·렌더링 미제공 |
| 파괴 후 인스턴스 | `destroy()` 후 Markdown 조회·명령 재사용 불가 |

지원 문법의 상세 범위는 [지원 문법](/guide/syntax)에서 확인 가능.

## 2. 브라우저 범위

| 구분 | 정책 또는 근거 | 현재 상태 |
|---|---|---|
| 지원 정책 | Chrome·Edge·Firefox·Safari의 최신·직전 메이저 | 정책 정의 완료 |
| 자동 엔진 검증 | Docker Linux Playwright Chromium·Firefox·WebKit | 초기 이미지 `RUN_ID=20261001-121500-all` 18/18 PASS; 로그 제외 최종 이미지 `sha256:6a9493277a2b0230034133cedb637a2572d27dba88d600e9741d06786aaebfc1`, `RUN_ID=20261001-verifier-all18` 독립 18/18 PASS |
| 실제 버전 검증 | 각 브라우저 최신·직전 정식 릴리스 | 미실행, 엔진 결과만으로 보증 불가 |

Playwright Chromium은 Chrome·Edge 공통 엔진 근거이며, WebKit은 Safari 엔진 근거임. 승인된 Docker Linux 환경에서 세 엔진 자동 검증을 통과했다. Windows Playwright WebKit revision `2359` DLL validator 실패는 환경 이력으로 유지. Docker Linux WebKit은 실제 Safari 또는 Chrome·Edge·Firefox·Safari 최근 2개 버전 매트릭스를 보증하지 않음.

## 3. 접근성 범위

| 구분 | 기준 | 현재 상태 |
|---|---|---|
| 목표 | WCAG 2.2 AA | 목표 정의 완료 |
| 자동 점검 | axe critical·serious 이슈 발생 시 릴리스 후보 차단 | Docker 세 엔진에서 0건 |
| 키보드 | 핵심 시나리오 확인 | Docker 세 엔진에서 PASS |
| 수동·보조공학 | 스크린 리더·수동 적합성 평가 | 미수행 |

자동 점검과 키보드 검증만으로 WCAG 적합성 선언 불가. 수동·보조공학 검증 결과는 릴리스 후보에 별도 기록 필요.

## 4. 배포 제한

| 차단 항목 | 현재 상태 |
|---|---|
| npm 조직·공개 패키지명·배포 권한 | 미확정 |
| 라이선스 | 미확정 |
| 실제 npm publish | 수행 금지 |
| `0.x` 하위 호환성 | 보장하지 않음 |

## 참조 파일

- `docs/[SPEC]_BROWSER_SUPPORT.md` — 지원 정책과 검증 범위
- `packages/markdown/README.md` — raw 보존 계약
- `packages/adapter-vanilla/src/index.ts` — 종료 후 API 동작
- [설치](/guide/installation) — 비게시 소비 전제
- `docs/[NOTE]_RELEASE_CANDIDATE.md` — 후보 차단·실측 결과

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 기능·브라우저·접근성·배포 제한 추가 |
| 0.1.1 | 2026-09-30 | 엔진별 실측 결과와 WebKit 차단 상태 반영 |
| 0.1.2 | 2026-10-01 | Docker 세 엔진 자동 PASS와 수동 UI·보조공학 미수행 반영 |
| 0.1.3 | 2026-10-01 | 로그 제외 최종 이미지 독립 18/18 PASS 반영 |
