/* Offline support. The app, its manifest and icons are kept on the phone, so it opens instantly with
   no internet (or a hanging one). Each launch shows the stored copy straight away and quietly fetches the
   latest in the background; the app's own "new version" check then offers the update. */
const PREFIX = 'grace-', CACHE = PREFIX + 'v1';
const SHELL = ['grace.html', 'grace.webmanifest', 'icons/icon.svg', 'icons/icon-32.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
const keep = (key, res) => { if (res && res.ok && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(key, c)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const key = url.origin + url.pathname;
  // the app's own update check (?_=...): always ask the network, and keep what it returns for the next launch
  if (url.searchParams.has('_')) { e.respondWith(fetch(req).then(r => keep(key, r))); return; }
  e.respondWith(caches.match(key).then(hit => {
    const net = fetch(req).then(r => keep(key, r));
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
