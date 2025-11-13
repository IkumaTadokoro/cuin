import { createStore } from "solid-js/store";
import type { PackageKey } from "../dataflow/core/payload";
import type { FilterState, SortOption } from "../lib/component-filter";

export function createComponentFilters() {
  const [filters, setFilters] = createStore<FilterState>({
    nameQuery: "",
    excludedPackages: new Set<PackageKey>(),
    sortBy: "name-asc",
  });

  const isPackageSelected = (packageKey: PackageKey) =>
    !filters.excludedPackages.has(packageKey);

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

  return {
    filters,
    isPackageSelected,
    togglePackage,
    setNameQuery,
    setSortBy,
  };
}
