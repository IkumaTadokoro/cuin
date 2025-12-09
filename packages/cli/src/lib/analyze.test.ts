import { analyze } from "cuin-analyzer";
import { describe, expect, it, vi } from "vitest";
import { getAnalysis, getAnalysisAsJson } from "./analyze";

vi.mock("cuin-analyzer");

describe("getAnalysis", () => {
  it("should camelize and validate snake_case JSON from analyzer", () => {
    const snakeCaseResult = JSON.stringify({
      meta: {
        base_path: "/test/path",
      },
      components: [
        {
          id: "test-id",
          name: "TestComponent",
          package: {
            type: "native",
          },
          instances: [
            {
              file_path: "test.tsx",
              props: [
                {
                  key: "testProp",
                  raw: "value",
                  prop_type: "string",
                },
              ],
              raw: "<TestComponent testProp='value' />",
              span: {
                start: 0,
                end: 10,
                start_line: 1,
                end_line: 1,
                start_col: 0,
                end_col: 10,
              },
              import_specifier: null,
              resolved_path: "test.tsx",
            },
          ],
        },
      ],
    });

    vi.mocked(analyze).mockReturnValue(snakeCaseResult);

    const result = getAnalysis("/test/path");

    expect(result.meta.basePath).toBe("/test/path");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("TestComponent");
    expect(result.components[0].instances[0].filePath).toBe("test.tsx");
    expect(result.components[0].instances[0].span.startLine).toBe(1);
    expect(result.components[0].instances[0].props[0].propType).toBe("string");
  });

  it("should handle optional package field in instance", () => {
    const snakeCaseResult = JSON.stringify({
      meta: {
        base_path: "/test/path",
      },
      components: [
        {
          id: "div-id",
          name: "div",
          package: {
            type: "native",
          },
          instances: [
            {
              file_path: "test.tsx",
              props: [],
              raw: "<div />",
              span: {
                start: 0,
                end: 7,
                start_line: 1,
                end_line: 1,
                start_col: 0,
                end_col: 7,
              },
              import_specifier: null,
              resolved_path: "test.tsx",
            },
          ],
        },
      ],
    });

    vi.mocked(analyze).mockReturnValue(snakeCaseResult);

    const result = getAnalysis("/test/path");

    expect(result.components[0].instances[0].package).toBeUndefined();
  });

  it("should throw validation error for invalid data", () => {
    const invalidResult = JSON.stringify({
      meta: {
        base_path: "/test/path",
      },
      components: [
        {
          id: "test-id",
          name: "TestComponent",
          package: {
            type: "invalid_type",
          },
          instances: [],
        },
      ],
    });

    vi.mocked(analyze).mockReturnValue(invalidResult);

    expect(() => getAnalysis("/test/path")).toThrow();
  });
});

describe("getAnalysisAsJson", () => {
  it("should return pretty printed JSON string", () => {
    const snakeCaseResult = JSON.stringify({
      meta: {
        base_path: "/test/path",
      },
      components: [],
    });

    vi.mocked(analyze).mockReturnValue(snakeCaseResult);

    const result = getAnalysisAsJson("/test/path");

    expect(result).toContain("{\n");
    expect(result).toContain("  ");
    expect(result).toContain("basePath");

    const parsed = JSON.parse(result);
    expect(parsed.meta.basePath).toBe("/test/path");
  });
});
