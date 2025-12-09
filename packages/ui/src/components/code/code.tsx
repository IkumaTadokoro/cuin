import { type Component, createEffect, createSignal, For } from "solid-js";
import type { Span } from "~/dataflow/schema";
import { useLazyHighlight } from "~/hooks/use-lazy-highlight";
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
  const [containerRef, setContainerRef] = createSignal<HTMLElement>();
  const [isHighlighted, setIsHighlighted] = createSignal(false);
  const location = `${props.filePath}:${props.span.startLine}:${props.span.startCol}`;

  const shouldHighlight = useLazyHighlight({
    containerRef,
    rootMargin: "100px",
  });

  createEffect(async () => {
    if (shouldHighlight() && !isHighlighted()) {
      setIsHighlighted(true);
      const highlighted = await codeToHtml(props.code, {
        lang: "tsx",
        theme: "github-light",
      });
      setHtml(highlighted);
    }
  });

  return (
    <div
      class="relative overflow-x-auto rounded-sm border border-brand-100 bg-brand-50 text-sm"
      ref={setContainerRef}
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
      {html() ? (
        <div
          class="code-container *:m-0 *:border-none *:p-0! *:focus-visible:outline-none [&_.line]:whitespace-pre [&_.line]:px-4 [&_.line]:py-px [&_.line]:leading-relaxed [&_code]:grid [&_code]:w-full [&_code]:py-3 [&_pre]:bg-transparent! [&_pre]:dark:bg-transparent!"
          innerHTML={html()}
        />
      ) : (
        <pre class="m-0 border-none bg-transparent p-0">
          <code class="grid w-full py-3">
            <For each={props.code.split("\n")}>
              {(line) => (
                <span class="line whitespace-pre px-4 py-px leading-relaxed">
                  {line}
                </span>
              )}
            </For>
          </code>
        </pre>
      )}
      <div class="absolute right-2 bottom-2">
        <OpenVscode absPath={location} basePath={props.basePath} />
      </div>
    </div>
  );
};
