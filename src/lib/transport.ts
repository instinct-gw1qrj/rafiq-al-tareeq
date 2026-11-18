import { formatFare, normalizeArabic } from "./arabic";
import { uid } from "./storage";

export type Vehicle = "tuktuk" | "service" | "microbus" | "bus" | "train" | "metro" | "taxi";
export type Scope = "internal" | "external";

export const VEHICLE_LABELS: Record<Vehicle, string> = {
  tuktuk: "توكتوك",
  service: "سرفيس",
  microbus: "ميكروباص",
  bus: "أتوبيس",
  train: "قطار",
  metro: "مترو",
  taxi: "تاكسي",
};

export const SCOPE_LABELS: Record<Scope, string> = {
  internal: "داخلي",
  external: "بين المراكز",
};

export interface Stage {
  id: string;
  from: string;
  to: string;
  vehicle: Vehicle;
  fare: number;
  station: string;
  note?: string;
}

export interface TransportRoute {
  id: string;
  scope: Scope;
  from: string;
  to: string;
  station: string;
  stages: Stage[];
  notes: string[];
  updatedAt: string;
  source: "official" | "community";
}

export type NewRouteInput = Omit<TransportRoute, "id" | "updatedAt" | "source">;

type SuggestionBase = {
  id: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  author: string;
};

export type Suggestion =
  | (SuggestionBase & { kind: "new_route"; route: NewRouteInput })
  | (SuggestionBase & { kind: "price"; routeId: string; stageId: string; oldFare: number; newFare: number })
  | (SuggestionBase & { kind: "note"; routeId: string; note: string });

export const ROUTES_KEY = "rafiq.routes.v1";
export const SUGGESTIONS_KEY = "rafiq.suggestions.v1";
export const CALC_KEY = "rafiq.calc.v1";

export function routeTotal(route: Pick<TransportRoute, "stages">): number {
  return route.stages.reduce((sum, s) => sum + (Number.isFinite(s.fare) ? s.fare : 0), 0);
}

export function routeVehicles(route: Pick<TransportRoute, "stages">): Vehicle[] {
  return Array.from(new Set(route.stages.map((s) => s.vehicle)));
}

export interface RouteFilter {
  query: string;
  scope: Scope | "all";
  vehicle: Vehicle | "all";
}

export function searchRoutes(routes: TransportRoute[], f: RouteFilter): TransportRoute[] {
  const terms = normalizeArabic(f.query).split(" ").filter(Boolean);
  return routes.filter((r) => {
    if (f.scope !== "all" && r.scope !== f.scope) return false;
    if (f.vehicle !== "all" && !r.stages.some((s) => s.vehicle === f.vehicle)) return false;
    if (terms.length === 0) return true;
    const hay = normalizeArabic(
      [r.from, r.to, r.station, ...r.stages.flatMap((s) => [s.from, s.to, s.station, VEHICLE_LABELS[s.vehicle]])].join(" "),
    );
    return terms.every((t) => hay.includes(t));
  });
}

/** Applies an approved suggestion to the official route list. Pure: returns a new array. */
export function applySuggestion(routes: TransportRoute[], s: Suggestion, now = new Date()): TransportRoute[] {
  const stamp = now.toISOString();
  if (s.kind === "new_route") {
    return [
      ...routes,
      {
        ...s.route,
        id: `r-${s.id}`,
        stages: s.route.stages.map((st) => ({ ...st })),
        notes: [...s.route.notes],
        updatedAt: stamp,
        source: "community",
      },
    ];
  }
  return routes.map((r) => {
    if (r.id !== s.routeId) return r;
    if (s.kind === "price") {
      return {
        ...r,
        updatedAt: stamp,
        stages: r.stages.map((st) => (st.id === s.stageId ? { ...st, fare: s.newFare } : st)),
      };
    }
    return { ...r, updatedAt: stamp, notes: [...r.notes, s.note] };
  });
}

export function setStageFare(routes: TransportRoute[], routeId: string, stageId: string, fare: number) {
  return routes.map((r) =>
    r.id === routeId
      ? {
          ...r,
          updatedAt: new Date().toISOString(),
          stages: r.stages.map((s) => (s.id === stageId ? { ...s, fare } : s)),
        }
      : r,
  );
}

export function emptyStage(): Stage {
  return { id: uid(), from: "", to: "", vehicle: "microbus", fare: 0, station: "" };
}

// ---- Calculator ----
export interface CalcLeg {
  id: string;
  label: string;
  vehicle: Vehicle;
  fare: number;
}
export interface CalcState {
  legs: CalcLeg[];
  passengers: number;
}
export const DEFAULT_CALC: CalcState = { legs: [], passengers: 1 };

export function calcTotal(c: CalcState): { perPerson: number; total: number } {
  const perPerson = c.legs.reduce((sum, l) => sum + (Number.isFinite(l.fare) ? l.fare : 0), 0);
  const people = Math.max(1, Math.floor(c.passengers || 1));
  return { perPerson, total: perPerson * people };
}

