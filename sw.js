// Offline cache. Pages and scripts are served from cache and refreshed in the background;
// question images are cached the first time they are viewed (or all at once from the home screen).
const CACHE = 'tmua-v2';
const SHELL = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/papers.js', 'js/store.js', 'js/topics.js', 'js/util.js',
  'js/logic-bank.js', 'js/drills/alevel.js', 'js/drills/gcse.js', 'data/questions.json', 'manifest.webmanifest', 'icons/icon-192.png'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; });
    if (!hit) return fresh;
    fresh.catch(() => {});
    return hit;
  }));
});
