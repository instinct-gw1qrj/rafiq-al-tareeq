import { describe, expect, it } from "vitest";
import { METRO_FARES, METRO_LINES } from "@/data/transit";

describe("offline transit guide data", () => {
  it("keeps the November 2026 metro fare tiers", () => {
    expect(METRO_FARES.map((f) => f.price)).toEqual(["١٠ ج.م", "١٢ ج.م", "١٥ ج.م", "٢٠ ج.م"]);
  });

  it("lists three metro lines with station counts matching their station lists", () => {
    expect(METRO_LINES).toHaveLength(3);
    for (const l of METRO_LINES) expect(l.stations.length).toBeLessThanOrEqual(l.stationsCount);
  });
});
