import { defineHandler } from "h3";
import type { AnalysisStore } from "../../server/store/analysis-store";

export const MetaHandler = (analysisStore: AnalysisStore) =>
  defineHandler(() => analysisStore.getMeta());
