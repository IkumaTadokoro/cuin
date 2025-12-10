import type { SortKey, SortOrder } from "~/dataflow/component/sort";
import { parseAsString, parseCommaSeparated } from "~/shared/lib/search-param";
import { nonEmptySet, type SelectionState } from "./selection-state";

export function serializeSelectionState<T extends string>(
	state: SelectionState<T>,
): string | undefined {
  if (state.type === "all") {
		return undefined;
	}
	if (state.type === "none") {
		return "";
	}
	return Array.from(state.values).join(",");
}

export function deserializeSelectionState<T extends string>(
	value: string | string[] | undefined,
	allValues: T[],
): SelectionState<T> {
	if (value === undefined) {
		return { type: "all" };
	}

	if (value === "") {
		return { type: "none" };
	}

	const parsed = parseCommaSeparated(value);
	const allValuesSet = new Set(allValues);
	const validValues = parsed.filter((v) => allValuesSet.has(v as T)) as T[];

	if (validValues.length === 0) {
		return { type: "all" };
	}

	if (validValues.length === allValues.length) {
		return { type: "all" };
	}

	const nonEmpty = nonEmptySet(validValues);
	return nonEmpty ? { type: "some", values: nonEmpty } : { type: "all" };
}

export function parseSortKey(value: string | string[] | undefined): SortKey {
	const str = parseAsString(value);
	return str === "name" || str === "usage" ? str : "name";
}

export function parseSortOrder(
	value: string | string[] | undefined,
): SortOrder {
	const str = parseAsString(value);
	return str === "asc" || str === "desc" ? str : "asc";
}
