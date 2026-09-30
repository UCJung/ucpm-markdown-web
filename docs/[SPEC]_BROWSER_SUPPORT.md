# 지원 브라우저 정책 (SPEC)

| 항목 | 내용 |
|---|---|
| 설명 | WYSIWYG Markdown 에디터의 지원 브라우저와 검증·접근성 기준 정의 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.1 |

MVP는 Chrome, Edge, Firefox, Safari의 최신 메이저 버전과 직전 메이저 버전을 지원 대상으로 관리함.

---

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 지원 대상 | 브라우저별 최신·직전 메이저 버전 기준 |
| 2 | 검증 기준 | Playwright 엔진·실제 브라우저·접근성 범위 |
| 3 | 갱신 기준 | 지원 버전과 자동화 매트릭스 갱신 절차 |
| 4 | 현재 검증 상태 | 이번 후보의 기록 경계 |

## 1. 지원 대상

| 브라우저 | 지원 범위 | 기준 |
|---|---|---|
| Chrome | 최신 메이저 버전, 직전 메이저 버전 | 공식 Stable 채널 |
| Edge | 최신 메이저 버전, 직전 메이저 버전 | 공식 Stable 채널 |
| Firefox | 최신 메이저 버전, 직전 메이저 버전 | 공식 Release 채널 |
| Safari | 최신 메이저 버전, 직전 메이저 버전 | Apple 정식 릴리스 |

지원 범위는 기능 릴리스 시점의 공식 배포 버전을 기준으로 기록함. 브라우저 메이저 버전 갱신 시 최신·직전 조합을 함께 갱신함.

## 2. 검증 기준

```mermaid
flowchart LR
  S[지원 브라우저 정책] --> E[Playwright 엔진 동작 검증]
  E --> M[실제 브라우저 버전 매트릭스]
  M --> R[릴리스 지원 근거]
```

| Playwright 엔진 | 주 검증 대상 | 제공 근거 | 실제 브라우저 검증 범위 |
|---|---|---|---|
| Chromium | Chrome | Blink 기반 입력·선택·붙여넣기 동작 | Chrome 최신·직전 버전 매트릭스 |
| Chromium | Edge | Chromium 기반 공통 동작 | Edge 최신·직전 Stable 버전 매트릭스 |
| Firefox | Firefox | Gecko 기반 입력·선택·붙여넣기 동작 | Firefox 최신·직전 Release 버전 매트릭스 |
| WebKit | Safari | WebKit 기반 동작 | Safari 최신·직전 정식 릴리스 매트릭스 |

Playwright Chromium과 WebKit 실행 결과는 각각 Chrome·Edge, Safari의 엔진 동작 근거로 사용함. Playwright 엔진 결과만으로 실제 Chrome·Edge·Firefox·Safari 최신·직전 버전 지원을 보증하지 않음.

| 접근성 구분 | 기준 | 릴리스 판정 |
|---|---|---|
| 목표 | WCAG 2.2 AA | 목표 충족 근거 별도 기록 |
| 자동 점검 | axe critical·serious | 이슈 발생 시 후보 차단 |
| 키보드 | 핵심 편집 시나리오 | 실행 결과 기록 |
| 수동·보조공학 | 스크린 리더·수동 평가 | 자동 결과와 분리해 미검증 또는 결과 기록 |

## 3. 갱신 기준

| 트리거 | 조치 | 기록 |
|---|---|---|
| 브라우저 메이저 버전 갱신 | 최신·직전 지원 조합 갱신 | 지원 버전 표 |
| MVP 기능 추가 | Chromium·Firefox·WebKit 시나리오 추가 | E2E 명세 |
| 릴리스 후보 생성 | 실제 브라우저 버전 매트릭스 실행 | 릴리스 검증 결과 |
| 지원 종료 결정 | 대상 버전과 영향 범위 갱신 | 변경 이력과 릴리스 노트 |

## 4. 현재 검증 상태

| 항목 | 상태 | 기록 위치 |
|---|---|---|
| Chromium E2E | Chromium `153.0.8010.12`, 독립 6/6 PASS | `tests/e2e/playground.spec.ts`, 릴리스 후보 증빙 |
| Firefox E2E | Firefox `155.0`, 독립 6/6 PASS; Chromium·Firefox 전체 12건 PASS, 1.1분; 이전 동시 HMR 전체 timeout은 무효 | `tests/e2e/playground.spec.ts`, 릴리스 후보 증빙 |
| WebKit E2E | Playwright WebKit revision `2359` 시작 FAIL; 실제 실행 브라우저 버전 확인 불가; `icuin77.dll`, `nghttp3.dll`, `jpeg62.dll`, `psl-5.dll` 탐색 실패 | 릴리스 후보 증빙 |
| axe·키보드 점검 | 완료 엔진에서 axe critical·serious 0건, 키보드 시나리오 PASS; WebKit 미실행 | `tests/e2e/playground.spec.ts`, 릴리스 후보 증빙 |
| 실제 Chrome·Edge·Firefox·Safari 최신·직전 버전 | 미실행 | 릴리스 후보 검증 결과 |

WebKit 실패, 실제 브라우저 버전, 수동·보조공학 검증 미실행으로 현재 후보 상태는 `CANDIDATE BLOCKED`. 엔진 결과만으로 실제 브라우저 지원을 보증하지 않음.

## 참조 파일

- `README.md` — workspace 패키지 경계와 검증 명령
- `works/PRUN-2026-09-0006/Requirement.md` — FR-02, FR-03, NFR-02, NFR-03
- `docs/guide/limitations.md` — 소비자 브라우저·접근성 제한
- `docs/[NOTE]_RELEASE_CANDIDATE.md` — 엔진별 실행 결과·후보 차단 조건
- [Playwright Browsers](https://playwright.dev/docs/browsers) — Playwright 브라우저 엔진 제공 범위

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 최근 2개 주요 버전 지원 정책과 Playwright·실제 브라우저 검증 기준 정의 |
| 0.1.0 | 2026-09-30 | WCAG 목표·자동 차단 기준·이번 실행 미검증 범위 추가 |
| 0.1.1 | 2026-09-30 | Chromium·Firefox 통과, WebKit 시작 실패와 후보 차단 상태 반영 |
