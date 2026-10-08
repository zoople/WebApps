// Headless AI-vs-AI simulation: node tools/sim.js [games] [seedStart] [--verbose]
global.MTG = {};
const root = __dirname + '/../web/js/';
for (const f of ['engine', 'cards', 'decks', 'ai']) require(root + f + '.js');
const D = MTG.Decks;
const N = +process.argv[2] || 50, S0 = +process.argv[3] || 1, verbose = process.argv.includes('--verbose');
const decks = [...D.starters];
for (let i = 0; i < D.packs.length; i++) decks.push(D.fromPacks(D.packs[i], D.packs[(i * 3 + 1) % D.packs.length]));
const wins = {}, turns = [], errs = [];
let draws = 0;
(async () => {
  for (let i = 0; i < N; i++) {
    const seed = S0 + i;
    const a = decks[seed % decks.length], b = decks[(seed * 7 + 3) % decks.length];
    const g = new MTG.Game({ decks: [D.names(a), D.names(b)], controllers: [new MTG.AIController(), new MTG.AIController()], names: ['A', 'B'], seed });
    try {
      const timer = setTimeout(() => { console.error('TIMEOUT seed', seed); process.exit(2); }, 30000);
      await g.run(); clearTimeout(timer);
      if (g.winner < 0) draws++; else { const w = g.winner === 0 ? a.name : b.name; wins[w] = (wins[w] || 0) + 1; }
      turns.push(g.turnNo);
      if (verbose) console.log(`seed ${seed}: ${a.name} vs ${b.name} -> ${g.winner < 0 ? 'draw' : g.winner === 0 ? 'A' : 'B'} turn ${g.turnNo} (${g.resultReason})`);
      if (process.argv.includes('--log') && seed === S0) console.log(g.logs.join('\n'));
    } catch (e) { errs.push({ seed, e }); console.error('ERROR seed', seed, a.name, 'vs', b.name, '\n', e.stack.split('\n').slice(0, 6).join('\n')); }
  }
  console.log('games', N, 'errors', errs.length, 'draws', draws, 'avg turns', (turns.reduce((x, y) => x + y, 0) / turns.length).toFixed(1));
  console.log(wins);
})();
