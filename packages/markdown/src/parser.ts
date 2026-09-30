import { type Schema } from "@uc-markdown-web/core";
import { type Mark, type Node as ProseMirrorNode } from "prosemirror-model";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { createMarkdownSchema } from "./schema.js";

interface MarkdownNode {
  readonly type: string;
  readonly children?: readonly MarkdownNode[];
  readonly position?: SourcePosition;
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

interface SourcePosition {
  readonly start?: { readonly offset?: number };
  readonly end?: { readonly offset?: number };
}

interface SourceRange {
  readonly start: number;
  readonly end: number;
}

interface SourceLine extends SourceRange {
  readonly text: string;
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function parseMarkdown(source: string, schema: Schema = createMarkdownSchema()): ProseMirrorNode {
  const root = parser.parse(source) as unknown as MarkdownNode;
  const children = parseRootChildren(requireChildren(root, "root"), source, schema);

  if (children.length === 0) {
    const emptyDocument = schema.topNodeType.createAndFill();
    if (emptyDocument === null) {
      throw new Error("Markdown schema cannot create an empty document.");
    }

    return emptyDocument;
  }

  return schema.node("doc", null, children);
}

function parseRootChildren(
  nodes: readonly MarkdownNode[],
  source: string,
  schema: Schema
): ProseMirrorNode[] {
  const explicitRawRanges = findExplicitRawRanges(source);
  const parsed: ProseMirrorNode[] = [];
  let nodeIndex = 0;

  while (nodeIndex < nodes.length) {
    const node = nodes[nodeIndex];
    if (node === undefined) {
      break;
    }

    const nodeRange = requireSourceRange(node, source, "Markdown block");
    const explicitRawRange = explicitRawRanges.find((range) => rangesOverlap(range, nodeRange));

    if (node.type === "html") {
      parsed.push(rawBlock(schema, source.slice(nodeRange.start, nodeRange.end)));
      nodeIndex += 1;
      continue;
    }

    if (explicitRawRange !== undefined) {
      const rawRange = containsRange(nodeRange, explicitRawRange) ? nodeRange : explicitRawRange;
      parsed.push(rawBlock(schema, source.slice(rawRange.start, rawRange.end)));
      nodeIndex = skipOverlappingNodes(nodes, nodeIndex + 1, rawRange, source);
      continue;
    }

    if (isSupportedBlock(node.type)) {
      parsed.push(parseBlock(node, schema));
    } else {
      parsed.push(rawBlock(schema, source.slice(nodeRange.start, nodeRange.end)));
    }

    nodeIndex += 1;
  }

  return parsed;
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

function isSupportedBlock(type: string): boolean {
  return ["paragraph", "heading", "blockquote", "thematicBreak", "list", "code", "table"].includes(type);
}

function rawBlock(schema: Schema, source: string): ProseMirrorNode {
  if (source.length === 0) {
    throw new Error("raw_markdown_block source must not be empty.");
  }

  return schema.node("raw_markdown_block", { source });
}

function requireSourceRange(node: MarkdownNode, source: string, label: string): SourceRange {
  const start = node.position?.start?.offset;
  const end = node.position?.end?.offset;

  if (start === undefined || end === undefined || start < 0 || end < start || end > source.length) {
    throw new Error(`${label} is missing a valid source position.`);
  }

  return { start, end };
}

function skipOverlappingNodes(
  nodes: readonly MarkdownNode[],
  startIndex: number,
  range: SourceRange,
  source: string
): number {
  let index = startIndex;

  while (index < nodes.length) {
    const next = nodes[index];
    if (next === undefined || !rangesOverlap(requireSourceRange(next, source, "Markdown block"), range)) {
      break;
    }
    index += 1;
  }

  return index;
}

function rangesOverlap(left: SourceRange, right: SourceRange): boolean {
  return left.start < right.end && right.start < left.end;
}

function containsRange(container: SourceRange, content: SourceRange): boolean {
  return container.start <= content.start && container.end >= content.end;
}

function findExplicitRawRanges(source: string): readonly SourceRange[] {
  const lines = sourceLines(source);
  const ranges: SourceRange[] = [];
  let fencedCode: string | undefined;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }

    const content = containerContent(line.text);
    const fence = codeFence(content);
    if (fencedCode !== undefined) {
      if (fence !== undefined && fence[0] === fencedCode[0] && fence.length >= fencedCode.length) {
        fencedCode = undefined;
      }
      continue;
    }
    if (fence !== undefined) {
      fencedCode = fence;
      continue;
    }
    if (isIndentedCode(line.text) || !isRawOpening(content)) {
      continue;
    }

    const closingIndex = findRawClosingLine(lines, index + 1, content);
    if (closingIndex === undefined) {
      continue;
    }

    const closing = lines[closingIndex];
    if (closing === undefined) {
      continue;
    }

    ranges.push({ start: line.start, end: closing.end });
    index = closingIndex;
  }

  return ranges;
}

function findRawClosingLine(lines: readonly SourceLine[], startIndex: number, opening: string): number | undefined {
  const closing = opening === "$$" ? "$$" : ":::";

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) {
      continue;
    }
    if (containerContent(line.text).trim() === closing) {
      return index;
    }
  }

  return undefined;
}

function sourceLines(source: string): readonly SourceLine[] {
  const lines: SourceLine[] = [];
  const matcher = /\r\n|\n|\r/g;
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(source)) !== null) {
    lines.push({ start, end: match.index, text: source.slice(start, match.index) });
    start = matcher.lastIndex;
  }

  if (start < source.length) {
    lines.push({ start, end: source.length, text: source.slice(start) });
  }

  return lines;
}

function containerContent(line: string): string {
  let content = line;
  let changed = true;

  while (changed) {
    changed = false;
    const quote = content.match(/^ {0,3}> ?/);
    if (quote !== null) {
      content = content.slice(quote[0].length);
      changed = true;
      continue;
    }
    const list = content.match(/^ {0,3}(?:[-+*]|\d+[.)]) +(?:\[[ xX]\] +)?/);
    if (list !== null) {
      content = content.slice(list[0].length);
      changed = true;
    }
  }

  return content.replace(/^ {1,3}/, "");
}

function codeFence(content: string): string | undefined {
  const match = content.match(/^ {0,3}(`{3,}|~{3,})/);
  return match?.[1];
}

function isIndentedCode(line: string): boolean {
  return /^(?: {4}|\t)/.test(line);
}

function isRawOpening(content: string): boolean {
  return content.trim() === "$$" || /^:::[A-Za-z][\w-]*(?:[ \t].*)?$/.test(content.trim());
}
