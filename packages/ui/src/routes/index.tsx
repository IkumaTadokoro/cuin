import { TbComponents as ComponentIcon } from "solid-icons/tb";
import { createMemo } from "solid-js";
import ComponentList from "~/components/component-list";
import { ComponentListCount } from "~/components/component-list-count";
import { ComponentNameFilter } from "~/components/component-name-filter";
import { ComponentOrderSelect } from "~/components/component-order-select";
import ComponentPackageFilter from "~/components/component-package-filter";
import { useHeader } from "~/components/header/header-provider";
import Separator from "~/components/separator";
import { useData } from "~/contexts/analysis";
import { filterComponents, sortComponents } from "~/lib/component-filter";
import {
  ResizableHandle,
  ResizablePanel,
  ResizableRoot,
} from "~/shared/ui/resizable/resizable";
import { Spacer } from "~/shared/ui/space";
import { createComponentFilters } from "~/store/component-filter";

export default function Index() {
  const { setHeader } = useHeader();
  const data = useData();

  setHeader({
    title: {
      icon: <ComponentIcon class="text-2xl" />,
      text: "Components",
    },
    description: `All components used in ${data()?.meta.basePath}`,
    breadcrumbs: ["cuin"],
  });

  const filterStore = createComponentFilters();

  const filteredAndSortedComponents = createMemo(() => {
    const d = data();
    if (!d) {
      return [];
    }
    const filtered = filterComponents(d.components, filterStore.filters);

    return sortComponents(filtered, filterStore.filters.sortBy);
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
          onChange={filterStore.setNameQuery}
          value={filterStore.filters.nameQuery}
        />
        <ComponentPackageFilter
          allPackages={() => data()?.packages ?? []}
          isPackageSelected={filterStore.isPackageSelected}
          togglePackage={filterStore.togglePackage}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        class="flex h-full flex-col gap-4 overflow-hidden border-neutral-border border-x px-4 py-6"
        initialSize={0.7}
      >
        <div class="flex items-center justify-between gap-2">
          <ComponentListCount count={filteredAndSortedComponents().length} />
          <Spacer />
          <ComponentOrderSelect
            onChange={filterStore.setSortBy}
            value={filterStore.filters.sortBy}
          />
        </div>
        <Separator />
        <ComponentList components={filteredAndSortedComponents} />
      </ResizablePanel>
    </ResizableRoot>
  );
}
