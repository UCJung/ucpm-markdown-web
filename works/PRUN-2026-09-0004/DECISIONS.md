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

## D-02
> 시각: 2026-09-30 08:22:04 UTC
> 단계: codex
> 상태: RESOLVED

### 배경
Claude High3/Medium6/Low7 확인.

### 선택지
1. 입력/키보드와 View/paste 경계로 후속 TASK 2개를 분리해 실수정.
2. 결함 기록만 수행.

### 권고안
1번 — 입력손상·복사실패 및 연결된 데이터보존/생명주기 경계 해소.

### 확정값
TASK04로 High 입력규칙2건 및 목록키맵을 수정한다. TASK05로 High clipboard 및 관련 paste/raw/reentrant/destroy Medium을 수정한다. 같은 파일의 명백한 Low(header/ordered/unuseddep/nestedtable/drop/URL)도 포함한다. 위험도가 큰 core 재진입 정책 변경 대신 view 경계 방어를 우선한다. 교차검증 재실행 없음.

### 결정주체
auto

