import { JsonSchema } from "@cuin/schema";
import { parse } from "valibot";

export function validateAnalysisResult(data: unknown) {
  return parse(JsonSchema, data);
}
