import type { Component, Meta, Payload, Summary } from "@cuin/schema";
import { getAnalysis, toSummary } from "../../analyze";

type AnalysisCache = {
  analysis: Payload;
  summary: Summary;
  components: Map<string, Component>;
};

export type AnalysisStore = {
  getAnalysis: () => Payload;
  getSummary: () => Summary;
  getMeta: () => Meta;
  getComponent: (id: string) => Component | undefined;
};

export const createAnalysisStore = async (
  analyzeDir: string
): Promise<AnalysisStore> => {
  const analysis = await getAnalysis(analyzeDir);
  const store: AnalysisCache = {
    analysis,
    summary: toSummary(analysis),
    components: new Map<string, Component>(),
  };

  const getComponent = (id: Component["id"]): Component | undefined => {
    const cached = store.components.get(id);
    if (cached) {
      return cached;
    }

    const component = analysis.components.find((c) => c.id === id);
    if (!component) {
      return;
    }
    store.components.set(id, component);

    return component;
  };

  return {
    getAnalysis: (): Payload => store.analysis,
    getSummary: (): Summary => store.summary,
    getMeta: (): Meta => store.analysis.meta,
    getComponent: (id: string): Component | undefined => getComponent(id),
  };
};
