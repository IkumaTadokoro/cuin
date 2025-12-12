/**
 * Finds the index of the position closest to the target.
 * Assumes positions are sorted in ascending order.
 *
 * @param positions - Array of 1D positions (e.g., element centers, y-coordinates)
 * @param target - Target position to find closest to
 * @param boundary - Optional early exit (skip positions beyond this)
 * @returns Index of the closest position, or 0 if array is empty
 */
export const findClosestIndex = (
  positions: readonly number[],
  target: number,
  boundary?: number
): number => {
  if (positions.length === 0) {
    return 0;
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < positions.length; i++) {
    const distance = Math.abs(positions[i] - target);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }

    if (boundary !== undefined && positions[i] > boundary) {
      break;
    }
  }

  return closestIndex;
};
