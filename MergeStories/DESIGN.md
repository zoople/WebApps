# Design lessons (read before balancing a new story)

These come from playing Larkspur Attic and Pennywhistle Fete to the end. Each lesson says where it came from.

## Economy
- **Every activity must be needed.**
  - A currency you never run short of is noise.
  - Energy was cut (Fete, 19 Oct 2026). Generators are free to tap and rest when empty, and that's the pacing.
- **One item, one job.**
  - Tea was both energy and a rarity booster, so it got claimed by accident and nobody found the booster.
  - Now tea only boosts, and it can't be claimed.
  - The tiered, limited boost (2/5/12/30/75 taps) was a hit. Keep it.
- **Coins need a sink** you feel: egg timers, time skips, wheel tickets.
- **Sell where the need is.** A resting generator or a short wheel offers the purchase right there (the mini shop), not in the menu.
- **When a cost goes up, don't raise the matching income.** (Repo rule.)
- **Never reward two of the same item in one go.** Give one item of a higher level. (Repo rule.)

## Side stall (Jumble Sale / White Elephant)
- On its own the stall gets ignored, so its pass points go unearned (Attic and Fete).
- **Fix:** the stall keeper becomes a story character, and some of their story orders need stall sales (`sales:n`).
  - Fete used 3/4/5/6 sales across chapters 2–5.
  - With that, the bot reached about 200 of 290 pass points without trying.
- Keep the stall open after the ending, so the pass can still be finished.

## Chance systems (the wheel)
- **Do the maths before shipping.** Lighting all 20 segments of a fair wheel takes about 72 spins (the coupon-collector problem).
- At 10 tickets a spin, with roughly 150 tickets in an event, that's about 12 lights. A Ticket Strip refund on repeats only adds about 1 light.
- A wheel that looks completable but isn't turns fun into frustration at the end (Fete).
- Decide up front: either the wheel isn't meant to be finished (and say so), or add a pity rule or let it lean towards dark segments.
- **The chain that pays tickets must reach a spin.** The Ticket Roll was worth 8 when a spin cost 10. It's now 10.
- **Refund something on a "nothing new" result.** Tickets back, not a penny.

## Feeders (compost bin and similar)
- **Never ask for something the player can't make yet.**
  - The bin asked for orchard fruit, which only grows from the bin's own seedlings: a circular dependency.
  - The engine now only asks for chains that are on the board or made by a generator there.

## Messages
- Short feedback floats up from the tile and fades: claims, nudges, refills.
- Only things you must read or decide on stay until dismissed: sell warnings, no room, new finds, quests, stage gifts.

## Story
- Attic (cosy mystery about who someone was) is the favourite so far. Fete (joyful, wholesome) was good, but a step behind.
- Big reveals get a short scene (3–5 lines, 2+ speakers) right when they happen, and Reflections retell them at the end. See the vault's Story Notes.
- A side character who drives a mechanic works best with a small arc of their own (Mrs Hale: Ron, 1976, the roof).

## Generator trees (Bellavista Gardens, rebuilt from Merge Mansion's Ignatius Boulton event)
- **Generators that make generators clog the board.** A pallet that drops tills and clocks filled the board with spares in testing.
  - Spare generators can now be sold. Your last one of a kind can't.
  - Give every generator chain at least two levels, so duplicates can merge.
- **Never let an order eat a progression piece.** An order that took the statue made the stonemason's yard impossible to build.
  - Ask for what the piece *makes* instead.
- **Watch the last chapter.** The first balance put half the taps into chapter 6 (two "9"s and two big story items).
  - Spread the big asks across chapters 4–6.
- **Merge bonuses (stars from merging numbers) make lots of points.** Size the pass tiers from a bot run, not by guessing.
- **A feeder that pays 6 at once needs room.** The starting board needs about 8 free tiles.
