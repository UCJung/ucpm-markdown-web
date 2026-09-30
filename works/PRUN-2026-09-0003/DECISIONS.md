# DECISIONS — PRUN-2026-09-0003

## D-01
> 시각: 2026-09-30T06:48:07Z
> 단계: planner
> 상태: RESOLVED

### 배경
미지원 블록 원문 보존의 식별·경계 계약 필요.

### 선택지
1. parser 위치 기반 HTML·math·directive·unknown mdast block source 보존, 보장 패턴 명시.
2. 임의 문자열 정규식 탐지만 사용.

### 권고안
1번 — 코드 fence 내부 오인식을 줄이고 테스트 가능한 원문 경계 확보.

### 확정값
raw 내부 source 문자열 보존, 블록 간 줄바꿈 정규화. 미식별 임의 문법을 모두 자동 분류한다고 보장하지 않음. 링크 href 의미는 보존하고 안전한 클릭 동작은 후속 렌더 계층에 적용.

### 결정주체
auto

## D-02
> 시각: 2026-09-30 07:16:25 UTC
> 단계: codex
> 상태: RESOLVED

### 배경
교차검증 High 2건과 관련 parser 경계 Medium 4건 확인.

### 선택지
1. 후속 TASK에서 재현·실수정·독립 검증.
2. 미수정 상태로 기록 후 진행.

### 권고안
1번 — 텍스트 유실과 지원 입력 import 실패 방지.

### 확정값
TASK-03에서 High 및 같은 경로 Medium을 수정한다. 컨테이너 source 무손실을 위한 전체 raw 강등은 문서화한다. 미지원 inline은 블록 raw fallback으로 보존하며 시각 편집 기능은 추가하지 않는다. table cell 단일 paragraph 계약도 맞춘다. 교차검증 재실행 없음.

### 결정주체
auto
