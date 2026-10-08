// Emulated-phone test with real touch input. node tools/phone-test.js
const { chromium, devices } = require('playwright'); const path = require('path');
const out = '/tmp/claude-0/-home-user/3574b951-5182-50f1-8d91-b71245da2b80/scratchpad/shots/';
const profiles = ['Pixel 7', 'Pixel 5', 'Galaxy S8', 'Galaxy S9+'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const name of profiles) {
    const dev = devices[name]; const ctx = await b.newContext({ ...dev, viewport: dev.viewport });
    const page = await ctx.newPage(); const problems = [];
    page.on('pageerror', (e) => problems.push('JS error: ' + e.message)); await ctx.route('https://**', (r) => r.abort());
    await page.goto('file://' + path.resolve(__dirname, '../web/index.html'));
    const tap = async (sel, opts) => { const el = page.locator(sel).first(); await el.scrollIntoViewIfNeeded().catch(() => {}); const bb = await el.boundingBox(); if (!bb) throw new Error('no box ' + sel); await page.touchscreen.tap(bb.x + (opts && opts.dx != null ? opts.dx : bb.width / 2), bb.y + (opts && opts.dy != null ? opts.dy : bb.height / 2)); await page.waitForTimeout(120); };
    const noOverflow = async (label) => { const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })); if (o.sw > o.cw) problems.push(`${label}: horizontal overflow ${o.sw}>${o.cw}`); };
    await noOverflow('menu'); await tap('#mDecks'); await noOverflow('decks'); await tap('[data-t="jump"]');
    // pick two jumpstart packs by touch, start
    await tap('.packgrid .deckcard:nth-child(1)', { dx: 40, dy: 20 }); await tap('.packgrid .deckcard:nth-child(7)', { dx: 40, dy: 20 });
    await page.evaluate(() => { MTG.Settings.speed = 'fast'; }); await tap('#dStart');
    await tap("text=Let's play"); await page.waitForTimeout(300); await noOverflow('mulligan');
    await tap('.sheet footer .btn.primary'); await page.waitForTimeout(1200);
    // tap-target audit on the game screen
    const small = await page.evaluate(() => [...document.querySelectorAll('#actionBar button, #promptBar button, .abtn, .sheet footer .btn')].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.textContent || e.id).trim().slice(0, 14), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => (x.w < 40 || x.h < 40) && x.w > 0));
    if (small.length) problems.push('small tap targets: ' + JSON.stringify(small));
    await noOverflow('game');
    // play a land with touch: tap a hand card (visible left strip), then Play land
    for (let turn = 0; turn < 3; turn++) {
      const st = await page.evaluate(() => { const g = MTG.App.game, p = g.players[0]; return { mode: MTG.UI.mode, step: g.step, land: (p.hand.find((c) => g.canCast(p, c).ok && g.isLand(c)) || {}).id, spell: (p.hand.find((c) => g.canCast(p, c).ok && !g.isLand(c)) || {}).id }; });
      if (st.mode !== 'priority') { await page.waitForTimeout(1500); continue; }
      for (const id of [st.land, st.spell]) { if (!id) continue; await tap(`#hand .card[data-id="${id}"]`, { dx: 8, dy: 40 }); const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal:last-child .abtn')].find((x) => !x.disabled); return !!b; }); if (!ok) { problems.push('turn ' + turn + ': tap on hand card produced no enabled action'); await page.evaluate(() => MTG.UI.closeTopDialog()); continue; } await tap('.modal:last-child .abtn:not([disabled])'); await page.waitForTimeout(500); }
      await tap('#btnMain'); await page.waitForTimeout(700);
      // possible attack prompt
      const mode = await page.evaluate(() => MTG.UI.mode); if (mode === 'attack') { await tap('#btnMain'); }
      await page.waitForTimeout(600); const m2 = await page.evaluate(() => MTG.UI.mode); if (m2 === 'priority') { await tap('#btnMain'); await page.waitForTimeout(400); const dlg = await page.locator('.modal:last-child footer .btn.primary').count(); if (dlg) await tap('.modal:last-child footer .btn.primary'); }
      await page.waitForTimeout(5000);
    }
    // settle: close stray dialogs, wait for a quiet moment
    await page.evaluate(() => { while (MTG.UI.closeTopDialog()); }); await page.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(page);
    // long-press inspect (3 tries: the opponent may be mid-animation)
    let opened = 0;
    for (let k = 0; k < 3 && !opened; k++) {
      const id = await page.evaluate(() => { const c = document.querySelector('#hand .card'); return c ? c.dataset.id : null; }); if (!id) break;
      const bb = await page.locator(`#hand .card[data-id="${id}"]`).boundingBox(); const x = bb.x + 10, y = bb.y + 30;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); await page.waitForTimeout(750); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300);
      opened = await page.locator('.inspect').count(); await page.evaluate(() => { while (MTG.UI.closeTopDialog()); }); await page.waitForTimeout(300);
    }
    if (!opened) problems.push('long-press did not open inspect (3 tries) ' + JSON.stringify(await page.evaluate(() => ({ hand: MTG.App.game.players[0].hand.length, cards: document.querySelectorAll('#hand .card').length, mode: MTG.UI.mode, over: MTG.App.game.over, modals: document.querySelectorAll('#modal-root .modal').length }))));
    // manual touch swipe on the hand
    const hb = await page.locator('#handWrap').boundingBox(); const ys = hb.y + 60;
    const dims = await page.evaluate(() => { const w = document.querySelector('#handWrap'); return { l: w.scrollLeft, max: w.scrollWidth - w.clientWidth, n: document.querySelectorAll('#hand .card').length }; });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hb.x + hb.width - 40, y: ys }] });
    for (let k = 1; k <= 10; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: hb.x + hb.width - 40 - k * 22, y: ys }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(500);
    const after = await page.evaluate(() => document.querySelector('#handWrap').scrollLeft);
    if (dims.max > 4 && after <= dims.l) problems.push(`hand did not scroll by swipe (max ${dims.max}, n ${dims.n})`);
    if (dims.max <= 4) console.log('   (hand fits without scrolling: ' + dims.n + ' cards)');
    // Android back button hook
    const back = await page.evaluate(() => { const r1 = window.onAndroidBack(); const open1 = document.querySelectorAll('#modal-root .modal').length; const r2 = window.onAndroidBack(); return { r1, open1, r2 }; });
    if (!back.r1) problems.push('Android back not handled in game'); 
    await page.screenshot({ path: out + 'P-' + name.replace(/\W/g, '') + '.png' });
    const info = await page.evaluate(() => { const g = MTG.App.game; return { turn: g.turnNo, lands: g.lands(0).length, bf: g.bf.filter((c) => c.controller === 0 && !g.isLand(c)).length }; });
    console.log(name.padEnd(11), dev.viewport.width + 'x' + dev.viewport.height, 'turn', info.turn, 'my lands', info.lands, 'my creatures', info.bf, problems.length ? '\n   PROBLEMS: ' + problems.join('\n   ') : 'OK');
    await ctx.close();
  }
  await b.close();
})();
