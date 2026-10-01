# PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

> Created: 2026-09-30
> Requirement: REQ-2026-09-0006
> Project: UCMARKDOWNWEB
> Tech Stack: TypeScript, pnpm workspace, Vite, Vitest, Playwright, axe-core, VitePress
> Language: ko
> Status: PLANNED

## 목표

공개 대상 라이브러리 5개의 재현 가능한 품질·브라우저·접근성 검증과 VitePress 소비자 문서, 비게시 패키지 설치 검증, 릴리스 절차를 완성한다.

## 설계

### 1. 아키텍처 방향

| 항목 | 결정 |
|------|------|
| 접근 방식 | 기존 pnpm workspace와 Vanilla playground 확장 |
| 구조 | 루트 품질 명령 → 패키지 검증; Playwright → playground 개발 서버; VitePress → `docs/`; pack → 임시 소비자 프로젝트 |
| 데이터 흐름 | 소스 → build/typecheck/Vitest → 엔진별 E2E·axe → 패키지 tarball → 소비자 import → 릴리스 기록 |
| 공개 후보 | `extension-api`, `core`, `markdown`, `extensions`, `adapter-vanilla` 5개; `playground`는 비공개 유지 |
| 게시 경계 | 실제 npm 게시·main 릴리스 제외; 조직·이름·권한·라이선스 확정 전 게시 차단 |

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | TASK-05: 유효 GFM 혼합 목록 보존을 위한 목록 스키마 호환 수정 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | 품질 실행 기록, 배포 메타데이터 검토표, 릴리스 체크리스트 추가 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| 품질 명령 | CLI | `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test`, `pnpm docs:build` | FR-01, FR-02, FR-03, FR-04 |
| playground | 브라우저 UI | `packages/playground/index.html`; 초기화·편집·조회·붙여넣기·종료 시나리오 | FR-02, FR-03 |
| VitePress | 정적 사이트 | `docs/index.md`, 설치·Vanilla·문법·제한 페이지 | FR-04 |
| 패키지 산출물 | npm tarball | 로컬 패키지명, `exports["."].import/types`, `files: ["dist"]` | FR-05 |
| 릴리스 기록 | Markdown | 검증 결과·릴리스 노트·게시/되돌림 체크리스트 | FR-05, FR-06 |

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | 재현성 | Node·pnpm·Playwright/브라우저 버전, 명령, 테스트 수, 엔진별 결과 기록; 실패 시 후보 차단 |
| NFR-02 | 호환성 | Chromium·Firefox·WebKit 결과와 Chrome·Edge·Firefox·Safari 최신/직전 메이저 실제 검증 범위 분리 |
| NFR-03 | 접근성 | WCAG 2.2 AA 목표; 자동 axe critical/serious 차단; 키보드 시나리오 실행; 수동·보조공학 미검증 기록 |
| NFR-04 | 배포 안전성 | 패키지·문서·릴리스 노트에 0.x 실험 API 경고; 외부 게시 결정값 확인 전 차단 |

### 5. 파일 소유와 실행 경계

| Task | 전용 쓰기 범위 | 공유 파일 책임 |
|------|----------------|----------------|
| TASK-00 | 품질 도구 의존성·루트 명령 | `package.json`, `pnpm-lock.yaml` 단독 소유 |
| TASK-01 | `tests/e2e/**`, `playwright.config.ts`, 필요한 `packages/playground/src/**`·`index.html` 결함 수정 | 루트 manifest·lock 변경 요청은 TASK-00 소유자에게 전달 |
| TASK-02 | `docs/.vitepress/**`, `docs/index.md`, `docs/guide/**`, `docs/[SPEC]_BROWSER_SUPPORT.md` | 루트 manifest·lock 수정 금지; TASK-00의 VitePress 의존성 사용 |
| TASK-03 | 공개 라이브러리 5개의 `package.json`, `README.md`, `scripts/release/**`, 루트 `README.md` | 루트 manifest·lock 수정 금지; `playground/package.json` 비공개 유지 |
| TASK-04 | `docs/[NOTE]_RELEASE_CANDIDATE.md`, `docs/[GUIDE]_RELEASE_CHECKLIST.md`, `docs/[NOTE]_RELEASE_NOTES_0X.md` | 결과 통합·최종 명령 실행; 선행 Task 파일 결함은 소유 Task에 수정 의뢰 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-00 | 공용 검증 도구·명령 설정 | 없음 | 1 | Must | FR-01, FR-02, FR-03, FR-04, NFR-01 | S |
| TASK-01 | 품질·브라우저·접근성 자동 검증 | TASK-00 | 2 | Must | FR-01, FR-02, FR-03, NFR-01, NFR-02, NFR-03 | M |
| TASK-02 | VitePress 소비자 문서 | TASK-00 | 2 | Must | FR-04, FR-03, NFR-02, NFR-03, NFR-04 | M |
| TASK-03 | 배포 메타데이터·tarball 소비 검증 | TASK-00 | 2 | Must | FR-05, NFR-01, NFR-04 | M |
| TASK-04 | 릴리스 증빙·노트·게시/되돌림 절차 | TASK-01, TASK-02, TASK-03, TASK-05 | 3 | Must | FR-01~FR-06, NFR-01~NFR-04 | M |
| TASK-05 | 유효 GFM 혼합 목록 import 결함 수정 | TASK-00 | 2 | Must | FR-01, FR-02, NFR-01 | M |
| TASK-06 | Docker Linux 자동 검증·로컬 playground 환경 | TASK-00, TASK-05, D-07 승인 | 2 | Must | FR-01, FR-02, FR-03, NFR-01, NFR-02 | M |

