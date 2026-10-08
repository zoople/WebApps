'use strict';
/* Card database. Each entry is a plain object describing the real card's rules:
 *   cost, types, subtypes, power/toughness, kw (keywords), text (rules text for the UI),
 *   targets / resolve (spells), triggers (etb, dies, attacks...), abilities (activated + mana),
 *   static (continuous effects), grants (what an Aura/Equipment gives), tag (hint for AI + Coach).
 * Names match Scryfall's card names exactly, so artwork can be fetched by name.
 * To add a card: call add(...) / creature(...) / spell(...) below. Decks reference cards by name only.
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const { parseCost } = MTG;
const cards = (MTG.cards = {});

function add(name, o) {
  o.name = name; o.cost = o.cost || ''; o.costObj = parseCost(o.cost); o.cmc = o.costObj.cmc;
  o.types = o.types || ['Creature']; o.subtypes = o.subtypes || []; o.kw = o.kw || [];
  o.abilities = o.abilities || []; o.triggers = o.triggers || [];
  if (!o.colors) o.colors = ['W', 'U', 'B', 'R', 'G'].filter((c) => o.costObj[c] > 0);
  o.text = o.text || '';
  cards[name] = o; return o;
}
const creature = (name, cost, sub, p, t, o = {}) => add(name, Object.assign({ cost, types: ['Creature'], subtypes: sub.split(' ').filter(Boolean), power: p, toughness: t }, o));
const spell = (name, cost, type, o) => add(name, Object.assign({ cost, types: [type] }, o));

// ---- target specs ----
const S = {
  anyCreature: { kind: 'creature', label: 'target creature', ai: 'harm' },
  oppCreature: { kind: 'creature', who: 'opp', label: 'target creature an opponent controls', ai: 'harm' },
  myCreature: { kind: 'creature', who: 'you', label: 'target creature you control', ai: 'help' },
  helpCreature: { kind: 'creature', label: 'target creature', ai: 'help' },
  any: { kind: 'any', label: 'any target', ai: 'harm' },
  player: { kind: 'player', label: 'target player', ai: 'harm' },
  oppPlayer: { kind: 'player', who: 'opp', label: 'target opponent', ai: 'harm' },
};
MTG.S = S;
const inCombat = (g, o) => !!(g.combat && g.combat.attackers.some((a) => a.card === o || a.blockers.includes(o)));

const SOLDIER = { name: 'Soldier', colors: ['W'], subtypes: ['Soldier'], power: 1, toughness: 1 };
const GOBLIN = { name: 'Goblin', colors: ['R'], subtypes: ['Goblin'], power: 1, toughness: 1 };
MTG.tokens = { SOLDIER, GOBLIN };

const drawN = (n) => (g, c) => g.drawCards(c.controller, n);
const etb = (text, fn, extra) => Object.assign({ ev: 'etb', self: true, text, do: fn }, extra || {});
const manaAb = (colors) => ({ mana: { colors }, cost: { tap: true }, text: '{T}: Add ' + (colors === 'any' ? 'one mana of any color' : colors.map((c) => '{' + c + '}').join(' or ')) + '.' });
const equipment = (name, cost, grants, equipCost, text, tag) => add(name, {
  cost, types: ['Artifact'], subtypes: ['Equipment'], grants, text: text + ` Equip {${equipCost}}`, tag: tag || 'equipment',
  abilities: [{ sorcery: true, cost: { mana: equipCost }, targets: [S.myCreature], text: `Equip {${equipCost}}`,
    do: (g, c) => { if (c.t[0] && c.t[0].zone === 'battlefield' && c.src.zone === 'battlefield') g.attach(c.src, c.t[0]); } }],
});
const fetchBasic = async (g, c, tapped = true, sub) => {
  const ch = await g.searchLibrary(c.controller, (x) => x.def.basic && (!sub || x.def.subtypes.includes(sub)), { prompt: 'Choose a basic land', source: c.src });
  if (ch[0]) g.enter(ch[0], c.controller, { tapped });
};

/* ================= LANDS ================= */
const BASICS = { Plains: 'W', Island: 'U', Swamp: 'B', Mountain: 'R', Forest: 'G' };
for (const [n, col] of Object.entries(BASICS)) add(n, { types: ['Land'], subtypes: [n], basic: true, colors: [], abilities: [manaAb([col])], text: `{T}: Add {${col}}.` });
const GAIN = { 'Scoured Barrens': 'WB', 'Blossoming Sands': 'GW', 'Dismal Backwater': 'UB', 'Jungle Hollow': 'BG', 'Rugged Highlands': 'RG',
  'Swiftwater Cliffs': 'UR', 'Wind-Scarred Crag': 'RW', 'Thornwood Falls': 'GU', 'Tranquil Cove': 'WU', 'Bloodfell Caves': 'BR' };
