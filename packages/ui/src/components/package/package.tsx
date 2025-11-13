import { cva, type VariantProps } from "class-variance-authority";
import {
  BiLogosHtml5 as Html5Icon,
  BiRegularPackage as PackageIcon,
} from "solid-icons/bi";
import type { Component } from "solid-js";
import type { Package as PackageSchema } from "../../dataflow/core/schema";

const baseVariants = cva(
  "grid grid-cols-[max-content_1fr] items-center truncate font-mono",
  {
    variants: {
      size: {
        xs: "gap-1 text-xs",
        sm: "gap-2 text-sm",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
);

const iconVariants = cva("", {
  variants: {
    size: {
      xs: "text-lg",
      sm: "text-xl",
    },
    kind: {
      internal: "text-amber-700",
      external: "text-brand-500",
      native: "text-orange-700",
    },
  },
  defaultVariants: {
    size: "xs",
  },
});

type Props = PackageSchema & VariantProps<typeof baseVariants>;

export const Package: Component<Props> = (props) => (
  <div class={baseVariants({ size: props.size })}>
    {props.type === "native" ? (
      <Html5Icon class={iconVariants({ size: props.size, kind: props.type })} />
    ) : (
      <PackageIcon
        class={iconVariants({ size: props.size, kind: props.type })}
      />
    )}
    <div class="flex items-center gap-1">
      {props.type === "native" && <p>native</p>}

      {(props.type === "internal" || props.type === "external") && (
        <>
          <p>{props.name}</p>
          <p class="text-brand-400">[{props.version}]</p>
        </>
      )}
    </div>
  </div>
);
