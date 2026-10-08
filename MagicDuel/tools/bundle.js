// Bundles the web app into ONE html file (for opening directly on a phone/browser). node tools/bundle.js
const fs = require('fs'), path = require('path');
const web = path.join(__dirname, '../web');
let html = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="(.+?)">/, (m, f) => '<style>\n' + fs.readFileSync(path.join(web, f), 'utf8') + '\n</style>');
html = html.replace(/<script src="(.+?)"><\/script>/g, (m, f) => '<script>\n' + fs.readFileSync(path.join(web, f), 'utf8').replace(/<\/script>/g, '<\\/script>') + '\n</script>');
fs.writeFileSync(path.join(__dirname, '../magic-duel.html'), html);
console.log('magic-duel.html', (html.length / 1024).toFixed(0) + ' KB');
