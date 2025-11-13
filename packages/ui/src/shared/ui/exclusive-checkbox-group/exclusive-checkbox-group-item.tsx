import type { HTMLProps, PolymorphicProps } from "@ark-ui/solid/factory";
import { createSplitProps } from "../../lib/create-split-props";
import { useExclusiveCheckboxGroupContext } from "./use-exclusive-checkbox-group-context";
import {
  createItemContext,
  ExclusiveCheckboxGroupItemProvider,
} from "./use-exclusive-checkbox-group-item-context";

export interface ExclusiveCheckboxGroupItemBaseProps
  extends PolymorphicProps<"div"> {
  value: string;
}

export interface ExclusiveCheckboxGroupItemProps
  extends HTMLProps<"div">,
    ExclusiveCheckboxGroupItemBaseProps {}

export const ExclusiveCheckboxGroupItem = (
  props: ExclusiveCheckboxGroupItemProps
) => {
  const [itemProps, localProps] = createSplitProps<{ value: string }>()(props, [
    "value",
  ]);
  const group = useExclusiveCheckboxGroupContext();
  const itemContext = createItemContext(itemProps.value);

  return (
    <ExclusiveCheckboxGroupItemProvider value={itemContext}>
      <div
        class="group relative flex items-center gap-2"
        data-checked={group.isChecked(itemProps.value) ? "" : undefined}
        {...localProps}
      />
    </ExclusiveCheckboxGroupItemProvider>
  );
};
