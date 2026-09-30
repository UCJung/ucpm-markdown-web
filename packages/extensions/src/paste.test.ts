/** @vitest-environment jsdom */
import { createMarkdownSchema, serializeMarkdown } from "@uc-markdown-web/markdown";
import { describe, expect, it } from "vitest";
import { parsePastedHtml, unsupportedPasteContentPolicy } from "./paste.js";

describe("safe HTML paste", () => {
  it("converts allowed structures into Markdown-exportable document nodes", () => {
    const schema = createMarkdownSchema();
    const slice = parsePastedHtml("<h2>Title</h2><p><strong>Safe</strong> <a href=\"https://example.com\">link</a></p><ul><li>item</li></ul><pre><code>const x = 1;</code></pre><table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>", schema);
    const document = schema.node("doc", null, slice.content);

    expect(document.content.content.map((node) => node.type.name)).toEqual(["heading", "paragraph", "bullet_list", "code_block", "table"]);
    expect(document.lastChild?.firstChild?.firstChild?.attrs.header).toBe(true);
    expect(serializeMarkdown(document)).toContain("## Title");
    expect(serializeMarkdown(document)).toContain("[link](https://example.com)");
    expect(serializeMarkdown(document)).toContain("| A | B |");
  });

  it("drops executable content and attributes while unwrapping unknown safe content", () => {
    const schema = createMarkdownSchema();
    const slice = parsePastedHtml("<div onclick=\"globalThis.pwned=1\"><p data-x=\"drop\">visible <span style=\"color:red\">text</span></p><script>globalThis.pwned=2</script><iframe src=\"https://evil.example\">ignored</iframe></div>", schema);
    const document = schema.node("doc", null, slice.content);

    expect(unsupportedPasteContentPolicy).toBe("unwrap-safe-descendants");
    expect(document.textContent).toBe("visible text");
    expect(JSON.stringify(document.toJSON())).not.toContain("onclick");
    expect(JSON.stringify(document.toJSON())).not.toContain("data-x");
    expect(JSON.stringify(document.toJSON())).not.toContain("pwned");
  });

  it("keeps unsafe pasted link text without a link mark", () => {
    const schema = createMarkdownSchema();
    const slice = parsePastedHtml("<p><a href=\"j&#x61;va&#x09;script:alert(1)\">unsafe</a> <a href=\"/safe\">safe</a></p>", schema);
    const paragraph = slice.content.firstChild;

    expect(paragraph?.firstChild?.marks).toHaveLength(0);
    expect(paragraph?.lastChild?.marks[0]?.type.name).toBe("link");
  });

  it("collects only rows owned by the pasted table", () => {
    const schema = createMarkdownSchema();
    const slice = parsePastedHtml("<table><tr><td>outer<table><tr><td>nested</td></tr></table></td></tr></table>", schema);
    const table = slice.content.firstChild;

    expect(table?.type.name).toBe("table");
    expect(table?.childCount).toBe(1);
    expect(table?.firstChild?.childCount).toBe(1);
  });
});
