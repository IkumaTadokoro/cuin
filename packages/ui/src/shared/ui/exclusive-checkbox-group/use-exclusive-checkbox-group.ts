import { type Accessor, createMemo, createSignal } from "solid-js";
import {
  getLabelAction,
  handleControlClick,
  handleLabelClick,
  type LabelAction,
} from "../../../lib/exclusive-selection";
import {
  getEffectiveValues,
  initialSelection,
  isSelected,
  type SelectionState,
} from "../../../lib/selection-state";

// Re-export for convenience
export type { LabelAction } from "../../../lib/exclusive-selection";

export type UseExclusiveCheckboxGroupProps<T> = {
  /**
   * All possible values in the group
   */
  values: Accessor<T[]>;

  /**
   * Controlled selection state (optional)
   * If provided, the component becomes controlled
   */
  selection?: Accessor<SelectionState<T>>;

  /**
   * Called when selection changes
   */
  onSelectionChange?: (state: SelectionState<T>) => void;

  /**
   * Default selection state for uncontrolled mode
   * @default { type: "all" }
   */
  defaultSelection?: SelectionState<T>;
};

export type ExclusiveCheckboxGroupReturn<T> = {
  /**
   * Current selection state
   */
  selection: Accessor<SelectionState<T>>;

  /**
   * Number of currently selected values
   */
  selectedCount: Accessor<number>;

  /**
   * Total number of values
   */
  totalCount: Accessor<number>;

  /**
   * Check if a specific value is selected
   */
  isChecked: (value: T) => boolean;

  /**
   * Handle checkbox control click (always toggle)
   */
  onControlClick: (value: T) => void;

  /**
   * Handle label click (smart action)
   */
  onLabelClick: (value: T) => void;

  /**
   * Get the action that will be performed on label click
   */
  getLabelAction: (value: T) => LabelAction;
};

/**
 * Headless hook for exclusive checkbox group behavior.
 *
 * Provides Datadog-style checkbox interactions:
 * - Checkbox click: Toggle individual item
 * - Label click: Smart behavior based on current state
 *   - Multiple selected → Select only this one ("Only")
 *   - Only this selected & multiple exist → Select all ("All")
 *   - Only this selected & only one exists → Toggle off ("Toggle")
 *   - None selected → Select only this one ("Only")
 */
export function useExclusiveCheckboxGroup<T>(
  props: UseExclusiveCheckboxGroupProps<T>
): ExclusiveCheckboxGroupReturn<T> {
  // Internal state for uncontrolled mode
  const [internalSelection, setInternalSelection] = createSignal<
    SelectionState<T>
  >(props.defaultSelection ?? initialSelection());

  // Use controlled or internal state
  const selection = () => props.selection?.() ?? internalSelection();

  const updateSelection = (newState: SelectionState<T>) => {
    if (!props.selection) {
      setInternalSelection(() => newState);
    }
    props.onSelectionChange?.(newState);
  };

  const totalCount = createMemo(() => props.values().length);

  const selectedCount = createMemo(
    () => getEffectiveValues(selection(), props.values()).size
  );

  const isChecked = (value: T): boolean =>
    isSelected(selection(), value, props.values());

  const onControlClick = (value: T): void => {
    const newState = handleControlClick(value, selection(), props.values());
    updateSelection(newState);
  };

  const onLabelClick = (value: T): void => {
    const newState = handleLabelClick(value, selection(), props.values());
    updateSelection(newState);
  };

  const getLabelActionForValue = (value: T): LabelAction =>
    getLabelAction(value, selection(), props.values());

  return {
    selection,
    selectedCount,
    totalCount,
    isChecked,
    onControlClick,
    onLabelClick,
    getLabelAction: getLabelActionForValue,
  };
}
