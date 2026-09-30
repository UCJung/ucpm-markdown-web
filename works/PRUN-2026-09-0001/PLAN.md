# PRUN-2026-09-0001: WYSIWYG Markdown 에디터 모노레포 기반 구성

> Created: 2026-09-30
> Requirement: REQ-2026-09-0001
> Project: UCMARKDOWNWEB
> Tech Stack: pnpm workspace, TypeScript, Vite library mode, Vitest
> Language: ko
> Status: PLANNED

## 목표

`pnpm install`과 workspace 전체 `build`·`typecheck`·`test` 명령이 실행되는 6개 패키지 기반을 구성한다. 패키지 공개 진입점·의존 방향·브라우저 지원 정책을 문서화한다.

## 설계

### 1. 아키텍처 방향

- **접근 방식**: 신규 구축.
- **구조**: `extension-api` → `core` → `markdown` → `adapter-vanilla`/`extensions` → `playground` 방향의 pnpm workspace. 실제 의존은 아래 인터페이스 표에 따른다.
- **데이터 흐름**: 패키지 `src/index.ts` → Vite 라이브러리 빌드 → `dist` 공개 진입점. 편집·Markdown 변환 런타임은 후속 REQ에서 구현한다.
- **패키지명**: 로컬 workspace 식별용 `@uc-markdown-web/*`를 사용하고 `private: true`로 유지한다. 공개 npm 최종 이름과 배포 설정은 REQ-2026-09-0006에서 확정한다.

### 2. 데이터 설계

| 항목 | 내용 |
|------|------|
| 스키마 변경 | 없음 |
| 마이그레이션 필요 | 없음 |
| 변경 내용 | workspace 메타데이터와 패키지 빌드 산출물만 추가 |

### 3. 인터페이스 설계

| 인터페이스 | 방식 | 엔드포인트/형식 | 관련 FR |
|-----------|------|---------------|--------|
| 패키지 공개 진입점 | 파일 | 각 패키지 `src/index.ts`, `package.json`의 `exports`/`types` | FR-02 |
| workspace 명령 | CLI | `pnpm build`, `pnpm typecheck`, `pnpm test` | FR-01 |
| 패키지 의존 방향 | workspace 참조 | `core`→`extension-api`; `markdown`→`core`; `adapter-vanilla`→`core`,`markdown`; `extensions`→`core`,`markdown`,`extension-api`; `playground`→소비 패키지 | FR-02 |
| 브라우저 지원 정책 | 문서 | `docs/[SPEC]_BROWSER_SUPPORT.md` | FR-03 |

`extension-api`는 프레임워크 의존성 없는 기초 패키지로 둔다. `core`와 `markdown`의 순환 참조를 만들지 않는다. `playground`는 앱 소비자로 두고 `private: true`를 유지한다. 여섯 패키지의 초기 진입점은 런타임 편집 기능을 노출하지 않는 최소 export로 한정한다.

### 4. NFR 대응 설계

| NFR ID | 요구사항 | 대응 방안 |
|--------|---------|----------|
| NFR-01 | Chrome·Edge·Firefox·Safari 최근 2개 주요 버전 지원 기준 | 지원 범위와 갱신 기준을 문서화하고 Playwright Chromium·Firefox·WebKit 검증의 엔진별 대응 및 한계를 명시. 실제 버전별 자동화 매트릭스는 REQ-2026-09-0006에 연결 |

## 작업 목록

| Task ID | 제목 | 의존관계 | Phase | 우선순위 | 매핑 FR/NFR | 예상 규모 |
|---------|------|---------|-------|---------|------------|----------|
| TASK-01 | workspace와 6개 패키지 스캐폴드 구성 | 없음 | 1 | Must | FR-01, FR-02 | M |
| TASK-02 | 패키지 경계·브라우저 정책 문서화 및 실행 검증 | TASK-01 | 2 | Must | FR-01, FR-02, FR-03, NFR-01 | S |

## Task 의존성 그래프

```text
TASK-01 → TASK-02
```

## 리스크 및 대응

| # | 리스크 | 발생 가능성 | 영향도 | 대응 전략 | 비고 |
|---|--------|-----------|-------|----------|------|
| R-01 | 공개 npm 패키지명 미확정 | 중 | 중 | 완화: 초기 전 패키지 `private: true`; REQ-0006에서 이름·배포 소유권 확정 | 로컬 이름은 배포 계약 아님 |
| R-02 | Playwright 엔진 테스트와 특정 브라우저 최근 2개 버전 지원 범위 불일치 | 높 | 중 | 완화: 정책·엔진 매핑·검증 한계 명시; 버전별 매트릭스는 REQ-0006에서 확정 | Edge/Safari 실브라우저 보증과 구분 |
| R-03 | 빈 패키지 빌드 또는 테스트 명령이 무의미하게 통과 | 중 | 중 | 완화: `exports` 소비 및 모듈 import 확인용 smoke test를 추가하고 빈 테스트 성공 플래그에만 의존하지 않음 | 실제 편집 기능 테스트는 후속 REQ |

---

## 추적성 매트릭스

| 원본 요청 | FR/NFR | Task | 인수 기준 | 검증 방법 |
|----------|--------|------|----------|----------|
| TODO REQ 순차 실행: 기반 구성 | FR-01 | TASK-01, TASK-02 | 설치 및 전체 build·typecheck·test 실행 | `pnpm install`, workspace 명령 |
| REQ-0001 패키지 경계 | FR-02 | TASK-01, TASK-02 | 6개 진입점과 책임·허용 의존성 확인 | `package.json`·문서 확인, smoke test |
| REQ-0001 브라우저 정책 | FR-03 | TASK-02 | 네 브라우저 최근 2개 주요 버전 명시 | 정책 문서 확인 |
| REQ-0001 호환성 기준 | NFR-01 | TASK-02 | 정책과 향후 검증 범위 연결 | 정책 문서·REQ-0006 참조 확인 |

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
