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
  /** True when no verified fare is recorded: the UI shows "no price yet" instead of a number, and totals skip it. */
  noFare?: boolean;
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
  /** official: admin-entered tariff; documented: published online (news / governorate), with date in notes; community: rider-reported. */
  source: "official" | "documented" | "community";
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
  return route.stages.reduce((sum, s) => sum + (!s.noFare && Number.isFinite(s.fare) ? s.fare : 0), 0);
}

/** True when every stage has a recorded fare (a route with no price shows "السعر غير مسجّل" instead of 0). */
export function routeHasFare(route: Pick<TransportRoute, "stages">): boolean {
  return route.stages.length > 0 && route.stages.every((s) => !s.noFare);
}

export const NO_FARE_TEXT = "السعر غير مسجّل";

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

function withoutNoFare(st: Stage): Stage {
  const { noFare: _drop, ...rest } = st;
  return rest;
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
        stages: r.stages.map((st) => (st.id === s.stageId ? { ...withoutNoFare(st), fare: s.newFare } : st)),
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
          stages: r.stages.map((s) => (s.id === stageId ? { ...withoutNoFare(s), fare } : s)),
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

// ---- Zagazig internal service (سرفيس الزقازيق) ----
// Fare: official Sharqia tariff for service cars inside Zagazig city (governor's decision, 10 March 2026).
// Line names and boarding points are rider-reported, so these routes are marked as community data.
export const ZAGAZIG_SERVICE_FARE = 5;
const ZAG_STAMP = "2026-11-23T08:00:00.000Z";
const ZAG_FARE_NOTE = "الأجرة الرسمية للسرفيس داخل مدينة الزقازيق ٥ جنيه للراكب (تعريفة محافظة الشرقية – مارس ٢٠٢٦). لو السواق طلب أكتر أو قسّم الخط، ده مخالف.";
const zag = (id: string, from: string, to: string, station: string, stageFrom: string, stageTo: string, line: string, extra: string[] = []): TransportRoute => ({
  id,
  scope: "internal",
  from,
  to,
  station,
  stages: [S(`${id}s1`, stageFrom, stageTo, "service", ZAGAZIG_SERVICE_FARE, station, `اركب سرفيس مكتوب عليه «${line}»`)],
  notes: [ZAG_FARE_NOTE, ...extra, "خطوط السرفيس ونقط الركوب حسب كلام الركاب — اسأل السواق قبل ما تركب، ولو لقيت حاجة اتغيرت ابعت تعديل من «اقترح تعديل»."],
  updatedAt: ZAG_STAMP,
  source: "community",
});

export const ZAGAZIG_ROUTES: TransportRoute[] = [
  zag("zag1", "جامعة الزقازيق", "كلية الزراعة – الزقازيق", "أمام بوابة جامعة الزقازيق الرئيسية", "بوابة الجامعة", "شارع طلبة عويضة (الفلل)", "الجامعة – طلبة", [
    "انزل عند شارع طلبة عويضة واتمشى دقايق لميدان الزراعة، الكلية في شارع الوحدة الزراعية.",
  ]),
  zag("zag2", "كلية الزراعة – الزقازيق", "جامعة الزقازيق", "شارع طلبة عويضة جنب الفلل (قريب من كلية الزراعة)", "شارع طلبة عويضة", "بوابة الجامعة", "طلبة – الجامعة"),
  zag("zag3", "كلية الزراعة – الزقازيق", "القومية – الزقازيق", "شارع طلبة عويضة جنب الفلل (قريب من كلية الزراعة)", "شارع طلبة عويضة", "شارع القومية", "طلبة – القومية"),
  zag("zag4", "كلية الزراعة – الزقازيق", "محطة قطار الزقازيق", "شارع طلبة عويضة جنب الفلل (قريب من كلية الزراعة)", "شارع طلبة عويضة", "ميدان المحطة", "طلبة – المحطة", [
    "المحطة قريبة من الكلية، وممكن تتمشاها لو مش شايل حاجة تقيلة.",
  ]),
  zag("zag5", "كلية الزراعة – الزقازيق", "الموقف الجديد – الزقازيق", "شارع طلبة عويضة جنب الفلل (قريب من كلية الزراعة)", "شارع طلبة عويضة", "الموقف الجديد (السفر للمحافظات)", "طلبة – الموقف"),
  zag("zag6", "محطة قطار الزقازيق", "جامعة الزقازيق", "موقف السرفيس الداخلي جنب سور نادي السكة الحديد", "موقف السرفيس الداخلي", "بوابة الجامعة", "المحطة – الجامعة"),
];

SEED_ROUTES.push(...ZAGAZIG_ROUTES);

// ---- Zagazig microbus lines to other cities (ميكروباص من الزقازيق) ----
// Fares are deliberately NOT recorded (owner decision, 25 Nov 2026): the published tariff could not be verified against the
// governorate's own table. Each stage is `noFare`; a verified fare can be added line by line later (then drop `noFare`).
// Stops: "documented" ones come from governorate announcements (Nov 2023 and Nov 2026); the rest say so in the entry.
const ZAGD_STAMP = "2026-11-25T09:00:00.000Z";
/** First release of these lines carried (unverified) fares; devices that stored that version get the fare-free one. */
export const ZAGD_OLD_STAMP = "2026-11-25T08:00:00.000Z";
const AHRAR = "موقف الزقازيق العمومي – منطقة الأحرار";
const ZRA3A = "موقف مدن شمال الشرقية – منطقة الزراعة (أرض الشونة بجوار محطة تموين الغاز)";
const UNSURE = "مكان الموقف المحدد لهذا الخط مش منشور رسمياً: ابدأ من موقف الأحرار (الموقف العمومي) أو موقف الزراعة واسأل عن الخط، وبعدها بلّغنا من «اقترح تعديل».";
const FARE_NOTE = "السعر مش مسجّل في التطبيق لسه. اسأل السواق أو شوف الملصق اللي على العربية (المحافظة بتلزم السواقين يعلّقوا التعريفة)، ولو عرفت السعر الصح ابعته من «اقترح تعديل». الخط والموقف موثّقين من إعلانات المحافظة (حتى ٢٥ نوفمبر ٢٠٢٦).";
const STATION_NOTE_AHRAR = "موقف الأحرار من أكبر مواقف المحافظة (حوالي ٥ فدان وأكتر من ٢٠٠٠ عربية و١٨ خط سير للقاهرة وبلبيس والعاشر وإسكندرية وطنطا وبنها) حسب إعلان المحافظة نوفمبر ٢٠٢٦.";
const STATION_NOTE_ZRA3A = "موقف مدن الشمال اتنقل من منطقة الجمباز لمنطقة الزراعة (نوفمبر ٢٠٢٣) وبيخدم ههيا وأبو كبير وفاقوس وأولاد صقر وكفر صقر والحسينية وصان الحجر، حسب إعلان المحافظة.";
const zagd = (id: string, to: string, station: string, stageFrom: string, stageTo: string, extra: string[] = [], stationDocumented = true): TransportRoute => ({
  id,
  scope: "external",
  from: "الزقازيق",
  to,
  station,
  stages: [{ ...S(`${id}s1`, stageFrom, stageTo, "microbus", 0, station), noFare: true }],
  notes: [FARE_NOTE, ...extra, ...(stationDocumented ? [] : [UNSURE])],
  updatedAt: ZAGD_STAMP,
  source: "documented",
});
const ahrar = (id: string, to: string, destStop: string, extra: string[] = []) =>
  zagd(id, to, AHRAR, "موقف الأحرار – الزقازيق", destStop, [STATION_NOTE_AHRAR, ...extra]);
const north = (id: string, to: string, destStop: string) =>
  zagd(id, to, ZRA3A, "موقف الزراعة – الزقازيق", destStop, [STATION_NOTE_ZRA3A]);
const other = (id: string, to: string, destStop: string, extra: string[] = []) =>
  zagd(id, to, "موقف الأحرار أو موقف الزراعة (اسأل عن الخط)", "موقف الزقازيق", destStop, extra, false);

export const ZAGAZIG_INTERCITY_ROUTES: TransportRoute[] = [
  ahrar("zagd1", "القاهرة (موقف عبود)", "موقف عبود – القاهرة", ["الرحلة حوالي ساعة ونص إلى ساعتين حسب الزحمة."]),
  ahrar("zagd2", "القاهرة (موقف السلام)", "موقف السلام – القاهرة"),
  ahrar("zagd3", "مسطرد", "موقف مسطرد"),
  ahrar("zagd4", "بلبيس", "موقف بلبيس"),
  ahrar("zagd5", "العاشر من رمضان", "موقف العاشر من رمضان"),
  ahrar("zagd6", "بنها", "موقف بنها"),
  ahrar("zagd7", "طنطا", "موقف طنطا"),
  ahrar("zagd8", "الإسكندرية", "موقف الإسكندرية"),
  north("zagd9", "ههيا", "موقف ههيا"),
  north("zagd10", "أبو كبير", "موقف أبو كبير"),
  north("zagd11", "فاقوس", "موقف فاقوس"),
  north("zagd12", "كفر صقر", "موقف كفر صقر"),
  north("zagd13", "أولاد صقر", "موقف أولاد صقر"),
  north("zagd14", "الحسينية", "موقف الحسينية"),
  north("zagd15", "صان الحجر", "موقف صان الحجر"),
  other("zagd16", "المنصورة", "موقف المنصورة"),
  other("zagd17", "الإسماعيلية", "موقف الإسماعيلية"),
  other("zagd18", "منيا القمح", "موقف منيا القمح", ["موقف منيا القمح الجديد (بجوار أرض الفدان) اتجهز وبيتطور حسب إعلان المحافظة نوفمبر ٢٠٢٦."]),
  other("zagd19", "أبو حماد", "موقف أبو حماد"),
  other("zagd20", "مشتول السوق", "موقف مشتول السوق"),
  other("zagd21", "ميت غمر", "موقف ميت غمر"),
  other("zagd22", "السنبلاوين", "موقف السنبلاوين"),
  other("zagd23", "الإبراهيمية", "موقف الإبراهيمية"),
  other("zagd24", "ديرب نجم", "موقف ديرب نجم"),
  other("zagd25", "القنايات", "موقف القنايات"),
  other("zagd26", "السويس", "موقف السويس"),
  other("zagd27", "بورسعيد", "موقف بورسعيد"),
];

SEED_ROUTES.push(...ZAGAZIG_INTERCITY_ROUTES);

/** Seed routes that existed before built-in additions were tracked; never re-added if the owner deleted them. */
export const LEGACY_SEED_IDS = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10"];

/** Replaces stored copies of the first zagd release (the ones with fares) by the current built-in lines. Edited routes (different stamp) are left alone. Pure. */
export function refreshRevisedBuiltIns(stored: TransportRoute[], builtIn: TransportRoute[]) {
  const fresh = new Map(builtIn.filter((r) => /^zagd\d+$/.test(r.id)).map((r) => [r.id, r]));
  let changed = 0;
  const routes = stored.map((r) => {
    const f = fresh.get(r.id);
    if (f && r.updatedAt === ZAGD_OLD_STAMP) {
      changed++;
      return f;
    }
    return r;
  });
  return { routes, changed };
}

/** Adds built-in routes this device has never seen; routes the owner already removed stay removed. Pure. */
export function mergeBuiltInRoutes(stored: TransportRoute[], builtIn: TransportRoute[], seen: string[]) {
  const have = new Set(stored.map((r) => r.id));
  const seenSet = new Set(seen);
  const added = builtIn.filter((r) => !seenSet.has(r.id) && !have.has(r.id));
  return {
    routes: added.length ? [...stored, ...added] : stored,
    seen: Array.from(new Set([...seen, ...builtIn.map((r) => r.id)])),
    added: added.length,
  };
}

export function describeSuggestion(s: Suggestion, routes: Pick<TransportRoute, "id" | "from" | "to">[]) {
  if (s.kind === "new_route") return `خط جديد: ${s.route.from} ← ${s.route.to}`;
  const r = routes.find((x) => x.id === s.routeId);
  const name = r ? `${r.from} ← ${r.to}` : "خط محذوف";
  if (s.kind === "price") return `تعديل سعر (${name}): ${formatFare(s.oldFare)} ← ${formatFare(s.newFare)}`;
  return `ملاحظة (${name}): ${s.note}`;
}
