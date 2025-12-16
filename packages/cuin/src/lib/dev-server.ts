import { createServer as createHttpServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toNodeHandler } from "h3/node";
import { createApp } from "./server/app";
import type { Container } from "./server/store/container";

/**
 * For Development only.
 * This file is tree-shaken from production builds.
 */
export const createDevServer = async (container: Container) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const cliRoot = resolve(__dirname, "../..");
  const uiRoot = resolve(__dirname, "../ui");

  const { createServer: createViteServer } = await import("vite");
  const httpServer = createHttpServer();
  const vite = await createViteServer({
    configFile: resolve(cliRoot, "vite.config.ts"),
    root: uiRoot,
    server: {
      middlewareMode: { server: httpServer },
      hmr: { server: httpServer },
    },
    appType: "spa",
  });
  const app = await createApp({ container, vite });
  httpServer.on("request", toNodeHandler(app));
  return httpServer;
};
