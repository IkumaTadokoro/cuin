import type { HTMLProps } from "@ark-ui/solid/factory";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupOverlayProps extends HTMLProps<"span"> {}

export const ExclusiveCheckboxGroupOverlay = (
  props: ExclusiveCheckboxGroupOverlayProps
) => {
  const group = useExclusiveCheckboxGroupContext();
  const { value, hoveredPart } = useExclusiveCheckboxGroupItemContext();

  const overlayText = () => {
    if (hoveredPart() === "control") {
      return "Toggle";
    }
    if (hoveredPart() === "label") {
      return group.getOverlayText(value);
    }
    return null;
  };

  return (
    <span
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center bg-white pl-2 text-brand-400 text-xs opacity-0 group-hover:opacity-100"
      {...props}
    >
      {overlayText()}
    </span>
  );
};
