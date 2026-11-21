import { readStore, useStore, writeStore } from "./storage";

export interface Stats {
  opens: number;
  days: Record<string, number>; // yyyy-mm-dd -> opens
  sections: Record<string, number>;
  firstOpen: string;
}
export const STATS_KEY = "rafiq.stats.v1";
const EMPTY: Stats = { opens: 0, days: {}, sections: {}, firstOpen: "" };

export const SECTION_LABELS: Record<string, string> = {
  home: "الرئيسية",
  transport: "دليل الطريق",
  trip: "رحلتي",
  anis: "أنيس الطريق",
  medical: "إسعافات",
  sos: "طوارئ",
  places: "الاستراحات والأماكن",
  assistant: "اسأل رفيق",
  settings: "الإعدادات",
};

function day(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function recordOpen(now = new Date()) {
  const s = { ...EMPTY, ...readStore<Stats>(STATS_KEY, EMPTY) };
  const k = day(now);
  writeStore<Stats>(STATS_KEY, {
    ...s,
    opens: s.opens + 1,
    days: { ...s.days, [k]: (s.days[k] ?? 0) + 1 },
    firstOpen: s.firstOpen || now.toISOString(),
  });
}

export function sectionOf(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0] ?? "home";
  return seg in SECTION_LABELS ? seg : null;
}

export function recordSection(pathname: string) {
  const sec = sectionOf(pathname);
  if (!sec) return;
  const s = { ...EMPTY, ...readStore<Stats>(STATS_KEY, EMPTY) };
  writeStore<Stats>(STATS_KEY, { ...s, sections: { ...s.sections, [sec]: (s.sections[sec] ?? 0) + 1 } });
}

export function useStats() {
  const [s] = useStore<Stats>(STATS_KEY, EMPTY);
  return { ...EMPTY, ...s };
}
