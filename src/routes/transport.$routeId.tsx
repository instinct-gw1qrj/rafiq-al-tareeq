import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Calculator, Info, MapPin, MessageSquarePlus, PencilLine, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/app/FavoriteButton";
import { VehicleIcon } from "@/components/app/VehicleIcon";
import { Button } from "@/components/ui/button";
import { formatFare, toArabicDigits } from "@/lib/arabic";
import { uid } from "@/lib/storage";
import { routeTotal, SCOPE_LABELS, VEHICLE_LABELS } from "@/lib/transport";
import { useCalc, useRoutes } from "@/lib/use-transport";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/transport/$routeId")({
  head: () => ({
    meta: [
      { title: "تفاصيل الخط | رفيق الطريق" },
      { name: "description", content: "مراحل الركوب بالترتيب، مكان الموقف، والأجرة الرسمية لكل مرحلة." },
      { property: "og:title", content: "تفاصيل الخط | رفيق الطريق" },
      { property: "og:description", content: "مراحل الركوب بالترتيب، مكان الموقف، والأجرة الرسمية لكل مرحلة." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RouteDetail,
});

function RouteDetail() {
  const { routeId } = Route.useParams();
  const [routes] = useRoutes();
  const [, setCalc] = useCalc();
  const navigate = useNavigate();
  const route = routes.find((r) => r.id === routeId);

  if (!route) {
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center">
        <p className="font-semibold">هذا الخط غير موجود</p>
        <Link to="/transport" className="mt-3 inline-block text-sm font-medium text-primary">
          العودة لدليل الطريق
        </Link>
      </div>
    );
  }

  const total = routeTotal(route);

  const addToCalc = () => {
    setCalc((prev) => ({
      ...prev,
      legs: [
        ...prev.legs,
        ...route.stages.map((s) => ({
          id: uid(),
          label: `${s.from} ← ${s.to}`,
          vehicle: s.vehicle,
          fare: s.fare,
        })),
      ],
    }));
    toast.success("أُضيفت مراحل الخط إلى الحاسبة");
    void navigate({ to: "/transport/calculator" });
  };

  const share = async () => {
    const text = [
      `${route.from} ← ${route.to}`,
      `الموقف: ${route.station}`,
      ...route.stages.map((s, i) => `${i + 1}. ${VEHICLE_LABELS[s.vehicle]}: ${s.from} ← ${s.to} (${s.fare} ج.م)`),
      `الإجمالي: ${total} ج.م`,
      "— من تطبيق رفيق الطريق",
    ].join("\n");
    try {
      if (navigator.share) await navigator.share({ title: "رفيق الطريق", text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success("تم نسخ تفاصيل الخط");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/transport" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground">
        <ChevronRight className="size-4" /> دليل الطريق
      </Link>

      <section className="bg-hero animate-rise rounded-3xl p-5 text-primary-foreground shadow-soft">
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-0.5">{SCOPE_LABELS[route.scope]}</span>
          {route.source === "documented" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5">
              <BadgeCheck className="size-3" /> موثّق من مصدر منشور
            </span>
          )}
          {route.source === "community" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-0.5">
              <Users className="size-3" /> من المجتمع
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">
            {route.from} ← {route.to}
          </h1>
          <FavoriteButton id={route.id} />
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-primary-foreground/85">
          <MapPin className="mt-0.5 size-4 shrink-0" /> مكان الموقف: {route.station}
        </p>
        <div className="mt-4 flex items-end justify-between border-t border-primary-foreground/20 pt-3">
          <span className="text-sm text-primary-foreground/80">إجمالي الأجرة الرسمية للفرد</span>
          <span className="text-3xl font-bold text-gold">{formatFare(total)}</span>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">مراحل الركوب بالترتيب</h2>
        <ol className="relative space-y-3 border-r-2 border-dashed border-road/30 pr-5">
          {route.stages.map((s, i) => (
            <li key={s.id} className="relative">
              <span className="absolute -right-[1.85rem] top-4 flex size-6 items-center justify-center rounded-full bg-road text-xs font-bold text-primary-foreground">
                {toArabicDigits(i + 1)}
              </span>
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-road-soft px-2.5 py-1 text-sm font-semibold text-road">
                    <VehicleIcon vehicle={s.vehicle} className="size-4" /> {VEHICLE_LABELS[s.vehicle]}
                  </span>
                  <span className="text-lg font-bold text-primary">{formatFare(s.fare)}</span>
                </div>
                <p className="mt-2 font-semibold text-foreground">
                  {s.from} ← {s.to}
                </p>
                {s.station && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> اركب من: {s.station}
                  </p>
                )}
                {s.note && <p className="mt-2 rounded-lg bg-gold-soft px-2.5 py-1.5 text-xs text-accent-foreground">{s.note}</p>}
                <Link
                  to="/transport/suggest"
                  search={{ kind: "price", routeId: route.id, stageId: s.id }}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <PencilLine className="size-3.5" /> السعر تغيّر؟ اقترح تعديلاً
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {route.notes.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 flex items-center gap-2 font-bold">
            <Info className="size-4 text-primary" /> ملاحظات
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-foreground/85">
            {route.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button size="xl" onClick={addToCalc}>
          <Calculator /> أضف للحاسبة
        </Button>
        <Button size="xl" variant="card" onClick={share}>
          <Share2 /> مشاركة
        </Button>
        <Button size="xl" variant="soft" className="col-span-2" asChild>
          <Link to="/transport/suggest" search={{ kind: "note", routeId: route.id }}>
            <MessageSquarePlus /> أضف ملاحظة لهذا الخط
          </Link>
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        آخر تحديث: {new Date(route.updatedAt).toLocaleDateString("ar-EG")}
      </p>
    </div>
  );
}
