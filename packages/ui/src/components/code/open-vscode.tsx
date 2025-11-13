import { BiLogosVisualStudio as VSCodeIcon } from "solid-icons/bi";
import type { Component } from "solid-js";

type OpenVscodeProps = {
  absPath: string;
  basePath: string;
};

export const OpenVscode: Component<OpenVscodeProps> = (props) => {
  const vscodeScheme = "vscode://file";
  const path = () => `${vscodeScheme}/${props.basePath}/${props.absPath}`;

  return (
    <a
      class="inline-flex items-center rounded-sm p-1.5 hover:bg-brand-100"
      href={path()}
      rel="noopener noreferrer"
      target="_blank"
    >
      <VSCodeIcon class="h-5 w-5 text-blue-500 text-lg" />
      <span class="sr-only">open vscode</span>
    </a>
  );
};
