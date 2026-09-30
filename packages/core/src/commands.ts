import { baseKeymap, setBlockType, toggleMark } from "prosemirror-commands";
import { redo, undo } from "prosemirror-history";
import type { Command } from "prosemirror-state";
import type { Schema } from "prosemirror-model";

export interface EditorCommands {
  readonly toggleBold: () => boolean;
  readonly toggleItalic: () => boolean;
  readonly toggleCode: () => boolean;
  readonly setParagraph: () => boolean;
  readonly undo: () => boolean;
  readonly redo: () => boolean;
}

export function createEditorCommands(
  schema: Schema,
  runCommand: (command: Command) => boolean
): EditorCommands {
  const strong = schema.marks.strong;
  const em = schema.marks.em;
  const code = schema.marks.code;
  const paragraph = schema.nodes.paragraph;

  return {
    toggleBold: () => strong === undefined ? false : runCommand(toggleMark(strong)),
    toggleItalic: () => em === undefined ? false : runCommand(toggleMark(em)),
    toggleCode: () => code === undefined ? false : runCommand(toggleMark(code)),
    setParagraph: () => paragraph === undefined ? false : runCommand(setBlockType(paragraph)),
    undo: () => runCommand(undo),
    redo: () => runCommand(redo)
  };
}

export { baseKeymap };
