// biome-ignore-all lint/style/noMagicNumbers: test assertions
import { describe, expect, it } from "vitest";
import type { Component, PackageKey } from "../../dataflow/core/payload";
import { type SortState, sortComponents } from "./sort";

const pkgKey = "external:pkg@1.0.0" as PackageKey;

const createComponent = (name: string, instanceCount: number): Component => ({
  id: name,
  name,
  package: { key: pkgKey, type: "external", name: "pkg", version: "1.0.0" },
  instanceCount,
  instances: [],
});

describe("sortComponents", () => {
  const components: Component[] = [
    createComponent("Card", 5),
    createComponent("Button", 10),
    createComponent("Modal", 3),
    createComponent("Input", 7),
  ];

  describe("sortKey: name", () => {
    it("sorts by name ascending", () => {
      const state: SortState = { sortKey: "name", sortOrder: "asc" };

      const result = sortComponents(components, state);

      expect(result.map((c) => c.name)).toEqual([
        "Button",
        "Card",
        "Input",
        "Modal",
      ]);
    });

    it("sorts by name descending", () => {
      const state: SortState = { sortKey: "name", sortOrder: "desc" };

      const result = sortComponents(components, state);

      expect(result.map((c) => c.name)).toEqual([
        "Modal",
        "Input",
        "Card",
        "Button",
      ]);
    });
  });

  describe("sortKey: usage", () => {
    it("sorts by usage ascending", () => {
      const state: SortState = { sortKey: "usage", sortOrder: "asc" };

      const result = sortComponents(components, state);

      expect(result.map((c) => c.name)).toEqual([
        "Modal",
        "Card",
        "Input",
        "Button",
      ]);
      expect(result.map((c) => c.instanceCount)).toEqual([3, 5, 7, 10]);
    });

    it("sorts by usage descending", () => {
      const state: SortState = { sortKey: "usage", sortOrder: "desc" };

      const result = sortComponents(components, state);

      expect(result.map((c) => c.name)).toEqual([
        "Button",
        "Input",
        "Card",
        "Modal",
      ]);
      expect(result.map((c) => c.instanceCount)).toEqual([10, 7, 5, 3]);
    });
  });

  describe("edge cases", () => {
    it("returns empty array for empty input", () => {
      const state: SortState = { sortKey: "name", sortOrder: "asc" };

      const result = sortComponents([], state);

      expect(result).toEqual([]);
    });

    it("returns single element array unchanged", () => {
      const single = [createComponent("Only", 1)];
      const state: SortState = { sortKey: "name", sortOrder: "asc" };

      const result = sortComponents(single, state);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Only");
    });
  });
});
