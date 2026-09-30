import { Fragment, Slice, type Mark, type Node as ProseMirrorNode, type Schema } from "prosemirror-model";
import { Plugin, type EditorState, type Transaction } from "prosemirror-state";
import { isSafeUrl } from "./safe-url.js";

const DROPPED_ELEMENTS = new Set(["script", "style", "iframe", "object", "embed", "template", "noscript"]);

/** Unknown non-executable elements are unwrapped to their safe descendant text/structure. */
export const unsupportedPasteContentPolicy = "unwrap-safe-descendants";

export function createSafePastePlugin(): Plugin {
  return new Plugin({
    props: {
      handlePaste(view, event) {
        const html = event.clipboardData?.getData("text/html");
        const plainText = event.clipboardData?.getData("text/plain") ?? "";
        if ((event as ClipboardEvent & { readonly shiftKey?: boolean }).shiftKey === true) {
          return replaceSelectionWithPlainText(view.state, plainText, view.dispatch);
        }
        if (html === undefined || html.length === 0) {
          return false;
        }

        const slice = parsePastedHtml(html, view.state.schema);
        if (slice.content.size === 0) {
          return plainText.length > 0
            ? replaceSelectionWithPlainText(view.state, plainText, view.dispatch)
            : true;
        }

        const context = pasteContext(view.state);
        if (context === "code" || context === "raw") {
          return replaceSelectionWithPlainText(view.state, plainText || textFromSlice(slice), view.dispatch);
        }
        if (context === "table-cell") {
          return replaceSelectionWithInlineContent(view.state, inlineContent(slice, view.state.schema), view.dispatch);
        }

        view.dispatch(view.state.tr.replaceSelection(inlineSlice(slice)));
        return true;
      },
      handleDrop(_view, event, _slice, moved) {
        return !moved && (event.dataTransfer?.getData("text/html").length ?? 0) > 0;
      }
    }
  });
}

/** Converts the HTML allowlist into a closed ProseMirror slice without copying DOM attributes. */
export function parsePastedHtml(html: string, schema: Schema): Slice {
  const body = parseHtml(html).body;
  const blocks = Array.from(body.childNodes).flatMap((node) => parseBlock(node, schema));
  return new Slice(Fragment.fromArray(blocks), 0, 0);
}

function parseHtml(html: string): Document {
  if (typeof DOMParser === "undefined") {
    throw new Error("parsePastedHtml requires a DOMParser-capable environment.");
  }

  return new DOMParser().parseFromString(html, "text/html");
}

function parseBlock(node: globalThis.Node, schema: Schema): ProseMirrorNode[] {
  if (node.nodeType === node.TEXT_NODE) {
    return node.textContent?.trim().length ? [paragraph(schema, inlineText(schema, node.textContent))] : [];
  }
  if (!(node instanceof Element)) {
    return [];
  }

  const name = node.tagName.toLowerCase();
  if (DROPPED_ELEMENTS.has(name)) {
    return [];
  }

  if (/^h[1-6]$/u.test(name)) {
    return [schema.node("heading", { level: Number.parseInt(name.slice(1), 10) }, inlineChildren(node, schema))];
  }
  if (name === "p") {
    return [paragraph(schema, inlineChildren(node, schema))];
  }
  if (name === "blockquote") {
    const children = blocksFromChildren(node, schema);
    return children.length ? [schema.node("blockquote", null, children)] : [];
  }
  if (name === "ul" || name === "ol") {
    return parseList(node, schema, name);
  }
  if (name === "table") {
    return parseTable(node, schema);
  }
  if (name === "pre") {
    return [schema.node("code_block", { language: null }, inlineText(schema, node.textContent ?? ""))];
  }
  if (name === "hr") {
    return [schema.node("horizontal_rule")];
  }
  if (name === "br" || name === "a" || isInlineElement(name)) {
    return [paragraph(schema, inlineFromNode(node, schema))];
  }

  return blocksFromChildren(node, schema);
}

function parseList(element: Element, schema: Schema, name: "ul" | "ol"): ProseMirrorNode[] {
  const itemType = schema.nodes.list_item;
  const listType = schema.nodes[name === "ul" ? "bullet_list" : "ordered_list"];
  if (itemType === undefined || listType === undefined) {
    return [];
  }

  const items = Array.from(element.children)
    .filter((child) => child.tagName.toLowerCase() === "li")
    .map((item) => itemType.create(null, listItemBlocks(item, schema)));
  if (items.length === 0) {
    return [];
  }

  return [listType.create(name === "ol" ? { order: parseOrder(element) } : null, items)];
}

function listItemBlocks(element: Element, schema: Schema): ProseMirrorNode[] {
  const blocks: ProseMirrorNode[] = [];
  let inline: ProseMirrorNode[] = [];
  const flushInline = (): void => {
    if (inline.length > 0) {
      blocks.push(paragraph(schema, inline));
      inline = [];
    }
  };

  for (const child of Array.from(element.childNodes)) {
    if (isBlockElement(child)) {
      flushInline();
      blocks.push(...parseBlock(child, schema));
    } else {
      inline.push(...inlineFromNode(child, schema));
    }
  }
  flushInline();

  return blocks.length ? blocks : [paragraph(schema, [])];
}

