import type { JSX } from "solid-js";
import type { LabelAction } from "~/shared/ui/exclusive-checkbox-group";
import {
  Control,
  Indicator,
  Item,
  Label,
} from "~/shared/ui/exclusive-checkbox-group";

type StyledExclusiveCheckboxItemProps = {
  value: string;
  label: JSX.Element;
  rightAddon?: JSX.Element;
};

const getActionLabel = (action: LabelAction): string => {
  switch (action) {
    case "toggle":
      return "Toggle";
    case "only":
      return "Only";
    case "all":
      return "All";
    default: {
      const _ = action satisfies never;
      throw new Error(`Unknown action: ${action}`);
    }
  }
};

export function StyledExclusiveCheckboxItem(
  props: StyledExclusiveCheckboxItemProps
) {
  return (
    <Item
      class="group/item h-6 px-2 py-1 transition hover:bg-brand-50"
      value={props.value}
    >
      <Control class="cursor-pointer rounded border-gray-300" />
      <Label class="cursor-pointer border-0 bg-transparent p-0 text-left">
        <div class="min-w-0 truncate group-hover/item:max-w-[calc(100%-3rem)]">
          {props.label}
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Indicator>
            {(controlAction, labelAction, hoveredPart) => {
              const displayAction =
                hoveredPart === "control" ? controlAction : labelAction;
              return (
                <span
                  class="hidden align-middle font-semibold text-[10px] text-primary uppercase leading-none group-hover/item:inline"
                  classList={{
                    "!inline": labelAction === "all",
                  }}
                >
                  {getActionLabel(displayAction)}
                </span>
              );
            }}
          </Indicator>
          {props.rightAddon}
        </div>
      </Label>
    </Item>
  );
}
