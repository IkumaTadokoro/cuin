import { defineEventHandler, serveStatic } from "h3";
import type { StaticAssetStore } from "../store/static-asset-store";

export const StaticAssetHandler = (staticAssetStore: StaticAssetStore) =>
  defineEventHandler(async (event) => {
    const result = await serveStatic(event, {
      fallthrough: true,
      getContents: staticAssetStore.getContents,
      getMeta: staticAssetStore.getMeta,
      encodings: { gzip: ".gz" },
    });
    if (!result) {
      event.res.headers.set("Content-Type", "text/html; charset=utf-8");
      return staticAssetStore.getContents("index.html");
    }

    return result;
  });
