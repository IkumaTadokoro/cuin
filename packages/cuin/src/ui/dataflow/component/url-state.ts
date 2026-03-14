import { useSearchParams } from "@solidjs/router";
import { createEffect, createSignal, untrack } from "solid-js";
import type { PackageKey } from "~/dataflow/payload";
import {
  deserializeSelectionState,
  parseSortKey,
  parseSortOrder,
  serializeSelectionState,
} from "~/lib/url-sync";
import { parseAsString } from "~/shared/lib/search-param";
import type { createComponentListStore } from "./index";

export function useComponentListUrlSync(
  store: ReturnType<typeof createComponentListStore>,
  allPackageKeys: () => PackageKey[]
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const [initialized, setInitialized] = createSignal(false);

  createEffect(() => {
    const params = searchParams;
    const keys = allPackageKeys();

    if (keys.length === 0) {
      return;
    }

    untrack(() => {
      const nameFilter = parseAsString(params.name);
      const packageFilter = deserializeSelectionState(params.packages, keys);
      const usedByPackageFilter = deserializeSelectionState(
        params.usedBy,
        keys
      );
      const sortKey = parseSortKey(params.sort);
      const sortOrder = parseSortOrder(params.order);

      store.setStoreState({
        nameFilter,
        packageFilter,
        usedByPackageFilter,
        sortKey,
        sortOrder,
      });

      setInitialized(true);
    });
  });

  createEffect(() => {
    if (!initialized() || allPackageKeys().length === 0) {
      return;
    }

    const {
      nameFilter,
      packageFilter,
      usedByPackageFilter,
      sortKey,
      sortOrder,
    } = store.state;

    const newParams: Record<string, string | undefined> = {
      name: nameFilter || undefined,
      packages: serializeSelectionState(packageFilter),
      usedBy: serializeSelectionState(usedByPackageFilter),
      sort: sortKey === "name" ? undefined : sortKey,
      order: sortOrder === "asc" ? undefined : sortOrder,
    };

    setSearchParams(newParams, { replace: true });
  });
}
