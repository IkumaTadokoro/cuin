/** biome-ignore-all lint/style/noMagicNumbers: test */
import { createRoot } from "solid-js";
import { describe, expect, it } from "vitest";
import { createProcessing } from "./create-processing";

describe("createProcessing", () => {
  it("should start processing with a synchronous function", async () => {
    await createRoot(async () => {
      const [isProcessing, startProcessing] = createProcessing();
      const states: boolean[] = [];

      const result = await startProcessing(() => {
        states.push(isProcessing());
        return 42;
      });

      expect(result).toBe(42);
      expect(states).toEqual([true]);
      expect(isProcessing()).toBe(false);
    });
  });

  it("should start processing with an asynchronous function", async () => {
    await createRoot(async () => {
      const [isProcessing, startProcessing] = createProcessing();

      const promise = startProcessing(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "done";
      });

      expect(isProcessing()).toBe(true);
      expect(await promise).toBe("done");
      expect(isProcessing()).toBe(false);
    });
  });

  it("should reset isProcessing to false when an error occurs", async () => {
    await createRoot(async () => {
      const [isProcessing, startProcessing] = createProcessing();
      const error = new Error("test error");

      await expect(
        startProcessing(() => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(isProcessing()).toBe(false);
    });
  });

  it("should reset isProcessing to false when an error occurs in an async function", async () => {
    await createRoot(async () => {
      const [isProcessing, startProcessing] = createProcessing();
      const error = new Error("async error");

      await expect(
        startProcessing(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw error;
        })
      ).rejects.toThrow(error);
      expect(isProcessing()).toBe(false);
    });
  });
});
