import { describe, expect, it } from "vitest";
import { mergeBuiltInRoutes, routeTotal, searchRoutes, SEED_ROUTES, ZAGAZIG_INTERCITY_ROUTES } from "@/lib/transport";

describe("Zagazig microbus lines (governorate tariff, 10 March 2026)", () => {
  const fare = (to: string) => routeTotal(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to.includes(to))!);

  it("matches the published tariff", () => {
    expect(fare("عبود")).toBe(52);
    expect(fare("السلام")).toBe(45);
    expect(fare("بلبيس")).toBe(14.5);
    expect(fare("ههيا")).toBe(9.5);
    expect(fare("طنطا")).toBe(62);
    expect(fare("الإسكندرية")).toBe(155);
    expect(fare("القنايات")).toBe(6);
  });

  it("is marked documented, dated, and ids are unique", () => {
    const ids = new Set(SEED_ROUTES.map((r) => r.id));
    expect(ids.size).toBe(SEED_ROUTES.length);
    for (const r of ZAGAZIG_INTERCITY_ROUTES) {
      expect(r.source).toBe("documented");
      expect(r.stages).toHaveLength(1);
      expect(r.notes.join(" ")).toContain("٢٠٢٦");
      expect(r.updatedAt.startsWith("2026-11-25")).toBe(true);
    }
  });

  it("uses the documented stop for the lines the governorate names, and says so when the stop is unconfirmed", () => {
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "بنها")!.station).toContain("الأحرار");
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "فاقوس")!.station).toContain("الزراعة");
    expect(ZAGAZIG_INTERCITY_ROUTES.find((r) => r.to === "المنصورة")!.notes.join(" ")).toContain("مش منشور رسمياً");
  });

  it("is found by search and added to a device that already has the old list", () => {
    expect(searchRoutes(SEED_ROUTES, { query: "الزقازيق عبود", scope: "all", vehicle: "all" }).some((r) => r.id === "zagd1")).toBe(true);
    const saved = SEED_ROUTES.filter((r) => !r.id.startsWith("zagd"));
    const seen = saved.map((r) => r.id);
    const out = mergeBuiltInRoutes(saved, SEED_ROUTES, seen);
    expect(out.added).toBe(ZAGAZIG_INTERCITY_ROUTES.length);
  });
});
