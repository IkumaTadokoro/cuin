import type { Payload, Summary } from "@cuin/schema";
import { analyze } from "@ikuma-t/cuin-analyzer";
import { destr } from "destr";

export const getAnalysis = async (path: string): Promise<Payload> => {
  const rawResult = await analyze(path);
  return destr<Payload>(rawResult);
};

export const getAnalysisAsJson = async (path: string): Promise<string> => {
  const result = await getAnalysis(path);
  return JSON.stringify(result, null, 2);
};

export const toSummary = (payload: Payload): Summary => ({
  meta: payload.meta,
  components: payload.components.map((c) => ({
    id: c.id,
    name: c.name,
    package: c.package,
    instanceCount: c.instances.length,
  })),
});
