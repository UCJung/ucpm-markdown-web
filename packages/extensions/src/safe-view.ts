import type { Editor } from "@uc-markdown-web/core";
import { type Mark, type Node as ProseMirrorNode } from "prosemirror-model";
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
  let destroyed = false;
  const view = new EditorView(mount, {
    state: editor.getState(),
    nodeViews: safeNodeViews,
    markViews: safeMarkViews,
    dispatchTransaction(transaction) {
      editor.dispatch(transaction);
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
      unsubscribe();
      view.destroy();
    }
  };
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

function rawTextNode(node: ProseMirrorNode): { readonly dom: HTMLElement } {
  const dom = document.createElement("pre");
  dom.setAttribute("data-raw-markdown", "true");
  dom.textContent = typeof node.attrs.source === "string" ? node.attrs.source : "";
  return { dom };
}

function headingLevel(node: ProseMirrorNode): number {
  const level = node.attrs.level;
  return typeof level === "number" && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 1;
}
