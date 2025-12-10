import { debounce } from "@solid-primitives/scheduled";
import { createMemo, createSignal, For, Show } from "solid-js";
import { CheckIcon, SearchIcon, XIcon } from "~/components/icons";
import type { InstanceDetailStore } from "~/dataflow/instance";
import type { PropAnalysis } from "~/dataflow/instance/props-analyze";
import { Root } from "~/shared/ui/exclusive-checkbox-group";
import { Count } from "./count";
import { StyledExclusiveCheckboxItem } from "./styled-exclusive-checkbox-item";

type PropValueFilterSectionProps = {
  prop: PropAnalysis;
  store: InstanceDetailStore;
};

export default function PropValueFilterSection(
  props: PropValueFilterSectionProps
) {
  const { store } = props;
  const propKey = () => props.prop.key;

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

  const allValues = createMemo(() => props.prop.values.map((v) => v.value));

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

  const isFiltered = () => store.isPropFiltered(propKey());
  const checkedCount = () => store.getCheckedCount(propKey());
  const totalCount = () => store.getAllValuesCount(propKey());

  const areAllSearchResultsChecked = () => {
    const results = filteredValues();
    if (results.length === 0) {
      return false;
    }
    return results.every((v) => store.isValueChecked(propKey(), v.value));
  };

  const isFilteringBySearchResults = () => {
    const results = filteredValues();
    const currentCheckedCount = store.getCheckedCount(propKey());
    const currentTotalCount = store.getAllValuesCount(propKey());

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
      store.selectAllValues(propKey());
    } else {
      store.selectOnlyValues(propKey(), values);
    }
  };

  return (
    <details class="group rounded border border-brand-200 transition">
      <summary class="flex cursor-pointer list-none items-center justify-between p-2 [&::-webkit-details-marker]:hidden">
        <div class="flex min-w-0 flex-1 items-center gap-1">
          <svg
            aria-hidden="true"
            class="-rotate-90 h-3 w-3 shrink-0 transition-transform group-open:rotate-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 9l-7 7-7-7"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            />
          </svg>
          <span class="truncate font-mono font-semibold text-xs hover:text-primary">
            {propKey()}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <Show when={isFiltered()}>
            <span class="font-mono text-primary text-xs tabular-nums">
              {checkedCount()}/{totalCount()}
            </span>
          </Show>
          <Show when={isFiltered()}>
            <button
              class="rounded p-0.5 hover:bg-brand-100"
              onClick={(e) => {
                e.preventDefault();
                store.clearPropFilter(propKey());
              }}
              title="Clear filter"
              type="button"
            >
              <XIcon class="h-3 w-3" />
            </button>
          </Show>
        </div>
      </summary>

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
                <Show fallback={<div>Searching...</div>} when={!isSearching()}>
                  No values match "{debouncedSearchQuery()}"
                </Show>
              </div>
            }
            when={searchResultCount() > 0}
          >
            <Root
              class="p-1"
              onSelectionChange={(state) =>
                store.setPropSelection(propKey(), state)
              }
              selection={() => store.getPropSelection(propKey())}
              values={allValues}
            >
              <For each={filteredValues()}>
                {({ value }) => (
                  <StyledExclusiveCheckboxItem
                    label={<span class="text-xs">{value}</span>}
                    rightAddon={
                      <Count value={store.getFilteredCount(propKey(), value)} />
                    }
                    value={value}
                  />
                )}
              </For>
            </Root>
          </Show>
        </div>
      </div>
    </details>
  );
}
