'use strict';
/* Card artwork is fetched by card name from Scryfall (https://scryfall.com/docs/api/images) so the app stays tiny.
 * Requests are throttled (Scryfall asks for <10/sec) and cached by the browser/WebView.
 * If an image can't be loaded (offline, blocked) the UI falls back to a drawn text card, so the game always works.
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const Images = (MTG.Images = {
  enabled: true, offline: false, failed: new Set(), ok: new Map(), failedCount: 0, succeeded: 0, active: 0, queue: [], MAX: 4,
  url(name, version, mode) { return `https://api.scryfall.com/cards/named?format=image&version=${version || 'small'}&${mode || 'exact'}=${encodeURIComponent(name)}`; },
  // Resolves to a URL that is already in the browser cache, or null.
  load(name, version) {
    const key = name + '|' + version;
    if (!Images.enabled || Images.offline || typeof Image === 'undefined') return Promise.resolve(null);
    if (Images.ok.has(key)) return Images.ok.get(key);
    const p = new Promise((resolve) => { Images.queue.push({ name, version, resolve, tries: 0 }); Images.pump(); });
    Images.ok.set(key, p);
    return p;
  },
  pump() {
    while (Images.active < Images.MAX && Images.queue.length) {
      const job = Images.queue.shift(); Images.active++;
      const img = new Image();
      const mode = job.tries === 0 ? 'exact' : 'fuzzy';
      const url = Images.url(job.name, job.version, mode);
      const done = (ok) => {
        Images.active--;
        if (ok) { Images.succeeded++; Images.failedCount = 0; job.resolve(url); }
        else if (job.tries === 0) { job.tries++; Images.queue.unshift(job); }
        else { Images.failedCount++; Images.failed.add(job.name + '|' + job.version); job.resolve(null); if (Images.failedCount >= 8 && !Images.succeeded) Images.offline = true; }
        Images.pump();
      };
      img.onload = () => done(true); img.onerror = () => done(false);
      img.src = url;
    }
  },
  reset() { for (const k of Images.failed) Images.ok.delete(k); Images.failed.clear(); Images.offline = false; Images.failedCount = 0; },
  preload(names, version) { for (const n of new Set(names)) { const d = MTG.cards[n]; if (d && !d.basic) Images.load(n, version || 'small'); } },
  // Put the artwork for `name` into <img>; calls cb(true) when shown.
  attach(img, name, version, cb) {
    Images.load(name, version).then((url) => { if (url && img.dataset.name === name) { img.src = url; if (cb) cb(true); } else if (cb) cb(false); });
  },
});
})();
