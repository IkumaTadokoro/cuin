import type { Instance } from "~/dataflow/core/schema";

export type PackageInfo = {
  name: string;
  count: number;
};

export function getInstancePackages(instances: Instance[]): PackageInfo[] {
  const packagesMap = new Map<string, number>();

  for (const instance of instances) {
    if (instance.package.type === "native") {
      const packageName = "(no package)";
      packagesMap.set(packageName, (packagesMap.get(packageName) || 0) + 1);
    } else {
      const packageName = instance.package.name;
      packagesMap.set(packageName, (packagesMap.get(packageName) || 0) + 1);
    }
  }

  return Array.from(packagesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
