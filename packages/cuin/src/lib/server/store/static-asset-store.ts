import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StaticAssetMeta } from "h3";
import { lookup } from "mrmime";
import { noop } from "../../noop";

const COMPRESSION_EXT_REGEX = /\.(gz|br)$/;

const resolveDistDir = () => {
  if (process.env.NODE_ENV !== "development") {
    const entryDir = dirname(process.argv[1] ?? "");
    return resolve(entryDir, "public");
  }

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);
  return resolve(currentDir, "../../../../dist/public");
};

export type StaticAssetStore = {
  getContents: (id: string) => Promise<Uint8Array | undefined> | undefined;
  getMeta: (id: string) => Promise<StaticAssetMeta | undefined>;
};

const getEncoding = (id: string) => {
  if (id.endsWith(".gz")) {
    return "gzip";
  }
  if (id.endsWith(".br")) {
    return "br";
  }
  return;
};

export const createStaticAssetStore = (): StaticAssetStore => {
  const distDir = resolveDistDir();
  const fileMap = new Map<string, Promise<Uint8Array | undefined>>();
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id)) {
      fileMap.set(id, readFile(id).catch());
    }
    return fileMap.get(id);
  };

  const getMeta = async (id: string) => {
    const stats = await stat(join(distDir, id)).catch(noop);
    if (!stats?.isFile()) {
      return;
    }
    return {
      type: lookup(id.replace(COMPRESSION_EXT_REGEX, "")),
      size: stats.size,
      mtime: stats.mtimeMs,
      encoding: getEncoding(id),
    };
  };

  return {
    getContents: (id: string) => readCachedFile(join(distDir, id)),
    getMeta,
  };
};
