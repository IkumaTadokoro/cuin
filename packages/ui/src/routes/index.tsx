import { createEffect } from "solid-js";
import ComponentList from "~/components/component-list";
import { ComponentListCount } from "~/components/component-list-count";
import { ComponentNameFilter } from "~/components/component-name-filter";
import { ComponentOrderSelect } from "~/components/component-order-select";
import ComponentPackageFilter from "~/components/component-package-filter";
import { useHeader } from "~/components/header/header-provider";
import { ComponentIcon } from "~/components/icons";
import Separator from "~/components/separator";
import { useSummaryData } from "~/contexts/analysis";
import { createComponentListStore } from "~/dataflow/component";
import { useComponentListUrlSync } from "~/dataflow/component/url-state";
import { Spacer } from "~/shared/ui/space";

export default function Index() {
  const { setHeader } = useHeader();
  const data = useSummaryData();

  createEffect(() => {
    const d = data();
    if (d) {
      setHeader({
        title: {
          icon: <ComponentIcon class="text-2xl" />,
          text: "Components",
        },
        description: `All components used in ${d.meta.basePath}`,
        breadcrumbs: ["cuin"],
      });
    }
  });

  const store = createComponentListStore({
    components: () => data()?.components ?? [],
    packages: () => data()?.packages ?? [],
  });

  useComponentListUrlSync(store, store.allPackageKeys);

  return (
    <div class="grid h-screen w-full grid-cols-[30%_1px_1fr] overflow-hidden px-0 2xl:px-12">
      <div class="flex h-full flex-col gap-4 overflow-hidden border-neutral-border border-l px-4 py-4 font-mono">
        <p class="shrink-0 font-semibold text-sm text-subtext-color">
          Filter By
        </p>
        <ComponentNameFilter
          onChange={store.setNameFilter}
          value={store.state.nameFilter}
        />
        <ComponentPackageFilter
          allPackages={() => data()?.packages ?? []}
          onSelectionChange={store.setPackageFilter}
          selection={store.getPackageFilter}
        />
      </div>
      <div class="h-full bg-brand-200" />
      <div class="flex h-full flex-col gap-4 overflow-hidden border-neutral-border border-r px-4 py-6">
        <div class="flex items-center justify-between gap-2">
          <ComponentListCount count={store.sortedComponents().length} />
          <Spacer />
          <ComponentOrderSelect
            onChange={store.setSort}
            sortKey={store.state.sortKey}
            sortOrder={store.state.sortOrder}
          />
        </div>
        <Separator />
        <ComponentList components={store.sortedComponents} />
      </div>
    </div>
  );
}
