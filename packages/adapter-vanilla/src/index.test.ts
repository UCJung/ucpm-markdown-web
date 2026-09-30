/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";

import { createVanillaEditor } from "./index.js";

describe("Vanilla editor public DOM integration", () => {
  it("mounts initial basic, GFM, and raw Markdown as safe DOM while preserving Markdown semantics", () => {
    const target = createTarget();
    const raw = ":::note\nraw directive body\n:::";
    const editor = createVanillaEditor({
      element: target,
      markdown: [
        "# Heading",
        "",
        "- [x] done",
        "",
        "| A | B |",
        "| --- | --- |",
        "| one | two |",
        "",
        raw
      ].join("\n")
    });

    expect(target.querySelector("[data-uc-markdown-web-mount]"))?.not.toBeNull();
    expect(target.querySelector("h1")?.textContent).toBe("Heading");
    expect(target.querySelector("li")?.textContent).toBe("done");
    expect(target.querySelector("table td")?.textContent).toBe("one");
    expect(target.querySelector("pre[data-raw-markdown='true']")?.textContent).toBe(raw);
    expect(target.querySelector("script")).toBeNull();
    expect(editor.getMarkdown()).toContain("# Heading");
    expect(editor.getMarkdown()).toContain("* [x] done");
    expect(editor.getMarkdown()).toContain("| A");
    expect(editor.getMarkdown()).toContain(raw);

    editor.destroy();
  });

  it("publishes document changes, ignores selection-only transactions, and honors unsubscribe", () => {
    const editor = createVanillaEditor({ element: createTarget(), markdown: "item" });
    const observed: string[] = [];
    const unsubscribe = editor.subscribe((markdown) => observed.push(markdown));

    expect(editor.extensionCommands.setSelection?.()).toBe(true);
    expect(observed).toEqual([]);
    expect(editor.extensionCommands.bulletList?.()).toBe(true);
    expect(editor.getMarkdown()).toBe("* item\n");
    expect(observed).toEqual(["* item\n"]);

    unsubscribe();
    expect(editor.commands.undo()).toBe(true);
    expect(editor.getMarkdown()).toBe("item\n");
    expect(observed).toEqual(["* item\n"]);

    editor.destroy();
  });

  it("serializes list, code block, and table command results", () => {
    const list = createVanillaEditor({ element: createTarget(), markdown: "item" });
    expect(list.extensionCommands.setSelection?.()).toBe(true);
    expect(list.extensionCommands.bulletList?.()).toBe(true);
    expect(list.getMarkdown()).toBe("* item\n");
    list.destroy();

    const code = createVanillaEditor({ element: createTarget(), markdown: "item" });
    expect(code.extensionCommands.codeBlock?.()).toBe(true);
    expect(code.getMarkdown()).toBe("```\nitem\n```\n");
    code.destroy();

    const table = createVanillaEditor({ element: createTarget(), markdown: "item" });
    expect(table.extensionCommands.insertTable?.()).toBe(true);
    expect(table.extensionCommands.setCursor?.()).toBe(true);
    expect(table.extensionCommands.addTableCell?.()).toBe(true);
    expect(table.extensionCommands.addTableRow?.()).toBe(true);
    expect(table.getMarkdown()).toBe("|   |   |   |\n| - | - | - |\n|   |   |   |\n|   |   |   |\n\nitem\n");
    table.destroy();
  });

  it("stops stale DOM events and public core commands after destroy", () => {
    const target = createTarget();
    const editor = createVanillaEditor({ element: target, markdown: "before" });
    const editable = editingDom(target);
    const observed: string[] = [];
    editor.subscribe((markdown) => observed.push(markdown));
    const beforeDestroy = editor.getMarkdown();

    editor.destroy();
    editable.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    dispatchHtmlPaste(editable, "<p>after</p>");

    expect(target.querySelector("[data-uc-markdown-web-mount]")).toBeNull();
    expect(observed).toEqual([]);
    expect(() => editor.getMarkdown()).toThrow("Vanilla editor has been destroyed.");
    expect(() => editor.commands.undo()).toThrow("Editor has been destroyed.");
    expect(beforeDestroy).toBe("before\n");
  });

  it("routes allowed and malicious HTML through the safe paste policy", () => {
    const allowedTarget = createTarget();
    const allowed = createVanillaEditor({ element: allowedTarget });
    dispatchHtmlPaste(editingDom(allowedTarget), "<h2>Safe title</h2><p><a href='/guide'>guide</a></p>");
    expect(allowed.getMarkdown()).toContain("## Safe title");
    expect(allowed.getMarkdown()).toContain("[guide](/guide)");
    expect(allowedTarget.querySelector("a")?.getAttribute("href")).toBe("/guide");
    allowed.destroy();

    const maliciousTarget = createTarget();
    const malicious = createVanillaEditor({ element: maliciousTarget });
    dispatchHtmlPaste(
      editingDom(maliciousTarget),
      "<p onclick='globalThis.pwned=true'><a href='j&#x61;vascript:alert(1)' onmouseover='globalThis.pwned=true'>unsafe</a></p><script>globalThis.pwned=true</script>"
    );
    expect(malicious.getMarkdown()).toBe("unsafe\n");
    expect(maliciousTarget.querySelector("script, a, [onclick], [onmouseover]")).toBeNull();
    expect((globalThis as Record<string, unknown>).pwned).toBeUndefined();
    malicious.destroy();
  });
});

function createTarget(): HTMLElement {
  const target = document.createElement("div");
  document.body.append(target);
  return target;
}

function editingDom(target: HTMLElement): HTMLElement {
  const editable = target.querySelector("[contenteditable='true']");
  if (!(editable instanceof HTMLElement)) {
    throw new Error("Expected the public adapter to mount an editable DOM node.");
  }
  return editable;
}

function dispatchHtmlPaste(target: HTMLElement, html: string): void {
  const event = new Event("paste", { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, "clipboardData", {
    configurable: true,
    value: { getData: (type: string) => type === "text/html" ? html : "" }
  });
  target.dispatchEvent(event);
}
