import { describe, expect, it } from "vitest";

import { createEditor } from "./editor.js";

describe("editor lifecycle", () => {
  it("creates extensions in order and destroys them in reverse order", () => {
    const events: string[] = [];
    const editor = createEditor({
      extensions: [
        {
          name: "first",
          onCreate: () => events.push("create:first"),
          onDestroy: () => events.push("destroy:first")
        },
        {
          name: "second",
          onCreate: () => events.push("create:second"),
          onDestroy: () => events.push("destroy:second")
        }
      ]
    });

    editor.destroy();
    editor.destroy();

    expect(events).toEqual([
      "create:first",
      "create:second",
      "destroy:second",
      "destroy:first"
    ]);
    expect(() => editor.dispatch(editor.getState().tr)).toThrow("Editor has been destroyed.");
    expect(() => editor.commands.undo()).toThrow("Editor has been destroyed.");
  });

  it("cleans the failing extension and initialized extensions when creation fails", () => {
    const events: string[] = [];
    let creationError: unknown;

    try {
      createEditor({
        extensions: [
          {
            name: "first",
            onCreate: () => events.push("create:first"),
            onDestroy: () => events.push("destroy:first")
          },
          {
            name: "failing",
            onCreate: () => {
              events.push("create:failing");
              throw new Error("create failed");
            },
            onDestroy: () => events.push("destroy:failing")
          }
        ]
      });
    } catch (error) {
      creationError = error;
    }

    expect(events).toEqual([
      "create:first",
      "create:failing",
      "destroy:failing",
      "destroy:first"
    ]);
    expect(creationError).toBeInstanceOf(AggregateError);
    expect((creationError as AggregateError).errors).toHaveLength(1);
  });

  it("continues destroy hooks and aggregates hook errors", () => {
    const events: string[] = [];
    const editor = createEditor({
      extensions: [
        {
          name: "first",
          onDestroy: () => events.push("destroy:first")
        },
        {
          name: "second",
          onDestroy: () => {
            events.push("destroy:second");
            throw new Error("destroy failed");
          }
        }
      ]
    });
    let destroyError: unknown;

    try {
      editor.destroy();
    } catch (error) {
      destroyError = error;
    }

    expect(events).toEqual(["destroy:second", "destroy:first"]);
    expect(destroyError).toBeInstanceOf(AggregateError);
    expect((destroyError as AggregateError).errors).toHaveLength(1);
  });

  it("remains safe when a listener destroys the editor", () => {
    const editor = createEditor();
    editor.subscribe(() => editor.destroy());

    editor.dispatch(editor.getState().tr.insertText("A", 1));

    expect(editor.getState().doc.textContent).toBe("A");
    expect(() => editor.subscribe(() => undefined)).toThrow("Editor has been destroyed.");
  });
});
