import type {
  Extension,
  ExtensionCommand,
  ExtensionLifecycleContext
} from "@uc-markdown-web/extension-api";
import { history } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { Node as ProseMirrorNode, type Schema } from "prosemirror-model";
import { EditorState, type Plugin, type Transaction } from "prosemirror-state";

import { baseKeymap, createEditorCommands, type EditorCommands } from "./commands.js";
import { createEditorSchema } from "./schema.js";

export interface EditorOptions {
  readonly extensions?: readonly Extension[];
  readonly schema?: Schema;
  readonly doc?: ProseMirrorNode | Readonly<Record<string, unknown>>;
}

export type EditorListener = (state: EditorState, transactions: readonly Transaction[]) => void;

export interface Editor {
  readonly schema: Schema;
  readonly commands: EditorCommands;
  readonly extensionCommands: Readonly<Record<string, () => boolean>>;
  getState(): EditorState;
  dispatch(transaction: Transaction): boolean;
  subscribe(listener: EditorListener): () => void;
  destroy(): void;
}

export function createEditor(options: EditorOptions = {}): Editor {
  return new HeadlessEditor(options);
}

class HeadlessEditor implements Editor {
  readonly schema: Schema;
  readonly commands: EditorCommands;
  readonly extensionCommands: Readonly<Record<string, () => boolean>>;

  private state: EditorState;
  private readonly extensions: readonly Extension[];
  private readonly listeners = new Set<EditorListener>();
  private readonly initializedExtensions: Extension[] = [];
  private destroyed = false;
  private notifying = false;

  constructor(options: EditorOptions) {
    this.extensions = options.extensions ?? [];
    this.schema = createEditorSchema(this.extensions, options.schema);

    const plugins = createPlugins(this.extensions);
    this.state = EditorState.create({
      schema: this.schema,
      doc: createInitialDocument(this.schema, options.doc),
      plugins
    });
    this.commands = createEditorCommands(this.schema, (command) => this.runCommand(command));
    this.extensionCommands = createExtensionCommands(this.extensions, (command) =>
      this.runExtensionCommand(command)
    );

    this.initializeExtensions();
  }

  getState(): EditorState {
    return this.state;
  }

  /**
   * Applies a transaction before synchronously notifying listeners.
   * Listener errors are reported after the transaction remains applied.
   */
  dispatch(transaction: Transaction): boolean {
    this.assertActive();

    if (this.notifying) {
      throw new Error("Cannot dispatch while notifying subscribers.");
    }

    const result = this.state.applyTransaction(transaction);

    if (result.transactions.length === 0) {
      return false;
    }

    this.state = result.state;
    this.notifyListeners(result.transactions);
    return true;
  }

  subscribe(listener: EditorListener): () => void {
    this.assertActive();
    this.listeners.add(listener);
    let active = true;

    return () => {
      if (!active) {
        return;
      }

      active = false;
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.listeners.clear();
    throwCollected(this.destroyExtensions(), "Editor destroy hooks failed.");
  }

  private runCommand(command: (state: EditorState, dispatch?: (transaction: Transaction) => void) => boolean): boolean {
    this.assertActive();
    let applied = false;
    const commandResult = command(this.state, (transaction) => {
      applied = this.dispatch(transaction) || applied;
    });

    return commandResult && applied;
  }

  private runExtensionCommand(command: ExtensionCommand): boolean {
    this.assertActive();
    let applied = false;
    const commandResult = command({
      state: this.state,
      dispatch: (transaction) => {
        applied = this.dispatch(transaction) || applied;
      }
    });

    return commandResult && applied;
  }

  private initializeExtensions(): void {
    for (const extension of this.extensions) {
      this.initializedExtensions.push(extension);

      try {
        extension.onCreate?.(this.createLifecycleContext(extension));
      } catch (error) {
        this.destroyed = true;
        const cleanupErrors = this.destroyExtensions();
        throwCollected([error, ...cleanupErrors], "Editor creation hooks failed.");
      }
    }
  }

  private destroyExtensions(): unknown[] {
    const errors: unknown[] = [];

    for (const extension of [...this.initializedExtensions].reverse()) {
      try {
        extension.onDestroy?.(this.createLifecycleContext(extension));
      } catch (error) {
        errors.push(error);
      }
    }

    this.initializedExtensions.length = 0;
    return errors;
  }

  private createLifecycleContext(extension: Extension): ExtensionLifecycleContext {
    return {
      extension,
      schema: this.schema,
      state: this.state
    };
  }

  private notifyListeners(transactions: readonly Transaction[]): void {
    const errors: unknown[] = [];
    const listenerSnapshot = [...this.listeners];

    this.notifying = true;
    try {
      for (const listener of listenerSnapshot) {
        try {
          listener(this.state, transactions);
        } catch (error) {
          errors.push(error);
        }
      }
    } finally {
      this.notifying = false;
    }

    throwCollected(errors, "Editor listener callbacks failed after the transaction was applied.");
  }

  private assertActive(): void {
    if (this.destroyed) {
      throw new Error("Editor has been destroyed.");
    }
  }
}

function createPlugins(extensions: readonly Extension[]): readonly Plugin[] {
  const plugins: Plugin[] = [history()];

  for (const extension of extensions) {
    plugins.push(...(extension.plugins ?? []));

    if (extension.keymap !== undefined) {
      plugins.push(keymap(extension.keymap));
    }
  }

  plugins.push(keymap(baseKeymap));

  return plugins;
}

function createExtensionCommands(
  extensions: readonly Extension[],
  runCommand: (command: ExtensionCommand) => boolean
): Readonly<Record<string, () => boolean>> {
  const commands: Record<string, () => boolean> = {};

  for (const extension of extensions) {
    for (const [name, command] of Object.entries(extension.commands ?? {})) {
      if (name in commands) {
        throw new Error(`Duplicate extension command name: ${name}.`);
      }

      commands[name] = () => runCommand(command);
    }
  }

  return Object.freeze(commands);
}

function createInitialDocument(
  schema: Schema,
  document: EditorOptions["doc"]
): ProseMirrorNode {
  if (document === undefined) {
    const defaultDocument = schema.topNodeType.createAndFill();

    if (defaultDocument === null) {
      throw new Error("Unable to create the default editor document.");
    }

    return defaultDocument;
  }

  if (document instanceof ProseMirrorNode) {
    if (document.type.schema !== schema) {
      throw new Error("Initial document schema does not match the editor schema.");
    }

    return validateTopNode(schema, document);
  }

  const parsedDocument = schema.nodeFromJSON(document);
  return validateTopNode(schema, parsedDocument);
}

function validateTopNode(schema: Schema, document: ProseMirrorNode): ProseMirrorNode {
  if (document.type !== schema.topNodeType) {
    throw new Error(`Initial document must be a "${schema.topNodeType.name}" node.`);
  }

  document.check();
  return document;
}

function throwCollected(errors: readonly unknown[], message: string): void {
  if (errors.length > 0) {
    throw new AggregateError(errors, message);
  }
}
