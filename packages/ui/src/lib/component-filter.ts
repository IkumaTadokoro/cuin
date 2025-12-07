import { orderBy } from "es-toolkit";
import type { Component, PackageKey } from "../dataflow/core/payload";
import { isSelected, type SelectionState } from "./selection-state";

export type FilterState = {
  nameQuery: string;
  packageSelection: SelectionState<PackageKey>;
  sortBy: SortOption;
};

export function filterComponents(
  components: Component[],
  filters: FilterState,
  allPackageKeys: PackageKey[]
): Component[] {
  return components.filter((component) => {
    if (
      filters.nameQuery &&
      !component.name.toLowerCase().includes(filters.nameQuery.toLowerCase())
    ) {
      return false;
    }

    return isSelected(
      filters.packageSelection,
      component.package.key,
      allPackageKeys
    );
  });
}

export type SortOption = "name-asc" | "name-desc" | "usage-asc" | "usage-desc";
export type SortOptionItem = {
  value: SortOption;
  label: string;
};
export const SORT_OPTIONS = [
  { value: "name-asc", label: "Name (asc)" },
  { value: "name-desc", label: "Name (desc)" },
  { value: "usage-asc", label: "Usage (asc)" },
  { value: "usage-desc", label: "Usage (desc)" },
] as const satisfies SortOptionItem[];

export function sortComponents(
  components: Component[],
  sortBy: SortOption
): Component[] {
  const sorted = [...components];

  switch (sortBy) {
    case "name-asc":
      return orderBy(sorted, ["name"], ["asc"]);

    case "name-desc":
      return orderBy(sorted, ["name"], ["desc"]);

    case "usage-asc":
      return orderBy(sorted, ["instanceCount"], ["asc"]);

    case "usage-desc":
      return orderBy(sorted, ["instanceCount"], ["desc"]);

    default:
      return sorted;
  }
}
