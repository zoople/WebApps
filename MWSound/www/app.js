'use strict';
const APP_VERSION = '1.1.2';
const ERRS = [];
function showErr(m) {
  ERRS.push(String(m).slice(0, 200)); if (ERRS.length > 8) ERRS.shift();
  try { let b = document.getElementById('errbar'); if (!b) { b = document.createElement('div'); b.id = 'errbar'; b.onclick = () => b.remove(); document.body.appendChild(b); } b.textContent = '⚠ ' + ERRS[ERRS.length - 1] + ' (tap to hide)'; } catch (x) { }
}
window.addEventListener('error', e => showErr(e.message + (e.lineno ? ' @' + e.lineno : '')));
window.addEventListener('unhandledrejection', e => showErr('promise: ' + ((e.reason && e.reason.message) || e.reason)));
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = t => { if (t == null || !isFinite(t)) return '—'; t = Math.max(0, Math.round(t)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EPS = window.MW_EPISODES;
const byId = Object.fromEntries(EPS.map(e => [e.id, e]));
const epLabel = e => 'S' + e.series + 'E' + e.ep;
const epDate = e => { const [y, m, d] = e.date.split('-'); return +d + ' ' + MON[m - 1] + ' ' + y; };
const epUrl = e => window.MW_BASE + encodeURIComponent(e.file);
const mb = b => (b / 1048576).toFixed(b > 1e8 ? 0 : 1) + ' MB';
const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

/* ---------- state ---------- */
const S = { fav: load('mw.fav', []), marks: load('mw.marks', {}), names: load('mw.names', {}), dl: {}, dls: {}, bm: load('mw.bm', []) };
const persist = () => { save('mw.fav', S.fav); save('mw.marks', S.marks); save('mw.names', S.names); save('mw.bm', S.bm); };
const getNames = e => S.names[e.id] || e.sketches.map(s => s.n);
const getStarts = e => {
  const n = getNames(e).length;
  const a = S.marks[e.id] || (window.MW_TIMESTAMPS || {})[e.id] || [];
  return Array.from({ length: n }, (_, i) => (typeof a[i] === 'number' ? a[i] : null));
};
const favKey = (id, i) => id + ':' + i;
const isFav = (id, i) => S.fav.includes(favKey(id, i));
function segEnd(e, idx) {
  const st = getStarts(e), s = st[idx];
  if (s == null) return null;
  let best = null;
  st.forEach(x => { if (x != null && x > s + 0.5 && (best == null || x < best)) best = x; });
  return best;
}
function curIndex(e, t) {
  const st = getStarts(e); let r = -1, bs = -1;
  st.forEach((x, i) => { if (x != null && x <= t + 0.3 && x >= bs) { bs = x; r = i; } });
  return r;
}

/* ---------- storage: native files (Capacitor) or IndexedDB (browser) ---------- */
const CAP = window.Capacitor;
const native = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
const FS = native ? CAP.Plugins.Filesystem : null;
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('mw', 1); r.onupgradeneeded = () => r.result.createObjectStore('audio'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const idbDo = async (mode, fn) => { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction('audio', mode); const rq = fn(tx.objectStore('audio')); tx.oncomplete = () => res(rq && rq.result); tx.onerror = () => rej(tx.error); }); };
const blobUrls = {};
const Store = {
  key: e => 'mw/' + e.id + '.mp3',
  async size(e) {
    try {
      if (native) { const s = await FS.stat({ path: this.key(e), directory: 'DATA' }); return s.size > 1e6 ? s.size : 0; }
      const b = await idbDo('readonly', st => st.get(e.id)); return b ? b.size : 0;
    } catch (x) { return 0; }
  },
  async url(e) {
    if (native) { const u = await FS.getUri({ path: this.key(e), directory: 'DATA' }); return CAP.convertFileSrc(u.uri); }
    if (!blobUrls[e.id]) { const b = await idbDo('readonly', st => st.get(e.id)); if (!b) throw new Error('missing'); blobUrls[e.id] = URL.createObjectURL(b); }
    return blobUrls[e.id];
  },
  async bytes(e) {
    if (native) { const r = await fetch(await this.url(e)); return r.arrayBuffer(); }
    const b = await idbDo('readonly', st => st.get(e.id)); return b.arrayBuffer();
  },
  async download(e, onProg, ctl) {
    const url = epUrl(e);
    if (native) {
      const tmp = this.key(e) + '.part';
      // Capacitor's Android downloadFile ignores `recursive` and fails with ENOENT if the folder is missing
      try { await FS.mkdir({ path: 'mw', directory: 'DATA', recursive: true }); } catch (x) { /* already exists */ }
      try { await FS.deleteFile({ path: tmp, directory: 'DATA' }); } catch (x) { }
      const h = await FS.addListener('progress', p => { if (p.url === url) onProg(p.bytes, p.contentLength); });
      try {
        await FS.downloadFile({ url, path: tmp, directory: 'DATA', recursive: true, progress: true });
        const s = await FS.stat({ path: tmp, directory: 'DATA' });
        if (s.size < 1e6) { try { await FS.deleteFile({ path: tmp, directory: 'DATA' }); } catch (x) { } throw new Error('Server sent an error instead of audio (file name may differ)'); }
        try { await FS.deleteFile({ path: this.key(e), directory: 'DATA' }); } catch (x) { }
        await FS.rename({ from: tmp, to: this.key(e), directory: 'DATA', toDirectory: 'DATA' });
      } finally { h.remove(); }
      return;
    }
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const total = +r.headers.get('content-length') || 0;
    const rd = r.body.getReader(); const parts = []; let got = 0;
    for (; ;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onProg(got, total); }
    if (got < 1e6) throw new Error('Server sent an error instead of audio');
    await idbDo('readwrite', st => st.put(new Blob(parts, { type: 'audio/mpeg' }), e.id));
  },
  async remove(e) {
    try { if (native) await FS.deleteFile({ path: this.key(e), directory: 'DATA' }); else { await idbDo('readwrite', st => st.delete(e.id)); if (blobUrls[e.id]) { URL.revokeObjectURL(blobUrls[e.id]); delete blobUrls[e.id]; } } } catch (x) { }
  }
};
async function refreshDownloads() {
  await Promise.all(EPS.map(async e => { const s = await Store.size(e); if (s) S.dl[e.id] = s; else delete S.dl[e.id]; }));
  render();
}

/* ---------- UI helpers ---------- */
let toastT;
function toast(m, ms = 3200) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
function modal(html, onMount) { const m = $('#modal'); m.innerHTML = '<div class="box">' + html + '</div>'; m.hidden = false; if (onMount) onMount(m); }
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; }
const confirmBox = (title, body, yes = 'Yes', danger = true) => new Promise(res => {
  modal('<h3>' + esc(title) + '</h3><p>' + esc(body) + '</p><div class="btns"><button id="cn">Cancel</button><button id="cy" class="' + (danger ? 'danger' : 'pri') + '">' + esc(yes) + '</button></div>', m => {
    $('#cn', m).onclick = () => { closeModal(); res(false); }; $('#cy', m).onclick = () => { closeModal(); res(true); };
  });
});
const promptBox = (title, val) => new Promise(res => {
  modal('<h3>' + esc(title) + '</h3><input id="pi" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--line);background:var(--card2);color:var(--ink);font:inherit" value="' + esc(val || '') + '"><div class="btns"><button id="cn">Cancel</button><button id="cy" class="pri">OK</button></div>', m => {
    $('#cn', m).onclick = () => { closeModal(); res(null); }; $('#cy', m).onclick = () => { const v = $('#pi', m).value.trim(); closeModal(); res(v || null); };
  });
});

