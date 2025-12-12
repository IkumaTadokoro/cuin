/**
 * Yields batches of items from an iterable.
 *
 * @param items - Source iterable
 * @param batchSize - Number of items per batch
 *
 * @example
 * const batches = [...batchIterate([1, 2, 3, 4, 5], 2)];
 * // [[1, 2], [3, 4], [5]]
 */
export function* batchIterate<T>(
  items: Iterable<T>,
  batchSize: number
): Generator<T[]> {
  let batch: T[] = [];

  for (const item of items) {
    batch.push(item);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }

  if (batch.length > 0) {
    yield batch;
  }
}
