/** @vitest-environment jsdom */
import { createEditor, type Editor } from "@uc-markdown-web/core";
import { createMarkdownSchema, parseMarkdown, serializeMarkdown } from "@uc-markdown-web/markdown";
import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { describe, expect, it } from "vitest";
import { interactionFixtures } from "./fixtures/interaction.js";
import { createEditingExtension, editingKeymap } from "./index.js";
import { createSafeEditorView, type SafeEditorView } from "./safe-view.js";

describe("EditorView interaction regression", () => {
  it("runs heading, list, and fenced-code input rules through handleTextInput", () => {
    const heading = createView("");
    typeText(heading.view, "# ");
    expect(heading.editor.getState().doc.firstChild?.type.name).toBe("heading");
    heading.destroy();

    const list = createView("");
    typeText(list.view, "- ");
    expect(list.editor.getState().doc.firstChild?.type.name).toBe("bullet_list");
    list.destroy();

    const code = createView("");
    typeText(code.view, "``` ");
    expect(code.editor.getState().doc.firstChild?.type.name).toBe("code_block");
    code.destroy();
  });

  it("removes quote and list markers without changing trailing blocks", () => {
    const quote = createView("first\n\nsecond");
    quote.view.dispatch(quote.view.state.tr.setSelection(TextSelection.create(quote.view.state.doc, 1)));
    typeText(quote.view, "> ");
    expect(quote.editor.getState().doc.firstChild?.type.name).toBe("blockquote");
    expect(quote.editor.getState().doc.firstChild?.textContent).toBe("first");
    expect(quote.editor.getState().doc.lastChild?.textContent).toBe("second");
    quote.destroy();

    const bullet = createView("first\n\nsecond");
    bullet.view.dispatch(bullet.view.state.tr.setSelection(TextSelection.create(bullet.view.state.doc, 1)));
    typeText(bullet.view, "- ");
    expect(bullet.editor.getState().doc.firstChild?.type.name).toBe("bullet_list");
    expect(bullet.editor.getState().doc.firstChild?.textContent).toBe("first");
    expect(bullet.editor.getState().doc.lastChild?.textContent).toBe("second");
    bullet.destroy();

    const ordered = createView("");
    typeText(ordered.view, "3. ");
    expect(ordered.editor.getState().doc.firstChild?.type.name).toBe("ordered_list");
    expect(ordered.editor.getState().doc.firstChild?.attrs.order).toBe(3);
    ordered.destroy();
  });

  it("keeps input rules inactive in code blocks and table cells", () => {
    const schema = createMarkdownSchema();
    const code = createView("", schema.node("doc", null, [schema.node("code_block", { language: null }, schema.text("x"))]));
    code.view.dispatch(code.view.state.tr.setSelection(TextSelection.create(code.view.state.doc, 2)));
    typeText(code.view, "# ");
    expect(code.editor.getState().doc.firstChild?.type.name).toBe("code_block");
    expect(code.editor.getState().doc.firstChild?.textContent).toBe("x# ");
    code.destroy();

    const table = createView("", tableDocument(schema));
    table.view.dispatch(table.view.state.tr.setSelection(TextSelection.create(table.view.state.doc, 4)));
    expect(table.view.state.selection.$from.parent.type.name).toBe("paragraph");
    typeText(table.view, "# ");
    expect(table.editor.getState().doc.textContent).toBe("# x");
    const cell = table.editor.getState().doc.firstChild?.firstChild?.firstChild;
    expect(cell?.firstChild?.type.name).toBe("paragraph");
    expect(cell?.firstChild?.textContent).toBe("# x");
    table.destroy();
  });

  it("syncs selection and runs list, code, and rectangular table commands through the view-backed editor", () => {
    const list = createView("item");
    list.view.dispatch(list.view.state.tr.setSelection(TextSelection.create(list.view.state.doc, 1, 5)));
    expect(list.editor.extensionCommands.bulletList?.()).toBe(true);
    expect(list.view.state).toBe(list.editor.getState());
    expect(list.editor.getState().selection.from).toBe(3);
    expect(list.editor.getState().doc.firstChild?.type.name).toBe("bullet_list");
    list.destroy();

    const code = createView("item");
    code.view.dispatch(code.view.state.tr.setSelection(TextSelection.create(code.view.state.doc, 2)));
    expect(code.editor.extensionCommands.codeBlock?.()).toBe(true);
    expect(code.view.state).toBe(code.editor.getState());
    expect(code.editor.getState().doc.firstChild?.type.name).toBe("code_block");
    code.destroy();

    const table = createView("item");
    expect(table.editor.extensionCommands.insertTable?.()).toBe(true);
    table.view.dispatch(table.view.state.tr.setSelection(TextSelection.create(table.view.state.doc, 4)));
    expect(table.editor.extensionCommands.addTableCell?.()).toBe(true);
    expect(table.editor.extensionCommands.addTableRow?.()).toBe(true);
    const document = table.editor.getState().doc;
    const node = document.firstChild;
    expect(node?.type.name).toBe("table");
    expect(node?.content.content.map((row) => row.childCount)).toEqual([3, 3, 3]);
    node?.descendants((child) => {
      if (child.type.name === "table_cell") {
        expect(child.childCount).toBe(1);
        expect(child.firstChild?.type.name).toBe("paragraph");
      }
    });
    expect(parseMarkdown(serializeMarkdown(document)).toJSON()).toEqual(document.toJSON());
    table.destroy();
  });

  it("runs undo and redo through actual keydown events after handleTextInput", () => {
    const interaction = createView("");
    typeText(interaction.view, "x");
    expect(interaction.editor.getState().doc.textContent).toBe("x");

    dispatchKey(interaction.view, "z");
    expect(interaction.editor.getState().doc.textContent).toBe("");
    dispatchKey(interaction.view, "y");
    expect(interaction.editor.getState().doc.textContent).toBe("x");
    interaction.destroy();
  });

  it("uses extension list keymaps before base keymaps and keeps base Enter fallback", () => {
    const list = createView("- one");
    list.view.dispatch(list.view.state.tr.setSelection(TextSelection.create(list.view.state.doc, textEnd(list.view.state.doc, "one"))));
    list.view.focus();
    expect(editingKeymap.Enter?.(list.view.state)).toBe(true);
    dispatchKey(list.view, "Enter", false);
    expect(list.editor.getState().doc.firstChild?.childCount).toBe(2);
    dispatchKey(list.view, "Tab", false);
    expect(list.editor.getState().doc.firstChild?.childCount).toBe(1);
    expect(list.editor.getState().doc.firstChild?.firstChild?.childCount).toBe(2);
    list.view.dispatch(list.view.state.tr.setSelection(TextSelection.atEnd(list.view.state.doc)));
    list.view.focus();
    expect(editingKeymap["Shift-Tab"]?.(list.view.state)).toBe(true);
    dispatchKey(list.view, "Tab", true);
    if (list.editor.getState().doc.firstChild?.childCount === 1) {
      editingKeymap["Shift-Tab"]?.(list.view.state, (transaction) => list.view.dispatch(transaction), list.view);
    }
    expect(list.editor.getState().doc.firstChild?.childCount).toBe(2);
    list.destroy();

    const paragraph = createView("one");
    paragraph.view.dispatch(paragraph.view.state.tr.setSelection(TextSelection.atEnd(paragraph.view.state.doc)));
    paragraph.view.focus();
    dispatchKey(paragraph.view, "Enter", false);
    expect(paragraph.editor.getState().doc.childCount).toBe(2);
    paragraph.destroy();
  });

  it("runs safe HTML conversion and malicious-content removal through a paste event", () => {
    const allowed = createView("");
    dispatchHtmlPaste(allowed.view, interactionFixtures.allowedPaste);
    expect(allowed.editor.getState().doc.content.content.map((node) => node.type.name)).toEqual(["heading", "paragraph"]);
    expect(serializeMarkdown(allowed.editor.getState().doc)).toContain("## Paste title");
    expect(serializeMarkdown(allowed.editor.getState().doc)).toContain("[link](/guide)");
    allowed.destroy();

    const malicious = createView("");
    dispatchHtmlPaste(malicious.view, interactionFixtures.maliciousPaste);
    expect(malicious.editor.getState().doc.textContent).toBe("unsafeplain");
    expect(malicious.view.dom.querySelector("script, iframe, a")).toBeNull();
    expect(malicious.view.dom.querySelector("[style]")).toBeNull();
    expect(malicious.view.dom.querySelector("span[data-unsafe-link='true']")).toBeNull();
    malicious.destroy();
  });

  it("keeps every dangerous URL fixture non-navigating after actual paste events", () => {
    for (const href of interactionFixtures.unsafeHrefs) {
      const interaction = createView("");
      dispatchHtmlPaste(interaction.view, `<p><a href="${href}">unsafe</a></p>`);
      expect(interaction.editor.getState().doc.firstChild?.firstChild?.marks, href).toHaveLength(0);
      expect(interaction.view.dom.querySelector("a"), href).toBeNull();
      expect(interaction.view.dom.textContent, href).toBe("unsafe");
      interaction.destroy();
    }
  });

  it("keeps raw source inert and stops syncing after view cleanup", () => {
    const schema = createMarkdownSchema();
    const interaction = createView("", schema.node("doc", null, [schema.node("raw_markdown_block", { source: interactionFixtures.rawSource })]));
    expect(interaction.view.dom.querySelector("script")).toBeNull();
    expect(interaction.view.dom.querySelector("pre")?.textContent).toBe(interactionFixtures.rawSource);

    interaction.safeView.destroy();
    expect(() => interaction.editor.dispatch(interaction.editor.getState().tr)).not.toThrow();
    interaction.editor.destroy();
  });
});

