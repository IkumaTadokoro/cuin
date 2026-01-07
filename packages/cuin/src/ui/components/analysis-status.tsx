import { createEffect, createSignal, Show } from "solid-js";
import { useAnalysisEvents } from "~/contexts/events";

export function AnalysisStatus() {
  const { isAnalyzing, lastEvent } = useAnalysisEvents();
  const [showError, setShowError] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");

  createEffect(() => {
    const event = lastEvent();
    if (event?.type === "analysis-error") {
      setErrorMessage(event.error);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  });

  return (
    <>
      <Show when={isAnalyzing()}>
        <div class="fixed right-4 bottom-4 rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-800 shadow-lg">
          <div class="flex items-center gap-2">
            <svg
              class="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                fill="currentColor"
              />
            </svg>
            <span>Analyzing...</span>
          </div>
        </div>
      </Show>

      <Show when={showError()}>
        <div class="fixed right-4 bottom-4 rounded-lg bg-red-100 px-4 py-3 text-red-800 text-sm shadow-lg">
          <div class="flex items-start gap-2">
            <svg
              class="mt-0.5 h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clip-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                fill-rule="evenodd"
              />
            </svg>
            <div class="flex-1">
              <p class="font-medium">Analysis failed</p>
              <p class="mt-1 text-xs">{errorMessage()}</p>
            </div>
          </div>
        </div>
      </Show>
    </>
  );
}
