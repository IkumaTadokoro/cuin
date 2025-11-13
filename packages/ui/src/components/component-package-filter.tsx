import type { Accessor } from "solid-js";
import { For } from "solid-js";
import type { PackageKey, PackageWithCount } from "~/dataflow/core/payload";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Package } from "./package/package";

type FilterPanelProps = {
  allPackages: Accessor<PackageWithCount[]>;
  isPackageSelected: (packageKey: PackageKey) => boolean;
  togglePackage: (packageKey: PackageKey) => void;
};

export default function ComponentPackageFilter(props: FilterPanelProps) {
  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Package</p>
        <div class="grid gap-1">
          <For each={props.allPackages()}>
            {(pkg) => (
              <label class="grid grid-cols-[auto_1fr_max-content] items-center gap-2 text-sm">
                <input
                  checked={props.isPackageSelected(pkg.key)}
                  onChange={() => props.togglePackage(pkg.key)}
                  type="checkbox"
                />
                <Package {...pkg} />
                <p class="text-subtext-color">{pkg.count}</p>
              </label>
            )}
          </For>
        </div>
      </div>
    </ScrollArea>
  );
}
