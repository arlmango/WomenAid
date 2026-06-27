// Self-destroying service worker for the retired /patient-pwa/ vanilla PWA.
//
// Before the React SPA, a separate hand-written PWA lived at /patient-pwa/
// (scope /patient-pwa/) and registered this worker. That directory is gone;
// anyone who installed it is stuck on a cached shell pointing at routes that
// no longer exist. Same remedy as the root /sw.js: when the stuck browser's
// update check fetches this, it unregisters, clears caches, and reloads.
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
        client.navigate(client.url);
      }
    })(),
  );
});
