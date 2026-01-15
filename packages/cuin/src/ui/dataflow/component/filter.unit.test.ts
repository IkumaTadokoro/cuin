// biome-ignore-all lint/style/noMagicNumbers: test assertions
import { describe, expect, it } from "vitest";
import { nonEmptySetOf } from "../../lib/selection-state";
import type { PackageKey, SummaryComponent } from "../payload";
import { type FilterState, filterComponents } from "./filter";

const createComponent = (
  name: string,
  packageKey: PackageKey
): SummaryComponent => ({
  id: name,
  name,
  package: {
    key: packageKey,
    type: "external",
    name: packageKey.split(":")[1]?.split("@")[0] ?? packageKey,
    version: "1.0.0",
  },
  instanceCount: 1,
  usedInPackages: [],
  instanceCountByPackage: new Map(),
});

const pkgA = "external:pkg-a@1.0.0" as PackageKey;
const pkgB = "external:pkg-b@1.0.0" as PackageKey;
const pkgC = "external:pkg-c@1.0.0" as PackageKey;

describe("filterComponents", () => {
  const components: SummaryComponent[] = [
    createComponent("Button", pkgA),
    createComponent("Input", pkgA),
    createComponent("Card", pkgB),
    createComponent("Modal", pkgC),
  ];

  describe("nameFilter", () => {
    it("returns all components when nameFilter is empty", () => {
      const filters: FilterState = {
        nameFilter: "",
        packageFilter: { type: "all" },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(4);
    });

    it("filters by name (case insensitive)", () => {
      const filters: FilterState = {
        nameFilter: "button",
        packageFilter: { type: "all" },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Button");
    });

    it("filters by partial name match", () => {
      const filters: FilterState = {
        nameFilter: "ut",
        packageFilter: { type: "all" },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(["Button", "Input"]);
    });
  });

  describe("packageFilter", () => {
    it("returns all components when packageFilter is all", () => {
      const filters: FilterState = {
        nameFilter: "",
        packageFilter: { type: "all" },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(4);
    });

    it("returns no components when packageFilter is none", () => {
      const filters: FilterState = {
        nameFilter: "",
        packageFilter: { type: "none" },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(0);
    });

    it("filters by selected packages", () => {
      const filters: FilterState = {
        nameFilter: "",
        packageFilter: {
          type: "some",
          values: nonEmptySetOf<PackageKey>(pkgA),
        },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(["Button", "Input"]);
    });

    it("filters by multiple selected packages", () => {
      const filters: FilterState = {
        nameFilter: "",
        packageFilter: {
          type: "some",
          values: nonEmptySetOf<PackageKey>(pkgA, pkgC),
        },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(3);
      expect(result.map((c) => c.name)).toEqual(["Button", "Input", "Modal"]);
    });
  });

  describe("combined filters", () => {
    it("applies both nameFilter and packageFilter", () => {
      const filters: FilterState = {
        nameFilter: "ut",
        packageFilter: {
          type: "some",
          values: nonEmptySetOf<PackageKey>(pkgA),
        },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.name)).toEqual(["Button", "Input"]);
    });

    it("returns empty when filters have no intersection", () => {
      const filters: FilterState = {
        nameFilter: "Card",
        packageFilter: {
          type: "some",
          values: nonEmptySetOf<PackageKey>(pkgA),
        },
        usedByPackageFilter: { type: "all" },
      };

      const result = filterComponents(components, filters);

      expect(result).toHaveLength(0);
    });
  });
});
