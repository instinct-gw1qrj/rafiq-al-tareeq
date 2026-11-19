import { useStore } from "./storage";

export interface AdsConfig {
  enabled: boolean;
  adsenseClient: string; // ca-pub-xxxxxxxx
  adsenseSlot: string;
  sponsorText: string;
  sponsorLink: string;
}
export const DEFAULT_ADS: AdsConfig = { enabled: false, adsenseClient: "", adsenseSlot: "", sponsorText: "", sponsorLink: "" };
export const ADS_KEY = "rafiq.ads.v1";
export function useAds() {
  const [v, set] = useStore<AdsConfig>(ADS_KEY, DEFAULT_ADS);
  return [{ ...DEFAULT_ADS, ...v }, (p: Partial<AdsConfig>) => set((prev) => ({ ...DEFAULT_ADS, ...prev, ...p }))] as const;
}

/** Change owed: paid minus fare × passengers. Negative means more money is needed. */
export function changeDue(paid: number, fare: number, passengers: number) {
  const people = Math.max(1, Math.floor(passengers || 1));
  return Math.round((paid - fare * people) * 100) / 100;
}
