import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Coins, HeartHandshake, MapPin, Navigation, Radar, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AdSlot } from "@/components/app/AdSlot";
import { Field, selectClass } from "@/components/app/Field";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changeDue } from "@/lib/ads";
import { formatFare, toArabicDigits } from "@/lib/arabic";
import { alertStage, distanceKm, PLACES, type Place } from "@/lib/geo";
import { pageHead } from "@/lib/seo";
import { useSettings } from "@/lib/settings";
import { getCurrentCoords, mapsLink, smsLink, whatsappLink } from "@/lib/sos";

export const Route = createFileRoute("/trip")({
  head: () => pageHead("رحلتي", "منبه الوجهة بالـ GPS، رادار المعالم، زر وصلت بالسلامة، وحاسبة الفكة."),
  component: TripPage,
});

function notify(title: string, body: string) {
  toast(title, { description: body, duration: 8000 });
  if ("vibrate" in navigator) navigator.vibrate?.([300, 150, 300]);
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/icons/icon-192.png" }); } catch { /* ignore */ }
  }
}

function TripPage() {
  const [s] = useSettings();
  const [destName, setDestName] = useState(PLACES[0].name);
  const [custom, setCustom] = useState<Place | null>(null);
  const [watching, setWatching] = useState(false);
  const [km, setKm] = useState<number | null>(null);
  const [nearby, setNearby] = useState<string[]>([]);
  const watchId = useRef<number | null>(null);
  const fired = useRef<Set<string>>(new Set());
  const dest = custom ?? PLACES.find((p) => p.name === destName)!;

  const stop = () => {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null; setWatching(false);
  };
  useEffect(() => stop, []);

  const start = async () => {
    if (!navigator.geolocation) return toast.error("الجهاز لا يدعم تحديد الموقع");
    if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission().catch(() => {});
    fired.current = new Set();
    setWatching(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const d = distanceKm(here, dest);
        setKm(d);
        const stage = alertStage(d);
        if (stage !== "far" && !fired.current.has(stage)) {
          fired.current.add(stage);
          notify(stage === "near" ? "قربت توصل 🚏" : "وصلت وجهتك ✅", stage === "near" ? `باقي حوالي ${toArabicDigits(d.toFixed(1))} كم على ${dest.name}، استعد للنزول` : `أنت الآن عند ${dest.name}`);
        }
        const close = PLACES.filter((p) => p.name !== dest.name && distanceKm(here, p) < 5).map((p) => p.name);
        setNearby(close);
        close.forEach((n) => { if (!fired.current.has(n)) { fired.current.add(n); notify("أنت بجوار", n); } });
      },
      () => { toast.error("فعّل خدمة الموقع (GPS) للمتابعة"); stop(); },
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
  };

  const saveHere = async () => {
    const c = await getCurrentCoords();
    if (!c) return toast.error("تعذّر تحديد الموقع");
    setCustom({ name: "مكان حفظته", lat: c.lat, lng: c.lng, kind: "landmark" });
    toast.success("تم حفظ موقعك الحالي كوجهة");
  };

  const arrived = async (via: "sms" | "wa") => {
    if (!s.emergencyNumber) return toast.error("سجّل رقم الطوارئ من الإعدادات");
    const c = await getCurrentCoords(8000);
    const body = `الحمد لله ${s.userName ? `(${s.userName}) ` : ""}وصلت ${dest?.name ?? "وجهتي"} بالسلامة 🤍${c ? `\nموقعي: ${mapsLink(c)}` : ""}\n— رفيق الطريق`;
    window.location.href = via === "sms" ? smsLink(s.emergencyNumber, body) : whatsappLink(s.emergencyNumber, body);
  };

  const [paid, setPaid] = useState("100");
  const [fare, setFare] = useState("10");
  const [people, setPeople] = useState("1");
  const rest = changeDue(Number(paid) || 0, Number(fare) || 0, Number(people) || 1);

  return (
    <div className="space-y-5">
      <PageHeader title="رحلتي" subtitle="منبه الوجهة وأمان المشوار" icon={Navigation} tone="road" />

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><BellRing className="size-5 text-road" /> منبه الوجهة</h2>
        <Field label="رايح فين؟">
          <select value={custom ? "" : destName} onChange={(e) => { setCustom(null); setDestName(e.target.value); }} className={selectClass} disabled={watching}>
            {custom && <option value="">{custom.name}</option>}
            {PLACES.map((p) => <option key={p.name}>{p.name}</option>)}
          </select>
        </Field>
        <Button variant="outline" size="sm" onClick={saveHere} disabled={watching}><MapPin /> احفظ مكاني الحالي كوجهة للرجوع</Button>
        {watching ? (
          <Button onClick={stop} variant="destructive" className="h-12 w-full"><Square /> إيقاف المتابعة</Button>
        ) : (
          <Button onClick={start} className="h-12 w-full"><Navigation /> ابدأ المتابعة</Button>
        )}
        {km != null && (
          <p className="rounded-2xl bg-road-soft p-3 text-center font-bold text-road">
            المسافة المتبقية: {toArabicDigits(km.toFixed(1))} كم
          </p>
        )}
        <p className="text-xs text-muted-foreground">هننبهك قبل الوصول بـ ٣ كم وعند الوصول. خلي الشاشة مفتوحة أثناء الرحلة.</p>
      </section>

      <section className="space-y-2 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><Radar className="size-5 text-anis" /> رادار المعالم</h2>
        {nearby.length ? nearby.map((n) => <p key={n} className="text-sm">📍 {n}</p>) : <p className="text-sm text-muted-foreground">ابدأ المتابعة وهنعرّفك بالأماكن المشهورة اللي بتعدي جنبها.</p>}
      </section>

      <section className="space-y-3 rounded-3xl border border-success/30 bg-success-soft p-5">
        <h2 className="flex items-center gap-2 font-bold text-success"><HeartHandshake className="size-5" /> وصلت بالسلامة</h2>
        <p className="text-sm text-muted-foreground">طمّن {s.emergencyName || "أهلك"} برسالة واحدة فيها موقعك.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => void arrived("wa")} className="h-12">واتساب</Button>
          <Button onClick={() => void arrived("sms")} variant="outline" className="h-12">رسالة SMS</Button>
        </div>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><Coins className="size-5 text-gold" /> حاسبة الفكة</h2>
        <div className="grid grid-cols-3 gap-2">
          <Field label="معاك"><Input value={paid} onChange={(e) => setPaid(e.target.value)} inputMode="decimal" className="h-11" /></Field>
          <Field label="الأجرة"><Input value={fare} onChange={(e) => setFare(e.target.value)} inputMode="decimal" className="h-11" /></Field>
          <Field label="الركاب"><Input value={people} onChange={(e) => setPeople(e.target.value)} inputMode="numeric" className="h-11" /></Field>
        </div>
        <p className={rest >= 0 ? "rounded-2xl bg-primary-soft p-3 text-center font-bold text-primary" : "rounded-2xl bg-sos-soft p-3 text-center font-bold text-sos"}>
          {rest >= 0 ? `الباقي لك: ${formatFare(rest)}` : `ناقصك: ${formatFare(-rest)}`}
        </p>
        <AdSlot />
      </section>
    </div>
  );
}
