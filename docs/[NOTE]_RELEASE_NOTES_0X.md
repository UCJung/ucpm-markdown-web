# `0.x` 릴리스 후보 노트

| 항목 | 내용 |
|---|---|
| 설명 | 공개 전 `0.x` 실험 API 후보의 변경·제한 기록 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-10-01 |
| 버전 | 0.1.2 |

## 후보 상태: 자동 품질 `PASS`, 공개 게시 `CANDIDATE BLOCKED`

이 문서는 게시 완료 노트가 아님. Docker Linux 초기·최종 자동 품질은 통과했으나 npm 공개 메타데이터 미확정으로 `npm publish` 미수행.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 후보 식별 | 현재 후보 버전과 공개 범위 |
| 2 | 변경 요약 | 소비자·품질·문법 변경 |
| 3 | 실험 API 경고 | 호환성 약속 경계 |
| 4 | 알려진 제한 | 게시·브라우저·접근성 제한 |

## 1. 후보 식별

| 항목 | 값 |
|---|---|
| 후보 버전 | `0.0.0` |
| 공개 후보 | `extension-api`, `core`, `markdown`, `extensions`, `adapter-vanilla` |
| 게시 상태 | `private: true`; 공개 이름·태그·권한 미확정 |
| 후보 판정 | 자동 품질 `PASS`; 공개 게시·릴리스 승인 미완료 |

## 2. 변경 요약

- VitePress 소비자 문서에 설치·Vanilla 사용·문법·제한 제공
- 공개 후보 5개에 `dist` 진입점·타입 선언·tarball 소비 검증 추가
- playground에 Chromium·Firefox·WebKit 대상 E2E·axe·키보드 시나리오 추가
- 일반·checked·unchecked 항목이 섞인 유효 GFM 목록의 import·serialize·재import 보존 수정

## 3. 실험 API 경고

`0.x` API는 실험 단계. 하위 호환성·API 안정성·공개 배포 시점을 보장하지 않음. 소비자는 고정 버전과 자체 회귀 검증을 사용.

## 4. 알려진 제한

| 범위 | 상태 |
|---|---|
| 자동 E2E | Docker Linux에서 Chromium·Firefox·WebKit 18/18 PASS; Windows WebKit DLL validator 실패는 이력으로 유지 |
| 실제 브라우저 | Chrome·Edge·Firefox·Safari 최신·직전 메이저 미검증 |
| 접근성·수동 UI | 세 엔진 자동 axe·키보드 PASS; 로컬 표시·입력, 수동·보조공학 미수행 |
| Markdown | raw HTML은 실행·렌더링하지 않고 raw 원문 보존 |
| 배포 | npm 조직·공개 이름·권한·라이선스·repository 미확정; 게시 금지 |

세부 결과와 차단 해제 조건은 [릴리스 후보 증빙]([NOTE]_RELEASE_CANDIDATE.md), 기능 제한은 [제한사항](/guide/limitations)에서 확인.

## 참조 파일

- `README.md` — workspace·공개 후보 패키지 경계
- `works/PRUN-2026-09-0006/TASK-05_result.md` — 혼합 GFM 목록 수정·회귀
- `docs/[NOTE]_RELEASE_CANDIDATE.md` — 실행 증빙과 후보 판정
- `docs/guide/limitations.md` — 소비자 제한

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | `0.x` 후보 변경·실험 API 경고·차단 제한 기록 |
| 0.1.1 | 2026-10-01 | Docker Linux 자동 E2E PASS와 공개 게시 차단 유지 반영 |
| 0.1.2 | 2026-10-01 | 로그 제외 최종 이미지 독립 자동 검증 PASS 반영 |
