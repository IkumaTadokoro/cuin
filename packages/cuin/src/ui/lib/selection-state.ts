/**
 * Branded type for non-empty Set
 * Guarantees at type level that the Set has at least one element
 */
declare const NonEmptySetBrand: unique symbol;
export type NonEmptySet<T> = Set<T> & { readonly [NonEmptySetBrand]: true };

/**
 * Smart constructor for NonEmptySet
 * Returns null if the input is empty
 */
export const nonEmptySet = <T>(values: Iterable<T>): NonEmptySet<T> | null => {
  const set = new Set(values);
  if (set.size === 0) {
    return null;
  }
  return set as NonEmptySet<T>;
};

/**
 * Creates NonEmptySet from a single value (always succeeds)
 */
export const nonEmptySetOf = <T>(value: T, ...rest: T[]): NonEmptySet<T> =>
  new Set([value, ...rest]) as NonEmptySet<T>;

export type SelectionState<T> =
  | { type: "all" }
  | { type: "some"; values: NonEmptySet<T> }
  | { type: "none" };

export const initialSelection = <T>(): SelectionState<T> => ({ type: "all" });

export const isAll = <T>(state: SelectionState<T>): boolean =>
  state.type === "all";

export const isNone = <T>(state: SelectionState<T>): boolean =>
  state.type === "none";

export const isSelected = <T>(state: SelectionState<T>, value: T): boolean => {
  if (state.type === "all") {
    return true;
  }
  if (state.type === "none") {
    return false;
  }
  return state.values.has(value);
};

export const getEffectiveValues = <T>(
  state: SelectionState<T>,
  allValues: T[]
): Set<T> => {
  if (state.type === "all") {
    return new Set(allValues);
  }
  if (state.type === "none") {
    return new Set();
  }
  return state.values;
};

/**
 * Toggle a value's selection state.
 */
export const toggle = <T>(
  state: SelectionState<T>,
  value: T,
  allValues: T[]
): SelectionState<T> => {
  if (state.type === "all") {
    // Remove one from all
    const newValues = new Set(allValues);
    newValues.delete(value);
    const nonEmpty = nonEmptySet(newValues);
    if (nonEmpty === null) {
      // All values were just this one, now none selected
      return { type: "none" };
    }
    return { type: "some", values: nonEmpty };
  }

  if (state.type === "none") {
    // Add one value
    return { type: "some", values: nonEmptySetOf(value) };
  }

  // state.type === "some"
  const newValues = new Set(state.values);
  if (newValues.has(value)) {
    newValues.delete(value);
    if (newValues.size === 0) {
      return { type: "none" };
    }
  } else {
    newValues.add(value);
  }

  // If all values are selected, return "all"
  if (newValues.size === allValues.length) {
    return { type: "all" };
  }

  return { type: "some", values: newValues as NonEmptySet<T> };
};

export const only = <T>(value: T): SelectionState<T> => ({
  type: "some",
  values: nonEmptySetOf(value),
});

export const all = <T>(): SelectionState<T> => ({ type: "all" });

export const none = <T>(): SelectionState<T> => ({ type: "none" });
