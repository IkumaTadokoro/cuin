import { BiRegularChevronDown as ChevronDownIcon } from "solid-icons/bi";
import type { Component, JSX, ParentProps } from "solid-js";
import { useDetailsGroup } from "./details-group";

type Props = {
  summary: JSX.Element;
  open?: boolean;
  class?: string;
};

export const Details: Component<ParentProps<Props>> = (props) => {
  const { groupId } = useDetailsGroup();

  return (
    <details
      class="min-w-0 rounded-md border border-brand-200"
      data-group={groupId}
      open={props.open ?? false}
    >
      <summary class="flex cursor-pointer select-none list-none flex-wrap items-center gap-2 rounded-md bg-brand-50/70 px-3 py-2 font-mono text-sm">
        <ChevronDownIcon class="h-4 w-4 opacity-50 transition [details[open]_&]:rotate-180" />
        <div class="flex-1">{props.summary}</div>
      </summary>
      <div class="grid gap-4 border-brand-200 border-t p-4">
        {props.children}
      </div>
    </details>
  );
};
