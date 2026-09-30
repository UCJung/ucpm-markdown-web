import type { MarkSpec, NodeSpec, Schema } from "prosemirror-model";
import type { Command, EditorState, Plugin, Transaction } from "prosemirror-state";

export type ExtensionNodes = Readonly<Record<string, NodeSpec>>;

export type ExtensionMarks = Readonly<Record<string, MarkSpec>>;

export type ExtensionKeymap = Readonly<Record<string, Command>>;

export interface ExtensionCommandContext {
  readonly state: EditorState;
  readonly dispatch: (transaction: Transaction) => void;
}

export type ExtensionCommand = (context: ExtensionCommandContext) => boolean;

export interface ExtensionLifecycleContext {
  readonly extension: Extension;
  readonly schema: Schema;
  readonly state: EditorState;
}

export interface Extension {
  readonly name: string;
  readonly nodes?: ExtensionNodes;
  readonly marks?: ExtensionMarks;
  readonly plugins?: readonly Plugin[];
  readonly keymap?: ExtensionKeymap;
  readonly commands?: Readonly<Record<string, ExtensionCommand>>;
  readonly onCreate?: (context: ExtensionLifecycleContext) => void;
  readonly onDestroy?: (context: ExtensionLifecycleContext) => void;
}

export const extensionApiVersion = "0.0.0";
