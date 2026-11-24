// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        filename: "sw.js",
        manifest: false,
        workbox: {
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2,webmanifest}"],
          // The default 2 MB cap could silently skip a big app chunk and break offline; cache everything we ship.
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallback: null,
          navigateFallbackDenylist: [/^\/~oauth/],
          cleanupOutdatedCaches: true,
          // Build output lives under client/, but the site serves it from the root.
          modifyURLPrefix: { "client/": "" },
          runtimeCaching: [
            {
              // Every script/style chunk the app loads, saved on first use. Keeps the app fully
              // offline even for a chunk that somehow missed the precache manifest.
              urlPattern: ({ url }) => url.origin === self.location.origin && /\/assets\/.+\.(?:js|css|woff2?)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "rafiq-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "rafiq-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 60 },
                // A page never opened before still loads offline: serve the saved home screen and let the app route.
                plugins: [
                  {
                    handlerDidError: async () =>
                      (await caches.match("/", { cacheName: "rafiq-pages", ignoreSearch: true })) ?? Response.error(),
                  },
                ],
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "rafiq-fonts",
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