/* ---------- player ---------- */
const audio = $('#audio');
const P = { mode: null, ep: null, items: [], qi: 0, segEnd: null, loadedId: null, token: 0, local: false };

async function sourceFor(e) {
  if (S.dl[e.id]) { try { return { url: await Store.url(e), local: true }; } catch (x) { delete S.dl[e.id]; } }
  if (navigator.onLine === false) return null;
  return { url: epUrl(e), local: false };
}
async function loadEp(e) {
  if (P.loadedId === e.id && audio.getAttribute('src')) return true;
  const my = ++P.token;
  const src = await sourceFor(e);
  if (!src) { toast('Offline — download ' + epLabel(e) + ' first'); return false; }
  audio.src = src.url; P.loadedId = e.id; P.local = src.local;
  const ok = await new Promise(res => {
    const done = v => { clearTimeout(to); audio.removeEventListener('loadedmetadata', a); audio.removeEventListener('error', b); res(v); };
    const a = () => done(true), b = () => done(false);
    const to = setTimeout(() => done(false), 20000);
    audio.addEventListener('loadedmetadata', a); audio.addEventListener('error', b);
  });
  if (my !== P.token) return false;
  if (!ok) { P.loadedId = null; audio.removeAttribute('src'); toast(src.local ? 'Could not open the downloaded file' : 'Network not responding — could not stream ' + epLabel(e), 4500); }
  return ok;
}
async function playEpisode(e, from = 0) {
  P.mode = 'episode'; P.ep = e; P.items = []; P.segEnd = null;
  if (!(await loadEp(e))) { updateNow(); return; }
  audio.currentTime = from; try { await audio.play(); } catch (x) { }
  updateNow(); render();
}
async function playQueue(items, qi = 0) { P.mode = 'queue'; P.items = items; P.qi = qi; await startItem(); }
async function startItem() {
  for (; ;) {
    const it = P.items[P.qi];
    if (!it) { audio.pause(); P.mode = null; updateNow(); render(); toast('Favourites finished'); return; }
    const e = byId[it.id], st = getStarts(e)[it.idx];
    if (st == null) { toast('Skipped "' + getNames(e)[it.idx] + '" — no time set'); P.qi++; continue; }
    P.ep = e;
    if (!(await loadEp(e))) { P.qi++; continue; }
    P.segEnd = segEnd(e, it.idx);
    audio.currentTime = st; try { await audio.play(); } catch (x) { }
    updateNow(); render(); return;
  }
}
function nextItem() {
  const cur = P.items[P.qi], nx = P.items[P.qi + 1];
  if (cur && nx && cur.id === nx.id) {
    const st = getStarts(byId[nx.id])[nx.idx];
    if (st != null && Math.abs(st - audio.currentTime) < 1.2) { P.qi++; P.segEnd = segEnd(byId[nx.id], nx.idx); updateNow(); render(); return; }
  }
  P.qi++; startItem();
}
function curSketch() {
  if (P.mode === 'queue' && P.items[P.qi]) return { e: byId[P.items[P.qi].id], idx: P.items[P.qi].idx };
  if (P.ep) { const i = curIndex(P.ep, audio.currentTime || 0); return i >= 0 ? { e: P.ep, idx: i } : { e: P.ep, idx: -1 }; }
  return null;
}
function updateNow() {
  const c = curSketch(), f = $('#now');
  f.classList.toggle('idle', !c);
  if (!c) { $('#nowEp').textContent = 'Nothing playing'; $('#nowSk').textContent = 'Pick an episode or play your favourites'; $('#bFav').textContent = '☆'; return; }
  const names = getNames(c.e), known = getStarts(c.e).some(x => x != null);
  $('#nowEp').textContent = epLabel(c.e) + ' · ' + epDate(c.e) + (P.local ? '' : ' · streaming');
  $('#nowSk').textContent = c.idx >= 0 ? (c.idx + 1) + '/' + names.length + '  ' + names[c.idx] : (known ? 'Intro' : (names.length ? 'Sketch times not set — tap 🔖 to bookmark' : 'No sketch list — tap 🔖 to bookmark'));
  $('#bFav').textContent = c.idx >= 0 && isFav(c.e.id, c.idx) ? '★' : '☆';
  $('#tmode').textContent = P.mode === 'queue' ? 'favourites ' + (P.qi + 1) + '/' + P.items.length : '';
  $('#bPlay').textContent = audio.paused ? '▶' : '⏸';
  if ('mediaSession' in navigator) {
    try { navigator.mediaSession.metadata = new MediaMetadata({ title: c.idx >= 0 ? names[c.idx] : epLabel(c.e), artist: 'That Mitchell and Webb Sound', album: epLabel(c.e) + ' · ' + epDate(c.e) }); } catch (x) { }
  }
}
let lastCur = '';
function tick() {
  const d = audio.duration || 0, t = audio.currentTime || 0;
  if (P.mode === 'queue' && !audio.paused && P.segEnd != null && t >= P.segEnd - 0.05) { nextItem(); return; }
  if (!seeking) { $('#seek').value = d ? Math.round(t / d * 1000) : 0; }
  $('#tcur').textContent = fmt(t); $('#tdur').textContent = fmt(d);
  const c = curSketch(), k = c ? c.e.id + ':' + c.idx : '';
  if (k !== lastCur) { lastCur = k; updateNow(); highlightCur(); }
}
function highlightCur() {
  document.querySelectorAll('.sk.cur').forEach(x => x.classList.remove('cur'));
  const c = curSketch(); if (!c || c.idx < 0) return;
  const el = document.getElementById('sk-' + c.e.id + '-' + c.idx); if (el) el.classList.add('cur');
}
let seeking = false;
$('#seek').addEventListener('input', () => { seeking = true; const d = audio.duration || 0; $('#tcur').textContent = fmt($('#seek').value / 1000 * d); });
$('#seek').addEventListener('change', () => { const d = audio.duration || 0; if (d) audio.currentTime = $('#seek').value / 1000 * d; seeking = false; });
setInterval(tick, 250);
audio.addEventListener('timeupdate', tick);
audio.addEventListener('play', () => { updateNow(); });
audio.addEventListener('pause', () => { updateNow(); });
audio.addEventListener('waiting', () => { if (P.ep) $('#tmode').textContent = 'buffering…'; });
audio.addEventListener('playing', () => { updateNow(); });
audio.addEventListener('ended', () => { if (P.mode === 'queue') nextItem(); else { updateNow(); } });
audio.addEventListener('error', () => { if (P.ep && audio.getAttribute('src')) toast('Playback error' + (P.local ? '' : ' — check your connection')); });

