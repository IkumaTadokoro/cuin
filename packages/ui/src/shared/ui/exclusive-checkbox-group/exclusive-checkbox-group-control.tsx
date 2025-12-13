import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import { createUniqueId } from "solid-js";
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
  const id = createUniqueId();

  return (
    <>
      <ark.label class="sr-only" for={id}>
        {String(value)}
      </ark.label>
      <ark.input
        checked={group.isChecked(value)}
        id={id}
        onChange={() => group.onControlClick(value)}
        onMouseEnter={() => setHoveredPart("control")}
        onMouseLeave={() => setHoveredPart(null)}
        type="checkbox"
        {...props}
      />
    </>
  );
}
