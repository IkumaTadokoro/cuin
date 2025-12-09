import { createMemo, For, Show } from "solid-js";
import type { InstanceDetailStore } from "~/dataflow/instance";
import { Root } from "~/shared/ui/exclusive-checkbox-group";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import PropValueFilterSection from "./prop-value-filter-section";
import { StyledExclusiveCheckboxItem } from "./styled-exclusive-checkbox-item";

type InstanceFilterProps = {
  store: InstanceDetailStore;
};

export default function InstanceFilter(props: InstanceFilterProps) {
  const { store } = props;

  const allPackageNames = createMemo(() =>
    store.allPackagesWithCount().map((pkg) => pkg.name)
  );

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
          <Root
            onSelectionChange={store.setPackageSelection}
            selection={store.getPackageSelection}
            values={allPackageNames}
          >
            <For each={store.allPackagesWithCount()}>
              {(pkg) => (
                <StyledExclusiveCheckboxItem
                  label={
                    <span class="truncate font-mono text-xs">{pkg.name}</span>
                  }
                  rightAddon={
                    <span class="text-subtext-color text-xs tabular-nums">
                      {pkg.count}
                    </span>
                  }
                  value={pkg.name}
                />
              )}
            </For>
          </Root>
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
