'use strict';
/* Decks: Jumpstart-style theme packs (20 cards; pick two to make a 40-card deck) and ready-made starter decks.
 * Decks are plain data — lists of [cardName, quantity] — so a deck builder can create/save more later.
 * Custom decks are stored in localStorage under "magicduel.decks" (see Decks.saveCustom).
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});

const pack = (id, name, color, blurb, plan, spells, lands) => ({ id, name, color, blurb, plan, list: spells, lands: lands || [[{ W: 'Plains', U: 'Island', B: 'Swamp', R: 'Mountain', G: 'Forest' }[color], 8]] });

const PACKS = [
  pack('w-soldiers', 'Soldiers', 'W', 'Cheap attackers, tokens and an Anthem.', 'Go wide: flood the board with small creatures, then pump them all with Glorious Anthem.',
    [['Savannah Lions', 2], ['Healer\'s Hawk', 1], ['Knight of Grace', 1], ["Ajani's Pridemate", 1], ['Charming Prince', 1], ['Raise the Alarm', 1], ['Pacifism', 1], ['Glorious Anthem', 1], ['Pillarfield Ox', 1], ['Serra Angel', 1], ["Gideon's Reproach", 1]]),
  pack('w-angels', 'Angels & Fliers', 'W', 'Evasive creatures and clean answers.', 'Win in the air: block on the ground, remove their best threat, attack with flyers.',
    [['Healer\'s Hawk', 2], ['Pegasus Courser', 1], ['Youthful Valkyrie', 2], ['Serra Angel', 1], ['Banishing Light', 1], ['Valorous Stance', 1], ['Raise the Alarm', 1], ['Pacifism', 1], ['Charming Prince', 1], ["Gideon's Reproach", 1]]),
  pack('u-wizards', 'Wizards', 'U', 'Counterspells, card draw and a pinger.', 'Control: hold up counterspells, draw extra cards, and win late with the Djinn.',
    [['Opt', 2], ['Essence Scatter', 1], ['Cancel', 1], ['Negate', 1], ['Prodigal Sorcerer', 1], ['Divination', 1], ['Frost Lynx', 1], ['Unsummon', 1], ['Mulldrifter', 1], ['Giant Octopus', 1], ['Tempest Djinn', 1]]),
  pack('u-skies', 'Skies', 'U', 'A flock of flyers with tempo tricks.', 'Tempo: land evasive threats early and use Sleep or bounce to race through the sky.',
    [['Wind Drake', 2], ['Cloudkin Seer', 2], ['Spectral Sailor', 2], ['Air Elemental', 1], ['Sleep', 1], ['Tidings', 1], ['Frost Lynx', 1], ['Unsummon', 1], ['Essence Scatter', 1]]),
  pack('b-vampires', 'Vampires', 'B', 'Lifelink, flying and cheap removal.', 'Midrange aggro: trade removal for their blockers while lifelinkers swing the race.',
    [['Vampire Interloper', 2], ['Vampire of the Dire Moon', 1], ['Gifted Aetherborn', 1], ['Vampire Nighthawk', 1], ['Vampire Sovereign', 1], ["Sovereign's Bite", 1], ['Doom Blade', 1], ['Moment of Craving', 1], ['Disfigure', 1], ['Murder', 1], ['Walking Corpse', 1]]),
  pack('b-graveyard', 'Graveyard', 'B', 'Deathtouch, recursion and removal.', 'Grind: trade one-for-one, recur Skeletons and Gravediggers, and let Rotting Regisaur finish.',
    [['Typhoid Rats', 2], ['Walking Corpse', 1], ['Reassembling Skeleton', 2], ['Gravedigger', 2], ['Rotting Regisaur', 1], ['Eviscerate', 1], ['Murder', 1], ['Doom Blade', 1], ['Disfigure', 1]]),
  pack('r-goblins', 'Goblins', 'R', 'Swarm tokens, burn and a Commander.', 'Aggro: curve out, burn blockers, and finish with Siege-Gang Commander.',
    [['Raging Goblin', 2], ['Mogg Fanatic', 1], ['Goblin Instigator', 2], ['Goblin Chainwhirler', 1], ['Siege-Gang Commander', 1], ['Shock', 2], ['Lightning Strike', 1], ['Brute Strength', 1], ['Viashino Pyromancer', 1]]),
  pack('r-dragons', 'Dragons & Fire', 'R', 'Big flyers and plenty of burn.', 'Burn control: kill everything early, land a Dragon, and aim the rest at their face.',
    [['Viashino Pyromancer', 1], ['Furnace Whelp', 2], ['Shivan Dragon', 1], ['Hill Giant', 2], ['Fireball', 1], ['Pyroclasm', 1], ['Act of Treason', 1], ['Lightning Strike', 2], ['Shock', 1]]),
  pack('g-elves', 'Elves', 'G', 'Mana creatures that ramp into huge threats.', 'Ramp: accelerate with mana elves, then slam big creatures a turn or two early.',
    [['Llanowar Elves', 2], ['Elvish Mystic', 2], ['Wood Elves', 1], ['Rampant Growth', 1], ["Garruk's Companion", 1], ['Kalonian Tusker', 1], ['Giant Growth', 1], ['Rancor', 1], ['Overrun', 1], ['Craw Wurm', 1]]),
  pack('g-beasts', 'Beasts', 'G', 'Big efficient bodies and fight spells.', 'Midrange: out-size the opponent every turn; use Hunt the Weak to remove their best creature.',
    [['Grizzly Bears', 2], ['Centaur Courser', 2], ['Giant Spider', 1], ['Craw Wurm', 1], ['Pelakka Wurm', 1], ['Hunt the Weak', 1], ['Plummet', 1], ['Blossoming Defense', 1], ['Kalonian Tusker', 1], ['Giant Growth', 1]]),
];

const starter = (id, name, blurb, plan, list) => ({ id, name, blurb, plan, list, kind: 'starter' });
const STARTERS = [
  starter('s-rw', 'Crimson Vanguard', 'Red/White aggro. Cheap attackers, burn and an Anthem.', 'Beatdown: apply pressure every turn from turn 1 and finish with burn.',
    [['Mountain', 7], ['Plains', 6], ['Wind-Scarred Crag', 2], ['Evolving Wilds', 1],
     ['Savannah Lions', 2], ['Raging Goblin', 2], ["Healer's Hawk", 1], ['Knight of Grace', 2], ['Goblin Instigator', 1], ['Viashino Pyromancer', 1], ['Pegasus Courser', 1], ['Charming Prince', 1],
     ['Hill Giant', 1], ['Serra Angel', 1], ['Shivan Dragon', 1], ['Shock', 2], ['Lightning Strike', 2], ['Raise the Alarm', 1], ['Glorious Anthem', 1], ['Bonesplitter', 1], ['Short Sword', 1], ["Gideon's Reproach", 1], ['Brute Strength', 1]]),
  starter('s-ub', 'Deep Hex', 'Blue/Black control. Counterspells, removal and card advantage.', 'Control: answer threats, draw cards, win with flyers and Vampire Sovereign.',
    [['Island', 7], ['Swamp', 7], ['Dismal Backwater', 2],
     ['Opt', 2], ['Essence Scatter', 1], ['Cancel', 1], ['Wind Drake', 2], ['Cloudkin Seer', 2], ['Typhoid Rats', 2], ['Vampire Nighthawk', 1], ['Gravedigger', 1], ['Mulldrifter', 1], ['Air Elemental', 1],
     ['Doom Blade', 2], ['Murder', 1], ['Eviscerate', 1], ['Moment of Craving', 1], ['Divination', 1], ['Vampire Sovereign', 1], ['Prodigal Sorcerer', 1], ['Frost Lynx', 1], ['Mind Stone', 1]]),
  starter('s-gr', 'Verdant Fury', 'Green/Red stompy. Big creatures backed by burn.', 'Midrange: ramp a little, out-size the opponent, burn away their blockers.',
    [['Forest', 8], ['Mountain', 6], ['Rugged Highlands', 2],
     ['Llanowar Elves', 2], ['Elvish Mystic', 1], ["Garruk's Companion", 2], ['Kalonian Tusker', 2], ['Centaur Courser', 2], ['Giant Spider', 1], ['Wood Elves', 1], ['Craw Wurm', 1], ['Pelakka Wurm', 1], ['Furnace Whelp', 1],
     ['Grizzly Bears', 1], ['Hunt the Weak', 1], ['Rancor', 1], ['Giant Growth', 1], ['Shock', 2], ['Lightning Strike', 2], ['Fireball', 1], ['Juggernaut', 1]]),
  starter('s-wb', 'Blood & Light', 'White/Black lifelink. Gain life, trade up and win the long game.', 'Midrange: stabilise with lifelink and removal, then win with Angels and Vampires.',
    [['Plains', 7], ['Swamp', 7], ['Scoured Barrens', 2],
     ["Healer's Hawk", 2], ["Ajani's Pridemate", 2], ['Vampire of the Dire Moon', 2], ['Gifted Aetherborn', 1], ['Knight of Grace', 1], ['Charming Prince', 1], ['Youthful Valkyrie', 1], ['Vampire Nighthawk', 1], ['Serra Angel', 1],
     ['Vampire Sovereign', 1], ['Pacifism', 1], ['Doom Blade', 2], ['Murder', 1], ['Moment of Craving', 1], ["Sovereign's Bite", 1], ['Banishing Light', 1], ['Short Sword', 1], ['Valorous Stance', 1], ['Gravedigger', 1], ['Glorious Anthem', 1]]),
];

const expand = (list) => { const out = []; for (const [n, q] of list) for (let i = 0; i < q; i++) out.push(n); return out; };
const colorsOf = (names) => { const s = new Set(); for (const n of names) { const d = MTG.cards[n]; if (d) d.colors.forEach((c) => s.add(c)); } return ['W', 'U', 'B', 'R', 'G'].filter((c) => s.has(c)); };

const Decks = {
  packs: PACKS, starters: STARTERS, expand, colorsOf,
  fromPacks(a, b) {
    const list = [...a.list, ...a.lands, ...b.list, ...b.lands];
    return { id: 'js-' + a.id + '+' + b.id, kind: 'jumpstart', name: a.name + ' + ' + b.name, blurb: a.blurb + ' ' + b.blurb, plan: a.plan + ' Plus: ' + b.plan, list: Decks.merge(list) };
  },
  merge(list) { const m = new Map(); for (const [n, q] of list) m.set(n, (m.get(n) || 0) + q); return [...m.entries()]; },
  names(deck) { return expand(deck.list); },
  size(deck) { return deck.list.reduce((a, [, q]) => a + q, 0); },
  validate(deck) {
    const errs = [];
    for (const [n] of deck.list) if (!MTG.cards[n]) errs.push('Unknown card ' + n);
    if (Decks.size(deck) < 40) errs.push('Deck has fewer than 40 cards');
    return errs;
  },
  // ----- custom decks (deck-builder hook) -----
  loadCustom() { try { return JSON.parse(localStorage.getItem('magicduel.decks') || '[]'); } catch (e) { return []; } },
  saveCustom(deck) {
    try { const all = Decks.loadCustom().filter((d) => d.id !== deck.id); all.push(Object.assign({ kind: 'custom' }, deck)); localStorage.setItem('magicduel.decks', JSON.stringify(all)); } catch (e) { /* storage unavailable */ }
  },
  all() { return [...STARTERS, ...Decks.loadCustom()]; },
  randomJumpstart(rng) { const r = rng || Math.random; return Decks.fromPacks(PACKS[Math.floor(r() * PACKS.length)], PACKS[Math.floor(r() * PACKS.length)]); },
};
MTG.Decks = Decks;
})();
