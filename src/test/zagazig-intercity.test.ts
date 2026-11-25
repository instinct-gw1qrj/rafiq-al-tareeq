import { describe, expect, it } from "vitest";
import { mergeBuiltInRoutes, refreshRevisedBuiltIns, routeHasFare, routeTotal, searchRoutes, SEED_ROUTES, ZAGAZIG_INTERCITY_ROUTES, ZAGD_OLD_STAMP, applySuggestion } from "@/lib/transport";

describe("Zagazig microbus lines (line + stop only, no prices)", () => {
  it("records no fare anywhere in the new entries", () => {
    expect(ZAGAZIG_INTERCITY_ROUTES).toHaveLength(27);
    for (const r of ZAGAZIG_INTERCITY_ROUTES) {
      expect(r.source).toBe("documented");
      expect(r.stages).toHaveLength(1);
      expect(r.stages[0]!.noFare).toBe(true);
      expect(routeHasFare(r)).toBe(false);
      expect(routeTotal(r)).toBe(0);
      // no price in any text of the entry
      const text = [r.station, r.from, r.to, ...r.notes, r.stages[0]!.note ?? ""].join(" ");
      expect(text).not.toMatch(/\d+\s*(جنيه|ج\.م)|(\d|[٠-٩])+\s*جنيه/);
    }
  });

  it("keeps the pre-existing entries priced", () => {
    expect(routeHasFare(SEED_ROUTES.find((r) => r.id === "r1")!)).toBe(true);
    expect(routeTotal(SEED_ROUTES.find((r) => r.id === "zag1")!)).toBe(5);
  });

  it("keeps stops and ids", () => {
    expect(new Set(SEED_ROUTES.map((r) => r.id)).size).toBe(SEED_ROUTES.length);
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "بنها")!.station).toContain("الأحرار");
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "فاقوس")!.station).toContain("الزراعة");
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "المنصورة")!.notes.join(" ")).toContain("مش منشور رسمياً");
  });

  it("replaces the first release (with fares) on devices that stored it, and leaves edited routes alone", () => {
    const old = ZAGAZIG_INTERCITY_ROUTES.map((r) => ({ ...r, updatedAt: ZAGD_OLD_STAMP, stages: r.stages.map((s) => ({ id: s.id, from: s.from, to: s.to, vehicle: s.vehicle, fare: 52, station: s.station })) }));
    const edited = { ...old[1]!, updatedAt: "2026-11-26T10:00:00.000Z" };
    const stored = [...SEED_ROUTES.filter((r) => !r.id.startsWith("zagd")), old[0]!, edited];
    const out = refreshRevisedBuiltIns(stored, SEED_ROUTES);
    expect(out.changed).toBe(1);
    expect(out.routes.find((r) => r.id === "zagd1")!.stages[0]!.noFare).toBe(true);
    expect(out.routes.find((r) => r.id === "zagd2")!.stages[0]!.fare).toBe(52);
  });

  it("a community fare suggestion adds a price to a no-price line", () => {
    const r = ZAGAZIG_INTERCITY_ROUTES[0]!;
    const out = applySuggestion([r], { id: "x", createdAt: "", status: "approved", author: "a", kind: "price", routeId: r.id, stageId: r.stages[0]!.id, oldFare: 0, newFare: 40 });
    expect(routeHasFare(out[0]!)).toBe(true);
    expect(routeTotal(out[0]!)).toBe(40);
  });

  it("is found by search and added to a device that has the old list", () => {
    expect(searchRoutes(SEED_ROUTES, { query: "الزقازيق عبود", scope: "all", vehicle: "all" }).some((r) => r.id === "zagd1")).toBe(true);
    const saved = SEED_ROUTES.filter((r) => !r.id.startsWith("zagd"));
    expect(mergeBuiltInRoutes(saved, SEED_ROUTES, saved.map((r) => r.id)).added).toBe(27);
  });
});
