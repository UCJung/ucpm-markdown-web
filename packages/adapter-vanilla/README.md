# @uc-markdown-web/adapter-vanilla

`0.x` 실험 API 패키지임. 하위 호환성 보장 대상이 아니며, 실제 npm 게시 전 조직·패키지명·권한·라이선스 확정 필요.

## 공개 진입점

```ts
import { createVanillaEditor } from "@uc-markdown-web/adapter-vanilla";
```

`createVanillaEditor({ element, markdown })`로 DOM 요소에 편집기를 연결하고 `getMarkdown()`과 `destroy()`를 사용함. `exports["."]`는 JavaScript `dist/index.js`와 타입 선언 `dist/index.d.ts`만 공개함.

## 로컬 검증

```bash
pnpm build
node scripts/release/verify-pack.mjs
```
