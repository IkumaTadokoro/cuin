/** biome-ignore-all lint/style/noMagicNumbers: test-assertion */

import { describe, expect, it } from "vitest";
import {
  ComponentFactory,
  ExternalPackageFactory,
  InstanceFactory,
  NativePackageFactory,
  PayloadFactory,
  SummaryFactory,
} from "../../types/mocks";
import { createApp } from "./app";
import type { AnalysisStore } from "./store/analysis-store";
import type { Container } from "./store/container";
import type { StaticAssetStore } from "./store/static-asset-store";

const createMockAnalysisStore = (
  payload = PayloadFactory.build(),
  summary = SummaryFactory.build()
): AnalysisStore => {
  const components = new Map(payload.components.map((c) => [c.id, c]));

  return {
    getAnalysis: () => payload,
    getSummary: () => summary,
    getMeta: () => payload.meta,
    getComponent: (id) => components.get(id),
  };
};

const createMockStaticAssetStore = (): StaticAssetStore => ({
  getContents: (_id: string) => Promise.resolve(undefined),
  getMeta: (_id: string) => Promise.resolve(undefined),
});

const createMockContainer = (payload = PayloadFactory.build()): Container => ({
  analysisStore: createMockAnalysisStore(payload),
  staticAssetStore: createMockStaticAssetStore(),
});

describe("createApp", () => {
  describe("GET /api/payload.json", () => {
    it("should return payload", async () => {
      const container = createMockContainer();
      const app = await createApp({ container });

      const res = await app.request("/api/payload.json");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toHaveProperty("meta");
      expect(json).toHaveProperty("components");
    });
  });

  describe("GET /api/summary.json", () => {
    it("should return summary with instance counts", async () => {
      const container = createMockContainer();
      const app = await createApp({ container });

      const res = await app.request("/api/summary.json");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        meta: {
          basePath: expect.any(String),
        },
        components: [
          {
            id: expect.any(String),
            name: expect.any(String),
            package: expect.anything(),
            instanceCount: expect.any(Number),
          },
        ],
      });
    });
  });

  describe("GET /api/meta.json", () => {
    it("should return meta with basePath", async () => {
      const container = createMockContainer();
      const app = await createApp({ container });

      const res = await app.request("/api/meta.json");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        basePath: expect.any(String),
      });
    });
  });

  describe("GET /api/components/:id.json", () => {
    it("should return component by id", async () => {
      const container = createMockContainer(
        PayloadFactory.build({
          components: [ComponentFactory.build({ id: "1" })],
        })
      );
      const app = await createApp({ container });

      const res = await app.request("/api/components/1.json");
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toMatchObject({
        id: "1",
        name: expect.any(String),
        package: expect.anything(),
        instances: expect.any(Array),
      });
    });

    it("should return 404 for non-existent component", async () => {
      const container = createMockContainer();
      const app = await createApp({ container });

      const res = await app.request("/api/components/non-existent.json");

      expect(res.status).toBe(404);
    });

    it("should return instances sorted by package name then file path", async () => {
      const instances = [
        InstanceFactory.build({
          filePath: "z-file.tsx",
          package: ExternalPackageFactory.build({ name: "b-package" }),
        }),
        InstanceFactory.build({
          filePath: "a-file.tsx",
          package: ExternalPackageFactory.build({ name: "b-package" }),
        }),
        InstanceFactory.build({
          filePath: "m-file.tsx",
          package: ExternalPackageFactory.build({ name: "a-package" }),
        }),
        InstanceFactory.build({
          filePath: "native.tsx",
          package: NativePackageFactory.build(),
        }),
      ];

      const container = createMockContainer(
        PayloadFactory.build({
          components: [ComponentFactory.build({ id: "1", instances })],
        })
      );
      const app = await createApp({ container });

      const res = await app.request("/api/components/1.json");
      const json = await res.json();

      expect(json.instances[0].filePath).toBe("native.tsx");
      expect(json.instances[1].filePath).toBe("m-file.tsx");
      expect(json.instances[2].filePath).toBe("a-file.tsx");
      expect(json.instances[3].filePath).toBe("z-file.tsx");
    });
  });
});
