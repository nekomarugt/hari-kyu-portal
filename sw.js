/* はり師きゅう師 解剖学・生理学ポータル service worker (scope: /hari-kyu-portal/)
 * - HTML / JS / CSS / JSON : network-first (always revalidated -> edits show immediately), cache fallback when offline
 * - ?v=hash assets : cache-first (immutable); images / fonts / icons : stale-while-revalidate
 * - Only touches Cache Storage entries prefixed "hkp-" (the sibling site on the same origin uses "jkp-"); never touches localStorage.
 * Bump VERSION when changing this file's strategy or the precache list. */
const VERSION = 'v29';
const PREFIX = 'hkp-';
const PAGES = PREFIX + 'pages-' + VERSION;
const STATIC = PREFIX + 'static-' + VERSION;
const SCOPE = new URL('./', self.location).pathname; // "/hari-kyu-portal/"
const PRECACHE = [
  './', './backnav.js', './styles.css', './theme.css', './icons/logo.svg', './game/game.css', './game/game.js', './game/avatars.js', './game/fx.js', './game/lore.js',
  './anatomy/', './anatomy/app.js', './anatomy/styles.css', './anatomy/questions.json', './anatomy/fields.json',
  './physiology/', './physiology/app.js', './physiology/styles.css', './physiology/questions.json', './physiology/fields.json',
  './keiketsu/', './keiketsu/app.js', './keiketsu/styles.css', './keiketsu/questions.json', './keiketsu/fields.json',
  './quiz/', './quiz/quiz.js',
  './guide/', './guide/guide.css', './guide/guide.js', './guide/qlinks.json', './guide/coverage.js', './guide/coverage/',
  './guide/anatomy/', './guide/anatomy/content.js', './guide/physiology/', './guide/physiology/content.js',
  './guide/anatomy/tooru.html', './guide/anatomy/tooru-data.js', './guide/tooru.js', './guide/extra.css',
  './guide/keiketsu/', './guide/keiketsu/keiketsu-data.js', './guide/keiketsu.js', './guide/keiketsu/assets/kei-04-tokunin.webp',
  './data/meridian-bridges.json', './bridges/meridian-bridges.js',
  './gacha/', './gacha/gacha.js', './gacha/omikuji.js', './gacha/gacha.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PAGES)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith(PREFIX) && k !== PAGES && k !== STATIC)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// gacha art (gacha/art/*.webp): runtime cache, cache-first (not precached; files never change in place - rename to update)
const ART = /\/gacha\/art\/[^/]+\.webp$/i;
const CACHE_FIRST = /\.(png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|pdf)$/i;

async function networkFirst(request, isNav) {
  const cache = await caches.open(PAGES);
  try {
    // no-cache: revalidate with the server (bypasses GitHub Pages' 10-min HTTP cache, cheap 304s)
    const res = await fetch(request, { cache: 'no-cache' });
    if (res && res.ok && res.type === 'basic') cache.put(request, res.clone());
    return res;
  } catch (err) {
    const hit = (await cache.match(request)) || (await cache.match(request, { ignoreSearch: true }));
    if (hit) return hit;
    if (isNav) {
      const home = await cache.match('./');
      if (home) return home;
    }
    throw err;
  }
}

// ?v=hash assets are immutable: cache-first, and drop older versions of the same file.
// Unversioned images/fonts: stale-while-revalidate (instant from cache, refreshed in background,
// so an edited figure shows up on the next visit without bumping VERSION).
async function cacheFirst(request, versioned) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  const refresh = () => fetch(request, { cache: 'no-cache' }).then(async (res) => {
    if (res && res.ok && res.type === 'basic') {
      if (versioned) {
        const path = new URL(request.url).pathname;
        for (const k of await cache.keys()) {
          if (new URL(k.url).pathname === path && k.url !== request.url) await cache.delete(k);
        }
      }
      await cache.put(request, res.clone());
    }
    return res;
  });
  if (hit) {
    if (!versioned) refresh().catch(() => {});
    return hit;
  }
  return refresh();
}

async function artFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok && res.type === 'basic') cache.put(request, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return; // other sites / CDNs: untouched
  if (url.pathname === SCOPE + 'sw.js') return;
  const isNav = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const versioned = url.searchParams.has('v');
  if (!isNav && ART.test(url.pathname)) {
    event.respondWith(artFirst(req));
    return;
  }
  if (!isNav && (versioned || CACHE_FIRST.test(url.pathname))) {
    event.respondWith(cacheFirst(req, versioned));
  } else {
    event.respondWith(networkFirst(req, isNav));
  }
});
