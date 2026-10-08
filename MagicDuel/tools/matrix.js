// Win-rate matrix between the starter decks (AI vs AI). node tools/matrix.js [gamesPerPair]
global.MTG = {};
const root = __dirname + '/../web/js/';
for (const f of ['engine', 'cards', 'decks', 'ai']) require(root + f + '.js');
const D = MTG.Decks, N = +process.argv[2] || 100;
const decks = [...D.starters, D.fromPacks(D.packs[0], D.packs[6]), D.fromPacks(D.packs[3], D.packs[5]), D.fromPacks(D.packs[8], D.packs[9]), D.fromPacks(D.packs[2], D.packs[1]), D.fromPacks(D.packs[4], D.packs[7])];
(async () => {
  const rows = [];
  for (let i = 0; i < decks.length; i++) {
    const row = []; let tot = 0, g = 0;
    for (let j = 0; j < decks.length; j++) {
      if (i === j) { row.push('  -- '); continue; }
      let w = 0;
      for (let k = 0; k < N; k++) {
        const swap = k % 2; const seed = k * 17 + i * 5 + j;
        const ds = swap ? [decks[j], decks[i]] : [decks[i], decks[j]];
        const game = new MTG.Game({ decks: ds.map(D.names), controllers: [new MTG.AIController(), new MTG.AIController()], names: ['A', 'B'], seed });
        await game.run(); if (game.winner === (swap ? 1 : 0)) w++;
      }
      row.push(String(Math.round(100 * w / N)).padStart(4) + '%'); tot += w; g += N;
    }
    rows.push(decks[i].name.padEnd(30).slice(0, 30) + row.join(' ') + '   avg ' + Math.round(100 * tot / g) + '%');
  }
  console.log(rows.join('\n'));
})();
