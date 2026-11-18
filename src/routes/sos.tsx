import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MessageCircle, Phone, Siren } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Chip } from "@/components/app/Chip";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { EMERGENCY_NUMBERS, SOS_SITUATIONS } from "@/data/emergency";
import { toArabicDigits } from "@/lib/arabic";
import { pageHead } from "@/lib/seo";
import { cleanPhone, useSettings } from "@/lib/settings";
import { buildSosMessage, getCurrentCoords, smsLink, whatsappLink } from "@/lib/sos";
import { TONE } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sos")({
  head: () => pageHead("الطوارئ والاستغاثة", "زر استغاثة يرسل موقعك الحالي لرقم الطوارئ، وأرقام الطوارئ المصرية للاتصال بضغطة."),
  component: SosPage,
});

function SosPage() {
  const [settings] = useSettings();
  const [situation, setSituation] = useState(SOS_SITUATIONS[0]!);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const number = cleanPhone(settings.emergencyNumber);

  const trigger = async () => {
    if (!number) {
      toast.error("سجّل رقم الطوارئ الشخصي أولاً من الإعدادات");
      return;
    }
    setBusy(true);
    const coords = await getCurrentCoords();
    const body = buildSosMessage(settings.userName ? { situation, coords, name: settings.userName } : { situation, coords });
    setMessage(body);
    setBusy(false);
    window.location.href = smsLink(number, body);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="الطوارئ والاستغاثة" icon={Siren} tone="sos" />
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {SOS_SITUATIONS.map((s) => (
          <Chip key={s} active={situation === s} onClick={() => setSituation(s)}>{s}</Chip>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          type="button"
          onClick={() => void trigger()}
          disabled={busy}
          className="bg-sos-button shadow-sos-ring animate-sos-pulse flex size-48 flex-col items-center justify-center rounded-full text-sos-foreground"
        >
          {busy ? <Loader2 className="size-12 animate-spin" /> : <Siren className="size-14" />}
          <span className="mt-2 font-display text-2xl font-bold">{busy ? "جارٍ تحديد موقعك" : "استغاثة"}</span>
        </button>
        <p className="text-center text-sm text-muted-foreground">
          {number ? `يُرسل موقعك إلى ${settings.emergencyName || number}` : (
            <Link to="/settings" className="font-semibold text-sos">سجّل رقم الطوارئ الشخصي أولاً</Link>
          )}
        </p>
      </div>
      {message && number && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="sos" asChild><a href={smsLink(number, message)}><MessageCircle /> رسالة</a></Button>
          <Button variant="card" asChild><a href={whatsappLink(number, message)} target="_blank" rel="noreferrer">واتساب</a></Button>
          <Button variant="card" asChild><a href={`tel:${number}`}><Phone /> اتصال</a></Button>
        </div>
      )}
      <section>
        <h2 className="mb-3 text-lg font-bold">أرقام الطوارئ الرسمية</h2>
        <ul className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map((n) => (
            <li key={n.id}>
              <a href={`tel:${n.number}`} className={cn("block rounded-2xl border bg-card p-4 shadow-soft", TONE[n.tone].border)}>
                <p className={cn("text-2xl font-bold", TONE[n.tone].text)}>{toArabicDigits(n.number)}</p>
                <p className="font-semibold">{n.name}</p>
                <p className="text-xs text-muted-foreground">{n.hint}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
