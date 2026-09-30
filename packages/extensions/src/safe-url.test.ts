import { describe, expect, it } from "vitest";
import { decodeUrlEntities, isSafeUrl } from "./safe-url.js";

describe("safe URL policy", () => {
  it("allows the documented navigation forms", () => {
    for (const value of ["https://example.com", "HTTP://example.com", "mailto:user@example.com", "/guide", "relative/page", "?q=1", "#section"]) {
      expect(isSafeUrl(value), value).toBe(true);
    }
  });

  it("decodes entities before rejecting unsafe schemes and obfuscation", () => {
    expect(decodeUrlEntities("j&#x61;va&#115;cript:alert(1)")).toBe("javascript:alert(1)");
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,test",
      "vbscript:msgbox(1)",
      "//example.com",
      "\\\\example.com",
      "java&#x09;script:alert(1)",
      "java&NewLine;script:alert(1)",
      "j&amp;#x61;vascript:alert(1)",
      "java\u200bscript:alert(1)",
      "java\u00adscript:alert(1)",
      "java\u2060script:alert(1)",
      " https://example.com"
    ]) {
      expect(isSafeUrl(value), value).toBe(false);
    }
  });
});
