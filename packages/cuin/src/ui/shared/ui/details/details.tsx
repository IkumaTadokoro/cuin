import type { Component, JSX, ParentProps } from "solid-js";
import { ChevronDownIcon } from "~/components/icons";
import { useDetailsGroup } from "./details-group";
import { createDetailsVisibility } from "./details-visibility";

type Props = {
  summary: JSX.Element;
  open?: boolean;
  class?: string;
};

export const Details: Component<ParentProps<Props>> = (props) => {
  const { detailsRef } = useDetailsGroup();
  const { isVisible, handleContentVisibilityChange, Provider } =
    createDetailsVisibility();

  return (
    <details
      class="details min-w-0 rounded-md border border-brand-200"
      open={props.open ?? false}
      ref={detailsRef}
    >
      <summary class="flex cursor-pointer select-none list-none flex-wrap items-center gap-2 rounded-md bg-brand-50/70 px-3 py-2 font-mono text-sm">
        <ChevronDownIcon class="h-4 w-4 opacity-50 transition [details[open]_&]:rotate-180" />
        <div class="flex-1">{props.summary}</div>
      </summary>
      <div
        class="details-content grid gap-4 border-brand-200 border-t p-4"
        onContentVisibilityAutoStateChange={handleContentVisibilityChange}
      >
        <Provider value={{ isVisible }}>{props.children}</Provider>
      </div>
    </details>
  );
};
