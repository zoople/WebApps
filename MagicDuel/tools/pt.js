// Interactive playtest helper. node tools/pt.js <cmd> [args]
// start | state | shot | click <selector> | cast <card name> | do <js>
const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process'); const fs = require('fs');
const SH = '/tmp/claude-0/-home-user/3574b951-5182-50f1-8d91-b71245da2b80/scratchpad/shots';
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="146" height="204"><rect width="146" height="204" rx="9" fill="#345"/><text x="12" y="26" font-size="13" fill="#fff" font-family="sans-serif">${n.replace(/&/g, '&amp;')}</text></svg>`;
(async () => {
  const cmd = process.argv[2], arg = process.argv.slice(3).join(' ');
  if (cmd === 'start') {
    spawn('/opt/pw-browsers/chromium-1194/chrome-linux/chrome', ['--headless=new', '--no-sandbox', '--remote-debugging-port=9222', '--window-size=390,844', 'about:blank'], { detached: true, stdio: 'ignore' }).unref();
    await new Promise((r) => setTimeout(r, 2500));
  }
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222'); const ctx = b.contexts()[0]; let page = ctx.pages()[0];
  if (cmd === 'start') {
    await ctx.route('https://api.scryfall.com/**', (r) => { const u = new URL(r.request().url()); r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg(u.searchParams.get('exact') || '?') }); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('file://' + path.resolve(__dirname, '../web/index.html'));
    await page.evaluate(() => { MTG.Settings.speed = 'fast'; }); await page.click('#mQuick'); await page.waitForTimeout(300);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  if (cmd === 'click') await page.click(arg, { timeout: 3000 });
  if (cmd === 'cast') {
    const id = await page.evaluate((n) => { const c = MTG.App.game.players[0].hand.find((x) => x.name === n); return c && c.id; }, arg);
    if (!id) console.log('NOT IN HAND', arg); else { await page.click(`#hand .card[data-id="${id}"]`, { position: { x: 5, y: 25 } }); await page.waitForTimeout(150);
      const r = await page.evaluate(() => { const b = [...document.querySelectorAll('.modal:last-child .abtn')]; const e = b.find((x) => !x.disabled); const info = b.map((x) => x.textContent + (x.disabled ? ' [disabled]' : '')); if (e) e.click(); else document.querySelector('.modal:last-child footer .btn').click(); return info; }); console.log('sheet:', r.join(' | ')); } }
  if (cmd === 'do') console.log(JSON.stringify(await page.evaluate(arg)));
  await page.waitForTimeout(+process.env.WAIT || 400);
  if (cmd === 'shot' || cmd === 'start' || process.env.SHOT) await page.screenshot({ path: SH + '/pt.png' });
  const st = await page.evaluate(() => {
    const g = MTG.App.game; if (!g) return 'no game'; const U = MTG.UI; const p = g.players[0], o = g.players[1];
    const nm = (c) => { const ch = g.chars(c); return c.name + (g.isCreature(c) ? ` ${ch.power}/${ch.toughness - c.damage}` : '') + (c.tapped ? '(T)' : '') + (c.attachedTo ? `[on ${c.attachedTo.name}]` : '') + (g.isSick(c) && c.controller === 0 ? '(sick)' : ''); };
    const dlg = [...document.querySelectorAll('#modal-root .modal')].pop();
    const lines = [];
    lines.push(`T${g.turnNo} ${g.step} active=${g.active === 0 ? 'ME' : 'OPP'} mode=${U.mode} over=${g.over}${g.over ? ' winner=' + g.winner : ''}`);
    lines.push(`LIFE me ${p.life} opp ${o.life} | opp hand ${o.hand.length} lib ${o.library.length} | my lib ${p.library.length} gy ${p.graveyard.length}/${o.graveyard.length}`);
    lines.push('OPP BF: ' + (g.bf.filter((c) => c.controller === 1 && !g.isLand(c)).map(nm).join(', ') || '-') + ` | lands ${g.lands(1).length}`);
    lines.push('MY BF: ' + (g.bf.filter((c) => c.controller === 0 && !g.isLand(c)).map(nm).join(', ') || '-') + ` | lands ${g.lands(0).length} (untapped ${g.lands(0).filter((l) => !l.tapped).length})`);
    lines.push('HAND: ' + p.hand.map((c) => c.name + (g.canCast(p, c).ok ? '*' : '')).join(', ') + '   (* = castable)');
    if (g.stack.length) lines.push('STACK: ' + g.stack.map((s) => (s.card || s.source).name + ' (' + (s.controller === 0 ? 'me' : 'opp') + ')').join(' > '));
    lines.push('PROMPT: ' + (U.promptText || '-') + ' | BUTTON: ' + document.querySelector('#btnMain').textContent);
    lines.push('COACH: ' + document.querySelector('#coachLine').textContent);
    if (dlg) lines.push('DIALOG: ' + dlg.innerText.replace(/\n+/g, ' / ').slice(0, 300));
    lines.push('LOG: ' + g.logs.slice(-6).join(' ¦ '));
    return lines.join('\n');
  });
  console.log(st); await b.close();
})();
