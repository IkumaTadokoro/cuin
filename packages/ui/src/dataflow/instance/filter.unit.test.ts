import type { Instance } from "@cuin/schema";
import { describe, expect, it } from "vitest";
import {
  buildPredicate,
  type FilterContext,
  packageGroupKey,
  propGroupKey,
} from "./filter";
import {
  hasActiveFilters,
  initialFilters,
  selectOnly,
  toggleValue,
} from "./filters-state";

// Test fixtures
const createInstance = (
  packageName: string | null,
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
  package:
    packageName === null
      ? { type: "native" }
      : { type: "external", name: packageName, version: "1.0.0" },
});

describe("filters-predicate", () => {
  const context: FilterContext = {
    allPackages: ["pkg-a", "pkg-b", "pkg-c"],
    allPropValues: new Map([
      ["variant", ["primary", "secondary", "tertiary"]],
      ["size", ["sm", "md", "lg"]],
    ]),
  };

  describe("buildPredicate", () => {
    describe("with no filters (default state)", () => {
      it("matches all instances", () => {
        const state = initialFilters();
        const predicate = buildPredicate(state, context);

        expect(predicate(createInstance("pkg-a"))).toBe(true);
        expect(predicate(createInstance("pkg-b"))).toBe(true);
        expect(predicate(createInstance("pkg-c"))).toBe(true);
      });
    });

    describe("package filtering", () => {
      it("filters to selected packages only", () => {
        let state = initialFilters();
        state = selectOnly(state, packageGroupKey, "pkg-a");

        const predicate = buildPredicate(state, context);

        expect(predicate(createInstance("pkg-a"))).toBe(true);
        expect(predicate(createInstance("pkg-b"))).toBe(false);
        expect(predicate(createInstance("pkg-c"))).toBe(false);
      });

      it("handles multiple selected packages", () => {
        let state = initialFilters();
        state = toggleValue(
          state,
          packageGroupKey,
          "pkg-c",
          context.allPackages
        );
        // Now pkg-a and pkg-b are selected (pkg-c toggled off from all)

        const predicate = buildPredicate(state, context);

        expect(predicate(createInstance("pkg-a"))).toBe(true);
        expect(predicate(createInstance("pkg-b"))).toBe(true);
        expect(predicate(createInstance("pkg-c"))).toBe(false);
      });

      it("handles native packages with (no package)", () => {
        const contextWithNative: FilterContext = {
          allPackages: ["pkg-a", "(no package)"],
          allPropValues: new Map(),
        };

        let state = initialFilters();
        state = selectOnly(state, packageGroupKey, "(no package)");

        const predicate = buildPredicate(state, contextWithNative);

        expect(predicate(createInstance(null))).toBe(true);
        expect(predicate(createInstance("pkg-a"))).toBe(false);
      });
    });

    describe("prop filtering", () => {
      it("filters by prop value", () => {
        let state = initialFilters();
        state = selectOnly(state, propGroupKey("variant"), "primary");

        const predicate = buildPredicate(state, context);

        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "primary" }])
          )
        ).toBe(true);
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "secondary" }])
          )
        ).toBe(false);
      });

      it("ORs values within a group", () => {
        let state = initialFilters();
        // Toggle off "tertiary", leaving primary and secondary selected
        state = toggleValue(
          state,
          propGroupKey("variant"),
          "tertiary",
          // biome-ignore lint/style/noNonNullAssertion: <test>
          context.allPropValues.get("variant")!
        );

        const predicate = buildPredicate(state, context);

        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "primary" }])
          )
        ).toBe(true);
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "secondary" }])
          )
        ).toBe(true);
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "tertiary" }])
          )
        ).toBe(false);
      });

      it("ANDs different prop groups", () => {
        let state = initialFilters();
        state = selectOnly(state, propGroupKey("variant"), "primary");
        state = selectOnly(state, propGroupKey("size"), "lg");

        const predicate = buildPredicate(state, context);

        // Has both matching props
        expect(
          predicate(
            createInstance("pkg-a", [
              { key: "variant", raw: "primary" },
              { key: "size", raw: "lg" },
            ])
          )
        ).toBe(true);

        // Has variant but wrong size
        expect(
          predicate(
            createInstance("pkg-a", [
              { key: "variant", raw: "primary" },
              { key: "size", raw: "sm" },
            ])
          )
        ).toBe(false);

        // Has size but wrong variant
        expect(
          predicate(
            createInstance("pkg-a", [
              { key: "variant", raw: "secondary" },
              { key: "size", raw: "lg" },
            ])
          )
        ).toBe(false);
      });
    });

    describe("combined filters", () => {
      it("ANDs package and prop filters", () => {
        let state = initialFilters();
        state = selectOnly(state, packageGroupKey, "pkg-a");
        state = selectOnly(state, propGroupKey("variant"), "primary");

        const predicate = buildPredicate(state, context);

        // Matches both
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "primary" }])
          )
        ).toBe(true);

        // Wrong package
        expect(
          predicate(
            createInstance("pkg-b", [{ key: "variant", raw: "primary" }])
          )
        ).toBe(false);

        // Wrong variant
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "variant", raw: "secondary" }])
          )
        ).toBe(false);
      });
    });

    describe("none state filtering", () => {
      it("matches nothing when prop group has none selected", () => {
        const singleValueContext: FilterContext = {
          allPackages: ["pkg-a"],
          allPropValues: new Map([["className", ["w-full"]]]),
        };

        // Start with all, toggle off the only value -> none state
        let state = initialFilters();
        state = toggleValue(
          state,
          propGroupKey("className"),
          "w-full",
          // biome-ignore lint/style/noNonNullAssertion: <test>
          singleValueContext.allPropValues.get("className")!
        );

        const predicate = buildPredicate(state, singleValueContext);

        // Nothing should match
        expect(
          predicate(
            createInstance("pkg-a", [{ key: "className", raw: "w-full" }])
          )
        ).toBe(false);
        expect(predicate(createInstance("pkg-a", []))).toBe(false);
      });

      it("matches nothing when package group has none selected", () => {
        const singlePackageContext: FilterContext = {
          allPackages: ["pkg-a"],
          allPropValues: new Map(),
        };

        // Toggle off the only package -> none state
        let state = initialFilters();
        state = toggleValue(
          state,
          packageGroupKey,
          "pkg-a",
          singlePackageContext.allPackages
        );

        const predicate = buildPredicate(state, singlePackageContext);

        expect(predicate(createInstance("pkg-a"))).toBe(false);
      });
    });
  });

  describe("hasActiveFilters", () => {
    it("returns false for initial state", () => {
      expect(hasActiveFilters(initialFilters())).toBe(false);
    });

    it("returns true when filters are applied", () => {
      let state = initialFilters();
      state = selectOnly(state, packageGroupKey, "pkg-a");
      expect(hasActiveFilters(state)).toBe(true);
    });
  });
});
