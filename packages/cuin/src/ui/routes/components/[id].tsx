import { useParams } from "@solidjs/router";
import { createEffect, createSignal, For, onMount, Show } from "solid-js";
import { Code } from "~/components/code/code";
import { CopyButton } from "~/components/copy-button/copy-button";
import { useHeader } from "~/components/header/header-provider";
import { CategoryIcon } from "~/components/icons";
import InstanceFilter from "~/components/instance-filter";
import { Package } from "~/components/package/package";
import { PropsBadge } from "~/components/props-badge";
import Separator from "~/components/separator";
import { useComponentDetail, useMetaData } from "~/contexts/analysis";
import { createInstanceStore } from "~/dataflow/instance";
import type { TransformedComponent } from "~/dataflow/payload";
import { getFileName } from "~/lib/get-file-name";
import { Details } from "~/shared/ui/details/details";
import { DetailsGroup } from "~/shared/ui/details/details-group";
import { ToggleAllDetailsButton } from "~/shared/ui/details/toggle-all-details-button";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import { Spacer } from "~/shared/ui/space";

const MAX_OPEN_ITEMS = 300;
const INITIAL_RENDER_COUNT = 100;
const CHUNK_SIZE = 100;

export default function ComponentPage() {
  const params = useParams<{ id: string }>();
  const { setHeader } = useHeader();
  const component = useComponentDetail(() => params.id);

  createEffect(() => {
    const currentComponent = component();
    if (currentComponent) {
      setHeader({
        title: {
          text: currentComponent.name,
          icon: <CategoryIcon class="text-2xl" />,
        },
        description: <Package size="sm" {...currentComponent.package} />,
        breadcrumbs: ["cuin", "components"],
      });
    }
  });

  return (
    <Show
      fallback={
        <div class="flex h-screen items-center justify-center">
          {component.loading ? "Loading..." : "Component not found"}
        </div>
      }
      when={component()}
    >
      {(currentComponent) => (
        <ComponentPageContent component={currentComponent()} />
      )}
    </Show>
  );
}

function ComponentPageContent(props: { component: TransformedComponent }) {
  const meta = useMetaData();

  const store = createInstanceStore({
    instances: () => props.component.instances,
  });

  const [visibleCount, setVisibleCount] = createSignal(INITIAL_RENDER_COUNT);

  const addMore = () => {
    const filtered = store.filteredInstances();
    setVisibleCount((c) => {
      if (c >= filtered.length) {
        return c;
      }
      const next = Math.min(c + CHUNK_SIZE, filtered.length);
      if (next < filtered.length) {
        requestIdleCallback(addMore);
      }
      return next;
    });
  };

  createEffect(() => {
    store.filteredInstances();
    setVisibleCount(INITIAL_RENDER_COUNT);
    requestIdleCallback(addMore);
  });

  const visibleInstances = () =>
    store.filteredInstances().slice(0, visibleCount());

  const isLoading = () => visibleCount() < store.filteredInstances().length;

  return (
    <div class="grid h-screen w-full grid-cols-[30%_1px_1fr] overflow-hidden px-0 2xl:px-12">
      <div class="flex flex-col overflow-y-auto border-neutral-border border-l px-4 py-4">
        <InstanceFilter store={store} />
      </div>
      <div class="h-full bg-brand-200" />
      <div class="flex flex-col gap-4 overflow-hidden border-neutral-border border-r px-4 py-6">
        <DetailsGroup>
          <div class="grid grid-cols-[auto_1fr_max-content_max-content_max-content] items-center gap-2">
            <div class="flex items-center gap-2">
              <CategoryIcon class="text-lg text-subtext-color" />
              <p class="text-lg">{store.filteredInstances().length}</p>
              <p class="text-sm">usages</p>
              <Show when={isLoading()}>
                <span class="text-subtext-color text-xs">
                  (Loading {visibleCount()}/{store.filteredInstances().length})
                </span>
              </Show>
            </div>
            <Spacer />
            <CopyButton
              componentName={props.component.name}
              componentPackage={props.component.package}
              instances={store.filteredInstances()}
            />
            <ToggleAllDetailsButton mode="open" />
            <ToggleAllDetailsButton mode="close" />
          </div>
          <Separator />
          <ScrollArea class="min-h-0">
            <div class="grid max-w-full gap-2">
              <For each={visibleInstances()}>
                {(instance) => (
                  <Details
                    class="min-w-0"
                    open={props.component.instances.length <= MAX_OPEN_ITEMS}
                    summary={
                      <div class="flex items-center justify-between">
                        <p>{`${getFileName(instance.filePath)}:${instance.span.startLine}:${instance.span.startCol}`}</p>
                        {instance.package && <Package {...instance.package} />}
                      </div>
                    }
                  >
                    <Code
                      basePath={meta()?.basePath || ""}
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
      </div>
    </div>
  );
}
