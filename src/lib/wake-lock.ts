// Screen Wake Lock: keeps the screen (and so the page's GPS watcher) alive while a trip is tracked.
// The browser drops the lock whenever the page is hidden, so it is requested again when the page comes back.

type Sentinel = { release: () => Promise<void>; addEventListener?: (t: string, f: () => void) => void };
type WakeNav = Navigator & { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } };

let sentinel: Sentinel | null = null;

export function wakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && !!(navigator as WakeNav).wakeLock;
}

export async function acquireWakeLock(): Promise<boolean> {
  if (!wakeLockSupported()) return false;
  try {
    if (sentinel) return true;
    const s = await (navigator as WakeNav).wakeLock!.request("screen");
    sentinel = s;
    s.addEventListener?.("release", () => {
      if (sentinel === s) sentinel = null;
    });
    return true;
  } catch {
    sentinel = null;
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  const s = sentinel;
  sentinel = null;
  try {
    await s?.release();
  } catch {
    /* ignore */
  }
}

export function wakeLockActive(): boolean {
  return sentinel != null;
}
