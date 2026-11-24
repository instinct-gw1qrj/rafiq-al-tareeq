import { describe, expect, it } from "vitest";
import { normalizeArabic } from "@/lib/arabic";
import { localAnswer } from "@/lib/offline-brain";
import { SEED_ROUTES } from "@/lib/transport";

const ctx = { routes: SEED_ROUTES, governorate: "الشرقية", now: new Date(2026, 10, 24, 10, 0) };
const ask = (q: string) => localAnswer(q, ctx);

describe("offline assistant (no network)", () => {
  it("answers first-aid questions with the saved steps", () => {
    const a = ask("أعمل إيه في ضربة الشمس؟");
    expect(a).toContain("ضربة الشمس");
    expect(a).toContain("1.");
  });

  it("answers emergency-number questions with the official numbers", () => {
    expect(ask("رقم الإسعاف كام؟")).toContain("123");
    expect(ask("أرقام الطوارئ")).toContain("122");
  });

  it("computes prayer times on-device and names the next prayer", () => {
    const a = ask("مواقيت الصلاة النهاردة؟");
    expect(a).toContain("الفجر");
    expect(a).toContain("العشاء");
    expect(a).toContain("الصلاة الجاية");
  });

  it("serves travel adhkar from the saved collection", () => {
    const a = normalizeArabic(ask("دعاء السفر"));
    expect(a).toContain(normalizeArabic("أذكار السفر والطريق"));
    expect(a).toContain(normalizeArabic("سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا"));
  });

  it("answers metro questions from the saved transit reference", () => {
    const a = ask("محطات الخط الثالث للمترو");
    expect(a).toContain("الخط الثالث");
    expect(a).toContain("العتبة");
  });

  it("matches route questions against the saved lines", () => {
    const a = ask("إزاي أروح كلية الزراعة؟");
    expect(a).toContain("كلية الزراعة");
    expect(a).toContain("الإجمالي");
  });

  it("says clearly what it can do when nothing matches", () => {
    expect(ask("ما هو معنى الحياة؟")).toContain("من غير نت");
  });
});
