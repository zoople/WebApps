// Heuristic sketch-boundary finder. Input: per-frame RMS of the audio. Pure function (testable in node).
// Idea: between sketches the show usually dips (gap / sting / audience settling). We look for dips relative to
// the local loudness and keep the strongest K-1 of them. Results are suggestions only (unverified on real episodes*).
(function (root) {
  function median(a) { const b = Array.from(a).sort((x, y) => x - y); return b[Math.floor(b.length / 2)] || 0; }

  function detect(rms, dt, K) {
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
    const cands = [];
    let i = 0;
    while (i < n) {
      if (sm[i] / (ref[i] + 1e-9) < 0.45) {
        let j = i, mn = 1;
        while (j < n && sm[j] / (ref[j] + 1e-9) < 0.45) { mn = Math.min(mn, sm[j] / (ref[j] + 1e-9)); j++; }
        const width = (j - i) * dt;
        if (width >= 0.4 && i * dt > 5) cands.push({ t: Math.max(0, j * dt - 0.25), depth: mn, width, strength: (1 - mn) * Math.min(width, 3) });
        i = j;
      } else i++;
    }
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
      chosen = pick(cands.filter(c => c.strength > 0.9), 25, 25);
      starts = [0].concat(chosen.map(c => Math.round(c.t * 10) / 10));
    }
    return { starts, found: chosen.length, needed: Math.max(0, K - 1), candidates: cands.length };
  }

  const api = { detect };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MWDetect = api;
})(typeof window !== 'undefined' ? window : globalThis);
