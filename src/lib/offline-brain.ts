// Offline brain for "اسأل رفيق": answers from the data saved on the device
// (routes, prayer-time astronomy, first aid, adhkar, emergency numbers, metro/trains)
// with zero network. Pure functions so vitest can check every intent.
import { ADHKAR } from "@/data/adhkar";
import { EMERGENCY_NUMBERS } from "@/data/emergency";
import { FIRST_AID } from "@/data/medical";
import { METRO_FARES, METRO_HOURS, METRO_LINES, TRAIN_ROUTES } from "@/data/transit";
import { normalizeArabic } from "./arabic";
import { durationAr, governorateFor, nextPrayer, PRAYER_ORDER, prayerTimes } from "./prayer";
import { routeTotal, VEHICLE_LABELS, type TransportRoute } from "./transport";

export interface LocalBrainContext {
  routes: TransportRoute[];
  governorate: string;
  now?: Date;
}

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(normalizeArabic(w)));

/** One saved route as a readable line with stops and total fare. */
export function routeLine(r: TransportRoute) {
  return `${r.from} ← ${r.to} | الموقف: ${r.station} | ${r.stages
    .map((s) => `${VEHICLE_LABELS[s.vehicle]} من ${s.from} إلى ${s.to} بـ ${s.fare} جنيه${s.note ? ` (${s.note})` : ""}`)
    .join(" ثم ")} | الإجمالي ${routeTotal(r)} جنيه${r.notes.length ? ` | ملاحظات: ${r.notes.join("، ")}` : ""}`;
}

function emergencyAnswer(q: string): string | null {
  if (!has(q, "إسعاف", "اسعاف", "نجدة", "شرطة", "مطافي", "إطفاء", "طوارئ", "كهربا", "كهرباء", "غاز", "مرور", "رقم الطوارئ", "112", "123")) return null;
  const specific = EMERGENCY_NUMBERS.filter(
    (n) => q.includes(normalizeArabic(n.name)) || (n.id === "police" && has(q, "نجدة")) || (n.id === "fire" && has(q, "حريق", "حريقة")),
  );
  if (specific.length === 1) {
    const n = specific[0]!;
    return `${n.name}: ${n.number} — ${n.hint}. الرقم شغال من غير نت عادي من أي موبايل.`;
  }
  return `أرقام الطوارئ في مصر (بتتصل من غير إنترنت):\n${EMERGENCY_NUMBERS.map((n) => `• ${n.name}: ${n.number} — ${n.hint}`).join("\n")}`;
}

const FIRST_AID_KEYS: Record<string, string[]> = {
  fainting: ["إغماء", "اغماء", "مغمى عليه", "فقدان الوعي", "بيغمى"],
  accident: ["حادثة", "حادث", "نزيف", "جرح", "كسر", "كسور"],
  nausea: ["غثيان", "قيء", "ترجيع", "بيرجع", "معدته", "دوخة"],
  choking: ["اختناق", "خنقة", "شرقة", "بيتخنق", "مش قادر يتنفس"],
  heat: ["ضربة شمس", "ضربه شمس", "ضربة الشمس", "حر الشمس", "حرارة الشمس", "سخونية من الشمس"],
};