for (const [n, cs] of Object.entries(GAIN)) add(n, { types: ['Land'], colors: [], etbTapped: true, abilities: [manaAb(cs.split(''))],
  triggers: [etb('You gain 1 life.', (g, c) => g.gainLife(c.controller, 1))], text: `Enters tapped. When it enters, you gain 1 life. {T}: Add {${cs[0]}} or {${cs[1]}}.`, dual: cs });
add('Evolving Wilds', { types: ['Land'], colors: [], tag: 'fetch', text: '{T}, Sacrifice: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.',
  abilities: [{ cost: { tap: true, sacSelf: true }, text: 'Fetch a basic land.', do: (g, c) => fetchBasic(g, c, true) }] });

/* ================= WHITE ================= */
creature('Savannah Lions', 'W', 'Cat', 2, 1, { tag: 'aggro' });
creature("Healer's Hawk", 'W', 'Bird', 1, 1, { kw: ['flying', 'lifelink'] });
creature('Knight of Grace', '1W', 'Human Knight', 2, 2, { kw: ['first strike', 'hexproofFrom:B'], text: 'First strike, hexproof from black. Gets +1/+0 as long as any player controls a black permanent.',
  dyn: (g, c) => (g.bf.some((x) => x.def.colors.includes('B')) ? [1, 0] : [0, 0]) });
creature("Ajani's Pridemate", '1W', 'Cat Soldier', 2, 2, { text: 'Whenever you gain life, put a +1/+1 counter on Ajani\'s Pridemate.',
  triggers: [{ ev: 'lifegain', mine: true, text: '+1/+1 counter.', do: (g, c) => g.addCounters(c.source, 'p1p1', 1) }] });
creature('Charming Prince', '1W', 'Human Noble', 2, 2, { text: 'When it enters, choose one — Scry 2; or you gain 3 life.',
  triggers: [etb('Scry 2 or gain 3 life.', async (g, c) => { const i = await g.choose(c.controller, 'Charming Prince', ['Scry 2', 'Gain 3 life'], c.source); if (i === 0) await g.scry(c.controller, 2); else g.gainLife(c.controller, 3); })] });
creature('Pegasus Courser', '2W', 'Pegasus', 1, 3, { kw: ['flying'], text: 'Whenever it attacks, another target attacking creature gains flying until end of turn.',
  triggers: [{ ev: 'attacks', self: true, text: 'Another attacker gains flying.', targets: [{ kind: 'creature', who: 'you', optional: true, ai: 'help', label: 'another attacking creature', filter: (g, o, ctx) => o !== ctx.source && inCombat(g, o) }],
    do: (g, c) => g.grantTemp(c.t[0], ['flying']) }] });
creature('Youthful Valkyrie', '2W', 'Angel', 2, 2, { kw: ['flying'], text: 'Whenever another Angel you control enters, put a +1/+1 counter on Youthful Valkyrie.',
  triggers: [{ ev: 'etb', text: '+1/+1 counter.', cond: (g, d, self) => d.card !== self && d.controller === self.controller && d.card.def.subtypes.includes('Angel'), do: (g, c) => g.addCounters(c.source, 'p1p1', 1) }] });
