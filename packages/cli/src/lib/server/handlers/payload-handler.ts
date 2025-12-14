import { defineHandler } from "h3";
import type { AnalysisStore } from "../../server/store/analysis-store";

export const PayloadHandler = (analysisStore: AnalysisStore) =>
  defineHandler(() => analysisStore.getAnalysis());
