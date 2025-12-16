import type { EventHandler, NodeMiddleware } from "h3";
import { defineEventHandler, fromNodeHandler } from "h3/node";
import type { ViteDevServer } from "vite";

export const createViteMiddleware = (vite: ViteDevServer): EventHandler =>
  defineEventHandler(async (event) => {
    const nodeHandler = fromNodeHandler(
      vite.middlewares as unknown as NodeMiddleware
    );
    return nodeHandler(event);
  });
