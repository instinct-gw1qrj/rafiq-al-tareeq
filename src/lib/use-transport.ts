import { useStore } from "./storage";
import {
  CALC_KEY,
  DEFAULT_CALC,
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
