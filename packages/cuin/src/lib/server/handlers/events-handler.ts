import { createEventStream, eventHandler } from "h3";
import type { AnalysisEventEmitter } from "../events";

export const EventsHandler = (eventEmitter: AnalysisEventEmitter) =>
  eventHandler(async (event) => {
    const eventStream = createEventStream(event);

    const onAnalysisStart = () => {
      eventStream.push(
        JSON.stringify({
          type: "analysis-start",
        })
      );
    };

    const onAnalysisComplete = () => {
      eventStream.push(
        JSON.stringify({
          type: "analysis-complete",
        })
      );
    };

    const onAnalysisError = (error: string) => {
      eventStream.push(
        JSON.stringify({
          type: "analysis-error",
          error,
        })
      );
    };

    eventEmitter.onAnalysisStart(onAnalysisStart);
    eventEmitter.onAnalysisComplete(onAnalysisComplete);
    eventEmitter.onAnalysisError(onAnalysisError);

    eventStream.onClosed(async () => {
      eventEmitter.off("analysis-start", onAnalysisStart);
      eventEmitter.off("analysis-complete", onAnalysisComplete);
      eventEmitter.off("analysis-error", onAnalysisError);
      await eventStream.close();
    });

    return eventStream.send();
  });
