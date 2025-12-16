import { createServer as createHttpServer } from "node:http";
import { toNodeHandler } from "h3/node";
import { createApp } from "./server/app";
import { createContainer } from "./server/store/container";

type DevServerOptions = {
  analyzeDir: string;
};

const isDev = () => process.env.NODE_ENV === "development";

export const createServer = async (options: DevServerOptions) => {
  const { analyzeDir } = options;
  const container = await createContainer({ analyzeDir });

  if (isDev()) {
    const { createDevServer } = await import("./dev-server");
    return createDevServer(container);
  }

  const app = await createApp({ container });
  return createHttpServer(toNodeHandler(app));
};
