import { createContext, useContext } from "solid-js";
import type { ExclusiveCheckboxGroupReturn } from "./use-exclusive-checkbox-group";

// Using unknown as default, consumers should cast to their specific type
// biome-ignore lint/suspicious/noExplicitAny: Generic context requires any
type GroupContext = ExclusiveCheckboxGroupReturn<any>;

const Context = createContext<GroupContext>();

export const ExclusiveCheckboxGroupProvider = Context.Provider;

export const useExclusiveCheckboxGroupContext = <T>() => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useExclusiveCheckboxGroupContext must be used within ExclusiveCheckboxGroupProvider"
    );
  }
  return context as ExclusiveCheckboxGroupReturn<T>;
};
