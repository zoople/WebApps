# WebApps — standing instructions

Single-file HTML playables and small web apps (plus packaged APKs) live in this repo.

## Always include a full screen option (standing rule from the owner)
Whenever you make **any app or web app** — HTML page, game, tool, or Android WebView APK — it must have a clear **full screen** option:
- A visible control (menu entry, settings toggle, or ⛶ button) that calls the Fullscreen API
  (`documentElement.requestFullscreen()` with the `webkitRequestFullscreen` fallback), plus an exit control.
- Handle refusal: browsers that can't do it (iPhone Safari, sandboxed iframes) must show a short, helpful message
  (e.g. "Share → Add to Home Screen for a full-screen app") instead of failing silently.
- Remember the preference (localStorage, wrapped in try/catch) and re-apply it from a user tap (e.g. when starting a game).
- Add `mobile-web-app-capable` / `apple-mobile-web-app-capable` meta tags so installed/home-screen versions open full screen.
- Android APK shells: use immersive sticky mode (hide status + navigation bars) and treat the app as already full screen.
- Reference implementation: `MagicDuel/web/js/ui.js` (`UI.setFullscreen`, `UI.toggleFullscreen`) and the Settings / in-game menu entries in `MagicDuel/web/js/main.js`.

## Other preferences
- Mobile-first: portrait phone layouts must work at ~360×640; keep tap targets ≥ 40px.
- When card/art images can't load, fall back to emoji/text rendering so the app is still playable.