creature('Pillarfield Ox', '3W', 'Ox', 2, 4, {});
creature('Serra Angel', '3WW', 'Angel', 4, 4, { kw: ['flying', 'vigilance'], tag: 'bomb' });
spell('Raise the Alarm', '1W', 'Instant', { text: 'Create two 1/1 white Soldier creature tokens.', tag: 'tokens', resolve: (g, c) => g.createToken(c.controller, SOLDIER, 2) });
spell('Pacifism', '1W', 'Enchantment', { subtypes: ['Aura'], aura: S.anyCreature, grants: { kw: ['cantAttack', 'cantBlock'] }, text: 'Enchant creature. Enchanted creature can\'t attack or block.', tag: 'removal' });
spell('Glorious Anthem', '1WW', 'Enchantment', { text: 'Creatures you control get +1/+1.', tag: 'anthem', static: [{ applies: (g, self, o) => o.controller === self.controller, pt: [1, 1] }] });
spell('Banishing Light', '2W', 'Enchantment', { tag: 'removal', text: 'When it enters, exile target nonland permanent an opponent controls until Banishing Light leaves the battlefield.',
  triggers: [etb('Exile target nonland permanent an opponent controls.', (g, c) => { const t = c.t[0]; if (!t || c.source.zone !== 'battlefield') return; c.source.linked = t; g.exile(t); },
    { targets: [{ kind: 'permanent', who: 'opp', ai: 'harm', label: 'target nonland permanent an opponent controls', filter: (g, o) => !g.isLand(o) }] })],
  onLeave: (g, card) => { const t = card.linked; card.linked = null; if (t && t.zone === 'exile') { g.log(`${t.name} returns to the battlefield.`); g.enter(t, t.owner); } } });
spell('Valorous Stance', '1W', 'Instant', { tag: 'removal', text: 'Choose one — Target creature gains indestructible until end of turn; or destroy target creature with toughness 4 or greater.',
  modes: [
    { text: 'Target creature gains indestructible until end of turn', targets: [S.myCreature], tag: 'protect', resolve: (g, c) => g.grantTemp(c.t[0], ['indestructible']) },
    { text: 'Destroy target creature with toughness 4 or greater', targets: [{ kind: 'creature', ai: 'harm', label: 'creature with toughness 4+', filter: (g, o) => g.toughness(o) >= 4 }], tag: 'removal', resolve: (g, c) => g.destroy(c.t[0]) }] });
spell("Gideon's Reproach", '1W', 'Instant', { tag: 'removal', text: 'Gideon\'s Reproach deals 4 damage to target attacking or blocking creature.',
  targets: [{ kind: 'creature', ai: 'harm', label: 'attacking or blocking creature', filter: (g, o) => inCombat(g, o) }], resolve: (g, c) => g.dealDamage(c.src, c.t[0], 4) });

/* ================= BLUE ================= */
creature('Wind Drake', '2U', 'Drake', 2, 2, { kw: ['flying'] });
creature('Cloudkin Seer', '2U', 'Elemental Bird', 2, 1, { kw: ['flying'], text: 'When it enters, draw a card.', triggers: [etb('Draw a card.', drawN(1))] });
creature('Mulldrifter', '4U', 'Elemental', 2, 2, { kw: ['flying'], text: 'When it enters, draw two cards.', triggers: [etb('Draw two cards.', drawN(2))] });
creature('Air Elemental', '3UU', 'Elemental', 4, 4, { kw: ['flying'] });
creature('Giant Octopus', '3U', 'Octopus', 3, 3, {});
creature('Spectral Sailor', 'U', 'Spirit Pirate', 1, 1, { kw: ['flash', 'flying'], text: 'Flash, flying. {3}{U}: Draw a card.',
  abilities: [{ cost: { mana: '3U' }, text: '{3}{U}: Draw a card.', do: drawN(1), tag: 'draw' }] });
