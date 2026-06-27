// Self-destroying service worker.
//
// This site used to ship a Workbox PWA service worker (vite-plugin-pwa,
// June 2026). The PWA was removed, but browsers that visited the old build
// still have that worker registered — and a Workbox precache worker serves
// the OLD app shell from cache (the "floating phone card" /patient layout),
// bypassing the network entirely, so the current fixed code never loads for
// them. It also can't fix itself: once /sw.js stopped returning a valid
// worker, the browser's background update check failed and the stale worker
// stayed active forever.
//
// This file IS a valid worker again. When a stuck browser's update check
// fetches /sw.js, it installs this, which then unregisters itself, deletes
// every cache, and reloads open tabs so they load the live site. For
// visitors with no service worker it's never registered (nothing in the app
// calls navigator.serviceWorker.register) — this file only exists so the
// already-stuck population can self-heal.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        // Reload each controlled tab so it re-fetches the current build.
        client.navigate(client.url);
      }
    })(),
  );
});
