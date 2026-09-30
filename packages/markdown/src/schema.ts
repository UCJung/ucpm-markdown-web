import { createEditorSchema, type Extension, type Schema } from "@uc-markdown-web/core";

const markdownExtension: Extension = {
  name: "markdown-gfm",
  nodes: {
    hard_break: { inline: true, group: "inline", selectable: false },
    task_list: { content: "task_item+", group: "block" },
    task_item: {
      attrs: { checked: { default: false } },
      content: "paragraph block*"
    },
    table: { content: "table_row+", group: "block" },
    table_row: { content: "table_cell+" },
    table_cell: {
      attrs: { align: { default: null }, header: { default: false } },
      content: "block+"
    }
  },
  marks: { strikethrough: {} }
};

export function createMarkdownSchema(): Schema {
  return createEditorSchema([markdownExtension]);
}
