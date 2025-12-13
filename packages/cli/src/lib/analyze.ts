import type { Payload, SummaryPayload } from "@cuin/schema";
import { analyze } from "@ikuma-t/cuin-analyzer";
import { validateAnalysisResult } from "./validate";

export const getAnalysis = (path: string): Payload => {
  const rawResult = analyze(path);
  const parsed = JSON.parse(rawResult);
  const validated = validateAnalysisResult(parsed);
  return validated;
};

export const getAnalysisAsJson = (path: string): string => {
  const result = getAnalysis(path);
  return JSON.stringify(result, null, 2);
};

export const toSummary = (payload: Payload): SummaryPayload => ({
  meta: payload.meta,
  components: payload.components.map((c) => ({
    id: c.id,
    name: c.name,
    package: c.package,
    instanceCount: c.instances.length,
  })),
});
