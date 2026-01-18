import type { Component } from "solid-js";
import { AlignLeftIcon, FolderIcon } from "./icons";

export type DisplayMode = "folder" | "flat";

export const DisplayModeToggle: Component<{
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
}> = (props) => {
  return (
    <div class="flex items-center gap-0 overflow-hidden rounded-sm border border-neutral-border bg-neutral-bg">
      <button
        aria-label="Folder view"
        aria-pressed={props.mode === "folder"}
        class={`flex items-center justify-center p-1.5 transition-colors ${
          props.mode === "folder"
            ? "bg-brand-700 text-brand-50"
            : "text-subtext-color hover:bg-neutral-hover"
        }`}
        onClick={() => props.onChange("folder")}
        type="button"
      >
        <FolderIcon class="text-lg" />
      </button>
      <button
        aria-label="Flat view"
        aria-pressed={props.mode === "flat"}
        class={`flex items-center justify-center p-1.5 transition-colors ${
          props.mode === "flat"
            ? "bg-brand-700 text-brand-50"
            : "text-subtext-color hover:bg-neutral-hover"
        }`}
        onClick={() => props.onChange("flat")}
        type="button"
      >
        <AlignLeftIcon class="text-lg" />
      </button>
    </div>
  );
};
