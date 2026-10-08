# Magic Duel

A playable Magic: The Gathering duel with a rules engine, an AI opponent and a **strategy coach** that explains the best play and why.
Runs as plain HTML/JS (`magic-duel.html`, or `web/index.html`) and as an Android APK (`MagicDuel.apk`, a thin WebView shell).

## Install / play
- **Android:** copy `MagicDuel.apk` to the phone and open it (allow "install unknown apps"). Needs internet only for card art.
- **Browser:** open `magic-duel.html` (single file) on any device.

## What's in it
- **Rules:** library/hand/battlefield/graveyard/exile, London mulligan, untap→cleanup turn structure, the stack with priority and responses, counterspells, triggered/activated/mana abilities, auras, equipment, tokens, X spells, summoning sickness, full combat (first strike, deathtouch, trample, lifelink, flying/reach, vigilance, haste, hexproof, indestructible…), state-based actions.
- **Cards:** ~100 real cards (names match Scryfall) in `web/js/cards.js`.
- **Decks:** 10 Jumpstart-style 20-card themes (pick two = a 40-card deck, like the Foundations Beginner Box) and 4 ready-made starter decks, in `web/js/decks.js`.
- **AI:** `web/js/ai.js` (`Brain`) — land choice, removal/burn targeting, curve planning by mana, attack/block evaluation, counterspells, combat tricks.
- **Coach:** `web/js/coach.js` — advice + reasoning for mulligans, main phase, attacks, blocks, responses and targets; feedback on your choices; end-of-turn mana review; post-game review; deck archetype + matchup tips; a strategy guide.
- **Card art:** fetched by name from Scryfall at runtime, throttled and cached; falls back to drawn text cards offline.

> The deck lists are *inspired by* the recent Beginner Box / Jumpstart products (themes like Vampires, Goblins, Soldiers…) but are built from the curated card pool above, not copied card-for-card.

## Adding cards and decks (deck-building hook)
- New card: add `creature(...)` / `spell(...)` in `cards.js` (cost, types, `resolve`, `triggers`, `abilities`, `static`, `tag`/`fx` for AI hints).
- New deck: a deck is `{id, name, list: [[cardName, qty], ...]}`. `Decks.saveCustom(deck)` stores it in localStorage and `Decks.all()` returns starters + custom — a deck-builder screen only needs to build that list.

## Build & test
```
./build-apk.sh                # needs aapt, dx (dalvik-exchange), zipalign, apksigner, JDK, android.jar (apt: aapt apksigner zipalign dalvik-exchange android-sdk-platform-23)
node tools/bundle.js          # regenerate magic-duel.html
node tools/test.js            # rules tests
node tools/sim.js 300         # AI-vs-AI crash/regression sim
node tools/matrix.js 60       # deck win-rate matrix
node tools/ui-play.js 3       # plays games through the real UI in headless Chromium (needs playwright)
```
APK is signed with a local debug key (`~/.magicduel-debug.keystore`); sign with your own key for distribution.
