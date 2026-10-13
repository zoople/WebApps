#!/usr/bin/env python3
"""Replace a Google Fonts <link> in an app with the same fonts embedded in the page, so it never waits on the network.

  python3 tools/embed-fonts.py <app.html> <fonts-src-dir> SPEC [SPEC ...]
  SPEC = "Family|file.ttf|style|weight[|axis=min:max,...]"   e.g. "Nunito|ofl/nunito/Nunito[wght].ttf|normal|600 900|wght=600:900"

<fonts-src-dir> is a checkout of github.com/google/fonts (SIL Open Font License). Each font is cut down to the
characters the page actually contains (plus Latin, Latin-1 and punctuation) and inlined as base64 WOFF.
The Google Fonts preconnect/stylesheet links are removed. Re-running replaces the previous embedded block."""
import sys, os, re, io, base64
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

app, src, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
html = open(app, encoding='utf-8').read()
chars = {ord(c) for c in html} | set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | set(range(0x2010, 0x2050)) | {0x20AC, 0x2122, 0x2190, 0x2192, 0x2212}
faces = []
for spec in specs:
    fam, path, style, weight, *axes = spec.split('|')
    f = TTFont(os.path.join(src, path))
    if axes and axes[0]:
        lim = {}
        for a in axes[0].split(','):
            k, v = a.split('='); lo, hi = v.split(':'); lim[k] = (float(lo), float(hi)) if lo != hi else float(lo)
        f = instancer.instantiateVariableFont(f, lim); b = io.BytesIO(); f.save(b); b.seek(0); f = TTFont(b)
    opt = subset.Options(); opt.flavor = 'woff'; opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.notdef_outline = True
    s = subset.Subsetter(opt); s.populate(unicodes=sorted(chars)); s.subset(f)
    b = io.BytesIO(); f.flavor = 'woff'; f.save(b)
    faces.append("@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(data:font/woff;base64,%s) format('woff')}"
                 % (fam, style, weight, base64.b64encode(b.getvalue()).decode()))
    print(f'  {fam} {style} {weight}: {len(b.getvalue()) // 1024} KB', file=sys.stderr)
block = ('<style id="embedded-fonts">/* Fonts embedded so the app starts instantly offline. SIL Open Font License, from github.com/google/fonts */\n'
         + '\n'.join(faces) + '\n</style>')
html = re.sub(r'<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\n?', '', html)
if '<style id="embedded-fonts">' in html:
    html = re.sub(r'<style id="embedded-fonts">.*?</style>', lambda m: block, html, count=1, flags=re.S)
else:
    html = html.replace('</head>', block + '\n</head>', 1) if html.find('<style') < 0 or html.find('<style') > html.find('</head>') else html.replace('<style', block + '\n<style', 1)
assert not re.search(r'(href|src)=["\']https?://', html), 'page still loads something from the internet'
open(app, 'w', encoding='utf-8').write(html)
