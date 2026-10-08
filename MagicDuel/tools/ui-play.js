// Plays complete games through the real UI (clicks), against the AI. node tools/ui-play.js [games] [outdir] [--noart]
const { chromium } = require('playwright');
const path = require('path');
const N = +process.argv[2] || 1, out = process.argv[3] || '/tmp/shots';
require('fs').mkdirSync(out, { recursive: true });
const svg = (name) => `<svg xmlns="http://www.w3.org/2000/svg" width="146" height="204"><rect width="146" height="204" rx="9" fill="#345" stroke="#000" stroke-width="6"/><text x="12" y="26" font-size="13" fill="#fff" font-family="sans-serif">${name.replace(/&/g, '&amp;')}</text></svg>`;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 5).join('\n')));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE ' + m.text()); });
  if (process.argv.includes('--noart')) await ctx.route('https://api.scryfall.com/**', (r) => r.abort());
  else await ctx.route('https://api.scryfall.com/**', (r) => { const u = new URL(r.request().url()); r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg(u.searchParams.get('exact') || '?') }); });
  await page.goto('file://' + path.resolve(__dirname, '../web/index.html'));
  await page.evaluate(() => { MTG.Settings.speed = 'fast'; });
  for (let gi = 0; gi < N; gi++) {
    if (gi === 0) { await page.click('#mQuick'); } 
    await page.waitForSelector('text=Let\'s play'); await page.click('text=Let\'s play');
    let shots = 0, steps = 0, lastKey = '', stuck = 0;
    while (steps++ < 900) {
      await page.waitForTimeout(25);
      const st = await page.evaluate(() => {
        const g = MTG.App.game, U = MTG.UI; const dlg = [...document.querySelectorAll('#modal-root .modal')];
        const top = dlg[dlg.length - 1];
        return { over: !!(g && g.over), mode: U.mode, dialog: top ? top.querySelector('header h3') ? top.querySelector('header h3').textContent : 'untitled' : null, turn: g && g.turnNo, step: g && g.step };
      });
      const key = JSON.stringify(st) + Date.now() % 100000 / 3000 | 0;
      if (st.dialog === 'Game review') break;
      if (st.dialog) {
        // generic dialog handling
        if (st.dialog === 'Keep or mulligan?') { await page.click('.modal:last-child footer .btn.primary'); continue; }
        if (st.dialog === 'End turn?' || st.dialog === 'Target yourself?') { await page.click('.modal:last-child footer .btn.primary'); continue; }
        if (/Choose X/.test(st.dialog)) { await page.click('.modal:last-child footer .btn.primary'); continue; }
        if (/Scry/.test(st.dialog)) { await page.click('.modal:last-child footer .btn.primary'); continue; }
        if (/choose one|—/.test(st.dialog) || /Charming/.test(st.dialog)) { await page.click('.modal:last-child .abtn'); continue; }
        if (st.dialog === 'untitled') { await page.click('.modal:last-child footer .btn'); continue; }  // inspect leftovers
        // card selection dialogs: choose the first N cards
        const need = await page.evaluate(() => { const m = [...document.querySelectorAll('#modal-root .modal')].pop(); const b = m.querySelector('footer .btn'); return { txt: b ? b.textContent : '', dis: b ? b.disabled : false, cards: m.querySelectorAll('.cardgrid .card').length }; });
        const mx = /\/(\d+)\)/.exec(need.txt); const count = mx ? +mx[1] : 1;
        for (let i = 0; i < count; i++) { await page.click(`.modal:last-child .cardgrid > :nth-child(${i + 1})`, { timeout: 1500 }).catch(() => {}); }
        await page.click('.modal:last-child footer .btn', { force: true }).catch(() => {});
        continue;
      }
      if (st.over) { await page.waitForTimeout(100); continue; }
      if (st.mode === 'priority') {
        const act = await page.evaluate(() => {
          const g = MTG.App.game, p = g.players[0];
          const c = p.hand.filter((x) => g.canCast(p, x).ok).sort((a, b) => (g.isLand(b) ? 1 : 0) - (g.isLand(a) ? 1 : 0))[0];
          if (c) return { kind: 'card', id: c.id, land: g.isLand(c) };
          for (const perm of g.bf.filter((x) => x.controller === 0)) for (let i = 0; i < perm.def.abilities.length; i++) { const ab = perm.def.abilities[i]; if (!ab.mana && g.abilityUsable(p, perm, i).ok && (ab.sorcery || ab.cost.mana) && Math.random() < 0.3) return { kind: 'perm', id: perm.id, idx: i }; }
          return null;
        });
        if (act && act.kind === 'card') {
          const n = await page.evaluate((id) => [...document.querySelectorAll('#hand .card')].findIndex((e) => e.dataset.id == id), act.id);
          await page.click(`#hand .card[data-id="${act.id}"]`, { position: { x: 6, y: 30 } });
          await page.waitForTimeout(40);
          if (shots < 3 && gi === 0) { await page.screenshot({ path: `${out}/07-sheet-${shots}.png` }); }
          const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal:last-child .abtn')].find((x) => !x.disabled); if (b) { b.click(); return true; } document.querySelector('.modal:last-child footer .btn').click(); return false; });
          continue;
        }
        if (act && act.kind === 'perm') {
          await page.click(`.card[data-id="${act.id}"]`).catch(() => {}); await page.waitForTimeout(40);
          await page.evaluate((idx) => { const bs = [...document.querySelectorAll('.modal:last-child .abtn')]; const b = bs.filter((x) => !x.disabled)[0]; if (b) b.click(); else document.querySelector('.modal:last-child footer .btn').click(); }, act.idx);
          continue;
        }
        if (steps % 40 === 5 && gi === 0 && shots < 6) { await page.screenshot({ path: `${out}/08-game-${shots++}.png` }); }
        await page.click('#btnMain'); continue;
      }
      if (st.mode === 'target') {
        const t = await page.evaluate(() => { const U = MTG.UI; const t = (U.advice && U.advice.pick) || [...U.legalSet].find((x) => x.isPlayer ? x.idx !== 0 : x.kind === 'spell' || x.controller !== 0) || [...U.legalSet][0]; if (!t) return null; if (t.isPlayer) return { sel: `#${t.idx === 0 ? 'myBar' : 'oppBar'} .life` }; if (t.kind === 'spell') return { sel: '.sitem.legal' }; return { sel: `.card[data-id="${t.id}"]` }; });
        if (!t) { await page.click('#btnMain'); continue; }
        if (gi === 0 && shots < 6 && steps % 3 === 0) await page.screenshot({ path: `${out}/09-target-${shots++}.png` });
        await page.click(t.sel).catch(() => page.evaluate(() => MTG.UI.pickTarget([...MTG.UI.legalSet][0])));
        continue;
      }
      if (st.mode === 'attack') {
        if (gi === 0 && shots < 8) await page.screenshot({ path: `${out}/10-attack-${shots++}.png` });
        const ids = await page.evaluate(() => MTG.UI.atkPossible.map((c) => c.id));
        const useCoach = Math.random() < 0.5;
        if (useCoach) { await page.evaluate(() => { const b = [...document.querySelectorAll('#promptBar button')].find((x) => /Coach/.test(x.textContent)); b && b.click(); }); }
        else for (const id of ids.slice(0, 2)) await page.click(`.card[data-id="${id}"]`).catch(() => {});
        await page.click('#btnMain'); continue;
      }
      if (st.mode === 'block') {
        if (gi === 0 && shots < 10) await page.screenshot({ path: `${out}/11-block-${shots++}.png` });
        await page.evaluate(() => { const b = [...document.querySelectorAll('#promptBar button')].find((x) => /Coach/.test(x.textContent)); b && b.click(); });
        await page.click('#btnMain'); continue;
      }
    }
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/12-end-${gi}.png` });
    const info = await page.evaluate(() => { const g = MTG.App.game; return { winner: g.winner, turns: g.turnNo, life: g.players.map((p) => p.life), reason: g.resultReason }; });
    console.log('game', gi, JSON.stringify(info), 'steps', steps);
    if (gi < N - 1) await page.click('text=Rematch');
  }
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no JS errors');
  await browser.close();
})();
