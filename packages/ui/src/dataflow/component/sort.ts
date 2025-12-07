import { orderBy } from "es-toolkit";
import type { Component } from "../payload";

export type SortKey = "name" | "usage";
export type SortOrder = "asc" | "desc";

export type SortState = {
  sortKey: SortKey;
  sortOrder: SortOrder;
};

export type SortOptionItem = {
  key: SortKey;
  order: SortOrder;
  label: string;
};

export const SORT_OPTIONS = [
  { key: "name", order: "asc", label: "Name (asc)" },
  { key: "name", order: "desc", label: "Name (desc)" },
  { key: "usage", order: "asc", label: "Usage (asc)" },
  { key: "usage", order: "desc", label: "Usage (desc)" },
] as const satisfies readonly SortOptionItem[];

export function sortComponents(
  components: Component[],
  state: SortState
): Component[] {
  const field = state.sortKey === "name" ? "name" : "instanceCount";
  return orderBy(components, [field], [state.sortOrder]);
}
