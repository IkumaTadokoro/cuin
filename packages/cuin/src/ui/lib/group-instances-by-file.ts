import type { Instance } from "../../types/schema";

export interface GroupedInstances {
  filePath: string;
  instances: Instance[];
}

export const groupInstancesByFile = (
  instances: Instance[]
): GroupedInstances[] => {
  const grouped = new Map<string, Instance[]>();

  for (const instance of instances) {
    const existing = grouped.get(instance.filePath);
    if (existing) {
      existing.push(instance);
    } else {
      grouped.set(instance.filePath, [instance]);
    }
  }

  const result: GroupedInstances[] = [];
  for (const [filePath, instances] of grouped) {
    result.push({ filePath, instances });
  }

  result.sort((a, b) => a.filePath.localeCompare(b.filePath));

  return result;
};
