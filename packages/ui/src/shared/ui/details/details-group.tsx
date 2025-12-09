import {
  type Component,
  createContext,
  createSignal,
  createUniqueId,
  type JSX,
  useContext,
} from "solid-js";

type DetailsGroupContextValue = {
  groupId: string;
  toggleAll: (open: boolean) => void;
  isProcessing: () => boolean;
};

const DetailsGroupContext = createContext<DetailsGroupContextValue>();

const BATCH_SIZE = 1000;

const findViewportCenter = (details: HTMLDetailsElement[]): number => {
  const viewportCenter = window.innerHeight / 2;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < details.length; i++) {
    const rect = details[i].getBoundingClientRect();
    const elementCenter = rect.top + rect.height / 2;
    const distance = Math.abs(elementCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }

    if (rect.top > window.innerHeight) {
      break;
    }
  }

  return closestIndex;
};

export const DetailsGroup: Component<{ children: JSX.Element }> = (props) => {
  const groupId = createUniqueId();
  const [isProcessing, setIsProcessing] = createSignal(false);

  const toggleAll = (open: boolean) => {
    const details = Array.from(
      document.querySelectorAll<HTMLDetailsElement>(
        `details[data-group="${groupId}"]`
      )
    );

    if (details.length === 0) {
      return;
    }

    setIsProcessing(true);

    const centerIndex = findViewportCenter(details);

    let upperIndex = centerIndex;
    let lowerIndex = centerIndex + 1;

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: batch processing logic requires this complexity
    const processBatch = () => {
      let processed = 0;

      while (
        processed < BATCH_SIZE &&
        (upperIndex >= 0 || lowerIndex < details.length)
      ) {
        if (upperIndex >= 0) {
          details[upperIndex].open = open;
          upperIndex -= 1;
          processed += 1;
        }

        if (processed < BATCH_SIZE && lowerIndex < details.length) {
          details[lowerIndex].open = open;
          lowerIndex += 1;
          processed += 1;
        }
      }

      if (upperIndex >= 0 || lowerIndex < details.length) {
        requestAnimationFrame(processBatch);
      } else {
        setIsProcessing(false);
      }
    };

    requestAnimationFrame(processBatch);
  };

  return (
    <DetailsGroupContext.Provider value={{ groupId, toggleAll, isProcessing }}>
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
  const { toggleAll, isProcessing } = useDetailsGroup();
  const handleClick = () => {
    if (isProcessing()) {
      return;
    }
    toggleAll(props.mode === "open");
  };

  return (
    <button
      class="flex cursor-pointer items-center gap-1 rounded-sm bg-brand-700 px-2 py-1 font-mono text-brand-50 text-xs hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isProcessing()}
      onClick={handleClick}
      type="button"
    >
      {props.mode === "open" ? "ExpandAll" : "CollapseAll"}
    </button>
  );
};
