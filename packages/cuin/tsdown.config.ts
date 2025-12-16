import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  target: "node18",
  platform: "node",
  dts: true,
  shims: true,
  clean: true,
  sourcemap: false,
  treeshake: true,
  minify: true,
  external: ["@ikuma-t/cuin-analyzer", "vite"],
});
