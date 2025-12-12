// biome-ignore-all lint/style/noMagicNumbers: test assertion
import { describe, expect, it } from "vitest";
import { findClosestIndex } from "./find-closest-index";

describe("findClosestIndex", () => {
  it("finds index closest to target", () => {
    expect(findClosestIndex([90, 180, 370, 540, 730], 300)).toBe(2);
  });

  it("finds index when target matches exactly", () => {
    expect(findClosestIndex([100, 200, 300, 400], 300)).toBe(2);
  });

  it("finds first index when target is before all positions", () => {
    expect(findClosestIndex([100, 200, 300], 0)).toBe(0);
  });

  it("finds last index when target is after all positions", () => {
    expect(findClosestIndex([100, 200, 300], 1000)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(findClosestIndex([], 100)).toBe(0);
  });

  it("returns 0 for single element array", () => {
    expect(findClosestIndex([500], 100)).toBe(0);
  });

  it("returns first index among multiple equidistant positions", () => {
    expect(findClosestIndex([100, 200, 300], 200)).toBe(1);
  });
});
