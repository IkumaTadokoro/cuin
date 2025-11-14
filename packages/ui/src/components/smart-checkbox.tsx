import { createSignal, type JSX, Show } from "solid-js";

export type CheckboxMode = "toggle" | "only" | "all";

type SmartCheckboxProps = {
  checked: boolean;
  label: string | JSX.Element;
  count?: number;
  disabled?: boolean;
  isOnlyChecked: boolean;
  hasOthersChecked: boolean;
  onToggle: () => void;
  onOnly: () => void;
  onAll: () => void;
  class?: string;
};

export default function SmartCheckbox(props: SmartCheckboxProps) {
  const [hoveredArea, setHoveredArea] = createSignal<
    "checkbox" | "label" | null
  >(null);

  const getLabelMode = (): CheckboxMode | null => {
    if (props.checked && props.isOnlyChecked) {
      return "all";
    }
    if (props.hasOthersChecked) {
      return "only";
    }
    if (!(props.checked || props.hasOthersChecked)) {
      return "only";
    }
    return null;
  };

  const mode = (): CheckboxMode | null => {
    const area = hoveredArea();
    if (!area) {
      return null;
    }

    if (area === "checkbox") {
      return "toggle";
    }

    if (area === "label") {
      return getLabelMode();
    }

    return null;
  };

  const getModeLabel = (m: CheckboxMode | null): string => {
    if (!m) {
      return "";
    }
    switch (m) {
      case "toggle":
        return "Toggle";
      case "only":
        return "Only";
      case "all":
        return "All";
      default:
        return "";
    }
  };

  const handleClick = () => {
    const currentMode = mode();
    if (currentMode === "only") {
      props.onOnly();
    } else if (currentMode === "all") {
      props.onAll();
    }
  };

  const handleClickWithReset = () => {
    handleClick();
    const currentArea = hoveredArea();
    setHoveredArea(null);
    setTimeout(() => {
      setHoveredArea(currentArea);
    }, 0);
  };

  return (
    <div
      class={`flex items-center gap-2 transition hover:bg-brand-50 ${props.class || ""}`}
    >
      <div class="shrink-0">
        <input
          checked={props.checked}
          class="cursor-pointer rounded border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={props.disabled}
          onChange={props.onToggle}
          onMouseEnter={() => setHoveredArea("checkbox")}
          onMouseLeave={() => setHoveredArea(null)}
          type="checkbox"
        />
      </div>

      <button
        class="flex min-w-0 flex-1 cursor-pointer items-center justify-between border-0 bg-transparent p-0 text-left"
        onClick={handleClickWithReset}
        onMouseEnter={() => setHoveredArea("label")}
        onMouseLeave={() => setHoveredArea(null)}
        type="button"
      >
        <span class="truncate font-mono text-xs">{props.label}</span>

        <div class="ml-2 flex shrink-0 items-center gap-2">
          <Show when={mode()}>
            <span class="font-semibold text-[10px] text-primary uppercase">
              {getModeLabel(mode())}
            </span>
          </Show>
          <Show when={props.count !== undefined}>
            <span class="text-subtext-color text-xs tabular-nums">
              {props.count}
            </span>
          </Show>
        </div>
      </button>
    </div>
  );
}
