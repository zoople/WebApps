// Heuristic sketch-boundary finder (suggestions only: tuned on synthetic audio, unverified on real episodes*).
// Cue 1 (main): applause. The end of a sketch is applause: sustained, loud, noise-like and bright (lots of
//   2-4 kHz energy). Mid-sketch laughs are shorter, voiced/bursty and darker, so they score lower.
// Cue 2: the voice/tone changes right after the applause (new speakers = new sketch). Boosts the score.
// Cue 3 (fallback): a dip in loudness (gap / sting). Weaker, used to fill what applause did not explain.
(function (root) {
  function median(a) { const b = Array.from(a).sort((x, y) => x - y); return b[Math.floor(b.length / 2)] || 0; }
  function pct(a, p) { const b = Array.from(a).sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.max(0, Math.floor(p * b.length)))] || 0; }
  function movavg(x, hw) {
    const n = x.length, pre = new Float64Array(n + 1), o = new Float32Array(n);
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - hw), b = Math.min(n, i + hw + 1); o[i] = (pre[b] - pre[a]) / (b - a); }
    return o;
  }

  /* ---------- features: per 0.1 s frame ---------- */
  const NB = 8, BAND_HZ = [100, 250, 500, 1000, 1500, 2200, 3000, 3900];
  function fft(re, im) {                       // in-place radix-2
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  // c0, c1: Float32Array channels (c1 optional) at sample rate sr. Returns feature arrays.
  function features(c0, c1, sr) {
    const hop = Math.round(sr * 0.1), N = 512, frames = Math.floor(c0.length / hop);
    const rms = new Float32Array(frames), flat = new Float32Array(frames), hi = new Float32Array(frames), bands = new Float32Array(frames * NB);
    const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
    const re = new Float64Array(N), im = new Float64Array(N), binHz = sr / N, P = new Float64Array(N / 2);
    const k0 = Math.max(1, Math.round(300 / binHz)), k1 = Math.min(N / 2 - 1, Math.round(3800 / binHz));
    const edge = BAND_HZ.map(h => Math.min(N / 2 - 1, Math.round(h / binHz)));
    const x = i => c1 ? (c0[i] + c1[i]) / 2 : c0[i];
    for (let f = 0; f < frames; f++) {
      let s = 0; for (let i = f * hop; i < (f + 1) * hop; i++) { const v = x(i); s += v * v; }
      rms[f] = Math.sqrt(s / hop);
      const end = Math.min(c0.length, (f + 1) * hop), st = end - N;
      if (st < 0) { flat[f] = 0; continue; }
      for (let i = 0; i < N; i++) { re[i] = x(st + i) * win[i]; im[i] = 0; }
      fft(re, im);
      for (let k = 0; k < N / 2; k++) P[k] = re[k] * re[k] + im[k] * im[k] + 1e-12;
      let lg = 0, ar = 0; for (let k = k0; k <= k1; k++) { lg += Math.log(P[k]); ar += P[k]; }
      const cnt = k1 - k0 + 1; flat[f] = Math.exp(lg / cnt) / (ar / cnt);
      const be = []; for (let b = 0; b < NB; b++) { const a = b === 0 ? edge[0] : edge[b - 1], z = edge[b]; let e = 0; for (let k = a; k <= Math.max(a, z); k++) e += P[k]; be.push(Math.log10(e / (Math.max(a, z) - a + 1))); }
      for (let b = 0; b < NB; b++) bands[f * NB + b] = be[b];
      hi[f] = (be[5] + be[6] + be[7]) / 3 - (be[1] + be[2] + be[3]) / 3;   // bright vs dark (log ratio)
    }
    return { dt: hop / sr, rms, flat, hi, bands };
  }

  /* ---------- cue 3: loudness dips ---------- */
  // level 0 = strict ... 3 = loose
  const LV = [{ r: 0.45, w: 0.4, wt: 1 }, { r: 0.6, w: 0.3, wt: 0.5 }, { r: 0.72, w: 0.25, wt: 0.3 }, { r: 0.85, w: 0.2, wt: 0.2 }];
  function dipCands(rms, dt, level) {
    const n = rms.length, sm = movavg(rms, Math.max(1, Math.round(0.25 / dt)));
    const step = Math.max(1, Math.round(1 / dt)), R = Math.round(15 / dt), ref = new Float32Array(n);
    for (let i = 0; i < n; i += step) {
      const vals = []; for (let j = Math.max(0, i - R); j < Math.min(n, i + R); j += step) vals.push(sm[j]);
      const m = median(vals); for (let k = i; k < Math.min(n, i + step); k++) ref[k] = m;
    }
    let cands = [];
    for (let L = 0; L <= level; L++) {
      const th = LV[L].r; let i = 0;
      while (i < n) {
        if (sm[i] / (ref[i] + 1e-9) < th) {
          let j = i, mn = 1;
          while (j < n && sm[j] / (ref[j] + 1e-9) < th) { mn = Math.min(mn, sm[j] / (ref[j] + 1e-9)); j++; }
          const width = (j - i) * dt, cut = mn + 0.4 * (th - mn); let k = j - 1; while (k > i && sm[k] / (ref[k] + 1e-9) > cut) k--;
          if (width >= LV[L].w && i * dt > 5) cands.push({ t: Math.max(0, (k + 1) * dt - 0.25), strength: (1 - mn) * Math.min(width, 3) * LV[L].wt, kind: 'dip' });
          i = j;
        } else i++;
      }
    }
    cands.sort((a, b) => b.strength - a.strength);
    return cands.filter((c, k) => cands.slice(0, k).every(x => Math.abs(x.t - c.t) > 1.5));
  }

  function pick(list, max, minSep) {
    const chosen = [];
    list.slice().sort((a, b) => b.strength - a.strength).forEach(c => { if (chosen.length < max && chosen.every(x => Math.abs(x.t - c.t) >= minSep)) chosen.push(c); });
    return chosen.sort((a, b) => a.t - b.t);
  }
  function finish(cands, K, level, floorBase) {
    let chosen, starts;
    if (K > 0) {
      chosen = pick(cands, K - 1, 15);
      starts = [0].concat(chosen.map(c => Math.round(c.t * 10) / 10)); while (starts.length < K) starts.push(null);
    } else {
      chosen = pick(cands.filter(c => c.strength > floorBase - 0.14 * level), 25, 20);
      starts = [0].concat(chosen.map(c => Math.round(c.t * 10) / 10));
    }
    return { starts, found: chosen.length, needed: Math.max(0, K - 1), candidates: cands.length, level, applause: chosen.filter(c => c.kind === "applause").length, detail: chosen };
  }

  // Dip-only detector (kept for tests / when no spectral features are available).
  function detect(rms, dt, K, level) {
    if (level == null) level = 1; level = Math.max(0, Math.min(3, level));
    return finish(dipCands(rms, dt, level), K, level, 0.62);
  }

  /* ---------- cue 1 + 2: applause then new voice ---------- */
  const AP_TH = [0.72, 0.62, 0.5, 0.4];       // level 0 strict .. 3 loose
  function applauseCands(F, level) {
    const n = F.rms.length, dt = F.dt, hw = Math.max(1, Math.round(0.4 / dt));
    const flat = movavg(F.flat, hw), hi = movavg(F.hi, hw), rms = movavg(F.rms, hw);
    const f50 = median(flat), f95 = pct(flat, 0.95), h50 = median(hi), h95 = pct(hi, 0.95);
    const rmsRef = new Float32Array(n), step = Math.max(1, Math.round(1 / dt)), R = Math.round(20 / dt);
    for (let i = 0; i < n; i += step) { const v = []; for (let j = Math.max(0, i - R); j < Math.min(n, i + R); j += step) v.push(rms[j]); const m = median(v); for (let k = i; k < Math.min(n, i + step); k++) rmsRef[k] = m; }
    const ap = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const nf = (flat[i] - f50) / (f95 - f50 + 1e-9), nh = (hi[i] - h50) / (h95 - h50 + 1e-9);
      const loud = Math.min(1, (rms[i] / (rmsRef[i] + 1e-9)) / 1.1);   // applause is at least as loud as the speech around it
      ap[i] = Math.max(0, Math.min(1.2, 0.5 * nf + 0.5 * nh)) * loud;
    }
    const th = AP_TH[level], runs = [];
    let i = 0;
    while (i < n) {
      if (ap[i] > th) {
        let j = i, gap = 0, last = i;
        while (j < n && gap <= Math.round(0.3 / dt)) { if (ap[j] > th) { last = j; gap = 0; } else gap++; j++; }
        const dur = (last - i + 1) * dt;
        if (dur >= 0.9) { let s = 0; for (let k = i; k <= last; k++) s += ap[k]; runs.push({ a: i, b: last, dur, mean: s / (last - i + 1) }); }
        i = last + 1;
      } else i++;
    }
    // timbre change: compare the 4 s before the applause with the 3 s after it
    const band = (a, b) => { const v = new Float64Array(NB); let c = 0; for (let f = Math.max(0, a); f < Math.min(n, b); f++) { for (let k = 0; k < NB; k++) v[k] += F.bands[f * NB + k]; c++; } if (c) for (let k = 0; k < NB; k++) v[k] /= c; return v; };
    const vp = Math.round(4 / dt), va = Math.round(3 / dt), skip = Math.round(0.4 / dt);
    runs.forEach(r => {
      const A = band(r.a - vp - skip, r.a - skip), B = band(r.b + skip, r.b + skip + va);
      const mA = A.reduce((x, y) => x + y, 0) / NB, mB = B.reduce((x, y) => x + y, 0) / NB;
      let d = 0; for (let k = 0; k < NB; k++) { const e = (A[k] - mA) - (B[k] - mB); d += e * e; }   // shape difference, not loudness
      r.change = Math.sqrt(d);
      let mn = 1; for (let f = Math.max(0, r.b - Math.round(0.5 / dt)); f < Math.min(n, r.b + Math.round(2 / dt)); f++) mn = Math.min(mn, rms[f] / (rmsRef[f] + 1e-9));
      r.dip = mn;
    });
    const dp = pct(runs.map(r => r.change), 0.8) + 1e-9;
    return runs.filter(r => r.b * dt > 8).map(r => {
      const chg = 0.65 + 0.7 * Math.min(1, r.change / dp), dipB = r.dip < 0.7 ? 1.15 : 1;
      return { t: Math.max(0, (r.b + 1) * dt - 0.5), strength: r.mean * Math.min(r.dur, 4) * chg * dipB, dur: r.dur, change: r.change, kind: 'applause' };
    });
  }

  function detectFull(F, K, level) {
    if (level == null) level = 1; level = Math.max(0, Math.min(3, level));
    const ap = applauseCands(F, level);
    // dip candidates not explained by an applause run are kept at reduced weight
    const dips = dipCands(F.rms, F.dt, level).filter(d => ap.every(a => Math.abs(a.t - d.t) > 4)).map(d => ({ t: d.t, strength: d.strength * 0.6, kind: 'dip' }));
    let all = ap.concat(dips);
    if (K <= 0) {   // unknown sketch count: keep only breaks strong relative to this episode's strongest ones
      const top = all.map(c => c.strength).sort((a, b) => b - a).slice(0, 10), ref = top.length ? top[Math.floor(top.length / 2)] : 0, mult = [0.7, 0.6, 0.5, 0.4][level];
      all = all.filter(c => c.strength >= ref * mult);
      return finish(all, K, level, -9);
    }
    return finish(all, K, level, 0.7);
  }

  const api = { detect, features, detectFull };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MWDetect = api;
})(typeof window !== 'undefined' ? window : globalThis);
