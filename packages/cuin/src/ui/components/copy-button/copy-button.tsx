import { Tooltip } from "@ark-ui/solid/tooltip";
import { type Component, createSignal } from "solid-js";
import type { Instance, Package } from "../../../types/schema";
import { CheckIcon, CopyIcon, MarkdownIcon } from "../icons";
import { formatAsMarkdown } from "./copy-formats";
import { useClipboard } from "./use-clipboard";

type Props = {
  instances: Instance[];
  componentName: string;
  componentPackage: Package;
};

export const CopyButton: Component<Props> = (props) => {
  const [copied, setCopied] = createSignal(false);
  const { copy } = useClipboard();

  const handleCopy = async () => {
    const component = {
      name: props.componentName,
      package: props.componentPackage,
    };
    const content = formatAsMarkdown(props.instances, component);
    const success = await copy(content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDisabled = () => props.instances.length === 0;

  return (
    <Tooltip.Root closeDelay={0} openDelay={300}>
      <Tooltip.Trigger
        class="flex cursor-pointer items-center gap-1 rounded-sm border border-brand-200 bg-brand-50 px-2 py-1 font-mono text-brand-700 text-xs hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isDisabled()}
        onClick={handleCopy}
        type="button"
      >
        {copied() ? (
          <>
            <CheckIcon class="text-sm" />
            Copied!
          </>
        ) : (
          <>
            <CopyIcon class="text-sm" />
            Markdown
            <MarkdownIcon class="text-sm" />
          </>
        )}
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content class="rounded bg-neutral-800 px-2 py-1 text-white text-xs shadow-lg">
          Copy filtered results as Markdown
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  );
};
