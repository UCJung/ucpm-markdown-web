import { redo, undo } from "prosemirror-history";
export const editingKeymap = { "Mod-z": undo, "Mod-y": redo, "Shift-Mod-z": redo };
