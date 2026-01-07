import chokidar from "chokidar";
import { debounce } from "es-toolkit";
import type { AnalysisEventEmitter } from "./server/events";

type WatcherOptions = {
  analyzeDir: string;
  onReanalyze: () => Promise<void>;
  eventEmitter?: AnalysisEventEmitter;
  debounceMs?: number;
};

const IGNORED_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/.turbo/**",
  "**/coverage/**",
];

export const createWatcher = ({
  analyzeDir,
  onReanalyze,
  eventEmitter,
  debounceMs = 500,
}: WatcherOptions) => {
  let isAnalyzing = false;
  let pendingReanalyze = false;

  const executeReanalyze = async () => {
    if (isAnalyzing) {
      pendingReanalyze = true;
      return;
    }

    try {
      isAnalyzing = true;
      process.stdout.write("\x1b[33m⟳\x1b[0m Re-analyzing...\n");
      eventEmitter?.emitAnalysisStart();

      const startTime = Date.now();
      await onReanalyze();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      process.stdout.write(
        `\x1b[32m✔\x1b[0m Analysis complete (${duration}s)\n`
      );
      eventEmitter?.emitAnalysisComplete();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      process.stdout.write(
        `\x1b[31m✖\x1b[0m Analysis failed: ${errorMessage}\n`
      );
      eventEmitter?.emitAnalysisError(errorMessage);
    } finally {
      isAnalyzing = false;

      if (pendingReanalyze) {
        pendingReanalyze = false;
        await executeReanalyze();
      }
    }
  };

  const debouncedReanalyze = debounce(executeReanalyze, debounceMs);

  const watcher = chokidar.watch(analyzeDir, {
    ignored: IGNORED_PATTERNS,
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  watcher.on("change", (path) => {
    process.stdout.write(`\x1b[36m✎\x1b[0m File changed: ${path}\n`);
    debouncedReanalyze();
  });

  watcher.on("add", (path) => {
    process.stdout.write(`\x1b[36m+\x1b[0m File added: ${path}\n`);
    debouncedReanalyze();
  });

  watcher.on("unlink", (path) => {
    process.stdout.write(`\x1b[36m-\x1b[0m File removed: ${path}\n`);
    debouncedReanalyze();
  });

  watcher.on("error", (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`\x1b[31m✖\x1b[0m Watcher error: ${message}\n`);
  });

  watcher.on("ready", () => {
    process.stdout.write("\x1b[32m👁\x1b[0m Watching for file changes...\n");
  });

  return {
    watcher,
    close: async () => {
      debouncedReanalyze.cancel();
      await watcher.close();
    },
  };
};
