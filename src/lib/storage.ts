import { useCallback, useSyncExternalStore } from "react";

// Offline-first persistence: every piece of app data lives in the device's LocalStorage.
type Entry = { raw: string | null; value: unknown };
const cache = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStore<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // storage full or blocked: keep the in-memory value so the session still works
  }
  cache.set(key, { raw, value });
  notify(key);
}

export function removeStore(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
  cache.delete(key);
  notify(key);
}

function subscribe(key: string, fn: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStore<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    (fn) => subscribe(key, fn),
    () => readStore(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStore(key, fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeStore(key, resolved);
    },
    [key, fallback],
  );
  return [value, set] as const;
}

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
