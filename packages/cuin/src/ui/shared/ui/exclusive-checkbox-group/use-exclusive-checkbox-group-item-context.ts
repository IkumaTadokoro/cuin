import {
  type Accessor,
  createContext,
  createSignal,
  type Setter,
  useContext,
} from "solid-js";

export type HoveredPart = "control" | "label" | null;

export type ItemContextValue<T> = {
  value: T;
  hoveredPart: Accessor<HoveredPart>;
  setHoveredPart: Setter<HoveredPart>;
};

// biome-ignore lint/suspicious/noExplicitAny: Generic context requires any
const ItemContext = createContext<ItemContextValue<any>>();

export const createItemContext = <T>(value: T): ItemContextValue<T> => {
  const [hoveredPart, setHoveredPart] = createSignal<HoveredPart>(null);
  return { value, hoveredPart, setHoveredPart };
};

export const ExclusiveCheckboxGroupItemProvider = ItemContext.Provider;

export const useExclusiveCheckboxGroupItemContext = <T>() => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error(
      "useExclusiveCheckboxGroupItemContext must be used within ExclusiveCheckboxGroupItemProvider"
    );
  }
  return context as ItemContextValue<T>;
};
