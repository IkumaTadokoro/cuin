import { describe, expect, it } from "vitest";
import { nonEmptySetOf } from "./selection-state";
import {
	deserializeSelectionState,
	parseSortKey,
	parseSortOrder,
	serializeSelectionState,
} from "./url-sync";

describe("serializeSelectionState", () => {
	it("should return undefined for all", () => {
		expect(serializeSelectionState({ type: "all" })).toBeUndefined();
	});

	it("should return empty string for none", () => {
		expect(serializeSelectionState({ type: "none" })).toBe("");
	});

	it("should return comma-separated string for some", () => {
		const values = nonEmptySetOf("react", "@mui/material");
		expect(serializeSelectionState({ type: "some", values })).toBe(
			"react,@mui/material",
		);
	});

	it("should handle single value", () => {
		const values = nonEmptySetOf("native");
		expect(serializeSelectionState({ type: "some", values })).toBe("native");
	});
});

describe("deserializeSelectionState", () => {
	const allValues = ["react", "@mui/material", "native"];

	it("should return all for undefined", () => {
		expect(deserializeSelectionState(undefined, allValues)).toEqual({
			type: "all",
		});
	});

	it("should return none for empty string", () => {
		expect(deserializeSelectionState("", allValues)).toEqual({
			type: "none",
		});
	});

	it("should parse valid comma-separated values", () => {
		const result = deserializeSelectionState("react,native", allValues);
		expect(result.type).toBe("some");
		if (result.type === "some") {
			expect(Array.from(result.values).sort()).toEqual(["native", "react"]);
		}
	});

	it("should filter invalid values", () => {
		const result = deserializeSelectionState("react,invalid", allValues);
		expect(result.type).toBe("some");
		if (result.type === "some") {
			expect(Array.from(result.values)).toEqual(["react"]);
		}
	});

	it("should fallback to all when all values are invalid", () => {
		expect(deserializeSelectionState("invalid1,invalid2", allValues)).toEqual({
			type: "all",
		});
	});

	it("should return all when selecting all values", () => {
		expect(
			deserializeSelectionState("react,@mui/material,native", allValues),
		).toEqual({
			type: "all",
		});
	});

	it("should handle array input", () => {
		const result = deserializeSelectionState(["react", "native"], allValues);
		expect(result.type).toBe("some");
		if (result.type === "some") {
			expect(Array.from(result.values).sort()).toEqual(["native", "react"]);
		}
	});
});

describe("parseSortKey", () => {
	it("should return name for name", () => {
		expect(parseSortKey("name")).toBe("name");
	});

	it("should return usage for usage", () => {
		expect(parseSortKey("usage")).toBe("usage");
	});

	it("should fallback to name for invalid value", () => {
		expect(parseSortKey("invalid")).toBe("name");
	});

	it("should fallback to name for undefined", () => {
		expect(parseSortKey(undefined)).toBe("name");
	});

	it("should handle array input", () => {
		expect(parseSortKey(["usage"])).toBe("usage");
	});
});

describe("parseSortOrder", () => {
	it("should return asc for asc", () => {
		expect(parseSortOrder("asc")).toBe("asc");
	});

	it("should return desc for desc", () => {
		expect(parseSortOrder("desc")).toBe("desc");
	});

	it("should fallback to asc for invalid value", () => {
		expect(parseSortOrder("invalid")).toBe("asc");
	});

	it("should fallback to asc for undefined", () => {
		expect(parseSortOrder(undefined)).toBe("asc");
	});

	it("should handle array input", () => {
		expect(parseSortOrder(["desc"])).toBe("desc");
	});
});
