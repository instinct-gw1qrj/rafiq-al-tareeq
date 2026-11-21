import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Send, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askTraveler } from "@/lib/ai.functions";
import { normalizeArabic } from "@/lib/arabic";
import { usePlaces, type RecPlace } from "@/lib/places";
import { pageHead } from "@/lib/seo";
import { VEHICLE_LABELS, type TransportRoute } from "@/lib/transport";
import { useRoutes } from "@/lib/use-transport";

export const Route = createFileRoute("/assistant")({
  head: () => pageHead("اسأل رفيق", "مساعد ذكي يرد على أسئلتك عن المواصلات والأجرة والمواقف والاستراحات بالعامية المصرية."),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };
const QUICK = ["إزاي أروح من موقف لموقف؟", "أرخص طريقة للمشوار ده؟", "دعاء السفر", "أعمل إيه في ضربة الشمس؟"];

function routeLine(r: TransportRoute) {
  return `${r.from} ← ${r.to} | الموقف: ${r.station} | ${r.stages
    .map((s) => `${VEHICLE_LABELS[s.vehicle]} من ${s.from} إلى ${s.to} بـ ${s.fare} جنيه${s.note ? ` (${s.note})` : ""}`)
    .join(" ثم ")}${r.notes.length ? ` | ملاحظات: ${r.notes.join("، ")}` : ""}`;
}
export function buildContext(routes: TransportRoute[], places: RecPlace[]) {
  const pl = places.filter((p) => p.active).map((p) => `${p.name} (${p.area} - ${p.road}): ${p.offer} ${p.phone}`);
  return `الخطوط:\n${routes.map(routeLine).join("\n")}\nأماكن موصى بها:\n${pl.join("\n")}`.slice(0, 59000);
}

/** Offline answer: matches question words against saved routes. */
function offlineAnswer(q: string, routes: TransportRoute[]) {
  const words = normalizeArabic(q).split(" ").filter((w) => w.length > 2);
  const hits = routes
    .map((r) => ({ r, score: words.filter((w) => normalizeArabic(`${r.from} ${r.to} ${r.station}`).includes(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (!hits.length) return "إنت دلوقتي من غير نت 📴 ومش لاقي خط مطابق في الدليل. جرّب تكتب اسم المكان بس، أو افتح «دليل الطريق».";
  return `من غير نت، دي أقرب خطوط في الدليل:\n\n${hits.map((h, i) => `${i + 1}. ${routeLine(h.r)}`).join("\n\n")}`;
}

function AssistantPage() {
  const [routes] = useRoutes();
  const [places] = usePlaces();
  const ask = useServerFn(askTraveler);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setText("");
    if (!navigator.onLine) {
      setMsgs([...next, { role: "assistant", content: offlineAnswer(question, routes) }]);
      return;
    }
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next.slice(-12), context: buildContext(routes, places) } });
      setMsgs([...next, { role: "assistant", content: r.ok ? r.text : `⚠️ ${r.text}` }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: offlineAnswer(question, routes) }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="اسأل رفيق" subtitle="مساعدك الذكي في الطريق" icon={Bot} tone="anis" back={{ to: "/", label: "الرئيسية" }} />
      {msgs.length === 0 && (
        <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="text-sm leading-relaxed">اسألني عن أي مشوار أو أجرة أو موقف أو استراحة. لو مفيش نت، هدوّرلك في الدليل اللي على موبايلك.</p>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => void send(q)} className="rounded-full bg-anis-soft px-3 py-1.5 text-xs font-semibold text-anis">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="space-y-3">
        {msgs.map((m, i) => (
          <li key={i} className={m.role === "user" ? "mr-10 rounded-2xl rounded-tr-sm bg-primary p-3 text-sm text-primary-foreground" : "ml-6 whitespace-pre-line rounded-2xl rounded-tl-sm border border-border bg-card p-3 text-sm leading-relaxed shadow-soft"}>
            {m.content}
          </li>
        ))}
        {busy && <li className="ml-6 animate-pulse rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">رفيق بيكتب…</li>}
      </ul>
      <div ref={end} />
      <form
        className="sticky bottom-24 flex gap-2 rounded-2xl border border-border bg-card p-2 shadow-float"
        onSubmit={(e) => {
          e.preventDefault();
          void send(text);
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب سؤالك…" className="h-11 border-0 shadow-none" />
        <Button type="submit" size="icon" className="size-11 shrink-0" disabled={busy || !text.trim()} aria-label="إرسال">
          <Send className="rotate-180" />
        </Button>
      </form>
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground"><WifiOff className="size-3" /> بدون نت: إجابات من الدليل المحفوظ فقط</p>
    </div>
  );
}
