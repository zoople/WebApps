/* Offline support for Merge Stories. The console, the engine, every cartridge and the icons are kept on the
   phone, so it opens instantly with no internet (or a hanging one). Each launch shows the stored copy and
   quietly fetches the latest in the background; the console's "new version" check then offers the update.
   Engine and cartridges are requested as file?v=<version>, so after an update the new index never runs
   against an old engine: a version it hasn't stored yet comes from the network (with a short timeout). */
const PREFIX = 'merge-stories-', CACHE = PREFIX + 'v1';
const SHELL = ['./', 'index.html', 'catalog.js', 'engine.js', 'merge-stories.webmanifest',
  'events/larkspur-attic/event.js', 'events/larkspur-attic/icon.svg',
  'events/pennywhistle-fete/event.js', 'events/pennywhistle-fete/icon.svg',
  'icons/icon.svg', 'icons/icon-32.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
// also file each script under the exact ?v= the console will ask for, so even the first launch with no network is instant
const tagged = c => c.match('index.html').then(r => r.text()).then(t => {
  const m = t.match(/const VERSION='([^' ]+)/); if (!m) return;
  const v = encodeURIComponent(m[1]);
  return Promise.all(SHELL.filter(f => f.endsWith('.js')).map(f => c.match(f).then(r => r && c.put(new URL(f, location).href + '?v=' + v, r))));
});
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).then(() => tagged(c))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
const keep = (keys, res) => { if (res && res.ok && res.type === 'basic') keys.forEach(k => { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(k, c)); }); return res; };
const timeout = ms => new Promise((_, no) => setTimeout(() => no(new Error('slow')), ms));
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  let path = url.pathname; if (path.endsWith('/')) path += 'index.html';
  const plain = url.origin + path, v = url.searchParams.get('v');
  // the console's update check (?_=...): always ask the network, and keep what it returns for the next launch
  if (url.searchParams.has('_')) { e.respondWith(fetch(req).then(r => keep([plain], r))); return; }
  // a versioned script: the exact version if stored, else the network (quickly), else whatever copy we have
  if (v && !path.endsWith('index.html')) {
    const exact = plain + '?v=' + v;
    e.respondWith(caches.match(exact).then(hit => hit || Promise.race([fetch(req).then(r => keep([exact, plain], r)), timeout(2500)])
      .then(r => r && r.ok ? r : caches.match(plain).then(p => p || r))
      .catch(() => caches.match(plain).then(p => p || Response.error()))));
    return;
  }
  e.respondWith(caches.match(plain).then(hit => {
    const net = fetch(req).then(r => keep([plain], r));
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
