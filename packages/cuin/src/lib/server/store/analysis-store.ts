import type { Component, Meta, Payload, Summary } from "../../../types/schema";
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
  update: (newAnalysis: Payload) => void;
  reanalyze: () => Promise<void>;
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

    const component = store.analysis.components.find((c) => c.id === id);
    if (!component) {
      return;
    }
    store.components.set(id, component);

    return component;
  };

  const update = (newAnalysis: Payload) => {
    store.analysis = newAnalysis;
    store.summary = toSummary(newAnalysis);
    store.components.clear();
  };

  const reanalyze = async () => {
    const newAnalysis = await getAnalysis(analyzeDir);
    update(newAnalysis);
  };

  return {
    getAnalysis: (): Payload => store.analysis,
    getSummary: (): Summary => store.summary,
    getMeta: (): Meta => store.analysis.meta,
    getComponent: (id: string): Component | undefined => getComponent(id),
    update,
    reanalyze,
  };
};
