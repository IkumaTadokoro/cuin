import { BiLogosReact as ReactIcon } from "solid-icons/bi";
import { BsThreeDots as SpreadIcon } from "solid-icons/bs";
import { TbMathFunction as FunctionIcon } from "solid-icons/tb";
import {
  VsSymbolBoolean as BooleanIcon,
  VsSymbolConstant as LiteralIcon,
  VsSymbolNamespace as MemberIcon,
  VsCaseSensitive as StringIcon,
} from "solid-icons/vs";
import { type Component, Match, Switch } from "solid-js";

type PropType =
  | "string"
  | "boolean"
  | "literal"
  | "identifier"
  | "member"
  | "call"
  | "arrow"
  | "conditional"
  | "expression"
  | "jsx"
  | "fragment"
  | "mixed"
  | "spread";

type PropsBadgeProps = {
  key: string;
  value?: string;
  raw: string;
  propType: PropType | (string & {});
};

export const PropsBadge: Component<PropsBadgeProps> = (props) => {
  const propsValue =
    props.key === "children" && props.propType !== "string"
      ? "JSXElement"
      : (props.value ?? props.raw);

  return (
    <div class="flex max-w-max items-center rounded-sm border border-brand-200 font-mono text-xs">
      <div class="flex h-full items-center rounded-l-sm border-brand-200 border-r bg-brand-50 font-semibold">
        <div class="px-1 text-brand-400">
          <Switch>
            <Match when={props.propType === "string"}>
              <StringIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "boolean"}>
              <BooleanIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "literal"}>
              <LiteralIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "identifier"}>
              <MemberIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "member"}>
              <MemberIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "call"}>
              <FunctionIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "arrow"}>
              <FunctionIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "conditional"}>
              <MemberIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "expression"}>
              <MemberIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "jsx"}>
              <ReactIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "fragment"}>
              <ReactIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "mixed"}>
              <MemberIcon class="h-4 w-4" />
            </Match>
            <Match when={props.propType === "spread"}>
              <SpreadIcon class="h-4 w-4" />
            </Match>
          </Switch>
        </div>
      </div>
      <div class="border-brand-200 border-r bg-brand-50 font-semibold">
        <div class="px-1.5 py-1">{props.key}</div>
      </div>
      <div class="rounded-r-sm bg-default-background px-2 py-1">
        {propsValue}
      </div>
    </div>
  );
};
