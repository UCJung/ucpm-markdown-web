# 지원 브라우저 정책 (SPEC)

| 항목 | 내용 |
|---|---|
| 설명 | WYSIWYG Markdown 에디터의 지원 브라우저와 검증 기준 정의 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

MVP는 Chrome, Edge, Firefox, Safari의 최신 메이저 버전과 직전 메이저 버전을 지원 대상으로 관리함.

---

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 지원 대상 | 브라우저별 최신·직전 메이저 버전 기준 |
| 2 | 검증 기준 | Playwright 엔진과 실제 브라우저 검증 범위 |
| 3 | 갱신 기준 | 지원 버전과 자동화 매트릭스 갱신 절차 |
| 4 | 후속 작업 | REQ-2026-09-0006 연결 범위 |

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

Playwright Chromium과 WebKit 실행 결과는 각각 Chrome·Edge, Safari의 엔진 동작 근거로 사용함. Edge와 Safari의 정식 릴리스 버전 지원 근거는 실제 브라우저 버전 매트릭스로 별도 관리함.

## 3. 갱신 기준

| 트리거 | 조치 | 기록 |
|---|---|---|
| 브라우저 메이저 버전 갱신 | 최신·직전 지원 조합 갱신 | 지원 버전 표 |
| MVP 기능 추가 | Chromium·Firefox·WebKit 시나리오 추가 | E2E 명세 |
| 릴리스 후보 생성 | 실제 브라우저 버전 매트릭스 실행 | 릴리스 검증 결과 |
| 지원 종료 결정 | 대상 버전과 영향 범위 갱신 | 변경 이력과 릴리스 노트 |

## 4. 후속 작업

`REQ-2026-09-0006`에서 Playwright 브라우저 설치, 엔진별 E2E 시나리오, 실제 브라우저 버전 매트릭스와 릴리스 검증 결과를 구현함.

## 참조 파일

- `README.md` — workspace 패키지 경계와 검증 명령
- `docs/[SPEC]_TECH_STACK.md` — MVP 기술 스택과 지원 범위
- `works/PRUN-2026-09-0001/Requirement.md` — FR-03, NFR-01
- [Playwright Browsers](https://playwright.dev/docs/browsers) — Playwright 브라우저 엔진 제공 범위

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 최근 2개 주요 버전 지원 정책과 Playwright·실제 브라우저 검증 기준 정의 |
