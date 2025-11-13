import type { Instance } from "~/dataflow/core/schema";
import {
  and,
  InstancePredicates as IP,
  or,
  type Predicate,
} from "../shared/lib/predicates";

export type PackageInfo = {
  name: string;
  count: number;
};

export type PropKeyInfo = {
  key: string;
  count: number;
};

export type PropValueFilterState = {
  [propKey: string]: Set<string>;
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

export function getInstancePropKeys(instances: Instance[]): PropKeyInfo[] {
  const propsMap = new Map<string, number>();

  for (const instance of instances) {
    for (const prop of instance.props) {
      propsMap.set(prop.key, (propsMap.get(prop.key) || 0) + 1);
    }
  }

  return Array.from(propsMap.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildFilterPredicate(
  excludedPackages: Set<string>,
  propValueFilters: PropValueFilterState,
  allPropValues: Map<string, string[]> // 各Propの全値リスト
): Predicate<Instance> {
  const predicates: Predicate<Instance>[] = [];

  if (excludedPackages.size > 0) {
    predicates.push(IP.packageNotIn(excludedPackages));
  }

  for (const [propKey, checkedValues] of Object.entries(propValueFilters)) {
    const allValues = allPropValues.get(propKey) || [];

    if (checkedValues.size === allValues.length) {
      continue;
    }

    if (checkedValues.size > 0) {
      const propPredicates: Predicate<Instance>[] = [];

      for (const value of checkedValues) {
        if (value === "(no value)") {
          propPredicates.push(
            (instance) => !instance.props.some((p) => p.key === propKey)
          );
        } else {
          propPredicates.push(IP.propEquals(propKey, value));
        }
      }

      predicates.push(or(...propPredicates));
    }
  }

  return and(...predicates);
}
