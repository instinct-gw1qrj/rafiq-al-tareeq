import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, MessageSquarePlus, Plus, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/app/Chip";
import { Field, selectClass } from "@/components/app/Field";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatFare } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import { uid } from "@/lib/storage";
import {
  describeSuggestion,
  emptyStage,
  SCOPE_LABELS,
  VEHICLE_LABELS,
  type Scope,
  type Stage,
  type Suggestion,
  type TransportRoute,
  type Vehicle,
} from "@/lib/transport";
import { useRoutes, useSuggestions } from "@/lib/use-transport";

type Kind = "new_route" | "price" | "note";
type SuggestSearch = { kind?: Kind; routeId?: string; stageId?: string };

export const Route = createFileRoute("/transport/suggest")({
  validateSearch: (s: Record<string, unknown>): SuggestSearch => {
    const out: SuggestSearch = {};
    const kind = s["kind"];
    if (kind === "new_route" || kind === "price" || kind === "note") out.kind = kind;
    if (typeof s["routeId"] === "string") out.routeId = s["routeId"];
    if (typeof s["stageId"] === "string") out.stageId = s["stageId"];
    return out;
  },
  head: () =>
    pageHead(
      "شارك المجتمع: اقترح خطاً أو سعراً",
      "اقترح خطاً جديداً أو تعديل أجرة أو ملاحظة. يظهر اقتراحك رسمياً بعد موافقة المسؤول.",
    ),
  component: SuggestPage,
});

const num = (v: string) => Number(v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))));
const VEHICLES = Object.keys(VEHICLE_LABELS) as Vehicle[];

function SuggestPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/transport/suggest" });
  const kind: Kind = search.kind ?? "new_route";
  const [routes] = useRoutes();
  const [suggestions, setSuggestions] = useSuggestions();
  const [author, setAuthor] = useState("");

  const submit = (s: Suggestion) => {
    setSuggestions((prev) => [s, ...prev]);
    toast.success("شكراً لك! أُرسل اقتراحك للمسؤول للمراجعة");
  };
  const base = () => ({ id: uid(), createdAt: new Date().toISOString(), status: "pending" as const, author: author.trim() });

  const mine = suggestions.slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader
        title="شارك المجتمع"
        subtitle="يظهر اقتراحك بعد موافقة المسؤول"
        icon={MessageSquarePlus}
        tone="anis"
        back={{ to: "/transport", label: "دليل الطريق" }}
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={kind === "new_route"} onClick={() => navigate({ search: { kind: "new_route" } })}>خط جديد</Chip>
        <Chip active={kind === "price"} onClick={() => navigate({ search: { ...search, kind: "price" } })}>تعديل سعر</Chip>
        <Chip active={kind === "note"} onClick={() => navigate({ search: { ...search, kind: "note" } })}>إضافة ملاحظة</Chip>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <Field label="اسمك (اختياري)" className="mb-4">
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="مثلاً: أحمد من طنطا" className="h-11" />
        </Field>

        {kind === "new_route" && (
          <NewRouteForm
            onSubmit={(route) => {
              submit({ ...base(), kind: "new_route", route });
            }}
          />
        )}
        {kind === "price" && (
          <PriceForm
            routes={routes}
            initialRouteId={search.routeId}
            initialStageId={search.stageId}
            onSubmit={(routeId, stage, newFare) =>
              submit({ ...base(), kind: "price", routeId, stageId: stage.id, oldFare: stage.fare, newFare })
            }
          />
        )}
        {kind === "note" && (
          <NoteForm
            routes={routes}
            initialRouteId={search.routeId}
            onSubmit={(routeId, note) => submit({ ...base(), kind: "note", routeId, note })}
          />
        )}
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">اقتراحات هذا الجهاز</h2>
          <ul className="space-y-2">
            {mine.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm">
                <StatusIcon status={s.status} />
                <span className="min-w-0 flex-1 truncate">{describeSuggestion(s, routes)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusIcon({ status }: { status: Suggestion["status"] }) {
  if (status === "approved") return <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="مقبول" />;
  if (status === "rejected") return <XCircle className="size-5 shrink-0 text-sos" aria-label="مرفوض" />;
  return <Clock className="size-5 shrink-0 text-gold" aria-label="قيد المراجعة" />;
}


function NewRouteForm({ onSubmit }: { onSubmit: (r: Omit<TransportRoute, "id" | "updatedAt" | "source">) => void }) {
  const [scope, setScope] = useState<Scope>("external");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [station, setStation] = useState("");
  const [note, setNote] = useState("");
  const [stages, setStages] = useState<Stage[]>(() => [emptyStage()]);

  const updateStage = (id: string, patch: Partial<Stage>) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim() || !station.trim()) { toast.error("اكتب نقطة الانطلاق والوجهة ومكان الموقف"); return; }
    const clean = stages
      .map((s) => ({ ...s, from: s.from.trim() || from.trim(), to: s.to.trim() || to.trim(), station: s.station.trim() }))
      .filter((s) => s.fare > 0);
    if (clean.length === 0) { toast.error("أضف مرحلة واحدة على الأقل بأجرتها"); return; }
    onSubmit({ scope, from: from.trim(), to: to.trim(), station: station.trim(), stages: clean, notes: note.trim() ? [note.trim()] : [] });
    setFrom("");
    setTo("");
    setStation("");
    setNote("");
    setStages([emptyStage()]);
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <div className="flex gap-2">
        {(Object.keys(SCOPE_LABELS) as Scope[]).map((s) => (
          <Chip key={s} active={scope === s} onClick={() => setScope(s)}>
            {SCOPE_LABELS[s]}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="من">
          <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="نقطة الانطلاق" className="h-11" />
        </Field>
        <Field label="إلى">
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="الوجهة" className="h-11" />
        </Field>
      </div>
      <Field label="مكان الموقف">
        <Input value={station} onChange={(e) => setStation(e.target.value)} placeholder="أين تركب أول مرحلة؟" className="h-11" />
      </Field>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground/85">مراحل الركوب بالترتيب</p>
        {stages.map((s, i) => (
          <div key={s.id} className="space-y-2 rounded-2xl bg-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">المرحلة {i + 1}</span>
              {stages.length > 1 && (
                <button
                  type="button"
                  aria-label="حذف المرحلة"
                  onClick={() => setStages((p) => p.filter((x) => x.id !== s.id))}
                  className="text-muted-foreground hover:text-sos"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_6rem] gap-2">
              <select
                value={s.vehicle}
                onChange={(e) => updateStage(s.id, { vehicle: e.target.value as Vehicle })}
                className={selectClass}
                aria-label="وسيلة المواصلات"
              >
                {VEHICLES.map((v) => (
                  <option key={v} value={v}>
                    {VEHICLE_LABELS[v]}
                  </option>
                ))}
              </select>
              <Input
                inputMode="decimal"
                placeholder="الأجرة"
                className="h-11 text-center"
                value={s.fare ? String(s.fare) : ""}
                onChange={(e) => updateStage(s.id, { fare: num(e.target.value) || 0 })}
                aria-label="الأجرة"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={s.from} onChange={(e) => updateStage(s.id, { from: e.target.value })} placeholder="من" className="h-10" />
              <Input value={s.to} onChange={(e) => updateStage(s.id, { to: e.target.value })} placeholder="إلى" className="h-10" />
            </div>
            <Input value={s.station} onChange={(e) => updateStage(s.id, { station: e.target.value })} placeholder="مكان الركوب" className="h-10" />
          </div>
        ))}
        <Button type="button" variant="soft" className="w-full" onClick={() => setStages((p) => [...p, emptyStage()])}>
          <Plus /> إضافة مرحلة
        </Button>
      </div>

      <Field label="ملاحظة (اختياري)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="مواعيد، زحام، نصيحة…" />
      </Field>
      <Button type="submit" size="xl" className="w-full">
        إرسال الاقتراح للمراجعة
      </Button>
    </form>
  );
}

function PriceForm({
  routes,
  initialRouteId,
  initialStageId,
  onSubmit,
}: {
  routes: TransportRoute[];
  initialRouteId: string | undefined;
  initialStageId: string | undefined;
  onSubmit: (routeId: string, stage: Stage, newFare: number) => void;
}) {
  const [routeId, setRouteId] = useState(initialRouteId ?? routes[0]?.id ?? "");
  const route = routes.find((r) => r.id === routeId);
  const [stageId, setStageId] = useState(initialStageId ?? route?.stages[0]?.id ?? "");
  const stage = route?.stages.find((s) => s.id === stageId) ?? route?.stages[0];
  const [fare, setFare] = useState("");

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const value = num(fare);
    if (!route || !stage) { toast.error("اختر الخط والمرحلة"); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.error("اكتب السعر الجديد"); return; }
    onSubmit(route.id, stage, value);
    setFare("");
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      <Field label="الخط">
        <select
          className={selectClass}
          value={routeId}
          onChange={(e) => {
            setRouteId(e.target.value);
            setStageId(routes.find((r) => r.id === e.target.value)?.stages[0]?.id ?? "");
          }}
        >
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.from} ← {r.to}
            </option>
          ))}
        </select>
      </Field>
      {route && (
        <Field label="المرحلة">
          <select className={selectClass} value={stage?.id ?? ""} onChange={(e) => setStageId(e.target.value)}>
            {route.stages.map((s, i) => (
              <option key={s.id} value={s.id}>
                {i + 1}. {VEHICLE_LABELS[s.vehicle]}: {s.from} ← {s.to}
              </option>
            ))}
          </select>
        </Field>
      )}
      {stage && (
        <p className="rounded-xl bg-muted px-3 py-2 text-sm">
          السعر الحالي: <strong className="text-primary">{formatFare(stage.fare)}</strong>
        </p>
      )}
      <Field label="السعر الجديد (جنيه)">
        <Input value={fare} onChange={(e) => setFare(e.target.value)} inputMode="decimal" className="h-11" placeholder="مثلاً: ١٥" />
      </Field>
      <Button type="submit" size="xl" className="w-full">
        إرسال التعديل للمراجعة
      </Button>
    </form>
  );
}

function NoteForm({
  routes,
  initialRouteId,
  onSubmit,
}: {
  routes: TransportRoute[];
  initialRouteId: string | undefined;
  onSubmit: (routeId: string, note: string) => void;
}) {
  const [routeId, setRouteId] = useState(initialRouteId ?? routes[0]?.id ?? "");
  const [note, setNote] = useState("");
  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeId || !note.trim()) { toast.error("اختر الخط واكتب الملاحظة"); return; }
    onSubmit(routeId, note.trim());
    setNote("");
  };
  return (
    <form onSubmit={handle} className="space-y-4">
      <Field label="الخط">
        <select className={selectClass} value={routeId} onChange={(e) => setRouteId(e.target.value)}>
          {routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.from} ← {r.to}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الملاحظة">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلاً: الموقف انتقل بجوار البنك الأهلي" rows={4} />
      </Field>
      <Button type="submit" size="xl" className="w-full">
        إرسال الملاحظة للمراجعة
      </Button>
    </form>
  );
}
