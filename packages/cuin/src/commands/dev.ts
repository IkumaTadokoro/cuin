import { getPort } from "get-port-please";
import { define } from "gunshi";
import open from "open";
import { createServer } from "../lib/server";
import { createSpinner } from "../lib/spinner";
import { createWatcher } from "../lib/watcher";

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
    watch: {
      type: "boolean",
      short: "w",
      description: "Watch for file changes and re-analyze",
      default: true,
    },
  },
  run: async (ctx) => {
    const { path, port: userDefinedPort, watch } = ctx.values;
    const host = "localhost";
    const port = await getPort({
      port: userDefinedPort,
      portRange: [DEFAULT_PORT_RANGE.MIN, DEFAULT_PORT_RANGE.MAX],
      host,
    });
    const spinner = createSpinner();

    spinner.start("Analyzing...");
    const { server, container } = await createServer({
      analyzeDir: path,
    });
    spinner.stop();

    server.listen(port, host, async () => {
      await open(`http://${host}:${port}`);
      process.stdout.write(
        `\x1b[32m✔\x1b[0m Server started at http://${host}:${port}\n`
      );

      if (watch) {
        const watcher = createWatcher({
          analyzeDir: path,
          onReanalyze: async () => {
            await container.analysisStore.reanalyze();
          },
          eventEmitter: container.eventEmitter,
        });

        process.on("SIGINT", async () => {
          process.stdout.write("\n\x1b[33m⏹\x1b[0m Shutting down...\n");
          await watcher.close();
          process.exit(0);
        });
      }
    });
  },
});
