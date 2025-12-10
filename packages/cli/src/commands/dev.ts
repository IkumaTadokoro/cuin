import { getPort } from "get-port-please";
import { define } from "gunshi";
import open from "open";
import { createDevServer } from "../lib/server";

const DEFAULT_PORT_RANGE = {
  MIN: 3214,
  MAX: 4999,
};

export const dev = define({
  name: "dev",
  description: "Component usage analyzer for JavaScript/TypeScript projects",
  args: {
    path: {
      type: "string",
      short: "p",
      description: "Path to process",
      default: process.cwd(),
    },
    port: {
      type: "number",
      short: "P",
      description: "Port to run the server on",
      default: 3214,
    },
  },
  run: async (ctx) => {
    const { path, port: userDefinedPort } = ctx.values;
    const host = "localhost";
    const port = await getPort({
      port: userDefinedPort,
      portRange: [DEFAULT_PORT_RANGE.MIN, DEFAULT_PORT_RANGE.MAX],
      host,
    });

    const server = createDevServer({
      analyzeDir: path,
    });

    server.listen(port, host, async () => {
      await open(`http://${host}:${port}`);
      process.stdout.write(
        `\x1b[32m✔\x1b[0m Server started at http://${host}:${port}\n`
      );
    });
  },
});
