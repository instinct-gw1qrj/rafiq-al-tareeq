import { normalizeArabic } from "./arabic";
import { uid, useStore } from "./storage";

export type PlaceKind = "rest" | "mosque" | "food" | "cafe" | "fuel" | "service";
export const PLACE_KINDS: PlaceKind[] = ["rest", "mosque", "food", "cafe", "fuel", "service"];
export const PLACE_KIND_LABELS: Record<PlaceKind, string> = {
  rest: "استراحة",
  mosque: "مسجد",
  food: "مطعم",
  cafe: "كافيه",
  fuel: "بنزينة",
  service: "خدمات وصيانة",
};

export interface RecPlace {
  id: string;
  name: string;
  kind: PlaceKind;
  area: string; // city / governorate
  road: string; // highway or street
  offer: string; // offer or description
  phone: string;
  sponsored: boolean; // shown as "مكان موصى به"
  active: boolean;
  createdAt: string;
}
export type NewPlace = Omit<RecPlace, "id" | "createdAt" | "active"> & { active?: boolean };

export const PLACES_KEY = "rafiq.places.v1";
export const SEED_PLACES: RecPlace[] = [
  {
    id: "p-example-1",
    name: "مثال: استراحة الطريق",
    kind: "rest",
    area: "مثال",
    road: "الطريق الصحراوي",
    offer: "مكان توضيحي — عدّليه أو احذفيه من لوحة التحكم",
    phone: "",
    sponsored: true,
    active: true,
    createdAt: "2026-11-21T00:00:00.000Z",
  },
];

export function usePlaces() {
  return useStore<RecPlace[]>(PLACES_KEY, SEED_PLACES);
}

export function makePlace(p: NewPlace, now = new Date()): RecPlace {
  return { ...p, active: p.active ?? true, id: `p-${uid()}`, createdAt: now.toISOString() };
}

/** Active places only; sponsored ("موصى به") places always come first. */
export function filterPlaces(places: RecPlace[], f: { query: string; kind: PlaceKind | "all" }) {
  const terms = normalizeArabic(f.query).split(" ").filter(Boolean);
  return places
    .filter((p) => p.active)
    .filter((p) => f.kind === "all" || p.kind === f.kind)
    .filter((p) => {
      if (!terms.length) return true;
      const hay = normalizeArabic(`${p.name} ${p.area} ${p.road} ${p.offer} ${PLACE_KIND_LABELS[p.kind]}`);
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => Number(b.sponsored) - Number(a.sponsored));
}
