import type { Component } from "solid-js";
import { ZedIcon } from "~/components/icons";

type OpenZedProps = {
  absPath: string;
  basePath: string;
};

export const OpenZed: Component<OpenZedProps> = (props) => {
  const zedScheme = "zed://file";
  const path = () => `${zedScheme}/${props.basePath}/${props.absPath}`;

  return (
    <a
      class="inline-flex items-center rounded-sm p-1.5 hover:bg-brand-100"
      href={path()}
      rel="noopener noreferrer"
      target="_blank"
    >
      <ZedIcon class="h-5 w-5 text-lg" />
      <span class="sr-only">open zed</span>
    </a>
  );
};