creature('Frost Lynx', '2U', 'Elemental Cat', 2, 2, { text: 'When it enters, tap target creature an opponent controls. That creature doesn\'t untap during its controller\'s next untap step.',
  triggers: [etb('Tap target creature; it doesn\'t untap next turn.', (g, c) => { const t = c.t[0]; if (!t) return; g.tap(t); t.flags.skipUntap = 1; }, { targets: [S.oppCreature] })] });
creature('Prodigal Sorcerer', '2U', 'Human Wizard', 1, 1, { text: '{T}: Prodigal Sorcerer deals 1 damage to any target.', tag: 'pinger',
  abilities: [{ cost: { tap: true }, targets: [S.any], text: '{T}: 1 damage to any target.', do: (g, c) => g.dealDamage(c.src, c.t[0], 1) }] });
creature('Tempest Djinn', 'UU', 'Djinn', 0, 4, { kw: ['flying'], text: 'Flying. Gets +1/+0 for each basic Island you control.', tag: 'bomb',
  dyn: (g, c) => [g.bf.filter((x) => x.controller === c.controller && x.def.basic && x.def.subtypes.includes('Island')).length, 0] });
spell('Opt', 'U', 'Instant', { text: 'Scry 1, then draw a card.', tag: 'cantrip', resolve: async (g, c) => { await g.scry(c.controller, 1); g.drawCards(c.controller, 1); } });
spell('Essence Scatter', '1U', 'Instant', { text: 'Counter target creature spell.', tag: 'counter',
  targets: [{ kind: 'spell', who: 'opp', label: 'creature spell', ai: 'harm', filter: (g, o) => g.isCreature(o) }], resolve: (g, c) => g.counterSpell(c.t[0]) });
spell('Negate', '1U', 'Instant', { text: 'Counter target noncreature spell.', tag: 'counter',
  targets: [{ kind: 'spell', who: 'opp', label: 'noncreature spell', ai: 'harm', filter: (g, o) => !g.isCreature(o) }], resolve: (g, c) => g.counterSpell(c.t[0]) });
spell('Cancel', '1UU', 'Instant', { text: 'Counter target spell.', tag: 'counter',
  targets: [{ kind: 'spell', who: 'opp', label: 'spell', ai: 'harm' }], resolve: (g, c) => g.counterSpell(c.t[0]) });
spell('Unsummon', 'U', 'Instant', { text: 'Return target creature to its owner\'s hand.', tag: 'bounce', targets: [S.anyCreature], resolve: (g, c) => g.bounce(c.t[0]) });
spell('Divination', '2U', 'Sorcery', { text: 'Draw two cards.', tag: 'draw', resolve: drawN(2) });
spell('Tidings', '3UU', 'Sorcery', { text: 'Draw four cards.', tag: 'draw', resolve: drawN(4) });
spell('Sleep', '2UU', 'Sorcery', { text: 'Tap all creatures target player controls. Those creatures don\'t untap during that player\'s next untap step.', tag: 'tempo',
  targets: [S.oppPlayer], resolve: (g, c) => { for (const x of g.creatures(c.t[0].idx)) { g.tap(x); x.flags.skipUntap = 1; } } });

/* ================= BLACK ================= */
creature('Vampire Interloper', '1B', 'Vampire Scout', 2, 1, { kw: ['flying', 'cantBlock'], text: 'Flying. Vampire Interloper can\'t block.', tag: 'aggro' });
creature('Vampire of the Dire Moon', 'B', 'Vampire', 1, 1, { kw: ['deathtouch', 'lifelink'] });
creature('Typhoid Rats', 'B', 'Rat', 1, 1, { kw: ['deathtouch'] });
creature('Walking Corpse', '1B', 'Zombie', 2, 2, {});
creature('Gifted Aetherborn', 'BB', 'Aetherborn Vampire', 2, 3, { kw: ['deathtouch', 'lifelink'] });
creature('Vampire Nighthawk', '1BB', 'Vampire Shaman', 2, 3, { kw: ['flying', 'deathtouch', 'lifelink'], tag: 'bomb' });
creature('Gravedigger', '3B', 'Zombie', 2, 2, { text: 'When it enters, you may return target creature card from your graveyard to your hand.',
  triggers: [etb('Return a creature card from your graveyard to hand.', (g, c) => { if (c.t[0]) g.moveTo(c.t[0], 'hand'); },
    { targets: [{ kind: 'graveyard', who: 'you', optional: true, ai: 'help', label: 'creature card in your graveyard', filter: (g, o) => g.isCreature(o) }] })] });
