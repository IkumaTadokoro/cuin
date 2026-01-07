import { EventEmitter } from "node:events";

export type AnalysisEvent =
  | { type: "analysis-start" }
  | { type: "analysis-complete" }
  | { type: "analysis-error"; error: string };

export class AnalysisEventEmitter extends EventEmitter {
  emitAnalysisStart() {
    this.emit("analysis-start");
  }

  emitAnalysisComplete() {
    this.emit("analysis-complete");
  }

  emitAnalysisError(error: string) {
    this.emit("analysis-error", error);
  }

  onAnalysisStart(listener: () => void) {
    this.on("analysis-start", listener);
  }

  onAnalysisComplete(listener: () => void) {
    this.on("analysis-complete", listener);
  }

  onAnalysisError(listener: (error: string) => void) {
    this.on("analysis-error", listener);
  }
}

export const createAnalysisEventEmitter = () => new AnalysisEventEmitter();
