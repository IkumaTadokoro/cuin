import { describe, expect, it } from "vitest";
import type { Instance } from "../../../types/schema";
import { type ComponentInfo, formatAsMarkdown } from "./copy-formats";

const createInstance = (overrides: Partial<Instance> = {}): Instance => ({
  filePath: "src/components/Button.tsx",
  props: [],
  raw: "<Button />",
  span: {
    start: 0,
    end: 10,
    startLine: 10,
    endLine: 10,
    startCol: 5,
    endCol: 15,
  },
  importSpecifier: null,
  resolvedPath: "",
  ...overrides,
});

const createComponent = (
  overrides: Partial<ComponentInfo> = {}
): ComponentInfo => ({
  name: "Button",
  package: { type: "external", name: "@ark-ui/solid", version: "2.0.0" },
  ...overrides,
});

describe("formatAsMarkdown", () => {
  it("詳細なMarkdown形式にフォーマット", () => {
    const instances: Instance[] = [
      createInstance({
        filePath: "src/App.tsx",
        raw: '<Button variant="primary" />',
        span: {
          start: 0,
          end: 10,
          startLine: 23,
          endLine: 23,
          startCol: 5,
          endCol: 15,
        },
        package: { type: "external", name: "@ark-ui/solid", version: "2.0.0" },
      }),
    ];

    const result = formatAsMarkdown(instances, createComponent());

    expect(result).toContain("# Button (@ark-ui/solid[2.0.0])");
    expect(result).toContain("## Usage Summary");
    expect(result).toContain("1 usages");
    expect(result).toContain("### @ark-ui/solid@2.0.0 (1 usages)");
    expect(result).toContain("- src/App.tsx:23:5");
    expect(result).toContain("## Usage Details");
    expect(result).toContain("#### src/App.tsx:23:5");
    expect(result).toContain("```tsx");
    expect(result).toContain('<Button variant="primary" />');
    expect(result).toContain("```");
  });

  it("パッケージ別にグループ化される", () => {
    const instances: Instance[] = [
      createInstance({
        filePath: "src/App.tsx",
        package: { type: "external", name: "@ark-ui/solid", version: "2.0.0" },
      }),
      createInstance({
        filePath: "src/Header.tsx",
        package: { type: "internal", name: "my-lib", version: "1.0.0" },
      }),
      createInstance({
        filePath: "src/Footer.tsx",
        package: { type: "external", name: "@ark-ui/solid", version: "2.0.0" },
      }),
    ];

    const result = formatAsMarkdown(instances, createComponent());

    expect(result).toContain("### @ark-ui/solid@2.0.0 (2 usages)");
    expect(result).toContain("### my-lib@1.0.0 (1 usages)");
  });

  it("nativeパッケージの場合", () => {
    const instances: Instance[] = [
      createInstance({
        package: { type: "native" },
      }),
    ];

    const result = formatAsMarkdown(
      instances,
      createComponent({ package: { type: "native" } })
    );

    expect(result).toContain("# Button (native)");
    expect(result).toContain("### native (1 usages)");
  });

  it("パッケージがない場合は(no package)と表示", () => {
    const instances: Instance[] = [
      createInstance({
        package: undefined,
      }),
    ];

    const result = formatAsMarkdown(instances, createComponent());

    expect(result).toContain("### (no package) (1 usages)");
  });

  it("空のインスタンス配列の場合", () => {
    const result = formatAsMarkdown([], createComponent({ name: "Empty" }));

    expect(result).toContain("# Empty (@ark-ui/solid[2.0.0])");
    expect(result).toContain("0 usages");
  });
});
