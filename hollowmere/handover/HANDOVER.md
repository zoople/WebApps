# Hollowmere: handover (v1.30, save v19)

Hollowmere is a 3DS homebrew action-RPG in C: libctru, citro3d, citro2d, ndsp. Michael installs it as a `.cia` with FBI on a New 3DS XL. All five planned phases are done. Next work comes from his playtest notes.

## 1. Restore (Claude does this)
Michael attaches `HANDOVER.md`, `hollowmere-project.tar.gz` and `hollowmere-toolkit.tar.gz`.
```sh
cd / && tar xzf <att>/hollowmere-toolkit.tar.gz   # /root/dk toolchain, /root/src/Panda3DS/build/Alber emulator
cd / && tar xzf <att>/hollowmere-project.tar.gz   # /root/game, /root/emu (drive.py, run.sh), /root/tools/qr.py, /root/3DS-Homebrew-Playbook.md
export PATH=$HOME/dk/bin:$PATH && cd /root/game && ./build.sh
```
- The toolchain is clang/lld wrapper scripts. If it breaks, rebuild it with Playbook §2.
- If the emulator won't start, rebuild Panda3DS with Playbook §4. It needs SDL2, EGL and Xvfb.
- After editing `tools/emoji_atlas.py`, run `python3 tools/emoji_atlas.py build source/icons.h`.

## 2. Working with Michael
- **Tone:** direct peer, dry wit, no filler. One item per bullet. Use `## headings` for long answers.
- **"Make notes, don't do anything until I say go":** only record the notes in `NOTES.md` and confirm them. Build only on "go".
- **On go:**
  1. Implement, test in the emulator, and bump `HM_VERSION` in `source/common.h`.
  2. Build the CIA and publish (§4).
  3. Ask yes/no with AskUserQuestion before merging.
  4. Merge, then send the QR PNG.
  5. Reply with the link + `?v=N`, bullets of what changed, and what was and wasn't tested.
- **Standing rules:**
  - Game UI first; detailed help goes in the Help tab.
  - Short bullet guidance.
  - No audio crackle.
  - Buttons are written in text as `[A]`, which `hl()` colours cyan.
  - Research questions get real designer and community sources.
- **Testing:** he wants a way to test new systems straight away, like the test switches at the bottom of the START menu.

## 3. Build and test
- Debug build (cheat keys): `EXTRA=-DHM_DEBUG ./build.sh`.
- Emulator: `sh /root/emu/run.sh /root/game/build/hollowmere.3dsx <secs>` (use the absolute path).
  - Drive it from Python: `sys.path.insert(0,'/root/emu'); from drive import *`, then `press('A')`, `key('L',1)`, `shot('name')` (writes `/root/emu/name.png`).
  - Wait about 16 s for boot, then `press('A', after=12)` to load.
  - It runs slower than real time, so use generous sleeps. It sometimes drops presses.
  - It has no circle pad (no walking) and no audio. Use the teleports below.
  - Save file: `~/.local/share/Alber/hollowmere/SDMC/3ds/hollowmere.sav`. A v15 save is kept at `/root/emu/sav_v15_backup.sav`.
- **Debug keys:**
  - Teleports:
    - R+Select: cycle through the NPCs and the arenas.
    - L+Select: go to the guide target.
    - R+X: open meadow.
    - R+Up: Bram's stall or the strongbox.
  - Player and economy:
    - L+Y: level up and +500 gold.
    - R+Left: drop 30 coins.
    - L+Down: open the shop.
  - Foes and world:
    - L+B, R+B, R+Y: spawn foes.
    - R+Down: force a rumble.
    - L+Left: force a world event.
  - Seals:
    - L+Right: toggle all seals.
    - R+Right: cycle teleports to the road seals.
  - Dungeons:
    - L+R+Left: outside, cycle the dungeon gates; inside, jump to the exit.
    - L+R+Up: inside a dungeon, jump to the next puzzle or lore object; outside, give forge items.
    - L+R+Down: kill the champion and jump to the hoard.

