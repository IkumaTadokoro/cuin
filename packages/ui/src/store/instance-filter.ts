import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type { Instance } from "~/dataflow/core/schema";
import {
  buildFilterPredicate,
  type PropValueFilterState,
} from "../lib/instance-filter";
import type { PropAnalysis } from "../lib/props-analyze";
import { analyzePropsWithFilter } from "../lib/props-analyze";
import type { Predicate } from "../shared/lib/predicates";

export type FilterState = {
  excludedPackages: Set<string>;
  propValueFilters: PropValueFilterState;
};

export function createInstanceFilters(
  allInstances: () => Instance[],
  propsAnalysis: () => PropAnalysis[]
) {
  const initialPropFilters = (): PropValueFilterState => {
    const filterState: PropValueFilterState = {};
    for (const prop of propsAnalysis()) {
      filterState[prop.key] = new Set(prop.values.map((v) => v.value));
    }
    return filterState;
  };

  const [filters, setFilters] = createStore<FilterState>({
    excludedPackages: new Set(),
    propValueFilters: initialPropFilters(),
  });

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

  const filterPredicate = createMemo<Predicate<Instance>>(() =>
    buildFilterPredicate(
      filters.excludedPackages,
      filters.propValueFilters,
      allPropValues()
    )
  );

  const filteredInstances = createMemo(() =>
    allInstances().filter(filterPredicate())
  );

  const filteredPropCounts = createMemo(() =>
    analyzePropsWithFilter(allInstances(), filteredInstances())
  );

  const isPackageSelected = (packageName: string) =>
    !filters.excludedPackages.has(packageName);

  const togglePackage = (packageName: string) => {
    setFilters("excludedPackages", (prev) => {
      const newSet = new Set(prev);
      if (newSet.has(packageName)) {
        newSet.delete(packageName);
      } else {
        newSet.add(packageName);
      }
      return newSet;
    });
  };

  const clearPackageFilters = () => {
    setFilters("excludedPackages", new Set());
  };

  const isValueChecked = (propKey: string, value: string): boolean =>
    filters.propValueFilters[propKey]?.has(value) ?? false;

  const toggleValue = (propKey: string, value: string) => {
    setFilters("propValueFilters", propKey, (prev = new Set()) => {
      const newSet = new Set(prev);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  };

  const selectOnlyValue = (propKey: string, value: string) => {
    setFilters("propValueFilters", propKey, new Set([value]));
  };

  const selectOnlyValues = (propKey: string, values: string[]) => {
    setFilters("propValueFilters", propKey, new Set(values));
  };

  const selectAllValues = (propKey: string) => {
    const allValues = allPropValues().get(propKey) || [];
    setFilters("propValueFilters", propKey, new Set(allValues));
  };

  const clearPropFilter = (propKey: string) => {
    selectAllValues(propKey);
  };

  const isPropFiltered = (propKey: string): boolean => {
    const checked = filters.propValueFilters[propKey];
    const allValues = allPropValues().get(propKey) || [];
    return checked ? checked.size !== allValues.length : false;
  };

  const getCheckedCount = (propKey: string): number =>
    filters.propValueFilters[propKey]?.size || 0;

  const getAllValuesCount = (propKey: string): number =>
    allPropValues().get(propKey)?.length || 0;

  const getFilteredCount = (propKey: string, value: string): number =>
    filteredPropCounts().get(propKey)?.get(value) || 0;

  const clearAllFilters = () => {
    setFilters({
      excludedPackages: new Set(),
      propValueFilters: initialPropFilters(),
    });
  };

  const hasActiveFilters = () => {
    if (filters.excludedPackages.size > 0) {
      return true;
    }

    for (const prop of propsAnalysis()) {
      if (isPropFiltered(prop.key)) {
        return true;
      }
    }

    return false;
  };

  return {
    filters,
    filterPredicate,
    filteredInstances,
    isPackageSelected,
    togglePackage,
    clearPackageFilters,
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
    clearAllFilters,
    hasActiveFilters,
  };
}
