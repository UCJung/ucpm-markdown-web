# Extensions

`createEditingExtension()` registers fixed command names for extension consumers. `extensionCommands.setCursor()` intentionally uses position `1`; use the parameterized `setCursor(position)` export when a caller needs another cursor position.

The editing keymap handles list `Enter`, `Tab`, and `Shift-Tab` before the core base keymap. Non-list keys fall through to the core keymap.

Run root `pnpm build` before an extensions-only test when a fixture imports `@uc-markdown-web/core`: workspace package exports resolve through `core/dist`. Final validation uses root `pnpm build`, `pnpm typecheck`, and `pnpm test` in that order.

The jsdom fixture dispatches every list keydown. jsdom can lose the nested list DOM selection during `Shift-Tab` observer flushing, so that case also invokes the same extension keymap command after dispatch; browser key event selection remains a REQ6 check.
