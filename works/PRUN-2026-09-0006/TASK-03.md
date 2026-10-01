# TASK-03: 배포 메타데이터·tarball 소비 검증

## WORK
PRUN-2026-09-0006: 공개 npm 0.x 후보 품질·문서·배포 준비

## Task 개요

| 항목 | 내용 |
|------|------|
| 목적 | 공개 후보 5개 패키지의 게시 전 구성과 격리 소비자 설치를 검증 |
| 매핑 요구사항 | FR-05, NFR-01, NFR-04 |
| 우선순위 | Must |
| 예상 규모 | M |
| 의존관계 | TASK-00 완료 후 |
| Phase | Phase 2 |

## Scope

1. 5개 package manifest 확인 → `version`, `exports`, `types`, `files`, 내부/외부 의존성, `private`, `license`, `repository`, 공개 설정 점검 → 항목별 상태.
2. 확정 가능한 메타데이터만 보완 → 기존 로컬 이름·0.x 경고·공개 진입점 일치 → 게시 전 후보 manifest.
3. 미확정 외부 값 확인 → npm 조직·패키지명·권한·라이선스는 미확정으로 유지 → 게시 차단 목록.
4. 공개 후보 순서대로 로컬 pack → tarball의 파일 목록·manifest·내부 의존성 해석 검사 → 산출물 증빙.
5. 별도 임시 소비자 프로젝트 생성 → 다섯 tarball 설치 후 JavaScript와 TypeScript 공개 진입점 import 확인 → 설치 결과.
6. `pnpm-workspace.yaml`과 root 설정 변경 필요 발견 → TASK-00 소유자에게 변경 요청 → 파일 충돌 방지.

## Files

| Path | Action | Description |
|------|--------|-------------|
| `packages/extension-api/package.json` | MODIFY | 공개 후보 메타데이터·진입점 검토 |
| `packages/core/package.json` | MODIFY | 공개 후보 메타데이터·진입점 검토 |
| `packages/markdown/package.json` | MODIFY | 공개 후보 메타데이터·진입점 검토 |
| `packages/extensions/package.json` | MODIFY | 공개 후보 메타데이터·진입점 검토 |
| `packages/adapter-vanilla/package.json` | MODIFY | 공개 후보 메타데이터·진입점 검토 |
| `packages/*/README.md` | CREATE/MODIFY IF NEEDED | 패키지별 0.x 실험 API 경고; playground 제외 |
| `scripts/release/*` | CREATE | 비게시 pack·격리 소비자 import 재현 스크립트 |
| `README.md` | MODIFY | 현재 private 상태와 게시 전 차단 조건 반영 |

## Acceptance Criteria

- [x] 다섯 패키지의 게시 포함 파일과 JS·타입 진입점을 확인한다.
- [x] 버전·의존성·라이선스·저장소·공개 설정 상태를 패키지별로 기록한다.
- [x] 다섯 로컬 tarball을 격리 소비자에 설치하고 JS·TS import를 확인한다.
- [x] 패키지 README 또는 설명에서 `0.x` 실험 API 경고를 확인한다.
- [x] npm 조직·이름·권한·라이선스 미확정을 게시 차단 조건으로 전달한다.
- [x] 실제 npm publish를 실행하지 않는다.

## Verify

```bash
pnpm build
node scripts/release/verify-pack.mjs
```

---
