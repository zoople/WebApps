// Builds magic-duel-artifact.html: the game as a fragment for the Artifact tool (no <html>/<head>/<body>, no external art).
const fs = require('fs'), path = require('path'); const web = path.join(__dirname, '../web');
const html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
const body = html.match(/<body>([\s\S]*?)<script src/)[1].replace(/<div id="toast" class="hidden"><\/div>/, '<div id="toast" class="hidden"></div>');
const css = fs.readFileSync(path.join(web, 'css/style.css'), 'utf8');
const js = [...html.matchAll(/<script src="(.+?)"><\/script>/g)].map((m) => fs.readFileSync(path.join(web, m[1]), 'utf8').replace(/<\/script>/g, '<\\/script>')).join('\n;\n');
const out = `<title>Magic Duel</title>\n<style>\n${css}\nhtml,body{height:100%;margin:0;background:var(--bg);color:var(--text)}\n</style>\n${body}\n<script>window.MTG_NO_IMAGES = true;</script>\n<script>\n${js}\n</script>\n`;
fs.writeFileSync(path.join(__dirname, '../magic-duel-artifact.html'), out); console.log('artifact', (out.length / 1024).toFixed(0) + ' KB');
