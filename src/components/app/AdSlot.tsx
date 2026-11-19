import { useEffect, useRef } from "react";
import { useAds } from "@/lib/ads";

declare global { interface Window { adsbygoogle?: unknown[] } }

/** Owner-controlled ad space: renders nothing unless ads are switched on in the admin panel. */
export function AdSlot() {
  const [ads] = useAds();
  const pushed = useRef(false);
  const useAdsense = ads.enabled && /^ca-pub-\d+$/.test(ads.adsenseClient.trim());
  useEffect(() => {
    if (!useAdsense || pushed.current) return;
    const id = "adsbygoogle-js";
    if (!document.getElementById(id)) {
      const sc = document.createElement("script");
      sc.id = id; sc.async = true; sc.crossOrigin = "anonymous";
      sc.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.adsenseClient.trim()}`;
      document.head.appendChild(sc);
    }
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); pushed.current = true; } catch { /* offline */ }
  }, [useAdsense, ads.adsenseClient]);
  if (!ads.enabled) return null;
  if (useAdsense)
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
        <p className="mb-1 text-[10px] text-muted-foreground">إعلان</p>
        <ins className="adsbygoogle block" style={{ display: "block" }} data-ad-client={ads.adsenseClient.trim()} data-ad-slot={ads.adsenseSlot} data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    );
  if (!ads.sponsorText) return null;
  return (
    <a href={ads.sponsorLink || undefined} target="_blank" rel="noopener noreferrer sponsored" className="block rounded-2xl border border-gold/40 bg-gold-soft p-3 text-sm">
      <span className="ml-2 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-foreground">برعاية</span>
      {ads.sponsorText}
    </a>
  );
}
