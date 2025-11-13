import {
  type Component,
  createContext,
  createUniqueId,
  type JSX,
  useContext,
} from "solid-js";

type DetailsGroupContextValue = {
  groupId: string;
  toggleAll: (open: boolean) => void;
};

const DetailsGroupContext = createContext<DetailsGroupContextValue>();

export const DetailsGroup: Component<{ children: JSX.Element }> = (props) => {
  const groupId = createUniqueId();
  let _containerRef: HTMLDivElement | undefined;

  const toggleAll = (open: boolean) => {
    const details = Array.from(
      document.querySelectorAll<HTMLDetailsElement>(
        `details[data-group="${groupId}"]`
      )
    );
    for (const detail of details) {
      detail.open = open;
    }
  };

  return (
    <DetailsGroupContext.Provider value={{ groupId, toggleAll }}>
      {props.children}
    </DetailsGroupContext.Provider>
  );
};

export const useDetailsGroup = () => {
  const context = useContext(DetailsGroupContext);
  if (!context) {
    throw new Error("useDetailsGroup must be used within DetailsGroup");
  }
  return context;
};

export const ToggleAllDetailsButton: Component<{ mode: "open" | "close" }> = (
  props
) => {
  const { toggleAll } = useDetailsGroup();
  const handleClick = () => toggleAll(props.mode === "open");

  return (
    <button
      class="flex cursor-pointer items-center rounded-sm bg-brand-700 px-2 py-1 font-mono text-brand-50 text-xs hover:bg-brand-800"
      onClick={handleClick}
      type="button"
    >
      {props.mode === "open" ? "ExpandAll" : "CollapseAll"}
    </button>
  );
};
