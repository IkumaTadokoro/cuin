import { TbComponents as ComponentIcon } from "solid-icons/tb";
import { createEffect } from "solid-js";
import ComponentList from "~/components/component-list";
import { ComponentListCount } from "~/components/component-list-count";
import { ComponentNameFilter } from "~/components/component-name-filter";
import { ComponentOrderSelect } from "~/components/component-order-select";
import ComponentPackageFilter from "~/components/component-package-filter";
import { useHeader } from "~/components/header/header-provider";
import Separator from "~/components/separator";
import { useData } from "~/contexts/analysis";
import { createComponentListStore } from "~/dataflow/component";
import {
  ResizableHandle,
  ResizablePanel,
  ResizableRoot,
} from "~/shared/ui/resizable/resizable";
import { Spacer } from "~/shared/ui/space";

export default function Index() {
  const { setHeader } = useHeader();
  const data = useData();

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

  return (
    <ResizableRoot class="h-screen w-full overflow-hidden px-0 2xl:px-12">
      <ResizablePanel
        class="flex h-full flex-col gap-4 overflow-hidden border-neutral-border border-l px-4 py-4 font-mono"
        initialSize={0.3}
      >
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
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        class="flex h-full flex-col gap-4 overflow-hidden border-neutral-border border-x px-4 py-6"
        initialSize={0.7}
      >
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
      </ResizablePanel>
    </ResizableRoot>
  );
}
