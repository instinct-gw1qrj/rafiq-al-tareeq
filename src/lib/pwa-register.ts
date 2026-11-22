// The only place the offline service worker is registered. Never runs in dev or Lovable preview.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;
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
}

// Every main screen, saved on first online visit so the installed app opens all of them without internet.
const OFFLINE_PAGES = ["/", "/transport", "/transport/calculator", "/transport/suggest", "/trip", "/anis", "/medical", "/sos", "/settings", "/places", "/assistant", "/admin", "/transit"];

async function warmOfflinePages() {
  if (!("caches" in window) || !navigator.onLine) return;
  await navigator.serviceWorker.ready;
  const cache = await caches.open("rafiq-pages");
  await Promise.all(
    OFFLINE_PAGES.map(async (path) => {
      try {
        const res = await fetch(path, { credentials: "same-origin" });
        if (res.ok) await cache.put(new URL(path, window.location.origin).href, res);
      } catch {
        /* offline: keep the old copy */
      }
    }),
  );
}
