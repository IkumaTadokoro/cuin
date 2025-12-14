import { defineHandler } from "h3";
import type { AnalysisStore } from "../../server/store/analysis-store";

export const ComponentSummaryHandler = (analysisStore: AnalysisStore) =>
  defineHandler(() => analysisStore.getSummary());
