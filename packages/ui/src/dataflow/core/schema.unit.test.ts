import { safeParse } from "valibot";
import { expect, test } from "vitest";
import { JsonSchema } from "./schema";

test("parse json as object", () => {
  const json = {
    meta: {
      base_path: "path/to/base",
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
            file_path: "path/to/component1.ts",
            props: [
              {
                key: "prop1",
                raw: "value1",
                prop_type: "string",
              },
            ],
            raw: "<Component1 prop1='value1' />",
            span: {
              start: 1,
              end: 2,
              start_line: 1,
              end_line: 1,
              start_col: 1,
              end_col: 2,
            },
            import_specifier: "Component1",
            resolved_path: "path/to/component1.ts",
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
