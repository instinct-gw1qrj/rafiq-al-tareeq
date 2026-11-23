import { describe, expect, it } from "vitest";
import { mergeBuiltInRoutes, routeTotal, SEED_ROUTES, ZAGAZIG_ROUTES, ZAGAZIG_SERVICE_FARE } from "@/lib/transport";

describe("Zagazig internal service lines", () => {
  it("charges the official 5 EGP Zagazig service fare on every line", () => {
    expect(ZAGAZIG_SERVICE_FARE).toBe(5);
    for (const r of ZAGAZIG_ROUTES) expect(routeTotal(r)).toBe(5);
  });

  it("includes the university to Faculty of Agriculture line with a boarding point", () => {
    const r = SEED_ROUTES.find((x) => x.from === "جامعة الزقازيق" && x.to.includes("كلية الزراعة"));
    expect(r?.station).toBe("أمام بوابة جامعة الزقازيق الرئيسية");
  });

  it("adds new built-in lines to a saved list without bringing back deleted old ones", () => {
    const saved = SEED_ROUTES.filter((r) => r.id !== "r1" && !r.id.startsWith("zag"));
    const out = mergeBuiltInRoutes(saved, SEED_ROUTES, ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"]);
    expect(out.added).toBe(ZAGAZIG_ROUTES.length);
    expect(out.routes.some((r) => r.id === "r1")).toBe(false);
    expect(mergeBuiltInRoutes(out.routes, SEED_ROUTES, out.seen).added).toBe(0);
  });
});
