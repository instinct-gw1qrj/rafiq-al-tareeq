import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, Eye, EyeOff, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Field } from "@/components/app/Field";
import { CloudVisitors, OwnerCloud } from "@/components/app/OwnerCloud";
import { PlaceCard } from "@/components/app/PlaceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adsSwitch, applyAdminActions, applyPlaceActions, describeAction } from "@/lib/admin-actions";
import { askAdmin, type AdminAction } from "@/lib/ai.functions";
import { useAds } from "@/lib/ads";
import { toArabicDigits } from "@/lib/arabic";
import { makePlace, PLACE_KIND_LABELS, PLACE_KINDS, usePlaces, type PlaceKind } from "@/lib/places";
import { SECTION_LABELS, useStats } from "@/lib/stats";
import { useRoutes } from "@/lib/use-transport";

const EXAMPLES = [
  "ضيف إعلان لمطعم الريف في بنها على الطريق الزراعي، خصم ١٠٪ للركاب، رقمه 01000000000",
  "عدّل أجرة الميكروباص في خط رمسيس خليها ١٥ جنيه",
  "ضيف خط من الزقازيق للمنصورة ميكروباص بـ ٢٥ جنيه من موقف المنصورة",
];

export function AdminAI() {
  const [routes, setRoutes] = useRoutes();
  const [places, setPlaces] = usePlaces();
  const [, setAds] = useAds();
  const ask = useServerFn(askAdmin);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ reply: string; actions: AdminAction[] } | null>(null);

  const submit = async () => {
    if (!cmd.trim()) return;
    if (!navigator.onLine) {
      toast.error("المساعد الذكي محتاج إنترنت. باقي لوحة التحكم شغالة بدون نت.");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r = await ask({ data: { command: cmd.trim(), routes: JSON.stringify(routes).slice(0, 79000), places: JSON.stringify(places).slice(0, 29000) } });
      if (!r.ok) toast.error(r.reply);
      else setResult({ reply: r.reply, actions: r.actions });
    } catch {
      toast.error("تعذّر الوصول للمساعد، حاولي تاني");
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    if (!result) return;
    setRoutes((prev) => applyAdminActions(prev, result.actions));
    setPlaces((prev) => applyPlaceActions(prev, result.actions));
    const ads = adsSwitch(result.actions);
    if (ads !== undefined) setAds({ enabled: ads });
    toast.success("تم التنفيذ — اضغطي «انشري التعديلات» عشان توصل للكل");
    setResult(null);
    setCmd("");
  };

  return (
    <div className="space-y-4">
      <OwnerCloud />
      <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><Bot className="size-5 text-anis" /> قولي للمساعد عايزة تعملي إيه</h2>
        <Textarea value={cmd} onChange={(e) => setCmd(e.target.value)} rows={4} placeholder="مثلاً: ضيف إعلان لكافيه … على طريق … بعرض …" />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} type="button" onClick={() => setCmd(e)} className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
              {e.slice(0, 38)}…
            </button>
          ))}
        </div>
        <Button size="xl" className="w-full" onClick={() => void submit()} disabled={busy || !cmd.trim()}>
          <Sparkles /> {busy ? "المساعد بيجهّز…" : "جهّز التعديل"}
        </Button>
      </div>
      {result && (
        <div className="space-y-3 rounded-3xl border border-gold/50 bg-card p-5 shadow-soft">
          {result.reply && <p className="whitespace-pre-line text-sm leading-relaxed">{result.reply}</p>}
          {result.actions.length > 0 ? (
            <>
              <ul className="space-y-1.5 rounded-xl bg-muted p-3 text-sm">
                {result.actions.map((a, i) => <li key={i}>• {describeAction(a, routes, places)}</li>)}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={confirm}><Check /> تأكيد وتنفيذ</Button>
                <Button variant="outline" onClick={() => setResult(null)}><X /> إلغاء</Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">مفيش تعديلات مطلوبة في الرد ده.</p>
          )}
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = { name: "", kind: "food" as PlaceKind, area: "", road: "", offer: "", phone: "", sponsored: true };

export function PlacesManager() {
  const [places, setPlaces] = usePlaces();
  const [f, setF] = useState(EMPTY_FORM);
  const set = (p: Partial<typeof EMPTY_FORM>) => setF((x) => ({ ...x, ...p }));
  return (
    <div className="space-y-4">
      <form
        className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft"
        onSubmit={(e) => {
          e.preventDefault();
          if (!f.name.trim()) {
            toast.error("اكتبي اسم المكان");
            return;
          }
          setPlaces((prev) => [makePlace({ ...f, name: f.name.trim() }), ...prev]);
          setF(EMPTY_FORM);
          toast.success("تمت إضافة المكان");
        }}
      >
        <h2 className="flex items-center gap-2 font-bold"><Plus className="size-5 text-primary" /> إضافة مكان موصى به</h2>
        <Field label="اسم المكان"><Input value={f.name} onChange={(e) => set({ name: e.target.value })} className="h-11" /></Field>
        <Field label="النوع">
          <select value={f.kind} onChange={(e) => set({ kind: e.target.value as PlaceKind })} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
            {PLACE_KINDS.map((k) => <option key={k} value={k}>{PLACE_KIND_LABELS[k]}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="المدينة"><Input value={f.area} onChange={(e) => set({ area: e.target.value })} className="h-11" /></Field>
          <Field label="الطريق"><Input value={f.road} onChange={(e) => set({ road: e.target.value })} className="h-11" /></Field>
        </div>
        <Field label="العرض أو الوصف"><Textarea value={f.offer} onChange={(e) => set({ offer: e.target.value })} rows={2} /></Field>
        <Field label="رقم التليفون"><Input value={f.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className="h-11" /></Field>
        <label className="flex items-center justify-between text-sm font-medium">
          يظهر كـ «موصى به» (إعلان مدفوع)
          <Switch checked={f.sponsored} onCheckedChange={(v) => set({ sponsored: v })} />
        </label>
        <Button type="submit" size="xl" className="w-full">إضافة</Button>
      </form>
      <ul className="space-y-3">
        {places.map((p) => (
          <div key={p.id} className={p.active ? "" : "opacity-50"}>
            <PlaceCard p={p} />
            <div className="mt-1 flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => setPlaces((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !x.active } : x)))}>
                {p.active ? <><EyeOff /> إخفاء</> : <><Eye /> إظهار</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.confirm(`حذف ${p.name}؟`) && setPlaces((prev) => prev.filter((x) => x.id !== p.id))}>
                <Trash2 className="text-sos" /> حذف
              </Button>
            </div>
          </div>
        ))}
      </ul>
    </div>
  );
}

export function AdsManager() {
  const [ads, setAds] = useAds();
  return (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <label className="flex items-center justify-between font-bold">
        تشغيل الإعلانات
        <Switch checked={ads.enabled} onCheckedChange={(v) => setAds({ enabled: v })} />
      </label>
      <p className="text-xs text-muted-foreground">إعلانات جوجل بتظهر بس لما يكون فيه نت. «الأماكن الموصى بها» بتظهر دايماً حتى بدون نت.</p>
      <Field label="كود جوجل أدسنس (ca-pub-…)"><Input dir="ltr" value={ads.adsenseClient} onChange={(e) => setAds({ adsenseClient: e.target.value })} className="h-11" /></Field>
      <Field label="رقم الوحدة الإعلانية (Slot)"><Input dir="ltr" value={ads.adsenseSlot} onChange={(e) => setAds({ adsenseSlot: e.target.value })} className="h-11" /></Field>
      <Field label="نص راعي محلي (لو مفيش كود جوجل)"><Input value={ads.sponsorText} onChange={(e) => setAds({ sponsorText: e.target.value })} className="h-11" /></Field>
      <Field label="رابط الراعي"><Input dir="ltr" value={ads.sponsorLink} onChange={(e) => setAds({ sponsorLink: e.target.value })} className="h-11" /></Field>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        الإعلان يتبع وجهة الرحلة (رايح بنها → إعلان طريق الزراعي)
        <Switch checked={ads.targetByDestination} onCheckedChange={(v) => setAds({ targetByDestination: v })} />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        الإعلان يتبع محافظة المستخدم
        <Switch checked={ads.targetByGovernorate} onCheckedChange={(v) => setAds({ targetByGovernorate: v })} />
      </label>
    </div>
  );
}

export function StatsPanel({ extra = <CloudVisitors /> }: { extra?: ReactNode }) {
  const s = useStats();
  const top = Object.entries(s.sections).sort((a, b) => b[1] - a[1]);
  const today = s.days[new Date().toISOString().slice(0, 10)] ?? 0;
  return (
    <div className="space-y-3">
      {extra}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-3 font-bold">على الجهاز ده</h2>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-primary-soft p-3"><p className="text-2xl font-bold text-primary">{toArabicDigits(s.opens)}</p><p className="text-xs">مرات الفتح</p></div>
          <div className="rounded-2xl bg-gold-soft p-3"><p className="text-2xl font-bold">{toArabicDigits(today)}</p><p className="text-xs">النهارده</p></div>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {top.map(([k, v]) => (
            <li key={k} className="flex justify-between rounded-lg bg-muted px-3 py-1.5"><span>{SECTION_LABELS[k] ?? k}</span><span>{toArabicDigits(v)}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
