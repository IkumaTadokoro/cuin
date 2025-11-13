import { type Component, createSignal, onMount } from "solid-js";
import type { Span } from "~/dataflow/core/schema";
import { OpenVscode } from "./open-vscode";
import { codeToHtml } from "./shiki.bundle";

type Props = {
  code: string;
  basePath: string;
  filePath: string;
  span: Span;
};

export const Code: Component<Props> = (props) => {
  const [html, setHtml] = createSignal("");
  const location = `${props.filePath}:${props.span.startLine}:${props.span.startCol}`;

  onMount(async () => {
    const highlighted = await codeToHtml(props.code, {
      lang: "tsx",
      theme: "github-light",
    });
    setHtml(highlighted);
  });

  return (
    <div
      class="relative overflow-x-auto rounded-sm border border-brand-100 bg-brand-50 text-sm"
      style={{
        "--start": props.span.startLine,
        "max-width": "100%",
      }}
    >
      <style>
        {`
          .code-container code {
            grid-template-columns: 100% !important;
            max-width: 100%;
          }
        `}
      </style>
      <div
        class="code-container *:m-0 *:border-none *:p-0! *:focus-visible:outline-none [&_.line]:whitespace-pre [&_.line]:px-4 [&_.line]:py-px [&_.line]:leading-relaxed [&_code]:grid [&_code]:w-full [&_code]:py-3 [&_pre]:bg-transparent! [&_pre]:dark:bg-transparent!"
        innerHTML={html()}
      />
      <div class="absolute right-2 bottom-2">
        <OpenVscode absPath={location} basePath={props.basePath} />
      </div>
    </div>
  );
};
