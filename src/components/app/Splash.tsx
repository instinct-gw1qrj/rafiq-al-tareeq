import { useEffect, useState } from "react";
import { Signature } from "./Signature";

// Shown once per session; a CSS animation hides it even if scripts are slow.
export function Splash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("rafiq.splash")) setVisible(false);
      sessionStorage.setItem("rafiq.splash", "1");
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="bg-hero animate-splash-out fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 px-8 text-center text-primary-foreground"
      aria-hidden
    >
      <img src="/icons/icon-512.png" alt="" className="animate-rise size-28 rounded-[2rem] shadow-soft" />
      <div className="animate-rise space-y-1" style={{ animationDelay: "120ms" }}>
        <h1 className="font-display text-4xl font-bold">رفيق الطريق</h1>
        <p className="text-primary-foreground/80">دليلك وأنيسك وأمانك في كل مشوار</p>
      </div>
      <div className="animate-rise absolute bottom-14" style={{ animationDelay: "260ms" }}>
        <Signature tone="light" className="text-base" />
      </div>
    </div>
  );
}
