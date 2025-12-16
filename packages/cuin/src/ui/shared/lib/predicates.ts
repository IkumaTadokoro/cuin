export type Predicate<T> = (item: T) => boolean;

export const and = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  predicates.length === 0
    ? () => true
    : (item) => predicates.every((p) => p(item));

export const or = <T>(...predicates: Predicate<T>[]): Predicate<T> =>
  predicates.length === 0
    ? () => false
    : (item) => predicates.some((p) => p(item));

export const not =
  <T>(predicate: Predicate<T>): Predicate<T> =>
  (item) =>
    !predicate(item);

export const always =
  <T>(): Predicate<T> =>
  () =>
    true;

export const never =
  <T>(): Predicate<T> =>
  () =>
    false;
