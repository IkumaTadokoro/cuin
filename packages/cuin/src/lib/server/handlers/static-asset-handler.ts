import { defineEventHandler, serveStatic } from "h3";
import type { StaticAssetStore } from "../store/static-asset-store";

export const StaticAssetHandler = (staticAssetStore: StaticAssetStore) =>
  defineEventHandler(async (event) => {
    const result = await serveStatic(event, {
      fallthrough: true,
      getContents: (id) =>
        staticAssetStore.getContents(id) as Promise<
          BodyInit | null | undefined
        >,
      getMeta: staticAssetStore.getMeta,
      encodings: { gzip: ".gz" },
    });
    if (!result) {
      event.res.headers.set("Content-Type", "text/html; charset=utf-8");
      event.res.headers.set("Cache-Control", "no-cache");
      return staticAssetStore.getContents("index.html");
    }

    if (event.url.pathname.startsWith("/assets/")) {
      event.res.headers.set(
        "Cache-Control",
        "public, max-age=31536000, immutable"
      );
    }

    return result;
  });