## 4. Release
```sh
cd /root/game && ./build.sh && cd build
makerom -f cia -o Hollowmere-vX.Y.cia -elf hollowmere.elf -rsf ../cia/app.rsf -icon icon.icn -banner banner.bnr -target t -exefslogo -DAPP_ENCRYPTED=false -DAPP_TITLE="Hollowmere" -DAPP_PRODUCT_CODE="CTR-H-HMRE" -DAPP_UNIQUE_ID=0xFB4D1 -DAPP_SYSTEM_MODE=64MB -DAPP_SYSTEM_MODE_EXT=Legacy -DAPP_CATEGORY=Application -DAPP_USE_ON_SD=true -DAPP_MEMORY_TYPE=Application -DAPP_CPU_SPEED=268MHz -DAPP_ENABLE_L2_CACHE=false -DAPP_VERSION_MAJOR=1 -DAPP_VERSION_MINOR=Y -DAPP_ROMFS=../cia/romfs
```
- **Publish to GitHub Pages in `zoople/WebApps`.** Clone it to `/home/claude/webapps` with `add_repo` if it's missing.
  1. `git fetch origin main && git checkout -B hollowmere-vX.Y origin/main`.
  2. `git rm` the old CIA in `hollowmere/`, copy in the new one, commit and push.
  3. Open the PR with `gh api repos/zoople/WebApps/pulls -X POST`. Use REST: GraphQL and releases are blocked.
  4. Ask before merging, then `gh api repos/zoople/WebApps/pulls/N/merge -X PUT -f merge_method=squash`. The last PR was **#130**.
- **Commit attribution:** end commit messages with the `Co-Authored-By` and `Claude-Session` lines from the system reminder. PR bodies end with the Claude Code line and the session URL.
- **Link:** `https://zoople.github.io/WebApps/hollowmere/Hollowmere-vX.Y.cia`. Pages takes about a minute to update.
- **QR** (FBI → Remote Install → Scan; it must point at the file itself):
  `cv2.QRCodeEncoder.create().encode(URL)`, add a white border, scale ×10 with nearest-neighbour, save to `/root/Hollowmere-vX.Y-qr.png`, and send it.

## 5. Code map
| File | What's in it |
|---|---|
| `common.h` | Version, world constants (`WORLD_N 112`, `CELL 1.5`, `ISLAND_K 2.8`), gfx and world API, `SealPt`, dungeon hooks (`dunOn`, `dunZone`, `dun_blocked`) |
| `data.h` | Content tables: items, enemies (`endefs`, `en_role`), elements, NPCs, quests, the main story (`mainq`, 19 chapters), recipes, Depths names, palettes, room templates, Wren's pages, Depths lore, notes and key dialogue, affixes, legendary powers, perks |
| `game.h` | `Save` struct (append-only), `Enemy`, `PlayerT`, `DunState` (`DG`), prototypes |
| `game.c` | All game logic, save and load (`read_save` migration chain), the main loop. It `#include`s `dungeon.inc` |
| `dungeon.inc` | Depths and Rift generation, collision, puzzles, rift types, rewards, gates |
| `ui.c` | All world rendering, the HUD, modals (level-up cards, perk cards, rift picker, pause) and the bottom-screen tabs |
| `world.c` | Deterministic terrain, zones, props, collision, seal boundary points |
| `gfx.c` | citro3d setup, the world VBO plus a second dungeon VBO (the mesh library is copied in front of it), font, emoji atlas |
| `audio.c` | Procedural sfx and music on a worker thread |

**Conventions:**
- **Saves:** append-only. Bump `SAVE_VER` and add a migration line.
- **World generation is deterministic.** Chest indices are saved, so place new things last, as the dungeon gates are.
- **Quests:** state is reached through `QS(q)`/`QP(q)`. A quest has a giver, a prerequisite (`req`) and text pages split by `|`.
- **Text:** colour codes `\x01` yellow, `\x02` red, `\x04` purple, `\x05` cyan. Bytes `0x80+` draw emoji (`ICO_*`, `IS_*`). In dialogue, `@Name:` sets the speaker.
- **Difficulty:** `S.optDiff` 75 is the tuned balance. The spawn slider's tuned value is 25.

