import { A } from "@solidjs/router";
import { For, Show } from "solid-js";
import { useHeader } from "./header-provider";

export default function Header() {
  const { header } = useHeader();

  return (
    <header class="border-neutral-border border-b bg-background px-0 2xl:px-12">
      <div class="grid gap-2 border-neutral-border border-x px-4 py-4">
        <div class="flex items-center gap-2 font-mono text-subtext-color text-xs">
          <For each={header().breadcrumbs}>
            {(crumb, index) => (
              <>
                <Show when={index() < header().breadcrumbs.length - 1}>
                  <A class="text-primary" href="/">
                    {crumb} /
                  </A>
                </Show>
                <Show when={index() === header().breadcrumbs.length - 1}>
                  <p>{crumb} / </p>
                </Show>
              </>
            )}
          </For>
        </div>
        <hgroup class="grid gap-2">
          <div class="flex items-center gap-2">
            <Show when={header().title.icon}>{header().title.icon}</Show>
            <h2 class="font-semibold text-lg tracking-wide">
              {header().title.text}
            </h2>
          </div>

          <Show when={header().description}>
            <Show
              fallback={header().description}
              when={typeof header().description === "string"}
            >
              <p class="text-sm text-subtext-color">
                {header().description as string}
              </p>
            </Show>
          </Show>
        </hgroup>
      </div>
    </header>
  );
}
