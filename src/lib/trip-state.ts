// Trip tracking state that survives a reload, a closed tab or a killed app.
// Before this, "is the trip active" lived only in React state, so reopening the app
// looked like the trip had been cancelled and no alarm could ever fire.
import { alertStage, distanceKm, type Place } from "@/lib/geo";

export const TRIP_KEY = "rafiq.trip.active.v1";
/** A saved trip older than this is treated as stale and dropped (a forgotten trip should not buzz tomorrow). */
export const TRIP_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface ActiveTrip {
  dest: Place;
  startedAt: number;
  /** Alert stages / landmark names already announced, so a reopen does not repeat them. */
  fired: string[];
  wakeLock: boolean;
}

type Stor = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function store(s?: Stor): Stor | null {
  if (s) return s;
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function saveTrip(t: ActiveTrip, s?: Stor): void {
  try {
    store(s)?.setItem(TRIP_KEY, JSON.stringify(t));
  } catch {
    /* storage full or blocked */
  }
}

export function clearTrip(s?: Stor): void {
  try {
    store(s)?.removeItem(TRIP_KEY);
  } catch {
    /* ignore */
  }
}

export function loadTrip(now = Date.now(), s?: Stor): ActiveTrip | null {
  try {
    const raw = store(s)?.getItem(TRIP_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as Partial<ActiveTrip>;
    if (!t || typeof t !== "object" || !t.dest || typeof t.dest.name !== "string") return null;
    if (typeof t.startedAt !== "number" || now - t.startedAt > TRIP_MAX_AGE_MS) {
      clearTrip(s);
      return null;
    }
    // JSON turns NaN (a typed destination with no coordinates) into null: restore it.
    const d = t.dest as Place;
    const dest: Place = { ...d, lat: typeof d.lat === "number" ? d.lat : Number.NaN, lng: typeof d.lng === "number" ? d.lng : Number.NaN };
    return {
      dest,
      startedAt: t.startedAt,
      fired: Array.isArray(t.fired) ? t.fired.filter((x): x is string => typeof x === "string") : [],
      wakeLock: t.wakeLock !== false,
    };
  } catch {
    return null;
  }
}

export interface TripEvent {
  key: string;
  kind: "near" | "arrived" | "landmark";
  title: string;
  body: string;
  loud: boolean;
}

/** Pure decision: given a position, which alerts are new? Used by the live watcher and by the "came back to the app" check. */
export function evaluatePosition(
  here: { lat: number; lng: number },
  dest: Place,
  fired: ReadonlySet<string>,
  places: readonly Place[],
  toDigits: (n: string) => string = (n) => n,
): { km: number | null; events: TripEvent[]; nearby: string[] } {
  const events: TripEvent[] = [];
  let km: number | null = null;
  if (Number.isFinite(dest.lat) && Number.isFinite(dest.lng)) {
    km = distanceKm(here, dest);
    const stage = alertStage(km);
    if (stage === "arrived") {
      // Arriving also covers a missed "near" alert: one loud alarm is enough.
      if (!fired.has("arrived")) {
        events.push({ key: "arrived", kind: "arrived", title: "وصلت وجهتك ✅", body: `أنت الآن عند ${dest.name}`, loud: true });
      }
    } else if (stage === "near" && !fired.has("near") && !fired.has("arrived")) {
      events.push({
        key: "near",
        kind: "near",
        title: "قربت توصل 🚏",
        body: `باقي حوالي ${toDigits(km.toFixed(1))} كم على ${dest.name}، استعد للنزول`,
        loud: true,
      });
    }
  }
  const nearby = places.filter((p) => p.name !== dest.name && distanceKm(here, p) < 5).map((p) => p.name);
  for (const n of nearby) {
    if (!fired.has(n)) events.push({ key: n, kind: "landmark", title: "أنت بجوار", body: n, loud: false });
  }
  return { km, events, nearby };
}
