import { createMemo, For, Show } from "solid-js";
import type { InstanceDetailStore } from "~/dataflow/instance";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import PropValueFilterSection from "./prop-value-filter-section";

type InstanceFilterProps = {
  store: InstanceDetailStore;
};

export default function InstanceFilter(props: InstanceFilterProps) {
  const { store } = props;

  const packages = createMemo(() => {
    const packagesMap = new Map<string, number>();
    for (const instance of store.filteredInstances()) {
      const name =
        instance.package.type === "native"
          ? "(no package)"
          : instance.package.name;
      packagesMap.set(name, (packagesMap.get(name) || 0) + 1);
    }
    return Array.from(packagesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  return (
    <div class="flex h-full flex-col gap-6">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-sm text-text-color">Filters</h3>
        <Show when={store.hasActiveFilters()}>
          <button
            class="text-primary text-xs hover:underline"
            onClick={store.clearAllFilters}
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
          <For each={packages()}>
            {(pkg) => (
              <label class="group flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-brand-50">
                <input
                  checked={store.isPackageSelected(pkg.name)}
                  class="rounded border-gray-300"
                  onChange={() => store.togglePackage(pkg.name)}
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
        <ScrollArea class="min-h-0 flex-1">
          <div class="space-y-2">
            <For each={store.propsAnalysis()}>
              {(prop) => <PropValueFilterSection prop={prop} store={store} />}
            </For>
          </div>
        </ScrollArea>
      </section>
    </div>
  );
}
