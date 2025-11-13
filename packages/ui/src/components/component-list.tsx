import { A } from "@solidjs/router";
import { type Accessor, For } from "solid-js";
import { ScrollArea } from "~/shared/ui/scroll-area/scroll-area";
import type { Component } from "../dataflow/core/payload";
import ComponentName from "./component-name";
import { Package } from "./package/package";
import Separator from "./separator";
import { UsageCount } from "./usage-count";

type ComponentListProps = {
  components: Accessor<Component[]>;
};

export default function ComponentList(props: ComponentListProps) {
  return (
    <ScrollArea class="min-h-0 flex-1">
      <ul class="grid gap-2">
        <For each={props.components()}>
          {(component) => (
            <li>
              <A
                class="group flex items-center justify-between gap-2"
                href={`/components/${component.id}`}
              >
                <ComponentName
                  class="text-brand-500 group-hover:text-brand-900"
                  name={component.name}
                />
                <Separator class="flex-1 group-hover:text-brand-200" />
                <Package {...component.package} />
                <UsageCount count={component.instanceCount} />
              </A>
            </li>
          )}
        </For>
      </ul>
    </ScrollArea>
  );
}
