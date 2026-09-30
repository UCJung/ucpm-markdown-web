import { createEditor } from "@uc-markdown-web/core";
import { createMarkdownSchema, parseMarkdown, serializeMarkdown } from "@uc-markdown-web/markdown";
import { TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";
import { createEditingExtension, setCursor } from "./index.js";

describe("editing extension", () => {
  it("applies cursor, list, code, and table commands through editor transactions", () => {
    const schema = createMarkdownSchema();
    const editor = createEditor({
      schema,
      doc: parseMarkdown("editable", schema),
      extensions: [createEditingExtension()]
    });

    expect(editor.extensionCommands.setCursor?.()).toBe(true);
    expect(editor.extensionCommands.bulletList?.()).toBe(true);
    expect(editor.extensionCommands.insertTable?.()).toBe(true);

    const table = editor.getState().doc.firstChild;
    expect(table?.type.name).toBe("table");
    table?.descendants((node) => {
      if (node.type.name === "table_cell") {
        expect(node.childCount).toBe(1);
        expect(node.firstChild?.type.name).toBe("paragraph");
      }
    });
    editor.destroy();
  });

  it("converts a paragraph to a code block", () => {
    const schema = createMarkdownSchema();
    const editor = createEditor({ schema, doc: parseMarkdown("code", schema), extensions: [createEditingExtension()] });
    expect(editor.extensionCommands.codeBlock?.()).toBe(true);
    expect(editor.getState().doc.firstChild?.type.name).toBe("code_block");
    editor.destroy();
  });

  it("rejects invalid cursor positions through the parameterized command while preserving the fixed extension command", () => {
    const schema = createMarkdownSchema();
    const editor = createEditor({ schema, doc: parseMarkdown("text", schema), extensions: [createEditingExtension()] });
    expect(setCursor(-1)({ state: editor.getState(), dispatch: () => undefined })).toBe(false);
    expect(editor.extensionCommands.setCursor?.()).toBe(true);
    editor.destroy();
  });

  it("keeps table commands rectangular through Markdown round trips", () => {
    const schema = createMarkdownSchema();
    const editor = createEditor({ schema, doc: parseMarkdown("| a | b |\n| - | - |\n| c | d |", schema), extensions: [createEditingExtension()] });
    editor.dispatch(editor.getState().tr.setSelection(TextSelection.create(editor.getState().doc, 4)));
    expect(editor.extensionCommands.addTableCell?.()).toBe(true);
    expect(editor.extensionCommands.addTableRow?.()).toBe(true);
    const table = editor.getState().doc.firstChild!;
    const widths = table.content.content.map((row) => row.childCount);
    expect(widths).toEqual([3, 3, 3]);
    const roundTrip = parseMarkdown(serializeMarkdown(editor.getState().doc));
    expect(roundTrip.toJSON()).toEqual(editor.getState().doc.toJSON());
    editor.destroy();
  });

  it("preserves table header and alignment semantics for added cells and rows", () => {
    const schema = createMarkdownSchema();
    const editor = createEditor({ schema, doc: parseMarkdown("| left | right |\n| :--- | ---: |\n| a | b |", schema), extensions: [createEditingExtension()] });
    editor.dispatch(editor.getState().tr.setSelection(TextSelection.create(editor.getState().doc, 4)));
    expect(editor.extensionCommands.addTableCell?.()).toBe(true);
    expect(editor.extensionCommands.addTableRow?.()).toBe(true);
    const table = editor.getState().doc.firstChild!;
    expect(table.firstChild?.lastChild?.attrs).toMatchObject({ header: true, align: "right" });
    expect(table.child(1).lastChild?.attrs).toMatchObject({ header: false, align: "right" });
    expect(table.lastChild?.content.content.map((cell) => cell.attrs)).toEqual([
      { align: "left", header: false },
      { align: "right", header: false },
      { align: "right", header: false }
    ]);
    editor.destroy();
  });
});