creature('Reassembling Skeleton', '1B', 'Skeleton Warrior', 1, 1, { text: '{1}{B}: Return Reassembling Skeleton from your graveyard to the battlefield tapped.', tag: 'recursive',
  abilities: [{ zone: 'graveyard', cost: { mana: '1B' }, text: '{1}{B}: Return from graveyard to the battlefield tapped.', do: (g, c) => { if (c.src.zone === 'graveyard') g.enter(c.src, c.controller, { tapped: true }); } }] });
creature('Rotting Regisaur', '2B', 'Zombie Lizard', 7, 6, { text: 'At the beginning of your upkeep, discard a card.', tag: 'bomb',
  triggers: [{ ev: 'upkeep', mine: true, text: 'Discard a card.', do: (g, c) => g.discard(c.controller, 1) }] });
creature('Vampire Sovereign', '3BB', 'Vampire', 3, 3, { kw: ['flying'], text: 'When it enters, target opponent loses 3 life and you gain 3 life.',
  triggers: [etb('Opponent loses 3, you gain 3.', (g, c) => { g.loseLife(1 - c.controller, 3); g.gainLife(c.controller, 3); })] });
spell('Disfigure', 'B', 'Instant', { text: 'Target creature gets -2/-2 until end of turn.', tag: 'removal', targets: [S.anyCreature], resolve: (g, c) => g.pump(c.t[0], -2, -2) });
spell('Moment of Craving', '1B', 'Instant', { text: 'Target creature gets -2/-2 until end of turn. You gain 2 life.', tag: 'removal', targets: [S.anyCreature],
  resolve: (g, c) => { g.pump(c.t[0], -2, -2); g.gainLife(c.controller, 2); } });
spell('Murder', '1BB', 'Instant', { text: 'Destroy target creature.', tag: 'removal', targets: [S.anyCreature], resolve: (g, c) => g.destroy(c.t[0]) });
spell('Doom Blade', '1B', 'Instant', { text: 'Destroy target nonblack creature.', tag: 'removal',
  targets: [{ kind: 'creature', ai: 'harm', label: 'nonblack creature', filter: (g, o) => !g.colorsOf(o).includes('B') }], resolve: (g, c) => g.destroy(c.t[0]) });
spell('Eviscerate', '3B', 'Sorcery', { text: 'Destroy target creature.', tag: 'removal', targets: [S.anyCreature], resolve: (g, c) => g.destroy(c.t[0]) });
spell("Sovereign's Bite", '1B', 'Sorcery', { text: 'Target player loses 3 life and you gain 3 life.', tag: 'drain', targets: [S.oppPlayer],
  resolve: (g, c) => { g.loseLife(c.t[0].idx, 3); g.gainLife(c.controller, 3); } });

/* ================= RED ================= */
creature('Raging Goblin', 'R', 'Goblin Berserker', 1, 1, { kw: ['haste'], tag: 'aggro' });
creature('Mogg Fanatic', 'R', 'Goblin', 1, 1, { text: 'Sacrifice Mogg Fanatic: It deals 1 damage to any target.',
  abilities: [{ cost: { sacSelf: true }, targets: [S.any], text: 'Sacrifice: 1 damage to any target.', do: (g, c) => g.dealDamage(c.src, c.t[0], 1) }] });
