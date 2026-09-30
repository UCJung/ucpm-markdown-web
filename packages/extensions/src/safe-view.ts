import type { Editor } from "@uc-markdown-web/core";
import { DOMSerializer, type DOMOutputSpec, type Mark, type Node as ProseMirrorNode, type Schema } from "prosemirror-model";
import type { Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { isSafeUrl } from "./safe-url.js";

export interface SafeEditorViewOptions {
  readonly editor: Editor;
  readonly mount: HTMLElement;
}

export interface SafeEditorView {
  readonly view: EditorView;
  destroy(): void;
}

/** Creates an internal DOM view over the editor's exact schema and filtered transaction path. */
export function createSafeEditorView(options: SafeEditorViewOptions): SafeEditorView {
  const { editor, mount } = options;
  const clipboardSerializer = createSafeClipboardSerializer(editor.schema);
  let destroyed = false;
  let deferredTransaction: Transaction | undefined;
  let deferredScheduled = false;
  const view = new EditorView(mount, {
    state: editor.getState(),
    nodeViews: safeNodeViews,
    markViews: safeMarkViews,
    clipboardSerializer,
    dispatchTransaction(transaction) {
      if (destroyed || editor.isDestroyed()) {
        return;
      }

      try {
        editor.dispatch(transaction);
      } catch (error) {
        if (!isNotifyingDispatchError(error)) {
          throw error;
        }

        deferredTransaction = transaction;
        if (!deferredScheduled) {
          deferredScheduled = true;
          queueMicrotask(() => {
            deferredScheduled = false;
            const pending = deferredTransaction;
            deferredTransaction = undefined;
            if (!destroyed && !editor.isDestroyed() && pending !== undefined && editor.getState().doc.eq(pending.before)) {
              editor.dispatch(pending);
            }
          });
        }
      }
    }
  });
  const unsubscribe = editor.subscribe((state) => {
    if (!destroyed && view.state !== state) {
      view.updateState(state);
    }
  });

  return {
    view,
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      deferredTransaction = undefined;
      unsubscribe();
      view.destroy();
    }
  };
}

/** Serializes only the element and attribute allowlist used by the editor view. */
export function createSafeClipboardSerializer(schema: Schema): DOMSerializer {
  assertSafeSchemaSupported(schema);
  return new DOMSerializer(safeClipboardNodeSerializers, safeClipboardMarkSerializers);
}

const safeNodeViews = {
  paragraph: () => container("p"),
  heading: (node: ProseMirrorNode) => container(`h${headingLevel(node)}`),
  blockquote: () => container("blockquote"),
  horizontal_rule: () => leaf("hr"),
  code_block: () => nestedContainer("pre", "code"),
  bullet_list: () => container("ul"),
  ordered_list: (node: ProseMirrorNode) => {
    const dom = document.createElement("ol");
    const order = node.attrs.order;
    if (typeof order === "number" && order !== 1) {
      dom.start = order;
    }
    return { dom, contentDOM: dom };
  },
  list_item: () => container("li"),
  task_list: () => container("ul"),
  task_item: () => container("li"),
  table: () => container("table"),
  table_row: () => container("tr"),
  table_cell: (node: ProseMirrorNode) => container(node.attrs.header === true ? "th" : "td"),
  hard_break: () => leaf("br"),
  raw_markdown_block: (node: ProseMirrorNode) => rawTextNode(node)
};

const safeMarkViews = {
  em: () => markContainer("em"),
  strong: () => markContainer("strong"),
  strikethrough: () => markContainer("s"),
  code: () => markContainer("code"),
  link: (mark: Mark) => safeLink(mark)
};

function container(name: string): { readonly dom: HTMLElement; readonly contentDOM: HTMLElement } {
  const dom = document.createElement(name);
  return { dom, contentDOM: dom };
}

function nestedContainer(outer: string, inner: string): { readonly dom: HTMLElement; readonly contentDOM: HTMLElement } {
  const dom = document.createElement(outer);
  const contentDOM = document.createElement(inner);
  dom.append(contentDOM);
  return { dom, contentDOM };
}

