// biome-ignore-all lint/style/noMagicNumbers: test assertion
import { describe, expect, it } from "vitest";
import {
  centerOutIndices,
  generateCenterOutIndices,
} from "./center-out-indicies";

describe("centerOutIndices", () => {
  it("generates indices from center outward", () => {
    expect([...centerOutIndices(5, 2)]).toEqual([2, 3, 1, 4, 0]);
  });

  it("includes all indices exactly once", () => {
    const result = [...centerOutIndices(100, 50)];

    expect(new Set(result).size).toBe(100);
    expect(result.at(0)).toBe(50);
    expect(result.at(-1)).toBe(0);
  });

  it("handles center at start (index 0)", () => {
    expect([...centerOutIndices(5, 0)]).toEqual([0, 1, 2, 3, 4]);
  });

  it("handles center at end (last index)", () => {
    expect([...centerOutIndices(5, 4)]).toEqual([4, 3, 2, 1, 0]);
  });

  it("handles empty array", () => {
    expect([...centerOutIndices(0, 0)]).toEqual([]);
  });

  it("handles single element array", () => {
    expect([...centerOutIndices(1, 0)]).toEqual([0]);
  });

  it("handles two element array with center 0", () => {
    expect([...centerOutIndices(2, 0)]).toEqual([0, 1]);
  });

  it("handles two element array with center 1", () => {
    expect([...centerOutIndices(2, 1)]).toEqual([1, 0]);
  });
});

describe("generateCenterOutIndices", () => {
  it("returns array containing center-out-indices", () => {
    expect(generateCenterOutIndices(5, 2)).toEqual([2, 3, 1, 4, 0]);
  });

  it("handles empty array", () => {
    expect(generateCenterOutIndices(0, 0)).toEqual([]);
  });
});
