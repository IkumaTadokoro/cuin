import type { Instance } from "~/dataflow/core/schema";

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

export const InstancePredicates = {
  hasPackage:
    (packageName: string): Predicate<Instance> =>
    (instance) => {
      const name =
        instance.package.type === "native"
          ? "(no package)"
          : instance.package.name;
      return name === packageName;
    },

  packageNotIn:
    (excludedPackages: Set<string>): Predicate<Instance> =>
    (instance) => {
      const name =
        instance.package.type === "native"
          ? "(no package)"
          : instance.package.name;
      return !excludedPackages.has(name);
    },

  hasProp:
    (key: string): Predicate<Instance> =>
    (instance) =>
      instance.props.some((p) => p.key === key),

  propEquals:
    (key: string, value: string): Predicate<Instance> =>
    (instance) =>
      instance.props.some((p) => p.key === key && p.raw === value),

  propContains:
    (key: string, value: string): Predicate<Instance> =>
    (instance) => {
      const prop = instance.props.find((p) => p.key === key);
      if (!prop) {
        return false;
      }
      return prop.raw.toLowerCase().includes(value.toLowerCase());
    },
  filePathContains:
    (pattern: string): Predicate<Instance> =>
    (instance) =>
      instance.filePath.includes(pattern),
};
