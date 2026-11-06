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
- **Avoid keycap emoji (0️⃣ 1️⃣…) and other combined sequences.** On some phones the digit comes from the game font and the keycap box shows as a broken square. Use `tile:true` with plain characters instead.

## Bellavista Gardens, first play (28 Oct 2026)
- **Cobwebs must always be clearable.** A box could open into a cobweb holding an egg timer or duster (one-level items), which can never be merged free.
  - The engine now only webs items that can be merged (not generators, not one-level or top-of-chain items). Old saves heal on load.
- **Two items must never share an emoji** (Mama's Preserves and the Jam Jar were both 🫙). The bundler now refuses to build if they do.
- **Check story order against when things can appear.** Generator stories play whenever that generator first shows up, so they can't reveal later plot (the gazebo line gave away the marriage before you'd met Clara).
  - Keep generator, diary and early order lines to hints.
  - An order that depends on another can wait with `after:true`, which holds it back until the order listed just before it is done.
- **Reordering orders changes their save ids.** Pin `id`s on anything you move (ids 0–99 are the auto ones).

## Bellavista Gardens, finished (28 Oct 2026): story great, balance off
- **The headline mechanic must be needed all the way up.** Nothing asked for the top numbers ("8", "9"), so the number chain was never finished. If a chain is the point of the story, late orders should need its top levels.
- **Points need a job after the big reward.** Once the statue (Star Board level 3) was built, stars were useless. Keep the pass going past the key unlock: more levels, each with a postcard or letter, up to a final reveal.
- **Every story needs a side stall** (Jumble Sale / White Elephant): somewhere to spend spare items, with a character and `sales:n` story orders.
- **Coins must be needed.** If generators alone can finish the story, the shop is decoration. Give coins a real sink tied to progress.
- **A bot that finishes isn't proof.** It also has to show that coins get spent, the pass gets used, the side stall gets used and the headline chain gets topped. Check those numbers before shipping.

## The Left Luggage Office (1 Nov 2026): built from the lessons above
- **Start from a balance that played well.** Generators, order sizes and the side stall are copied from Pennywhistle Fete's numbers, then a new mechanic goes on top.
- **Chance systems without the luck wall:** Vesna's deck draws without replacement, so every reading is new. No coupon-collector grind like the Fete wheel.
- **One currency, one real sink:** readings cost coins and creep up (6 + 1 per card, 363 coins for all 22). The bot earned about 405 and ended with about 40, so coins matter all the way.
- **The headline mechanic is needed to the end:** the finale needs all 22 cards.
- **Points have a job to the end:** Insight tiers run to the last chapter, with Mr Pell's postcards every third tier. Tiers sized so a bot that never merges moons gets 12–14 of 15.
- **Bot report to check before shipping:** cards read, coins in/spent/left, stall sales, pass tiers, top level reached per chain.

## Writing check (6 Nov 2026)
- **Objects must be able to do what the text says.** A page can't be "folded inside" a moon or a sparkle. Pin it to a rosette, read it from a notebook, or have a character react to the object.
- **Text that appears whenever something happens can't assume how far the player has got.** Postcards (pass tiers), generator stories and token notes arrive at unpredictable times, so they mustn't reference later chapters or each other.
- **Introduce a thing when it arrives.** If a chapter gift brings a generator, that chapter's scene names it. A later chapter can't introduce it again.
- **A deck the finale needs in full has already shown every card**, so the ending lays a card down rather than "drawing the last card".
- **Keep numbers consistent** (years, ages, ticket numbers). Read the whole script once, end to end, before shipping.

