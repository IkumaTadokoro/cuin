import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import type { JSX } from "solid-js";
import { createSplitProps } from "../../lib/create-split-props";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import {
  createItemContext,
  ExclusiveCheckboxGroupItemProvider,
} from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupItemProps<T>
  extends Omit<HTMLProps<"div">, "children"> {
  /**
   * The value this item represents
   */
  value: T;

  /**
   * Children
   */
  children?: JSX.Element;
}

export function ExclusiveCheckboxGroupItem<T>(
  props: ExclusiveCheckboxGroupItemProps<T>
) {
  const [itemProps, localProps] = createSplitProps<{ value: T }>()(props, [
    "value",
  ]);
  const group = useExclusiveCheckboxGroupContext<T>();
  const itemContext = createItemContext(itemProps.value);

  return (
    <ExclusiveCheckboxGroupItemProvider value={itemContext}>
      <ark.div
        data-checked={group.isChecked(itemProps.value) ? "" : undefined}
        style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}
        {...localProps}
      />
    </ExclusiveCheckboxGroupItemProvider>
  );
}