creature('Goblin Instigator', '1R', 'Goblin', 1, 1, { text: 'When it enters, create a 1/1 red Goblin creature token.', triggers: [etb('Create a 1/1 Goblin.', (g, c) => g.createToken(c.controller, GOBLIN, 1))] });
creature('Viashino Pyromancer', '1R', 'Viashino Wizard', 2, 1, { text: 'When it enters, it deals 2 damage to target player.',
  triggers: [etb('2 damage to target player.', (g, c) => g.dealDamage(c.source, c.t[0], 2), { targets: [S.oppPlayer] })] });
creature('Goblin Chainwhirler', 'RRR', 'Goblin Warrior', 3, 3, { kw: ['first strike'], text: 'First strike. When it enters, it deals 1 damage to each opponent and each creature they control.', tag: 'sweeper-lite',
  triggers: [etb('1 damage to each opponent and their creatures.', (g, c) => { const o = 1 - c.controller; g.dealDamage(c.source, g.P(o), 1); for (const x of g.creatures(o)) g.dealDamage(c.source, x, 1); })] });
creature('Hill Giant', '3R', 'Giant', 3, 3, {});
creature('Furnace Whelp', '2RR', 'Dragon', 2, 2, { kw: ['flying'], text: 'Flying. {R}: +1/+0 until end of turn.',
  abilities: [{ cost: { mana: 'R' }, text: '{R}: +1/+0 until end of turn.', tag: 'pump', do: (g, c) => g.pump(c.src, 1, 0) }] });
creature('Shivan Dragon', '4RR', 'Dragon', 5, 5, { kw: ['flying'], text: 'Flying. {R}: +1/+0 until end of turn.', tag: 'bomb',
  abilities: [{ cost: { mana: 'R' }, text: '{R}: +1/+0 until end of turn.', tag: 'pump', do: (g, c) => g.pump(c.src, 1, 0) }] });
creature('Siege-Gang Commander', '3RR', 'Goblin', 2, 2, { text: 'When it enters, create three 1/1 red Goblin tokens. {1}{R}, Sacrifice a Goblin: It deals 2 damage to any target.', tag: 'bomb',
  triggers: [etb('Create three 1/1 Goblins.', (g, c) => g.createToken(c.controller, GOBLIN, 3))],
  abilities: [{ cost: { mana: '1R', sacOther: { filter: (g, c) => c.def.subtypes.includes('Goblin') } }, targets: [S.any], text: '{1}{R}, Sacrifice a Goblin: 2 damage to any target.', do: (g, c) => g.dealDamage(c.src, c.t[0], 2) }] });
spell('Shock', 'R', 'Instant', { text: 'Shock deals 2 damage to any target.', tag: 'burn', targets: [S.any], resolve: (g, c) => g.dealDamage(c.src, c.t[0], 2) });
spell('Lightning Strike', '1R', 'Instant', { text: 'Lightning Strike deals 3 damage to any target.', tag: 'burn', targets: [S.any], resolve: (g, c) => g.dealDamage(c.src, c.t[0], 3) });
spell('Fireball', 'XR', 'Sorcery', { text: 'Fireball deals X damage to any target.', tag: 'burn', x: true, targets: [S.any], resolve: (g, c) => g.dealDamage(c.src, c.t[0], c.x) });
spell('Pyroclasm', '1R', 'Sorcery', { text: 'Pyroclasm deals 2 damage to each creature.', tag: 'sweeper',
  resolve: (g, c) => { for (const x of g.creatures()) g.dealDamage(c.src, x, 2); } });
spell('Brute Strength', '1R', 'Instant', { text: 'Target creature gets +3/+1 and gains trample until end of turn.', tag: 'pump', targets: [S.helpCreature],
  resolve: (g, c) => g.pump(c.t[0], 3, 1, ['trample']) });
spell('Act of Treason', '2R', 'Sorcery', { text: 'Gain control of target creature until end of turn. Untap that creature. It gains haste until end of turn.', tag: 'threaten', targets: [S.oppCreature],
  resolve: (g, c) => { const t = c.t[0]; if (!t) return; t.controlTemp = { back: t.controller }; t.controller = c.controller; t.summonedTurn = g.turnNo; t.tapped = false; g.pump(t, 0, 0, ['haste']); g.touch(); } });

