import { type Component, For } from "solid-js";
import {
  SORT_OPTIONS,
  type SortKey,
  type SortOrder,
} from "~/dataflow/component/sort";

type Props = {
  sortKey: SortKey;
  sortOrder: SortOrder;
  onChange: (key: SortKey, order: SortOrder) => void;
};

const toValue = (key: SortKey, order: SortOrder) => `${key}-${order}`;

const fromValue = (value: string): [SortKey, SortOrder] => {
  const [key, order] = value.split("-") as [SortKey, SortOrder];
  return [key, order];
};

export const ComponentOrderSelect: Component<Props> = (props) => (
  <label class="flex items-center gap-2">
    <p class="text-subtext-color text-xs">Order By:</p>
    <select
      class="text-sm"
      onChange={(e) => {
        const [key, order] = fromValue(e.currentTarget.value);
        props.onChange(key, order);
      }}
      value={toValue(props.sortKey, props.sortOrder)}
    >
      <For each={SORT_OPTIONS}>
        {(option) => (
          <option value={toValue(option.key, option.order)}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  </label>
);
