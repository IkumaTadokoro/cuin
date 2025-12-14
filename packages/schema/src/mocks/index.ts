import { Factory } from "fishery";
import type {
  Component,
  ComponentSummary,
  Instance,
  Meta,
  Native,
  NonNative,
  Payload,
  Props,
  Span,
  Summary,
} from "../schema";

export const MetaFactory = Factory.define<Meta>(() => ({
  basePath: "/test/path",
}));

export const SpanFactory = Factory.define<Span>(() => ({
  start: 0,
  end: 10,
  startLine: 1,
  endLine: 1,
  startCol: 0,
  endCol: 10,
}));

export const PropsFactory = Factory.define<Props>(() => ({
  key: "testProp",
  raw: "value",
  propType: "string",
  value: undefined,
}));

export const NativePackageFactory = Factory.define<Native>(() => ({
  type: "native",
}));

export const ExternalPackageFactory = Factory.define<NonNative>(() => ({
  type: "external",
  name: "test-package",
  version: "1.0.0",
}));

export const InternalPackageFactory = Factory.define<NonNative>(() => ({
  type: "internal",
  name: "internal-package",
  version: "0.0.0",
}));

export const InstanceFactory = Factory.define<Instance>(() => ({
  filePath: "test.tsx",
  props: [],
  raw: "<Component />",
  span: SpanFactory.build(),
  importSpecifier: null,
  resolvedPath: "test.tsx",
  package: undefined,
}));

export const ComponentFactory = Factory.define<Component>(({ sequence }) => ({
  id: `test-component-id-${sequence}`,
  name: "TestComponent",
  package: NativePackageFactory.build(),
  instances: [],
}));

export const ComponentSummaryFactory = Factory.define<ComponentSummary>(
  ({ sequence }) => ({
    id: `test-component-id-${sequence}`,
    name: "TestComponent",
    package: NativePackageFactory.build(),
    instanceCount: 0,
  })
);

export const PayloadFactory = Factory.define<Payload>(() => ({
  meta: MetaFactory.build(),
  components: [],
}));

export const SummaryFactory = Factory.define<Summary>(() => ({
  meta: MetaFactory.build(),
  components: [],
}));
