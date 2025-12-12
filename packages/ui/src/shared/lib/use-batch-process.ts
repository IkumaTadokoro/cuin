import type { Accessor } from "solid-js";
import { batchIterate } from "~/shared/lib/batch-iterate";
import { centerOutIndices } from "~/shared/lib/center-out-indices";
import { createProcessing } from "~/shared/lib/create-processing";
import { findCenterElement } from "./find-center-element";

type BatchProcessOptions<E extends HTMLElement> = {
  batchSize?: number;
  getItems: () => Iterable<E> | ArrayLike<E>;
};

type BatchProcessResult<E extends HTMLElement> = [
  isProcessing: Accessor<boolean>,
  run: (callback: (item: E) => void) => Promise<void>,
];

const DEFAULT_BATCH_SIZE = 100;

export const useBatchProcess = <E extends HTMLElement>(
  options: BatchProcessOptions<E>
): BatchProcessResult<E> => {
  const { batchSize = DEFAULT_BATCH_SIZE, getItems } = options;
  const [isProcessing, startProcessing] = createProcessing();

  const run = (callback: (item: E) => void): Promise<void> =>
    startProcessing(async () => {
      const items = Array.from(getItems());
      if (items.length === 0) {
        return;
      }
      const centerIndex = findCenterElement(items);
      const indices = centerOutIndices(items.length, centerIndex);
      const batches = batchIterate(indices, batchSize);

      await new Promise<void>((resolve) => {
        const processBatch = () => {
          const { value: batch, done } = batches.next();

          if (done) {
            resolve();
            return;
          }

          for (const idx of batch) {
            callback(items[idx]);
          }

          requestAnimationFrame(processBatch);
        };

        requestAnimationFrame(processBatch);
      });
    });

  return [isProcessing, run];
};
