import { createStore } from "solid-js/store";
import type { PackageKey } from "../dataflow/core/payload";
import type { FilterState, SortOption } from "../lib/component-filter";
import type { SelectionState } from "../lib/selection-state";
import { isAll, nonEmptySet } from "../lib/selection-state";

export function createComponentFilters() {
  const [filters, setFilters] = createStore<FilterState>({
    nameQuery: "",
    excludedPackages: new Set<PackageKey>(),
    sortBy: "name-asc",
  });

  const isPackageSelected = (packageKey: PackageKey) => {
    return !filters.excludedPackages.has(packageKey);
  };

  const togglePackage = (packageKey: PackageKey) => {
    setFilters("excludedPackages", (prev) => {
      const newSet = new Set(prev);
      if (newSet.has(packageKey)) {
        newSet.delete(packageKey);
      } else {
        newSet.add(packageKey);
      }
      return newSet;
    });
  };

  const setNameQuery = (query: string) => {
    setFilters("nameQuery", query);
  };

  const setSortBy = (sortBy: SortOption) => {
    setFilters("sortBy", sortBy);
  };

  const selectOnlyPackage = (
    packageKey: PackageKey,
    allPackages: PackageKey[]
  ) => {
    const packagesToExclude = allPackages.filter((key) => key !== packageKey);
    setFilters("excludedPackages", new Set(packagesToExclude));
  };

  const selectAllPackages = () => {
    setFilters("excludedPackages", new Set<PackageKey>());
  };

  // Convert excluded set to SelectionState for ExclusiveCheckboxGroup integration
  const getPackageSelection = (
    allPackages: PackageKey[]
  ): SelectionState<PackageKey> => {
    const excluded = filters.excludedPackages;

    if (excluded.size === 0) {
      return { type: "all" };
    }

    // Convert "excluded" to "selected"
    const selected = allPackages.filter((pkg) => !excluded.has(pkg));

    if (selected.length === 0) {
      return { type: "none" };
    }

    const nonEmpty = nonEmptySet(selected);
    if (nonEmpty === null) {
      return { type: "none" };
    }

    return { type: "some", values: nonEmpty };
  };

  // Convert SelectionState back to excluded set
  const setPackageSelection = (
    selection: SelectionState<PackageKey>,
    allPackages: PackageKey[]
  ): void => {
    if (isAll(selection)) {
      selectAllPackages();
      return;
    }

    if (selection.type === "none") {
      // Exclude all
      setFilters("excludedPackages", new Set(allPackages));
      return;
    }

    // selection.type === "some"
    if (selection.type !== "some") {
      return;
    }
    const selectedSet = selection.values;
    const excluded = new Set(
      allPackages.filter((key) => !selectedSet.has(key))
    );
    setFilters("excludedPackages", excluded);
  };

  return {
    filters,
    isPackageSelected,
    togglePackage,
    setNameQuery,
    setSortBy,
    selectOnlyPackage,
    selectAllPackages,
    getPackageSelection,
    setPackageSelection,
  };
}
