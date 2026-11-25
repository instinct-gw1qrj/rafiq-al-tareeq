import { beforeEach, describe, expect, it } from "vitest";
import { PLACES } from "@/lib/geo";
import { clearTrip, evaluatePosition, loadTrip, saveTrip, TRIP_KEY, TRIP_MAX_AGE_MS } from "@/lib/trip-state";

const zag = PLACES.find((p) => p.name === "الزقازيق")!;

describe("trip persistence (reopening the app must not cancel the trip)", () => {
  beforeEach(() => localStorage.clear());

  it("restores the active trip after a 'reload'", () => {
    saveTrip({ dest: zag, startedAt: 1000, fired: ["near"], wakeLock: true });
    const t = loadTrip(2000);
    expect(t?.dest.name).toBe("الزقازيق");
    expect(t?.fired).toEqual(["near"]);
    expect(t?.wakeLock).toBe(true);
  });

  it("keeps a typed destination without coordinates (NaN survives JSON)", () => {
    saveTrip({ dest: { name: "شغلي", lat: NaN, lng: NaN, kind: "landmark" }, startedAt: 1, fired: [], wakeLock: false });
    const t = loadTrip(2)!;
    expect(Number.isNaN(t.dest.lat)).toBe(true);
    expect(t.wakeLock).toBe(false);
  });

  it("drops a stale trip and ignores corrupt data", () => {
    saveTrip({ dest: zag, startedAt: 0, fired: [], wakeLock: true });
    expect(loadTrip(TRIP_MAX_AGE_MS + 1)).toBeNull();
    expect(localStorage.getItem(TRIP_KEY)).toBeNull();
    localStorage.setItem(TRIP_KEY, "{not json");
    expect(loadTrip()).toBeNull();
  });

  it("clearTrip forgets the trip", () => {
    saveTrip({ dest: zag, startedAt: Date.now(), fired: [], wakeLock: true });
    clearTrip();
    expect(loadTrip()).toBeNull();
  });
});

describe("alarm decisions", () => {
  const at = (dLat: number) => ({ lat: zag.lat + dLat, lng: zag.lng });
  const others = PLACES.filter((p) => p.name !== zag.name).slice(0, 0); // ignore landmarks here

  it("far: no alarm", () => {
    expect(evaluatePosition(at(0.2), zag, new Set(), others).events).toEqual([]);
  });
  it("near (~2 km): one loud alarm, not repeated", () => {
    const r = evaluatePosition(at(0.018), zag, new Set(), others);
    expect(r.events.map((e) => e.key)).toEqual(["near"]);
    expect(r.events[0]!.loud).toBe(true);
    expect(evaluatePosition(at(0.018), zag, new Set(["near"]), others).events).toEqual([]);
  });
  it("arrived: loud alarm even if 'near' was never seen (phone was locked)", () => {
    const r = evaluatePosition(at(0.001), zag, new Set(), others);
    expect(r.events.map((e) => e.key)).toEqual(["arrived"]);
  });
  it("resumed after arriving while hidden: fires once, then silent", () => {
    const fired = new Set<string>(["near"]);
    expect(evaluatePosition(at(0.001), zag, fired, others).events.map((e) => e.key)).toEqual(["arrived"]);
    fired.add("arrived");
    expect(evaluatePosition(at(0.001), zag, fired, others).events).toEqual([]);
  });
  it("destination without coordinates never alarms by distance", () => {
    const r = evaluatePosition(at(0), { name: "x", lat: NaN, lng: NaN, kind: "landmark" }, new Set(), others);
    expect(r.km).toBeNull();
    expect(r.events).toEqual([]);
  });
});
