import { groupBy, orderBy } from "es-toolkit";
import type {
  Component as ComponentSchema,
  Instance as InstanceSchema,
  NonNative,
  Package,
  Payload as PayloadSchema,
} from "./schema";

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

export const transformComponent = (component: ComponentSchema): Component => ({
  ...component,
  instanceCount: component.instances.length,
  package: {
    key: PackageKey(component.package),
    ...component.package,
  },
});

export type PackageWithCount = Package & {
  key: PackageKey;
  count: number;
};
const derivePackageWithCount = (components: Component[]): PackageWithCount[] =>
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
