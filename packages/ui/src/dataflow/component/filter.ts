import { isSelected, type SelectionState } from "../../lib/selection-state";
import { always, and, type Predicate } from "../../shared/lib/predicates";
import type { Component, PackageKey } from "../payload";

export type FilterState = {
  nameFilter: string;
  packageFilter: SelectionState<PackageKey>;
};

const byName =
  (query: string): Predicate<Component> =>
  (c) =>
    c.name.toLowerCase().includes(query.toLowerCase());

const byPackage =
  (selection: SelectionState<PackageKey>): Predicate<Component> =>
  (c) =>
    isSelected(selection, c.package.key);

export function buildPredicate(state: FilterState): Predicate<Component> {
  return and(
    state.nameFilter === "" ? always() : byName(state.nameFilter),
    byPackage(state.packageFilter)
  );
}

export function filterComponents(
  components: Component[],
  state: FilterState
): Component[] {
  return components.filter(buildPredicate(state));
}
