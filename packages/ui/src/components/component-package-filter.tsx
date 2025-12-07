import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";
import type { PackageKey, PackageWithCount } from "~/dataflow/payload";
import type { SelectionState } from "~/lib/selection-state";
import { Root } from "~/shared/ui/exclusive-checkbox-group";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Count } from "./count";
import { Package } from "./package/package";
import { StyledExclusiveCheckboxItem } from "./styled-exclusive-checkbox-item";

type FilterPanelProps = {
  allPackages: Accessor<PackageWithCount[]>;
  selection: Accessor<SelectionState<PackageKey>>;
  onSelectionChange: (selection: SelectionState<PackageKey>) => void;
};

export default function ComponentPackageFilter(props: FilterPanelProps) {
  const allPackageKeys = createMemo(() =>
    props.allPackages().map((pkg) => pkg.key)
  );

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Package</p>
        <div class="grid gap-1">
          <Root
            onSelectionChange={props.onSelectionChange}
            selection={props.selection}
            values={allPackageKeys}
          >
            <For each={props.allPackages()}>
              {(pkg) => (
                <StyledExclusiveCheckboxItem
                  label={<Package {...pkg} />}
                  rightAddon={<Count value={pkg.count} />}
                  value={pkg.key}
                />
              )}
            </For>
          </Root>
        </div>
      </div>
    </ScrollArea>
  );
}
