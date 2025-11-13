import { Checkbox } from "@ark-ui/solid/checkbox";
import { BsCheck as Check } from "solid-icons/bs";
import { createMemo, createSignal, For } from "solid-js";

const items = [
  { label: "React", value: "react" },
  { label: "Solid", value: "solid" },
  { label: "Vue", value: "vue" },
];

export const GroupControlled = () => {
  const [value, setValue] = createSignal(items.map((item) => item.value));
  const groupSelectionMode = createMemo(() =>
    value().length === 1 ? "single" : "multiple"
  );
  const selectionMode = (self: string) => {
    const groupMode = groupSelectionMode();
    const isSelfSelected = value().includes(self);
    const selfSelectedMode = isSelfSelected ? "all" : "only";
    const mode = groupMode === "multiple" ? "only" : selfSelectedMode;
    return mode;
  };
  const handleClick = (current: string) => () => {
    const mode = selectionMode(current);
    if (mode === "all") {
      setValue(items.map((item) => item.value));
    } else if (mode === "only") {
      setValue((_prev) => [current]);
    }
  };

  const _toggleAll = () => {
    const mode = selectionMode(items[0].value);
    if (mode === "all") {
      setValue([]);
    } else if (mode === "only") {
      setValue(items.map((item) => item.value));
    }
  };

  return (
    <Checkbox.Group name="framework" value={value}>
      <For each={items}>
        {(item) => (
          <Checkbox.Root
            class="group grid grid-cols-[auto_12px_1fr] items-center gap-2"
            data-mode={selectionMode(item.value)}
            value={item.value}
          >
            <button onClick={handleClick(item.value)} type="button">
              Toggle Value
            </button>
            <Checkbox.Control>
              <Checkbox.Indicator>
                <Check />
              </Checkbox.Indicator>
            </Checkbox.Control>
            <Checkbox.Label>
              {item.label}
              <span class="opacity-0 group-hover:opacity-40">
                {selectionMode(item.value)}
              </span>
            </Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        )}
      </For>
    </Checkbox.Group>
  );
};
