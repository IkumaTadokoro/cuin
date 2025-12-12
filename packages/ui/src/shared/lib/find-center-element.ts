export const findCenterElement = <E extends HTMLElement>(
  items: E[]
): number => {
  const target = window.innerHeight / 2;
  let low = 0;
  let high = items.length - 1;

  while (low < high) {
    // biome-ignore lint/suspicious/noBitwiseOperators: perf
    const mid = (low + high) >>> 1;
    const rect = items[mid].getBoundingClientRect();
    const pos = rect.top + rect.height / 2;

    if (pos < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const candidates = [low - 1, low, low + 1].filter(
    (i) => i >= 0 && i < items.length
  );

  let closestIndex = candidates[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const i of candidates) {
    const rect = items[i].getBoundingClientRect();
    const pos = rect.top + rect.height / 2;
    const distance = Math.abs(pos - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
};
