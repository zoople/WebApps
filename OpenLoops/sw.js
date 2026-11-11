/* Offline support. The course page, manifest and icons are kept on the phone, so it opens instantly with
   no internet (or a hanging one). Each launch shows the stored copy and quietly fetches the latest;
   the page's own "new version" check then offers the update. Podcast audio is stored only when the user taps
   "Save audio for offline" (separate cache, served with range support so seeking works). */
const PREFIX = 'openloops-', CACHE = PREFIX + 'v1', AUDIO = 'olaudio-v1';
const SHELL = ['./', 'index.html', 'open-loops.webmanifest', 'icons/icon.svg', 'icons/icon-32.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
const keep = (key, res) => { if (res && res.ok && res.type === 'basic') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(key, c)); } return res; };
async function audio(req) {
  const hit = await (await caches.open(AUDIO)).match(req.url);
  if (!hit) return fetch(req);
  const range = req.headers.get('range');
  if (!range) return hit;
  const buf = await hit.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range);
  const s = m && m[1] ? +m[1] : 0, e = Math.min(m && m[2] ? +m[2] : buf.byteLength - 1, buf.byteLength - 1);
  return new Response(buf.slice(s, e + 1), { status: 206, headers: { 'Content-Type': 'audio/mpeg', 'Content-Range': 'bytes ' + s + '-' + e + '/' + buf.byteLength, 'Content-Length': String(e - s + 1), 'Accept-Ranges': 'bytes' } });
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/audio/')) { e.respondWith(audio(req)); return; }
  const key = url.origin + url.pathname;
  if (url.searchParams.has('_')) { e.respondWith(fetch(req).then(r => keep(key, r))); return; }
  e.respondWith(caches.match(key).then(hit => {
    const net = fetch(req).then(r => keep(key, r));
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
