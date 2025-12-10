import { analyze } from "cuin-analyzer";
import { validateAnalysisResult } from "./validate";

export const getAnalysis = (path: string) => {
  const rawResult = analyze(path);
  const parsed = JSON.parse(rawResult);
  const validated = validateAnalysisResult(parsed);
  return validated;
};

export const getAnalysisAsJson = (path: string): string => {
  const result = getAnalysis(path);
  return JSON.stringify(result, null, 2);
};