## 6. The game now (one line per system)
- **Story:** "The Great Lantern", 19 chapters through Meadow → Beach → Forest → Swamp → Ruins.
  - One quest per islander at a time. Islanders' quests unlock when the story introduces them.
  - Marigold's ledger (`Q_L*`) is a side story about Wren Ashby, the old Lamplighter.
- **Zones and seals:** each outer zone is walled by its own element.
  - The weapon of the element it's weak to breaks the seal: fire melts the ice to the beach, storm opens the forest, venom opens the swamp, frost opens the ruins.
  - Each boss rewards the next zone's key weapon.
  - Quests that send you somewhere sealed wait until it's open.
- **Foe levels:** based on the world level plus distance from town.
  - A kill can trigger a **rumble**, which raises the world level to yours.
  - Foes above your level grow bigger, get an aura and growl.
  - No single hit takes more than 45% of your HP.
- **Combat:**
  - Foe roles each have one telegraph: a red arrow means a dash, a red ring a slam, a circle a cast, and a blue shimmer means a guard (stop swinging).
  - Shields block from the front.
  - Stamina, roll, perfect dodge (slow-mo plus a guaranteed crit), heavy attack (hold A).
  - Elements: fire burns and breaks guards, frost chills then freezes, storm interrupts and arcs, venom poisons and weakens.
  - Bosses stay dead once beaten.
- **Economy:**
  - Per-item pouches, upgraded with pack points from level-ups.
  - Gold is uncapped, but fainting drops 30% of what you carry.
  - Bram's strongbox is a bank, and buying in town draws from it.
  - The return stone (START, row 1) takes you home and back.
  - Level-up cards: Fortune, Pack Point, Hardier, Endurance.
- **Depths** (stone arch, one per zone):
  - Locked until the story opens it: the meadow one after Gloopa, the rest once you've met that zone's islander.
  - 5 floors, with each floor reached saved as a checkpoint.
  - Floor 2: a story door with a note; that zone's islander gives the key.
  - Floor 3: three levers. Floor 4: two stones to push onto two plates.
  - Lore lecterns on the other floors tell that Depths' story.
  - Floor 5: the champion and a page of Wren's journal. Its lamp lights on the arch.
- **Rifts** (purple tear, one per zone): open after King Pincer.
  - You pick a tier; foes get ×1.17 HP and ×1.09 damage per tier.
  - Foes are mixed from every open zone, in open caverns with Power, Haste, Ward and Storm shrines.
  - Each tear is one of three types (`S.riftNext`):
    - **Hunt:** a kill bar summons the Guardian; a 4:00 clock decides +1/+2/+3 tiers; each faint costs time.
    - **Arena:** 5 waves, leave between them.
    - **Delve:** extraction; go deeper for ×0.5 haul per floor, and fainting loses everything.
- **Loot:**
  - Affixes (`Gear.pad`): 6 weapon, 4 armour, 3 charm.
  - Legendary powers (`Gear.special` 10–13): Embers, Echoes, Lantern, Storms.
  - Boss and champion **loot fountains**.
- **Perks** every third level, chosen from 10 (`S.perks`). Whirlwind is used with [ZR].
- **Test switches** at the bottom of the START menu open all Depths (and the seals) and the Rifts. [Y] in the rift picker cycles the rift type.

## 7. Open threads / ideas
- `NOTES.md` holds the playtest history and the phase plan. Michael said he has more ideas for dungeons.
- Not yet verified on hardware:
  - Pushing the stones.
  - A full Delve run and a Guardian fight.
  - Affixes, legendary powers and perks triggering in real fights.
  - How the new systems balance.
- Possible next steps:
  - More Depths puzzle types: timed switches, torches, sequences.
  - Per-dungeon set pieces.
  - Gem sockets from rifts.
  - A way to view your perks: there's no perk list screen yet.
