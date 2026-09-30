import { InputRule, inputRules } from "prosemirror-inputrules";
import type { ResolvedPos } from "prosemirror-model";
import { wrapInList } from "prosemirror-schema-list";
import type { EditorState, Transaction } from "prosemirror-state";
export function createMarkdownInputRules() {
  return inputRules({ rules: [new InputRule(/^(#{1,6}) $/, (state, match, start, end) => {
    if (excluded(state)) return null;
    const heading = state.schema.nodes.heading;
    return heading === undefined ? null : state.tr.delete(start, end).setBlockType(start, start, heading, { level: match[1]?.length ?? 1 });
  }), new InputRule(/^> $/, (state, _match, start, end) => {
    if (excluded(state)) return null;
    const quote = state.schema.nodes.blockquote;
    if (quote === undefined) return null;
    const transaction = state.tr.delete(start, end);
    const position = transaction.mapping.map(start);
    const range = transaction.doc.resolve(position).blockRange();
    return range === null ? null : transaction.wrap(range, [{ type: quote }]);
  }), listRule(/^[-*+] $/, "bullet_list"), orderedListRule(), new InputRule(/^```([\w-]+)? $/, (state, match, start, end) => {
    if (excluded(state)) return null;
    const code = state.schema.nodes.code_block;
    return code === undefined ? null : state.tr.delete(start, end).setBlockType(start, start, code, { language: match[1] ?? null });
  })] });
}
function listRule(expression: RegExp, name: "bullet_list" | "ordered_list", attrs: Readonly<Record<string, unknown>> | null = null) {
  return new InputRule(expression, (state, _match, start, end) => wrapList(state, name, attrs, start, end));
}

function orderedListRule(): InputRule {
  return new InputRule(/^(\d+)[.)] $/, (state, match, start, end) => {
    const order = Number.parseInt(match[1] ?? "", 10);
    return Number.isSafeInteger(order) && order > 0 ? wrapList(state, "ordered_list", { order }, start, end) : null;
  });
}

function wrapList(
  state: EditorState,
  name: "bullet_list" | "ordered_list",
  attrs: Readonly<Record<string, unknown>> | null,
  start: number,
  end: number
): Transaction | null {
  if (excluded(state)) return null;
  const type = state.schema.nodes[name];
  let result: Transaction | null = null;
  if (type !== undefined) {
    wrapInList(type, attrs)(state, (transaction) => {
      result = transaction.delete(transaction.mapping.map(start), transaction.mapping.map(end));
    });
  }
  return result;
}
function excluded(state: { readonly selection: { readonly $from: ResolvedPos } }) {
  for (let depth = state.selection.$from.depth; depth >= 0; depth -= 1) {
    if (["code_block", "raw_markdown_block", "table_cell"].includes(state.selection.$from.node(depth).type.name)) {
      return true;
    }
  }
  return false;
}