$('#bPlay').onclick = () => { if (!P.ep) return; if (audio.paused) audio.play().catch(() => { }); else audio.pause(); };
$('#bBack').onclick = () => { audio.currentTime = Math.max(0, audio.currentTime - 15); };
$('#bFwd').onclick = () => { audio.currentTime = Math.min(audio.duration || 1e9, audio.currentTime + 30); };
$('#bNext').onclick = () => {
  if (!P.ep) return;
  if (P.mode === 'queue') { nextItem(); return; }
  const t = audio.currentTime, nx = getStarts(P.ep).filter(x => x != null && x > t + 0.5).sort((a, b) => a - b)[0];
  if (nx != null) audio.currentTime = nx; else toast('No later sketch time known');
};
$('#bPrev').onclick = () => {
  if (!P.ep) return;
  if (P.mode === 'queue') { const st = getStarts(P.ep)[P.items[P.qi].idx]; if (audio.currentTime - st > 3 || P.qi === 0) { audio.currentTime = st; } else { P.qi--; startItem(); } return; }
  const t = audio.currentTime, st = getStarts(P.ep).filter(x => x != null).sort((a, b) => a - b), cur = st.filter(x => x <= t - 3).pop();
  audio.currentTime = cur != null ? cur : 0;
};
$('#bMark').onclick = () => addBookmark();
$('#bFav').onclick = () => { const c = curSketch(); if (!c || c.idx < 0) { toast('No sketch here yet — tap 🔖 to bookmark this spot instead'); return; } toggleFav(c.e.id, c.idx); };
if ('mediaSession' in navigator) {
  const h = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f); } catch (x) { } };
  h('play', () => audio.play()); h('pause', () => audio.pause()); h('nexttrack', () => $('#bNext').click()); h('previoustrack', () => $('#bPrev').click());
}

