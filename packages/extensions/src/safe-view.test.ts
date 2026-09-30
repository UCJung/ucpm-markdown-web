/** @vitest-environment jsdom */
import { createEditor } from "@uc-markdown-web/core";
import { createMarkdownSchema } from "@uc-markdown-web/markdown";
import { AllSelection } from "prosemirror-state";
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

  it("serializes copy and cut through the safe DOM allowlist", () => {
    for (const type of ["copy", "cut"] as const) {
      const schema = createMarkdownSchema();
      const document = schema.node("doc", null, [
        schema.node("paragraph", null, schema.text("unsafe", [schema.mark("link", { href: "javascript:alert(1)", title: null })])),
        schema.node("raw_markdown_block", { source: "<script>globalThis.executed = true</script>" })
      ]);
      const editor = createEditor({ schema, doc: document, extensions: [createEditingExtension()] });
      const mount = window.document.createElement("div");
      const safeView = createSafeEditorView({ editor, mount });
      const clipboard = new Map<string, string>();
      const event = new Event(type, { bubbles: true, cancelable: true }) as ClipboardEvent;
      Object.defineProperty(event, "clipboardData", {
        value: { clearData: () => clipboard.clear(), setData: (format: string, value: string) => clipboard.set(format, value) }
      });
      safeView.view.dispatch(safeView.view.state.tr.setSelection(new AllSelection(safeView.view.state.doc)));

      expect(() => safeView.view.dom.dispatchEvent(event)).not.toThrow();
      expect(clipboard.get("text/html")).not.toContain("<script");
      expect(clipboard.get("text/html")).not.toContain("javascript:");

      safeView.destroy();
      editor.destroy();
    }
  });

  it("keeps raw atom DOM noneditable and defers a reentrant view dispatch", async () => {
    const schema = createMarkdownSchema();
    const document = schema.node("doc", null, [schema.node("raw_markdown_block", { source: "raw source" })]);
    const editor = createEditor({ schema, doc: document, extensions: [createEditingExtension()] });
    const mount = window.document.createElement("div");
    const safeView = createSafeEditorView({ editor, mount });
    const raw = safeView.view.dom.querySelector("pre[data-raw-markdown='true']") as HTMLElement;

    expect(raw.contentEditable).toBe("false");
    raw.textContent = "untracked DOM text";
    expect(editor.getState().doc.firstChild?.attrs.source).toBe("raw source");

    const textEditor = createEditor({ schema, extensions: [createEditingExtension()] });
    const textMount = window.document.createElement("div");
    const textView = createSafeEditorView({ editor: textEditor, mount: textMount });
    textEditor.subscribe(() => {
      if (textEditor.getState().doc.textContent === "A") {
        textView.view.dispatch(textView.view.state.tr.insertText("B", 2));
      }
    });
    textEditor.dispatch(textEditor.getState().tr.insertText("A", 1));
    await Promise.resolve();
    expect(textEditor.getState().doc.textContent).toBe("AB");

    textEditor.destroy();
    expect(() => textView.view.dispatch(textView.view.state.tr)).not.toThrow();
    textView.destroy();
    safeView.destroy();
    editor.destroy();
  });
});
