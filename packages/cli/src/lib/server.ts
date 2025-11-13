import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eventHandler, H3, serveStatic } from "h3";
import { toNodeHandler } from "h3/node";
import { lookup } from "mrmime";
import { getAnalysis } from "./analyze";

type DevServerOptions = {
  analyzeDir: string;
};

const resolveDistDir = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = dirname(currentFile);

  const patterns = [
    resolve(currentDir, "./public"),
    resolve(currentDir, "../public"),
    resolve(currentDir, "../../dist/public"),
  ];

  for (const path of patterns) {
    if (existsSync(path)) {
      return path;
    }
  }

  // フォールバック
  return resolve(currentDir, "../../dist/public");
};

const distDir = resolveDistDir();

export const createDevServer = (options: DevServerOptions) => {
  const app = new H3();

  const fileMap = new Map<string, Promise<string | undefined>>();
  const readCachedFile = (id: string) => {
    if (!fileMap.has(id)) {
      fileMap.set(id, readFile(id, "utf-8").catch());
    }
    return fileMap.get(id);
  };

  app.use(
    "/api/payload.json",
    eventHandler(async () => getAnalysis(options.analyzeDir))
  );

  app.use("/**", async (event) => {
    const result = await serveStatic(event, {
      fallthrough: true,
      getContents: (id) => readCachedFile(join(distDir, id)),
      getMeta: async (id) => {
        const stats = await stat(join(distDir, id)).catch();
        if (!stats?.isFile()) {
          return;
        }
        return {
          type: lookup(id),
          size: stats.size,
          mtime: stats.mtimeMs,
        };
      },
    });
    if (!result) {
      event.res.headers.set("Content-Type", "text/html; charset=utf-8");
      return readCachedFile(join(distDir, "index.html"));
    }

    return result;
  });

  return createServer(toNodeHandler(app));
};
