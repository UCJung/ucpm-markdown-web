import { describe, expect, it } from "vitest";

import { extensionApiVersion, type Extension } from "./index.js";

describe("extension API contract", () => {
  it("accepts schema, command, keymap, plugin, and lifecycle fields", () => {
    const extension: Extension = {
      name: "contract",
      nodes: {
        callout: { atom: true, group: "block" }
      },
      marks: {
        highlight: {}
      },
      plugins: [],
      keymap: {},
      commands: {
        noop: () => false
      },
      onCreate: ({ schema, state }) => {
        expect(state.schema).toBe(schema);
      },
      onDestroy: ({ extension: currentExtension }) => {
        expect(currentExtension.name).toBe("contract");
      }
    };

    expect(extensionApiVersion).toBe("0.0.0");
    expect(extension.commands?.noop).toBeTypeOf("function");
  });
});