/* ================= GREEN ================= */
creature('Llanowar Elves', 'G', 'Elf Druid', 1, 1, { text: '{T}: Add {G}.', abilities: [manaAb(['G'])], tag: 'mana' });
creature('Elvish Mystic', 'G', 'Elf Druid', 1, 1, { text: '{T}: Add {G}.', abilities: [manaAb(['G'])], tag: 'mana' });
creature('Grizzly Bears', '1G', 'Bear', 2, 2, {});
creature("Garruk's Companion", 'GG', 'Beast', 3, 2, { kw: ['trample'] });
creature('Kalonian Tusker', 'GG', 'Beast', 3, 3, {});
creature('Centaur Courser', '2G', 'Centaur Warrior', 3, 3, {});
creature('Giant Spider', '3G', 'Spider', 2, 4, { kw: ['reach'] });
creature('Craw Wurm', '4GG', 'Wurm', 6, 4, {});
creature('Pelakka Wurm', '4GG', 'Wurm', 7, 7, { kw: ['trample'], text: 'Trample. When it enters, you gain 7 life. When it dies, draw a card.', tag: 'bomb',
  triggers: [etb('Gain 7 life.', (g, c) => g.gainLife(c.controller, 7)), { ev: 'dies', self: true, text: 'Draw a card.', do: (g, c) => g.drawCards(c.controller, 1) }] });
creature('Wood Elves', '2G', 'Elf Scout', 1, 1, { text: 'When it enters, search your library for a Forest card, put it onto the battlefield, then shuffle.', tag: 'ramp',
  triggers: [etb('Fetch a Forest onto the battlefield.', (g, c) => fetchBasic(g, c, false, 'Forest'))] });
spell('Giant Growth', 'G', 'Instant', { text: 'Target creature gets +3/+3 until end of turn.', tag: 'pump', targets: [S.helpCreature], resolve: (g, c) => g.pump(c.t[0], 3, 3) });
spell('Blossoming Defense', 'G', 'Instant', { text: 'Target creature gets +2/+2 and gains hexproof until end of turn.', tag: 'pump', targets: [S.helpCreature], resolve: (g, c) => g.pump(c.t[0], 2, 2, ['hexproof']) });
spell('Rampant Growth', '1G', 'Sorcery', { text: 'Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.', tag: 'ramp', resolve: (g, c) => fetchBasic(g, c, true) });
spell('Naturalize', '1G', 'Instant', { text: 'Destroy target artifact or enchantment.', tag: 'removal',
  targets: [{ kind: 'permanent', ai: 'harm', label: 'artifact or enchantment', filter: (g, o) => g.isType(o, 'Artifact') || g.isType(o, 'Enchantment') }], resolve: (g, c) => g.destroy(c.t[0]) });
spell('Plummet', '1G', 'Instant', { text: 'Destroy target creature with flying.', tag: 'removal',
  targets: [{ kind: 'creature', ai: 'harm', label: 'creature with flying', filter: (g, o) => g.has(o, 'flying') }], resolve: (g, c) => g.destroy(c.t[0]) });
spell('Hunt the Weak', '3G', 'Sorcery', { text: 'Put a +1/+1 counter on target creature you control. Then that creature fights target creature you don\'t control.', tag: 'removal',
  targets: [S.myCreature, S.oppCreature], resolve: (g, c) => { const [a, b] = c.t; if (!a) return; g.addCounters(a, 'p1p1', 1); if (b) g.fight(a, b); } });
spell('Overrun', '2GGG', 'Sorcery', { text: 'Creatures you control get +3/+3 and gain trample until end of turn.', tag: 'finisher',
  resolve: (g, c) => { for (const x of g.creatures(c.controller)) g.pump(x, 3, 3, ['trample']); } });
