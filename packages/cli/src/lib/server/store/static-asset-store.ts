import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StaticAssetMeta } from "h3";
import { lookup } from "mrmime";
import { noop } from "../../noop";

const resolveDistDir = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);

  const patterns = [
    resolve(currentDir, "./public"),
    resolve(currentDir, "../public"),
    resolve(currentDir, "../../../../dist/public"),
  ];

  for (const path of patterns) {
    if (existsSync(path)) {
      return path;
    }
  }

  return resolve(currentDir, "../../../../dist/public");
};

export type StaticAssetStore = {
  getContents: (id: string) => Promise<string | undefined> | undefined;
  getMeta: (id: string) => Promise<StaticAssetMeta | undefined>;
};

export const createStaticAssetStore = (): StaticAssetStore => {
  const distDir = resolveDistDir();
  const fileMap = new Map<string, Promise<string | undefined>>();
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id)) {
      fileMap.set(id, readFile(id, "utf-8").catch());
    }
    return fileMap.get(id);
  };

  const getMeta = async (id: string) => {
    const stats = await stat(join(distDir, id)).catch(noop);
    if (!stats?.isFile()) {
      return;
    }
    return {
      type: lookup(id),
      size: stats.size,
      mtime: stats.mtimeMs,
    };
  };

  return {
    getContents: (id: string) => readCachedFile(join(distDir, id)),
    getMeta,
  };
};
