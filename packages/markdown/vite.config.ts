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
        "prosemirror-model",
        "remark-gfm",
        "remark-parse",
        "remark-stringify",
        "unified"
      ]
    }
  }
});
