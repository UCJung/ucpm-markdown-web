import { describe, expect, it } from "vitest";

import { adapterVanillaPackageName } from "@uc-markdown-web/adapter-vanilla";
import { corePackageName } from "@uc-markdown-web/core";
import { extensionApiVersion } from "@uc-markdown-web/extension-api";
import { extensionsPackageName } from "@uc-markdown-web/extensions";
import { markdownPackageName } from "@uc-markdown-web/markdown";

describe("workspace public entry points", () => {
  it("loads every library through its package export", () => {
    expect({
      adapterVanillaPackageName,
      corePackageName,
      extensionApiVersion,
      extensionsPackageName,
      markdownPackageName
    }).toEqual({
      adapterVanillaPackageName: "@uc-markdown-web/adapter-vanilla",
      corePackageName: "@uc-markdown-web/core",
      extensionApiVersion: "0.0.0",
      extensionsPackageName: "@uc-markdown-web/extensions",
      markdownPackageName: "@uc-markdown-web/markdown"
    });
  });
});
