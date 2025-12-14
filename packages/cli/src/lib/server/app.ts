import { H3, withBase } from "h3";
import { ComponentHandler } from "./handlers/component-handler";
import { ComponentSummaryHandler } from "./handlers/component-summary-handler";
import { PayloadHandler } from "./handlers/payload-handler";
import { StaticAssetHandler } from "./handlers/static-asset-handler";
import type { Container } from "./store/container";

export const createApp = (container: Container): H3 => {
  const app = new H3()
    .use("/api/**", withBase("/api", createApiApp(container).handler))
    .use("/**", StaticAssetHandler(container.staticAssetStore));

  return app;
};

const createApiApp = (container: Container) => {
  const api = new H3();
  const { analysisStore } = container;

  api.get("/payload.json", PayloadHandler(analysisStore));
  api.get("/summary.json", ComponentSummaryHandler(analysisStore));
  api.get("/components/:id.json", ComponentHandler(analysisStore));

  return api;
};
