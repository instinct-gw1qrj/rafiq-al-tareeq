import { createFileRoute } from "@tanstack/react-router";
import { HeartPulse, Phone } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/app/Chip";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { FIRST_AID } from "@/data/medical";
import { toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/medical")({
  head: () => pageHead("إسعافات أولية", "إرشادات سريعة ومبسطة للإغماء والحوادث والغثيان والاختناق."),
  component: MedicalPage,
});

function MedicalPage() {
  const [id, setId] = useState(FIRST_AID[0]!.id);
  const c = FIRST_AID.find((x) => x.id === id) ?? FIRST_AID[0]!;
  return (
    <div className="space-y-5">
      <PageHeader title="إسعافات أولية" subtitle="تصرّف صحيح في ثوانٍ" icon={HeartPulse} tone="med" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FIRST_AID.map((x) => <Chip key={x.id} active={x.id === id} onClick={() => setId(x.id)}>{x.title}</Chip>)}
      </div>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="text-xl font-bold">{c.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{c.short}</p>
        <ol className="space-y-3">
          {c.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-med text-sm font-bold text-primary-foreground">{toArabicDigits(i + 1)}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {c.extra && (
          <div className="mt-4 rounded-2xl bg-med-soft p-4">
            <h3 className="mb-2 font-bold">{c.extra.title}</h3>
            <ul className="list-inside list-disc space-y-1 text-sm">{c.extra.steps.map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
        )}
      </section>
      <section className="rounded-3xl bg-gold-soft p-5">
        <h3 className="mb-2 font-bold">تجنّب</h3>
        <ul className="list-inside list-disc space-y-1 text-sm">{c.avoid.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <section className="rounded-3xl bg-sos-soft p-5">
        <h3 className="mb-2 font-bold text-sos">اطلب الإسعاف فوراً إذا</h3>
        <ul className="mb-4 list-inside list-disc space-y-1 text-sm">{c.callWhen.map((s, i) => <li key={i}>{s}</li>)}</ul>
        <Button variant="sos" size="xl" className="w-full" asChild><a href="tel:123"><Phone /> اتصل بالإسعاف ١٢٣</a></Button>
      </section>
    </div>
  );
}
