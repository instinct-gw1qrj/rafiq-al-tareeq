import { normalizeArabic } from "./arabic";
import type { RecPlace } from "./places";
import { useStore } from "./storage";

export interface AdsConfig {
  enabled: boolean;
  adsenseClient: string; // ca-pub-xxxxxxxx
  adsenseSlot: string;
  sponsorText: string;
  sponsorLink: string;
  targetByDestination: boolean; // show the sponsored place that matches the trip destination
  targetByGovernorate: boolean; // show the sponsored place in the user's governorate
}
export const DEFAULT_ADS: AdsConfig = {
  enabled: false,
  adsenseClient: "",
  adsenseSlot: "",
  sponsorText: "",
  sponsorLink: "",
  targetByDestination: true,
  targetByGovernorate: true,
};
export const ADS_KEY = "rafiq.ads.v1";
export function useAds() {
  const [v, set] = useStore<AdsConfig>(ADS_KEY, DEFAULT_ADS);
  return [{ ...DEFAULT_ADS, ...v }, (p: Partial<AdsConfig>) => set((prev) => ({ ...DEFAULT_ADS, ...prev, ...p }))] as const;
}

export interface SponsorAd {
  text: string;
  link: string;
  phone: string;
}

function fromPlace(p: RecPlace): SponsorAd {
  return { text: `${p.name}${p.offer ? ` — ${p.offer}` : ""}`, link: p.phone ? `tel:${p.phone}` : "", phone: p.phone };
}

/** Pick the sponsored place that fits this reader: destination first, then governorate, then any sponsored place. */
export function pickSponsor(ads: AdsConfig, places: RecPlace[], dest = "", area = ""): SponsorAd | null {
  const active = places.filter((p) => p.active);
  const sponsored = active.filter((p) => p.sponsored);
  const list = sponsored.length ? sponsored : active;
  if (ads.targetByDestination && dest) {
    const d = normalizeArabic(dest);
    const hit = list.find(
      (p) =>
        normalizeArabic(p.road).includes(d) ||
        normalizeArabic(p.area).includes(d) ||
        (!!p.area && d.includes(normalizeArabic(p.area))),
    );
    if (hit) return fromPlace(hit);
  }
  if (ads.targetByGovernorate && area) {
    const a = normalizeArabic(area);
    const hit = list.find((p) => normalizeArabic(p.area).includes(a) || a.includes(normalizeArabic(p.area)));
    if (hit) return fromPlace(hit);
  }
  const first = list[0];
  if (first) return fromPlace(first);
  return ads.sponsorText ? { text: ads.sponsorText, link: ads.sponsorLink, phone: "" } : null;
}

/** Change owed: paid minus fare × passengers. Negative means more money is needed. */
export function changeDue(paid: number, fare: number, passengers: number) {
  const people = Math.max(1, Math.floor(passengers || 1));
  return Math.round((paid - fare * people) * 100) / 100;
}
