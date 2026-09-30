import { type Node as ProseMirrorNode } from "prosemirror-model";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

interface MarkdownNode {
  readonly type: string;
  readonly [key: string]: unknown;
}

const stringifier = unified().use(remarkGfm).use(remarkStringify);

export function serializeMarkdown(document: ProseMirrorNode): string {
  if (document.type.name !== "doc") {
    throw new Error("serializeMarkdown expects a doc node.");
  }

  const blocks = document.content.content;
  const lastBlock = blocks.at(-1);
  const output = blocks.map(serializeDocumentBlock).join("\n\n");

  return lastBlock?.type.name === "raw_markdown_block" ? output : `${output}\n`;
}

function serializeDocumentBlock(node: ProseMirrorNode): string {
  if (node.type.name === "raw_markdown_block") {
    return requiredString(node.attrs.source, "raw_markdown_block source");
  }

  const output = stringifier.stringify({ type: "root", children: [serializeBlock(node)] } as never);
  return output.replace(/(\r\n|\n|\r)$/, "");
}

function serializeBlock(node: ProseMirrorNode): MarkdownNode {
  switch (node.type.name) {
    case "paragraph": return { type: "paragraph", children: serializeInline(node) };
    case "heading": return { type: "heading", depth: headingLevel(node), children: serializeInline(node) };
    case "blockquote": return { type: "blockquote", children: node.content.content.map(serializeBlock) };
    case "horizontal_rule": return { type: "thematicBreak" };
    case "bullet_list": return serializeList(node, false);
    case "ordered_list": return serializeList(node, true);
    case "task_list": return serializeTaskList(node);
    case "code_block": return { type: "code", lang: stringOrNull(node.attrs.language, "code_block language"), value: node.textContent };
    case "table": return serializeTable(node);
    default: throw new Error(`Unsupported ProseMirror block: ${node.type.name}.`);
  }
}

function serializeList(node: ProseMirrorNode, ordered: boolean): MarkdownNode {
  return {
    type: "list",
    ordered,
    start: ordered ? positiveInteger(node.attrs.order, "ordered_list order") : null,
    spread: false,
    children: node.content.content.map((item) => serializeListItem(item, "list_item"))
  };
}

function serializeTaskList(node: ProseMirrorNode): MarkdownNode {
  return {
    type: "list",
    ordered: false,
    spread: false,
    children: node.content.content.map((item) => {
      if (item.type.name === "list_item") {
        return serializeListItem(item, "list_item");
      }

      if (item.type.name !== "task_item") {
        throw new Error("task_list may only contain list_item or task_item nodes.");
      }
      return { ...serializeListItem(item, "task_item"), checked: booleanAttribute(item.attrs.checked, "task_item checked") };
    })
  };
}

function serializeListItem(node: ProseMirrorNode, expectedType: string): MarkdownNode {
  if (node.type.name !== expectedType) {
    throw new Error(`Expected ${expectedType} inside a list.`);
  }

  return { type: "listItem", spread: false, children: node.content.content.map(serializeBlock) };
}

function serializeTable(node: ProseMirrorNode): MarkdownNode {
  const rows = node.content.content;
  const firstRow = rows[0];
  if (firstRow === undefined || firstRow.type.name !== "table_row") {
    throw new Error("table must contain table_row nodes.");
  }

  const align = firstRow.content.content.map((cell) => stringOrNull(cell.attrs.align, "table_cell align"));
  return {
    type: "table",
    align,
    children: rows.map((row) => {
      if (row.type.name !== "table_row") {
        throw new Error("table must contain table_row nodes.");
      }

      return {
        type: "tableRow",
        children: row.content.content.map((cell) => {
          if (cell.type.name !== "table_cell") {
            throw new Error("table_row may only contain table_cell nodes.");
          }
          if (cell.childCount !== 1 || cell.firstChild?.type.name !== "paragraph") {
            throw new Error("table_cell must contain exactly one paragraph for Markdown serialization.");
          }

          return { type: "tableCell", children: serializeInline(cell.firstChild) };
        })
      };
    })
  };
}

function serializeInline(node: ProseMirrorNode): MarkdownNode[] {
  return node.content.content.map((child) => {
    let value: MarkdownNode;
    if (child.isText) {
      value = { type: "text", value: child.text ?? "" };
    } else if (child.type.name === "hard_break") {
      value = { type: "break" };
    } else {
      throw new Error(`Unsupported ProseMirror inline node: ${child.type.name}.`);
    }

    return [...child.marks].reverse().reduce((wrapped, mark) => wrapMark(wrapped, mark.type.name, mark.attrs), value);
  });
}

function wrapMark(value: MarkdownNode, name: string, attrs: Readonly<Record<string, unknown>>): MarkdownNode {
  switch (name) {
    case "em": return { type: "emphasis", children: [value] };
    case "strong": return { type: "strong", children: [value] };
    case "strikethrough": return { type: "delete", children: [value] };
    case "code":
      if (value.type !== "text" || typeof value.value !== "string") {
        throw new Error("code marks may only contain text.");
      }
      return { type: "inlineCode", value: value.value };
    case "link":
      return { type: "link", url: requiredString(attrs.href, "link href"), title: stringOrNull(attrs.title, "link title"), children: [value] };
    default: throw new Error(`Unsupported ProseMirror mark: ${name}.`);
  }
}

function headingLevel(node: ProseMirrorNode): number {
  const level = positiveInteger(node.attrs.level, "heading level");
  if (level > 6) {
    throw new Error("heading level must be between 1 and 6.");
  }
  return level;
}

function positiveInteger(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function booleanAttribute(value: unknown, name: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${name} must be a boolean.`);
  }
  return value;
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string.`);
  }
  return value;
}

function stringOrNull(value: unknown, name: string): string | null {
  if (value !== null && typeof value !== "string") {
    throw new Error(`${name} must be a string or null.`);
  }
  return value;
}
