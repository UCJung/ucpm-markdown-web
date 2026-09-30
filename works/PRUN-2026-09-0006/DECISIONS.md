# DECISIONS — PRUN-2026-09-0006

## D-04
> 시각: 2026-09-30T09:56:18Z
> 단계: builder
> 상태: RESOLVED

### 배경
pnpm의 esbuild 의존성 빌드 차단으로 일반 CLI 설치검증이 실패했다.

### 선택지
1. esbuild만 allowBuilds에 명시하고 정상 frozen 설치를 재검증한다.
2. 의존성 검증 우회 플래그로 실행한다.

### 권고안
1번 — 정상 설치 경로를 검증한다.

### 확정값
TASK-00에 pnpm-workspace.yaml 소유권을 추가한다. esbuild만 명시 허용하고 일반 frozen install·build·Playwright CLI PASS를 확인한다. VitePress 버전은 package 메타데이터로 확인하며 실제 사이트 빌드는 TASK-02에서 검증한다.

### 결정주체
auto

## D-01
> 시각: 2026-09-30T09:35:06Z
> 단계: specifier
> 상태: RESOLVED

### 배경
npm 조직·이름·권한·라이선스는 미확정이고 요청은 게시 준비다.

### 선택지
1. 임의 식별값·라이선스로 게시 가능 상태를 선언한다.
2. 기존 로컬 이름으로 비게시 pack/import를 검증하고 외부 결정값을 게시 차단 항목으로 유지한다.

### 권고안
2번 — 현재 권한과 준비 범위를 지킨다.

### 확정값
기존 로컬 패키지명을 유지한다. 라이선스를 임의 부여하지 않는다. 실제 npm 조직·이름·권한·라이선스 확인 전 게시 금지를 체크리스트와 제한사항에 명시한다. 로컬 pack/소비자 import는 실행한다.

### 결정주체
auto

## D-02
> 시각: 2026-09-30T09:35:06Z
> 단계: specifier
> 상태: RESOLVED

### 배경
접근성 점검 목표와 차단 기준이 필요하다.

### 선택지
1. WCAG 2.2 AA 목표, 자동 critical/serious 이슈 차단.
2. WCAG 2.1 AA 목표, critical만 차단.

### 권고안
1번 — specifier 권고.

### 확정값
WCAG 2.2 AA를 목표로 자동 점검 critical/serious를 차단한다. 키보드 사용을 검증하고 자동 검사만으로 전체 적합성을 주장하지 않는다. 수동·보조공학 미검증을 기록한다.

### 결정주체
auto

## D-03
> 시각: 2026-09-30T09:35:06Z
> 단계: specifier
> 상태: RESOLVED

### 배경
REQ의 Playwright AC와 운영가이드의 별도 E2E 미실행 단계 경계를 구분한다.

### 선택지
1. 구현 품질 AC에서 Playwright 실행, 병합 후 E2E 단계에서는 절차 작성.
2. 모든 브라우저 검증 생략.

### 권고안
1번 — REQ AC와 운영 절차를 함께 충족한다.

### 확정값
구현·검증 TASK에서 Playwright Chromium/Firefox/WebKit을 실제 실행한다. 실행 버전과 결과를 기록한다. 실제 Chrome/Edge/Firefox/Safari 최근 2개 주요 버전 지원 정책의 미검증 범위를 별도로 명시한다. 병합 후 별도 E2E 단계는 사용자 테스트 절차 작성으로 완료한다.

### 결정주체
auto
