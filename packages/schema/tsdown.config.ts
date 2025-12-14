import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/schema.ts", "src/mocks/index.ts"],
  format: "esm",
  target: "node18",
  platform: "node",
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
