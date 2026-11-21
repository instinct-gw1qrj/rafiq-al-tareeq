import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, KeyRound, Lock, LogOut, ShieldCheck, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminAI, AdsManager, PlacesManager, StatsPanel } from "@/components/app/AdminTools";
import { Chip } from "@/components/app/Chip";
import { Field } from "@/components/app/Field";
import { PageHeader } from "@/components/app/PageHeader";
import { VehicleIcon } from "@/components/app/VehicleIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFare, toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import { checkAdminPassword, useSettings } from "@/lib/settings";
import {
  applySuggestion,
  describeSuggestion,
  routeTotal,
  setStageFare,
  VEHICLE_LABELS,
  type Suggestion,
} from "@/lib/transport";
import { useRoutes, useSuggestions } from "@/lib/use-transport";

export const Route = createFileRoute("/admin")({
  head: () => ({
    ...pageHead("لوحة تحكم المسؤول", "مراجعة اقتراحات المستخدمين والموافقة عليها أو رفضها وتعديل الأسعار."),
    meta: [
      ...pageHead("لوحة تحكم المسؤول", "مراجعة اقتراحات المستخدمين والموافقة عليها أو رفضها وتعديل الأسعار.").meta,
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const SESSION_KEY = "rafiq.admin";

function AdminPage() {
  const [settings] = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!unlocked) {
    return (
      <div>
        <PageHeader title="لوحة التحكم" subtitle="خاصة بالمسؤول فقط" icon={Lock} tone="gold" back={{ to: "/settings", label: "الإعدادات" }} />
        <form
          className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            if (checkAdminPassword(pwd, settings)) {
              setUnlocked(true);
              try {
                sessionStorage.setItem(SESSION_KEY, "1");
              } catch {
                /* ignore */
              }
              setPwd("");
            } else toast.error("كلمة المرور غير صحيحة");
          }}
        >
          <Field label="كلمة مرور المسؤول">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              className="h-12 text-center text-lg tracking-[0.4em]"
              autoFocus
            />
          </Field>
          <Button type="submit" size="xl" className="w-full">
            <ShieldCheck /> دخول
          </Button>
        </form>
      </div>
    );
  }

  return (
    <AdminPanel
      onLock={() => {
        setUnlocked(false);
        try {
          sessionStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
      }}
    />
  );
}

function AdminPanel({ onLock }: { onLock: () => void }) {
  const [tab, setTab] = useState<"ai" | "pending" | "routes" | "places" | "ads" | "stats" | "history" | "security">("pending");
  const [routes, setRoutes] = useRoutes();
  const [suggestions, setSuggestions] = useSuggestions();
  const pending = suggestions.filter((s) => s.status === "pending");
  const history = suggestions.filter((s) => s.status !== "pending");

  const decide = (s: Suggestion, status: "approved" | "rejected", override?: Suggestion) => {
    if (status === "approved") setRoutes((prev) => applySuggestion(prev, override ?? s));
    setSuggestions((prev) => prev.map((x) => (x.id === s.id ? { ...(override ?? x), status } : x)));
    toast.success(status === "approved" ? "تمت الموافقة ونُشر في التطبيق" : "تم رفض الاقتراح");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="لوحة التحكم"
        subtitle="مراجعة الاقتراحات وإدارة الأسعار"
        icon={ShieldCheck}
        tone="gold"
        action={
          <Button variant="ghost" size="sm" onClick={onLock}>
            <LogOut /> خروج
          </Button>
        }
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={tab === "ai"} onClick={() => setTab("ai")}>المساعد الذكي ✨</Chip>
        <Chip active={tab === "pending"} onClick={() => setTab("pending")}>
          بانتظار المراجعة ({toArabicDigits(pending.length)})
        </Chip>
        <Chip active={tab === "routes"} onClick={() => setTab("routes")}>الخطوط والأسعار</Chip>
        <Chip active={tab === "places"} onClick={() => setTab("places")}>الأماكن الموصى بها</Chip>
        <Chip active={tab === "ads"} onClick={() => setTab("ads")}>الإعلانات</Chip>
        <Chip active={tab === "stats"} onClick={() => setTab("stats")}>عداد الزوار</Chip>
        <Chip active={tab === "history"} onClick={() => setTab("history")}>السجل</Chip>
        <Chip active={tab === "security"} onClick={() => setTab("security")}>كلمة المرور</Chip>
      </div>

      {tab === "pending" &&
        (pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            لا توجد اقتراحات جديدة 🎉
          </p>
        ) : (
          <ul className="space-y-3">
            {pending.map((s) => (
              <PendingCard key={s.id} s={s} routes={routes} onDecide={decide} />
            ))}
          </ul>
        ))}

      {tab === "routes" && (
        <ul className="space-y-3">
          {routes.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <Link to="/transport/$routeId" params={{ routeId: r.id }} className="font-bold hover:text-primary">
                    {r.from} ← {r.to}
                  </Link>
                  <p className="text-xs text-muted-foreground">الإجمالي: {formatFare(routeTotal(r))}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="حذف الخط"
                  onClick={() => {
                    if (window.confirm(`حذف خط ${r.from} ← ${r.to}؟`)) {
                      setRoutes((prev) => prev.filter((x) => x.id !== r.id));
                      toast.success("تم حذف الخط");
                    }
                  }}
                >
                  <Trash2 className="text-sos" />
                </Button>
              </div>
              <div className="space-y-2">
                {r.stages.map((st) => (
                  <FareEditor
                    key={st.id}
                    label={`${VEHICLE_LABELS[st.vehicle]}: ${st.from} ← ${st.to}`}
                    vehicle={st.vehicle}
                    fare={st.fare}
                    onSave={(fare) => {
                      setRoutes((prev) => setStageFare(prev, r.id, st.id, fare));
                      toast.success("تم تحديث السعر");
                    }}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tab === "history" &&
        (history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">لا يوجد سجل بعد.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 text-sm">
                {s.status === "approved" ? <Check className="size-5 text-success" /> : <X className="size-5 text-sos" />}
                <span className="flex-1">{describeSuggestion(s, routes)}</span>
              </li>
            ))}
          </ul>
        ))}

      {tab === "security" && <PasswordChanger />}
      {tab === "ai" && <AdminAI />}
      {tab === "places" && <PlacesManager />}
      {tab === "ads" && <AdsManager />}
      {tab === "stats" && <StatsPanel />}
    </div>
  );
}

function PendingCard({
  s,
  routes,
  onDecide,
}: {
  s: Suggestion;
  routes: ReturnType<typeof useRoutes>[0];
  onDecide: (s: Suggestion, status: "approved" | "rejected", override?: Suggestion) => void;
}) {
  const [fare, setFare] = useState(s.kind === "price" ? String(s.newFare) : "");
  return (
    <li className="space-y-3 rounded-2xl border border-gold/40 bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{s.author ? `من: ${s.author}` : "مستخدم"}</span>
        <span>{new Date(s.createdAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}</span>
      </div>
      <p className="font-semibold">{describeSuggestion(s, routes)}</p>
      {s.kind === "new_route" && (
        <ol className="space-y-1 rounded-xl bg-muted p-3 text-sm">
          <li className="text-xs text-muted-foreground">الموقف: {s.route.station}</li>
          {s.route.stages.map((st, i) => (
            <li key={st.id}>
              {toArabicDigits(i + 1)}. {VEHICLE_LABELS[st.vehicle]}: {st.from} ← {st.to} — <strong>{formatFare(st.fare)}</strong>
            </li>
          ))}
          {s.route.notes.map((n, i) => (
            <li key={i} className="text-xs text-muted-foreground">ملاحظة: {n}</li>
          ))}
        </ol>
      )}
      {s.kind === "price" && (
        <Field label="السعر المعتمد (يمكنك تعديله قبل الموافقة)">
          <Input value={fare} onChange={(e) => setFare(e.target.value)} inputMode="decimal" className="h-10" />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => {
            if (s.kind === "price") {
              const v = Number(fare);
              if (!Number.isFinite(v) || v <= 0) {
                toast.error("اكتب سعراً صحيحاً");
                return;
              }
              onDecide(s, "approved", { ...s, newFare: v });
            } else onDecide(s, "approved");
          }}
        >
          <Check /> موافقة ونشر
        </Button>
        <Button variant="outline" onClick={() => onDecide(s, "rejected")}>
          <X /> رفض
        </Button>
      </div>
    </li>
  );
}

function FareEditor({
  label,
  vehicle,
  fare,
  onSave,
}: {
  label: string;
  vehicle: import("@/lib/transport").Vehicle;
  fare: number;
  onSave: (fare: number) => void;
}) {
  const [value, setValue] = useState(String(fare));
  useEffect(() => setValue(String(fare)), [fare]);
  const changed = Number(value) !== fare;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted p-2">
      <VehicleIcon vehicle={vehicle} className="size-4 shrink-0 text-road" />
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="decimal"
        className="h-9 w-20 bg-card text-center"
        aria-label={`سعر ${label}`}
      />
      <Button
        size="sm"
        disabled={!changed}
        onClick={() => {
          const v = Number(value);
          if (!Number.isFinite(v) || v <= 0) {
            toast.error("سعر غير صحيح");
            return;
          }
          onSave(v);
        }}
      >
        حفظ
      </Button>
    </div>
  );
}

function PasswordChanger() {
  const [settings, update] = useSettings();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  return (
    <form
      className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
      onSubmit={(e) => {
        e.preventDefault();
        if (!checkAdminPassword(current, settings)) {
          toast.error("كلمة المرور الحالية غير صحيحة");
          return;
        }
        if (next.trim().length < 4) {
          toast.error("كلمة المرور الجديدة ٤ أحرف على الأقل");
          return;
        }
        update({ adminPassword: next.trim() });
        setCurrent("");
        setNext("");
        toast.success("تم تغيير كلمة المرور");
      }}
    >
      <h2 className="flex items-center gap-2 font-bold">
        <KeyRound className="size-5 text-primary" /> تغيير كلمة مرور المسؤول
      </h2>
      <Field label="كلمة المرور الحالية">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="h-11" />
      </Field>
      <Field label="كلمة المرور الجديدة">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="h-11" />
      </Field>
      <Button type="submit" size="xl" className="w-full">
        حفظ
      </Button>
    </form>
  );
}
