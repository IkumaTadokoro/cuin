import { createStore } from "solid-js/store";
import type { PackageKey } from "../dataflow/core/payload";
import type { FilterState, SortOption } from "../lib/component-filter";
import {
  all,
  initialSelection,
  isSelected,
  type SelectionState,
  toggle,
} from "../lib/selection-state";

export function createComponentFilters() {
  const [filters, setFilters] = createStore<FilterState>({
    nameQuery: "",
    packageSelection: initialSelection<PackageKey>(),
    sortBy: "name-asc",
  });

  const isPackageSelected = (
    packageKey: PackageKey,
    allPackages: PackageKey[]
  ) => isSelected(filters.packageSelection, packageKey, allPackages);

  const togglePackage = (packageKey: PackageKey, allPackages: PackageKey[]) => {
    setFilters(
      "packageSelection",
      toggle(filters.packageSelection, packageKey, allPackages)
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
    isPackageSelected,
    togglePackage,
    setNameQuery,
    setSortBy,
    selectAllPackages,
    getPackageSelection,
    setPackageSelection,
  };
}
