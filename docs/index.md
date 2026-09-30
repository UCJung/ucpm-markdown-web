# UC Markdown Web

| 항목 | 내용 |
|---|---|
| 설명 | 프레임워크 중립 WYSIWYG Markdown 에디터 소비자 문서 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

`0.x`는 실험 API 버전임. 하위 호환성 보장 전 사용처에서 업그레이드 영향 검토 필요.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 시작 | 현재 배포 상태와 가이드 진입점 |
| 2 | 소비자 범위 | 설치·Vanilla·문법·제한 문서 연결 |

## 1. 시작

현재 workspace 패키지는 모두 `private: true` 상태임. npm 레지스트리 설치·공개 지원·라이선스는 확정 전 상태이며, 공개 패키지명·조직·배포 권한·라이선스 확정 전 게시 금지.

| 가이드 | 확인 항목 |
|---|---|
| [설치](/guide/installation) | 로컬 패키지명, 의존 관계, 비게시 전제 |
| [Vanilla 사용](/guide/vanilla) | 생성, Markdown 조회, 종료 API |
| [지원 문법](/guide/syntax) | 구조화 편집 문법과 raw 보존 경계 |
| [제한사항](/guide/limitations) | 브라우저·접근성·배포 제한 |

## 2. 소비자 범위

문서 예제는 현재 로컬 패키지명과 공개 진입점(`.`)을 기준으로 작성함. 실제 npm 설치 명령은 게시 식별값 확정 후 배포 문서에서 제공 필요.

## 참조 파일

- `packages/adapter-vanilla/src/index.ts` — Vanilla 공개 API
- `packages/markdown/README.md` — Markdown 변환 계약
- [지원 문법](/guide/syntax) — 소비자 문법 범위
- [제한사항](/guide/limitations) — 검증·배포 제한

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | VitePress 소비자 문서 진입점과 0.x 경고 추가 |
