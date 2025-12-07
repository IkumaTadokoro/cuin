import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import type {
  Component,
  PackageKey,
  PackageWithCount,
} from "../dataflow/core/payload";
import {
  type FilterState,
  filterComponents,
  type SortOption,
  sortComponents,
} from "../lib/component-filter";
import {
  all,
  initialSelection,
  isSelected,
  type SelectionState,
  toggle,
} from "../lib/selection-state";

type DataSource = {
  components: () => Component[];
  packages: () => PackageWithCount[];
};

export function createComponentFilters(dataSource: DataSource) {
  const [filters, setFilters] = createStore<FilterState>({
    nameQuery: "",
    packageSelection: initialSelection<PackageKey>(),
    sortBy: "name-asc",
  });

  const allPackageKeys = createMemo(() =>
    dataSource.packages().map((pkg) => pkg.key)
  );

  const filteredComponents = createMemo(() =>
    filterComponents(dataSource.components(), filters, allPackageKeys())
  );

  const sortedComponents = createMemo(() =>
    sortComponents(filteredComponents(), filters.sortBy)
  );

  const isPackageSelected = (packageKey: PackageKey) =>
    isSelected(filters.packageSelection, packageKey, allPackageKeys());

  const togglePackage = (packageKey: PackageKey) => {
    setFilters(
      "packageSelection",
      toggle(filters.packageSelection, packageKey, allPackageKeys())
    );
  };

  const setNameQuery = (query: string) => {
    setFilters("nameQuery", query);
  };

  const setSortBy = (sortBy: SortOption) => {
    setFilters("sortBy", sortBy);
  };

  const selectAllPackages = () => {
    setFilters("packageSelection", all<PackageKey>());
  };

  const getPackageSelection = (): SelectionState<PackageKey> =>
    filters.packageSelection;

  const setPackageSelection = (selection: SelectionState<PackageKey>): void => {
    setFilters("packageSelection", selection);
  };

  return {
    filters,
    // Derived
    allPackageKeys,
    filteredComponents,
    sortedComponents,
    // Actions
    isPackageSelected,
    togglePackage,
    setNameQuery,
    setSortBy,
    selectAllPackages,
    getPackageSelection,
    setPackageSelection,
  };
}
