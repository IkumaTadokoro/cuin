import type { Component } from "solid-js";
import { useBatchProcess } from "../../lib/use-batch-process";
import { useDetailsGroup } from "./details-group";

export const ToggleAllDetailsButton: Component<{ mode: "open" | "close" }> = (
  props
) => {
  const { getAllDetails } = useDetailsGroup();
  const [isBatchProcessing, run] = useBatchProcess({
    getItems: getAllDetails,
  });

  const direction = props.mode === "open";
  const handleClick = async () => {
    if (isBatchProcessing()) {
      return;
    }
    await run((e) => {
      e.open = direction;
    });
  };

  return (
    <button
      class="flex cursor-pointer items-center gap-1 rounded-sm bg-brand-700 px-2 py-1 font-mono text-brand-50 text-xs hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isBatchProcessing()}
      onClick={handleClick}
      type="button"
    >
      {props.mode === "open" ? "ExpandAll" : "CollapseAll"}
    </button>
  );
};
