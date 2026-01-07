import type { Accessor, Resource } from "solid-js";
import {
  createContext,
  createEffect,
  createResource,
  type ParentComponent,
  useContext,
} from "solid-js";
import {
  type TransformedComponent,
  type TransformedSummary,
  transformComponent,
  transformSummary,
} from "~/dataflow/payload";
import type { Component, Meta, Summary } from "../../types/schema";
import { useAnalysisEvents } from "./events";

const SummaryDataContext =
  createContext<Accessor<TransformedSummary | undefined>>();

export function useSummaryData() {
  const context = useContext(SummaryDataContext);
  if (!context) {
    throw new Error("useSummaryData must be used within SummaryDataProvider");
  }
  return context;
}

export const SummaryDataProvider: ParentComponent = (props) => {
  const [data, { refetch }] = createResource(async () => {
    const res = await fetch("/api/summary.json");
    const json = await res.json();
    return transformSummary(json as Summary);
  });

  const { lastEvent } = useAnalysisEvents();

  createEffect(() => {
    const event = lastEvent();
    if (event?.type === "analysis-complete") {
      refetch();
    }
  });

  return (
    <SummaryDataContext.Provider value={data}>
      {props.children}
    </SummaryDataContext.Provider>
  );
};

export function useComponentDetail(
  id: Accessor<string>
): Resource<TransformedComponent | undefined> {
  const [component, { refetch }] = createResource(id, async (componentId) => {
    const res = await fetch(`/api/components/${componentId}.json`);
    if (!res.ok) {
      return;
    }
    const json = await res.json();
    return transformComponent(json as Component);
  });

  const { lastEvent } = useAnalysisEvents();

  createEffect(() => {
    const event = lastEvent();
    if (event?.type === "analysis-complete") {
      refetch();
    }
  });

  return component;
}

const MetaDataContext = createContext<Accessor<Meta | undefined>>();

export function useMetaData() {
  const context = useContext(MetaDataContext);
  if (!context) {
    throw new Error("useMetaData must be used within MetaDataProvider");
  }
  return context;
}

export const MetaDataProvider: ParentComponent = (props) => {
  const [data, { refetch }] = createResource(async () => {
    const res = await fetch("/api/meta.json");
    const json: Meta = await res.json();
    return json;
  });

  const { lastEvent } = useAnalysisEvents();

  createEffect(() => {
    const event = lastEvent();
    if (event?.type === "analysis-complete") {
      refetch();
    }
  });

  return (
    <MetaDataContext.Provider value={data}>
      {props.children}
    </MetaDataContext.Provider>
  );
};