function leaf(name: string): { readonly dom: HTMLElement } {
  return { dom: document.createElement(name) };
}

function markContainer(name: string): { readonly dom: HTMLElement; readonly contentDOM: HTMLElement } {
  return container(name);
}

function safeLink(mark: Mark): { readonly dom: HTMLElement; readonly contentDOM: HTMLElement } {
  const href = mark.attrs.href;
  const dom = document.createElement(typeof href === "string" && isSafeUrl(href) ? "a" : "span");
  if (dom.tagName.toLowerCase() === "a") {
    dom.setAttribute("href", href as string);
    dom.setAttribute("rel", "noopener noreferrer");
  } else {
    dom.setAttribute("data-unsafe-link", "true");
  }
  return { dom, contentDOM: dom };
}

function rawTextNode(node: ProseMirrorNode): {
  readonly dom: HTMLElement;
  readonly stopEvent: () => boolean;
  readonly ignoreMutation: () => boolean;
} {
  const dom = document.createElement("pre");
  dom.setAttribute("data-raw-markdown", "true");
  dom.contentEditable = "false";
  dom.textContent = typeof node.attrs.source === "string" ? node.attrs.source : "";
  return { dom, stopEvent: () => true, ignoreMutation: () => true };
}

function headingLevel(node: ProseMirrorNode): number {
  const level = node.attrs.level;
  return typeof level === "number" && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1;
}

const safeClipboardNodeSerializers: Record<string, (node: ProseMirrorNode) => DOMOutputSpec> = {
  paragraph: () => ["p", 0],
  heading: (node) => [`h${headingLevel(node)}`, 0],
  blockquote: () => ["blockquote", 0],
  horizontal_rule: () => ["hr"],
  code_block: () => ["pre", ["code", 0]],
  bullet_list: () => ["ul", 0],
  ordered_list: (node) => {
    const order = node.attrs.order;
    return typeof order === "number" && order !== 1 ? ["ol", { start: order }, 0] : ["ol", 0];
  },
  list_item: () => ["li", 0],
  task_list: () => ["ul", 0],
  task_item: () => ["li", 0],
  table: () => ["table", 0],
  table_row: () => ["tr", 0],
  table_cell: (node) => [node.attrs.header === true ? "th" : "td", 0],
  hard_break: () => ["br"],
  raw_markdown_block: (node) => [
    "pre",
    { "data-raw-markdown": "true", contenteditable: "false" },
    typeof node.attrs.source === "string" ? node.attrs.source : ""
  ]
};

const safeClipboardMarkSerializers: Record<string, (mark: Mark, inline: boolean) => DOMOutputSpec> = {
  em: () => ["em", 0],
  strong: () => ["strong", 0],
  strikethrough: () => ["s", 0],
  code: () => ["code", 0],
  link: (mark) => safeLinkDomSpec(mark)
};

function safeLinkDomSpec(mark: Mark): DOMOutputSpec {
  const href = mark.attrs.href;
  return typeof href === "string" && isSafeUrl(href)
    ? ["a", { href, rel: "noopener noreferrer" }, 0]
    : ["span", { "data-unsafe-link": "true" }, 0];
}

function assertSafeSchemaSupported(schema: Schema): void {
  const missingNodes = Object.keys(schema.nodes).filter((name) => name !== "doc" && name !== "text" && safeClipboardNodeSerializers[name] === undefined);
  const missingMarks = Object.keys(schema.marks).filter((name) => safeClipboardMarkSerializers[name] === undefined);
  if (missingNodes.length > 0 || missingMarks.length > 0) {
    throw new Error(`Safe editor view does not support schema entries: ${[...missingNodes, ...missingMarks].join(", ")}.`);
  }
}

function isNotifyingDispatchError(error: unknown): boolean {
  return error instanceof Error && error.message === "Cannot dispatch while notifying subscribers.";
}
