import { define } from "gunshi";
import { getAnalysisAsJson } from "../lib/analyze";

export const analyze = define({
  name: "analyze",
  description: "Analyze component usage and output JSON to stdout",
  args: {
    path: {
      type: "string",
      short: "p",
      description: "Path to analyze",
      default: process.cwd(),
    },
  },
  rendering: {
    header: null,
    usage: null,
  },
  run: async (ctx) => {
    const { path } = ctx.values;

    try {
      const json = await getAnalysisAsJson(path);
      process.stdout.write(`${json}\n`);
    } catch (error) {
      process.stderr.write(`Analysis failed: ${error}\n`);
      process.exit(1);
    }
  },
});
