import type { Extension } from "@uc-markdown-web/extension-api";
import { addTableCell, addTableRow, convertSelectionToCodeBlock, insertTable, setCursor, setSelection, wrapSelectionInList } from "./commands.js";
import { createMarkdownInputRules } from "./input-rules.js";
import { editingKeymap } from "./keymap.js";

export function createEditingExtension(): Extension {
  return {
    name: "editing",
    plugins: [createMarkdownInputRules()],
    keymap: editingKeymap,
    commands: {
      setCursor: setCursor(1), setSelection: setSelection(1, 1), bulletList: wrapSelectionInList("bullet"), orderedList: wrapSelectionInList("ordered"),
      codeBlock: convertSelectionToCodeBlock(), insertTable: insertTable(), addTableRow: addTableRow(), addTableCell: addTableCell()
    }
  };
}

export { addTableCell, addTableRow, convertSelectionToCodeBlock, insertTable, setCursor, setSelection, wrapSelectionInList } from "./commands.js";
export { createMarkdownInputRules } from "./input-rules.js";
export { editingKeymap } from "./keymap.js";

export const extensionsPackageName = "@uc-markdown-web/extensions";
