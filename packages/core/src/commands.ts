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

  if (strong === undefined || em === undefined || code === undefined || paragraph === undefined) {
    throw new Error("The editor schema is missing required base specs.");
  }

  return {
    toggleBold: () => runCommand(toggleMark(strong)),
    toggleItalic: () => runCommand(toggleMark(em)),
    toggleCode: () => runCommand(toggleMark(code)),
    setParagraph: () => runCommand(setBlockType(paragraph)),
    undo: () => runCommand(undo),
    redo: () => runCommand(redo)
  };
}

export { baseKeymap };
