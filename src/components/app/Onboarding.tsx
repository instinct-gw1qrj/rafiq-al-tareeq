import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanPhone, useSettings } from "@/lib/settings";
import { Field, selectClass } from "./Field";
import { Signature } from "./Signature";

export const GOVERNORATES = ["القاهرة","الجيزة","الإسكندرية","القليوبية","الغربية","كفر الشيخ","الدقهلية","الشرقية","المنوفية","البحيرة","دمياط","بورسعيد","الإسماعيلية","السويس","الفيوم","بني سويف","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","جنوب سيناء","شمال سيناء","مطروح","الوادي الجديد"];

/** First-run registration: shown until the traveler saves phone + emergency number. */
export function Onboarding() {
  const [s, update] = useSettings();
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({ userName: "", phone: "", emergencyNumber: "", emergencyName: "", emergencyRelation: "", governorate: "" });
  const [err, setErr] = useState("");
  useEffect(() => setReady(true), []);
  if (!ready || s.registered || s.emergencyNumber) return null;
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.userName.trim()) return setErr("اكتب اسمك");
    if (cleanPhone(f.phone).length < 10) return setErr("رقم هاتفك غير صحيح");
    if (cleanPhone(f.emergencyNumber).length < 10) return setErr("رقم الطوارئ غير صحيح");
    update({ ...f, registered: true });
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-5 py-8">
        <div className="rounded-3xl bg-hero p-6 text-center text-primary-foreground shadow-soft">
          <img src="/icons/icon-192.png" alt="" className="mx-auto mb-3 size-16 rounded-2xl" />
          <h1 className="font-display text-2xl font-bold">أهلاً بك في رفيق الطريق</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">سجّل بياناتك مرة واحدة ليحميك التطبيق في الطوارئ</p>
          <Signature tone="light" className="mt-4 text-sm" />
        </div>
        <div className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="flex items-center gap-2 font-bold"><UserRound className="size-5 text-primary" /> بياناتك</h2>
          <Field label="الاسم"><Input value={f.userName} onChange={set("userName")} className="h-11" /></Field>
          <Field label="رقم هاتفك"><Input value={f.phone} onChange={set("phone")} inputMode="tel" dir="ltr" className="h-11 text-left" placeholder="01xxxxxxxxx" /></Field>
          <Field label="المحافظة">
            <select value={f.governorate} onChange={set("governorate")} className={selectClass}>
              <option value="">اختر</option>
              {GOVERNORATES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="رقم الطوارئ (أقرب شخص لك)"><Input value={f.emergencyNumber} onChange={set("emergencyNumber")} inputMode="tel" dir="ltr" className="h-11 text-left" placeholder="01xxxxxxxxx" /></Field>
          <Field label="اسم صاحب الرقم"><Input value={f.emergencyName} onChange={set("emergencyName")} className="h-11" placeholder="مثلاً: محمد" /></Field>
          <Field label="صلة القرابة"><Input value={f.emergencyRelation} onChange={set("emergencyRelation")} className="h-11" placeholder="أخ / أم / زوج ..." /></Field>
          {err && <p className="text-sm font-medium text-destructive">{err}</p>}
          <Button type="submit" className="h-12 w-full text-base">ابدأ رحلتك</Button>
          <p className="text-center text-xs text-muted-foreground">بياناتك محفوظة على جهازك فقط</p>
        </div>
      </form>
    </div>
  );
}

export function ThemeSync() {
  const [s] = useSettings();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", s.theme === "dark");
  }, [s.theme]);
  return null;
}
