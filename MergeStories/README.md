# Merge Stories

A merge-game console with stories as cartridges.

- `index.html`: the console. It shows the story shelf, loads the chosen story, and handles self-update and the offline worker.
- `engine.js`: the shared game: board, merging, orders, wheel, pass, shop, audio and UI. Engine fixes go here and reach every story.
- `catalog.js`: the shelf, with one line per story.
- `events/<id>/event.js`: one story. It defines `EVENT`, which holds:
  - title and version
  - `terms` (story words)
  - `cover`
  - `css` (theme overrides)
  - `complete`
  - `wheel` (optional)
  - `music` (tempo, mix and `compose()`)
- Each `event.js` also holds the story's content blocks:
  - CONFIG, CHAINS, LAYOUT, CAST, CHAPTERS, TASKS
  - rewards, PASS, notes and letters
  - shop, gen stories, quests
- `events/<id>/icon.svg`: the story's card art.

## Add a story
1. Copy an `events/<id>/` folder and rewrite its content.
2. Add the story to `catalog.js`.
3. List its files in `sw.js` (`SHELL`) and bump `CACHE`.
4. Bump `VERSION` in `index.html`.

Each story saves under `merge-stories:<id>`. The chosen story is stored in `merge-stories:current`.
