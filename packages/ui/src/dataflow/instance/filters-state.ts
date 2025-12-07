import type { SelectionState } from "../../lib/selection-state";
import {
  getEffectiveValues,
  isAll,
  isSelected,
  only,
  toggle,
} from "../../lib/selection-state";

/**
 * Multiple filter groups state management
 *
 * Design:
 * - Map<groupKey, SelectionState> for managing multiple groups
 * - Undefined or missing key means "all selected" (default)
 * - Only stores groups that have been modified from default
 */

export type FiltersState = Map<string, SelectionState<string>>;

export const initialFilters = (): FiltersState => new Map();

export const isGroupFiltered = (
  state: FiltersState,
  groupKey: string
): boolean => {
  const groupState = state.get(groupKey);
  return groupState !== undefined && !isAll(groupState);
};

export const isValueSelected = (
  state: FiltersState,
  groupKey: string,
  value: string
): boolean => {
  const groupState = state.get(groupKey);
  if (groupState === undefined) {
    return true; // default: all selected
  }
  return isSelected(groupState, value);
};

export const getGroupEffectiveValues = (
  state: FiltersState,
  groupKey: string,
  allValues: string[]
): Set<string> => {
  const groupState = state.get(groupKey);
  if (groupState === undefined) {
    return new Set(allValues);
  }
  return getEffectiveValues(groupState, allValues);
};

export const toggleValue = (
  state: FiltersState,
  groupKey: string,
  value: string,
  allValues: string[]
): FiltersState => {
  const groupState = state.get(groupKey) ?? { type: "all" as const };
  const newGroupState = toggle(groupState, value, allValues);

  const newState = new Map(state);

  // If back to "all", remove from map (default state)
  if (isAll(newGroupState)) {
    newState.delete(groupKey);
  } else {
    newState.set(groupKey, newGroupState);
  }

  return newState;
};

export const selectOnly = (
  state: FiltersState,
  groupKey: string,
  value: string
): FiltersState => {
  const newState = new Map(state);
  newState.set(groupKey, only(value));
  return newState;
};

export const selectAll = (
  state: FiltersState,
  groupKey: string
): FiltersState => {
  const newState = new Map(state);
  // Remove from map = back to default (all selected)
  newState.delete(groupKey);
  return newState;
};

export const resetAllFilters = (): FiltersState => new Map();

export const hasActiveFilters = (state: FiltersState): boolean =>
  state.size > 0;
