import type { Instance } from "~/dataflow/core/schema";

export type PropValueDistribution = {
  value: string;
  count: number;
  percentage: number;
};

export type PropAnalysis = {
  key: string;
  totalCount: number;
  totalPercentage: number;
  values: PropValueDistribution[];
  hasNoValue: boolean;
  noValueCount: number;
};

const PERCENTAGE_MULTIPLIER = 100;

function addInstanceProps(
  instance: Instance,
  propsMap: Map<string, Map<string, number>>
) {
  for (const prop of instance.props) {
    if (!propsMap.has(prop.key)) {
      propsMap.set(prop.key, new Map());
    }

    const valueMap = propsMap.get(prop.key);
    if (valueMap) {
      const value = prop.raw;
      valueMap.set(value, (valueMap.get(value) || 0) + 1);
    }
  }
}

function updateMissingPropsCount(
  instancePropKeys: Set<string>,
  propsMap: Map<string, Map<string, number>>,
  propsWithoutValueCount: Map<string, number>
) {
  for (const [key] of propsMap) {
    if (!instancePropKeys.has(key)) {
      propsWithoutValueCount.set(
        key,
        (propsWithoutValueCount.get(key) || 0) + 1
      );
    }
  }
}

function buildPropsMaps(instances: Instance[]) {
  const propsMap = new Map<string, Map<string, number>>();
  const propsWithoutValueCount = new Map<string, number>();

  for (const instance of instances) {
    const instancePropKeys = new Set(instance.props.map((p) => p.key));
    addInstanceProps(instance, propsMap);
    updateMissingPropsCount(instancePropKeys, propsMap, propsWithoutValueCount);
  }

  return { propsMap, propsWithoutValueCount };
}

function createPropAnalysis(
  key: string,
  valueMap: Map<string, number>,
  noValueCount: number,
  instancesLength: number
): PropAnalysis {
  const totalCount = Array.from(valueMap.values()).reduce(
    (sum, count) => sum + count,
    0
  );

  const values: PropValueDistribution[] = Array.from(valueMap.entries())
    .map(([value, count]) => ({
      value,
      count,
      percentage: (count / totalCount) * PERCENTAGE_MULTIPLIER,
    }))
    .sort((a, b) => b.count - a.count);

  if (noValueCount > 0) {
    values.push({
      value: "(no value)",
      count: noValueCount,
      percentage:
        (noValueCount / (totalCount + noValueCount)) * PERCENTAGE_MULTIPLIER,
    });
  }

  return {
    key,
    totalCount: totalCount + noValueCount,
    totalPercentage:
      ((totalCount + noValueCount) / instancesLength) * PERCENTAGE_MULTIPLIER,
    values,
    hasNoValue: noValueCount > 0,
    noValueCount,
  };
}

export function analyzeProps(instances: Instance[]): PropAnalysis[] {
  const { propsMap, propsWithoutValueCount } = buildPropsMaps(instances);
  const analysis: PropAnalysis[] = [];

  for (const [key, valueMap] of propsMap.entries()) {
    const noValueCount = propsWithoutValueCount.get(key) || 0;
    analysis.push(
      createPropAnalysis(key, valueMap, noValueCount, instances.length)
    );
  }

  return analysis.sort((a, b) => b.totalCount - a.totalCount);
}

export function analyzePropsWithFilter(
  allInstances: Instance[],
  filteredInstances: Instance[]
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();

  const allPropKeys = new Set<string>();
  for (const instance of allInstances) {
    for (const prop of instance.props) {
      allPropKeys.add(prop.key);
    }
  }

  for (const key of allPropKeys) {
    const valueMap = new Map<string, number>();

    for (const instance of filteredInstances) {
      const prop = instance.props.find((p) => p.key === key);
      if (prop) {
        valueMap.set(prop.raw, (valueMap.get(prop.raw) || 0) + 1);
      } else {
        valueMap.set("(no value)", (valueMap.get("(no value)") || 0) + 1);
      }
    }

    result.set(key, valueMap);
  }

  return result;
}
