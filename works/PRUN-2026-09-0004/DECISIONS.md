# DECISIONS — PRUN-2026-09-0004

## D-01
> 시각: 2026-09-30 07:32:50 UTC
> 단계: planner
> 상태: RESOLVED

### 배경
DOM view 책임 위치와 위험 링크 표시·HTML 정규화 정책 필요.

### 선택지
1. extensions 내부 interaction/view + allowlist HTML/URL 정책, REQ5 공개 adapter 연결.
2. 이번 REQ에서 adapter 공개 mount를 선구현.

### 권고안
1번 — core DOM 비의존과 REQ별 범위 유지.

### 확정값
extensions 내부 View를 구현한다. raw는 텍스트 node, 위험 href는 비탐색 span. http/https/mailto/상대경로/fragment만 허용하고 protocol-relative와 제어문자/공백 난독화 scheme을 거부한다. HTML 제목/문단/목록/표/코드 및 기본 inline 서식만 변환한다. 명세 ASM-03은 이 정책으로 해소한다. jsdom 상호작용 테스트를 실행하고 실제 브라우저 차이는 REQ6 검증 범위에 인계한다.

### 결정주체
auto

