import { ark, type HTMLProps } from "@ark-ui/solid/factory";
import type { Accessor, JSX } from "solid-js";
import type { SelectionState } from "../../../lib/selection-state";
import { createSplitProps } from "../../lib/create-split-props";
import { useExclusiveCheckboxGroup } from "./use-exclusive-checkbox-group";
import { ExclusiveCheckboxGroupProvider } from "./use-exclusive-checkbox-group-context";

type RootSpecificProps<T> = {
  /**
   * All possible values in the group
   */
  values: Accessor<T[]>;

  /**
   * Controlled selection state (optional)
   */
  selection?: Accessor<SelectionState<T>>;

  /**
   * Called when selection changes
   */
  onSelectionChange?: (state: SelectionState<T>) => void;

  /**
   * Default selection state for uncontrolled mode
   */
  defaultSelection?: SelectionState<T>;

  /**
   * Children
   */
  children?: JSX.Element;
};

export type ExclusiveCheckboxGroupRootProps<T> = RootSpecificProps<T> &
  Omit<HTMLProps<"div">, keyof RootSpecificProps<T>>;

export function ExclusiveCheckboxGroupRoot<T>(
  props: ExclusiveCheckboxGroupRootProps<T>
) {
  const [groupProps, localProps] = createSplitProps<RootSpecificProps<T>>()(
    props,
    ["values", "selection", "onSelectionChange", "defaultSelection", "children"]
  );

  const group = useExclusiveCheckboxGroup({
    values: groupProps.values,
    selection: groupProps.selection,
    onSelectionChange: groupProps.onSelectionChange,
    defaultSelection: groupProps.defaultSelection,
  });

  return (
    <ExclusiveCheckboxGroupProvider value={group}>
      <ark.div {...localProps}>{groupProps.children}</ark.div>
    </ExclusiveCheckboxGroupProvider>
  );
}