function toggleFav(id, idx) {
  const k = favKey(id, idx), i = S.fav.indexOf(k);
  if (i >= 0) S.fav.splice(i, 1); else S.fav.push(k);
  persist(); updateNow(); render(true);
}
/* ---------- bookmarks (work even when no sketch times are known) ---------- */
const bmById = id => S.bm.find(b => b.id === id);
function addBookmark() {
  const e = P.ep;
  if (!e || !audio.getAttribute('src')) { toast('Play an episode first, then tap 🔖'); return; }
  const t = Math.round((audio.currentTime || 0) * 10) / 10, c = curSketch();
  const label = c && c.idx >= 0 ? getNames(c.e)[c.idx] : '';
  S.bm.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ep: e.id, t, label, at: Date.now() });
  persist(); render(true); toast('🔖 ' + epLabel(e) + ' at ' + fmt(t) + ' saved');
}
function bmRow(b) {
  const e = byId[b.ep]; if (!e) return '';
  return '<div class="row"><div class="main" data-act="bmmenu" data-b="' + b.id + '"><div class="t">' + esc(b.label || 'Bookmark') + '</div><div class="s">' + epLabel(e) + ' · ' + epDate(e) + ' · ' + fmt(b.t) + (S.dl[e.id] ? ' · ✓ offline' : ' · streams') + '</div></div>' +
    '<button data-act="bmplay" data-b="' + b.id + '" aria-label="Play from bookmark">▶</button><button data-act="bmdel" data-b="' + b.id + '" aria-label="Delete bookmark">🗑</button></div>';
}
const bmSorted = () => S.bm.filter(b => byId[b.ep]).sort((a, b) => EPS.indexOf(byId[a.ep]) - EPS.indexOf(byId[b.ep]) || a.t - b.t);
function bmMenu(b) {
  const e = byId[b.ep];
  modal('<h3>' + esc(b.label || 'Bookmark') + '</h3><p class="note">' + epLabel(e) + ' · ' + fmt(b.t) + '</p><div class="actions"><button data-m="play" class="pri">▶ Play from here</button><button data-m="sketch">📌 Use as a sketch start</button><button data-m="ren">✎ Rename</button><button data-m="del" class="danger">🗑 Delete</button></div><div class="btns"><button data-m="close">Close</button></div>', m => {
    m.onclick = async ev => {
      const k = ev.target.dataset && ev.target.dataset.m; if (!k) return;
      if (k === 'close') closeModal();
      else if (k === 'play') { closeModal(); playEpisode(e, b.t); }
      else if (k === 'del') { closeModal(); S.bm = S.bm.filter(x => x.id !== b.id); persist(); render(true); }
      else if (k === 'ren') { closeModal(); const v = await promptBox('Rename bookmark', b.label); if (v) { b.label = v; persist(); render(true); } }
      else if (k === 'sketch') bmAssign(b);
    };
  });
}
function bmAssign(b) {
  const e = byId[b.ep], names = getNames(e), st = getStarts(e);
  const rows = names.map((n, i) => '<button data-i="' + i + '" style="width:100%;text-align:left;margin:3px 0">' + (i + 1) + '. ' + esc(n) + ' <span style="color:var(--mut)">(' + fmt(st[i]) + ')</span></button>').join('');
  modal('<h3>Which sketch starts at ' + fmt(b.t) + '?</h3>' + rows + '<button data-i="new" style="width:100%;margin:6px 0">+ New sketch here</button><div class="btns"><button data-i="cancel">Cancel</button></div>', m => {
    m.onclick = async ev => {
      const k = ev.target.closest('button') && ev.target.closest('button').dataset.i; if (k == null) return;
      if (k === 'cancel') { closeModal(); return; }
      let idx;
      if (k === 'new') { const v = await promptBox('Name this sketch', 'Sketch ' + (names.length + 1)); if (!v) return; const n = names.slice(); n.push(v); S.names[e.id] = n; idx = n.length - 1; persist(); }
      else idx = +k;
      setMark(e.id, idx, b.t); closeModal(); render(true); updateNow(); toast('Sketch ' + (idx + 1) + ' now starts at ' + fmt(b.t));
    };
  });
}
function favItems() {
  return S.fav.map(k => { const [id, i] = k.split(':'); return { id, idx: +i }; }).filter(x => byId[x.id] && getNames(byId[x.id])[x.idx] != null)
    .sort((a, b) => EPS.indexOf(byId[a.id]) - EPS.indexOf(byId[b.id]) || (getStarts(byId[a.id])[a.idx] == null ? a.idx : getStarts(byId[a.id])[a.idx]) - (getStarts(byId[b.id])[b.idx] == null ? b.idx : getStarts(byId[b.id])[b.idx]));
}

/* ---------- downloads ---------- */
const ctls = {};
async function startDownload(e) {
  if (S.dls[e.id] && S.dls[e.id].status === 'downloading') return;
  if (navigator.onLine === false) { toast('No connection — can’t download right now'); return; }
  const st = S.dls[e.id] = { status: 'downloading', got: 0, total: 0, last: Date.now() };
  ctls[e.id] = new AbortController();
  const watch = setInterval(() => { if (st.status === 'downloading' && Date.now() - st.last > 60000) { st.status = 'error'; st.msg = 'Stalled — no data for 60s. Tap ⬇ to retry.'; try { ctls[e.id].abort(); } catch (x) { } updateRow(e.id); clearInterval(watch); } }, 5000);
  let lastDraw = 0;
  try {
    await Store.download(e, (g, t) => { st.got = g; st.total = t || st.total; st.last = Date.now(); if (Date.now() - lastDraw > 300) { lastDraw = Date.now(); updateRow(e.id); } }, ctls[e.id]);
    if (st.status === 'error') return;
    S.dl[e.id] = await Store.size(e); delete S.dls[e.id]; toast(epLabel(e) + ' downloaded');
  } catch (x) {
    if (st.status !== 'error') { st.status = 'error'; st.msg = (x && x.message) || 'Download failed'; }
    toast(epLabel(e) + ': ' + st.msg, 5000);
  } finally { clearInterval(watch); updateRow(e.id); if (view.detail === e.id) render(true); }
}
async function removeDownload(e) {
  if (!(await confirmBox('Delete download?', 'Remove the downloaded audio for ' + epLabel(e) + ' (' + epDate(e) + ')? Favourites and sketch times stay.', 'Delete'))) return;
  if (P.loadedId === e.id) { audio.pause(); audio.removeAttribute('src'); P.loadedId = null; P.ep = null; P.mode = null; updateNow(); }
  await Store.remove(e); delete S.dl[e.id]; render(true);
}

