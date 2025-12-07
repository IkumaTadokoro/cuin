import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import type { JSX } from "solid-js";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupLabelProps
  extends Omit<HTMLProps<"button">, "type" | "onClick" | "children"> {
  children?: JSX.Element;
}

/**
 * Label/button for the exclusive checkbox group item.
 * Handles smart click behavior (Only/All/Toggle).
 */
export function ExclusiveCheckboxGroupLabel<T>(
  props: ExclusiveCheckboxGroupLabelProps
) {
  const group = useExclusiveCheckboxGroupContext<T>();
  const { value, setHoveredPart } = useExclusiveCheckboxGroupItemContext<T>();

  return (
    <ark.button
      onClick={() => group.onLabelClick(value)}
      onMouseEnter={() => setHoveredPart("label")}
      onMouseLeave={() => setHoveredPart(null)}
      style={{
        display: "flex",
        flex: "1",
        "min-width": "0",
        "align-items": "center",
        "justify-content": "space-between",
        gap: "0.5rem",
      }}
      type="button"
      {...props}
    />
  );
}
