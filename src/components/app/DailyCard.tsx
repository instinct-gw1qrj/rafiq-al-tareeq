import { useHydrated } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { getDailyMessage } from "@/lib/daily";

export function DailyCard() {
  const hydrated = useHydrated();
  const msg = hydrated ? getDailyMessage() : null;
  return (
    <section className="rounded-3xl border border-gold/40 bg-gold-soft p-5 shadow-soft">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-foreground">
        <Sparkles className="size-4" /> رسالة اليوم
      </div>
      {msg ? (
        <>
          <p className="text-quran text-foreground">﴿{msg.verse.text}﴾</p>
          <p className="mt-1 text-xs text-muted-foreground">[{msg.verse.ref}]</p>
          <p className="mt-3 border-t border-gold/30 pt-3 text-sm text-foreground/80">{msg.dua}</p>
        </>
      ) : (
        <div className="h-24 animate-pulse rounded-xl bg-gold/10" />
      )}
    </section>
  );
}
