import { TextSelection } from "prosemirror-state";
import { describe, expect, it } from "vitest";

import { createEditor } from "./editor.js";

function documentWithText(text: string, type = "paragraph"): Record<string, unknown> {
  return {
    type: "doc",
    content: [{ type, content: [{ type: "text", text }] }]
  };
}

describe("editor commands", () => {
  it("runs formatting, paragraph, undo, and redo commands", () => {
    const editor = createEditor({ doc: documentWithText("hello") });
    const state = editor.getState();

    editor.dispatch(state.tr.setSelection(TextSelection.create(state.doc, 1, 6)));

    expect(editor.commands.toggleBold()).toBe(true);
    expect(editor.getState().doc.rangeHasMark(1, 6, editor.schema.marks.strong!)).toBe(true);

    editor.dispatch(editor.getState().tr.insertText("!", 6));
    expect(editor.getState().doc.textContent).toBe("hello!");
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getState().doc.textContent).toBe("hello");
    expect(editor.commands.redo()).toBe(true);
    expect(editor.getState().doc.textContent).toBe("hello!");

    const headingEditor = createEditor({ doc: documentWithText("title", "heading") });
    expect(headingEditor.commands.setParagraph()).toBe(true);
    expect(headingEditor.getState().doc.firstChild?.type.name).toBe("paragraph");
  });

  it("runs extension commands against the current state", () => {
    const editor = createEditor({
      extensions: [
        {
          name: "append-text",
          commands: {
            appendExclamation: ({ state, dispatch }) => {
              dispatch(state.tr.insertText("!", state.doc.content.size - 1));
              return true;
            }
          }
        }
      ]
    });

    const appendExclamation = editor.extensionCommands.appendExclamation;

    if (appendExclamation === undefined) {
      throw new Error("Expected the extension command to be registered.");
    }

    expect(appendExclamation()).toBe(true);
    expect(editor.getState().doc.textContent).toBe("!");
  });
});
