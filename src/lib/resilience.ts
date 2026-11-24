// Shared guards for flaky mobile connections: a hung or failed network call must
// never leave the UI stuck, and a failed lazy-chunk load deserves one fresh retry.

/** Rejects with an error naming `label` after `ms` when the promise has not settled. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`انتهت مهلة: ${label}`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

/** True for failed lazy-chunk / dynamic-import loads — the one failure a plain reload fixes. */
export function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|dynamically imported module|error loading dynamically imported module|Importing a module script failed|Loading chunk \d+ failed/i.test(
    msg,
  );
}

export const CHUNK_RELOAD_KEY = "rafiq.chunk-reload.v1";

/** One guarded reload per cooldown window for chunk-load errors — never a reload loop. */
export function shouldReloadForChunkError(
  error: unknown,
  lastReloadAt: number | null,
  now: number,
  cooldownMs = 60_000,
): boolean {
  return isChunkLoadError(error) && (lastReloadAt === null || now - lastReloadAt > cooldownMs);
}

/** fetch() signal that times out, on browsers new enough to have AbortSignal.timeout. */
export function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(ms)
    : undefined;
}
