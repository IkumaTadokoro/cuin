import { createContext, useContext } from "solid-js";
import type { useExclusiveCheckboxGroup } from "./use-exclusive-checkbox-group";

type GroupContext = ReturnType<typeof useExclusiveCheckboxGroup>;

const Context = createContext<GroupContext>();

export const ExclusiveCheckboxGroupProvider = Context.Provider;

export const useExclusiveCheckboxGroupContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useExclusiveCheckboxGroupContext must be used within Provider"
    );
  }
  return context;
};
