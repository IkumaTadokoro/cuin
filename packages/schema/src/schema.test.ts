import { safeParse } from "valibot";
import { expect, test } from "vitest";
import { JsonSchema } from "./schema";

test("parse camelCase json as Payload", () => {
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

test("parse native component without package field in instance", () => {
  const json = {
    meta: {
      basePath: "path/to/base",
    },
    components: [
      {
        id: "2",
        name: "div",
        package: {
          type: "native",
        },
        instances: [
          {
            filePath: "path/to/file.tsx",
            props: [],
            raw: "<div />",
            span: {
              start: 1,
              end: 8,
              startLine: 1,
              endLine: 1,
              startCol: 1,
              endCol: 8,
            },
            importSpecifier: null,
            resolvedPath: "path/to/file.tsx",
          },
        ],
      },
    ],
  };
  const result = safeParse(JsonSchema, json);
  expect(result.success).toBe(true);
});

test("reject invalid data", () => {
  const json = {
    meta: {
      basePath: "path/to/base",
    },
    components: [
      {
        id: "1",
        name: "Component 1",
        package: {
          type: "invalid_type",
        },
        instances: [],
      },
    ],
  };
  const result = safeParse(JsonSchema, json);
  expect(result.success).toBe(false);
});

test("parse internal component", () => {
  const json = {
    meta: {
      basePath: "/project/root",
    },
    components: [
      {
        id: "3",
        name: "Button",
        package: {
          type: "internal",
          name: "my-app",
          version: "1.0.0",
        },
        instances: [
          {
            filePath: "src/components/Button.tsx",
            props: [
              {
                key: "onClick",
                raw: "() => {}",
                propType: "arrow",
              },
            ],
            raw: '<Button onClick={() => {}} />',
            span: {
              start: 10,
              end: 40,
              startLine: 5,
              endLine: 5,
              startCol: 5,
              endCol: 35,
            },
            importSpecifier: "./Button",
            resolvedPath: "src/components/Button.tsx",
            package: {
              type: "internal",
              name: "my-app",
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
