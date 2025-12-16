import { clamp } from "es-toolkit/math";

/**
 * Generates indices in center-out order (bidirectional expansion).
 * Starting from centerIndex, alternates between going up and down.
 *
 * @example
 * [...centerOutIndices(10, 5)] // [5, 6, 4, 7, 3, 8, 2, 9, 1, 0]
 * [...centerOutIndices(5, 2)]  // [2, 3, 1, 4, 0]
 */
export function* centerOutIndices(
  totalCount: number,
  centerIndex: number
): Generator<number> {
  if (totalCount === 0) {
    return;
  }

  const center = clamp(centerIndex, 0, totalCount - 1);
  let upper = center;
  let lower = center + 1;

  while (upper >= 0 || lower < totalCount) {
    if (upper >= 0) {
      yield upper;
      upper -= 1;
    }
    if (lower < totalCount) {
      yield lower;
      lower += 1;
    }
  }
}

/**
 * Generates an array of indices in center-out order.
 * (It's just a wrapper around centerOutIndices)
 *
 * @example
 * generateCenterOutIndices(10, 5) // [5, 6, 4, 7, 3, 8, 2, 9, 1, 0]
 * generateCenterOutIndices(5, 2)  // [2, 3, 1, 4, 0]
 */
export const generateCenterOutIndices = (
  totalCount: number,
  centerIndex: number
): number[] => [...centerOutIndices(totalCount, centerIndex)];
