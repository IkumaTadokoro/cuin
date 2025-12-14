import {
  ComponentFactory,
  InstanceFactory,
  MetaFactory,
  PayloadFactory,
  PropsFactory,
} from "@cuin/schema/mocks";
import { analyze } from "@ikuma-t/cuin-analyzer";
import { describe, expect, it, vi } from "vitest";
import { getAnalysis, getAnalysisAsJson } from "./analyze";

vi.mock("@ikuma-t/cuin-analyzer");

describe("getAnalysis", () => {
  it("should validate camelCase JSON from analyzer", async () => {
    const payload = PayloadFactory.build({
      components: [
        ComponentFactory.build({
          name: "TestComponent",
          instances: [
            InstanceFactory.build({
              filePath: "test.tsx",
              props: [
                PropsFactory.build({
                  key: "testProp",
                  raw: "value",
                  propType: "string",
                }),
              ],
              raw: "<TestComponent testProp='value' />",
            }),
          ],
        }),
      ],
    });

    vi.mocked(analyze).mockResolvedValue(JSON.stringify(payload));

    const result = await getAnalysis("/test/path");

    expect(result.meta.basePath).toBe("/test/path");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].name).toBe("TestComponent");
    expect(result.components[0].instances[0].filePath).toBe("test.tsx");
    expect(result.components[0].instances[0].span.startLine).toBe(1);
    expect(result.components[0].instances[0].props[0].propType).toBe("string");
  });

  it("should handle optional package field in instance", async () => {
    const payload = PayloadFactory.build({
      meta: MetaFactory.build({ basePath: "/test/path" }),
      components: [
        ComponentFactory.build({
          id: "div-id",
          name: "div",
          instances: [
            InstanceFactory.build({
              raw: "<div />",
              span: {
                start: 0,
                end: 7,
                startLine: 1,
                endLine: 1,
                startCol: 0,
                endCol: 7,
              },
            }),
          ],
        }),
      ],
    });

    vi.mocked(analyze).mockResolvedValue(JSON.stringify(payload));

    const result = await getAnalysis("/test/path");

    expect(result.components[0].instances[0].package).toBeUndefined();
  });

  it("should throw validation error for invalid data", async () => {
    const invalidResult = JSON.stringify({
      meta: { basePath: "/test/path" },
      components: [
        {
          id: "test-id",
          name: "TestComponent",
          package: { type: "invalid_type" },
          instances: [],
        },
      ],
    });

    vi.mocked(analyze).mockResolvedValue(invalidResult);

    await expect(getAnalysis("/test/path")).rejects.toThrow();
  });
});

describe("getAnalysisAsJson", () => {
  it("should return pretty printed JSON string", async () => {
    const payload = PayloadFactory.build();

    vi.mocked(analyze).mockResolvedValue(JSON.stringify(payload));

    const result = await getAnalysisAsJson("/test/path");

    expect(result).toContain("{\n");
    expect(result).toContain("  ");
    expect(result).toContain("basePath");
  });
});
