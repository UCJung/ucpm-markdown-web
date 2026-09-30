import type { ExtensionCommand } from "@uc-markdown-web/extension-api";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import { TextSelection, type EditorState } from "prosemirror-state";

export function setCursor(position: number): ExtensionCommand {
  return ({ state, dispatch }) => {
    if (!Number.isInteger(position) || position < 0 || position > state.doc.content.size) return false;
    try { dispatch(state.tr.setSelection(TextSelection.create(state.doc, position))); return true; } catch { return false; }
  };
}
export function wrapSelectionInList(kind: "bullet" | "ordered"): ExtensionCommand {
  return ({ state, dispatch }) => {
    const type = kind === "bullet" ? state.schema.nodes.bullet_list : state.schema.nodes.ordered_list;
    return type === undefined ? false : wrapInList(type)(state, dispatch);
  };
}
export function convertSelectionToCodeBlock(language: string | null = null): ExtensionCommand {
  return ({ state, dispatch }) => {
    const type = state.schema.nodes.code_block;
    if (type === undefined || state.selection.$from.parent.type.name === "raw_markdown_block") return false;
    const tr = state.tr.setBlockType(state.selection.from, state.selection.to, type, { language });
    if (!tr.docChanged) return false;
    dispatch(tr); return true;
  };
}
export function insertTable(rows = 2, columns = 2): ExtensionCommand {
  return ({ state, dispatch }) => {
    if (!Number.isInteger(rows) || !Number.isInteger(columns) || rows < 1 || columns < 1) return false;
    const tableType = state.schema.nodes.table;
    const rowType = state.schema.nodes.table_row;
    const cellType = state.schema.nodes.table_cell;
    const paragraph = state.schema.nodes.paragraph;
    if (!tableType || !rowType || !cellType || !paragraph || state.selection.$from.parent.type.name === "raw_markdown_block") return false;
    const row = (index: number) => rowType.create(null, Array.from({ length: columns }, () => cellType.create({ header: index === 0 }, paragraph.create())));
    const table = tableType.create(null, Array.from({ length: rows }, (_, index) => row(index)));
    dispatch(state.tr.replaceSelectionWith(table)); return true;
  };
}
export function setSelection(from: number, to: number): ExtensionCommand {
  return ({ state, dispatch }) => {
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < from || to > state.doc.content.size) return false;
    try { dispatch(state.tr.setSelection(TextSelection.create(state.doc, from, to))); return true; } catch { return false; }
  };
}
export function addTableRow(): ExtensionCommand { return ({ state, dispatch }) => {
  const found = ancestor(state, "table"); if (found === undefined) return false;
  const row = state.schema.nodes.table_row; const cell = state.schema.nodes.table_cell; const paragraph = state.schema.nodes.paragraph;
  const count = rectangularTableWidth(found.node);
  if (!row || !cell || !paragraph || count < 1) return false;
  const templateRow = found.node.firstChild;
  dispatch(state.tr.insert(found.position + found.node.nodeSize - 1, row.create(null, Array.from({ length: count }, (_value, index) => {
    const template = templateRow?.child(index);
    return cell.create({ header: false, align: template?.attrs.align ?? null }, paragraph.create());
  })))); return true;
}; }
export function addTableCell(): ExtensionCommand { return ({ state, dispatch }) => {
  const found = ancestor(state, "table"); if (found === undefined) return false;
  const cell = state.schema.nodes.table_cell; const paragraph = state.schema.nodes.paragraph;
  if (!cell || !paragraph || rectangularTableWidth(found.node) < 1) return false;
  let transaction = state.tr;
  let rowPosition = found.position + 1;
  const inserts = found.node.content.content.map((row) => {
    const position = rowPosition + row.nodeSize - 1;
    rowPosition += row.nodeSize;
    return position;
  });
  for (let index = inserts.length - 1; index >= 0; index -= 1) {
    const position = inserts[index];
    if (position === undefined) return false;
    const row = found.node.child(index);
    const template = row.lastChild;
    transaction = transaction.insert(position, cell.create({ header: template?.attrs.header === true, align: template?.attrs.align ?? null }, paragraph.create()));
  }
  dispatch(transaction); return true;
}; }
function rectangularTableWidth(table: ProseMirrorNode): number {
  if (table.childCount < 1) return 0;
  const width = table.child(0).childCount;
  if (width < 1) return 0;
  for (let index = 0; index < table.childCount; index += 1) { const row = table.child(index); if (row.type.name !== "table_row" || row.childCount !== width) return 0; }
  return width;
}
function ancestor(state: EditorState, name: string) {
  for (let depth = state.selection.$from.depth; depth > 0; depth -= 1) { const node = state.selection.$from.node(depth); if (node.type.name === name) return { node, position: state.selection.$from.before(depth) }; }
  return undefined;
}
