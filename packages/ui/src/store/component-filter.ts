import { createStore } from "solid-js/store";
import type { MergedPackageKey, PackageKey } from "../dataflow/core/payload";
import { getMergedKeyFromPackageKey } from "../dataflow/core/payload";
import type { FilterState, SortOption } from "../lib/component-filter";
import type { SelectionState } from "../lib/selection-state";
import { isAll, nonEmptySet } from "../lib/selection-state";

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

  // Convert excluded set to SelectionState for ExclusiveCheckboxGroup integration
  const getPackageSelection = (
    allPackages: PackageKey[]
  ): SelectionState<PackageKey> => {
    const excluded = filters.mergeInternalExternal
      ? filters.excludedMergedPackages
      : filters.excludedPackages;

    if (excluded.size === 0) {
      return { type: "all" };
    }

    // Convert "excluded" to "selected"
    const selected = allPackages.filter(
      (pkg) =>
        !excluded.has(
          filters.mergeInternalExternal
            ? getMergedKeyFromPackageKey(pkg)
            : (pkg as PackageKey | MergedPackageKey)
        )
    );

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
      if (filters.mergeInternalExternal) {
        const allMerged = new Set(allPackages.map(getMergedKeyFromPackageKey));
        setFilters("excludedMergedPackages", allMerged);
      } else {
        setFilters("excludedPackages", new Set(allPackages));
      }
      return;
    }

    // selection.type === "some"
    if (selection.type !== "some") {
      return;
    }
    const selectedSet = selection.values;
    if (filters.mergeInternalExternal) {
      const selectedMerged = new Set(
        [...selectedSet].map(getMergedKeyFromPackageKey)
      );
      const allMerged = new Set(allPackages.map(getMergedKeyFromPackageKey));
      const excluded = new Set(
        [...allMerged].filter((key) => !selectedMerged.has(key))
      );
      setFilters("excludedMergedPackages", excluded);
    } else {
      const excluded = new Set(
        allPackages.filter((key) => !selectedSet.has(key))
      );
      setFilters("excludedPackages", excluded);
    }
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
