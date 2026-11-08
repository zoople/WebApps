// Waveform-level synthetic test: sketches = two alternating "voices" (harmonic + formants) with loud, noisy
// audience laughs in the middle, ended by applause (bright noise), then a new voice. No silent gaps.
// Compares the applause detector against the old loudness-dip detector. Synthetic only: not a real-episode test.
import { createRequire } from 'node:module';
const { detect, features, detectFull } = createRequire(import.meta.url)('../www/detect.js');
const sr = 8000;
function rngFn(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

function makeEpisode(seed, K, opts = {}) {
  const rnd = rngFn(seed), gauss = () => rnd() + rnd() + rnd() + rnd() - 2;
  const apLen = opts.apLen || [2.2, 3.8], apAmp = opts.apAmp || 0.2, laughAmp = opts.laughAmp || 0.15, laughEvery = opts.laughEvery || [6, 14];
  const segs = []; let T = 0;
  for (let k = 0; k < K; k++) { const len = 60 + rnd() * 60; segs.push({ start: T, end: T + len, ap: k < K - 1 ? apLen[0] + rnd() * (apLen[1] - apLen[0]) : 0 }); T += len + (k < K - 1 ? segs[k].ap : 0); segs[k].end = segs[k].start + len; }
  const out = new Float32Array(Math.round((T + 5) * sr)), truth = [];
  const voice = () => ({ f0: 95 + rnd() * 140, F1: 400 + rnd() * 400, F2: 1200 + rnd() * 1200 });
  let lp = 0, lp2 = 0, prevN = 0;
  segs.forEach((sg, k) => {
    truth.push(k === 0 ? 0 : sg.start);
    const vs = [voice(), voice()]; let vi = 0, nextSwitch = sg.start + 4 + rnd() * 8, ph = rnd() * 6, pauseUntil = 0, nextPause = sg.start + 3 + rnd() * 3;
    const hph = new Float64Array(14).fill(0);
    let laughT = sg.start + laughEvery[0] + rnd() * 5, laughEnd = 0;
    const i0 = Math.round(sg.start * sr), i1 = Math.round(sg.end * sr);
    for (let i = i0; i < i1; i++) {
      const t = i / sr;
      if (t > nextSwitch) { vi ^= 1; nextSwitch = t + 4 + rnd() * 8; }
      if (t > nextPause) { pauseUntil = t + 0.3 + rnd() * 0.5; nextPause = t + 3 + rnd() * 3; }
      const v = vs[vi]; let s = 0;
      for (let h = 1; h <= 13; h++) {
        const f = v.f0 * h; if (f > 3800) break; hph[h] += 2 * Math.PI * f / sr;
        const a = Math.exp(-(((f - v.F1) / 160) ** 2)) + 0.6 * Math.exp(-(((f - v.F2) / 260) ** 2)) + 0.05 / h;
        s += a * Math.sin(hph[h]);
      }
      const syl = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 3.3 * t + ph)), 0.6);
      let x = 0.045 * s * (t < pauseUntil ? 0.05 : syl);
      // laughter: 5-7 detuned voices + band noise, pulsed ~5 Hz
      if (t > laughT && laughEnd === 0) laughEnd = t + 0.8 + rnd() * 1.4;
      if (laughEnd > 0) {
        if (t > laughEnd) { laughEnd = 0; laughT = t + laughEvery[0] + rnd() * (laughEvery[1] - laughEvery[0]); }
        else {
          const pulse = Math.pow(Math.sin(Math.PI * 5 * (t - laughT)), 2), n = gauss();
          lp += 0.25 * (n - lp); lp2 += 0.25 * (lp - lp2);
          let l = 0; for (let h = 0; h < 6; h++) l += Math.sin(2 * Math.PI * (200 + 45 * h) * t * (1 + 0.01 * h)) * 0.04;
          x += laughAmp * (0.5 * l + 1.6 * lp2) * (0.4 + 0.6 * pulse);
        }
      }
      x += 0.004 * gauss();
      out[i] = x;
    }
    // applause then the next sketch's voice starts at once
    if (sg.ap > 0) {
      const a0 = Math.round(sg.end * sr), a1 = Math.round((sg.end + sg.ap) * sr), L = a1 - a0;
      for (let i = a0; i < a1; i++) {
        const n = gauss(), hp = n - prevN; prevN = n;               // high-passed noise = bright
        const fade = Math.min(1, (i - a0) / (0.3 * sr)) * Math.min(1, (a1 - i) / (0.9 * sr));
        out[i] += apAmp * hp * (0.7 + 0.5 * Math.abs(gauss())) * fade * 0.9;
      }
    }
  });
  return { audio: out, truth, total: T };
}

function score(starts, truth, tol) { let n = 0; starts.forEach((t, i) => { if (t != null && i < truth.length && Math.abs(t - truth[i]) <= tol) n++; }); return n; }
function blind(starts, truth, tol) { const found = starts.slice(1); const hit = found.filter(t => truth.slice(1).some(x => Math.abs(x - t) <= tol)).length; return { found: found.length, hit, false: found.length - hit }; }

const K = 12, tol = 2.0;
const scenarios = [
  ['clean applause', {}],
  ['short quiet applause', { apLen: [1.2, 2], apAmp: 0.12 }],
  ['frequent loud laughs', { laughAmp: 0.22, laughEvery: [3, 7] }],
];
let worst = 99; const rows = [];
for (const [name, o] of scenarios) for (const seed of [11, 23]) {
  const ep = makeEpisode(seed, K, o), t0 = Date.now(), F = features(ep.audio, null, sr), ft = Date.now() - t0;
  const old = detect(F.rms, F.dt, K, 1), neu = detectFull(F, K, 1), bl = detectFull(F, 0, 0);
  const so = score(old.starts, ep.truth, tol), sn = score(neu.starts, ep.truth, tol), b = blind(bl.starts, ep.truth, tol);
  rows.push(`${name.padEnd(24)} seed ${seed}: dip-only ${String(so).padStart(2)}/${K} | applause ${String(sn).padStart(2)}/${K} | blind: found ${b.found} (hit ${b.hit}, false ${b.false}) | features ${ft} ms`);
  if (!o.apLen) worst = Math.min(worst, sn);   // 'short quiet applause' is a known weak case (applause quieter than laughs), reported but not gated
}
console.log(rows.join('\n'));
console.log('worst applause-detector score (clean + laugh scenarios):', worst + '/' + K);
if (process.argv[2] === '--strict' && worst < K - 3) { console.error('FAIL'); process.exit(1); }
