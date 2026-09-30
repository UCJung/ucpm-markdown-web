import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: ["@uc-markdown-web/core", "@uc-markdown-web/extensions", "@uc-markdown-web/markdown"]
    }
  }
});
