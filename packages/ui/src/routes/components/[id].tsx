import { useParams } from "@solidjs/router";
import { BiSolidCategoryAlt as CategoryAltIcon } from "solid-icons/bi";
import { createEffect, createMemo, For, Show } from "solid-js";
import { Code } from "~/components/code/code";
import { useHeader } from "~/components/header/header-provider";
import InstanceFilter from "~/components/instance-filter";
import { Package } from "~/components/package/package";
import { PropsBadge } from "~/components/props-badge";
import Separator from "~/components/separator";
import { useData } from "~/contexts/analysis";
import { getInstancePackages } from "~/lib/instance-filter";
import { analyzeProps } from "~/lib/props-analyze";
import { Details } from "~/shared/ui/details/details";
import {
  DetailsGroup,
  ToggleAllDetailsButton,
} from "~/shared/ui/details/details-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizableRoot,
} from "~/shared/ui/resizable/resizable";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Spacer } from "~/shared/ui/space";
import { createInstanceFilters } from "~/store/instance-filter";

const MAX_OPEN_ITEMS = 300;

export default function ComponentPage() {
  const params = useParams();
  const data = useData();
  const { setHeader } = useHeader();

  const component = createMemo(() => {
    const d = data();
    if (!d) {
      return;
    }
    return d.components.find((c) => c.id === params.id);
  });

  createEffect(() => {
    const currentComponent = component();
    if (currentComponent) {
      setHeader({
        title: {
          text: currentComponent.name,
          icon: <CategoryAltIcon class="text-2xl" />,
        },
        description: <Package size="sm" {...currentComponent.package} />,
        breadcrumbs: ["cuin", "components"],
      });
    }
  });

  return (
    <Show
      fallback={
        <div class="flex h-screen items-center justify-center">Loading...</div>
      }
      when={data()}
    >
      <Show
        fallback={
          <div class="flex h-screen items-center justify-center">
            Component not found
          </div>
        }
        when={component()}
      >
        {(currentComponent) => (
          <ComponentPageContent component={currentComponent()} />
        )}
      </Show>
    </Show>
  );
}

type ComponentType = NonNullable<
  ReturnType<ReturnType<typeof useData>>
>["components"][number];

function ComponentPageContent(props: { component: ComponentType }) {
  const data = useData();

  const propsAnalysis = createMemo(() =>
    analyzeProps(props.component.instances)
  );

  const filterStore = createInstanceFilters(
    () => props.component.instances,
    propsAnalysis
  );

  const availablePackages = createMemo(() =>
    getInstancePackages(props.component.instances)
  );

  const filteredInstances = () => filterStore.filteredInstances();

  return (
    <ResizableRoot class="h-screen w-full px-0 2xl:px-12">
      <ResizablePanel
        class="flex flex-col overflow-y-auto border-neutral-border border-l px-4 py-4"
        initialSize={0.2}
      >
        <InstanceFilter
          clearAllFilters={filterStore.clearAllFilters}
          clearPropFilter={filterStore.clearPropFilter}
          getAllValuesCount={filterStore.getAllValuesCount}
          getCheckedCount={filterStore.getCheckedCount}
          getFilteredCount={filterStore.getFilteredCount}
          hasActiveFilters={filterStore.hasActiveFilters()}
          isPackageSelected={filterStore.isPackageSelected}
          isPropFiltered={filterStore.isPropFiltered} // 追加
          isValueChecked={filterStore.isValueChecked}
          packages={availablePackages}
          propsAnalysis={propsAnalysis}
          selectAllValues={filterStore.selectAllValues}
          selectOnlyValue={filterStore.selectOnlyValue}
          selectOnlyValues={filterStore.selectOnlyValues}
          togglePackage={filterStore.togglePackage}
          toggleValue={filterStore.toggleValue}
        />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        class="flex flex-col gap-4 overflow-hidden border-neutral-border border-r px-4 py-6"
        initialSize={0.8}
      >
        <DetailsGroup>
          <div class="grid grid-cols-[auto_1fr_max-content_max-content] items-center gap-2">
            <div class="flex items-center gap-2">
              <CategoryAltIcon class="text-lg text-subtext-color" />
              <p class="text-lg">{filteredInstances().length}</p>
              <p class="text-sm">usages</p>
            </div>
            <Spacer />
            <ToggleAllDetailsButton mode="open" />
            <ToggleAllDetailsButton mode="close" />
          </div>
          <Separator />
          <ScrollArea class="min-h-0">
            <div class="grid max-w-full gap-2">
              <For each={filteredInstances()}>
                {(instance) => (
                  <Details
                    class="min-w-0"
                    open={props.component.instances.length <= MAX_OPEN_ITEMS}
                    summary={instance.filePath}
                  >
                    <Code
                      basePath={data()?.meta.basePath || ""}
                      code={instance.raw}
                      filePath={instance.filePath}
                      span={instance.span}
                    />
                    <div class="flex flex-wrap gap-1">
                      <For each={instance.props}>
                        {(prop) => <PropsBadge {...prop} />}
                      </For>
                    </div>
                  </Details>
                )}
              </For>
            </div>
          </ScrollArea>
        </DetailsGroup>
      </ResizablePanel>
    </ResizableRoot>
  );
}
