import { beforeEach, describe, expect, it } from "vitest";
import { buildUrl, cacheKey, geocode, getCached, parseNominatim } from "@/lib/geocode";

const row = { lat: "30.5877", lon: "31.502", display_name: "الزقازيق، الشرقية، مصر" };
const ok = (data: unknown) => async () => ({ ok: true, json: async () => data });

describe("geocode", () => {
  beforeEach(() => localStorage.clear());

  it("parses Nominatim rows and drops bad coordinates", () => {
    expect(parseNominatim([row, { lat: "x", lon: "1", display_name: "a" }, { lat: "99", lon: "1", display_name: "b" }])).toEqual([{ name: "الزقازيق، الشرقية، مصر", lat: 30.5877, lng: 31.502 }]);
    expect(parseNominatim({})).toEqual([]);
  });

  it("builds an Arabic, Egypt-first query", () => {
    const u = new URL(buildUrl("ميدان الساعة", true));
    expect(u.searchParams.get("q")).toBe("ميدان الساعة");
    expect(u.searchParams.get("accept-language")).toBe("ar");
    expect(u.searchParams.get("countrycodes")).toBe("eg");
    expect(new URL(buildUrl("x", false)).searchParams.has("countrycodes")).toBe(false);
  });

  it("resolves a place, caches it, and then works offline", async () => {
    const r = await geocode("ميدان الساعة", { fetcher: ok([row]) });
    expect(r.status).toBe("ok");
    expect(getCached("  ميدان   الساعة ")).not.toBeNull();
    const offline = await geocode("ميدان الساعة", { fetcher: async () => { throw new TypeError("offline"); } });
    expect(offline.status).toBe("ok");
  });

  it("falls back to worldwide when Egypt has nothing", async () => {
    const urls: string[] = [];
    const r = await geocode("Paris Eiffel", { fetcher: async (u) => { urls.push(u); return { ok: true, json: async () => (urls.length === 1 ? [] : [row]) }; } });
    expect(r.status).toBe("ok");
    expect(urls.length).toBe(2);
  });

  it("reports none, error (offline / HTTP error) and short queries", async () => {
    expect((await geocode("مكان مش موجود", { fetcher: ok([]) })).status).toBe("none");
    expect((await geocode("مكان", { fetcher: async () => { throw new TypeError("offline"); } })).status).toBe("error");
    expect((await geocode("مكان", { fetcher: async () => ({ ok: false, json: async () => [] }) })).status).toBe("error");
    expect((await geocode("اب", { fetcher: ok([row]) })).status).toBe("none");
  });

  it("keeps the cache bounded", async () => {
    for (let i = 0; i < 60; i++) await geocode(`مكان رقم ${i}`, { fetcher: ok([row]) });
    expect(Object.keys(JSON.parse(localStorage.getItem("rafiq.geocode.cache.v1")!)).length).toBeLessThanOrEqual(40);
    expect(cacheKey("A  b")).toBe("a b");
  });
});
