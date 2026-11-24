import { describe, expect, it } from "vitest";

import { isChunkLoadError, shouldReloadForChunkError, withTimeout } from "@/lib/resilience";

describe("withTimeout", () => {
  it("resolves with the value when the promise settles in time", async () => {
    await expect(withTimeout(Promise.resolve(42), 50, "اختبار")).resolves.toBe(42);
  });

  it("rejects when the promise never settles", async () => {
    await expect(withTimeout(new Promise(() => {}), 10, "معلقة")).rejects.toThrow("معلقة");
  });

  it("passes the original rejection through", async () => {
    await expect(withTimeout(Promise.reject(new Error("boom")), 50, "اختبار")).rejects.toThrow("boom");
  });
});

describe("isChunkLoadError", () => {
  it("matches the browsers' dynamic-import failure messages", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: https://x/a.js"))).toBe(true);
    expect(isChunkLoadError(new Error("error loading dynamically imported module"))).toBe(true);
    expect(isChunkLoadError(new Error("Importing a module script failed."))).toBe(true);
    expect(isChunkLoadError(Object.assign(new Error("nope"), { name: "ChunkLoadError" }))).toBe(true);
  });

  it("ignores ordinary errors", () => {
    expect(isChunkLoadError(new TypeError("l is not a function"))).toBe(false);
    expect(isChunkLoadError(new Error("خدمة المساعد غير مُفعّلة حالياً"))).toBe(false);
    expect(isChunkLoadError("plain string")).toBe(false);
  });
});

describe("shouldReloadForChunkError", () => {
  it("reloads the first chunk failure", () => {
    expect(shouldReloadForChunkError(new TypeError("Failed to fetch dynamically imported module"), null, 1_000)).toBe(true);
  });

  it("suppresses a second failure inside the cooldown", () => {
    expect(shouldReloadForChunkError(new TypeError("Failed to fetch dynamically imported module"), 1_000, 30_000)).toBe(false);
  });

  it("reloads again after the cooldown", () => {
    expect(shouldReloadForChunkError(new TypeError("Failed to fetch dynamically imported module"), 1_000, 120_000)).toBe(true);
  });

  it("never reloads for other errors", () => {
    expect(shouldReloadForChunkError(new Error("وحش"), null, 1_000)).toBe(false);
  });
});
