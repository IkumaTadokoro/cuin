import { basename } from "node:path";
import { defineHandler, HTTPError } from "h3";
import type { Instance, Package } from "../../../types/schema";
import type { AnalysisStore } from "../../server/store/analysis-store";

const getPackageNameForSort = (pkg: Package | undefined): string => {
  if (!pkg || pkg.type === "native") {
    return "";
  }
  return pkg.name;
};

const sortInstances = (instances: Instance[]): Instance[] =>
  [...instances].sort((a, b) => {
    const pkgA = getPackageNameForSort(a.package);
    const pkgB = getPackageNameForSort(b.package);

    const pkgCompare = pkgA.localeCompare(pkgB);
    if (pkgCompare !== 0) return pkgCompare;

    return a.filePath.localeCompare(b.filePath);
  });

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

    return {
      ...component,
      instances: sortInstances(component.instances),
    };
  });
