import { redo, undo } from "prosemirror-history";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import type { Command } from "prosemirror-state";

export function createEditingKeymap() {
  return {
    "Mod-z": undo,
    "Mod-y": redo,
    "Shift-Mod-z": redo,
    Enter: listItemCommand(splitListItem),
    Tab: listItemCommand(sinkListItem),
    "Shift-Tab": listItemCommand(liftListItem)
  };
}

export const editingKeymap = createEditingKeymap();

function listItemCommand(factory: typeof splitListItem | typeof sinkListItem | typeof liftListItem): Command {
  return (state, dispatch, view) => {
    const item = state.schema.nodes.list_item;
    return item === undefined ? false : factory(item)(state, dispatch, view);
  };
}
