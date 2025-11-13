import type { Component } from "solid-js";

export const ToggleDisclosureButton: Component<{ mode: "open" | "close" }> = ({
  mode,
}) => {
  const handleToggle = () => {
    const details = document.querySelectorAll<HTMLDetailsElement>("details");
    for (const detail of details) {
      detail.open = mode === "open";
    }
  };

  return (
    <button
      class="flex cursor-pointer items-center rounded-sm bg-brand-700 px-2 py-1 font-mono text-brand-50 text-xs hover:bg-brand-800"
      onClick={handleToggle}
      type="button"
    >
      {mode === "open" ? "ExpandAll" : "CollapseAll"}
    </button>
  );
};
