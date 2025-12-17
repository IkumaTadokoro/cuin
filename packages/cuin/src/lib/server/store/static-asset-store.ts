import { readFile, stat } from "node:fs/promises";
import path, { join } from "node:path";
import type { StaticAssetMeta } from "h3";
import { lookup } from "mrmime";
import { DIST_DIR } from "src/lib/dist-dir";
import { noop } from "../../noop";

const COMPRESSION_EXT_REGEX = /\.(gz|br)$/;

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
  const assetDir = path.join(DIST_DIR, "public");
  const fileMap = new Map<string, Promise<Uint8Array | undefined>>();
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id)) {
      fileMap.set(id, readFile(id).catch());
    }
    return fileMap.get(id);
  };

  const getMeta = async (id: string) => {
    const stats = await stat(join(assetDir, id)).catch(noop);
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
    getContents: (id: string) => readCachedFile(join(assetDir, id)),
    getMeta,
  };
};
