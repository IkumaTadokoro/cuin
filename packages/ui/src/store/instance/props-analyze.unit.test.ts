// biome-ignore-all lint/style/noMagicNumbers: test assertions use literal values
import { describe, expect, it } from "vitest";
import type { Instance } from "../../dataflow/core/schema";
import { analyzeProps, countFilteredProps, NO_VALUE } from "./props-analyze";

// Test fixtures
const createInstance = (
  props: { key: string; raw: string }[] = []
): Instance => ({
  filePath: "/test/file.tsx",
  props: props.map((p) => ({
    key: p.key,
    raw: p.raw,
    propType: "string",
    value: p.raw,
  })),
  raw: "<Component />",
  span: {
    start: 0,
    end: 10,
    startLine: 1,
    endLine: 1,
    startCol: 0,
    endCol: 10,
  },
  importSpecifier: "Component",
  resolvedPath: "/node_modules/pkg/index.js",
  package: { type: "external", name: "test-pkg", version: "1.0.0" },
});

describe("props-analyze", () => {
  describe("analyzeProps", () => {
    it("returns empty array for empty instances", () => {
      expect(analyzeProps([])).toEqual([]);
    });

    it("counts prop values across instances", () => {
      const instances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "secondary" }]),
      ];

      const result = analyzeProps(instances);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe("variant");
      expect(result[0].totalCount).toBe(3);
      expect(result[0].values).toHaveLength(2);

      const primary = result[0].values.find((v) => v.value === "primary");
      const secondary = result[0].values.find((v) => v.value === "secondary");
      expect(primary?.count).toBe(2);
      expect(secondary?.count).toBe(1);
    });

    it("handles multiple prop keys", () => {
      const instances = [
        createInstance([
          { key: "variant", raw: "primary" },
          { key: "size", raw: "lg" },
        ]),
        createInstance([
          { key: "variant", raw: "secondary" },
          { key: "size", raw: "sm" },
        ]),
      ];

      const result = analyzeProps(instances);

      expect(result).toHaveLength(2);
      const keys = result.map((r) => r.key);
      expect(keys).toContain("variant");
      expect(keys).toContain("size");
    });

    it("counts NO_VALUE for missing props", () => {
      const instances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "size", raw: "lg" }]), // missing variant
      ];

      const result = analyzeProps(instances);
      const variantAnalysis = result.find((r) => r.key === "variant");

      expect(variantAnalysis?.hasNoValue).toBe(true);
      expect(variantAnalysis?.noValueCount).toBe(1);

      const noValueEntry = variantAnalysis?.values.find(
        (v) => v.value === NO_VALUE
      );
      expect(noValueEntry?.count).toBe(1);
    });

    it("sorts by totalCount descending", () => {
      const instances = [
        createInstance([
          { key: "rare", raw: "x" },
          { key: "common", raw: "a" },
        ]),
        createInstance([{ key: "common", raw: "b" }]),
        createInstance([{ key: "common", raw: "c" }]),
      ];

      const result = analyzeProps(instances);

      // common: 3 values, rare: 1 value + 2 NO_VALUE = 3
      // Both have same totalCount (3), order depends on Map iteration
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.totalCount === 3)).toBe(true);
    });

    it("sorts values by count descending within a prop", () => {
      const instances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "secondary" }]),
      ];

      const result = analyzeProps(instances);
      const values = result[0].values;

      expect(values[0].value).toBe("primary");
      expect(values[0].count).toBe(3);
      expect(values[1].value).toBe("secondary");
      expect(values[1].count).toBe(1);
    });

    it("calculates percentages correctly", () => {
      const instances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "secondary" }]),
        createInstance([{ key: "variant", raw: "secondary" }]),
      ];

      const result = analyzeProps(instances);
      const values = result[0].values;

      expect(values[0].percentage).toBe(50);
      expect(values[1].percentage).toBe(50);
    });

    it("calculates totalPercentage relative to instance count", () => {
      const instances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([]), // no variant
        createInstance([]), // no variant
      ];

      const result = analyzeProps(instances);
      // totalCount = 2 (primary) + 2 (no value) = 4
      // totalPercentage = 4 / 4 * 100 = 100
      expect(result[0].totalPercentage).toBe(100);
    });
  });

  describe("countFilteredProps", () => {
    it("returns empty map for empty instances", () => {
      const result = countFilteredProps([], []);
      expect(result.size).toBe(0);
    });

    it("uses all prop keys from allInstances", () => {
      const allInstances = [
        createInstance([
          { key: "variant", raw: "primary" },
          { key: "size", raw: "lg" },
        ]),
      ];
      const filteredInstances = [
        createInstance([{ key: "variant", raw: "primary" }]),
      ];

      const result = countFilteredProps(allInstances, filteredInstances);

      // Should have both keys even though filtered only has variant
      expect(result.has("variant")).toBe(true);
      expect(result.has("size")).toBe(true);
    });

    it("counts from filteredInstances only", () => {
      const allInstances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "variant", raw: "secondary" }]),
        createInstance([{ key: "variant", raw: "tertiary" }]),
      ];
      const filteredInstances = [
        createInstance([{ key: "variant", raw: "primary" }]),
      ];

      const result = countFilteredProps(allInstances, filteredInstances);
      const variantCounts = result.get("variant");

      expect(variantCounts?.get("primary")).toBe(1);
      expect(variantCounts?.get("secondary")).toBeUndefined();
      expect(variantCounts?.get("tertiary")).toBeUndefined();
    });

    it("counts NO_VALUE for missing props in filtered instances", () => {
      const allInstances = [
        createInstance([{ key: "variant", raw: "primary" }]),
        createInstance([{ key: "size", raw: "lg" }]),
      ];
      const filteredInstances = [
        createInstance([{ key: "size", raw: "lg" }]), // missing variant
      ];

      const result = countFilteredProps(allInstances, filteredInstances);
      const variantCounts = result.get("variant");

      expect(variantCounts?.get(NO_VALUE)).toBe(1);
    });
  });

  describe("NO_VALUE constant", () => {
    it("is exported and has expected value", () => {
      expect(NO_VALUE).toBe("(no value)");
    });
  });
});
