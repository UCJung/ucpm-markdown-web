import { type Schema } from "@uc-markdown-web/core";
import { type Mark, type Node as ProseMirrorNode } from "prosemirror-model";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { createMarkdownSchema } from "./schema.js";

interface MarkdownNode {
  readonly type: string;
  readonly children?: readonly MarkdownNode[];
  readonly value?: string;
  readonly depth?: number;
  readonly url?: string;
  readonly title?: string | null;
  readonly checked?: boolean | null;
  readonly ordered?: boolean;
  readonly start?: number | null;
  readonly lang?: string | null;
  readonly align?: readonly ("left" | "right" | "center" | null)[];
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(source: string, schema: Schema = createMarkdownSchema()): ProseMirrorNode {
  const root = parser.parse(source) as unknown as MarkdownNode;
  const children = requireChildren(root, "root").map((node) => parseBlock(node, schema));

  if (children.length === 0) {
    const emptyDocument = schema.topNodeType.createAndFill();
    if (emptyDocument === null) {
      throw new Error("Markdown schema cannot create an empty document.");
    }

    return emptyDocument;
  }

  return schema.node("doc", null, children);
}

function parseBlock(node: MarkdownNode, schema: Schema): ProseMirrorNode {
  switch (node.type) {
    case "paragraph":
      return schema.node("paragraph", null, parseInline(requireChildren(node, node.type), schema));
    case "heading":
      return schema.node("heading", { level: requireHeadingLevel(node) }, parseInline(requireChildren(node, node.type), schema));
    case "blockquote":
      return schema.node("blockquote", null, requireChildren(node, node.type).map((child) => parseBlock(child, schema)));
    case "thematicBreak":
      return schema.node("horizontal_rule");
    case "list":
      return parseList(node, schema);
    case "code":
      return schema.node("code_block", { language: node.lang ?? null }, textContent(schema, node.value ?? ""));
    case "table":
      return parseTable(node, schema);
    case "html":
      throw new Error("Raw HTML preservation is not available until TASK-02.");
    default:
      throw new Error(`Unsupported Markdown block: ${node.type}.`);
  }
}

function parseList(node: MarkdownNode, schema: Schema): ProseMirrorNode {
  const items = requireChildren(node, "list");
  const taskStates = items.map((item) => item.checked);
  const hasTaskItems = taskStates.some((checked) => typeof checked === "boolean");

  if (hasTaskItems && taskStates.some((checked) => typeof checked !== "boolean")) {
    throw new Error("Mixed task and regular list items are not supported.");
  }

  if (hasTaskItems) {
    return schema.node("task_list", null, items.map((item) => schema.node("task_item", { checked: item.checked }, requireChildren(item, "listItem").map((child) => parseBlock(child, schema)))));
  }

  return schema.node(
    node.ordered === true ? "ordered_list" : "bullet_list",
    node.ordered === true ? { order: node.start ?? 1 } : null,
    items.map((item) => schema.node("list_item", null, requireChildren(item, "listItem").map((child) => parseBlock(child, schema))))
  );
}

function parseTable(node: MarkdownNode, schema: Schema): ProseMirrorNode {
  const rows = requireChildren(node, "table");
  const alignments = node.align ?? [];

  return schema.node("table", null, rows.map((row, rowIndex) => schema.node("table_row", null, requireChildren(row, "tableRow").map((cell, columnIndex) => schema.node(
    "table_cell",
    { align: alignments[columnIndex] ?? null, header: rowIndex === 0 },
    schema.node("paragraph", null, parseInline(requireChildren(cell, "tableCell"), schema))
  )))));
}

function parseInline(nodes: readonly MarkdownNode[], schema: Schema, marks: readonly Mark[] = []): ProseMirrorNode[] {
  return nodes.flatMap((node) => {
    switch (node.type) {
      case "text": return textContent(schema, node.value ?? "", marks);
      case "emphasis": return parseInline(requireChildren(node, node.type), schema, [...marks, schema.mark("em")]);
      case "strong": return parseInline(requireChildren(node, node.type), schema, [...marks, schema.mark("strong")]);
      case "delete": return parseInline(requireChildren(node, node.type), schema, [...marks, schema.mark("strikethrough")]);
      case "link": return parseInline(requireChildren(node, node.type), schema, [...marks, schema.mark("link", { href: node.url ?? "", title: node.title ?? null })]);
      case "inlineCode": return textContent(schema, node.value ?? "", [...marks, schema.mark("code")]);
      case "break": return [schema.node("hard_break")];
      case "html": throw new Error("Raw inline HTML preservation is not available until TASK-02.");
      default: throw new Error(`Unsupported Markdown inline node: ${node.type}.`);
    }
  });
}

function textContent(schema: Schema, value: string, marks: readonly Mark[] = []): ProseMirrorNode[] {
  return value.length === 0 ? [] : [schema.text(value, marks)];
}

function requireChildren(node: MarkdownNode, type: string): readonly MarkdownNode[] {
  if (node.children === undefined) {
    throw new Error(`Markdown ${type} node must have children.`);
  }

  return node.children;
}

function requireHeadingLevel(node: MarkdownNode): number {
  if (node.depth === undefined || node.depth < 1 || node.depth > 6) {
    throw new Error("Markdown heading depth must be between 1 and 6.");
  }

  return node.depth;
}
