# Open Loops

A mini-course on organising a busy life: 12 modules, each with a long-form explanation, a diagram,
an interactive activity, an Obsidian fit and a paper fit. Every module has a two-host podcast episode
(`audio/mNN.mp3`, rendered locally with Kokoro) and a device-voice read-aloud fallback.

- Live: https://zoople.github.io/WebApps/OpenLoops/
- Single page `index.html`, no external requests. Progress saves in `localStorage` ("Clear save" on the home screen).
- Offline: `sw.js` caches the page; "Save audio for offline" on the home screen caches the 12 episodes.
- Bump `VERSION` and `BUILD_DATE` in `index.html` on every release.
