// Battery helpers: warn the traveler when the phone is about to die mid-trip.
// The Battery API is not in every browser — everything here fails silently.

export interface BatteryLike {
  level: number;
  charging: boolean;
}

type NavigatorWithBattery = Navigator & { getBattery?: () => Promise<BatteryLike> };

/** Warning text when the device is unplugged and below ٢٠٪, otherwise null. */
export async function batteryWarning(): Promise<string | null> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as NavigatorWithBattery;
  if (!nav.getBattery) return null;
  try {
    const b = await nav.getBattery();
    if (!b.charging && b.level > 0 && b.level <= 0.2) {
      const pct = Math.round(b.level * 100);
      return `بطارية الموبايل ${pct}٪ ولسه مش على الشاحن — فعّل «وضع توفير البطارية» من الإعدادات، وقلّل إضاءة الشاشة، واقفل التطبيقات اللي مش بتستخدمها.`;
    }
  } catch {
    /* unsupported browser — nothing to warn about */
  }
  return null;
}
