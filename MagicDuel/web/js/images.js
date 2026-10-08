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
  stats: { ok: 0, fail: 0 }, lastError: '',
  pump() {
    while (Images.active < Images.MAX && Images.queue.length) {
      const job = Images.queue.shift(); Images.active++;
      const finish = (url) => {
        Images.active--;
        if (url) { Images.succeeded++; Images.stats.ok++; Images.failedCount = 0; job.resolve(url); }
        else if (job.tries < 2) { job.tries++; Images.queue.unshift(job); }
        else { Images.failedCount++; Images.stats.fail++; Images.failed.add(job.name + '|' + job.version); job.resolve(null); if (Images.failedCount >= 8 && !Images.succeeded) Images.offline = true; }
        Images.pump();
      };
      const tryImg = (url) => { const img = new Image(); img.onload = () => finish(url); img.onerror = () => { Images.lastError = 'Image request failed (' + url.slice(0, 60) + '…)'; finish(null); }; img.src = url; };
      if (job.tries === 0) tryImg(Images.url(job.name, job.version, 'exact'));
      else if (job.tries === 1 && typeof fetch === 'function') {
        // Second route: ask the JSON API for the direct CDN image address, then load that.
        fetch('https://api.scryfall.com/cards/named?exact=' + encodeURIComponent(job.name), { headers: { Accept: 'application/json' } })
          .then((r) => { if (!r.ok) throw new Error('Scryfall answered ' + r.status); return r.json(); })
          .then((j) => { const u = (j.image_uris || (j.card_faces && j.card_faces[0].image_uris) || {})[job.version]; if (!u) throw new Error('no image in reply'); tryImg(u); })
          .catch((e) => { Images.lastError = 'Scryfall lookup failed: ' + (e && e.message ? e.message : e); finish(null); });
      } else tryImg(Images.url(job.name, job.version, 'fuzzy'));
    }
  },
  // Fetch every card's art now so it is cached for offline play. cb(done, total, failed)
  downloadAll(cb) {
    Images.reset(); Images.enabled = true;
    const names = Object.keys(MTG.cards).filter((n) => !MTG.cards[n].basic);
    let done = 0, bad = 0;
    return Promise.all(names.map((n) => Images.load(n, 'small').then((u) => { done++; if (!u) bad++; if (cb) cb(done, names.length, bad); }))).then(() => ({ total: names.length, failed: bad }));
  },
  reset() { for (const k of Images.failed) Images.ok.delete(k); Images.failed.clear(); Images.offline = false; Images.failedCount = 0; },
  preload(names, version) { for (const n of new Set(names)) { const d = MTG.cards[n]; if (d && !d.basic) Images.load(n, version || 'small'); } },
  // Put the artwork for `name` into <img>; calls cb(true) when shown.
  attach(img, name, version, cb) {
    Images.load(name, version).then((url) => { if (url && img.dataset.name === name) { img.src = url; if (cb) cb(true); } else if (cb) cb(false); });
  },
});
})();
