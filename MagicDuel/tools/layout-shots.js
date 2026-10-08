// Screenshots of tricky layout states. node tools/layout-shots.js <w> <h> <tag>
const { chromium } = require('playwright'); const path = require('path');
const W = +process.argv[2] || 390, H = +process.argv[3] || 844, tag = process.argv[4] || 'a';
const out = '/tmp/claude-0/-home-user/3574b951-5182-50f1-8d91-b71245da2b80/scratchpad/shots/';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message)); await ctx.route('https://**', (r) => r.abort());
  await page.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await page.evaluate(() => { MTG.Settings.speed = 'fast'; MTG.App.startGame(MTG.Decks.starters[0], MTG.Decks.starters[3]); });
  await page.click("text=Let's play"); await page.waitForTimeout(300); await page.click('.sheet footer .btn.primary'); await page.waitForTimeout(900);
  await page.evaluate(() => { const g = MTG.App.game; g.pace = 0; const mk = (n, pi, tp) => { const c = g.newCard(MTG.cards[n], pi); c.zone = 'library'; g.players[pi].library.push(c); g.enter(c, pi); c.summonedTurn = -9; return c; };
    ['Serra Angel', 'Goblin Instigator', 'Shivan Dragon', 'Savannah Lions', 'Pegasus Courser', 'Knight of Grace', 'Healer\'s Hawk', 'Raging Goblin', 'Bonesplitter'].forEach((n) => mk(n, 0));
    ['Mountain', 'Plains', 'Wind-Scarred Crag', 'Mountain', 'Plains', 'Evolving Wilds', 'Mountain'].forEach((n) => mk(n, 0));
    ['Vampire Nighthawk', 'Gifted Aetherborn', 'Typhoid Rats', 'Vampire Sovereign', 'Pacifism', 'Short Sword', 'Walking Corpse'].forEach((n) => mk(n, 1));
    ['Swamp', 'Plains', 'Scoured Barrens', 'Swamp', 'Plains', 'Swamp'].forEach((n) => mk(n, 1));
    g.lands(0)[1].tapped = true; g.bf.filter((c) => c.name === 'Typhoid Rats')[0].tapped = true; MTG.UI.scheduleRender(); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: out + `L-${tag}-1-board.png` });
  await page.evaluate(() => MTG.UI.inspect(MTG.App.game.players[0].hand.find((c) => c.name === 'Pegasus Courser') || MTG.App.game.players[0].hand[0], {})); await page.waitForTimeout(400);
  await page.screenshot({ path: out + `L-${tag}-2-inspect.png` }); await page.evaluate(() => MTG.UI.closeInspect());
  await page.evaluate(() => { const U = MTG.UI, g = MTG.App.game; U.mode = 'idle'; });
  console.log('hand', await page.evaluate(() => MTG.App.game.players[0].hand.map((c) => c.name).join(', ')), errs);
  await b.close();
})();
