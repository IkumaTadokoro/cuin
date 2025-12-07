import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import { useExclusiveCheckboxGroupItemContext } from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupControlProps
  extends Omit<HTMLProps<"input">, "type" | "checked" | "onChange"> {}

/**
 * Checkbox input for the exclusive checkbox group item.
 * Handles toggle behavior on click.
 */
export function ExclusiveCheckboxGroupControl<T>(
  props: ExclusiveCheckboxGroupControlProps
) {
  const group = useExclusiveCheckboxGroupContext<T>();
  const { value, setHoveredPart } = useExclusiveCheckboxGroupItemContext<T>();

  return (
    <ark.input
      checked={group.isChecked(value)}
      onChange={() => group.onControlClick(value)}
      onMouseEnter={() => setHoveredPart("control")}
      onMouseLeave={() => setHoveredPart(null)}
      type="checkbox"
      {...props}
    />
  );
}
