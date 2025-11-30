import { createStore } from "solid-js/store";
import type { MergedPackageKey, PackageKey } from "../dataflow/core/payload";
import { getMergedKeyFromPackageKey } from "../dataflow/core/payload";
import type { FilterState, SortOption } from "../lib/component-filter";

export function createComponentFilters() {
  const [filters, setFilters] = createStore<FilterState>({
    nameQuery: "",
    excludedPackages: new Set<PackageKey>(),
    excludedMergedPackages: new Set<MergedPackageKey>(),
    sortBy: "name-asc",
    mergeInternalExternal: true,
  });

  const isPackageSelected = (packageKey: PackageKey) => {
    if (filters.mergeInternalExternal) {
      const mergedKey = getMergedKeyFromPackageKey(packageKey);
      return !filters.excludedMergedPackages.has(mergedKey);
    }
    return !filters.excludedPackages.has(packageKey);
  };

  const togglePackage = (packageKey: PackageKey) => {
    if (filters.mergeInternalExternal) {
      const mergedKey = getMergedKeyFromPackageKey(packageKey);
      setFilters("excludedMergedPackages", (prev) => {
        const newSet = new Set(prev);
        if (newSet.has(mergedKey)) {
          newSet.delete(mergedKey);
        } else {
          newSet.add(mergedKey);
        }
        return newSet;
      });
    } else {
      setFilters("excludedPackages", (prev) => {
        const newSet = new Set(prev);
        if (newSet.has(packageKey)) {
          newSet.delete(packageKey);
        } else {
          newSet.add(packageKey);
        }
        return newSet;
      });
    }
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
    if (filters.mergeInternalExternal) {
      const mergedKey = getMergedKeyFromPackageKey(packageKey);
      const allMergedKeys = [
        ...new Set(allPackages.map(getMergedKeyFromPackageKey)),
      ];
      const packagesToExclude = allMergedKeys.filter(
        (key) => key !== mergedKey
      );
      setFilters("excludedMergedPackages", new Set(packagesToExclude));
    } else {
      const packagesToExclude = allPackages.filter((key) => key !== packageKey);
      setFilters("excludedPackages", new Set(packagesToExclude));
    }
  };

  const selectAllPackages = () => {
    setFilters("excludedPackages", new Set<PackageKey>());
    setFilters("excludedMergedPackages", new Set<MergedPackageKey>());
  };

  return {
    filters,
    isPackageSelected,
    togglePackage,
    setNameQuery,
    setSortBy,
    selectOnlyPackage,
    selectAllPackages,
  };
}
