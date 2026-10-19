# Merge Stories

A merge-game console. The stories are cartridges.

**The rule:**
- The **engine** (`engine.js`, `index.html`) owns all behaviour: UI, item types, generators, the shop, the wheel, orders, rewards logic and audio.
- A **story** (`events/<id>/event.js`) is configuration only: words, cast, chapters, orders, chains (names, emoji, numbers), board layout, reward numbers, cover art, colours and music.
- A new kind of item or mechanic goes into the engine first. Then a story turns it on through config.

Before balancing a new story, read the lessons in `DESIGN.md`.

## Files
- `index.html`: the console. It shows the story shelf, loads the chosen story, and handles self-update, the offline worker and every style.
- `engine.js`: the shared game.
- `catalog.js`: the shelf, with one line per story.
- `events/<id>/event.js`: one story. See "What a story sets" below.
- `events/<id>/icon.svg`: the story's card art.
- `sw.js`: the offline cache. List new files in `SHELL` and bump `CACHE`.

## Item types (reserved chain keys)

A story names these chains and sets their numbers. The engine decides how they behave.

| Key | Type | Behaviour |
|---|---|---|
| `E` | booster (`type:'boost'`) | Drop on a generator: its next 2/5/12/30/75 taps (by level) find its rare chain 5× more often. **Can't be claimed.** |
| `C` | coins (`claim:'coins'`) | Tap twice to claim. Spent in the shop and the mini shop. |
| `X` | applause/xp (`claim:'xp'`) | Fills the stage bar. Each stage gives a gift. |
| `N` | pass points (`claim:'points'`) | Pass tiers, notes and letters. |
| `H` | time skip (`claim:'skip'`) | Fast-forwards every generator's recharge. |
| `CP` | wheel tickets (`claim:'chips'`) | 10 tickets per spin. |
| `ET` | egg timer | Drop on a generator to refill it. |
| `DR` (any `dust:true` chain) | dust remover | Drop on a cobwebbed tile to clear it. The item underneath is yours. |
| `V` | time chargers (`hours`) | Nearby timed generators recharge ×2, then get topped up. |
| `Q` | donation boxes (`free`, `uses`) | Free taps, then the box folds flat. Two unopened boxes merge into a full bigger box. |
| `G`, `Y`, `O` | orchard | Seedlings merge into a tree (a generator with `uses`). The tree drops fruit, then leaves a log. |
| any `want:true` item | feeder (compost bin, mulcher) | Asks for one item from its `wants` (or `CONFIG.bin.wants`), only ones you can make right now. Gives `count` × `gives` at `giveL` (default: one, level 1 or 2). |
| `U` | stove (`fuelled`) | Burns items listed in `CONFIG.fuel`. |
| any `wheel:true` chain | prize wheel | Uses `EVENT.wheel`. |
| the `story:true` chain | lore items | Its top item is "the secret" for the ending banner. |
| `g*` | generators | Use `charges` and `rechargeMs`. Taps are free (there is no energy), and generators rest when empty. A spare generator (another of its kind is on the board) can be sold. Your last one can't. |
| any chain | generators inside a chain | Any item can be `gen:true` with its own `drop` (an orchard tree, or garden furniture that makes story pieces). Generators can drop other generators. |
| any chain | `mergeBonus:{from, give}` | Merging up to level `from` or higher also drops `give` (Bellavista: numbers 2+ drop a star). |

## What a story sets
- `EVENT`:
  - `id`, `title`, `tagline`, `version`, `themeColor`
  - `cover`: `art`, `sub`, `key`, `more`
  - `terms`: every story word
  - `complete`
  - `css`
  - `music`: `bpm`, `beats`, `mix`, `pad`, `compose()`
  - `wheel`: `cost`, `n`, `segs`, `last`, `intro`, `light`, `repeat`
  - `rewards`: `order`, `finale`, `side`, `discovery`, `quests`, optional `stage`. Tables read "value or more → level".
- `CONFIG`:
  - `saveKey`, `legacySaveKey`
  - `sideOpen`
  - `chargerScale`
  - `bin`, `fuel`
- `CHAINS`
- `LAYOUT` (9 rows × 7)
- `CAST` (`S` is the side stall)
- `CHAPTERS`
- `TASKS`, which can also use:
  - `wheel:n` (needs n wheel lights)
  - `sales:n` (needs n stall sales made after the order appears)
  - `gifts`
  - `more`
  - `side0`
  - preset `id` (200+ keeps old saves lined up)
- `PASS`, `FELIX` (letters), `MOON_NOTES`, `P2` (shop name), `REFLECTIONS`, `GEN_STORY`, `QUESTS`
- `SHOP_ITEMS` (data only), with one of:
  - `item:[k,l]`
  - `chips:n`
- Each shop item also sets:
  - `price`: a number, or `{base, mult, max}` (goes up with each purchase)
  - `what`
- The mini shop offers the item with id `ET` at a resting generator, and `TK` at the wheel.

## Add a story
1. Copy an `events/<id>/` folder and rewrite its content.
2. Add the story to `catalog.js`.
3. List its files in `sw.js` (`SHELL`) and bump `CACHE`.
4. Bump `VERSION` in `index.html`.

Each story saves under `merge-stories:<id>`. The chosen story is stored in `merge-stories:current`.
