import { ScrollArea as ArkScrollArea } from "@ark-ui/solid/scroll-area";
import type { Component, ParentProps } from "solid-js";

type ScrollAreaProps = ParentProps & {
  class?: string;
};

export const ScrollArea: Component<ScrollAreaProps> = (props) => (
  <ArkScrollArea.Root class={`relative ${props.class || ""}`}>
    <ArkScrollArea.Viewport
      class="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-brand-100/50"
      style={{ "scrollbar-width": "none" }}
    >
      <ArkScrollArea.Content class="pr-4">
        {props.children}
      </ArkScrollArea.Content>
    </ArkScrollArea.Viewport>
    <ArkScrollArea.Scrollbar class="flex h-full w-2.5 select-none border-l border-l-transparent p-px transition-colors">
      <ArkScrollArea.Thumb class="relative flex-1 rounded-full bg-brand-200 opacity-0 transition-opacity duration-100 ease-linear data-hover:opacity-100" />
    </ArkScrollArea.Scrollbar>
    <ArkScrollArea.Corner />
  </ArkScrollArea.Root>
);