/* ---------- auto-detect ---------- */
async function autoDetect(e) {
  modal('<h3>Analysing ' + esc(epLabel(e)) + '…</h3><p class="note">Decoding the audio on your phone and looking for gaps between sketches. This can take a minute.</p>');
  try {
    const buf = await Store.bytes(e);
    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC({ sampleRate: 8000 });
    const ab = await new Promise((res, rej) => ac.decodeAudioData(buf, res, rej));
    const sr = ab.sampleRate, n = ab.length, hop = Math.round(sr * 0.1), frames = Math.floor(n / hop);
    const c0 = ab.getChannelData(0), c1 = ab.numberOfChannels > 1 ? ab.getChannelData(1) : null;
    const rms = new Float32Array(frames);
    for (let f = 0; f < frames; f++) { let s = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { const v = c1 ? (c0[i] + c1[i]) / 2 : c0[i]; s += v * v; } rms[f] = Math.sqrt(s / hop); }
    try { ac.close(); } catch (x) { }
    DET = { e, rms, dt: hop / sr, K: getNames(e).length, level: getNames(e).length ? 1 : 0 };
    runDetect();
  } catch (x) { closeModal(); toast('Auto-detect failed: ' + ((x && x.message) || 'could not decode audio'), 5000); }
}
let DET = null;
function runDetect() { const d = DET; showDetect(d.e, MWDetect.detect(d.rms, d.dt, d.K, d.level), d.K); }
function showDetect(e, r, K) {
  const names = K ? getNames(e) : r.starts.map((_, i) => 'Sketch ' + (i + 1));
  const rows = r.starts.map((t, i) => '<div class="sk' + (t == null ? ' dim' : '') + '"><span class="n">' + (i + 1) + '</span><span class="nm">' + esc(names[i]) + '</span><span class="tm">' + fmt(t) + '</span>' + (t != null ? '<button data-pl="' + t + '" aria-label="Listen">▶</button>' : '') + '</div>').join('');
  const msg = K ? 'Found ' + r.found + ' of ' + r.needed + ' expected gaps. Blank times are left unset.' : 'No sketch list for this episode, so I numbered the ' + r.starts.length + ' sketches found.';
  modal('<h3>Suggested sketch times</h3><p class="note">' + esc(msg) + ' These are guesses* — tap ▶ to hear each one (starts 2s early).</p><p class="note">Sensitivity ' + (DET.level + 1) + '/4 — looser finds more but with more false breaks.</p>' + rows +
    '<div class="btns"><button id="lo"' + (DET.level <= 0 ? ' disabled' : '') + '>Stricter</button><button id="hi"' + (DET.level >= 3 ? ' disabled' : '') + '>Looser</button></div><div class="btns"><button id="cn">Discard</button><button id="cy" class="pri">Use these</button></div>', m => {
      m.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => { P.mode = 'episode'; P.ep = e; P.items = []; P.segEnd = null; loadEp(e).then(ok => { if (ok) { audio.currentTime = Math.max(0, +b.dataset.pl - 2); audio.play().catch(() => { }); updateNow(); } }); });
      $('#lo', m).onclick = () => { DET.level--; runDetect(); }; $('#hi', m).onclick = () => { DET.level++; runDetect(); };
      $('#cn', m).onclick = closeModal;
      $('#cy', m).onclick = () => { if (!K) S.names[e.id] = names; S.marks[e.id] = r.starts.slice(); persist(); closeModal(); render(true); updateNow(); toast('Times saved — adjust any that are off'); };
    });
}

