import { TbComponents as ComponentIcon } from "solid-icons/tb";
import type { Component } from "solid-js";

type Props = {
  count: number;
};

export const ComponentListCount: Component<Props> = (props) => (
  <div class="flex items-center gap-2">
    <ComponentIcon class="text-lg text-subtext-color" />
    <p class="text-lg">{props.count}</p>
    <p class="text-sm">components</p>
  </div>
);
