// Service worker: face aplicația instalabilă și utilă fără semnal.
// Paginile de sondaj se păstrează în cache (clientul scanează QR-ul în magazin,
// unde semnalul e slab), iar paginile de administrare merg doar online.
const CACHE = 'equil-nps-v2';
const SHELL = ['/offline', '/manifest.webmanifest', '/icons/icon-192.png', '/sondaj.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isSurvey = (url) => /^\/(s|r)\//.test(url.pathname);
const isStatic = (url) => /^\/(icons\/|manifest\.webmanifest|sondaj\.js)/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((response) => store(request, response))),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => (isSurvey(url) ? store(request, response) : response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match('/offline'))),
    );
  }
});

function store(request, response) {
  if (response && response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}
