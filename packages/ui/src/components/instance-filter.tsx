import type { Accessor } from "solid-js";
import { For, Show } from "solid-js";
import type { PackageInfo } from "~/lib/instance-filter";
import type { PropAnalysis } from "~/lib/props-analyze";
import PropValueFilterSection from "./prop-value-filter-section";

type InstanceFilterProps = {
  packages: Accessor<PackageInfo[]>;
  propsAnalysis: Accessor<PropAnalysis[]>;
  isPackageSelected: (packageName: string) => boolean;
  togglePackage: (packageName: string) => void;
  isValueChecked: (propKey: string, value: string) => boolean;
  toggleValue: (propKey: string, value: string) => void;
  selectOnlyValue: (propKey: string, value: string) => void;
  selectOnlyValues: (propKey: string, values: string[]) => void;
  selectAllValues: (propKey: string) => void;
  clearPropFilter: (propKey: string) => void;
  isPropFiltered: (propKey: string) => boolean;
  getCheckedCount: (propKey: string) => number;
  getAllValuesCount: (propKey: string) => number;
  getFilteredCount: (propKey: string, value: string) => number;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
};

export default function InstanceFilter(props: InstanceFilterProps) {
  return (
    <div class="flex h-full flex-col gap-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm text-text-color">Filters</h3>
        <Show when={props.hasActiveFilters}>
          <button
            class="text-primary text-xs hover:underline"
            onClick={props.clearAllFilters}
            type="button"
          >
            Clear all
          </button>
        </Show>
      </div>

      <section>
        <h4 class="mb-2 font-semibold text-subtext-color text-xs uppercase tracking-wide">
          Package
        </h4>
        <div class="max-h-64 space-y-1 overflow-y-auto">
          <For each={props.packages()}>
            {(pkg) => (
              <label class="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-brand-50">
                <input
                  checked={props.isPackageSelected(pkg.name)}
                  class="rounded border-gray-300"
                  onChange={() => props.togglePackage(pkg.name)}
                  type="checkbox"
                />
                <span class="flex-1 truncate font-mono text-xs">
                  {pkg.name}
                </span>
                <span class="text-subtext-color text-xs tabular-nums">
                  {pkg.count}
                </span>
              </label>
            )}
          </For>
        </div>
      </section>

      <section class="flex min-h-0 flex-1 flex-col">
        <h4 class="mb-2 font-semibold text-subtext-color text-xs uppercase tracking-wide">
          Props
        </h4>
        <div class="space-y-2 overflow-y-auto">
          <For each={props.propsAnalysis()}>
            {(prop) => (
              <PropValueFilterSection
                clearPropFilter={props.clearPropFilter}
                getAllValuesCount={props.getAllValuesCount}
                getCheckedCount={props.getCheckedCount}
                getFilteredCount={props.getFilteredCount}
                isPropFiltered={props.isPropFiltered}
                isValueChecked={props.isValueChecked}
                prop={prop}
                selectAllValues={props.selectAllValues}
                selectOnlyValue={props.selectOnlyValue}
                selectOnlyValues={props.selectOnlyValues}
                toggleValue={props.toggleValue}
              />
            )}
          </For>
        </div>
      </section>
    </div>
  );
}
