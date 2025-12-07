import {
  all,
  getEffectiveValues,
  isSelected,
  only,
  type SelectionState,
  toggle,
} from "./selection-state";

/**
 * Action to perform on label click
 */
export type LabelAction = "toggle" | "only" | "all";

/**
 * Determine what action to perform when clicking a label.
 *
 * Rules:
 * - 2+ selected → "only" (select only this one)
 * - 1 selected, this one, total=1 → "toggle" (deselect)
 * - 1 selected, this one, total>1 → "all" (select all)
 * - 1 selected, other one → "only" (select only this one)
 * - 0 selected → "only" (select only this one)
 */
export function getLabelAction<T>(
  value: T,
  state: SelectionState<T>,
  allValues: T[]
): LabelAction {
  const selectedCount = getEffectiveValues(state, allValues).size;
  const checked = isSelected(state, value);
  const total = allValues.length;

  if (selectedCount >= 2) {
    return "only";
  }

  if (selectedCount === 1) {
    if (checked) {
      // This one is selected
      if (total === 1) {
        return "toggle";
      }
      return "all";
    }
    // Another one is selected
    return "only";
  }

  // None selected
  return "only";
}

/**
 * Apply a label action to produce a new state.
 */
export function applyLabelAction<T>(
  action: LabelAction,
  value: T,
  state: SelectionState<T>,
  allValues: T[]
): SelectionState<T> {
  switch (action) {
    case "toggle":
      return toggle(state, value, allValues);
    case "only":
      return only(value);
    case "all":
      return all();
    default: {
      const _ = action satisfies never;
      throw new Error(`Invalid label action: ${action}`);
    }
  }
}

/**
 * Handle checkbox control click (always toggle).
 */
export function handleControlClick<T>(
  value: T,
  state: SelectionState<T>,
  allValues: T[]
): SelectionState<T> {
  return toggle(state, value, allValues);
}

/**
 * Handle label click (smart action based on current state).
 */
export function handleLabelClick<T>(
  value: T,
  state: SelectionState<T>,
  allValues: T[]
): SelectionState<T> {
  const action = getLabelAction(value, state, allValues);
  return applyLabelAction(action, value, state, allValues);
}
