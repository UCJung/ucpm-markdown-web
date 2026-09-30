import { describe, expect, it } from "vitest";

import { createEditorSchema } from "./schema.js";

describe("createEditorSchema", () => {
  it("creates the base document schema", () => {
    const schema = createEditorSchema();
    const document = schema.node("doc", undefined, [schema.node("paragraph", undefined, schema.text("text"))]);

    expect(document.textContent).toBe("text");
    expect(schema.marks).toHaveProperty("strong");
  });

  it("merges node and mark specs from an extension", () => {
    const schema = createEditorSchema([
      {
        name: "raw-markdown",
        nodes: {
          raw_markdown_block: {
            attrs: { content: { default: "" } },
            atom: true,
            group: "block"
          }
        },
        marks: {
          highlight: {
            attrs: { color: { default: "yellow" } }
          }
        }
      }
    ]);

    expect(schema.nodes).toHaveProperty("raw_markdown_block");
    expect(schema.marks).toHaveProperty("highlight");
  });

  it("rejects duplicate extension names", () => {
    expect(() =>
      createEditorSchema([
        { name: "raw-markdown" },
        { name: "raw-markdown" }
      ])
    ).toThrow("Duplicate extension name: raw-markdown.");
  });

  it("rejects node and mark name conflicts", () => {
    expect(() =>
      createEditorSchema([
        {
          name: "duplicate-node",
          nodes: { paragraph: { group: "block" } }
        }
      ])
    ).toThrow("Duplicate schema spec name: paragraph in extension duplicate-node.");

    expect(() =>
      createEditorSchema([
        {
          name: "duplicate-mark",
          marks: { strong: {} }
        }
      ])
    ).toThrow("Duplicate schema spec name: strong in extension duplicate-mark.");
  });
});
