import type { Component } from "solid-js";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const ComponentNameFilter: Component<Props> = (props) => (
  <div class="grid shrink-0 gap-2">
    <label for="component-name-filter">Name</label>
    <input
      class="w-full rounded-md border border-brand-200 px-2 py-1 font-mono text-sm"
      id="component-name-filter"
      onInput={(e) => props.onChange(e.currentTarget.value)}
      placeholder="Filter by name..."
      type="text"
      value={props.value}
    />
  </div>
);
