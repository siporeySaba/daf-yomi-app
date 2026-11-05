// Network-first: תמיד מנסה להביא את הגרסה העדכנית, ונופל למטמון רק בלי אינטרנט.
const CACHE_NAME = 'daf-yomi-v3';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './main.js',
  './firebase.js',
  './gemaraRenderer.js',
  './schedule.js',
  './store.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.log('Cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // רק קבצים של האפליקציה עצמה. Firebase/גוגל עוברים ישירות לרשת.
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then(r =>
          r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)
        )
      )
  );
});
