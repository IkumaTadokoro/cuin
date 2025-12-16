import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import type { JSX } from "solid-js";
import type { LabelAction } from "./use-exclusive-checkbox-group";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupIndicatorProps
  extends Omit<HTMLProps<"span">, "children"> {
  /**
   * Render function that receives actions for each part and current hovered part.
   * - controlAction: Always "toggle" (clicking checkbox toggles)
   * - labelAction: Depends on current state ("only" | "all" | "toggle")
   * - hoveredPart: Which part is currently being hovered ("control" | "label" | null)
   */
  children?: (
    controlAction: "toggle",
    labelAction: LabelAction,
    hoveredPart: "control" | "label" | null
  ) => JSX.Element;
}

/**
 * Indicator that provides action information for control and label parts.
 * Use the render prop to customize the display based on hover state.
 */
export function ExclusiveCheckboxGroupIndicator<T>(
  props: ExclusiveCheckboxGroupIndicatorProps
) {
  const group = useExclusiveCheckboxGroupContext<T>();
  const { value, hoveredPart } = useExclusiveCheckboxGroupItemContext<T>();

  const controlAction = "toggle" as const;
  const labelAction = () => group.getLabelAction(value);

  return (
    <ark.span
      data-control-action={controlAction}
      data-hovered-part={hoveredPart()}
      data-label-action={labelAction()}
      {...props}
    >
      {props.children?.(controlAction, labelAction(), hoveredPart())}
    </ark.span>
  );
}
