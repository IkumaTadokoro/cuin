import type { Instance } from "@cuin/schema";
import { always, and, or, type Predicate } from "../../shared/lib/predicates";
import { type FiltersState, getGroupEffectiveValues } from "./filters-state";
import { NO_VALUE } from "./props-analyze";

// === Instance helpers ===

export const getPackageName = (instance: Instance): string =>
  instance.package.type === "native" ? "(no package)" : instance.package.name;

// === Instance-specific predicate factories ===

const byPackageIn =
  (includedPackages: Set<string>): Predicate<Instance> =>
  (instance) =>
    includedPackages.has(getPackageName(instance));

const byPropEquals =
  (key: string, value: string): Predicate<Instance> =>
  (instance) =>
    instance.props.some((p) => p.key === key && p.raw === value);

const byPropMissing =
  (key: string): Predicate<Instance> =>
  (instance) =>
    instance.props.every((p) => p.key !== key);

export type FilterGroupKey = "package" | `prop:${string}`;

export const packageGroupKey = "package" as const;
export const propGroupKey = (propKey: string): FilterGroupKey =>
  `prop:${propKey}`;

export type FilterContext = {
  allPackages: string[];
  allPropValues: Map<string, string[]>;
};

const buildValuePredicate = (
  propKey: string,
  value: string
): Predicate<Instance> =>
  value === NO_VALUE ? byPropMissing(propKey) : byPropEquals(propKey, value);

const buildPropPredicate = (
  state: FiltersState,
  propKey: string,
  allValues: string[]
): Predicate<Instance> => {
  const groupKey = propGroupKey(propKey);
  const selectedValues = getGroupEffectiveValues(state, groupKey, allValues);

  if (selectedValues.size === allValues.length) {
    return always();
  }

  if (selectedValues.size === 0) {
    return () => false;
  }

  const valuePredicates = Array.from(selectedValues).map((value) =>
    buildValuePredicate(propKey, value)
  );

  return or(...valuePredicates);
};

const buildPropsPredicates = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance>[] =>
  Array.from(context.allPropValues.entries()).map(([propKey, allValues]) =>
    buildPropPredicate(state, propKey, allValues)
  );

const buildPackagePredicate = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance> => {
  const packageValues = getGroupEffectiveValues(
    state,
    packageGroupKey,
    context.allPackages
  );

  if (packageValues.size === context.allPackages.length) {
    return always();
  }

  if (packageValues.size === 0) {
    return () => false;
  }

  return byPackageIn(packageValues);
};

export const buildPredicate = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance> => {
  const packagePredicate = buildPackagePredicate(state, context);
  const propsPredicates = buildPropsPredicates(state, context);

  return and(packagePredicate, ...propsPredicates);
};
