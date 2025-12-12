import {
  type Component,
  createContext,
  createUniqueId,
  type JSX,
  useContext,
} from "solid-js";

type DetailsGroupContextValue = {
  groupId: string;
};

const DetailsGroupContext = createContext<DetailsGroupContextValue>();

export const DetailsGroup: Component<{ children: JSX.Element }> = (props) => {
  const groupId = createUniqueId();

  return (
    <DetailsGroupContext.Provider value={{ groupId }}>
      {props.children}
    </DetailsGroupContext.Provider>
  );
};

export const useDetailsGroup = () => {
  const context = useContext(DetailsGroupContext);
  if (!context) {
    throw new Error("useDetailsGroup must be used within DetailsGroup");
  }

  const { groupId } = context;

  return {
    detailsProps: { "data-group": groupId } as const,
    getAllDetails: () =>
      document.querySelectorAll<HTMLDetailsElement>(
        `details[data-group="${groupId}"]`
      ),
  };
};
