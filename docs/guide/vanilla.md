# Vanilla 사용

| 항목 | 내용 |
|---|---|
| 설명 | Vanilla 어댑터 생성·조회·종료 흐름 |
| 생성일 | 2026-09-30 |
| 수정일 | 2026-09-30 |
| 버전 | 0.1.0 |

`createVanillaEditor()`에 대상 `HTMLElement`와 초기 Markdown을 전달하면 편집기를 생성함. 사용 종료 시 `destroy()` 호출 필요.

## 목차

| 번호 | 제목 | 설명 |
|---|---|---|
| 1 | 생성과 조회 | 현재 공개 API 사용 예제 |
| 2 | 변경 구독 | 문서 변경 이벤트 처리 |
| 3 | 종료 | 구독 해제와 DOM 정리 |

## 1. 생성과 조회

```ts
import { createVanillaEditor } from "@uc-markdown-web/adapter-vanilla";

const element = document.querySelector<HTMLElement>("#editor");

if (element === null) {
  throw new Error("#editor element is required.");
}

const editor = createVanillaEditor({
  element,
  markdown: "# 시작\n\n초기 Markdown입니다."
});

const markdown = editor.getMarkdown();
```

`element`는 필수 `HTMLElement`임. `markdown` 생략 시 빈 문서로 생성함. `getMarkdown()`은 현재 문서를 Markdown 문자열로 반환함.

## 2. 변경 구독

```ts
const unsubscribe = editor.subscribe((markdown) => {
  console.log(markdown);
});
```

`subscribe()`는 문서 변경 시에만 호출함. 선택 이동만으로는 호출하지 않음. 반환된 함수는 해당 구독만 해제함.

## 3. 종료

```ts
unsubscribe();
editor.destroy();
```

`destroy()`는 편집 DOM·내부 편집기·남은 구독을 정리함. 종료 후 `getMarkdown()`과 명령 호출은 오류를 발생하므로 인스턴스 재사용 금지.

## 참조 파일

- `packages/adapter-vanilla/src/index.ts` — `VanillaEditorConfiguration`, `VanillaEditor`, `createVanillaEditor()`
- `packages/adapter-vanilla/src/index.test.ts` — 생성·구독·종료 동작 검증
- [설치](/guide/installation) — 패키지 소비 전제
- [지원 문법](/guide/syntax) — Markdown 처리 범위

## 문서 갱신 이력

| 버전 | 수정일 | 주요 변경사항 |
|---|---|---|
| 0.1.0 | 2026-09-30 | 현재 Vanilla 공개 API 예제 추가 |
