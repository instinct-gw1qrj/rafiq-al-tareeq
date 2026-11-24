import { supabase } from "@/integrations/supabase/client";
import { ADS_KEY } from "./ads";
import { PLACES_KEY } from "./places";
import { readStore, uid, writeStore } from "./storage";
import { ROUTES_KEY } from "./transport";

// Owner-published content lives in the cloud; every device copies it locally so it keeps working offline.
export const CONTENT_KEYS = { routes: ROUTES_KEY, places: PLACES_KEY, ads: ADS_KEY } as const;
type ContentKey = keyof typeof CONTENT_KEYS;
const STAMPS_KEY = "rafiq.sync.v1";
const DEVICE_KEY = "rafiq.device.v1";
const PENDING_KEY = "rafiq.visits.pending.v1";

/** True when the cloud copy is newer than the one this device last saved. */
export function isNewer(remote: string, local: string | undefined) {
  return !local || new Date(remote).getTime() > new Date(local).getTime();
}

export async function pullContent() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const { data, error } = await supabase.from("app_content").select("key, value, updated_at");
  if (error || !data) return;
  const stamps = readStore<Record<string, string>>(STAMPS_KEY, {});
  const next = { ...stamps };
  for (const row of data) {
    const k = row.key as ContentKey;
    if (!(k in CONTENT_KEYS) || !isNewer(row.updated_at, stamps[k])) continue;
    writeStore(CONTENT_KEYS[k], row.value);
    next[k] = row.updated_at;
  }
  writeStore(STAMPS_KEY, next);
}

/** Owner only (checked by the database): sends this device's routes, places and ads to every user. */
export async function publishAll() {
  const now = new Date().toISOString();
  const rows = (Object.keys(CONTENT_KEYS) as ContentKey[]).map((k) => ({
    key: k,
    value: JSON.parse(window.localStorage.getItem(CONTENT_KEYS[k]) ?? "null") ?? readStore(CONTENT_KEYS[k], null),
    updated_at: now,
  })).filter((r) => r.value !== null);
  const { error } = await supabase.from("app_content").upsert(rows);
  if (error) throw error;
  writeStore(STAMPS_KEY, Object.fromEntries(rows.map((r) => [r.key, now])));
  return rows.length;
}

/** Counts one app open; opens made offline are sent the next time the device is online. */
export async function recordVisit() {
  let device = readStore<string>(DEVICE_KEY, "");
  if (!device) {
    device = `d-${uid()}${uid()}`;
    writeStore(DEVICE_KEY, device);
  }
  const pending = readStore<number>(PENDING_KEY, 0) + 1;
  writeStore(PENDING_KEY, pending);
  if (!navigator.onLine) return;
  const rows = Array.from({ length: Math.min(pending, 50) }, () => ({ device_id: device }));
  const { error } = await supabase.from("app_visits").insert(rows);
  // Subtract only what was actually uploaded; a backlog above the 50-row batch stays pending.
  if (!error) writeStore(PENDING_KEY, Math.max(0, pending - rows.length));
}

export async function fetchVisitorStats() {
  const { data, error } = await supabase.rpc("visitor_stats");
  if (error) throw error;
  return data?.[0] ?? null;
}
