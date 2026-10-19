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
   **Game first, instructions last:** screens and pop-ups lead with the game (the board, the wheel, the button). Detailed rules
   and how-tos go in a collapsed "How it works" section at the bottom, closed by default.
6. **Synth audio must never crackle.** This has had to be fixed repeatedly; build it right first time.
   Crackle on phones comes from CPU underruns and speaker overload, not just bad envelopes. Always:
   - `new AudioContext({latencyHint:'playback'})` (bigger buffers on Android), with a plain fallback.
   - Master chain: high-pass ~90 Hz (phone speakers distort below it) → high-shelf cut → gentle
     compressor (attack ≥ 20 ms) → destination, with master gain ≤ 0.7 for headroom. Peak well under 0.5.
   - Every envelope starts and ends at 0 with ramps: attack ≥ 8 ms, exponential decay to 0.0001,
     `stop()` after the tail. Never schedule at exactly `currentTime` — add ~20 ms.
   - Keep node count low: share one filter per chord/pad, cap simultaneous SFX voices (~28),
     `disconnect()` oscillators `onended`. Reverb IR ≤ 2.5 s. No LFO-modulated delay chorus.
   - Music scheduler: ≥ 0.5 s lookahead, and if the clock has passed `nextT` after a stall,
     jump ahead instead of scheduling into the past.
   - Soft timbres: filtered, detuned pairs (triangle/sine, or saw under a low-pass). No raw square waves
     or bright high partials. Suspend the context when the page is hidden.
   - Best fix (Larkspur Attic v16): pre-render music loops and SFX in an `OfflineAudioContext` and play
     buffers live (loop the music with `loop=true`, fold the reverb tail onto the start). Nothing synthesises
     in real time, so main-thread jank can't underrun. In the offline render, create nodes just ahead of the
     render position (`suspend()` every second) and disconnect finished ones, or the render is ~16× slower.
   - Test: record the output with an AudioWorklet in headless Chromium and check peak level and
     sample discontinuities before shipping.

7. **Work fully offline.** No Google Fonts, CDNs or other internet requests: a stylesheet that can't load
   leaves a blank screen on a weak connection. Embed fonts with
   `python3 tools/embed-fonts.py <app.html> <google/fonts checkout> "Family|file.ttf|style|weight[|wght=min:max]"`.
   Register an offline service worker next to the app (copy `Grace/sw.js`, list the app's files, use its own
   cache prefix; root apps scope it, e.g. `bridgeburn-sw.js` with `{scope:'./bridgeburn'}`).
   **Test offline before shipping**: headless Chromium with the network off and with every request hanging,
   both from the file and served over http after the worker installs. The page must paint in under a second.

## Merge games: work in `MergeStories/` only

- **All merge-game work happens in `MergeStories/`** (the console engine plus story cartridges). The old standalone
  games in `LarkspurAttic/` are frozen: don't edit them.
- **Engine vs story.** UI, behaviour, item types, mechanics and reward *logic* go in the engine (`engine.js`,
  `index.html`). A story (`events/<id>/event.js`) is configuration only: words, cast, chapters, orders, chains,
  layout, reward numbers, art and music. A new kind of item goes into the engine first. See `MergeStories/README.md`.
- Before balancing a new story, read `MergeStories/DESIGN.md` (lessons from finished events) and add new lessons there.

- **Never reward two of the same item in one go** (orders, quests, passes, gifts, drops). Give one item of a
  higher level instead: the player could just merge the pair.
- When a price or cost goes up, don't raise the matching income to compensate; the point is that it costs more.

## Publishing workflow

- Develop on the session branch, then open a PR to `main`.
- **Ask the user a yes/no question (AskUserQuestion) before merging**, then squash-merge it yourself.
  Don't make them click through GitHub.
  - **Exception: `MergeStories/` and `LarkspurAttic/` (the merge games).** Don't ask. Squash-merge the PR
    automatically as soon as it's ready, then report as usual.
- After merging, reply with: the live link with `?v=<n>` appended (cache-buster), what changed as
  plain bullets, and what was and wasn't tested. Pages takes about a minute to deploy.
- Pages must be enabled once: repo Settings → Pages → Deploy from a branch → `main` / root.
- If the branch's PR was already merged, restart the branch from the latest `main` before new work.
