import { CloudDownload, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OFFLINE_READY_EVENT, offlineReadyAt, refreshOfflineData } from "@/lib/pwa-register";

/**
 * Small header badge telling the traveler the whole app is saved for offline use.
 * Tapping it re-saves every page and pulls the newest published lines (needs internet).
 */
export function OfflineReady() {
  const [readyAt, setReadyAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const read = () => setReadyAt(offlineReadyAt());
    read();
    window.addEventListener(OFFLINE_READY_EVENT, read);
    window.addEventListener("online", read);
    return () => {
      window.removeEventListener(OFFLINE_READY_EVENT, read);
      window.removeEventListener("online", read);
    };
  }, []);

  const refresh = async () => {
    if (busy) return;
    if (!navigator.onLine) {
      toast("إنت من غير نت دلوقتي، والنسخة المحفوظة على موبايلك شغالة ✅");
      return;
    }
    setBusy(true);
    await refreshOfflineData();
    setBusy(false);
    toast.success("النسخة المحفوظة اتحدثت ✅ التطبيق جاهز يشتغل من غير نت");
  };

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      aria-label={readyAt ? "التطبيق جاهز بدون إنترنت — اضغط لتحديث النسخة المحفوظة" : "تجهيز التطبيق للعمل بدون إنترنت"}
      className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-xs font-medium text-success"
    >
      {busy ? <RefreshCw className="size-3.5 animate-spin" /> : readyAt ? <ShieldCheck className="size-3.5" /> : <CloudDownload className="size-3.5" />}
      {busy ? "بنجهّز…" : readyAt ? "جاهز بدون نت" : "جهّز بدون نت"}
    </button>
  );
}
