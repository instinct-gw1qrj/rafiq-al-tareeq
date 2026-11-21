import { createFileRoute, Link } from "@tanstack/react-router";
import { BusFront, Calculator, ChevronLeft, HeartPulse, MoonStar, Siren } from "lucide-react";
import { DailyCard } from "@/components/app/DailyCard";
import { Checklist, FavoritesSection, TripCard } from "@/components/app/HomeExtras";
import { HomeLinks } from "@/components/app/HomeLinks";
import { ShareApp } from "@/components/app/ShareApp";
import { Signature } from "@/components/app/Signature";
import { pageHead } from "@/lib/seo";
import { TONE, type Tone } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "دليلك وأنيسك وأمانك في كل مشوار",
      "تطبيق رفيق الطريق: أسعار المواصلات ومراحل الركوب، أذكار ومسبحة، إسعافات أولية، وزر استغاثة يرسل موقعك — يعمل بدون إنترنت.",
    ),
  component: Home,
});

const SECTIONS: { to: string; title: string; desc: string; icon: typeof BusFront; tone: Tone }[] = [
  { to: "/transport", title: "دليل الطريق", desc: "الخطوط والمواقف والأجرة الرسمية", icon: BusFront, tone: "road" },
  { to: "/anis", title: "أنيس الطريق", desc: "أذكار، آيات، قصص ومسبحة", icon: MoonStar, tone: "anis" },
  { to: "/medical", title: "إسعافات أولية", desc: "تصرّف صحيح في ثوانٍ", icon: HeartPulse, tone: "med" },
  { to: "/sos", title: "طوارئ واستغاثة", desc: "أرسل موقعك بضغطة واحدة", icon: Siren, tone: "sos" },
];

function Home() {
  return (
    <div className="space-y-6">
      <section className="bg-hero animate-rise relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-soft">
        <p className="text-sm text-primary-foreground/80">أهلاً بك يا رفيق 👋</p>
        <h1 className="mt-1 text-3xl font-bold leading-snug">رفيق الطريق</h1>
        <p className="mt-2 max-w-[15rem] text-primary-foreground/85">دليلك وأنيسك وأمانك في كل مشوار — حتى بدون إنترنت.</p>
        <Signature tone="light" className="mt-5 text-[13px]" />
        <img
          src="/icons/icon-512.png"
          alt=""
          className="pointer-events-none absolute -bottom-6 -left-6 size-36 rotate-[-10deg] rounded-[2rem] opacity-25"
        />
      </section>

      <FavoritesSection />
      <TripCard />
      <HomeLinks />

      <section className="grid grid-cols-2 gap-3">
        {SECTIONS.map((s, i) => (
          <Link
            key={s.to}
            to={s.to}
            className="animate-rise group rounded-3xl border border-border bg-card p-4 shadow-soft transition-transform active:scale-[0.98]"
            style={{ animationDelay: `${80 + i * 60}ms` }}
          >
            <span className={cn("mb-3 flex size-12 items-center justify-center rounded-2xl", TONE[s.tone].soft, TONE[s.tone].text)}>
              <s.icon className="size-6" />
            </span>
            <h2 className="text-base font-bold text-foreground">{s.title}</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
          </Link>
        ))}
      </section>

      <Link
        to="/transport/calculator"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Calculator className="size-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-foreground">حاسبة تكلفة المشوار</p>
          <p className="text-xs text-muted-foreground">اجمع أجرة كل المراحل في مكان واحد</p>
        </div>
        <ChevronLeft className="size-5 text-muted-foreground" />
      </Link>

      <Checklist />
      <ShareApp />
      <DailyCard />
    </div>
  );
}
