import {
  type Component,
  createContext,
  type JSX,
  onCleanup,
  useContext,
} from "solid-js";

type DetailsGroupContextValue = {
  register: (el: HTMLDetailsElement) => void;
  unregister: (el: HTMLDetailsElement) => void;
  getAllDetails: () => HTMLDetailsElement[];
};

const DetailsGroupContext = createContext<DetailsGroupContextValue>();

export const DetailsGroup: Component<{ children: JSX.Element }> = (props) => {
  const elements = new Set<HTMLDetailsElement>();

  return (
    <DetailsGroupContext.Provider
      value={{
        register: (el) => elements.add(el),
        unregister: (el) => elements.delete(el),
        getAllDetails: () => [...elements],
      }}
    >
      {props.children}
    </DetailsGroupContext.Provider>
  );
};

export const useDetailsGroup = () => {
  const context = useContext(DetailsGroupContext);
  if (!context) {
    throw new Error("useDetailsGroup must be used within DetailsGroup");
  }

  return {
    detailsRef: (el: HTMLDetailsElement) => {
      context.register(el);
      onCleanup(() => context.unregister(el));
    },
    getAllDetails: context.getAllDetails,
  };
};
