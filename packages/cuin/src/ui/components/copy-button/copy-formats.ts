import type { Instance, Package } from "../../../types/schema";

export type ComponentInfo = {
  name: string;
  package: Package;
};

const formatPackage = (pkg: Package | undefined): string => {
  if (!pkg) {
    return "(no package)";
  }
  if (pkg.type === "native") {
    return "native";
  }
  return `${pkg.name}@${pkg.version}`;
};

const formatComponentPackage = (pkg: Package): string => {
  if (pkg.type === "native") {
    return "native";
  }
  return `${pkg.name}[${pkg.version}]`;
};

const groupByPackage = (instances: Instance[]): Map<string, Instance[]> => {
  const groups = new Map<string, Instance[]>();
  for (const instance of instances) {
    const key = formatPackage(instance.package);
    const group = groups.get(key) ?? [];
    group.push(instance);
    groups.set(key, group);
  }
  return groups;
};

export const formatAsMarkdown = (
  instances: Instance[],
  component: ComponentInfo
): string => {
  const lines: string[] = [];

  lines.push(
    `# ${component.name} (${formatComponentPackage(component.package)})`
  );
  lines.push("");
  lines.push("## Usage Summary");
  lines.push("");
  lines.push(`${instances.length} usages`);
  lines.push("");

  const grouped = groupByPackage(instances);
  for (const [pkgName, pkgInstances] of grouped) {
    lines.push(`### ${pkgName} (${pkgInstances.length} usages)`);
    lines.push("");
    for (const instance of pkgInstances) {
      lines.push(
        `- ${instance.filePath}:${instance.span.startLine}:${instance.span.startCol}`
      );
    }
    lines.push("");
  }

  lines.push("## Usage Details");
  lines.push("");

  for (const [pkgName, pkgInstances] of grouped) {
    lines.push(`### ${pkgName} (${pkgInstances.length} usages)`);
    lines.push("");
    for (const instance of pkgInstances) {
      lines.push(
        `#### ${instance.filePath}:${instance.span.startLine}:${instance.span.startCol}`
      );
      lines.push("");
      lines.push("```tsx");
      lines.push(instance.raw);
      lines.push("```");
      lines.push("");
    }
  }

  return lines.join("\n");
};
