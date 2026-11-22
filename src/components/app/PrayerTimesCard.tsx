import { useEffect, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { selectClass } from "@/components/app/Field";
import { toArabicDigits } from "@/lib/arabic";
import { durationAr, GOVERNORATES, governorateFor, nextPrayer, prayerTimes, PRAYER_ORDER } from "@/lib/prayer";
import { useSettings } from "@/lib/settings";

/** Prayer times for the user's governorate, computed on the device — no internet. */
export function PrayerTimesCard() {
  const [s, update] = useSettings();
  const loc = governorateFor(s.governorate);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const times = prayerTimes(loc, now);
  const next = nextPrayer(times, now);

  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-bold"><Clock className="size-5 text-anis" /> مواقيت الصلاة</h2>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" /> {loc.name}</span>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-foreground/85">محافظتك</span>
        <select
          value={GOVERNORATES.some((g) => g.name === s.governorate) ? s.governorate : loc.name}
          onChange={(e) => update({ governorate: e.target.value })}
          className={selectClass}
        >
          {GOVERNORATES.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-3 gap-2 text-center">
        {PRAYER_ORDER.map((p) => {
          const active = p.id === next.id;
          return (
            <div
              key={p.id}
              className={`rounded-2xl p-2.5 ${active ? "bg-anis text-primary-foreground" : "bg-anis-soft text-anis"}`}
            >
              <p className="text-xs font-semibold">{p.label}</p>
              <p className="text-base font-bold" dir="ltr">{toArabicDigits(times[p.id])}</p>
            </div>
          );
        })}
      </div>
      <p className="rounded-2xl bg-muted p-3 text-center text-sm font-medium">
        باقي على {next.label}: {durationAr(next.mins)}
      </p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        الأوقات محسوبة فلكياٌ على جهازك بدون إنترنت (قواعد هيئة المساحة المصرية) — قد تختلف دقيقة أو اتنين عن الأذان الرسمي.
      </p>
    </div>
  );
}
