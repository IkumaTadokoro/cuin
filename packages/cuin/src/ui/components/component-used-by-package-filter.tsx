import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";
import type { PackageKey, SummaryComponent } from "~/dataflow/payload";
import type { SelectionState } from "~/lib/selection-state";
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
  package: { key: PackageKey } & Package;
  count: number;
};

export default function ComponentUsedByPackageFilter(
  props: ComponentUsedByPackageFilterProps
) {
  const packagesWithUsageCount = createMemo((): PackageUsageInfo[] => {
    const packageMap = new Map<PackageKey, PackageUsageInfo>();

    for (const component of props.components()) {
      for (const pkg of component.usedInPackages) {
        const existing = packageMap.get(pkg.key);
        if (existing) {
          existing.count += 1;
        } else {
          packageMap.set(pkg.key, { package: pkg, count: 1 });
        }
      }
    }

    return Array.from(packageMap.values()).sort((a, b) => b.count - a.count);
  });

  const allPackageKeys = createMemo(() =>
    packagesWithUsageCount().map((item) => item.package.key)
  );

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Used By</p>
        <div class="grid gap-1">
          <Root
            onSelectionChange={props.onSelectionChange}
            selection={props.selection}
            values={allPackageKeys}
          >
            <For each={packagesWithUsageCount()}>
              {(item) => (
                <StyledExclusiveCheckboxItem
                  label={<PackageComponent {...item.package} />}
                  rightAddon={<Count value={item.count} />}
                  value={item.package.key}
                />
              )}
            </For>
          </Root>
        </div>
      </div>
    </ScrollArea>
  );
}
