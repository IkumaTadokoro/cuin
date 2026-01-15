import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import {
  all,
  initialSelection,
  isSelected,
  type SelectionState,
  toggle,
} from "../../lib/selection-state";
import type {
  PackageKey,
  PackageWithCount,
  SummaryComponent,
} from "../payload";
import { type FilterState, filterComponents } from "./filter";
import {
  type SortKey,
  type SortOrder,
  type SortState,
  sortComponents,
} from "./sort";

type DataSource = {
  components: () => SummaryComponent[];
  packages: () => PackageWithCount[];
};

type StoreState = FilterState & SortState;

export function createComponentListStore(dataSource: DataSource) {
  const [state, setState] = createStore<StoreState>({
    nameFilter: "",
    packageFilter: initialSelection<PackageKey>(),
    usedByPackageFilter: initialSelection<PackageKey>(),
    sortKey: "name",
    sortOrder: "asc",
  });

  const allPackageKeys = createMemo(() =>
    dataSource.packages().map((pkg) => pkg.key)
  );

  const nameFilteredComponents = createMemo(() => {
    const components = dataSource.components();
    if (state.nameFilter === "") return components;
    return components.filter((c) =>
      c.name.toLowerCase().includes(state.nameFilter.toLowerCase())
    );
  });

  const filteredComponents = createMemo(() =>
    filterComponents(dataSource.components(), state)
  );

  const componentsWithFilteredCounts = createMemo(() => {
    const filtered = filteredComponents();
    const usedByFilter = state.usedByPackageFilter;

    if (usedByFilter.type === "all") return filtered;

    return filtered
      .map((component) => {
        let filteredCount = 0;
        if (usedByFilter.type === "some") {
          for (const [pkgKey, count] of component.instanceCountByPackage) {
            if (isSelected(usedByFilter, pkgKey)) {
              filteredCount += count;
            }
          }
        }
        return { ...component, instanceCount: filteredCount };
      })
      .filter((c) => c.instanceCount > 0);
  });

  const sortedComponents = createMemo(() =>
    sortComponents(componentsWithFilteredCounts(), state)
  );

  const setNameFilter = (query: string) => {
    setState("nameFilter", query);
  };

  const setSortKey = (key: SortKey) => {
    setState("sortKey", key);
  };

  const setSortOrder = (order: SortOrder) => {
    setState("sortOrder", order);
  };

  const setSort = (key: SortKey, order: SortOrder) => {
    setState({ sortKey: key, sortOrder: order });
  };

  const isPackageSelected = (packageKey: PackageKey) =>
    isSelected(state.packageFilter, packageKey);

  const togglePackage = (packageKey: PackageKey) => {
    setState(
      "packageFilter",
      toggle(state.packageFilter, packageKey, allPackageKeys())
    );
  };

  const selectAllPackages = () => {
    setState("packageFilter", all<PackageKey>());
  };

  const getPackageFilter = (): SelectionState<PackageKey> =>
    state.packageFilter;

  const setPackageFilter = (selection: SelectionState<PackageKey>): void => {
    setState("packageFilter", selection);
  };

  const setStoreState = (newState: Partial<StoreState>): void => {
    setState(newState);
  };

  const getUsedByPackageFilter = (): SelectionState<PackageKey> =>
    state.usedByPackageFilter;

  const setUsedByPackageFilter = (
    selection: SelectionState<PackageKey>
  ): void => {
    setState("usedByPackageFilter", selection);
  };

  return {
    state,
    allPackageKeys,
    nameFilteredComponents,
    filteredComponents,
    sortedComponents,
    setNameFilter,
    setSortKey,
    setSortOrder,
    setSort,
    isPackageSelected,
    togglePackage,
    selectAllPackages,
    getPackageFilter,
    setPackageFilter,
    setStoreState,
    getUsedByPackageFilter,
    setUsedByPackageFilter,
  };
}