/* ---------- views ---------- */
const view = { tab: 'eps', detail: null, edit: false, open: { 1: true } };
function rowHtml(e) {
  const names = getNames(e), has = S.dl[e.id], st = S.dls[e.id];
  const known = getStarts(e).filter(x => x != null).length;
  let sub = (names.length ? names.length + ' sketches' : 'no sketch list yet') + (names.length ? (known ? ' · ' + known + ' timed' : ' · times not set') : '');
  const prev = names.length ? names.slice(0, 3).join(' · ') + (names.length > 3 ? ' …' : '') : '';
  let bar = '', cls = 's';
  if (st && st.status === 'downloading') { const p = st.total ? Math.round(st.got / st.total * 100) : 0; sub = 'Downloading ' + (st.total ? p + '% · ' + mb(st.got) + ' / ' + mb(st.total) : mb(st.got)); bar = '<div class="bar"><i style="width:' + p + '%"></i></div>'; }
  else if (st && st.status === 'error') { sub = st.msg; cls = 's warn'; }
  else if (has) sub += ' · ✓ saved (' + mb(has) + ')';
  const dlBtn = st && st.status === 'downloading' ? '<button disabled>…</button>' : has ? '<button data-act="del" data-id="' + e.id + '" aria-label="Delete download">🗑</button>' : '<button data-act="dl" data-id="' + e.id + '" aria-label="Download">⬇</button>';
  return '<div class="row' + (P.ep && P.ep.id === e.id ? ' cur' : '') + '" id="row-' + e.id + '"><div class="main" data-act="open" data-id="' + e.id + '"><div class="t">' + epLabel(e) + ' · ' + epDate(e) + '</div><div class="' + cls + '">' + esc(sub) + '</div>' + (prev && !bar ? '<div class="s pv">' + esc(prev) + '</div>' : '') + bar + '</div>' +
    '<button data-act="play" data-id="' + e.id + '" aria-label="Play">▶</button>' + dlBtn + '</div>';
}
function updateRow(id) { const el = document.getElementById('row-' + id); if (el && !view.detail) el.outerHTML = rowHtml(byId[id]); }
function viewEpisodes() {
  let h = '';
  [1, 2, 3, 4, 5].forEach(s => {
    const list = EPS.filter(e => e.series === s), yr = list[0].date.slice(0, 4), got = list.filter(e => S.dl[e.id]).length;
    h += '<h2 data-act="ser" data-s="' + s + '" style="cursor:pointer">' + (view.open[s] ? '▾' : '▸') + ' Series ' + s + ' (' + yr + ') <span style="color:var(--mut);font-size:12px;text-transform:none">' + got + '/' + list.length + ' saved</span></h2>';
    if (view.open[s]) h += list.map(rowHtml).join('');
  });
  return h;
}
function viewDetail(id) {
  const e = byId[id], names = getNames(e), st = getStarts(e), has = S.dl[id], dls = S.dls[id];
  let h = '<button class="back" data-act="back">← All episodes</button><h2 style="margin-top:4px">' + epLabel(e) + ' · ' + epDate(e) + '</h2>';
  h += '<div class="actions"><button class="pri" data-act="play" data-id="' + id + '">▶ Play episode</button>' +
    (has ? '<button data-act="del" data-id="' + id + '">🗑 Delete download</button>' : '<button data-act="dl" data-id="' + id + '"' + (dls && dls.status === 'downloading' ? ' disabled' : '') + '>⬇ Download</button>') +
    '<button data-act="detect" data-id="' + id + '"' + (has ? '' : ' disabled') + '>✨ Auto-detect times</button>' +
    '<button data-act="edit">' + (view.edit ? '✔ Done editing' : '✎ Edit times') + '</button></div>';
  if (!has) h += '<p class="note">Auto-detect needs the episode downloaded. You can still stream it and mark times by hand.</p>';
  h += '<h2>' + (names.length ? names.length + ' sketches in running order*' : 'Sketches') + '</h2>';
  if (names.length && st.every(x => x == null)) h += '<p class="note">Start times are not known yet — use ✨ Auto-detect, or ✎ Edit times and ⏱ while listening. 🔖 in the player bookmarks any spot.</p>';
  if (!names.length) h += '<p class="note">No sketch list for this episode (series 5 has none). Use ✨ Auto-detect to number them, or ✎ Edit times → + Add sketch.</p>';
  if (view.edit) h += '<div class="actions"><button class="pri" data-act="marknext" data-id="' + id + '">⏱ Mark next sketch starts NOW</button></div><p class="note">Play the episode, tap the button at the start of each sketch in order. Fine-tune with the buttons under each row.</p>';
  names.forEach((n, i) => {
    const t = st[i], cur = P.ep && P.ep.id === id && curSketch() && curSketch().idx === i;
    h += '<div class="sk' + (cur ? ' cur' : '') + (t == null ? ' dim' : '') + '" id="sk-' + id + '-' + i + '"><span class="n">' + (i + 1) + '</span><span class="nm" data-act="playsk" data-id="' + id + '" data-i="' + i + '">' + esc(n) + '</span><span class="tm">' + fmt(t) + '</span>' +
      '<button data-act="playsk" data-id="' + id + '" data-i="' + i + '" aria-label="Play sketch">▶</button><button data-act="fav" data-id="' + id + '" data-i="' + i + '" aria-label="Favourite">' + (isFav(id, i) ? '★' : '☆') + '</button></div>';
    if (view.edit) h += '<div class="edit"><button data-act="nudge" data-d="-1" data-id="' + id + '" data-i="' + i + '">−1s</button><button data-act="nudge" data-d="1" data-id="' + id + '" data-i="' + i + '">+1s</button><button data-act="setnow" data-id="' + id + '" data-i="' + i + '">⏱ now</button><button data-act="clr" data-id="' + id + '" data-i="' + i + '">clear</button><button data-act="ren" data-id="' + id + '" data-i="' + i + '">rename</button></div>';
  });
  { const l = bmSorted().filter(b => b.ep === id); if (l.length) h += '<h2>Bookmarks</h2>' + l.map(bmRow).join(''); }
  if (view.edit) h += '<div class="actions"><button data-act="addsk" data-id="' + id + '">+ Add sketch</button></div>';
  return h;
}
function viewFavs() {
  const items = favItems();
  if (!items.length) return '<p class="note" style="margin-top:20px">No favourites yet. Open an episode and tap ☆ on a sketch, or tap ☆ in the player while it plays.</p>';
  const playable = items.filter(x => getStarts(byId[x.id])[x.idx] != null).length;
  let h = '<div class="actions"><button class="pri" data-act="playfav">▶ Play all favourites (' + playable + ')</button></div>';
  if (playable < items.length) h += '<p class="note">⚠ ' + (items.length - playable) + ' favourite(s) have no start time yet and will be skipped. Set times in the episode view.</p>';
  items.forEach((x, n) => {
    const e = byId[x.id], t = getStarts(e)[x.idx], en = segEnd(e, x.idx), ok = t != null, off = !S.dl[x.id] && navigator.onLine === false;
    h += '<div class="row' + (off ? ' dim' : '') + '"><div class="main" data-act="playfavat" data-n="' + n + '"><div class="t">' + esc(getNames(e)[x.idx]) + '</div><div class="s' + (ok ? '' : ' warn') + '">' + epLabel(e) + ' · ' + epDate(e) + ' · ' + (ok ? fmt(t) + (en != null ? '–' + fmt(en) : '–end') : 'no time set') + (S.dl[x.id] ? ' · ✓ offline' : ' · streams') + '</div></div>' +
      '<button data-act="playfavat" data-n="' + n + '">▶</button><button data-act="fav" data-id="' + x.id + '" data-i="' + x.idx + '" aria-label="Remove">★</button></div>';
  });
  return h;
}
function viewBookmarks() {
  const l = bmSorted();
  if (!l.length) return '<p class="note" style="margin-top:20px">No bookmarks yet.</p><ul class="note"><li>Tap 🔖 in the player to save the spot you are listening to.</li><li>Works with no sketch list or times.</li><li>Tap a bookmark → “Use as a sketch start” to turn it into a sketch time.</li></ul>';
  return '<p class="note">Tap a bookmark for options.</p>' + l.map(bmRow).join('');
}
function viewSettings() {
  const total = Object.values(S.dl).reduce((a, b) => a + b, 0), cnt = Object.keys(S.dl).length, missing = EPS.filter(e => !S.dl[e.id]);
  const fullscr = document.fullscreenElement || view.fs;
  return '<h2>Library</h2><div class="row"><div class="main"><div class="t">' + cnt + ' of ' + EPS.length + ' episodes saved</div><div class="s">' + mb(total) + ' on this phone</div></div></div><div class="row"><div class="main"><div class="t">Sketch lists: ' + EPS.filter(e => e.sketches.length).length + ' of ' + EPS.length + ' episodes</div><div class="s">' + EPS.reduce((a, e) => a + e.sketches.length, 0) + ' sketch names built in (series 1–4)*</div></div></div>' +
    '<div class="actions"><button data-act="dlall"' + (missing.length ? '' : ' disabled') + '>⬇ Download all remaining (' + missing.length + ' · ~' + Math.round(missing.length * 25.5) + ' MB)</button><button data-act="delall" class="danger"' + (cnt ? '' : ' disabled') + '>🗑 Delete all downloads</button></div>' +
    '<h2>Screen</h2><div class="actions"><button data-act="fs">⛶ ' + (fullscr ? 'Exit full screen' : 'Full screen') + '</button></div>' +
    '<h2>Your data</h2><div class="actions"><button data-act="clearsave" class="danger">Clear save (favourites, bookmarks, times, edits)</button></div><p class="note">Downloads are kept. Use “Delete all downloads” to remove those.</p>' +
    '<h2>Move your times between devices</h2><div class="actions"><button data-act="export">Export</button><button data-act="import">Import</button></div><textarea id="xfer" placeholder="Export puts a JSON backup here. Paste one here and tap Import to restore."></textarea>' +
    '<h2>Diagnostics</h2><div class="row"><div class="main"><div class="s">' + esc('v' + APP_VERSION + ' · ' + (native ? 'native' : 'browser') + ' · ' + EPS.length + ' episodes · ' + EPS.reduce((a, e) => a + e.sketches.length, 0) + ' sketch names · saved names for ' + Object.keys(S.names).length + ' eps · times for ' + Object.keys(S.marks).length + ' eps · ' + ((navigator.userAgent.match(/Chrome\/[\d.]+/) || ['WebView ?'])[0]) + ' · ' + screen.width + 'x' + screen.height + ' · errors: ' + (ERRS.length ? ERRS.join(' | ') : 'none')) + '</div></div></div><p class="note">Version ' + APP_VERSION + (native ? '' : ' (browser mode)') + '</p>' +
    '<details><summary>How it works</summary><ul><li>Episodes tab: ⬇ saves an episode for offline; ▶ streams it (or plays the saved copy).</li><li>While playing, the bar shows the episode and the sketch it’s on. ☆ favourites that sketch.</li><li>Favourites tab: plays just those sketches back to back — only the favourite parts.</li><li>Sketch names come from fan guides; <b>start times don’t exist online</b>, so use ✨ Auto-detect (guesses from gaps) and/or ✎ Edit times → ⏱ while listening.</li><li>Series 5 has no published sketch list; auto-detect numbers them and you can rename.</li><li>Nothing here needs the internet except downloading/streaming.</li></ul></details>';
}
function render(keepScroll) {
  const main = $('#main'), sy = main.scrollTop;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === view.tab));
  $('#favcount').textContent = S.fav.length || ''; $('#bmcount').textContent = S.bm.length || '';
  main.innerHTML = view.tab === 'eps' ? (view.detail ? viewDetail(view.detail) : viewEpisodes()) : view.tab === 'favs' ? viewFavs() : view.tab === 'bm' ? viewBookmarks() : viewSettings();
  if (keepScroll) main.scrollTop = sy;
}