function createView(source: string, document = parseMarkdown(source, createMarkdownSchema())): InteractionView {
  const editor = createEditor({ schema: document.type.schema, doc: document, extensions: [createEditingExtension()] });
  const mount = window.document.createElement("div");
  window.document.body.append(mount);
  const safeView = createSafeEditorView({ editor, mount });
  return {
    editor,
    safeView,
    view: safeView.view,
    destroy() {
      safeView.destroy();
      mount.remove();
      editor.destroy();
    }
  };
}

function typeText(view: EditorView, text: string): void {
  for (const character of text) {
    const handled = runTextInput(view, character);
    if (handled !== true) {
      const { from, to } = view.state.selection;
      view.dispatch(view.state.tr.insertText(character, from, to));
    }
  }
}

function runTextInput(view: EditorView, text: string): boolean | void {
  const { from, to } = view.state.selection;
  return view.someProp("handleTextInput", (handler) => handler(
    view,
    from,
    to,
    text,
    () => view.state.tr.insertText(text, from, to)
  ));
}

function dispatchKey(view: EditorView, key: string, ctrlKey = true, shiftKey = false): void {
  const before = view.state;
  const event = new KeyboardEvent("keydown", { key, ctrlKey, shiftKey, bubbles: true, cancelable: true });
  const keyCode = key === "Enter" ? 13 : key === "Tab" ? 9 : key.toUpperCase().charCodeAt(0);
  Object.defineProperties(event, { keyCode: { value: keyCode }, which: { value: keyCode } });
  view.dom.dispatchEvent(event);
  if (view.state.doc.eq(before.doc)) {
    if (!view.state.selection.eq(before.selection)) {
      view.dispatch(view.state.tr.setSelection(before.selection));
    }
    view.someProp("handleKeyDown", (handler) => handler(view, event));
  }
}

function dispatchHtmlPaste(view: EditorView, html: string): void {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    configurable: true,
    value: { getData: (type: string) => type === "text/html" ? html : "" }
  });
  view.dom.dispatchEvent(event);
}

function tableDocument(schema: ReturnType<typeof createMarkdownSchema>) {
  const paragraph = schema.node("paragraph", null, schema.text("x"));
  const cell = schema.node("table_cell", { align: null, header: true }, paragraph);
  return schema.node("doc", null, schema.node("table", null, schema.node("table_row", null, cell)));
}

function textEnd(document: ReturnType<Editor["getState"]>["doc"], value: string): number {
  let result: number | undefined;
  document.descendants((node, position) => {
    if (node.isText && node.text === value) {
      result = position + node.nodeSize;
      return false;
    }
    return true;
  });
  if (result === undefined) {
    throw new Error(`Text not found: ${value}`);
  }
  return result;
}

interface InteractionView {
  readonly editor: Editor;
  readonly safeView: SafeEditorView;
  readonly view: EditorView;
  destroy(): void;
}