function parseTable(element: Element, schema: Schema): ProseMirrorNode[] {
  const tableType = schema.nodes.table;
  const rowType = schema.nodes.table_row;
  const cellType = schema.nodes.table_cell;
  if (tableType === undefined || rowType === undefined || cellType === undefined) {
    return [];
  }

  const sourceRows = tableRows(element)
    .map((row) => ({ row, cells: Array.from(row.children).filter((cell) => ["td", "th"].includes(cell.tagName.toLowerCase())) }))
    .filter(({ cells }) => cells.length > 0);
  const width = Math.max(0, ...sourceRows.map(({ cells }) => cells.length));
  if (width === 0) {
    return [];
  }

  const rows = sourceRows.map(({ row, cells }) => rowType.create(null, Array.from({ length: width }, (_value, index) => {
    const cell = cells[index];
    const header = cell?.tagName.toLowerCase() === "th" || row.parentElement?.tagName.toLowerCase() === "thead";
    return cellType.create({ header, align: null }, paragraph(schema, cell === undefined ? [] : inlineChildren(cell, schema)));
  })));

  return [tableType.create(null, rows)];
}

function tableRows(element: Element): Element[] {
  const rows: Element[] = [];
  for (const child of Array.from(element.children)) {
    const name = child.tagName.toLowerCase();
    if (name === "tr") {
      rows.push(child);
    } else if (name === "thead" || name === "tbody" || name === "tfoot") {
      rows.push(...Array.from(child.children).filter((row) => row.tagName.toLowerCase() === "tr"));
    }
  }
  return rows;
}

function blocksFromChildren(element: Element, schema: Schema): ProseMirrorNode[] {
  return Array.from(element.childNodes).flatMap((child) => parseBlock(child, schema));
}

function inlineChildren(element: Element, schema: Schema, marks: readonly Mark[] = []): ProseMirrorNode[] {
  return Array.from(element.childNodes).flatMap((child) => inlineFromNode(child, schema, marks));
}

function inlineFromNode(node: globalThis.Node, schema: Schema, marks: readonly Mark[] = []): ProseMirrorNode[] {
  if (node.nodeType === node.TEXT_NODE) {
    return inlineText(schema, node.textContent ?? "", marks);
  }
  if (!(node instanceof Element)) {
    return [];
  }

  const name = node.tagName.toLowerCase();
  if (DROPPED_ELEMENTS.has(name)) {
    return [];
  }
  if (name === "br") {
    const type = schema.nodes.hard_break;
    return type === undefined ? [] : [type.create()];
  }

  const mark = markForElement(node, schema);
  return inlineChildren(node, schema, mark === undefined ? marks : [...marks, mark]);
}

function markForElement(element: Element, schema: Schema): Mark | undefined {
  const name = element.tagName.toLowerCase();
  const markName = name === "em" || name === "i" ? "em"
    : name === "strong" || name === "b" ? "strong"
      : name === "s" || name === "del" || name === "strike" ? "strikethrough"
        : name === "code" ? "code" : undefined;
  if (markName !== undefined) {
    return schema.marks[markName]?.create();
  }

  if (name === "a") {
    const href = element.getAttribute("href");
    return href !== null && isSafeUrl(href) ? schema.marks.link?.create({ href, title: null }) : undefined;
  }

  return undefined;
}

function paragraph(schema: Schema, content: readonly ProseMirrorNode[]): ProseMirrorNode {
  return schema.node("paragraph", null, content);
}

function inlineText(schema: Schema, value: string, marks: readonly Mark[] = []): ProseMirrorNode[] {
  return value.length === 0 ? [] : [schema.text(value, marks)];
}

function isInlineElement(name: string): boolean {
  return ["em", "i", "strong", "b", "s", "del", "strike", "code", "span"].includes(name);
}

function isBlockElement(node: globalThis.Node): boolean {
  return node instanceof Element && ["p", "blockquote", "ul", "ol", "table", "pre", "hr", "div"].includes(node.tagName.toLowerCase());
}

function parseOrder(element: Element): number {
  const value = Number.parseInt(element.getAttribute("start") ?? "1", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function pasteContext(state: EditorState): "code" | "raw" | "table-cell" | "normal" {
  for (let depth = state.selection.$from.depth; depth >= 0; depth -= 1) {
    const name = state.selection.$from.node(depth).type.name;
    if (name === "code_block") {
      return "code";
    }
    if (name === "raw_markdown_block") {
      return "raw";
    }
    if (name === "table_cell") {
      return "table-cell";
    }
  }
  return "normal";
}

function inlineSlice(slice: Slice): Slice {
  const first = slice.content.firstChild;
  return slice.content.childCount === 1 && first?.isTextblock === true
    ? new Slice(first.content, 0, 0)
    : slice;
}

function inlineContent(slice: Slice, schema: Schema): Fragment {
  const first = slice.content.firstChild;
  if (slice.content.childCount === 1 && first?.isTextblock === true) {
    return first.content;
  }

  const text = textFromSlice(slice);
  return text.length > 0 ? Fragment.from(schema.text(text)) : Fragment.empty;
}

function textFromSlice(slice: Slice): string {
  return slice.content.textBetween(0, slice.content.size, "\n", (node) =>
    node.type.name === "raw_markdown_block" && typeof node.attrs.source === "string" ? node.attrs.source : ""
  );
}

function replaceSelectionWithPlainText(
  state: EditorState,
  text: string,
  dispatch: (transaction: Transaction) => void
): boolean {
  if (text.length === 0) {
    return true;
  }

  const { from, to } = state.selection;
  dispatch(state.tr.insertText(text, from, to));
  return true;
}

function replaceSelectionWithInlineContent(
  state: EditorState,
  content: Fragment,
  dispatch: (transaction: Transaction) => void
): boolean {
  dispatch(state.tr.replaceSelection(new Slice(content, 0, 0)));
  return true;
}
