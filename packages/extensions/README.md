# Extensions

`0.x` 실험 API 패키지임. 하위 호환성 보장 대상이 아니며, 실제 npm 게시 전 조직·패키지명·권한·라이선스 확정 필요.

## 공개 진입점

```ts
import { createEditingExtension, createSafeEditorView } from "@uc-markdown-web/extensions";
```

`exports["."]`는 JavaScript `dist/index.js`와 타입 선언 `dist/index.d.ts`만 공개함.

`createEditingExtension()` registers fixed command names for extension consumers. `extensionCommands.setCursor()` intentionally uses position `1`; use the parameterized `setCursor(position)` export when a caller needs another cursor position.

The editing keymap handles list `Enter`, `Tab`, and `Shift-Tab` before the core base keymap. Non-list keys fall through to the core keymap.

Run root `pnpm build` before an extensions-only test when a fixture imports `@uc-markdown-web/core`: workspace package exports resolve through `core/dist`. Final validation uses root `pnpm build`, `pnpm typecheck`, and `pnpm test` in that order.

The jsdom fixture dispatches every list keydown. jsdom can lose the nested list DOM selection during `Shift-Tab` observer flushing, so that case also invokes the same extension keymap command after dispatch; browser key event selection remains a REQ6 check.

`createSafeEditorView()` serializes clipboard HTML with the same fixed DOM allowlist as the view. Unsupported schema entries reject mounting rather than falling back to unfiltered DOM. Raw Markdown atoms are text-only and noneditable. HTML paste keeps a single textblock inline, forces table-cell paste inline, forces code/raw paste through `text/plain`, and preserves the selection when safe HTML and plain text are both empty. External HTML drop is rejected so it cannot bypass normalization.

jsdom covers copy/cut serialization, paste boundaries, and editor-first teardown. Validate browser clipboard events, mutation-observer flushing, and native drag/drop before releasing a browser integration.

## 로컬 검증

```bash
pnpm build
node scripts/release/verify-pack.mjs
```
