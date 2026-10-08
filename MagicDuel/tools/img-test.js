const { chromium } = require('playwright'); const path = require('path');
const svg = (n) => `<svg xmlns="http://www.w3.org/2000/svg" width="146" height="204"><rect width="146" height="204" fill="#357"/><text x="8" y="20" fill="#fff">${n}</text></svg>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  for (const mode of ['json-fallback', 'all-fail']) {
    const ctx = await b.newContext(); const page = await ctx.newPage();
    await ctx.route('https://api.scryfall.com/**', (r) => { const u = new URL(r.request().url()); const isImg = u.searchParams.get('format') === 'image';
      if (mode === 'all-fail') return r.fulfill({ status: 403, body: 'blocked' });
      if (isImg) return r.fulfill({ status: 500, body: 'no' });
      r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ image_uris: { small: 'https://cards.scryfall.io/small/' + encodeURIComponent(u.searchParams.get('exact')) + '.svg' } }) }); });
    await ctx.route('https://cards.scryfall.io/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: svg('x') }));
    await page.goto('file://' + path.resolve(__dirname, '../web/index.html'));
    const res = await page.evaluate(async () => { const r = await MTG.Images.downloadAll(); return { r, last: MTG.Images.lastError, stats: MTG.Images.stats }; });
    console.log(mode, JSON.stringify(res)); await ctx.close();
  }
  await b.close();
})();
