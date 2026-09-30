export { createEditor } from "./editor.js";
export { createEditorSchema } from "./schema.js";
export type {
  Editor,
  EditorListener,
  EditorOptions
} from "./editor.js";
export type { EditorCommands } from "./commands.js";
export type { Extension } from "@uc-markdown-web/extension-api";
export type { MarkSpec, NodeSpec, Schema } from "prosemirror-model";

export const corePackageName = "@uc-markdown-web/core";
