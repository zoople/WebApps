# WebApps — conventions for every app in this repo

Static browser apps, published with GitHub Pages from `main`
(`https://zoople.github.io/WebApps/<path>`). Each app is a single HTML file in its own folder
(or a root file for older apps). No build step.

## Every new or updated app must

1. **Be full screen.** In `<head>`: `viewport-fit=cover`, a `<link rel="manifest">` with
   `"display": "fullscreen"`, `theme-color`, `apple-mobile-web-app-capable`,
   `mobile-web-app-capable`, an `apple-touch-icon` and a favicon. Ship the manifest and PNG icons
   (32/180/192/512) next to the app (see `HarvestHollow/` and `bridgeburn.webmanifest`).
   Add an in-app full-screen toggle and request full screen on the first Play tap
   (`requestFullscreen({navigationUI:'hide'})`, with the `webkit` fallback). On iOS Safari
   (no Fullscreen API) show a one-line "Share → Add to Home Screen" hint.
2. **Show a version number on the front screen** ("Version v8 · 9 Oct 2026") and in the menu.
   Bump it on **every** release and quote it in the reply to the user.
3. **Self-update.** The user is often on a stale cached copy. On load and every few minutes,
   `fetch(location.pathname+'?_='+Date.now(),{cache:'no-store'})`, compare the `VERSION` string, and
   offer an "Update now" button that reloads with `?v=<version>`.
4. **Touch first.** Thumbstick for movement (never tap-to-move), big targets, no hover-only UI.
5. **Guidance text is short bullet points**, never paragraphs.

## Publishing workflow

- Develop on the session branch, then open a PR to `main`.
- **Ask the user a yes/no question (AskUserQuestion) before merging**, then squash-merge it yourself.
  Don't make them click through GitHub.
- After merging, reply with: the live link with `?v=<n>` appended (cache-buster), what changed as
  plain bullets, and what was and wasn't tested. Pages takes about a minute to deploy.
- Pages must be enabled once: repo Settings → Pages → Deploy from a branch → `main` / root.
- If the branch's PR was already merged, restart the branch from the latest `main` before new work.
