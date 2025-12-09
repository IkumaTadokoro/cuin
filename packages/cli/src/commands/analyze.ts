import consola from "consola";
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
  run: (ctx) => {
    const { path } = ctx.values;

    try {
      const json = getAnalysisAsJson(path);
      consola.log(json);
    } catch (error) {
      consola.error("Analysis failed:", error);
      process.exit(1);
    }
  },
});
