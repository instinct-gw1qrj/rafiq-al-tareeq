import { timeoutSignal, withTimeout } from "./resilience";

// The only place the offline service worker is registered. Never runs in dev or Lovable preview.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

// When the last full offline warm-up finished; drives the "جاهز بدون نت" header badge.
const READY_KEY = "rafiq.offline.ready.v1";
export const OFFLINE_READY_EVENT = "rafiq:offline-ready";

export function offlineReadyAt(): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(READY_KEY);
  } catch {
    return null;
  }
}
const LOVABLE_HOSTS = [".lovable.app", ".gpt-eng.com", ".gptengineer.run"];
const PROJECT_ID = "5547f57c-b322-4f9a-811d-4ba18190b222";

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const firstLabel = host.split(".")[0] ?? "";
  if (LOVABLE_HOSTS.some((h) => host.endsWith(h))) {
    if (PREVIEW_LABEL.test(firstLabel)) return true;
    if (firstLabel === `project--${PROJECT_ID}-dev`) return true;
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => {
        const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
        return url.endsWith("/sw.js");
      })
      .map((r) => r.unregister()),
  );
}

export async function registerOfflineSupport() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    await unregisterAppWorkers().catch(() => {});
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
  void warmOfflinePages();
  // A device that just got its connection back refreshes its saved copy right away.
  window.addEventListener("online", () => void warmOfflinePages());
}

/**
 * Re-saves every page and pulls the newest published content. Used by the header badge button.
 * Resolves true only when the warm-up finished; every step is time-boxed so a hung
 * connection shows an error instead of spinning forever.
 */
export async function refreshOfflineData(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { pullContent } = await import("./cloud-sync");
    await withTimeout(pullContent(), 20_000, "مزامنة المحتوى").catch(() => {});
  } catch {
    /* content sync is best-effort; page warm-up still runs */
  }
  try {
    return await withTimeout(warmOfflinePages(), 90_000, "تجهيز الصفحات");
  } catch {
    return false;
  }
}

// Every main screen, saved on first online visit so the installed app opens all of them without internet.
const OFFLINE_PAGES = ["/", "/transport", "/transport/calculator", "/transport/suggest", "/trip", "/anis", "/medical", "/sos", "/settings", "/places", "/assistant", "/admin", "/transit"];

async function warmOfflinePages(): Promise<boolean> {
  if (!("caches" in window) || !navigator.onLine) return false;
  try {
    // Without an active service worker there is no offline mode at all; never wait forever.
    await withTimeout(navigator.serviceWorker.ready, 10_000, "خدمة الأوفلاين");
  } catch {
    return false;
  }
  const cache = await caches.open("rafiq-pages");
  await Promise.all(
    OFFLINE_PAGES.map(async (path) => {
      try {
        const res = await fetch(path, { credentials: "same-origin", signal: timeoutSignal(15_000) });
        if (res.ok) await cache.put(new URL(path, window.location.origin).href, res);
      } catch {
        /* offline or timed out: keep the old copy */
      }
    }),
  );
  // Declare the app offline-ready only when the home screen (the navigation fallback) is actually saved.
  const home = await cache.match(new URL("/", window.location.origin).href, { ignoreSearch: true });
  if (!home) return false;
  try {
    window.localStorage.setItem(READY_KEY, new Date().toISOString());
  } catch {
    /* storage full or blocked: the badge just stays hidden */
  }
  window.dispatchEvent(new Event(OFFLINE_READY_EVENT));
  return true;
}
