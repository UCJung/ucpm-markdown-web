# 설치

| 항목 | 내용 |
|---|---|
| 설명 | 현재 로컬 패키지명과 소비 전제 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

현재 패키지는 비게시·`private: true` 상태임. npm 레지스트리 설치 대신 동일 workspace 또는 검증용 로컬 산출물에서 소비 필요.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 패키지 관계 | Vanilla 어댑터와 내부 의존 패키지 |
| 2 | 공개 진입점 | 현재 `exports["."]` API 경계 |
| 3 | 설치 전 확인 | 공개 배포 전 차단 항목 |

## 1. 패키지 관계

| 패키지 | 현재 로컬 이름 | 역할 | Vanilla 소비 필요 여부 |
|---|---|---|---|
| adapter-vanilla | `@uc-markdown-web/adapter-vanilla` | DOM 생성·조회·종료 API | 직접 사용 |
| core | `@uc-markdown-web/core` | 편집기 코어 | 어댑터 의존성 |
| markdown | `@uc-markdown-web/markdown` | Markdown 변환 | 어댑터 의존성 |
| extensions | `@uc-markdown-web/extensions` | 편집 확장·안전 DOM | 어댑터 의존성 |
| extension-api | `@uc-markdown-web/extension-api` | 확장 계약 | 간접 의존성 |

Vanilla 소비자는 `@uc-markdown-web/adapter-vanilla`의 `.` 진입점을 import함. 어댑터의 workspace 의존성은 소비자가 별도 import할 필요 없음.

## 2. 공개 진입점

```ts
import { createVanillaEditor } from "@uc-markdown-web/adapter-vanilla";
```

현재 모든 라이브러리는 `dist/index.js`와 `dist/index.d.ts`를 `exports["."]` 및 `types`로 노출함. 예제는 [Vanilla 사용](/guide/vanilla)에서 확인 가능.

## 3. 설치 전 확인

| 확인 항목 | 현재 상태 | 소비자 조치 |
|---|---|---|
| npm 공개 패키지명·조직·권한 | 미확정 | 레지스트리 설치 명령 사용 보류 |
| 라이선스 | 미확정 | 외부 배포·재배포 보류 |
| 버전 안정성 | `0.0.0` 로컬 개발 버전 | `0.x` 실험 API 경고 반영 |
| 설치 경로 | workspace 또는 로컬 산출물 | 배포 후보의 별도 설치 검증 결과 확인 |

## 참조 파일

- `packages/adapter-vanilla/package.json` — 현재 패키지명·진입점·의존성
- `packages/adapter-vanilla/src/index.ts` — 공개 타입과 함수
- [Vanilla 사용](/guide/vanilla) — API 사용 예제
- [제한사항](/guide/limitations) — 배포 제한

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 비게시 설치 전제와 현재 공개 진입점 추가 |