/* ---------- actions ---------- */
async function exportData() { const t = JSON.stringify({ v: 1, marks: S.marks, names: S.names, fav: S.fav, bm: S.bm }); const ta = $('#xfer'); ta.value = t; ta.select(); try { await navigator.clipboard.writeText(t); toast('Copied to clipboard'); } catch (x) { toast('Select the text and copy it'); } }
function importData() {
  try { const d = JSON.parse($('#xfer').value); if (d.marks) Object.assign(S.marks, d.marks); if (d.names) Object.assign(S.names, d.names); if (Array.isArray(d.fav)) d.fav.forEach(k => { if (!S.fav.includes(k)) S.fav.push(k); }); if (Array.isArray(d.bm)) d.bm.forEach(b => { if (b && b.id && !bmById(b.id)) S.bm.push(b); }); persist(); render(true); toast('Imported'); }
  catch (x) { toast('That doesn’t look like an export'); }
}
async function setFullscreen() {
  try {
    if (native && CAP.Plugins.StatusBar) { if (view.fs) { await CAP.Plugins.StatusBar.show(); view.fs = false; } else { await CAP.Plugins.StatusBar.hide(); view.fs = true; } }
    else if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();
  } catch (x) { toast('Full screen not available here'); }
  if (view.tab === 'set') render(true);
}
const setMark = (id, i, v) => { const e = byId[id]; const a = getStarts(e); a[i] = v == null ? null : Math.max(0, Math.round(v * 10) / 10); S.marks[id] = a; persist(); };

