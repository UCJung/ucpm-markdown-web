import { InputRule, inputRules } from "prosemirror-inputrules";
import { wrapInList } from "prosemirror-schema-list";
export function createMarkdownInputRules() {
  return inputRules({ rules: [new InputRule(/^(#{1,6}) $/, (state, match, start, end) => {
    if (["code_block", "raw_markdown_block"].includes(state.selection.$from.parent.type.name)) return null;
    const heading = state.schema.nodes.heading;
    return heading === undefined ? null : state.tr.delete(start, end).setBlockType(start, start, heading, { level: match[1]?.length ?? 1 });
  }), new InputRule(/^> $/, (state, _match, start, end) => {
    if (excluded(state)) return null;
    const quote = state.schema.nodes.blockquote;
    const range = state.tr.doc.resolve(start).blockRange();
    return quote === undefined || range === null ? null : state.tr.delete(start, end).wrap(range, [{ type: quote }]);
  }), listRule(/^[-*+] $/, "bullet_list"), listRule(/^\d+[.)] $/, "ordered_list"), new InputRule(/^```([\w-]+)? $/, (state, match, start, end) => {
    if (excluded(state)) return null;
    const code = state.schema.nodes.code_block;
    return code === undefined ? null : state.tr.delete(start, end).setBlockType(start, start, code, { language: match[1] ?? null });
  })] });
}
function listRule(expression: RegExp, name: "bullet_list" | "ordered_list") { return new InputRule(expression, (state, _match, start, end) => {
  if (excluded(state)) return null; const type = state.schema.nodes[name]; let result = null;
  if (type !== undefined) wrapInList(type)(state, (transaction) => { result = transaction.delete(start, end); });
  return result;
}); }
function excluded(state: { readonly selection: { readonly $from: { readonly parent: { readonly type: { readonly name: string } } } } }) { return ["code_block", "raw_markdown_block"].includes(state.selection.$from.parent.type.name); }
