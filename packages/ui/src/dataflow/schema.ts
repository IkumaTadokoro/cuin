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

const Native = object({
  type: literal("native"),
});
export type Native = InferOutput<typeof Native>;

const Internal = object({
  type: literal("internal"),
  name: string(),
  version: string(),
  canonicalPath: optional(string()),
});

const External = object({
  type: literal("external"),
  name: string(),
  version: string(),
});

const NonNative = union([Internal, External]);
export type NonNative = InferOutput<typeof NonNative>;

export const Package = variant("type", [Native, Internal, External]);
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
  package: Package,
});
export type Instance = InferOutput<typeof Instance>;

export const Component = object({
  id: string(),
  name: string(),
  package: Package,
  instances: array(Instance),
});
export type Component = InferOutput<typeof Component>;

export const Payload = object({
  meta: Meta,
  components: array(Component),
});
export type Payload = InferOutput<typeof Payload>;

// JsonSchema is now directly Payload (no camelCase transform needed)
export const JsonSchema = Payload;
