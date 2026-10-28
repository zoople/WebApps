#!/usr/bin/env python3
"""Build MergeStories/merge-stories.html: the whole console (engine, shelf, every story, icons) in ONE file,
so it runs when opened straight from a phone's files or a downloads folder, where the page can't load the
separate engine.js / event.js files next to it. Run after every Merge Stories change:
    python3 tools/bundle-merge-stories.py
"""
import base64, glob, json, os, re
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'MergeStories')
html = open(os.path.join(D, 'index.html'), encoding='utf-8').read()
files = {'engine.js': open(os.path.join(D, 'engine.js'), encoding='utf-8').read()}
for f in sorted(glob.glob(os.path.join(D, 'events', '*', 'event.js'))):
    files[os.path.relpath(f, D).replace(os.sep, '/')] = open(f, encoding='utf-8').read()
for f in sorted(glob.glob(os.path.join(D, 'events', '*', 'icon.svg'))):
    files[os.path.relpath(f, D).replace(os.sep, '/')] = 'data:image/svg+xml;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
safe = lambda js: js.replace('</', '<\\/')          # never close the <script> early
bundle = '<script>window.BUNDLE=' + safe(json.dumps(files, ensure_ascii=False)) + ';</script>\n'
catalog = '<script>' + safe(open(os.path.join(D, 'catalog.js'), encoding='utf-8').read()) + '</script>'
assert html.count('<script src="catalog.js"></script>') == 1
html = html.replace('<script src="catalog.js"></script>', bundle + catalog)
# the one-file copy updates itself from its own address, and has no separate files to cache
html = html.replace("navigator.serviceWorker.register('sw.js')", "false && navigator.serviceWorker.register('sw.js')")
html = re.sub(r'<link rel="manifest"[^>]*>', '', html)
# icons inline too, so the one file asks for nothing else
for href, mime in [('icons/icon-32.png', 'image/png'), ('icons/icon.svg', 'image/svg+xml'), ('icons/icon-180.png', 'image/png')]:
    uri = f'data:{mime};base64,' + base64.b64encode(open(os.path.join(D, href), 'rb').read()).decode()
    assert html.count(f'href="{href}"') == 1, href
    html = html.replace(f'href="{href}"', f'href="{uri}"')
out = os.path.join(D, 'merge-stories.html')
open(out, 'w', encoding='utf-8').write(html)
print(f'{out}: {len(html)//1024} KB, {len([k for k in files if k.endswith(".js")])} scripts')
