import { createEditor } from "@uc-markdown-web/core";
import { describe, expect, it } from "vitest";
import {
  fencedCodeFixture,
  indentedCodeFixture,
  rawPreservationFixtures
} from "./fixtures/raw-preservation.js";
import { parseMarkdown, createMarkdownSchema, serializeMarkdown } from "./index.js";

describe("Markdown GFM conversion", () => {
  it("imports and exports basic blocks and nested inline marks", () => {
    const source = [
      "# Heading",
      "",
      "> Quoted **strong _emphasized_** text.",
      "",
      "---",
      "",
      "3. third",
      "4. fourth",
      "",
      "- bullet",
      "",
      "```ts",
      "const value = `code`;",
      "```",
      "",
      "A [link](https://example.com \"title\") with ~~deleted~~ and <https://example.com/autolink>.",
      "soft",
      "break\\",
      "hard break"
    ].join("\n");

    expectRoundTrip(source);
  });

  it("preserves GFM table alignment and checklist state", () => {
    const source = [
      "| Left | Center | Right |",
      "| :--- | :----: | ----: |",
      "| a | **b** | c |",
      "",
      "- [x] completed",
      "- [ ] pending"
    ].join("\n");

    const document = parseMarkdown(source);
    const table = document.firstChild;
    const taskList = document.lastChild;

    expect(table?.firstChild?.firstChild?.attrs).toMatchObject({ align: "left", header: true });
    expect(table?.firstChild?.child(1).attrs).toMatchObject({ align: "center", header: true });
    expect(table?.firstChild?.child(2).attrs).toMatchObject({ align: "right", header: true });
    expect(taskList?.child(0).attrs.checked).toBe(true);
    expect(taskList?.child(1).attrs.checked).toBe(false);
    expectRoundTrip(source);
  });

  it("creates a core editor with the Markdown schema", () => {
    const schema = createMarkdownSchema();
    const document = parseMarkdown("# Ready", schema);
    const editor = createEditor({ schema, doc: document });

    expect(editor.getState().doc.toJSON()).toEqual(document.toJSON());
    editor.destroy();
  });

  it("preserves raw block fixture source without rendering it", () => {
    for (const fixture of rawPreservationFixtures) {
      const document = parseMarkdown(fixture.source);
      const rawSources = document.content.content
        .filter((node) => node.type.name === "raw_markdown_block")
        .map((node) => node.attrs.source);

      expect(rawSources, fixture.name).toEqual(fixture.expectedRawSources);
      expect(document.content.content.every((node) => node.type.name !== "raw_markdown_block" || node.childCount === 0), fixture.name).toBe(true);
      expect(serializeMarkdown(document), fixture.name).toBe(fixture.expectedExport);
    }
  });

  it("does not classify math or directives inside code blocks as raw", () => {
    for (const fixture of [fencedCodeFixture, indentedCodeFixture]) {
      const document = parseMarkdown(fixture.source);

      expect(document.firstChild?.type.name).toBe("code_block");
      expect(document.content.content.some((node) => node.type.name === "raw_markdown_block")).toBe(false);
      expect(serializeMarkdown(document)).toBe(fixture.expectedExport);
    }
  });
});

function expectRoundTrip(source: string): void {
  const parsed = parseMarkdown(source);
  const serialized = serializeMarkdown(parsed);
  const reparsed = parseMarkdown(serialized);

  expect(reparsed.toJSON()).toEqual(parsed.toJSON());
}
