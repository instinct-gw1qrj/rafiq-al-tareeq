import { readStore, useStore, writeStore } from "./storage";
import {
  CALC_KEY,
  DEFAULT_CALC,
  LEGACY_SEED_IDS,
  mergeBuiltInRoutes,
  ROUTES_KEY,
  SEED_ROUTES,
  SUGGESTIONS_KEY,
  type CalcState,
  type Suggestion,
  type TransportRoute,
} from "./transport";

const NO_SUGGESTIONS: Suggestion[] = [];

export function useRoutes() {
  return useStore<TransportRoute[]>(ROUTES_KEY, SEED_ROUTES);
}
export function useSuggestions() {
  return useStore<Suggestion[]>(SUGGESTIONS_KEY, NO_SUGGESTIONS);
}
export function useCalc() {
  return useStore<CalcState>(CALC_KEY, DEFAULT_CALC);
}

const SEEN_KEY = "rafiq.routes.seen.v1";

/** Brings newly built-in lines (e.g. Zagazig service) to devices that already saved their own route list. */
export function syncBuiltInRoutes() {
  if (typeof window === "undefined") return;
  const stored = readStore<TransportRoute[]>(ROUTES_KEY, SEED_ROUTES);
  const seen = readStore<string[]>(SEEN_KEY, LEGACY_SEED_IDS);
  const r = mergeBuiltInRoutes(stored, SEED_ROUTES, seen);
  if (r.added) writeStore(ROUTES_KEY, r.routes);
  writeStore(SEEN_KEY, r.seen);
}