document.addEventListener('click', async ev => {
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id, i = el.dataset.i != null ? +el.dataset.i : null, e = id ? byId[id] : null;
  switch (a) {
    case 'open': view.detail = id; view.edit = false; history.pushState({ d: id }, ''); render(); $('#main').scrollTop = 0; break;
    case 'back': history.back(); break;
    case 'ser': view.open[el.dataset.s] = !view.open[el.dataset.s]; render(true); break;
    case 'play': playEpisode(e, 0); break;
    case 'playsk': { const t = getStarts(e)[i]; if (t == null) { toast('No time set for this sketch yet — play the episode and use ✎ Edit times'); break; } P.mode = 'episode'; P.ep = e; P.items = []; P.segEnd = null; if (await loadEp(e)) { audio.currentTime = t; audio.play().catch(() => { }); updateNow(); } break; }
    case 'dl': startDownload(e); updateRow(id); if (view.detail) render(true); break;
    case 'del': removeDownload(e); break;
    case 'fav': toggleFav(id, i); break;
    case 'detect': autoDetect(e); break;
    case 'edit': view.edit = !view.edit; render(true); break;
    case 'marknext': {
      if (!P.ep || P.ep.id !== id) { toast('Play this episode first, then tap at each sketch start'); break; }
      const st = getStarts(e), k = st.findIndex(x => x == null); if (k < 0) { toast('Every sketch already has a time — use ⏱ now on a row to change one'); break; }
      setMark(id, k, audio.currentTime); render(true); toast('Sketch ' + (k + 1) + ' → ' + fmt(audio.currentTime)); break;
    }
    case 'setnow': if (P.ep && P.ep.id === id) { setMark(id, i, audio.currentTime); render(true); } else toast('Play this episode first'); break;
    case 'nudge': { const t = getStarts(e)[i]; if (t == null) { toast('Set a time first'); break; } setMark(id, i, t + +el.dataset.d); render(true); const nt = getStarts(e)[i]; if (P.ep && P.ep.id === id) audio.currentTime = nt; break; }
    case 'clr': setMark(id, i, null); render(true); break;
    case 'ren': { const v = await promptBox('Rename sketch', getNames(e)[i]); if (v) { const n = getNames(e).slice(); n[i] = v; S.names[id] = n; persist(); render(true); updateNow(); } break; }
    case 'addsk': { const n = getNames(e).slice(); n.push('Sketch ' + (n.length + 1)); S.names[id] = n; persist(); render(true); break; }
    case 'playfav': { const it = favItems(); if (it.length) playQueue(it, 0); break; }
    case 'playfavat': { const it = favItems(); playQueue(it, +el.dataset.n); break; }
    case 'fs': setFullscreen(); break;
    case 'dlall': { const m = EPS.filter(x => !S.dl[x.id]); toast('Downloading ' + m.length + ' episodes one by one…'); for (const x of m) { if (navigator.onLine === false) break; await startDownload(x); } break; }
    case 'delall': if (await confirmBox('Delete all downloads?', 'Removes every downloaded episode from this phone. Favourites and sketch times stay.', 'Delete all')) { audio.pause(); audio.removeAttribute('src'); P.loadedId = null; P.ep = null; P.mode = null; for (const x of EPS) await Store.remove(x); S.dl = {}; updateNow(); render(true); } break;
    case 'clearsave': if (await confirmBox('Clear save?', 'Deletes all favourites, bookmarks, sketch times and renamed sketches. Downloads are not touched. This can’t be undone.', 'Clear save')) { S.fav = []; S.marks = {}; S.names = {}; S.bm = []; persist(); updateNow(); render(true); toast('Save cleared'); } break;
    case 'bmmenu': { const b = bmById(el.dataset.b); if (b) bmMenu(b); break; }
    case 'bmplay': { const b = bmById(el.dataset.b); if (b) playEpisode(byId[b.ep], b.t); break; }
    case 'bmdel': { S.bm = S.bm.filter(x => x.id !== el.dataset.b); persist(); render(true); break; }
    case 'export': exportData(); break;
    case 'import': importData(); break;
  }
});
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { view.tab = b.dataset.tab; if (view.tab !== 'eps') { view.detail = null; } render(); $('#main').scrollTop = 0; });
window.addEventListener('popstate', () => { view.detail = null; view.edit = false; view.tab = 'eps'; render(true); });
$('#fs').onclick = setFullscreen;
$('#modal').addEventListener('click', ev => { if (ev.target.id === 'modal') closeModal(); });
const netDot = () => { $('#net').classList.toggle('off', navigator.onLine === false); $('#net').title = navigator.onLine === false ? 'offline' : 'online'; };
window.addEventListener('online', netDot); window.addEventListener('offline', netDot);

/* ---------- boot (no network calls here) ---------- */
$('#ver').textContent = 'v' + APP_VERSION;
netDot(); render(); updateNow();
refreshDownloads();
window.MW = { S, Store, P, audio, getStarts, getNames, view, render, byId, EPS }; // handy for debugging/tests
