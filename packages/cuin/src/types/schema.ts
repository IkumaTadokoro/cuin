export type Meta = {
  basePath: string;
};

export type Native = {
  type: "native";
};

export type NonNative = {
  type: "internal" | "external";
  name: string;
  version: string;
};

export type Package = Native | NonNative;

export type Props = {
  key: string;
  raw: string;
  propType: string;
  value?: string;
};

export type Span = {
  start: number;
  end: number;
  startLine: number;
  endLine: number;
  startCol: number;
  endCol: number;
};

export type Instance = {
  filePath: string;
  props: Props[];
  raw: string;
  span: Span;
  importSpecifier: string | null;
  resolvedPath: string;
  package?: Package;
};

export type Component = {
  id: string;
  name: string;
  package: Package;
  instances: Instance[];
};

export type ComponentSummary = {
  id: string;
  name: string;
  package: Package;
  instanceCount: number;
  usedInPackages: Package[];
  instanceCountByPackage: Record<string, number>;
};

export type Payload = {
  meta: Meta;
  components: Component[];
};

export type Summary = {
  meta: Meta;
  components: ComponentSummary[];
};