## Coins: count every source (6 Nov 2026)
- **The bot must collect everything a player does:** orders, stall, pass, card blessings, *and* quest rewards and collection reveals. Leaving out quests and reveals made Left Luggage look balanced at about 410 coins when players really got about 830, most of it early. So readings felt free.
- **Front-loaded income breaks anything priced per use.** Early quest steps and per-level reveal coins pile up in chapters 1–2. In Left Luggage, early quest steps now pay tea, timers and nods, and reveals pay coins only for a chain's top item.
- **Price a coin sink from the income curve:** measure coins at each chapter's end, then fit a price table so the cards each chapter needs cost about 85–95% of what's been earned. Test with a greedy bot that spends every coin; it should get at most 1–2 cards ahead of the story.
- **Test every play style, not one bot.** Left Luggage v4 was checked with five: plain, greedy reader, coin merger, timer buyer, and merger plus buyer. Targets: merging gets you at most about 3 readings ahead; buying 4–6 kitchen timers (~150 coins) still finishes; plain play ends with about 60 spare. Coins should be needed for both readings and the shop, so every purchase is a choice.

## Spoiler gates and adversarial bots (6 Nov 2026)
- **Orders:** only the first three unfinished orders of the current chapter show, in list order. Favouring one character gets you at most two orders ahead, never into the next chapter. Use `after:true` when an order needs the one before it.
- **Story items:** the engine caps the story chain at the highest level the orders have asked for so far (merges above it are refused, and generators drop no higher). So its lore can't be read ahead of the plot. Everything opens up after the ending.
- **Letters:** a pass tier can carry `ch:n`, so its letter can't arrive before that chapter (the "Chapter n" label shows instead of Claim). Gate any letter that names later plot.
- **Check with the scanner:** list each reveal's keyword and chapter, then scan every text source at its earliest possible time (orders in the visible window, story items under the cap, letters, generator stories, moon notes, cards).
- **Adversarial bots:** a racer (merges coins, sells everything, reads every card it can afford) reached at most 2 readings ahead. A spender (buys everything in the shop at once) never deadlocked, but took up to about twice as long. The shop and mini shop now warn when a purchase would leave you short of a reading the story needs.

## Left Luggage, played (7 Nov 2026): levels, timers and storage
- **Stage levels must be worth something.** Gifts alone felt trivial. Storage (below) now hangs off the stage level, so levelling has a goal.
- **Storage is standard from now on.** Every new story sets `EVENT.storage`, with a story conceit for the spaces (Left Luggage: Mr Holub's pigeonholes).
  - Opens at stage 5 with one space, then one more every second stage, up to 10.
  - Stored things are off the board: orders don't see them and nothing reminds you. Remembering is part of it.
  - A plain bot ends Left Luggage at stage 13, so about 5 spaces by the ending.
- **Egg timers are bought, not given.** The player had about 300 spare coins and every card read, because free timers (quest, card, stall, "I'm stuck") meant the shop was never needed.
  - One free timer ever (an early quest step teaches it). The rest are bought, at a price that climbs (35, then ×1.3 each time, up to 250).
  - `CONFIG.sosTimer:false` removes the free timer from "I'm stuck".
  - Bots still all finish. Buyers can now afford about 2 timers instead of 3–4.
- **Open questions:** finished top-of-chain items pile up because you're afraid an order will want them. The hourglass chain (time skips) isn't exciting.
- **A new storage space is a moment, not a toast.** A big card pops up (the space, pips for open and locked spaces, when the next one comes), then the spaces open with the new one glowing.
- **Tea (rare boost) was too generous in Left Luggage:** the board kept giving tea and each one lasted 2/5/12/30/75 taps, so it never ran out and stopped mattering. Left Luggage now uses `focusTaps:[1,3,6,12,25]`, and its "every generator" cards give 3–5 taps instead of 12–20. Bots still finish (about 630–810 taps, a little slower). Start new stories from these numbers.
- **Juice on rewards (v17).** Claimed coins, points and stars fly from the tile into their meter, and the number counts up as each one lands. The stage bar climbs smoothly; on a level-up it fills to the end, flashes, empties and carries on, and the level-up message waits for it. Before this the bar snapped, and a level-up looked like it had gone down.
- **HUD (v18): no chapter progress bar.** The order count and bar gave the chapter away. Event points get their own row instead (level = tiers reached, bar = progress to the next tier), so they no longer read as tied to the stage bar.
- **The pass never ends.** After the last tier, every `passMore.every` points pays `passMore.rw` (default: a level-3 coin every 20), so points stay worth collecting after the story.
