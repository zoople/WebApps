// Synthetic test of the boundary finder: noisy "sketches" separated by quiet gaps.
import { createRequire } from 'node:module';
const { detect } = createRequire(import.meta.url)('../www/detect.js');
function synth(starts, total, dt, gap = 1.2, seed = 1) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = Math.round(total / dt), rms = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i * dt; let level = 0.12 + 0.08 * rnd() + 0.06 * Math.sin(t * 0.7);   // speech + laughs
    if (rnd() < 0.02) level += 0.15;                                                  // laughter bursts
    for (const b of starts.slice(1)) if (t > b - gap && t < b - 0.0) level = 0.01 + 0.01 * rnd();
    rms[i] = level;
  }
  return rms;
}
const truth = [0, 95, 181, 262, 340, 431, 520, 598, 690, 772, 851, 940, 1031, 1120];
const dt = 0.1, r = detect(synth(truth, 1190, dt), dt, truth.length);
let ok = 0; r.starts.forEach((t, i) => { if (t != null && Math.abs(t - truth[i]) < 1.5) ok++; });
console.log('found', r.found, '/', r.needed, 'candidates', r.candidates, '| within 1.5s of truth:', ok, '/', truth.length);
console.log(r.starts.join(' '));
const bad = detect(synth(truth, 1190, dt, 1.2, 7), dt, 20);
console.log('K larger than gaps ->', bad.starts.filter(x => x == null).length, 'left unset (no fabrication)');
if (ok < truth.length - 1) { console.error('FAIL'); process.exit(1); }
