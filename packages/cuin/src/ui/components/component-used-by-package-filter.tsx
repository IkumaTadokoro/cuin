import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";
import {
  getMergedPackageKey,
  type MergedPackageKey,
  type PackageKey,
  type SummaryComponent,
} from "~/dataflow/payload";
import { nonEmptySetOf, type SelectionState } from "~/lib/selection-state";
import { ExclusiveCheckboxGroupRoot as Root } from "~/shared/ui/exclusive-checkbox-group/exclusive-checkbox-group-root";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import type { Package } from "../../types/schema";
import { Count } from "./count";
import { Package as PackageComponent } from "./package/package";
import { StyledExclusiveCheckboxItem } from "./styled-exclusive-checkbox-item";

type ComponentUsedByPackageFilterProps = {
  components: Accessor<SummaryComponent[]>;
  selection: Accessor<SelectionState<PackageKey>>;
  onSelectionChange: (selection: SelectionState<PackageKey>) => void;
};

type PackageUsageInfo = {
  mergedKey: MergedPackageKey;
  package: { key: PackageKey } & Package;
  count: number;
};

const convertToPackageKeySelection = (
  mergedSelection: SelectionState<MergedPackageKey>,
  allComponents: SummaryComponent[]
): SelectionState<PackageKey> => {
  if (mergedSelection.type === "all") return { type: "all" };
  if (mergedSelection.type === "none") return { type: "none" };

  const packageKeys = new Set<PackageKey>();
  for (const component of allComponents) {
    for (const pkg of component.usedInPackages) {
      const mergedKey = getMergedPackageKey(pkg);
      if (mergedSelection.values.has(mergedKey)) {
        packageKeys.add(pkg.key);
      }
    }
  }

  if (packageKeys.size === 0) {
    return { type: "none" };
  }

  const keysArray = Array.from(packageKeys);
  return {
    type: "some",
    values: nonEmptySetOf(keysArray[0], ...keysArray.slice(1)),
  };
};

const convertToMergedKeySelection = (
  packageKeySelection: SelectionState<PackageKey>,
  allComponents: SummaryComponent[]
): SelectionState<MergedPackageKey> => {
  if (packageKeySelection.type === "all") return { type: "all" };
  if (packageKeySelection.type === "none") return { type: "none" };

  const mergedKeys = new Set<MergedPackageKey>();
  for (const component of allComponents) {
    for (const pkg of component.usedInPackages) {
      if (packageKeySelection.values.has(pkg.key)) {
        const mergedKey = getMergedPackageKey(pkg);
        mergedKeys.add(mergedKey);
      }
    }
  }

  if (mergedKeys.size === 0) {
    return { type: "none" };
  }

  const keysArray = Array.from(mergedKeys);
  return {
    type: "some",
    values: nonEmptySetOf(keysArray[0], ...keysArray.slice(1)),
  };
};

export default function ComponentUsedByPackageFilter(
  props: ComponentUsedByPackageFilterProps
) {
  const packagesWithUsageCount = createMemo((): PackageUsageInfo[] => {
    const packageMap = new Map<MergedPackageKey, PackageUsageInfo>();

    for (const component of props.components()) {
      for (const pkg of component.usedInPackages) {
        const mergedKey = getMergedPackageKey(pkg);
        const existing = packageMap.get(mergedKey);

        if (existing) {
          existing.count += 1;
          if (existing.package.type === "external" && pkg.type === "internal") {
            existing.package = pkg;
          }
        } else {
          packageMap.set(mergedKey, {
            mergedKey,
            package: pkg,
            count: 1,
          });
        }
      }
    }

    return Array.from(packageMap.values()).sort((a, b) => b.count - a.count);
  });

  const allMergedKeys = createMemo(() =>
    packagesWithUsageCount().map((item) => item.mergedKey)
  );

  const handleSelectionChange = (
    selection: SelectionState<MergedPackageKey>
  ) => {
    const packageKeySelection = convertToPackageKeySelection(
      selection,
      props.components()
    );
    props.onSelectionChange(packageKeySelection);
  };

  const mergedSelection = createMemo(() =>
    convertToMergedKeySelection(props.selection(), props.components())
  );

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Used By</p>
        <div class="grid gap-1">
          <Root
            onSelectionChange={handleSelectionChange}
            selection={mergedSelection}
            values={allMergedKeys}
          >
            <For each={packagesWithUsageCount()}>
              {(item) => (
                <StyledExclusiveCheckboxItem
                  label={<PackageComponent {...item.package} />}
                  rightAddon={<Count value={item.count} />}
                  value={item.mergedKey}
                />
              )}
            </For>
          </Root>
        </div>
      </div>
    </ScrollArea>
  );
}
