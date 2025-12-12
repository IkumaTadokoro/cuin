// biome-ignore-all lint/style/noMagicNumbers: test assertion
import { describe, expect, it } from "vitest";
import { batchIterate } from "./batch-iterate";

describe("batchIterate", () => {
  it("splits array into batches of specified size", () => {
    const result = [...batchIterate([1, 2, 3, 4, 5], 2)];
    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns empty array for empty input", () => {
    const result = [...batchIterate([], 2)];
    expect(result).toEqual([]);
  });

  it("handles batch size larger than items", () => {
    const result = [...batchIterate([1, 2], 5)];
    expect(result).toEqual([[1, 2]]);
  });
});