spell('Rancor', 'G', 'Enchantment', { subtypes: ['Aura'], aura: S.helpCreature, grants: { pt: [2, 0], kw: ['trample'] }, tag: 'aura',
  text: 'Enchant creature. Enchanted creature gets +2/+0 and has trample. When Rancor is put into a graveyard from the battlefield, return Rancor to its owner\'s hand.',
  triggers: [{ ev: 'leave', self: true, cond: (g, d) => d.to === 'graveyard', text: 'Return Rancor to hand.', do: (g, c) => { if (c.source.zone === 'graveyard') g.moveTo(c.source, 'hand'); } }] });

/* ================= ARTIFACTS ================= */
equipment('Short Sword', '1', { pt: [1, 1] }, '1', 'Equipped creature gets +1/+1.');
equipment('Bonesplitter', '1', { pt: [2, 0] }, '1', 'Equipped creature gets +2/+0.');
creature('Juggernaut', '4', 'Juggernaut', 5, 3, { types: ['Artifact', 'Creature'], kw: ['attacksEachCombat'], text: 'Juggernaut attacks each combat if able.', colors: [] });
creature('Ornithopter', '0', 'Thopter', 0, 2, { types: ['Artifact', 'Creature'], kw: ['flying'], colors: [] });
spell('Mind Stone', '2', 'Artifact', { text: '{T}: Add {C}. {1}, {T}, Sacrifice: Draw a card.', tag: 'mana', colors: [],
  abilities: [manaAb(['C']), { cost: { mana: '1', tap: true, sacSelf: true }, text: '{1},{T}, Sacrifice: Draw a card.', do: drawN(1), tag: 'draw' }] });
spell("Wayfarer's Bauble", '1', 'Artifact', { text: '{2}, {T}, Sacrifice: Search your library for a basic land card, put it onto the battlefield tapped, then shuffle.', tag: 'ramp', colors: [],
  abilities: [{ cost: { mana: '2', tap: true, sacSelf: true }, text: 'Fetch a basic land (tapped).', do: (g, c) => fetchBasic(g, c, true) }] });

// Generic helper for the engine: a choice among strings.
MTG.Game.prototype.choose = function (pi, prompt, options, source) {
  return this.ctrl(pi).chooseOption(this, this.players[pi], { prompt, options, source });
};
MTG.cardNames = () => Object.keys(cards);
})();

/* ---- rules metadata used by the AI + Coach (what a spell does, in machine-readable form) ---- */
(function () {
  const C = MTG.cards;
  const FX = {
    'Shock': { kind: 'damage', n: 2 }, 'Lightning Strike': { kind: 'damage', n: 3 }, 'Fireball': { kind: 'damage', n: 'x' },
    "Gideon's Reproach": { kind: 'damage', n: 4, combatOnly: true },
    'Disfigure': { kind: 'shrink', n: 2 }, 'Moment of Craving': { kind: 'shrink', n: 2 },
    'Murder': { kind: 'destroy' }, 'Doom Blade': { kind: 'destroy' }, 'Eviscerate': { kind: 'destroy' }, 'Plummet': { kind: 'destroy' },
    'Pacifism': { kind: 'pacify' }, 'Banishing Light': { kind: 'exile' }, 'Unsummon': { kind: 'bounce' }, 'Hunt the Weak': { kind: 'fight' },
    'Giant Growth': { kind: 'pump', p: 3, t: 3 }, 'Blossoming Defense': { kind: 'pump', p: 2, t: 2, protect: true }, 'Brute Strength': { kind: 'pump', p: 3, t: 1 },
    'Cancel': { kind: 'counter' }, 'Essence Scatter': { kind: 'counter', creatureOnly: true }, 'Negate': { kind: 'counter', noncreature: true },
    'Naturalize': { kind: 'naturalize' },
  };
  for (const [n, f] of Object.entries(FX)) if (C[n]) C[n].fx = f;
  C['Valorous Stance'].modes[0].fx = { kind: 'protect' };
  C['Valorous Stance'].modes[1].fx = { kind: 'destroy' };
  C['Valorous Stance'].fx = { kind: 'modal' };
})();
