import path from "path";
import { builtinModules } from "module";
import { defineConfig } from "vite";

const externalModules = new Set([
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`),
  "node-sqlite3-wasm",
]);

export default defineConfig({
  resolve: {
    alias: {
      "@prompthub/core": path.resolve(__dirname, "../../packages/core/src"),
      "@prompthub/shared": path.resolve(__dirname, "../../packages/shared"),
      "@prompthub/db": path.resolve(__dirname, "../../packages/db/src"),
    },
  },
  build: {
    outDir: "out",
    minify: false,
    target: "node22",
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      formats: ["cjs"],
      fileName: () => "prompthub.cjs",
    },
    rollupOptions: {
      external: (id) =>
        externalModules.has(id) ||
        [...externalModules].some((item) => id.startsWith(`${item}/`)),
      output: {
        banner: "#!/usr/bin/env node",
      },
    },
  },
});
