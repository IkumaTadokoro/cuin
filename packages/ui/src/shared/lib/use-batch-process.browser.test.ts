/** biome-ignore-all lint/style/noMagicNumbers: <explanation> */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBatchProcess } from "./use-batch-process";

describe("useBatchProcess", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    container.style.cssText = "position: fixed; top: 0; left: 0; width: 100%;";
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  const createElements = (count: number, height = 50): HTMLDivElement[] =>
    Array.from({ length: count }, (_, i) => {
      const el = document.createElement("div");
      el.style.cssText = `height: ${height}px; width: 100%;`;
      el.textContent = `Item ${i}`;
      container.appendChild(el);
      return el;
    });

  it("returns isProcessing accessor and run function", () => {
    const [isProcessing, run] = useBatchProcess({
      getItems: () => [],
    });

    expect(typeof isProcessing).toBe("function");
    expect(typeof run).toBe("function");
    expect(isProcessing()).toBe(false);
  });

  it("processes all items", async () => {
    const elements = createElements(3);
    const [, run] = useBatchProcess({
      getItems: () => elements,
    });

    const processed: HTMLElement[] = [];
    await run((item) => processed.push(item));

    expect(processed).toHaveLength(3);
    expect(new Set(processed)).toEqual(new Set(elements));
  });

  it("does nothing for empty items", async () => {
    const [, run] = useBatchProcess({
      getItems: () => [],
    });

    const callback = vi.fn();
    await run(callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("sets isProcessing to true while running", async () => {
    const elements = createElements(1);
    const [isProcessing, run] = useBatchProcess({
      getItems: () => elements,
    });

    let wasProcessing = false;
    const promise = run(() => {
      wasProcessing = isProcessing();
    });

    await promise;

    expect(wasProcessing).toBe(true);
    expect(isProcessing()).toBe(false);
  });

  it("processes items in batches across animation frames", async () => {
    const elements = createElements(5);
    const [, run] = useBatchProcess({
      getItems: () => elements,
      batchSize: 2,
    });

    const frameIds: number[] = [];
    const originalRAF = requestAnimationFrame;
    window.requestAnimationFrame = (cb) => {
      const id = originalRAF(cb);
      frameIds.push(id);
      return id;
    };

    await run(() => {});

    window.requestAnimationFrame = originalRAF;

    // 5 items / 2 batch = 3 batches = at least 3 rAF calls
    expect(frameIds.length).toBeGreaterThanOrEqual(3);
  });

  it("processes from center outward", async () => {
    // Create elements that span the viewport
    container.style.height = "100vh";
    const elements = createElements(5, window.innerHeight / 5);

    const [, run] = useBatchProcess({
      getItems: () => elements,
      batchSize: 1,
    });

    const processOrder: number[] = [];
    await run((item) => {
      processOrder.push(elements.indexOf(item));
    });

    // Center element (index 2) should be processed first
    expect(processOrder[0]).toBe(2);
  });

  it("works with Set as input", async () => {
    const elements = new Set(createElements(2));
    const [, run] = useBatchProcess({
      getItems: () => elements,
    });

    const processed: HTMLElement[] = [];
    await run((item) => processed.push(item));

    expect(processed).toHaveLength(2);
  });

  it("applies callback to each element", async () => {
    const elements = createElements(3);
    const [, run] = useBatchProcess({
      getItems: () => elements,
    });

    await run((el) => el.classList.add("processed"));

    for (const el of elements) {
      expect(el.classList.contains("processed")).toBe(true);
    }
  });

  // biome-ignore lint/suspicious/noSkippedTests: show-case
  it.skip("processes from center outward (slow for debugging)", async () => {
    container.style.height = "100vh";
    const elements = createElements(100, 10);

    elements.forEach((el, i) => {
      el.style.background = `hsl(${i * 18}, 70%, 80%)`;
      el.style.transition = "background 0.3s";
    });

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const [, run] = useBatchProcess({
      getItems: () => elements,
      batchSize: 1,
    });

    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = (cb) =>
      window.setTimeout(async () => {
        await delay(100);
        cb(performance.now());
      }, 0) as unknown as number;

    await run((el) => {
      el.style.background = "red";
    });

    window.requestAnimationFrame = originalRAF;

    await delay(2000);
  });
});
