import {
  type Accessor,
  createContext,
  createSignal,
  type Setter,
  useContext,
} from "solid-js";

type ItemContextValue = {
  value: string;
  hoveredPart: Accessor<"control" | "label" | null>;
  setHoveredPart: Setter<"control" | "label" | null>;
};

const ItemContext = createContext<ItemContextValue>();

export const createItemContext = (value: string) => {
  const [hoveredPart, setHoveredPart] = createSignal<
    "control" | "label" | null
  >(null);
  return { value, hoveredPart, setHoveredPart };
};

export const ExclusiveCheckboxGroupItemProvider = ItemContext.Provider;

export const useExclusiveCheckboxGroupItemContext = () => {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error(
      "useExclusiveCheckboxGroupItemContext must be used within Provider"
    );
  }
  return context;
};
