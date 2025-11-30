import { groupBy } from "es-toolkit";
import type { Accessor } from "solid-js";
import { createMemo, For } from "solid-js";
import type {
  MergedPackageKey,
  PackageKey,
  PackageWithCount,
} from "~/dataflow/core/payload";
import { getMergedKeyFromPackageKey } from "~/dataflow/core/payload";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Package } from "./package/package";
import SmartCheckbox from "./smart-checkbox";

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
  isPackageSelected: (packageKey: PackageKey) => boolean;
  togglePackage: (packageKey: PackageKey) => void;
  selectOnlyPackage: (packageKey: PackageKey) => void;
  selectAllPackages: () => void;
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

  const getSelectedPackagesCount = () =>
    displayPackages().filter((pkg) =>
      props.isPackageSelected(pkg.key as PackageKey)
    ).length;

  const isOnlyChecked = (packageKey: PackageKey | MergedPackageKey) => {
    const selectedCount = getSelectedPackagesCount();
    return (
      selectedCount === 1 && props.isPackageSelected(packageKey as PackageKey)
    );
  };

  const hasOthersChecked = (packageKey: PackageKey | MergedPackageKey) => {
    const selectedCount = getSelectedPackagesCount();
    if (selectedCount === 0) {
      return false;
    }
    return (
      !props.isPackageSelected(packageKey as PackageKey) || selectedCount > 1
    );
  };

  return (
    <ScrollArea class="min-h-0 flex-1 pr-2">
      <div class="grid gap-2">
        <p>Package</p>
        <div class="grid gap-1">
          <For each={displayPackages()}>
            {(pkg) => {
              const isMerged = props.mergeInternalExternal;
              const packageKey = isMerged
                ? (pkg as MergedPackageWithCount).originalKeys[0]
                : (pkg as PackageWithCount).key;

              return (
                <SmartCheckbox
                  checked={props.isPackageSelected(packageKey)}
                  count={pkg.count}
                  hasOthersChecked={hasOthersChecked(packageKey)}
                  isOnlyChecked={isOnlyChecked(packageKey)}
                  label={
                    isMerged ? (
                      <Package {...(pkg as MergedPackageWithCount)} />
                    ) : (
                      <Package {...(pkg as PackageWithCount)} />
                    )
                  }
                  onAll={props.selectAllPackages}
                  onOnly={() => props.selectOnlyPackage(packageKey)}
                  onToggle={() => props.togglePackage(packageKey)}
                />
              );
            }}
          </For>
        </div>
      </div>
    </ScrollArea>
  );
}
