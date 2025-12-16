import { flatMap, sum, uniq } from "es-toolkit";
import type { Instance } from "../../../types/schema";

export const NO_VALUE = "(no value)" as const;

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

export type PropCounts = Map<string, Map<string, number>>;

const collectAllPropKeys = (instances: Instance[]): string[] =>
  uniq(flatMap(instances, (instance) => instance.props.map((p) => p.key)));

const incrementCount = (
  counts: PropCounts,
  propKey: string,
  value: string
): PropCounts => {
  const valueMap = counts.get(propKey) ?? new Map<string, number>();
  valueMap.set(value, (valueMap.get(value) ?? 0) + 1);
  counts.set(propKey, valueMap);
  return counts;
};

const countInstanceProps = (
  counts: PropCounts,
  instance: Instance,
  allPropKeys: string[]
): PropCounts => {
  const instancePropKeys = new Set(instance.props.map((p) => p.key));

  const countsWithProps = instance.props.reduce(
    (acc, prop) => incrementCount(acc, prop.key, prop.raw),
    counts
  );

  return allPropKeys
    .filter((key) => !instancePropKeys.has(key))
    .reduce((acc, key) => incrementCount(acc, key, NO_VALUE), countsWithProps);
};

const countPropValues = (
  instances: Instance[],
  allPropKeys: string[]
): PropCounts =>
  instances.reduce(
    (counts, instance) => countInstanceProps(counts, instance, allPropKeys),
    new Map<string, Map<string, number>>()
  );

const PERCENTAGE_MULTIPLIER = 100;

const toPercentage = (count: number, total: number): number =>
  total === 0 ? 0 : (count / total) * PERCENTAGE_MULTIPLIER;

const createValueDistributions = (
  valueMap: Map<string, number>,
  totalCount: number
): PropValueDistribution[] =>
  Array.from(valueMap.entries())
    .map(([value, count]) => ({
      value,
      count,
      percentage: toPercentage(count, totalCount),
    }))
    .sort((a, b) => b.count - a.count);

const toPropAnalysis = (
  key: string,
  valueMap: Map<string, number>,
  instanceCount: number
): PropAnalysis => {
  const noValueCount = valueMap.get(NO_VALUE) ?? 0;
  const totalCount = sum(Array.from(valueMap.values()));

  return {
    key,
    totalCount,
    totalPercentage: toPercentage(totalCount, instanceCount),
    values: createValueDistributions(valueMap, totalCount),
    hasNoValue: noValueCount > 0,
    noValueCount,
  };
};

export const analyzeProps = (instances: Instance[]): PropAnalysis[] => {
  const propKeys = collectAllPropKeys(instances);
  const counts = countPropValues(instances, propKeys);

  return Array.from(counts.entries())
    .map(([key, valueMap]) => toPropAnalysis(key, valueMap, instances.length))
    .sort((a, b) => b.totalCount - a.totalCount);
};

export const countFilteredProps = (
  allInstances: Instance[],
  filteredInstances: Instance[]
): PropCounts => {
  const propKeys = collectAllPropKeys(allInstances);
  return countPropValues(filteredInstances, propKeys);
};