## Task 의존성 그래프

```text
TASK-00 ──┬──> TASK-01 ──┐
          ├──> TASK-02 ──┼──> TASK-04
          └──> TASK-03 ──┘
```

TASK-00 완료 → TASK-01·TASK-02·TASK-03 병렬 실행 → 발견 결함 TASK-05 보정 및 브라우저 재검증 → 네 작업 완료 후 TASK-04 실행.

재개: D-07 승인 → TASK-06 Docker 구축/검증 → TASK-01 재검증 → TASK-04 증빙 갱신 → 교차검증·dev 병합.

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | 브라우저 바이너리 설치 또는 실행 실패 | 중 | 높 | 완화: 설치 명령·버전·실패 원인 기록 후 세 엔진 재실행; 미통과 후보 차단 | AC-05 |
| R-02 | 브라우저 테스트에서 기존 편집 결함 발견 | 중 | 높 | 완화: playground 결함은 TASK-01 수정; 다른 패키지 결함은 orchestrator에 보고해 소유 범위를 지정한 보정 Task 후 재검증 | AC-04~08 |
| R-03 | `workspace:*` 의존성과 비공개 플래그가 tarball 소비를 막음 | 중 | 높 | 완화: pack 파일·manifest 검사 후 로컬 소비자 설치·import; 게시 차단값은 체크리스트에 유지 | AC-13~15 |
| R-04 | 실제 브라우저 버전과 Playwright 엔진 결과 혼동 | 중 | 높 | 회피: 실행 바이너리 버전과 실제 Chrome·Edge·Firefox·Safari 미검증 범위 병기 | AC-21~22 |
| R-05 | 자동 접근성 검사만으로 WCAG 적합성 과장 | 중 | 높 | 회피: 목표·자동 차단 기준·키보드 결과·수동/보조공학 미검증 분리 | AC-23~24 |
| R-06 | 외부 npm 식별값·권한·라이선스 미확정 | 높 | 높 | 회피: 실제 게시 중단 항목으로 유지; 임의 설정·publish 실행 금지 | D-01 |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| build/typecheck/Vitest | FR-01, NFR-01 | TASK-00, TASK-01, TASK-04 | AC-01~03, AC-19~20 | 전 패키지 명령·테스트 수·환경·결과 기록 |
| Playwright | FR-02, NFR-02 | TASK-00, TASK-01, TASK-02, TASK-04 | AC-04~06, AC-21~22 | 세 엔진 실행·실제 브라우저 미검증 범위 확인 |
| 접근성 | FR-03, NFR-03 | TASK-00, TASK-01, TASK-02, TASK-04 | AC-07~09, AC-23~24 | 키보드·axe 결과와 제한·차단 기준 확인 |
| VitePress | FR-04, NFR-04 | TASK-00, TASK-02, TASK-04 | AC-10~12, AC-25 | 문서 빌드·예제 API·경고 확인 |
| 배포 산출물 | FR-05, NFR-01, NFR-04 | TASK-03, TASK-04 | AC-13~15, AC-19~20, AC-26 | tarball 파일·manifest·격리 소비자 import 확인 |
| 릴리스 노트·체크리스트 | FR-06, NFR-04 | TASK-04 | AC-16~18, AC-25~26 | 버전·게시 차단·되돌림 절차 확인 |

---

## 자체 검증 체크리스트

- [x] 모든 FR이 최소 1개 Task에 매핑됨
- [x] 모든 NFR이 설계 또는 Task에 반영됨
- [x] Task 간 순환 의존 없음
- [x] 제약조건 내 실현 가능
- [x] 각 Task에 완료 조건이 있음
- [x] 리스크가 식별되고 대응 전략이 있음
- [x] 실행 순서가 의존관계와 일치함

---
