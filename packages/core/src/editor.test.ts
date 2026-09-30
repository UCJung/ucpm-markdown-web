import { Plugin } from "prosemirror-state";
import { describe, expect, it } from "vitest";

import { createEditor } from "./editor.js";
import { createEditorSchema } from "./schema.js";

function documentWithText(text: string): Record<string, unknown> {
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }]
  };
}

function appendPosition(editor: ReturnType<typeof createEditor>): number {
  return editor.getState().doc.content.size - 1;
}

describe("headless editor", () => {
  it("creates from JSON, applies transactions, and notifies subscribers", () => {
    const editor = createEditor({ doc: documentWithText("hello") });
    const observed: string[] = [];
    const unsubscribe = editor.subscribe((state, transactions) => {
      observed.push(`${state.doc.textContent}:${transactions.length}`);
    });

    expect(editor.dispatch(editor.getState().tr.insertText("!", 6))).toBe(true);
    expect(editor.getState().doc.textContent).toBe("hello!");
    expect(observed).toEqual(["hello!:1"]);

    unsubscribe();
    unsubscribe();
    editor.dispatch(editor.getState().tr.insertText("?", 7));
    expect(observed).toEqual(["hello!:1"]);
  });

  it("checks initial document schema identity and JSON validity", () => {
    const schema = createEditorSchema();
    const document = schema.node("doc", undefined, [schema.node("paragraph", undefined, schema.text("text"))]);
    const editor = createEditor({ schema, doc: document });

    expect(editor.getState().doc.textContent).toBe("text");
    expect(() => createEditor({ schema: createEditorSchema(), doc: document })).toThrow(
      "Initial document schema does not match the editor schema."
    );
    expect(() => createEditor({ doc: { type: "unknown" } })).toThrow();
  });

  it("honors extension plugin filtering, appending, and keymap registration", () => {
    const filteredEditor = createEditor({
      extensions: [
        {
          name: "filtering",
          plugins: [
            new Plugin({
              filterTransaction: (transaction) => transaction.getMeta("allowed") !== false
            })
          ],
          keymap: { "Mod-Alt-k": () => true }
        }
      ]
    });
    const rejectedTransaction = filteredEditor.getState().tr
      .insertText("blocked", 1)
      .setMeta("allowed", false);

    expect(filteredEditor.dispatch(rejectedTransaction)).toBe(false);
    expect(filteredEditor.getState().doc.textContent).toBe("");
    expect(filteredEditor.getState().plugins).toHaveLength(4);

    const appendingEditor = createEditor({
      extensions: [
        {
          name: "appending",
          plugins: [
            new Plugin({
              appendTransaction: (transactions, _oldState, newState) => {
                if (transactions.some((transaction) => transaction.getMeta("appended") === true)) {
                  return null;
                }

                if (transactions.some((transaction) => transaction.docChanged)) {
                  return newState.tr
                    .insertText("!", newState.doc.content.size - 1)
                    .setMeta("appended", true);
                }

                return null;
              }
            })
          ]
        }
      ]
    });

    appendingEditor.dispatch(appendingEditor.getState().tr.insertText("A", 1));
    expect(appendingEditor.getState().doc.textContent).toBe("A!");
  });

  it("uses a listener snapshot, rejects reentry, and aggregates listener errors", () => {
    const editor = createEditor();
    const calls: string[] = [];
    let unsubscribeSecond: () => void = () => undefined;

    editor.subscribe(() => {
      calls.push("first");
      unsubscribeSecond();
    });
    unsubscribeSecond = editor.subscribe(() => {
      calls.push("second");
    });

    editor.dispatch(editor.getState().tr.insertText("A", appendPosition(editor)));
    expect(calls).toEqual(["first", "second"]);

    let reentryError: unknown;
    editor.subscribe(() => {
      try {
        editor.dispatch(editor.getState().tr.insertText("B", appendPosition(editor)));
      } catch (error) {
        reentryError = error;
      }
    });

    editor.dispatch(editor.getState().tr.insertText("C", appendPosition(editor)));
    expect(reentryError).toBeInstanceOf(Error);
    expect((reentryError as Error).message).toBe("Cannot dispatch while notifying subscribers.");

    const listenerErrors: string[] = [];
    editor.subscribe(() => {
      listenerErrors.push("failed");
      throw new Error("listener failed");
    });
    editor.subscribe(() => {
      listenerErrors.push("continued");
    });

    let dispatchError: unknown;
    try {
      editor.dispatch(editor.getState().tr.insertText("D", appendPosition(editor)));
    } catch (error) {
      dispatchError = error;
    }

    expect(listenerErrors).toEqual(["failed", "continued"]);
    expect(dispatchError).toBeInstanceOf(AggregateError);
    expect((dispatchError as AggregateError).errors).toHaveLength(1);
  });
});
