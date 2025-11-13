import { type Component, For } from "solid-js";
import { SORT_OPTIONS, type SortOption } from "~/lib/component-filter";

type Props = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export const ComponentOrderSelect: Component<Props> = (props) => (
  <label class="flex items-center gap-2">
    <p class="text-subtext-color text-xs">Order By:</p>
    <select
      class="text-sm"
      onChange={(e) => props.onChange(e.currentTarget.value as SortOption)}
      value={props.value}
    >
      <For each={SORT_OPTIONS}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  </label>
);
