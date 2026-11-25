// Free-text destination -> coordinates, using OpenStreetMap Nominatim (no API key, works from the browser).
// Usage policy (https://operations.osmfoundation.org/policies/nominatim/): max 1 request/second, no bulk or
// keystroke-by-keystroke autocomplete, results should be cached. So: the caller debounces, one request is
// in flight at a time (older ones are aborted), and answers are cached on the device.

export interface GeoResult {
  name: string;
  lat: number;
  lng: number;
}

export type GeoOutcome =
  | { status: "ok"; results: GeoResult[] }
  | { status: "none" }
  | { status: "error" };

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
export const GEO_CACHE_KEY = "rafiq.geocode.cache.v1";
const CACHE_MAX = 40;
export const MIN_QUERY_LENGTH = 3;

type Stor = Pick<Storage, "getItem" | "setItem">;
type Fetcher = (url: string, init?: { signal?: AbortSignal; headers?: Record<string, string> }) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

export function cacheKey(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

function stor(s?: Stor): Stor | null {
  if (s) return s;
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readCache(s?: Stor): Record<string, GeoResult[]> {
  try {
    const raw = stor(s)?.getItem(GEO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GeoResult[]>) : {};
  } catch {
    return {};
  }
}

export function getCached(q: string, s?: Stor): GeoResult[] | null {
  const hit = readCache(s)[cacheKey(q)];
  return Array.isArray(hit) && hit.length ? hit : null;
}

function putCache(q: string, results: GeoResult[], s?: Stor) {
  try {
    const c = readCache(s);
    delete c[cacheKey(q)];
    c[cacheKey(q)] = results; // re-insert so it is the newest
    const keys = Object.keys(c);
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_MAX))) delete c[k];
    stor(s)?.setItem(GEO_CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or blocked */
  }
}

/** Turns a Nominatim JSON answer into clean results (drops rows with bad coordinates). */
export function parseNominatim(json: unknown): GeoResult[] {
  if (!Array.isArray(json)) return [];
  const out: GeoResult[] = [];
  for (const r of json as Array<Record<string, unknown>>) {
    const lat = Number(r["lat"]);
    const lng = Number(r["lon"]);
    const name = typeof r["display_name"] === "string" ? (r["display_name"] as string) : "";
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    out.push({ name, lat, lng });
    if (out.length >= 4) break;
  }
  return out;
}

export function buildUrl(q: string, egyptOnly: boolean): string {
  const p = new URLSearchParams({ q: q.trim(), format: "jsonv2", limit: "4", "accept-language": "ar" });
  if (egyptOnly) p.set("countrycodes", "eg");
  return `${ENDPOINT}?${p.toString()}`;
}

/**
 * Looks a place up: cache first, then Egypt, then worldwide if Egypt has nothing.
 * Never throws: "error" means the network/service failed (offline), "none" means no such place.
 * Aborting returns "error" quietly; the caller ignores it because it already moved on.
 */
export async function geocode(q: string, opts: { signal?: AbortSignal; fetcher?: Fetcher; storage?: Stor } = {}): Promise<GeoOutcome> {
  const query = q.trim();
  if (query.length < MIN_QUERY_LENGTH) return { status: "none" };
  const cached = getCached(query, opts.storage);
  if (cached) return { status: "ok", results: cached };
  const f: Fetcher = opts.fetcher ?? ((url, init) => fetch(url, init as RequestInit));
  try {
    for (const egyptOnly of [true, false]) {
      const res = await f(buildUrl(query, egyptOnly), { ...(opts.signal ? { signal: opts.signal } : {}), headers: { Accept: "application/json" } });
      if (!res.ok) return { status: "error" };
      const results = parseNominatim(await res.json());
      if (results.length) {
        putCache(query, results, opts.storage);
        return { status: "ok", results };
      }
    }
    return { status: "none" };
  } catch {
    return { status: "error" };
  }
}
