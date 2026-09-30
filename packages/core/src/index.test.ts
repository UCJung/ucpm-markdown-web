import { describe, expect, it } from "vitest";

import { corePackageName } from "./index.js";

describe("core package entry point", () => {
  it("exports its package identifier", () => {
    expect(corePackageName).toBe("@uc-markdown-web/core");
  });
});
