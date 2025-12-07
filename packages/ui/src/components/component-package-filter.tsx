import { groupBy } from "es-toolkit";
import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";
import type {
  MergedPackageKey,
  PackageKey,
  PackageWithCount,
} from "~/dataflow/core/payload";
import { getMergedKeyFromPackageKey } from "~/dataflow/core/payload";
import type { SelectionState } from "~/lib/selection-state";
import { Root } from "~/shared/ui/exclusive-checkbox-group";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Count } from "./count";
import { Package } from "./package/package";
import { StyledExclusiveCheckboxItem } from "./styled-exclusive-checkbox-item";

type MergedPackageWithCount = {
  key: MergedPackageKey;
  originalKeys: PackageKey[];
  type: "internal" | "native";
  name: string;
  version: string;
  count: number;
};

type FilterPanelProps = {
  allPackages: Accessor<PackageWithCount[]>;
  selection: Accessor<SelectionState<PackageKey>>;
  onSelectionChange: (
    selection: SelectionState<PackageKey>,
    allPackages: PackageKey[]
  ) => void;
  mergeInternalExternal: boolean;
};

export default function ComponentPackageFilter(props: FilterPanelProps) {
  const mergedPackages = createMemo((): MergedPackageWithCount[] => {
    if (!props.mergeInternalExternal) {
      return [];
    }

    const packages = props.allPackages();
    const grouped = groupBy(packages, (pkg) =>
      getMergedKeyFromPackageKey(pkg.key)
    );

    return Object.entries(grouped).map(([mergedKey, pkgs]) => ({
      key: mergedKey as MergedPackageKey,
      originalKeys: pkgs.map((p) => p.key),
      type: pkgs[0].type === "native" ? "native" : "internal",
      name: pkgs[0].type === "native" ? "native" : pkgs[0].name,
      version: pkgs[0].type === "native" ? "" : pkgs[0].version,
      count: pkgs.reduce((sum, p) => sum + p.count, 0),
    }));
  });

  const displayPackages = createMemo(() =>
    props.mergeInternalExternal ? mergedPackages() : props.allPackages()
  );

  const allPackageKeys = createMemo(() =>
    props.allPackages().map((pkg) => pkg.key)
  );

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Package</p>
        <div class="grid gap-1">
          <Root
            onSelectionChange={(state) =>
              props.onSelectionChange(state, allPackageKeys())
            }
            selection={props.selection}
            values={allPackageKeys}
          >
            <For each={displayPackages()}>
              {(pkg) => {
                const isMerged = props.mergeInternalExternal;
                const packageKey = isMerged
                  ? (pkg as MergedPackageWithCount).originalKeys[0]
                  : (pkg as PackageWithCount).key;

                return (
                  <StyledExclusiveCheckboxItem
                    label={
                      isMerged ? (
                        <Package {...(pkg as MergedPackageWithCount)} />
                      ) : (
                        <Package {...(pkg as PackageWithCount)} />
                      )
                    }
                    rightAddon={<Count value={pkg.count} />}
                    value={packageKey}
                  />
                );
              }}
            </For>
          </Root>
        </div>
      </div>
    </ScrollArea>
  );
}
