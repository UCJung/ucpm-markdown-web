/** @vitest-environment jsdom */
import { createEditor } from "@uc-markdown-web/core";
import { createMarkdownSchema } from "@uc-markdown-web/markdown";
import { describe, expect, it } from "vitest";
import { createEditingExtension } from "./index.js";
import { createSafeEditorView } from "./safe-view.js";

describe("safe editor view", () => {
  it("renders unsafe Markdown links as non-navigating spans while preserving their model value", () => {
    const schema = createMarkdownSchema();
    const document = schema.node("doc", null, [schema.node("paragraph", null, [
      schema.text("unsafe", [schema.mark("link", { href: "j&#x61;vascript:alert(1)", title: null })])
    ])]);
    const editor = createEditor({ schema, doc: document, extensions: [createEditingExtension()] });
    const mount = window.document.createElement("div");
    const safeView = createSafeEditorView({ editor, mount });

    expect(editor.getState().doc.firstChild?.firstChild?.marks[0]?.attrs.href).toBe("j&#x61;vascript:alert(1)");
    expect(safeView.view.dom.querySelector("a")).toBeNull();
    expect(safeView.view.dom.querySelector("span[data-unsafe-link='true']")?.textContent).toBe("unsafe");

    safeView.destroy();
    editor.destroy();
  });

  it("renders raw source as text without creating executable DOM", () => {
    const schema = createMarkdownSchema();
    const source = "<script>globalThis.executed = true</script>";
    const document = schema.node("doc", null, [schema.node("raw_markdown_block", { source })]);
    const editor = createEditor({ schema, doc: document, extensions: [createEditingExtension()] });
    const mount = window.document.createElement("div");
    const safeView = createSafeEditorView({ editor, mount });

    expect(safeView.view.dom.querySelector("script")).toBeNull();
    expect(safeView.view.dom.querySelector("pre[data-raw-markdown='true']")?.textContent).toBe(source);

    safeView.destroy();
    editor.destroy();
  });
});
