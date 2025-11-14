import type { Accessor } from "solid-js";
import { For } from "solid-js";
import type { PackageKey, PackageWithCount } from "~/dataflow/core/payload";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Package } from "./package/package";
import SmartCheckbox from "./smart-checkbox";

type FilterPanelProps = {
  allPackages: Accessor<PackageWithCount[]>;
  isPackageSelected: (packageKey: PackageKey) => boolean;
  togglePackage: (packageKey: PackageKey) => void;
  selectOnlyPackage: (packageKey: PackageKey) => void;
  selectAllPackages: () => void;
};

export default function ComponentPackageFilter(props: FilterPanelProps) {
  const getSelectedPackagesCount = () =>
    props.allPackages().filter((pkg) => props.isPackageSelected(pkg.key))
      .length;

  const isOnlyChecked = (packageKey: PackageKey) => {
    const selectedCount = getSelectedPackagesCount();
    return selectedCount === 1 && props.isPackageSelected(packageKey);
  };

  const hasOthersChecked = (packageKey: PackageKey) => {
    const selectedCount = getSelectedPackagesCount();
    if (selectedCount === 0) {
      return false;
    }
    return !props.isPackageSelected(packageKey) || selectedCount > 1;
  };

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Package</p>
        <div class="grid gap-1">
          <For each={props.allPackages()}>
            {(pkg) => (
              <SmartCheckbox
                checked={props.isPackageSelected(pkg.key)}
                count={pkg.count}
                hasOthersChecked={hasOthersChecked(pkg.key)}
                isOnlyChecked={isOnlyChecked(pkg.key)}
                label={<Package {...pkg} />}
                onAll={props.selectAllPackages}
                onOnly={() => props.selectOnlyPackage(pkg.key)}
                onToggle={() => props.togglePackage(pkg.key)}
              />
            )}
          </For>
        </div>
      </div>
    </ScrollArea>
  );
}
