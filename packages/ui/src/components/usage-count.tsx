import { BiSolidCategoryAlt as CategoryIcon } from "solid-icons/bi";
import type { Component } from "solid-js";

export const UsageCount: Component<{
  count: number;
}> = (props) => (
  <div class="flex max-w-max items-center gap-1 rounded-sm border border-brand-100 bg-brand-50 px-2 py-0.5">
    <CategoryIcon class="mr-1 text-brand-400" />
    <div class="flex gap-1 font-mono text-xs">
      <span class="font-bold">{props.count}</span>
      usages
    </div>
  </div>
);
