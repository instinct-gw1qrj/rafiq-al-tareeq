import { describe, expect, it } from "vitest";
import { qiblaBearing } from "@/lib/qibla";

describe("qibla bearing", () => {
  it("from Cairo is about 136° clockwise from north", () => {
    const b = qiblaBearing(30.0444, 31.2357);
    expect(b).toBeGreaterThan(134);
    expect(b).toBeLessThan(138);
  });

  it("from Aswan swings further south (smaller bearing) than from Cairo", () => {
    expect(qiblaBearing(24.0889, 32.8998)).toBeLessThan(qiblaBearing(30.0444, 31.2357));
  });
});
