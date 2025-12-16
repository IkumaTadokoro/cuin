import { groupBy, orderBy } from "es-toolkit";
import type {
  Component as ComponentSchema,
  ComponentSummary as ComponentSummarySchema,
  Instance as InstanceSchema,
  NonNative,
  Package,
  Payload as PayloadSchema,
  Summary as SummaryPayloadSchema,
} from "../../types/schema";

export type PackageKey =
  | `${NonNative["type"]}:${NonNative["name"]}@${NonNative["version"]}`
  | `native`;

export type MergedPackageKey =
  | `${NonNative["name"]}@${NonNative["version"]}`
  | `native`;

const PackageKey = (pkg: ComponentSchema["package"]): PackageKey =>
  pkg.type === "native"
    ? "native"
    : (`${pkg.type}:${pkg.name}@${pkg.version}` as const);

export const getMergedPackageKey = (pkg: Package): MergedPackageKey =>
  pkg.type === "native" ? "native" : (`${pkg.name}@${pkg.version}` as const);

const PACKAGE_KEY_PREFIX_REGEX = /^(internal|external):/;

export const getMergedKeyFromPackageKey = (
  key: PackageKey
): MergedPackageKey =>
  key === "native"
    ? "native"
    : (key.replace(PACKAGE_KEY_PREFIX_REGEX, "") as MergedPackageKey);

type ComponentId = ComponentSchema["id"];
type ComponentName = ComponentSchema["name"];

export type Component = {
  id: ComponentId;
  name: ComponentName;
  package: {
    key: PackageKey;
  } & Package;
  instanceCount: number;
  instances: InstanceSchema[];
};

export type TransformedComponent = Component;

export type SummaryComponent = {
  id: ComponentId;
  name: ComponentName;
  package: {
    key: PackageKey;
  } & Package;
  instanceCount: number;
};

export const transformComponent = (component: ComponentSchema): Component => ({
  ...component,
  instanceCount: component.instances.length,
  package: {
    key: PackageKey(component.package),
    ...component.package,
  },
});

export const transformSummaryComponent = (
  component: ComponentSummarySchema
): SummaryComponent => ({
  id: component.id,
  name: component.name,
  instanceCount: component.instanceCount,
  package: {
    key: PackageKey(component.package),
    ...component.package,
  },
});

export type PackageWithCount = Package & {
  key: PackageKey;
  count: number;
};

type ComponentWithPackageKey = { package: { key: PackageKey } & Package };

const derivePackageWithCount = <T extends ComponentWithPackageKey>(
  components: T[]
): PackageWithCount[] =>
  orderBy(
    Object.values(groupBy(components, (c) => c.package.key)).map((group) => ({
      ...group[0].package,
      count: group.length,
    })),
    ["type", "count"],
    ["desc", "desc"]
  );

export type TransformedPayload = {
  meta: PayloadSchema["meta"];
  components: Component[];
  packages: PackageWithCount[];
};

export const transformPayload = (
  payload: PayloadSchema
): TransformedPayload => {
  const components = payload.components.map(transformComponent);
  const packages = derivePackageWithCount(components);

  return {
    meta: payload.meta,
    components,
    packages,
  };
};

export type TransformedSummary = {
  meta: SummaryPayloadSchema["meta"];
  components: SummaryComponent[];
  packages: PackageWithCount[];
};

export const transformSummary = (
  payload: SummaryPayloadSchema
): TransformedSummary => {
  const components = payload.components.map(transformSummaryComponent);
  const packages = derivePackageWithCount(components);

  return {
    meta: payload.meta,
    components,
    packages,
  };
};
