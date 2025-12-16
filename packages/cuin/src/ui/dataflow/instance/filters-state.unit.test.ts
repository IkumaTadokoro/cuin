import { describe, expect, it } from "vitest";
import {
  getGroupEffectiveValues,
  hasActiveFilters,
  initialFilters,
  isGroupFiltered,
  isValueSelected,
  resetAllFilters,
  selectAll,
  selectOnly,
  toggleValue,
} from "./filters-state";

describe("filters-state", () => {
  const allValuesA = ["a1", "a2", "a3"];
  const allValuesB = ["b1", "b2"];

  describe("initialFilters", () => {
    it("returns empty map", () => {
      const state = initialFilters();
      expect(state.size).toBe(0);
    });
  });

  describe("isGroupFiltered", () => {
    it("returns false for unmodified group", () => {
      const state = initialFilters();
      expect(isGroupFiltered(state, "groupA")).toBe(false);
    });

    it("returns true when group has some values selected", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      expect(isGroupFiltered(state, "groupA")).toBe(true);
    });

    it("returns false when group is back to all", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      state = toggleValue(state, "groupA", "a1", allValuesA); // toggle back
      expect(isGroupFiltered(state, "groupA")).toBe(false);
    });
  });

  describe("isValueSelected", () => {
    it("returns true for all values in unmodified group", () => {
      const state = initialFilters();
      expect(isValueSelected(state, "groupA", "a1")).toBe(true);
      expect(isValueSelected(state, "groupA", "a2")).toBe(true);
      expect(isValueSelected(state, "groupA", "a3")).toBe(true);
    });

    it("returns correct values after toggle", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a2", allValuesA);

      expect(isValueSelected(state, "groupA", "a1")).toBe(true);
      expect(isValueSelected(state, "groupA", "a2")).toBe(false);
      expect(isValueSelected(state, "groupA", "a3")).toBe(true);
    });
  });

  describe("getGroupEffectiveValues", () => {
    it("returns all values for unmodified group", () => {
      const state = initialFilters();
      expect(getGroupEffectiveValues(state, "groupA", allValuesA)).toEqual(
        new Set(["a1", "a2", "a3"])
      );
    });

    it("returns selected values after toggle", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a2", allValuesA);

      expect(getGroupEffectiveValues(state, "groupA", allValuesA)).toEqual(
        new Set(["a1", "a3"])
      );
    });
  });

  describe("toggleValue", () => {
    it("removes value from all state", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);

      expect(isValueSelected(state, "groupA", "a1")).toBe(false);
      expect(isValueSelected(state, "groupA", "a2")).toBe(true);
    });

    it("adds value back", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      state = toggleValue(state, "groupA", "a1", allValuesA);

      // Should be back to all
      expect(isGroupFiltered(state, "groupA")).toBe(false);
    });

    it("removes group from map when back to all", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      state = toggleValue(state, "groupA", "a1", allValuesA);

      expect(state.has("groupA")).toBe(false);
    });

    it("handles multiple groups independently", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      state = toggleValue(state, "groupB", "b1", allValuesB);

      expect(isValueSelected(state, "groupA", "a1")).toBe(false);
      expect(isValueSelected(state, "groupA", "a2")).toBe(true);
      expect(isValueSelected(state, "groupB", "b1")).toBe(false);
      expect(isValueSelected(state, "groupB", "b2")).toBe(true);
    });
  });

  describe("selectOnly", () => {
    it("selects only the specified value", () => {
      let state = initialFilters();
      state = selectOnly(state, "groupA", "a2");

      expect(isValueSelected(state, "groupA", "a1")).toBe(false);
      expect(isValueSelected(state, "groupA", "a2")).toBe(true);
      expect(isValueSelected(state, "groupA", "a3")).toBe(false);
    });
  });

  describe("selectAll", () => {
    it("resets group to all selected", () => {
      let state = initialFilters();
      state = selectOnly(state, "groupA", "a2");
      state = selectAll(state, "groupA");

      expect(isGroupFiltered(state, "groupA")).toBe(false);
      expect(isValueSelected(state, "groupA", "a1")).toBe(true);
      expect(isValueSelected(state, "groupA", "a2")).toBe(true);
    });

    it("removes group from map", () => {
      let state = initialFilters();
      state = selectOnly(state, "groupA", "a2");
      state = selectAll(state, "groupA");

      expect(state.has("groupA")).toBe(false);
    });
  });

  describe("resetAllFilters", () => {
    it("returns empty map", () => {
      const state = resetAllFilters();
      expect(state.size).toBe(0);
    });
  });

  describe("hasActiveFilters", () => {
    it("returns false for initial state", () => {
      const state = initialFilters();
      expect(hasActiveFilters(state)).toBe(false);
    });

    it("returns true when filters are active", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      expect(hasActiveFilters(state)).toBe(true);
    });

    it("returns false when all filters are reset", () => {
      let state = initialFilters();
      state = toggleValue(state, "groupA", "a1", allValuesA);
      state = selectAll(state, "groupA");
      expect(hasActiveFilters(state)).toBe(false);
    });
  });
});
