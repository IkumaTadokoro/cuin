import { render } from "@solidjs/testing-library";
import { expect, test } from "vitest";
import type { Package as PackageSchema } from "../../dataflow/core/schema";
import { Package } from "./package";

const VERSION_0_1_0 = /0.1.0/;
const VERSION_1_2_0 = /1.2.0/;

test("With native Element, show 'native' only", () => {
  const { getByText } = render(() => <Package type="native" />);
  expect(getByText("native")).toBeInTheDocument();
});

test("With external Package, show package name and version", () => {
  const identity = {
    type: "external",
    name: "ExternalPackage",
    version: "0.1.0",
  } as const satisfies PackageSchema;
  const { getByText } = render(() => <Package {...identity} />);
  expect(getByText("ExternalPackage")).toBeInTheDocument();
  expect(getByText(VERSION_0_1_0)).toBeInTheDocument();
});

test("With internal Package, show package name and version", () => {
  const identity = {
    type: "internal",
    name: "InternalPackage",
    version: "1.2.0",
  } as const satisfies PackageSchema;
  const { getByText } = render(() => <Package {...identity} />);
  expect(getByText("InternalPackage")).toBeInTheDocument();
  expect(getByText(VERSION_1_2_0)).toBeInTheDocument();
});
