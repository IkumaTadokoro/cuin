import { basename } from "node:path";
import { defineHandler, HTTPError } from "h3";
import type { AnalysisStore } from "../../server/store/analysis-store";

export const ComponentHandler = (analysisStore: AnalysisStore) =>
  defineHandler((event) => {
    const id = event.context.params?.["id.json"];
    if (!id) {
      throw new HTTPError({
        statusCode: 400,
        message: "Component ID required",
      });
    }

    const componentId = basename(id, ".json");

    const component = analysisStore.getComponent(componentId);
    if (!component) {
      throw new HTTPError({
        statusCode: 404,
        message: "Component not found",
      });
    }

    return component;
  });
