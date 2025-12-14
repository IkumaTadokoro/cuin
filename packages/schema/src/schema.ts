import {
  array,
  type InferOutput,
  literal,
  nullable,
  number,
  object,
  optional,
  string,
  union,
  variant,
} from "valibot";

const Meta = object({
  basePath: string(),
});
export type Meta = InferOutput<typeof Meta>;

const Native = object({
  type: literal("native"),
});
export type Native = InferOutput<typeof Native>;

const NonNative = object({
  type: union([literal("internal"), literal("external")]),
  name: string(),
  version: string(),
});
export type NonNative = InferOutput<typeof NonNative>;

export const Package = variant("type", [Native, NonNative]);
export type Package = InferOutput<typeof Package>;

const Props = object({
  key: string(),
  raw: string(),
  propType: string(),
  value: optional(string()),
});
export type Props = InferOutput<typeof Props>;

const Span = object({
  start: number(),
  end: number(),
  startLine: number(),
  endLine: number(),
  startCol: number(),
  endCol: number(),
});
export type Span = InferOutput<typeof Span>;

const Instance = object({
  filePath: string(),
  props: array(Props),
  raw: string(),
  span: Span,
  importSpecifier: nullable(string()),
  resolvedPath: string(),
  package: optional(Package),
});
export type Instance = InferOutput<typeof Instance>;

export const Component = object({
  id: string(),
  name: string(),
  package: Package,
  instances: array(Instance),
});
export type Component = InferOutput<typeof Component>;

export const ComponentSummary = object({
  id: string(),
  name: string(),
  package: Package,
  instanceCount: number(),
});
export type ComponentSummary = InferOutput<typeof ComponentSummary>;

export const Payload = object({
  meta: Meta,
  components: array(Component),
});
export type Payload = InferOutput<typeof Payload>;

export const Summary = object({
  meta: Meta,
  components: array(ComponentSummary),
});
export type Summary = InferOutput<typeof Summary>;
