import { For, type Component as SolidComponent } from "solid-js";
import { getFileName } from "~/lib/get-file-name";
import type { GroupedInstances } from "~/lib/group-instances-by-file";
import { Details } from "~/shared/ui/details/details";
import { Code } from "./code/code";
import { CategoryIcon } from "./icons";
import { Package as PackageComponent } from "./package/package";
import { PropsBadge } from "./props-badge";

export const GroupedUsageList: SolidComponent<{
  groups: GroupedInstances[];
  basePath: string;
  maxOpenItems: number;
  totalInstances: number;
}> = (props) => {
  return (
    <For each={props.groups}>
      {(group) => (
        <Details
          class="min-w-0"
          open={props.totalInstances <= props.maxOpenItems}
          summary={
            <div class="flex items-center justify-between">
              <p>{getFileName(group.filePath)}</p>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1 font-mono text-xs">
                  <CategoryIcon class="text-lg text-subtext-color" />
                  <p>{group.instances.length}</p>
                  <p class="text-subtext-color">
                    usage{group.instances.length === 1 ? "" : "s"}
                  </p>
                </div>
                {group.instances[0].package && (
                  <PackageComponent {...group.instances[0].package} />
                )}
              </div>
            </div>
          }
        >
          <div class="grid gap-4">
            <For each={group.instances}>
              {(instance, index) => (
                <div
                  class={`flex min-w-0 flex-col gap-2 px-2 ${
                    index() < group.instances.length - 1
                      ? "border-brand-100 border-b pb-4"
                      : ""
                  }`}
                >
                  <Code
                    basePath={props.basePath}
                    code={instance.raw}
                    filePath={instance.filePath}
                    span={instance.span}
                  />
                  <div class="flex flex-wrap gap-1">
                    <For each={instance.props}>
                      {(prop) => <PropsBadge {...prop} />}
                    </For>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Details>
      )}
    </For>
  );
};
