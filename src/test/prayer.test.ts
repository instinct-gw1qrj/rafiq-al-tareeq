import { describe, expect, it } from "vitest";
import { GOVERNORATES, nextPrayer, prayerTimes } from "@/lib/prayer";

const cairo = GOVERNORATES[0]!;

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

describe("prayer times (offline astronomy)", () => {
  it("keeps the six times in daily order", () => {
    const t = prayerTimes(cairo, new Date(2026, 5, 21));
    const seq = [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map(toMin);
    for (let i = 1; i < seq.length; i++) expect(seq[i]!).toBeGreaterThan(seq[i - 1]!);
  });

  it("gives Cairo a ~14h day at the June solstice and ~10h at the December solstice", () => {
    const summer = prayerTimes(cairo, new Date(2026, 5, 21));
    const winter = prayerTimes(cairo, new Date(2026, 11, 21));
    const dayLen = (t: typeof summer) => (toMin(t.maghrib) - toMin(t.sunrise) + 1440) % 1440;
    expect(dayLen(summer)).toBeGreaterThan(13 * 60);
    expect(dayLen(summer)).toBeLessThan(15 * 60);
    expect(dayLen(winter)).toBeGreaterThan(9 * 60 + 30);
    expect(dayLen(winter)).toBeLessThan(11 * 60);
  });

  it("points to the next prayer, and tomorrow's Fajr after Isha", () => {
    const times = { fajr: "04:00", sunrise: "05:45", dhuhr: "12:10", asr: "15:40", maghrib: "18:50", isha: "20:20" };
    const mid = nextPrayer(times, new Date(2026, 5, 21, 5, 30));
    expect(mid.label).toBe("الشروق");
    const late = nextPrayer(times, new Date(2026, 5, 21, 22, 0));
    expect(late.label).toBe("الفجر");
    expect(late.mins).toBeGreaterThan(300);
  });
});
