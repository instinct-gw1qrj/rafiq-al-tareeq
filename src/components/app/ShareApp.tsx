import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Share2, Copy, Check } from "lucide-react";

export const APP_URL = "https://rafiq-al-tareeq.lovable.app";
const SHARE_TEXT =
  "جرّب تطبيق «رفيق الطريق» 🚌: دليل المواصلات والأجرة، منبه الوصول، أذكار وطوارئ — يشتغل من غير نت.\nتصميم دكتورة شروق محمد الباز";

export function ShareApp() {
  const [svg, setSvg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toString(APP_URL, { type: "svg", margin: 1, width: 200 })
      .then(setSvg)
      .catch(() => {});
  }, []);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "رفيق الطريق", text: SHARE_TEXT, url: APP_URL });
        return;
      } catch {
        return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT}\n${APP_URL}`)}`, "_blank");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
      <h2 className="text-lg font-bold text-foreground">شارك التطبيق مع أصحابك</h2>
      <p className="mt-1 text-sm text-muted-foreground">خلّي اللي جنبك يصوّر الكود بكاميرا موبايله</p>
      <div
        className="mx-auto mt-3 w-44 overflow-hidden rounded-xl bg-background p-2 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
        aria-label="رمز QR لرابط التطبيق"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="mt-3 flex gap-2">
        <button onClick={share} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 font-semibold text-primary-foreground">
          <Share2 className="size-4" /> شارك
        </button>
        <button onClick={copy} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-background px-3 py-2.5 font-semibold text-foreground">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />} {copied ? "اتنسخ" : "انسخ الرابط"}
        </button>
      </div>
    </section>
  );
}
