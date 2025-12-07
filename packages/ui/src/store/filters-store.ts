import { createMemo, createSignal } from "solid-js";
import type { Instance } from "~/dataflow/core/schema";
import {
  buildPredicate,
  hasActiveFilters as checkActiveFilters,
  type FilterContext,
  packageGroupKey,
  propGroupKey,
} from "../lib/filters-predicate";
import {
  type FiltersState,
  getGroupEffectiveValues,
  initialFilters,
  isGroupFiltered,
  isValueSelected,
  resetAllFilters,
  selectAll,
  selectOnly,
  toggleValue as toggleFilterValue,
} from "../lib/filters-state";
import type { PropAnalysis } from "../lib/props-analyze";
import { analyzePropsWithFilter } from "../lib/props-analyze";
import type { SelectionState } from "../lib/selection-state";
import { isAll } from "../lib/selection-state";
import type { Predicate } from "../shared/lib/predicates";

/**
 * Create a filters store using pure functions + SolidJS signals
 *
 * Replaces the old createInstanceFilters with a cleaner architecture:
 * - State: FiltersState (immutable Map)
 * - Updates: Pure functions that return new state
 * - Reactivity: createSignal for state, createMemo for derived values
 */
export type FiltersStore = ReturnType<typeof createFiltersStore>;

export function createFiltersStore(
  allInstances: () => Instance[],
  propsAnalysis: () => PropAnalysis[]
) {
  // Core state: a single signal holding FiltersState
  const [filters, setFilters] = createSignal<FiltersState>(initialFilters());

  // Derived: all package names in the dataset
  const allPackages = createMemo(() => {
    const packages = new Set<string>();
    for (const instance of allInstances()) {
      const name =
        instance.package.type === "native"
          ? "(no package)"
          : instance.package.name;
      packages.add(name);
    }
    return Array.from(packages);
  });

  // Derived: all prop values map
  const allPropValues = createMemo(() => {
    const map = new Map<string, string[]>();
    for (const prop of propsAnalysis()) {
      map.set(
        prop.key,
        prop.values.map((v) => v.value)
      );
    }
    return map;
  });

  // Derived: filter context for predicate building
  const filterContext = createMemo(
    (): FilterContext => ({
      allPackages: allPackages(),
      allPropValues: allPropValues(),
    })
  );

  // Derived: the predicate function
  const filterPredicate = createMemo<Predicate<Instance>>(() =>
    buildPredicate(filters(), filterContext())
  );

  // Derived: filtered instances
  const filteredInstances = createMemo(() =>
    allInstances().filter(filterPredicate())
  );

  // Derived: prop counts after filtering
  const filteredPropCounts = createMemo(() =>
    analyzePropsWithFilter(allInstances(), filteredInstances())
  );

  // === Package filter actions ===

  const isPackageSelected = (packageName: string): boolean =>
    isValueSelected(filters(), packageGroupKey, packageName, allPackages());

  const togglePackage = (packageName: string): void => {
    setFilters((prev) =>
      toggleFilterValue(prev, packageGroupKey, packageName, allPackages())
    );
  };

  const clearPackageFilters = (): void => {
    setFilters((prev) => selectAll(prev, packageGroupKey));
  };

  // === Prop filter actions ===

  const isValueChecked = (propKey: string, value: string): boolean => {
    const groupKey = propGroupKey(propKey);
    const propValues = allPropValues().get(propKey) ?? [];
    return isValueSelected(filters(), groupKey, value, propValues);
  };

  const toggleValue = (propKey: string, value: string): void => {
    const groupKey = propGroupKey(propKey);
    const propValues = allPropValues().get(propKey) ?? [];
    setFilters((prev) => toggleFilterValue(prev, groupKey, value, propValues));
  };

  const selectOnlyValue = (propKey: string, value: string): void => {
    const groupKey = propGroupKey(propKey);
    setFilters((prev) => selectOnly(prev, groupKey, value));
  };

  const selectOnlyValues = (propKey: string, values: string[]): void => {
    // Select the first value, then toggle the rest on
    if (values.length === 0) {
      return;
    }

    const groupKey = propGroupKey(propKey);
    let state = selectOnly(filters(), groupKey, values[0]);

    const propValues = allPropValues().get(propKey) ?? [];
    for (let i = 1; i < values.length; i++) {
      state = toggleFilterValue(state, groupKey, values[i], propValues);
    }

    setFilters(state);
  };

  const selectAllValues = (propKey: string): void => {
    const groupKey = propGroupKey(propKey);
    setFilters((prev) => selectAll(prev, groupKey));
  };

  const clearPropFilter = (propKey: string): void => {
    selectAllValues(propKey);
  };

  const isPropFiltered = (propKey: string): boolean => {
    const groupKey = propGroupKey(propKey);
    return isGroupFiltered(filters(), groupKey);
  };

  const getCheckedCount = (propKey: string): number => {
    const groupKey = propGroupKey(propKey);
    const propValues = allPropValues().get(propKey) ?? [];
    return getGroupEffectiveValues(filters(), groupKey, propValues).size;
  };

  const getAllValuesCount = (propKey: string): number =>
    allPropValues().get(propKey)?.length ?? 0;

  const getFilteredCount = (propKey: string, value: string): number =>
    filteredPropCounts().get(propKey)?.get(value) ?? 0;

  // Get selection state for ExclusiveCheckboxGroup integration
  const getPropSelection = (propKey: string): SelectionState<string> => {
    const groupKey = propGroupKey(propKey);
    return filters().get(groupKey) ?? { type: "all" };
  };

  // Set selection state from ExclusiveCheckboxGroup
  const setPropSelection = (
    propKey: string,
    selection: SelectionState<string>
  ): void => {
    const groupKey = propGroupKey(propKey);
    setFilters((prev) => {
      const newState = new Map(prev);
      if (isAll(selection)) {
        newState.delete(groupKey);
      } else {
        newState.set(groupKey, selection);
      }
      return newState;
    });
  };

  // === Global actions ===

  const clearAllFilters = (): void => {
    setFilters(resetAllFilters());
  };

  const hasActiveFilters = (): boolean => checkActiveFilters(filters());

  return {
    // State (for debugging/inspection)
    filters,

    // Derived values
    filterPredicate,
    filteredInstances,
    propsAnalysis,

    // Package actions
    isPackageSelected,
    togglePackage,
    clearPackageFilters,

    // Prop actions
    isValueChecked,
    toggleValue,
    selectOnlyValue,
    selectOnlyValues,
    selectAllValues,
    clearPropFilter,
    isPropFiltered,
    getCheckedCount,
    getAllValuesCount,
    getFilteredCount,
    getPropSelection,
    setPropSelection,

    // Global actions
    clearAllFilters,
    hasActiveFilters,
  };
}
