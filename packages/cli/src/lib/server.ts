import { createServer } from "node:http";
import { toNodeHandler } from "h3/node";
import { createApp } from "./server/app";
import { createContainer } from "./server/store/container";

type DevServerOptions = {
  analyzeDir: string;
};

export const createDevServer = async (options: DevServerOptions) => {
  const container = await createContainer(options);
  const app = createApp(container);
  return createServer(toNodeHandler(app));
};
