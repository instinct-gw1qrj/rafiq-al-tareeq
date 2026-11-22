import { createFileRoute } from "@tanstack/react-router";
import { Info, TrainFront, Ticket, Clock } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/app/Chip";
import { PageHeader } from "@/components/app/PageHeader";
import { METRO_FARES, METRO_HOURS, METRO_LINES, TRAIN_ROUTES, TRAIN_TIPS } from "@/data/transit";
import { pageHead } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transit")({
  head: () =>
    pageHead(
      "مترو وقطارات",
      "خطوط المترو الثلاث ومحطاتها وأسعار التذاكر، وخطوط القطارات الأساسية بمواعيدها — دليل محفوظ يعمل بدون إنترنت.",
    ),
  component: TransitPage,
});

function TransitPage() {
  const [lineId, setLineId] = useState(METRO_LINES[0]!.id);
  const line = METRO_LINES.find((l) => l.id === lineId) ?? METRO_LINES[0]!;
  return (
    <div className="space-y-5">
      <PageHeader title="مترو وقطارات" subtitle="دليلك على السكة — حتى من غير نت" icon={TrainFront} tone="road" />

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-bold">مترو الأنفاق</h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {METRO_LINES.map((l) => (
            <Chip key={l.id} active={l.id === lineId} onClick={() => setLineId(l.id)}>{l.name}</Chip>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("size-3 rounded-full", line.swatch)} />
          <p className="text-sm font-bold">{line.endpoints}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {line.stationsCount} محطة · {line.lengthKm} كم — {line.note}
        </p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          {line.stations.map((s, i) => (
            <li key={s} className="flex items-baseline gap-1.5 rounded-lg bg-muted px-2 py-1">
              <span className="text-[10px] text-muted-foreground">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted-foreground">
          باقي محطات الخط بتظهر على خرائط المحطات — الخطوط دي داخلاً التطبيق ومحفوظة على جهازك.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><Ticket className="size-5 text-gold" /> أسعار تذاكر المترو</h2>
        <ul className="space-y-1.5">
          {METRO_FARES.map((f) => (
            <li key={f.range} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
              <span>{f.range}</span>
              <span className="font-bold text-gold">{f.price}</span>
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" /> {METRO_HOURS}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 px-1 font-bold"><TrainFront className="size-5 text-road" /> قطارات السكك الحديدية</h2>
        {TRAIN_ROUTES.map((r) => (
          <div key={r.id} className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-bold text-road">{r.name}</h3>
            <p className="text-xs text-muted-foreground">{r.duration}</p>
            <ul className="space-y-1">
              {r.samples.map((s) => (
                <li key={s.train} className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5 text-sm">
                  <span className="font-medium">{s.train}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">{s.from} ← {s.to}</span>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-1.5">
              {r.fares.map((f) => (
                <li key={f.cls} className="rounded-full bg-gold-soft px-3 py-1 text-xs font-medium">{f.cls}: {f.price}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="space-y-2 rounded-3xl bg-muted p-4">
          <p className="flex items-center gap-2 text-sm font-bold"><Info className="size-4" /> ملاحظات</p>
          {TRAIN_TIPS.map((t) => <p key={t} className="text-xs leading-relaxed text-muted-foreground">• {t}</p>)}
        </div>
      </section>
    </div>
  );
}
