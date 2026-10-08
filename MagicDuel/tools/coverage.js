// Which cards get cast/activated in AI-vs-AI play? node tools/coverage.js [games]
global.MTG = {};
const root = __dirname + '/../web/js/';
for (const f of ['engine', 'cards', 'decks', 'ai']) require(root + f + '.js');
const D = MTG.Decks, N = +process.argv[2] || 600;
const decks = [...D.starters];
for (let i = 0; i < D.packs.length; i++) for (let j = 0; j < D.packs.length; j++) decks.push(D.fromPacks(D.packs[i], D.packs[j]));
const used = {};
(async () => {
  for (let i = 0; i < N; i++) {
    const a = decks[(i * 13) % decks.length], b = decks[(i * 29 + 5) % decks.length];
    const g = new MTG.Game({ decks: [D.names(a), D.names(b)], controllers: [new MTG.AIController(), new MTG.AIController()], names: ['A', 'B'], seed: i + 7 });
    await g.run();
    for (const l of g.logs) { let m = l.match(/casts ([^.]+?)( targeting| \(X|\.)/); if (m) used[m[1]] = (used[m[1]] || 0) + 1; m = l.match(/activates ([^:]+):/); if (m) used['ABILITY ' + m[1]] = (used['ABILITY ' + m[1]] || 0) + 1; }
  }
  const never = Object.keys(MTG.cards).filter((n) => !MTG.cards[n].types.includes('Land') && !used[n]);
  console.log('never cast:', never.join(', '));
  console.log(Object.entries(used).filter(([k]) => k.startsWith('ABILITY')).map(([k, v]) => k + ':' + v).join('  '));
  const low = Object.entries(used).filter(([k, v]) => !k.startsWith('ABILITY') && v < 15).map(([k, v]) => k + ':' + v);
  console.log('low usage:', low.join('  '));
})();
