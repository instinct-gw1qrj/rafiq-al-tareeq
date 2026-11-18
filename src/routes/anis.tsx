import { createFileRoute } from "@tanstack/react-router";
import { MoonStar, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Chip } from "@/components/app/Chip";
import { DailyCard } from "@/components/app/DailyCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { ADHKAR } from "@/data/adhkar";
import { DHIKR_OPTIONS, STORIES, VERSES, WISDOMS } from "@/data/anis";
import { toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import { todayKey } from "@/lib/settings";
import { useStore } from "@/lib/storage";
import { DEFAULT_TASBEEH, tap, type TasbeehState } from "@/lib/tasbeeh";

export const Route = createFileRoute("/anis")({
  head: () => pageHead("أنيس الطريق", "أذكار الصباح والمساء والسفر، آيات وقصص هادفة، ومسبحة إلكترونية."),
  component: AnisPage,
});

type Tab = "adhkar" | "tasbeeh" | "quran" | "stories";

function AnisPage() {
  const [tab, setTab] = useState<Tab>("adhkar");
  return (
    <div className="space-y-5">
      <PageHeader title="أنيس الطريق" subtitle="طمأنينة في كل مشوار" icon={MoonStar} tone="anis" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip active={tab === "adhkar"} onClick={() => setTab("adhkar")}>الأذكار</Chip>
        <Chip active={tab === "tasbeeh"} onClick={() => setTab("tasbeeh")}>المسبحة</Chip>
        <Chip active={tab === "quran"} onClick={() => setTab("quran")}>آيات</Chip>
        <Chip active={tab === "stories"} onClick={() => setTab("stories")}>قصص</Chip>
      </div>
      {tab === "adhkar" && <Adhkar />}
      {tab === "tasbeeh" && <Tasbeeh />}
      {tab === "quran" && (
        <div className="space-y-3">
          <DailyCard />
          {VERSES.map((v, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-quran">﴿{v.text}﴾</p>
              <p className="text-xs text-muted-foreground">[{v.ref}] · {v.theme}</p>
            </div>
          ))}
        </div>
      )}
      {tab === "stories" && (
        <div className="space-y-3">
          {STORIES.map((s) => (
            <details key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <summary className="cursor-pointer font-bold">{s.title}</summary>
              <p className="mt-3 text-sm leading-loose">{s.body}</p>
              <p className="mt-3 rounded-xl bg-anis-soft p-3 text-sm font-medium text-anis">العبرة: {s.lesson}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Adhkar() {
  const [cat, setCat] = useState(ADHKAR[0]!.id);
  const [done, setDone] = useState<Record<string, number>>({});
  const c = ADHKAR.find((x) => x.id === cat) ?? ADHKAR[0]!;
  return (
    <div className="space-y-3">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {ADHKAR.map((x) => <Chip key={x.id} active={x.id === cat} onClick={() => setCat(x.id)}>{x.title}</Chip>)}
      </div>
      {c.items.map((d, i) => {
        const key = `${c.id}-${i}`;
        const n = done[key] ?? 0;
        const finished = n >= d.count;
        return (
          <button
            key={key}
            type="button"
            onClick={() => setDone((p) => ({ ...p, [key]: Math.min(d.count, n + 1) }))}
            className={`block w-full rounded-2xl border p-4 text-right shadow-soft ${finished ? "border-success/40 bg-success-soft" : "border-border bg-card"}`}
          >
            <p className="text-quran !text-xl">{d.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{d.source}</span>
              <span className="rounded-full bg-anis-soft px-3 py-1 font-bold text-anis">{toArabicDigits(n)} / {toArabicDigits(d.count)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Tasbeeh() {
  const [st, setSt] = useStore<TasbeehState>("rafiq.tasbeeh.v1", DEFAULT_TASBEEH);
  const dhikr = DHIKR_OPTIONS.find((d) => d.id === st.dhikrId) ?? DHIKR_OPTIONS[0]!;
  const wisdom = st.wisdomIndex >= 0 ? WISDOMS[st.wisdomIndex % WISDOMS.length] : null;
  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {DHIKR_OPTIONS.map((d) => <Chip key={d.id} active={d.id === dhikr.id} onClick={() => setSt({ ...st, dhikrId: d.id, count: 0 })}>{d.text}</Chip>)}
      </div>
      <div className="flex justify-center gap-2">
        {[33, 100, 1000].map((t) => <Chip key={t} active={st.target === t} onClick={() => setSt({ ...st, target: t, count: 0 })}>{toArabicDigits(t)}</Chip>)}
      </div>
      <button
        type="button"
        onClick={() => {
          const { next } = tap(st, todayKey());
          setSt(next);
          navigator.vibrate?.(next.count === 0 ? 120 : 15);
        }}
        className="bg-anis-hero animate-bead mx-auto flex size-60 flex-col items-center justify-center rounded-full text-primary-foreground shadow-soft"
      >
        <span className="text-quran !text-2xl">{dhikr.text}</span>
        <span className="font-display text-6xl font-bold">{toArabicDigits(st.count)}</span>
        <span className="text-sm opacity-80">من {toArabicDigits(st.target)}</span>
      </button>
      <p className="text-center text-sm text-muted-foreground">
        الدورات: {toArabicDigits(st.cycles)} · اليوم: {toArabicDigits(st.day === todayKey() ? st.today : 0)} · الإجمالي: {toArabicDigits(st.total)}
      </p>
      {wisdom && <p className="rounded-2xl bg-gold-soft p-4 text-center text-sm leading-loose">{wisdom}</p>}
      <Button variant="ghost" className="w-full" onClick={() => setSt({ ...st, count: 0 })}><RotateCcw /> تصفير العداد</Button>
    </div>
  );
}
