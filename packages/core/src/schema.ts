import type { Extension } from "@uc-markdown-web/extension-api";
import { Schema, type MarkSpec, type NodeSpec } from "prosemirror-model";

const baseNodeSpecs: Record<string, NodeSpec> = {
  doc: { content: "block+" },
  paragraph: { content: "inline*", group: "block" },
  heading: {
    attrs: { level: { default: 1 } },
    content: "inline*",
    group: "block",
    defining: true
  },
  blockquote: { content: "block+", group: "block" },
  horizontal_rule: { group: "block" },
  code_block: { content: "text*", group: "block", marks: "", code: true },
  bullet_list: { content: "list_item+", group: "block" },
  ordered_list: {
    attrs: { order: { default: 1 } },
    content: "list_item+",
    group: "block"
  },
  list_item: { content: "paragraph block*" },
  text: { group: "inline" }
};

const baseMarkSpecs: Record<string, MarkSpec> = {
  em: {},
  strong: {},
  link: {
    attrs: {
      href: {},
      title: { default: null }
    },
    inclusive: false
  },
  code: { excludes: "_" }
};

export function createEditorSchema(
  extensions: readonly Extension[] = [],
  baseSchema?: Schema
): Schema {
  const nodes = baseSchema === undefined ? { ...baseNodeSpecs } : getNodeSpecs(baseSchema);
  const marks = baseSchema === undefined ? { ...baseMarkSpecs } : getMarkSpecs(baseSchema);
  const extensionNames = new Set<string>();
  const schemaSpecNames = new Set<string>([...Object.keys(nodes), ...Object.keys(marks)]);
  let hasExtensionSpecs = false;

  for (const extension of extensions) {
    const extensionName = extension.name.trim();

    if (extensionName.length === 0) {
      throw new Error("Extension name must not be empty.");
    }

    if (extensionNames.has(extensionName)) {
      throw new Error(`Duplicate extension name: ${extensionName}.`);
    }

    extensionNames.add(extensionName);
    hasExtensionSpecs ||= hasSpecs(extension.nodes) || hasSpecs(extension.marks);
    mergeSpecs(nodes, extension.nodes, schemaSpecNames, extensionName);
    mergeSpecs(marks, extension.marks, schemaSpecNames, extensionName);
  }

  if (baseSchema !== undefined && !hasExtensionSpecs) {
    return baseSchema;
  }

  return new Schema({ nodes, marks });
}

function hasSpecs(specs: Readonly<Record<string, NodeSpec | MarkSpec>> | undefined): boolean {
  return specs !== undefined && Object.keys(specs).length > 0;
}

function getNodeSpecs(schema: Schema): Record<string, NodeSpec> {
  return Object.fromEntries(
    Object.entries(schema.nodes).map(([name, nodeType]) => [name, nodeType.spec])
  );
}

function getMarkSpecs(schema: Schema): Record<string, MarkSpec> {
  return Object.fromEntries(
    Object.entries(schema.marks).map(([name, markType]) => [name, markType.spec])
  );
}

function mergeSpecs<T extends NodeSpec | MarkSpec>(
  target: Record<string, T>,
  specs: Readonly<Record<string, T>> | undefined,
  schemaSpecNames: Set<string>,
  extensionName: string
): void {
  if (specs === undefined) {
    return;
  }

  for (const [name, spec] of Object.entries(specs)) {
    if (schemaSpecNames.has(name)) {
      throw new Error(`Duplicate schema spec name: ${name} in extension ${extensionName}.`);
    }

    schemaSpecNames.add(name);
    target[name] = spec;
  }
}
