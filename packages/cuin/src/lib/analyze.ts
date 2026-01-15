import { analyze } from "@ikuma-t/cuin-analyzer";
import { destr } from "destr";
import type { Package, Payload, Summary } from "../types/schema";

export const getAnalysis = async (path: string): Promise<Payload> => {
  const rawResult = await analyze(path);
  return destr<Payload>(rawResult);
};

export const getAnalysisAsJson = async (path: string): Promise<string> => {
  const result = await getAnalysis(path);
  return JSON.stringify(result, null, 2);
};

const getPackageKey = (pkg: Package): string =>
  pkg.type === "native" ? "native" : `${pkg.type}:${pkg.name}@${pkg.version}`;

export const toSummary = (payload: Payload): Summary => ({
  meta: payload.meta,
  components: payload.components.map((c) => {
    const packageCountMap = new Map<string, number>();
    const uniquePackages = new Map<string, Package>();

    for (const instance of c.instances) {
      if (!instance.package) continue;
      const pkgKey = getPackageKey(instance.package);
      packageCountMap.set(pkgKey, (packageCountMap.get(pkgKey) || 0) + 1);
      uniquePackages.set(pkgKey, instance.package);
    }

    return {
      id: c.id,
      name: c.name,
      package: c.package,
      instanceCount: c.instances.length,
      usedInPackages: Array.from(uniquePackages.values()),
      instanceCountByPackage: Object.fromEntries(packageCountMap),
    };
  }),
});
