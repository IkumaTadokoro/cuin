import { describe, expect, it } from "vitest";
import {
  all,
  getEffectiveValues,
  initialSelection,
  isAll,
  isNone,
  isSelected,
  nonEmptySetOf,
  none,
  only,
  type SelectionState,
  toggle,
} from "./selection-state";

describe("selection-state", () => {
  const allValues = ["a", "b", "c"];

  describe("initialSelection", () => {
    it("returns all selection state", () => {
      const state = initialSelection<string>();
      expect(state).toEqual({ type: "all" });
    });
  });

  describe("isAll", () => {
    it("returns true when type is 'all'", () => {
      expect(isAll({ type: "all" })).toBe(true);
    });

    it("returns false when type is 'some'", () => {
      expect(isAll({ type: "some", values: nonEmptySetOf("a") })).toBe(false);
    });

    it("returns false when type is 'none'", () => {
      expect(isAll({ type: "none" })).toBe(false);
    });
  });

  describe("isNone", () => {
    it("returns true when type is 'none'", () => {
      expect(isNone({ type: "none" })).toBe(true);
    });

    it("returns false when type is 'all'", () => {
      expect(isNone({ type: "all" })).toBe(false);
    });

    it("returns false when type is 'some'", () => {
      expect(isNone({ type: "some", values: nonEmptySetOf("a") })).toBe(false);
    });
  });

  describe("isSelected", () => {
    it("returns true for all values when state is 'all'", () => {
      const state: SelectionState<string> = { type: "all" };
      expect(isSelected(state, "a")).toBe(true);
      expect(isSelected(state, "b")).toBe(true);
      expect(isSelected(state, "c")).toBe(true);
    });

    it("returns false for all values when state is 'none'", () => {
      const state: SelectionState<string> = { type: "none" };
      expect(isSelected(state, "a")).toBe(false);
      expect(isSelected(state, "b")).toBe(false);
      expect(isSelected(state, "c")).toBe(false);
    });

    it("returns true only for selected values when state is 'some'", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a", "c"),
      };
      expect(isSelected(state, "a")).toBe(true);
      expect(isSelected(state, "b")).toBe(false);
      expect(isSelected(state, "c")).toBe(true);
    });
  });

  describe("getEffectiveValues", () => {
    it("returns all values when state is 'all'", () => {
      const state: SelectionState<string> = { type: "all" };
      expect(getEffectiveValues(state, allValues)).toEqual(
        new Set(["a", "b", "c"])
      );
    });

    it("returns empty set when state is 'none'", () => {
      const state: SelectionState<string> = { type: "none" };
      expect(getEffectiveValues(state, allValues)).toEqual(new Set());
    });

    it("returns only selected values when state is 'some'", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a"),
      };
      expect(getEffectiveValues(state, allValues)).toEqual(new Set(["a"]));
    });
  });

  describe("toggle", () => {
    it("removes one value from 'all' state", () => {
      const state: SelectionState<string> = { type: "all" };
      const next = toggle(state, "b", allValues);

      expect(next.type).toBe("some");
      if (next.type === "some") {
        expect(next.values).toEqual(new Set(["a", "c"]));
      }
    });

    it("removes one value from 'some' state", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a", "c"),
      };
      const next = toggle(state, "a", allValues);

      expect(next.type).toBe("some");
      if (next.type === "some") {
        expect(next.values).toEqual(new Set(["c"]));
      }
    });

    it("adds one value to 'some' state", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a"),
      };
      const next = toggle(state, "b", allValues);

      expect(next.type).toBe("some");
      if (next.type === "some") {
        expect(next.values).toEqual(new Set(["a", "b"]));
      }
    });

    it("returns 'all' when all values are selected", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a", "c"),
      };
      const next = toggle(state, "b", allValues);

      expect(next).toEqual({ type: "all" });
    });

    it("returns 'none' when deselecting the last value from 'some' state", () => {
      const state: SelectionState<string> = {
        type: "some",
        values: nonEmptySetOf("a"),
      };
      const next = toggle(state, "a", allValues);

      expect(next).toEqual({ type: "none" });
    });

    it("returns 'none' when allValues has only one item and it is toggled off", () => {
      const singleValue = ["x"];
      const state: SelectionState<string> = { type: "all" };
      const next = toggle(state, "x", singleValue);

      expect(next).toEqual({ type: "none" });
    });

    it("adds value to 'none' state", () => {
      const state: SelectionState<string> = { type: "none" };
      const next = toggle(state, "a", allValues);

      expect(next.type).toBe("some");
      if (next.type === "some") {
        expect(next.values).toEqual(new Set(["a"]));
      }
    });
  });

  describe("only", () => {
    it("selects only the specified value", () => {
      const state = only("b");

      expect(state.type).toBe("some");
      if (state.type === "some") {
        expect(state.values).toEqual(new Set(["b"]));
      }
    });
  });

  describe("all", () => {
    it("returns all selection state", () => {
      expect(all()).toEqual({ type: "all" });
    });
  });

  describe("none", () => {
    it("returns none selection state", () => {
      expect(none()).toEqual({ type: "none" });
    });
  });
});
