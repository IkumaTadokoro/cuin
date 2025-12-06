import type { Instance } from "~/dataflow/core/schema";
import {
  and,
  InstancePredicates as IP,
  or,
  type Predicate,
} from "../shared/lib/predicates";
import type { FiltersState } from "./filters-state";
import { getGroupEffectiveValues } from "./filters-state";

/**
 * Filter group definitions for CUIN
 */
export type FilterGroupKey = "package" | `prop:${string}`;

export const packageGroupKey = "package" as const;
export const propGroupKey = (propKey: string): FilterGroupKey =>
  `prop:${propKey}`;

/**
 * Context needed to build predicates
 */
export type FilterContext = {
  /** All package names in the dataset */
  allPackages: string[];
  /** All prop keys and their values */
  allPropValues: Map<string, string[]>;
};

/**
 * Build a predicate for a single prop value
 */
const buildValuePredicate = (
  propKey: string,
  value: string
): Predicate<Instance> =>
  value === "(no value)"
    ? (instance) => instance.props.every((p) => p.key !== propKey)
    : IP.propEquals(propKey, value);

/**
 * Build a predicate for a single prop group
 * Returns null if all values are selected (no filtering needed)
 */
const buildSinglePropPredicate = (
  state: FiltersState,
  propKey: string,
  allValues: string[]
): Predicate<Instance> | null => {
  const groupKey = propGroupKey(propKey);
  const selectedValues = getGroupEffectiveValues(state, groupKey, allValues);

  // All selected = no filtering needed
  if (selectedValues.size === allValues.length) {
    return null;
  }

  // None selected = nothing matches
  if (selectedValues.size === 0) {
    return () => false;
  }

  const valuePredicates = Array.from(selectedValues).map((value) =>
    buildValuePredicate(propKey, value)
  );

  return or(...valuePredicates);
};

/**
 * Build predicates for all prop groups
 */
const buildPropPredicates = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance>[] =>
  Array.from(context.allPropValues.entries())
    .map(([propKey, allValues]) =>
      buildSinglePropPredicate(state, propKey, allValues)
    )
    .filter((p): p is Predicate<Instance> => p !== null);

/**
 * Build a predicate for package filtering
 * Returns null if all packages are selected (no filtering needed)
 */
const buildPackagePredicate = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance> | null => {
  const packageValues = getGroupEffectiveValues(
    state,
    packageGroupKey,
    context.allPackages
  );

  // All selected = no filtering needed
  if (packageValues.size === context.allPackages.length) {
    return null;
  }

  // None selected = nothing matches
  if (packageValues.size === 0) {
    return () => false;
  }

  return IP.packageIn(packageValues);
};

/**
 * Build a predicate from FiltersState
 *
 * Logic:
 * - Groups are AND-ed together
 * - Values within a group are OR-ed
 * - "all selected" groups produce no predicate (always true)
 */
export const buildPredicate = (
  state: FiltersState,
  context: FilterContext
): Predicate<Instance> => {
  const packagePredicate = buildPackagePredicate(state, context);
  const propPredicates = buildPropPredicates(state, context);

  const allPredicates = [packagePredicate, ...propPredicates].filter(
    (p): p is Predicate<Instance> => p !== null
  );

  return and(...allPredicates);
};

/**
 * Check if any filters are active (non-default state)
 */
export const hasActiveFilters = (state: FiltersState): boolean =>
  state.size > 0;
