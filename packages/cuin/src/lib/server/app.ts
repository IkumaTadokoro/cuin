import { H3, withBase } from "h3";
import type { ViteDevServer } from "vite";
import { ComponentHandler } from "./handlers/component-handler";
import { ComponentSummaryHandler } from "./handlers/component-summary-handler";
import { EventsHandler } from "./handlers/events-handler";
import { MetaHandler } from "./handlers/meta-handler";
import { PayloadHandler } from "./handlers/payload-handler";
import { StaticAssetHandler } from "./handlers/static-asset-handler";
import { compressionMiddleware } from "./middleware/compression";
import type { Container } from "./store/container";

type AppOptions = {
  container: Container;
  vite?: ViteDevServer;
};

export const createApp = async ({
  container,
  vite,
}: AppOptions): Promise<H3> => {
  const app = new H3().use(
    "/api/**",
    withBase("/api", createApiApp(container).handler)
  );

  if (vite) {
    const { createViteMiddleware } = await import("./middleware/vite");
    app.use("/**", createViteMiddleware(vite));
  } else {
    app.use("/**", StaticAssetHandler(container.staticAssetStore));
  }

  return app;
};

const createApiApp = (container: Container) => {
  const api = new H3().use(compressionMiddleware);
  const { analysisStore, eventEmitter } = container;

  api.get("/payload.json", PayloadHandler(analysisStore));
  api.get("/summary.json", ComponentSummaryHandler(analysisStore));
  api.get("/meta.json", MetaHandler(analysisStore));
  api.get("/components/:id.json", ComponentHandler(analysisStore));
  api.get("/events", EventsHandler(eventEmitter));

  return api;
};
