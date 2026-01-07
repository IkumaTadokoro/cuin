import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  type ParentComponent,
  useContext,
} from "solid-js";

type AnalysisEvent =
  | { type: "analysis-start" }
  | { type: "analysis-complete" }
  | { type: "analysis-error"; error: string };

type AnalysisEventsContextValue = {
  isAnalyzing: () => boolean;
  lastEvent: () => AnalysisEvent | null;
};

const AnalysisEventsContext = createContext<AnalysisEventsContextValue>();

export function useAnalysisEvents() {
  const context = useContext(AnalysisEventsContext);
  if (!context) {
    throw new Error(
      "useAnalysisEvents must be used within AnalysisEventsProvider"
    );
  }
  return context;
}

export const AnalysisEventsProvider: ParentComponent = (props) => {
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [lastEvent, setLastEvent] = createSignal<AnalysisEvent | null>(null);

  onMount(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AnalysisEvent;
        setLastEvent(data);

        if (data.type === "analysis-start") {
          setIsAnalyzing(true);
        } else if (
          data.type === "analysis-complete" ||
          data.type === "analysis-error"
        ) {
          setIsAnalyzing(false);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      eventSource.close();
    };

    onCleanup(() => {
      eventSource.close();
    });
  });

  return (
    <AnalysisEventsContext.Provider value={{ isAnalyzing, lastEvent }}>
      {props.children}
    </AnalysisEventsContext.Provider>
  );
};
