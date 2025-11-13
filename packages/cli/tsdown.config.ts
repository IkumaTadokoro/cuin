import { existsSync } from "node:fs";
import { cp, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "esm",
  target: "node18",
  platform: "node",
  dts: true,
  shims: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  external: ["@cuin/analyzer"],

  async onSuccess() {
    const uiOutDir = fileURLToPath(
      new URL("../ui/.output/public", import.meta.url)
    );
    const cliUiDir = fileURLToPath(new URL("./dist/public", import.meta.url));

    if (!existsSync(uiOutDir)) {
      throw new Error("UI not built");
    }
    await mkdir(cliUiDir, { recursive: true });

    await cp(uiOutDir, cliUiDir, {
      recursive: true,
      force: true,
    });

    const _files = await readdir(cliUiDir);
  },
});
