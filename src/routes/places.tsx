import { createFileRoute } from "@tanstack/react-router";
import { CloudFog, Search, Store } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/app/Chip";
import { PageHeader } from "@/components/app/PageHeader";
import { PlaceCard } from "@/components/app/PlaceCard";
import { Input } from "@/components/ui/input";
import { filterPlaces, PLACE_KIND_LABELS, PLACE_KINDS, usePlaces, type PlaceKind } from "@/lib/places";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/places")({
  head: () =>
    pageHead(
      "الاستراحات والأماكن الموصى بها",
      "دليل استراحات الطرق والمساجد والمطاعم والبنزينات الموصى بها للمسافرين، مع إرشادات الشبورة — يعمل بدون إنترنت.",
    ),
  component: PlacesPage,
});

const FOG_TIPS = [
  "في الشبورة شغّل الكشافات الأمامية الواطية وإشارات الانتظار، وما تستخدمش الكشاف العالي.",
  "هدّي السرعة وسيب مسافة كبيرة بينك وبين العربية اللي قدامك.",
  "لو الرؤية انعدمت، اطلع على يمين الطريق بعيد عن الحارة وشغّل الإشارات وانزل بعيد عن الأسفلت.",
  "في أي عطل على الطريق السريع، حط المثلث العاكس ورا العربية بمسافة كافية واستنى بعيد عن الطريق.",
  "لو راكب ميكروباص والسواق مسرّع في الشبورة، اطلب منه يهدّي بهدوء — سلامتك أهم.",
];

function PlacesPage() {
  const [places] = usePlaces();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PlaceKind | "all">("all");
  const list = filterPlaces(places, { query, kind });
  return (
    <div className="space-y-5">
      <PageHeader title="الاستراحات والأماكن" subtitle="أماكن موصى بها على طريقك" icon={Store} tone="gold" back={{ to: "/", label: "الرئيسية" }} />
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم مكان أو مدينة أو طريق" className="h-12 pr-9" />
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={kind === "all"} onClick={() => setKind("all")}>الكل</Chip>
        {PLACE_KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{PLACE_KIND_LABELS[k]}</Chip>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">لا توجد أماكن مطابقة بعد.</p>
      ) : (
        <ul className="space-y-3">{list.map((p) => <PlaceCard key={p.id} p={p} />)}</ul>
      )}
      <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="flex items-center gap-2 font-bold"><CloudFog className="size-5 text-road" /> الشبورة وأمان الطريق السريع</h2>
        <ul className="list-disc space-y-2 pr-5 text-sm leading-relaxed">{FOG_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="grid grid-cols-3 gap-2 text-center text-sm font-bold">
          <a href="tel:122" className="rounded-xl bg-sos-soft p-2 text-sos">النجدة ١٢٢</a>
          <a href="tel:123" className="rounded-xl bg-sos-soft p-2 text-sos">الإسعاف ١٢٣</a>
          <a href="tel:180" className="rounded-xl bg-sos-soft p-2 text-sos">المطافي ١٨٠</a>
        </div>
      </section>
    </div>
  );
}