function firstAidAnswer(q: string): string | null {
  if (!has(q, "إسعافات", "اسعافات", "أولية", "اولية", ...FIRST_AID.map((c) => c.title), ...Object.values(FIRST_AID_KEYS).flat())) return null;
  const found = FIRST_AID.find((c) => {
    const keys = FIRST_AID_KEYS[c.id] ?? [];
    return keys.some((k) => q.includes(normalizeArabic(k))) || q.includes(normalizeArabic(c.title));
  });
  if (!found) {
    return `إسعافات أولية محفوظة على جهازك (بدون نت): ${FIRST_AID.map((c) => c.title).join("، ")}. اسألني عن أي واحدة فيهم أو افتح صفحة «إسعافات».`;
  }
  const steps = found.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const extra = found.extra ? `\n\n${found.extra.title}:\n${found.extra.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : "";
  const avoid = found.avoid.length ? `\n\n❌ متعملش: ${found.avoid.join("، ")}` : "";
  const call = found.callWhen.length ? `\n\n📞 اتصل بالإسعاف ١٢٣ فوراً لو: ${found.callWhen.join("، ")}` : "";
  return `${found.title} (${found.short}) — الخطوات من الدليل المحفوظ على جهازك:\n${steps}${extra}${avoid}${call}`;
}

function prayerAnswer(q: string, ctx: LocalBrainContext): string | null {
  if (!has(q, "فجر", "ظهر", "عصر", "مغرب", "عشاء", "شروق", "صلاة", "الصلاة", "مواقيت", "أذان", "اذان", "الصبح")) return null;
  const now = ctx.now ?? new Date();
  const loc = governorateFor(ctx.governorate);
  const times = prayerTimes(loc, now);
  const nxt = nextPrayer(times, now);
  const lines = PRAYER_ORDER.map((p) => `• ${p.label}: ${times[p.id]}`).join("\n");
  return `مواقيت الصلاة النهاردة في ${loc.name} (محسوبة على جهازك من غير نت):\n${lines}\n\nالصلاة الجاية: ${nxt.label} بعد ${durationAr(nxt.mins)} إن شاء الله 🤍`;
}

const ADHKAR_KEYS: Record<string, string[]> = {
  morning: ["أذكار الصباح", "اذكار الصباح", "أذكار صباح", "ذكر الصباح"],
  evening: ["أذكار المساء", "اذكار المساء", "أذكار مساء", "ذكر المساء"],
  travel: ["دعاء السفر", "دعاء الركوب", "دعاء الطريق", "ركوب", "مسافر", "سفر"],
  prayer: ["أذكار بعد الصلاة", "بعد الصلاة", "اذكار بعد الصلاة"],
  sleep: ["أذكار النوم", "اذكار النوم", "قبل النوم", "نوم"],
  distress: ["ضيق", "هم", "كرب", "قلق", "خايف", "خوف", "زعلان", "مكتئب"],
};

function adhkarAnswer(q: string): string | null {
  if (!has(q, "دعاء", "اذكار", "أذكار", "ذكر", ...Object.values(ADHKAR_KEYS).flat())) return null;
  const cat =
    ADHKAR.find((c) => (ADHKAR_KEYS[c.id] ?? []).some((k) => q.includes(normalizeArabic(k)))) ??
    (has(q, "دعاء السفر", "سفر", "ركوب") ? ADHKAR.find((c) => c.id === "travel") : undefined);
  if (!cat) {
    return `الأذكار المحفوظة عندك (بدون نت): ${ADHKAR.map((c) => c.title).join("، ")}. اسألني عن أي واحدة فيهم، مثلاً «دعاء السفر».`;
  }
  const items = cat.items
    .slice(0, 5)
    .map((d) => `• ${d.text}${d.count > 1 ? ` (${d.count} مرات)` : ""}${d.source ? ` — ${d.source}` : ""}`)
    .join("\n");
  const more = cat.items.length > 5 ? `\n…والباقي في صفحة «أنيس» جوه التطبيق.` : "";
  return `${cat.title} (${cat.hint}):\n${items}${more}`;
}

function transitAnswer(q: string): string | null {
  if (!has(q, "مترو", "أنفاق", "انفاق", "قطار", "قطارات")) return null;
  if (has(q, "قطار", "قطارات") && !has(q, "مترو")) {
    return `خطوط القطارات الرئيسية (محفوظة على جهازك):\n${TRAIN_ROUTES.map(
      (t) => `• ${t.name} — المدة: ${t.duration} — الأسعار: ${t.fares.map((f) => `${f.cls} ${f.price}`).join("، ")}`,
    ).join("\n")}\n\nللتفاصيل والحجز: صفحة «قطارات ومترو» في التطبيق.`;
  }
  const line = METRO_LINES.find((l) => {
    if (has(q, "الأول", "الاول", "خط 1")) return l.id === "l1";
    if (has(q, "الثاني", "التاني")) return l.id === "l2";
    if (has(q, "الثالث", "التالت")) return l.id === "l3";
    return q.includes(normalizeArabic(l.name)) || l.stations.some((s) => q.includes(normalizeArabic(s)));
  });
  if (line) {
    return `${line.name} (${line.endpoints}) — ${line.stationsCount} محطة، ${line.lengthKm} كم:\n${line.stations.join(" ← ")}\n\nأسعار التذاكر: ${METRO_FARES.map((f) => `${f.range} ${f.price}`).join("، ")}\nالمواعيد: ${METRO_HOURS}`;
  }
  return `مترو القاهرة (محفوظ على جهازك):\n${METRO_LINES.map((l) => `• ${l.name}: ${l.endpoints} — ${l.stationsCount} محطة`).join("\n")}\n\nأسعار التذاكر: ${METRO_FARES.map((f) => `${f.range} ${f.price}`).join("، ")}\nالمواعيد: ${METRO_HOURS}\n\nاسألني عن خط بعينه (مثلاً «الخط الثالث») أو افتح صفحة «قطارات ومترو».`;
}

function routesAnswer(q: string, routes: TransportRoute[]): string | null {
  const words = q.split(" ").filter((w) => w.length > 2);
  const hits = routes
    .map((r) => ({
      r,
      score: words.filter((w) =>
        normalizeArabic(`${r.from} ${r.to} ${r.station} ${r.stages.map((s) => `${s.from} ${s.to} ${s.station}`).join(" ")}`).includes(w),
      ).length,
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!hits.length) return null;
  return `دي أقرب خطوط من الدليل المحفوظ على جهازك (بدون نت):\n\n${hits.map((h, i) => `${i + 1}. ${routeLine(h.r)}`).join("\n\n")}`;
}

const FALLBACK =
  "أنا دلوقتي شغال من غير نت 📴 وبرد من الدليل المحفوظ على جهازك. أقدر أفيدك في: خطوط المواصلات والأجرة (اكتب اسم مكان)، مواقيت الصلاة، الإسعافات الأولية (مثلاً «ضربة الشمس»)، الأذكار (مثلاً «دعاء السفر»)، أرقام الطوارئ، والمترو والقطارات.";

/** Answers any question from on-device data only. Used when the network is down or the AI call fails. */
export function localAnswer(question: string, ctx: LocalBrainContext): string {
  const q = normalizeArabic(question);
  return (
    // First aid before emergency numbers: "إسعافات أولية" must not land on the phone list.
    firstAidAnswer(q) ??
    emergencyAnswer(q) ??
    // Adhkar before prayer times: "أذكار بعد الصلاة" must not land on the timetable.
    adhkarAnswer(q) ??
    prayerAnswer(q, ctx) ??
    transitAnswer(q) ??
    routesAnswer(q, ctx.routes) ??
    FALLBACK
  );
}
