/* Service worker: deixa o app abrir offline.
   Suba o CACHE quando alterar qualquer arquivo do app. */
const CACHE = 'plano-v5';
const ASSETS = [
  '.', 'index.html',
  'assets/styles.css', 'assets/data.js', 'assets/app.js',
  'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-512-maskable.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* stale-while-revalidate: responde rápido do cache e atualiza em segundo plano */
self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  ev.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached || Response.error());
      return cached || network;
    })
  );
});
