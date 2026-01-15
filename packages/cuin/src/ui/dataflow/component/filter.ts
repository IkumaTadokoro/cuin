import { isSelected, type SelectionState } from "../../lib/selection-state";
import { always, and, type Predicate } from "../../shared/lib/predicates";
import type { PackageKey, SummaryComponent } from "../payload";

export type FilterState = {
  nameFilter: string;
  packageFilter: SelectionState<PackageKey>;
  usedByPackageFilter: SelectionState<PackageKey>;
};

const byName =
  <T extends SummaryComponent>(query: string): Predicate<T> =>
  (c) =>
    c.name.toLowerCase().includes(query.toLowerCase());

const byPackage =
  <T extends SummaryComponent>(
    selection: SelectionState<PackageKey>
  ): Predicate<T> =>
  (c) =>
    isSelected(selection, c.package.key);

const byUsedInPackage =
  <T extends SummaryComponent>(
    selection: SelectionState<PackageKey>
  ): Predicate<T> =>
  (c) => {
    if (selection.type === "all") return true;
    if (selection.type === "none") return false;
    return c.usedInPackages.some((pkg) => isSelected(selection, pkg.key));
  };

export function buildPredicate<T extends SummaryComponent>(
  state: FilterState
): Predicate<T> {
  return and(
    state.nameFilter === "" ? always() : byName(state.nameFilter),
    byPackage(state.packageFilter),
    byUsedInPackage(state.usedByPackageFilter)
  );
}

export function filterComponents<T extends SummaryComponent>(
  components: T[],
  state: FilterState
): T[] {
  return components.filter(buildPredicate(state));
}
