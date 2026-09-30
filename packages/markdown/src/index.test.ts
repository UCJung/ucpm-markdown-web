import { createEditor } from "@uc-markdown-web/core";
import { describe, expect, it } from "vitest";
import {
  fencedCodeFixture,
  indentedCodeFixture,
  rawPreservationFixtures
} from "./fixtures/raw-preservation.js";
import { rawBoundaryFixtures } from "./fixtures/raw-boundaries.js";
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

  it("preserves mixed regular and task list items, including nested lists", () => {
    const source = [
      "- regular first",
      "- [x] completed",
      "  - nested regular",
      "  - [ ] nested pending",
      "- [ ] pending",
      "- regular last"
    ].join("\n");

    const document = parseMarkdown(source);
    const list = document.firstChild;
    const nestedList = list?.child(1).lastChild;

    expect(list?.type.name).toBe("task_list");
    expect(list?.content.content.map((item) => item.type.name)).toEqual([
      "list_item",
      "task_item",
      "task_item",
      "list_item"
    ]);
    expect(list?.child(1).attrs.checked).toBe(true);
    expect(list?.child(2).attrs.checked).toBe(false);
    expect(nestedList?.type.name).toBe("task_list");
    expect(nestedList?.content.content.map((item) => item.type.name)).toEqual(["list_item", "task_item"]);
    expect(nestedList?.child(1).attrs.checked).toBe(false);
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

  it("falls back to the complete container source for nested and inline unsupported syntax", () => {
    for (const source of [
      rawBoundaryFixtures.blockquoteHtml,
      rawBoundaryFixtures.listHtml,
      rawBoundaryFixtures.inlineImage,
      rawBoundaryFixtures.inlineHtml
    ]) {
      expectRawDocument(source);
    }
  });

  it("falls back per block for unsupported inline references", () => {
    const document = parseMarkdown(rawBoundaryFixtures.inlineReference);

    expect(document.content.content.map((node) => node.type.name)).toEqual([
      "raw_markdown_block",
      "raw_markdown_block"
    ]);
    expect(document.content.content.map((node) => node.attrs.source)).toEqual([
      "[reference text][ref]",
      "[ref]: https://example.com"
    ]);
    expect(serializeMarkdown(document)).toBe("[reference text][ref]\n\n[ref]: https://example.com");
  });

  it("does not lose text when explicit raw ranges partially overlap Markdown blocks", () => {
    expectRawDocument(rawBoundaryFixtures.rangePrefix);
    expectRawDocument(rawBoundaryFixtures.rangeSuffix);
  });

  it("resets fence and raw detection at container boundaries", () => {
    const quoteFenceDocument = parseMarkdown(rawBoundaryFixtures.quoteFenceThenDirective);
    expect(quoteFenceDocument.lastChild?.type.name).toBe("raw_markdown_block");
    expect(quoteFenceDocument.lastChild?.attrs.source).toBe(":::note\nraw\n:::");

    const indentedFenceDocument = parseMarkdown(rawBoundaryFixtures.indentedFenceThenDirective);
    expect(indentedFenceDocument.lastChild?.type.name).toBe("raw_markdown_block");
    expect(indentedFenceDocument.lastChild?.attrs.source).toBe(":::note\nraw\n:::");

    const unclosedQuoteDocument = parseMarkdown(rawBoundaryFixtures.quoteUnclosedThenDirective);
    expect(unclosedQuoteDocument.lastChild?.type.name).toBe("raw_markdown_block");
    expect(unclosedQuoteDocument.lastChild?.attrs.source).toBe(":::note\nraw\n:::");
    expect(parseMarkdown(rawBoundaryFixtures.manyUnclosed).childCount).toBeGreaterThan(0);
  });

  it("restricts table cells to the serializer paragraph contract", () => {
    const schema = createMarkdownSchema();
    const paragraph = schema.node("paragraph", null, schema.text("cell"));

    expect(() => schema.node("table_cell", null, [paragraph, paragraph])).toThrow();
  });
});

function expectRoundTrip(source: string): void {
  const parsed = parseMarkdown(source);
  const serialized = serializeMarkdown(parsed);
  const reparsed = parseMarkdown(serialized);

  expect(reparsed.toJSON()).toEqual(parsed.toJSON());
}

function expectRawDocument(source: string): void {
  const document = parseMarkdown(source);
  const expectedRawSource = source.replace(/(\r\n|\n|\r)$/, "");

  expect(document.childCount).toBe(1);
  expect(document.firstChild?.type.name).toBe("raw_markdown_block");
  expect(document.firstChild?.attrs.source).toBe(expectedRawSource);
  expect(serializeMarkdown(document)).toBe(expectedRawSource);
}
