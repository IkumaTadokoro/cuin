import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import {
  all,
  initialSelection,
  isSelected,
  type SelectionState,
  toggle,
} from "../../lib/selection-state";
import type { Component, PackageKey, PackageWithCount } from "../payload";
import { type FilterState, filterComponents } from "./filter";
import {
  type SortKey,
  type SortOrder,
  type SortState,
  sortComponents,
} from "./sort";

type DataSource = {
  components: () => Component[];
  packages: () => PackageWithCount[];
};

type StoreState = FilterState & SortState;

export function createComponentListStore(dataSource: DataSource) {
  const [state, setState] = createStore<StoreState>({
    nameFilter: "",
    packageFilter: initialSelection<PackageKey>(),
    sortKey: "name",
    sortOrder: "asc",
  });

  const allPackageKeys = createMemo(() =>
    dataSource.packages().map((pkg) => pkg.key)
  );

  const filteredComponents = createMemo(() =>
    filterComponents(dataSource.components(), state)
  );

  const sortedComponents = createMemo(() =>
    sortComponents(filteredComponents(), state)
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

  return {
    state,
    allPackageKeys,
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
  };
}
