import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: [
        "@uc-markdown-web/core",
        "@uc-markdown-web/markdown",
        "@uc-markdown-web/extension-api",
        "prosemirror-inputrules",
        "prosemirror-history",
        "prosemirror-model",
        "prosemirror-schema-list",
        "prosemirror-state",
        "prosemirror-view"
      ]
    }
  }
});
