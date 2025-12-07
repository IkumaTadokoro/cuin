import { safeParse } from "valibot";
import { expect, test } from "vitest";
import { JsonSchema } from "./schema";

test("parse json as object", () => {
  const json = {
    meta: {
      basePath: "path/to/base",
    },
    components: [
      {
        id: "1",
        name: "Component 1",
        package: {
          type: "native",
        },
        instances: [
          {
            filePath: "path/to/component1.ts",
            props: [
              {
                key: "prop1",
                raw: "value1",
                propType: "string",
              },
            ],
            raw: "<Component1 prop1='value1' />",
            span: {
              start: 1,
              end: 2,
              startLine: 1,
              endLine: 1,
              startCol: 1,
              endCol: 2,
            },
            importSpecifier: "Component1",
            resolvedPath: "path/to/component1.ts",
            package: {
              type: "external",
              name: "ui",
              version: "1.0.0",
            },
          },
        ],
      },
    ],
  };
  const result = safeParse(JsonSchema, json);
  expect(result.success).toBe(true);
});