// ---- Sample data (illustrative fares; the admin edits them to the real official tariff) ----
const S = (id: string, from: string, to: string, vehicle: Vehicle, fare: number, station: string, note?: string): Stage =>
  note ? { id, from, to, vehicle, fare, station, note } : { id, from, to, vehicle, fare, station };

export const SEED_ROUTES: TransportRoute[] = [
  {
    id: "r1",
    scope: "external",
    from: "طنطا",
    to: "المحلة الكبرى",
    station: "موقف الجلاء – طنطا",
    stages: [S("r1s1", "موقف الجلاء", "موقف المحلة الجديد", "microbus", 15, "موقف الجلاء – رصيف المحلة")],
    notes: ["الميكروباصات تتحرك كل ١٠ دقائق تقريباً من الصباح حتى منتصف الليل."],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r2",
    scope: "external",
    from: "المحلة الكبرى",
    to: "المنصورة",
    station: "موقف المنصورة – المحلة",
    stages: [S("r2s1", "موقف المحلة الجديد", "موقف توريل – المنصورة", "microbus", 20, "موقف المحلة الجديد – خط المنصورة")],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r3",
    scope: "external",
    from: "طنطا",
    to: "القاهرة (رمسيس)",
    station: "موقف سعيد – طنطا",
    stages: [
      S("r3s1", "ميدان الساعة", "موقف سعيد", "service", 7, "ميدان الساعة"),
      S("r3s2", "موقف سعيد", "موقف عبود – القاهرة", "microbus", 45, "موقف سعيد – رصيف القاهرة"),
      S("r3s3", "موقف عبود", "ميدان رمسيس", "microbus", 10, "مخرج موقف عبود"),
    ],
    notes: ["بديل: القطار من محطة طنطا إلى محطة مصر مباشرة."],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r4",
    scope: "external",
    from: "كفر الزيات",
    to: "طنطا",
    station: "موقف كفر الزيات",
    stages: [S("r4s1", "موقف كفر الزيات", "موقف الجلاء – طنطا", "microbus", 12, "موقف كفر الزيات الرئيسي")],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r5",
    scope: "external",
    from: "زفتى",
    to: "طنطا",
    station: "موقف زفتى",
    stages: [
      S("r5s1", "وسط زفتى", "موقف زفتى", "tuktuk", 10, "أي مكان داخل زفتى"),
      S("r5s2", "موقف زفتى", "موقف الجلاء – طنطا", "microbus", 14, "موقف زفتى – خط طنطا"),
    ],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r6",
    scope: "internal",
    from: "محطة القطار – طنطا",
    to: "جامعة طنطا",
    station: "ميدان المحطة",
    stages: [S("r6s1", "ميدان المحطة", "بوابة الجامعة – شارع الجيش", "service", 6, "ميدان المحطة أمام المحطة")],
    notes: ["يمر بشارع البحر ثم شارع الجيش."],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r7",
    scope: "internal",
    from: "ميدان الساعة – طنطا",
    to: "مستشفى طنطا الجامعي",
    station: "ميدان الساعة",
    stages: [S("r7s1", "ميدان الساعة", "المستشفى الجامعي", "tuktuk", 15, "أي توكتوك من الميدان", "السعر للرحلة كاملة وليس للفرد")],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r8",
    scope: "internal",
    from: "السيد البدوي – طنطا",
    to: "موقف الجلاء",
    station: "شارع البحر",
    stages: [
      S("r8s1", "مسجد السيد البدوي", "شارع البحر", "tuktuk", 10, "ساحة المسجد"),
      S("r8s2", "شارع البحر", "موقف الجلاء", "service", 6, "تقاطع البحر مع سعيد"),
    ],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r9",
    scope: "internal",
    from: "المحلة – الشون",
    to: "المحلة – شركة الغزل",
    station: "ميدان الشون",
    stages: [S("r9s1", "ميدان الشون", "بوابة شركة الغزل", "service", 5, "ميدان الشون أمام البنك")],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
  {
    id: "r10",
    scope: "external",
    from: "السنطة",
    to: "طنطا",
    station: "موقف السنطة",
    stages: [S("r10s1", "موقف السنطة", "موقف الجلاء – طنطا", "microbus", 13, "موقف السنطة الرئيسي")],
    notes: [],
    updatedAt: "2026-11-01T08:00:00.000Z",
    source: "official",
  },
];

export function describeSuggestion(s: Suggestion, routes: Pick<TransportRoute, "id" | "from" | "to">[]) {
  if (s.kind === "new_route") return `خط جديد: ${s.route.from} ← ${s.route.to}`;
  const r = routes.find((x) => x.id === s.routeId);
  const name = r ? `${r.from} ← ${r.to}` : "خط محذوف";
  if (s.kind === "price") return `تعديل سعر (${name}): ${formatFare(s.oldFare)} ← ${formatFare(s.newFare)}`;
  return `ملاحظة (${name}): ${s.note}`;
}
