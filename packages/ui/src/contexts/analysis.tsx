import { JsonSchema } from "@cuin/schema";
import type { Accessor } from "solid-js";
import {
  createContext,
  createResource,
  type ParentComponent,
  useContext,
} from "solid-js";
import { parse } from "valibot";
import { type TransformedPayload, transformPayload } from "~/dataflow/payload";

const DataContext = createContext<Accessor<TransformedPayload | undefined>>();

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
}

export const DataProvider: ParentComponent = (props) => {
  const [data] = createResource(async () => {
    const res = await fetch("/api/payload.json");
    const json = await res.json();
    return transformPayload(parse(JsonSchema, json));
  });

  return (
    <DataContext.Provider value={data}>{props.children}</DataContext.Provider>
  );
};
