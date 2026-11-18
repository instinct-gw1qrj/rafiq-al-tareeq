import { createFileRoute, Link } from "@tanstack/react-router";
import { BusFront, Calculator, ChevronLeft, MapPin, MessageSquarePlus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Chip } from "@/components/app/Chip";
import { PageHeader } from "@/components/app/PageHeader";
import { VehicleIcon } from "@/components/app/VehicleIcon";
import { Input } from "@/components/ui/input";
import { formatFare, toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import {
  routeTotal,
  routeVehicles,
  SCOPE_LABELS,
  searchRoutes,
  VEHICLE_LABELS,
  type Scope,
  type Vehicle,
} from "@/lib/transport";
import { useRoutes } from "@/lib/use-transport";

export const Route = createFileRoute("/transport/")({
  head: () =>
    pageHead(
      "دليل الطريق والتسعيرة",
      "ابحث عن خطوط التوكتوك والسرفيس والميكروباص داخل المدينة وبين المراكز، مع مراحل الركوب ومكان الموقف والأجرة الرسمية.",
    ),
  component: TransportPage,
});

const VEHICLE_FILTERS: Vehicle[] = ["tuktuk", "service", "microbus", "bus", "train"];

function TransportPage() {
  const [routes] = useRoutes();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope | "all">("all");
  const [vehicle, setVehicle] = useState<Vehicle | "all">("all");

  const results = useMemo(() => searchRoutes(routes, { query, scope, vehicle }), [routes, query, scope, vehicle]);

  return (
    <div>
      <PageHeader title="دليل الطريق" subtitle="الخطوط، المواقف، والأجرة الرسمية" icon={BusFront} tone="road" />

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث: من أين وإلى أين؟ مثلاً: طنطا المحلة"
          className="h-12 rounded-2xl bg-card pr-11 text-base shadow-soft"
          aria-label="بحث عن خط"
        />
      </div>

      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={scope === "all"} onClick={() => setScope("all")}>الكل</Chip>
        <Chip active={scope === "internal"} onClick={() => setScope("internal")}>{SCOPE_LABELS.internal}</Chip>
        <Chip active={scope === "external"} onClick={() => setScope("external")}>{SCOPE_LABELS.external}</Chip>
      </div>
      <div className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={vehicle === "all"} onClick={() => setVehicle("all")}>كل الوسائل</Chip>
        {VEHICLE_FILTERS.map((v) => (
          <Chip key={v} active={vehicle === v} onClick={() => setVehicle(v)}>
            <VehicleIcon vehicle={v} className="size-4" />
            {VEHICLE_LABELS[v]}
          </Chip>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <Link
          to="/transport/calculator"
          className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-soft"
        >
          <Calculator className="size-5" /> حاسبة المشوار
        </Link>
        <Link
          to="/transport/suggest"
          search={{ kind: "new_route" }}
          className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-soft"
        >
          <MessageSquarePlus className="size-5 text-primary" /> اقترح خطاً
        </Link>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">{toArabicDigits(results.length)} خط</p>

      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.id}>
            <Link
              to="/transport/$routeId"
              params={{ routeId: r.id }}
              className="block rounded-3xl border border-border bg-card p-4 shadow-soft transition-transform active:scale-[0.99]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-road-soft px-2.5 py-0.5 text-xs font-medium text-road">
                  {SCOPE_LABELS[r.scope]}
                </span>
                {r.source === "community" && (
                  <span className="inline-flex items-center gap-1 text-xs text-anis">
                    <Users className="size-3.5" /> من المجتمع
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground">
                    {r.from} <span className="text-muted-foreground">←</span> {r.to}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" /> {r.station}
                  </p>
                </div>
                <div className="shrink-0 text-left">
                  <p className="text-lg font-bold text-primary">{formatFare(routeTotal(r))}</p>
                  <p className="text-[11px] text-muted-foreground">{toArabicDigits(r.stages.length)} مرحلة</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {routeVehicles(r).map((v) => (
                    <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-foreground/80">
                      <VehicleIcon vehicle={v} className="size-3.5" /> {VEHICLE_LABELS[v]}
                    </span>
                  ))}
                </div>
                <ChevronLeft className="size-5 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold text-foreground">لم نجد خطاً مطابقاً</p>
          <p className="mt-1 text-sm text-muted-foreground">تعرف الطريق؟ ساعد غيرك واقترحه.</p>
          <Link
            to="/transport/suggest"
            search={{ kind: "new_route" }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <MessageSquarePlus className="size-4" /> اقترح خطاً جديداً
          </Link>
        </div>
      )}
    </div>
  );
}
