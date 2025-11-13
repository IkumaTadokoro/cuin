import { splitProps } from "solid-js";

export const createSplitProps =
  <T extends Record<string, unknown>>() =>
  <P extends Partial<T>>(props: P, keys: (keyof T)[]) =>
    splitProps(props, keys as (keyof P)[]);
