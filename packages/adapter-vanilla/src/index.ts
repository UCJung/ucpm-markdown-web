import { createEditor } from "@uc-markdown-web/core";
import { createEditingExtension, createSafeEditorView } from "@uc-markdown-web/extensions";
import { createMarkdownSchema, parseMarkdown, serializeMarkdown } from "@uc-markdown-web/markdown";

type CoreEditor = ReturnType<typeof createEditor>;

export interface VanillaEditorConfiguration {
  readonly element: HTMLElement;
  readonly markdown?: string;
}

export interface VanillaEditor {
  readonly commands: CoreEditor["commands"];
  readonly extensionCommands: CoreEditor["extensionCommands"];
  getMarkdown(): string;
  subscribe(listener: (markdown: string) => void): () => void;
  destroy(): void;
}

export const adapterVanillaPackageName = "@uc-markdown-web/adapter-vanilla";

export function createVanillaEditor(configuration: VanillaEditorConfiguration): VanillaEditor {
  const { element, markdown = "" } = configuration;

  if (!element || element.nodeType !== 1) {
    throw new TypeError("createVanillaEditor requires an HTMLElement.");
  }

  let editor: CoreEditor | undefined;
  let safeView: ReturnType<typeof createSafeEditorView> | undefined;
  let mount: HTMLElement | undefined;

  try {
    const schema = createMarkdownSchema();
    editor = createEditor({
      schema,
      doc: parseMarkdown(markdown, schema),
      extensions: [createEditingExtension()]
    });
    mount = element.ownerDocument.createElement("div");
    mount.dataset.ucMarkdownWebMount = "";
    element.append(mount);
    safeView = createSafeEditorView({ editor, mount });
  } catch (error) {
    safeView?.destroy();
    editor?.destroy();
    mount?.remove();
    throw error;
  }

  const activeEditor = editor;
  const activeView = safeView;
  const activeMount = mount;
  const subscriptions = new Set<() => void>();
  let destroyed = false;

  function assertActive(): void {
    if (destroyed) {
      throw new Error("Vanilla editor has been destroyed.");
    }
  }

  return {
    commands: activeEditor.commands,
    extensionCommands: activeEditor.extensionCommands,
    getMarkdown() {
      assertActive();
      return serializeMarkdown(activeEditor.getState().doc);
    },
    subscribe(listener) {
      assertActive();
      const unsubscribe = activeEditor.subscribe((state, transactions) => {
        if (!destroyed && transactions.some((transaction) => transaction.docChanged)) {
          listener(serializeMarkdown(state.doc));
        }
      });
      subscriptions.add(unsubscribe);
      let active = true;

      return () => {
        if (!active) {
          return;
        }

        active = false;
        subscriptions.delete(unsubscribe);
        unsubscribe();
      };
    },
    destroy() {
      if (destroyed) {
        return;
      }

      destroyed = true;
      let failure: unknown;
      const dispose = (operation: () => void) => {
        try {
          operation();
        } catch (error) {
          failure ??= error;
        }
      };

      dispose(() => activeView.destroy());
      for (const unsubscribe of subscriptions) {
        dispose(unsubscribe);
      }
      subscriptions.clear();
      dispose(() => activeEditor.destroy());
      dispose(() => activeMount.remove());

      if (failure !== undefined) {
        throw failure;
      }
    }
  };
}
