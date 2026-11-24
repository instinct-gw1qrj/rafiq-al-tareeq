// Offline prayer-time calculation: a plain astronomical algorithm with the
// Egyptian General Authority of Survey angles (Fajr ١٩٫٥° below horizon, Isha ١٧٫٥°).
// No network, no library — it keeps working in airplane mode.

import { normalizeArabic } from "./arabic";

export interface PrayerLocation {
  name: string;
  lat: number;
  lng: number;
}

/** Governorate capitals with their coordinates — the user picks one, no typing needed. */
export const GOVERNORATES: PrayerLocation[] = [
  { name: "القاهرة", lat: 30.0444, lng: 31.2357 },
  { name: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { name: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { name: "بورسعيد", lat: 31.2653, lng: 32.3019 },
  { name: "السويس", lat: 29.9668, lng: 32.5498 },
  { name: "الغربية - طنطا", lat: 30.7865, lng: 31.0004 },
  { name: "المنوفية - شبين الكوم", lat: 30.5503, lng: 31.0106 },
  { name: "الشرقية - الزقازيق", lat: 30.5877, lng: 31.502 },
  { name: "الدقهلية - المنصورة", lat: 31.0409, lng: 31.3785 },
  { name: "البحيرة - دمنهور", lat: 31.0341, lng: 30.4682 },
  { name: "كفر الشيخ", lat: 31.1107, lng: 30.9388 },
  { name: "الفيوم", lat: 29.3084, lng: 30.8428 },
  { name: "بني سويف", lat: 29.0661, lng: 31.0994 },
  { name: "المنيا", lat: 28.0871, lng: 30.7618 },
  { name: "أسيوط", lat: 27.1783, lng: 31.1859 },
  { name: "سوهاج", lat: 26.5591, lng: 31.6957 },
  { name: "قنا", lat: 26.1551, lng: 32.716 },
  { name: "الأقصر", lat: 25.6989, lng: 32.6421 },
  { name: "أسوان", lat: 24.0889, lng: 32.8998 },
  { name: "مطروح", lat: 31.3543, lng: 27.2373 },
  { name: "الغردقة - البحر الأحمر", lat: 27.2579, lng: 33.8116 },
  { name: "الإسماعيلية", lat: 30.5965, lng: 32.2715 },
  { name: "دمياط", lat: 31.4165, lng: 31.8133 },
  { name: "القليوبية - بنها", lat: 30.4659, lng: 31.1848 },
];

/** Match the free-text governorate saved in settings to one of the known locations. */
export function governorateFor(settingsGov: string): PrayerLocation {
  const norm = normalizeArabic(settingsGov || "");
  if (!norm) return GOVERNORATES[0]!;
  return (
    GOVERNORATES.find((g) => normalizeArabic(g.name).includes(norm) || norm.includes(normalizeArabic(g.name))) ??
    GOVERNORATES[0]!
  );
}

const RAD = Math.PI / 180;

/** Sun declination (deg) and equation of time (minutes) for the given instant. */
function sunPosition(date: Date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (((280.46 + 0.9856474 * n) % 360) + 360) % 360;
  const g = ((((357.528 + 0.9856003 * n) % 360) + 360) % 360) * RAD;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD;
  const eps = (23.439 - 0.0000004 * n) * RAD;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda)) / RAD;
  let ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / RAD;
  ra = ((ra % 360) + 360) % 360;
  const eotDeg = ((L - ra + 540) % 360) - 180;
  return { decl, eotMin: eotDeg * 4 };
}

/** Hours between solar noon and the moment the sun sits at `altitude` degrees. */
function hourAngle(lat: number, decl: number, altitude: number): number | null {
  const cosH =
    (Math.sin(altitude * RAD) - Math.sin(lat * RAD) * Math.sin(decl * RAD)) /
    (Math.cos(lat * RAD) * Math.cos(decl * RAD));
  if (cosH > 1 || cosH < -1) return null;
  return Math.acos(cosH) / RAD / 15;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export const PRAYER_ORDER = [
  { id: "fajr", label: "الفجر" },
  { id: "sunrise", label: "الشروق" },
  { id: "dhuhr", label: "الظهر" },
  { id: "asr", label: "العصر" },
  { id: "maghrib", label: "المغرب" },
  { id: "isha", label: "العشاء" },
] as const;

export type PrayerId = (typeof PRAYER_ORDER)[number]["id"];

function fmt(hours: number): string {
  let m = Math.round(hours * 60);
  m = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** All six times for one day, as "HH:MM" in the device's own clock (DST included). */
export function prayerTimes(loc: PrayerLocation, date = new Date()): PrayerTimes {
  const noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  const { decl, eotMin } = sunPosition(noon);
  const tz = -noon.getTimezoneOffset() / 60;
  const dhuhrH = 12 - eotMin / 60 - loc.lng / 15 + tz;
  const asrAlt = Math.atan(1 / (1 + Math.tan(Math.abs(loc.lat - decl) * RAD))) / RAD;
  const h = (alt: number) => hourAngle(loc.lat, decl, alt);
  const fajrH = h(-19.5) ?? 0;
  const riseH = h(-0.833) ?? 0;
  const asrH = h(asrAlt) ?? 0;
  const magH = h(-0.833) ?? 0;
  const ishaH = h(-17.5) ?? 0;
  return {
    fajr: fmt(dhuhrH - fajrH),
    sunrise: fmt(dhuhrH - riseH),
    dhuhr: fmt(dhuhrH),
    asr: fmt(dhuhrH + asrH),
    maghrib: fmt(dhuhrH + magH),
    isha: fmt(dhuhrH + ishaH),
  };
}

function atToday(hhmm: string, ref: Date): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), h || 0, m || 0, 0);
}

/** The next prayer (tomorrow's Fajr after Isha) and the minutes left until it. */
export function nextPrayer(
  times: PrayerTimes,
  now = new Date(),
): { id: PrayerId; label: string; at: Date; mins: number } {
  for (const p of PRAYER_ORDER) {
    const at = atToday(times[p.id], now);
    if (at.getTime() > now.getTime())
      return { id: p.id, label: p.label, at, mins: Math.max(0, Math.round((at.getTime() - now.getTime()) / 60000)) };
  }
  // Tomorrow by calendar date, not +24h: on the DST spring-forward night +24h lands a day late.
  const at = atToday(times.fajr, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  return { id: "fajr", label: "الفجر", at, mins: Math.round((at.getTime() - now.getTime()) / 60000) };
}

/** "١ ساعة و١٥ دقيقة" style duration. */
export function durationAr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const AR = "٠١٢٣٤٥٦٧٨٩";
  const d = (n: number) => String(n).replace(/[0-9]/g, (x) => AR[Number(x)] ?? x);
  if (h && m) return `${d(h)} ساعة و${d(m)} دقيقة`;
  if (h) return `${d(h)} ساعة`;
  return `${d(m)} دقيقة`;
}
