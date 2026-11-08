// Heuristic sketch-boundary finder. Input: per-frame RMS of the audio. Pure function (testable in node).
// Idea: between sketches the show usually dips (gap / sting / audience settling). We look for dips relative to
// the local loudness and keep the strongest K-1 of them. Results are suggestions only (unverified on real episodes*).
(function (root) {
  function median(a) { const b = Array.from(a).sort((x, y) => x - y); return b[Math.floor(b.length / 2)] || 0; }

  // level 0 = strict ... 3 = loose. Looser levels also accept shallower/shorter dips, ranked below clear gaps.
  const LV = [{ r: 0.45, w: 0.4, wt: 1 }, { r: 0.6, w: 0.3, wt: 0.5 }, { r: 0.72, w: 0.25, wt: 0.3 }, { r: 0.85, w: 0.2, wt: 0.2 }];
  function detect(rms, dt, K, level) {
    if (level == null) level = 1; level = Math.max(0, Math.min(3, level));
    const n = rms.length;
    const pre = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + rms[i];
    const hw = Math.max(1, Math.round(0.25 / dt));
    const sm = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - hw), b = Math.min(n, i + hw + 1);
      sm[i] = (pre[b] - pre[a]) / (b - a);
    }
    const step = Math.max(1, Math.round(1 / dt)), R = Math.round(15 / dt);
    const ref = new Float32Array(n);
    for (let i = 0; i < n; i += step) {
      const vals = [];
      for (let j = Math.max(0, i - R); j < Math.min(n, i + R); j += step) vals.push(sm[j]);
      const m = median(vals);
      for (let k = i; k < Math.min(n, i + step); k++) ref[k] = m;
    }
    let cands = [];
    for (let L = 0; L <= level; L++) {
      const th = LV[L].r; let i = 0;
      while (i < n) {
        if (sm[i] / (ref[i] + 1e-9) < th) {
          let j = i, mn = 1;
          while (j < n && sm[j] / (ref[j] + 1e-9) < th) { mn = Math.min(mn, sm[j] / (ref[j] + 1e-9)); j++; }
          const width = (j - i) * dt;
          const cut = mn + 0.4 * (th - mn); let k = j - 1; while (k > i && sm[k] / (ref[k] + 1e-9) > cut) k--;
          if (width >= LV[L].w && i * dt > 5) cands.push({ t: Math.max(0, (k + 1) * dt - 0.25), depth: mn, width, strength: (1 - mn) * Math.min(width, 3) * LV[L].wt, L });
          i = j;
        } else i++;
      }
    }
    // same dip found at several levels: keep the strongest
    cands.sort((a, b) => b.strength - a.strength);
    cands = cands.filter((c, k) => cands.slice(0, k).every(x => Math.abs(x.t - c.t) > 1.5));
    function pick(list, max, minSep) {
      const chosen = [];
      list.slice().sort((a, b) => b.strength - a.strength).forEach(c => {
        if (chosen.length < max && chosen.every(x => Math.abs(x.t - c.t) >= minSep)) chosen.push(c);
      });
      return chosen.sort((a, b) => a.t - b.t);
    }
    let chosen, starts;
    if (K > 0) {
      chosen = pick(cands, K - 1, 15);
      starts = [0].concat(chosen.map(c => Math.round(c.t * 10) / 10));
      while (starts.length < K) starts.push(null);
    } else {
      const floor = 0.62 - 0.14 * level; // looser level -> lower bar for counting a dip as a sketch break
      chosen = pick(cands.filter(c => c.strength > floor), 25, 20);
      starts = [0].concat(chosen.map(c => Math.round(c.t * 10) / 10));
    }
    return { starts, found: chosen.length, needed: Math.max(0, K - 1), candidates: cands.length, level };
  }

  const api = { detect };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MWDetect = api;
})(typeof window !== 'undefined' ? window : globalThis);
