import { createMemo, createSignal } from "solid-js";
import type { Instance } from "../../../types/schema";
import { isAll, type SelectionState } from "../../lib/selection-state";
import type { Predicate } from "../../shared/lib/predicates";
import {
  buildPredicate,
  type FilterContext,
  getPackageName,
  packageGroupKey,
  propGroupKey,
} from "./filter";
import {
  hasActiveFilters as checkActiveFilters,
  type FiltersState,
  getGroupEffectiveValues,
  initialFilters,
  isGroupFiltered,
  isValueSelected,
  resetAllFilters,
  selectAll,
  selectOnly,
  toggleValue as toggleFilterValue,
} from "./filters-state";
import { analyzeProps, countFilteredProps } from "./props-analyze";

type DataSource = {
  instances: () => Instance[];
};

export type InstanceDetailStore = ReturnType<typeof createInstanceStore>;

export function createInstanceStore(dataSource: DataSource) {
  const [filters, setFilters] = createSignal<FiltersState>(initialFilters());

  const propsAnalysis = createMemo(() => analyzeProps(dataSource.instances()));

  const allPackages = createMemo(() => [
    ...new Set(dataSource.instances().map(getPackageName)),
  ]);

  const allPackagesWithCount = createMemo(() => {
    const packagesMap = new Map<
      string,
      { pkg: Instance["package"]; count: number }
    >();
    for (const instance of dataSource.instances()) {
      const name = getPackageName(instance);
      const existing = packagesMap.get(name);
      if (existing) {
        existing.count += 1;
      } else {
        packagesMap.set(name, { pkg: instance.package, count: 1 });
      }
    }
    return Array.from(packagesMap.values())
      .map(({ pkg, count }) => {
        if (!pkg || pkg.type === "native") {
          return { package: { type: "native" as const }, count };
        }
        return { package: pkg, count };
      })
      .sort((a, b) => b.count - a.count);
  });

  const allPropValues = createMemo(
    () =>
      new Map(
        propsAnalysis().map((prop) => [
          prop.key,
          prop.values.map((v) => v.value),
        ])
      )
  );

  const filterContext = createMemo(
    (): FilterContext => ({
      allPackages: allPackages(),
      allPropValues: allPropValues(),
    })
  );

  const filterPredicate = createMemo<Predicate<Instance>>(() =>
    buildPredicate(filters(), filterContext())
  );

  const filteredInstances = createMemo(() =>
    dataSource.instances().filter(filterPredicate())
  );

  const filteredPropCounts = createMemo(() =>
    countFilteredProps(dataSource.instances(), filteredInstances())
  );

  const isPackageSelected = (packageName: string): boolean =>
    isValueSelected(filters(), packageGroupKey, packageName);

  const togglePackage = (packageName: string): void => {
    setFilters((prev) =>
      toggleFilterValue(prev, packageGroupKey, packageName, allPackages())
    );
  };

  const clearPackageFilters = (): void => {
    setFilters((prev) => selectAll(prev, packageGroupKey));
  };

  const isValueChecked = (propKey: string, value: string): boolean => {
    const groupKey = propGroupKey(propKey);
    return isValueSelected(filters(), groupKey, value);
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

  const getPropSelection = (propKey: string): SelectionState<string> => {
    const groupKey = propGroupKey(propKey);
    return filters().get(groupKey) ?? { type: "all" };
  };

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

  const getPackageSelection = (): SelectionState<string> =>
    filters().get(packageGroupKey) ?? { type: "all" };

  const setPackageSelection = (selection: SelectionState<string>): void => {
    setFilters((prev) => {
      const newState = new Map(prev);
      if (isAll(selection)) {
        newState.delete(packageGroupKey);
      } else {
        newState.set(packageGroupKey, selection);
      }
      return newState;
    });
  };

  const clearAllFilters = (): void => {
    setFilters(resetAllFilters());
  };

  const hasActiveFilters = (): boolean => checkActiveFilters(filters());

  return {
    filters,

    filterPredicate,
    filteredInstances,
    propsAnalysis,

    allPackagesWithCount,
    isPackageSelected,
    togglePackage,
    clearPackageFilters,
    getPackageSelection,
    setPackageSelection,

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

    clearAllFilters,
    hasActiveFilters,
  };
}
