import { debounce } from "@solid-primitives/scheduled";
import {
  BiRegularCheck as CheckIcon,
  BiRegularChevronDown as ChevronDownIcon,
  BiRegularSearch as SearchIcon,
  BiRegularX as XIcon,
} from "solid-icons/bi";
import { createMemo, createSignal, For, Show } from "solid-js";
import type { PropAnalysis } from "~/lib/props-analyze";
import SmartCheckbox from "./smart-checkbox";

type PropValueFilterSectionProps = {
  prop: PropAnalysis;
  isValueChecked: (propKey: string, value: string) => boolean;
  toggleValue: (propKey: string, value: string) => void;
  selectOnlyValue: (propKey: string, value: string) => void;
  selectAllValues: (propKey: string) => void;
  clearPropFilter: (propKey: string) => void;
  isPropFiltered: (propKey: string) => boolean;
  getCheckedCount: (propKey: string) => number;
  getAllValuesCount: (propKey: string) => number;
  getFilteredCount: (propKey: string, value: string) => number;
  selectOnlyValues: (propKey: string, values: string[]) => void;
};

export default function PropValueFilterSection(
  props: PropValueFilterSectionProps
) {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = createSignal("");

  const SEARCH_DEBOUNCE_MS = 300;
  const debouncedSetSearch = debounce((value: string) => {
    setDebouncedSearchQuery(value);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    debouncedSetSearch(value);
  };

  const filteredValues = createMemo(() => {
    const query = debouncedSearchQuery().toLowerCase().trim();
    if (!query) {
      return props.prop.values;
    }

    return props.prop.values.filter((v) =>
      v.value.toLowerCase().includes(query)
    );
  });

  const searchResultCount = () => filteredValues().length;
  const hasSearchQuery = () => searchQuery().trim().length > 0;
  const isSearching = () => searchQuery() !== debouncedSearchQuery();

  const isFiltered = () => props.isPropFiltered(props.prop.key);
  const checkedCount = () => props.getCheckedCount(props.prop.key);
  const totalCount = () => props.getAllValuesCount(props.prop.key);

  const areAllSearchResultsChecked = () => {
    const results = filteredValues();
    if (results.length === 0) {
      return false;
    }
    return results.every((v) => props.isValueChecked(props.prop.key, v.value));
  };

  const isFilteringBySearchResults = () => {
    const results = filteredValues();
    const currentCheckedCount = props.getCheckedCount(props.prop.key);
    const currentTotalCount = props.getAllValuesCount(props.prop.key);

    if (currentCheckedCount === currentTotalCount) {
      return false;
    }

    return (
      currentCheckedCount === results.length && areAllSearchResultsChecked()
    );
  };

  const selectSearchResults = () => {
    const values = filteredValues().map((v) => v.value);

    if (isFilteringBySearchResults()) {
      props.selectAllValues(props.prop.key);
    } else {
      props.selectOnlyValues(props.prop.key, values);
    }
  };

  return (
    <div class={"rounded border border-brand-200 transition"}>
      <div class="p-2">
        <div class="flex items-center justify-between">
          <button
            class="group flex min-w-0 flex-1 items-center gap-1 text-left"
            onClick={() => setIsExpanded(!isExpanded())}
            type="button"
          >
            <ChevronDownIcon
              class={`h-3 w-3 shrink-0 transition-transform ${
                isExpanded() ? "" : "-rotate-90"
              }`}
            />
            <span class="truncate font-mono font-semibold text-xs group-hover:text-primary">
              {props.prop.key}
            </span>
          </button>

          <div class="flex items-center gap-2">
            <Show when={isFiltered()}>
              <span class="font-mono text-primary text-xs tabular-nums">
                {checkedCount()}/{totalCount()}
              </span>
            </Show>
            <Show when={isFiltered()}>
              <button
                class="rounded p-0.5 hover:bg-brand-100"
                onClick={() => props.clearPropFilter(props.prop.key)}
                title="Clear filter"
                type="button"
              >
                <XIcon class="h-3 w-3" />
              </button>
            </Show>
          </div>
        </div>
      </div>

      <Show when={isExpanded()}>
        <div class="rounded-b border-brand-200 border-t bg-white">
          <div class="border-brand-200 border-b p-2">
            <div class="relative">
              <SearchIcon class="-translate-y-1/2 absolute top-1/2 left-2 h-3 w-3 text-subtext-color" />
              <input
                class="w-full rounded border border-neutral-border bg-background py-1 pr-7 pl-7 text-xs focus:border-primary focus:outline-none"
                onInput={(e) => handleSearchInput(e.currentTarget.value)}
                placeholder="Filter values..."
                type="text"
                value={searchQuery()}
              />
              <Show when={hasSearchQuery()}>
                <button
                  class="-translate-y-1/2 absolute top-1/2 right-2 text-subtext-color hover:text-text-color"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                  }}
                  type="button"
                >
                  <XIcon class="h-3 w-3" />
                </button>
              </Show>

              <Show when={isSearching()}>
                <div class="-translate-y-1/2 absolute top-1/2 right-8">
                  <div class="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </Show>
            </div>

            <Show when={hasSearchQuery() && !isSearching()}>
              <div class="mt-2 flex items-center justify-between">
                <div class="text-subtext-color text-xs">
                  {searchResultCount()} of {props.prop.values.length} values
                </div>
                <Show when={searchResultCount() > 0}>
                  <button
                    class="flex items-center gap-1 text-primary text-xs hover:underline"
                    onClick={selectSearchResults}
                    type="button"
                  >
                    <CheckIcon class="h-3 w-3" />
                    {isFilteringBySearchResults()
                      ? "Deselect results"
                      : "Select only results"}
                  </button>
                </Show>
              </div>
            </Show>
          </div>

          <div class="max-h-64 overflow-y-auto">
            <Show
              fallback={
                <div class="p-4 text-center text-subtext-color text-xs">
                  <Show
                    fallback={<div>Searching...</div>}
                    when={!isSearching()}
                  >
                    No values match "{debouncedSearchQuery()}"
                  </Show>
                </div>
              }
              when={searchResultCount() > 0}
            >
              <For each={filteredValues()}>
                {(valueData) => {
                  const isChecked = () =>
                    props.isValueChecked(props.prop.key, valueData.value);
                  const isOnlyChecked = () =>
                    isChecked() && checkedCount() === 1;
                  const hasOthersChecked = () => checkedCount() > 1;
                  const filteredCount = () =>
                    props.getFilteredCount(props.prop.key, valueData.value);

                  return (
                    <SmartCheckbox
                      checked={isChecked()}
                      class="px-2 py-1"
                      count={filteredCount()}
                      hasOthersChecked={hasOthersChecked()}
                      isOnlyChecked={isOnlyChecked()}
                      label={
                        valueData.value === "(no value)"
                          ? "(no value)"
                          : valueData.value
                      }
                      onAll={() => props.selectAllValues(props.prop.key)}
                      onOnly={() =>
                        props.selectOnlyValue(props.prop.key, valueData.value)
                      }
                      onToggle={() =>
                        props.toggleValue(props.prop.key, valueData.value)
                      }
                    />
                  );
                }}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
