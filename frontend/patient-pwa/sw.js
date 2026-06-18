/* Service worker for the patient PWA.
 *
 * SECURITY / PRIVACY — the central rule of this file:
 *   We cache ONLY the static app shell (HTML/CSS/JS/icons/manifest). We NEVER
 *   cache anything from the API or any other dynamic/medical endpoint. The app
 *   handles sensitive data (auth tokens, uploads, triage results, consent), and
 *   none of that may be written to the Cache Storage where it could persist on
 *   the device after the visit / be read offline. Medical data is online-only.
 *
 *   Concretely, the fetch handler below intercepts a request ONLY if it is a
 *   same-origin GET for one of the known static shell assets. Everything else —
 *   in particular /api/* and /health — is left entirely to the browser's normal
 *   network path (we do not call respondWith), so it is never stored here.
 *
 * Bump CACHE_VERSION to roll out a new shell (old caches are deleted on
 * activate).
 */
'use strict';

var CACHE_VERSION = 'womenaid-patient-v1';

// Resolve shell URLs against the SW scope (works under /patient-pwa/).
var SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_VERSION) return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Paths that must NEVER be served from / written to the cache (dynamic + medical).
function isDynamic(url) {
  return url.pathname.indexOf('/api/') === 0 ||
    url.pathname === '/health' ||
    url.pathname === '/openapi.json' ||
    url.pathname.indexOf('/docs') === 0;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  var url = new URL(req.url);

  // Only ever touch same-origin GET requests. Anything else (POST logins,
  // cross-origin, etc.) and all dynamic/medical endpoints fall through to the
  // network untouched — never cached.
  if (req.method !== 'GET' || url.origin !== self.location.origin || isDynamic(url)) {
    return;
  }

  // App-shell navigations: serve the cached shell so the installed app opens
  // offline. The shell contains no medical data — runtime data is fetched from
  // the API, which is online-only and handled by the app's own error states.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(function (cached) {
        return cached || fetch(req).catch(function () {
          return caches.match('./offline.html');
        });
      })
    );
    return;
  }

  // Static assets: cache-first, fall back to network (and cache the result so
  // newly added shell files are picked up). Scoped to same-origin GET above.
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        // Only cache successful, basic (same-origin) responses.
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return cached;   // undefined if truly unavailable -> browser shows error
      });
    })
  );
});
