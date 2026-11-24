// Test stub for the vite-plugin-pwa virtual module, which only exists inside the Vite build.
// vitest.config.ts aliases "virtual:pwa-register" here so tests can import pwa-register.ts.
export function registerSW(_opts?: { immediate?: boolean }) {
  return (_reload?: boolean) => Promise.resolve();
}
