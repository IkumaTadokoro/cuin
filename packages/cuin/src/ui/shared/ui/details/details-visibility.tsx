import {
  type Accessor,
  createContext,
  createSignal,
  useContext,
} from "solid-js";

type DetailsVisibilityContextValue = {
  isVisible: Accessor<boolean>;
};

const DetailsVisibilityContext = createContext<DetailsVisibilityContextValue>();

export function createDetailsVisibility() {
  const [isVisible, setIsVisible] = createSignal(false);

  const handleContentVisibilityChange = (event: Event) => {
    const cvEvent = event as ContentVisibilityAutoStateChangeEvent;
    if (!cvEvent.skipped) {
      setIsVisible(true);
    }
  };

  return {
    isVisible,
    handleContentVisibilityChange,
    Provider: DetailsVisibilityContext.Provider,
  };
}

export function useDetailsVisibility() {
  const context = useContext(DetailsVisibilityContext);
  if (!context) {
    return { isVisible: () => true };
  }
  return context;
}
