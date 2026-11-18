import { DAILY_DUAS, VERSES, dailyIndex } from "@/data/anis";
import { DEFAULT_SETTINGS, SETTINGS_KEY, todayKey, type Settings } from "./settings";
import { readStore, writeStore } from "./storage";

export function getDailyMessage(d = new Date()) {
  const verse = VERSES[dailyIndex(VERSES.length, d)] ?? VERSES[0]!;
  const dua = DAILY_DUAS[dailyIndex(DAILY_DUAS.length, d)] ?? DAILY_DUAS[0]!;
  return { verse, dua };
}

/** Shows one quiet notification per day (verse + short dua) when the app is opened. */
export async function maybeShowDailyNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const settings: Settings = { ...DEFAULT_SETTINGS, ...readStore(SETTINGS_KEY, DEFAULT_SETTINGS) };
  const today = todayKey();
  if (!settings.notifications || settings.lastNotified === today) return;
  if (Notification.permission !== "granted") return;
  const { verse, dua } = getDailyMessage();
  const title = "رفيق الطريق — رسالة اليوم";
  const body = `﴿${verse.text}﴾ [${verse.ref}]\n${dua}`;
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.();
    if (reg) await reg.showNotification(title, { body, icon: "/icons/icon-192.png", lang: "ar", dir: "rtl", tag: "daily" });
    else new Notification(title, { body, icon: "/icons/icon-192.png", lang: "ar", dir: "rtl", tag: "daily" });
    writeStore(SETTINGS_KEY, { ...settings, lastNotified: today });
  } catch {
    /* some browsers block page notifications; the daily card on the home screen still shows */
  }
}
