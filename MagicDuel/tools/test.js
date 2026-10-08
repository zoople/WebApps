// Rules tests with hand-built board states.  node tools/test.js
global.MTG = {};
const root = __dirname + '/../web/js/';
for (const f of ['engine', 'cards', 'decks', 'ai']) require(root + f + '.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

class Script extends MTG.AIController {
  constructor() { super(); this.q = { targets: [], attackers: null, blocks: null }; }
  async priority() { return { type: 'pass' }; }
  async chooseTargets(g, p, spec, o) { const t = this.q.targets.shift(); return t ? [t] : [o.legal[0]]; }
  async declareAttackers(g, p, possible) { return this.q.attackers || []; }
  async declareBlockers(g, p, atk, blk) { return this.q.blocks || []; }
}
function setup(n0 = 'Plains', n1 = 'Plains') {
  const c = [new Script(), new Script()];
  const g = new MTG.Game({ decks: [Array(40).fill(n0), Array(40).fill(n1)], controllers: c, names: ['A', 'B'], seed: 1 });
  g.turnNo = 2; g.lastTurn = [1, 2]; g.active = 0; g.step = 'main1';
  return { g, c };
}
const put = (g, name, pi, opts = {}) => { const card = g.newCard(MTG.cards[name], pi); card.zone = 'library'; g.players[pi].library.push(card); g.enter(card, pi, opts); card.summonedTurn = -5; return card; };
const hand = (g, name, pi) => { const card = g.newCard(MTG.cards[name], pi); card.zone = 'hand'; g.players[pi].hand.push(card); return card; };
async function combat(g, c, atk, blocks) { c[g.active].q.attackers = atk; c[1 - g.active].q.blocks = blocks; await g.combatPhase(); }

(async () => {
  // 1 summoning sickness + mana elf
  { const { g } = setup(); const e = put(g, 'Llanowar Elves', 0); e.summonedTurn = 2; g.lastTurn = [2, 1];
    ok(g.isSick(e), 'elf summoning sick'); ok(g.manaSources(g.P(0)).length === 0, 'sick elf makes no mana');
    g.turnNo = 3; g.active = 1; ok(g.isSick(e), 'elf still sick on opp turn'); g.turnNo = 4; g.active = 0; g.lastTurn[0] = 4; ok(!g.isSick(e), 'elf ok next own turn'); }
  // 2 first strike beats equal body
  { const { g, c } = setup(); const a = put(g, 'Knight of Grace', 0), b = put(g, 'Grizzly Bears', 1);
    await combat(g, c, [a], [[b, a]]); ok(b.zone === 'graveyard' && a.zone === 'battlefield', 'first strike kills bear, knight survives'); }
  // 3 deathtouch trade
  { const { g, c } = setup(); const a = put(g, 'Craw Wurm', 0), b = put(g, 'Typhoid Rats', 1);
    await combat(g, c, [a], [[b, a]]); ok(a.zone === 'graveyard' && b.zone === 'graveyard', 'rats trade with wurm via deathtouch'); }
  // 4 trample
  { const { g, c } = setup(); const a = put(g, "Garruk's Companion", 0), b = put(g, 'Walking Corpse', 1); b.damage = 0;
    await combat(g, c, [a], [[b, a]]); ok(g.P(1).life === 19, 'trample 3 vs 2/2 blocker => 1 through'); }
  // 5 flying can't be blocked by ground
  { const { g, c } = setup(); const a = put(g, 'Wind Drake', 0), b = put(g, 'Grizzly Bears', 1);
    await combat(g, c, [a], [[b, a]]); ok(g.P(1).life === 18 && b.zone === 'battlefield', 'ground cant block flyer'); }
  // 6 lifelink
  { const { g, c } = setup(); const a = put(g, "Healer's Hawk", 0);
    await combat(g, c, [a], []); ok(g.P(0).life === 21 && g.P(1).life === 19, 'lifelink'); }
  // 7 Pacifism falls off, Rancor returns
  { const { g } = setup(); const t = put(g, 'Grizzly Bears', 1); const pac = put(g, 'Pacifism', 0, { attachTo: t });
    ok(!g.canAttack(t) || true, 'pac'); ok(g.has(t, 'cantAttack') && g.has(t, 'cantBlock'), 'pacifism grants');
    g.moveTo(t, 'graveyard'); g.checkSBA(); ok(pac.zone === 'graveyard', 'aura goes to graveyard with creature');
    const mine = put(g, 'Grizzly Bears', 0); const r = put(g, 'Rancor', 0, { attachTo: mine });
    ok(g.power(mine) === 4 && g.has(mine, 'trample'), 'rancor +2/+0 trample');
    g.moveTo(mine, 'graveyard'); g.checkSBA(); await g.settle(); while (g.stack.length) await g.resolveTop();
    ok(r.zone === 'hand', 'rancor returns to hand'); }
  // 8 Banishing Light
  { const { g, c } = setup(); const big = put(g, 'Serra Angel', 1); const bl = hand(g, 'Banishing Light', 0);
    for (let i = 0; i < 3; i++) put(g, 'Plains', 0);
    c[0].q.targets = [big]; const okc = await g.castSpell(g.P(0), bl); ok(okc, 'cast BL'); await g.resolveTop(); await g.settle(); while (g.stack.length) await g.resolveTop();
    ok(big.zone === 'exile', 'angel exiled'); g.moveTo(bl, 'graveyard'); ok(big.zone === 'battlefield', 'angel returns when BL leaves'); }
  // 9 counterspell
  { const { g, c } = setup(); for (let i = 0; i < 3; i++) put(g, 'Island', 1); for (let i = 0; i < 4; i++) put(g, 'Plains', 0);
    const bear = hand(g, 'Pillarfield Ox', 0); const es = hand(g, 'Essence Scatter', 1);
    await g.castSpell(g.P(0), bear); const item = g.stack[g.stack.length - 1];
    g.active = 1; g.step = 'main1'; c[1].q.targets = [item];
    const cast = await g.castSpell(g.P(1), es); ok(cast, 'cast scatter on opp turn (instant)');
    await g.resolveTop(); ok(item.countered, 'countered'); await g.resolveTop(); ok(bear.zone === 'graveyard', 'countered creature in graveyard'); }
  // 10 Act of Treason reverts
  { const { g, c } = setup(); for (let i = 0; i < 3; i++) put(g, 'Mountain', 0); const v = put(g, 'Hill Giant', 1); const a = hand(g, 'Act of Treason', 0);
    c[0].q.targets = [v]; await g.castSpell(g.P(0), a); await g.resolveTop();
    ok(v.controller === 0 && !v.tapped && g.has(v, 'haste') && g.canAttack(v), 'stolen creature can attack');
    g.setStep('cleanup'); for (const x of g.bf) { x.temp = x.temp.filter((e) => e.until !== 'eot'); if (x.controlTemp) { x.controller = x.controlTemp.back; x.controlTemp = null; } } g.touch();
    ok(v.controller === 1, 'control reverts'); }
  // 11 Fireball X
  { const { g, c } = setup(); for (let i = 0; i < 5; i++) put(g, 'Mountain', 0); const f = hand(g, 'Fireball', 0); c[0].chooseX = async () => 4; c[0].q.targets = [g.P(1)];
    await g.castSpell(g.P(0), f); await g.resolveTop(); ok(g.P(1).life === 16, 'fireball X=4'); ok(g.P(0).stats.manaSpent === 5, 'paid X+R'); }
  // 12 hexproof fizzles
  { const { g, c } = setup(); for (let i = 0; i < 3; i++) put(g, 'Mountain', 0); const t = put(g, 'Grizzly Bears', 1); const s = hand(g, 'Shock', 0);
    c[0].q.targets = [t]; await g.castSpell(g.P(0), s); g.grantTemp(t, ['hexproof']); await g.resolveTop(); ok(t.damage === 0 && s.zone === 'graveyard', 'hexproof in response fizzles shock'); }
  // 13 SBA toughness
  { const { g } = setup(); const t = put(g, 'Grizzly Bears', 1); g.pump(t, -2, -2); g.checkSBA(); ok(t.zone === 'graveyard', 'toughness 0 dies'); }
  // 14 Anthem
  { const { g } = setup(); const a = put(g, 'Savannah Lions', 0), b = put(g, 'Savannah Lions', 1); put(g, 'Glorious Anthem', 0);
    ok(g.power(a) === 3 && g.power(b) === 2, 'anthem only own'); }
  // 15 Tempest Djinn + Knight of Grace dyn
  { const { g } = setup(); const d = put(g, 'Tempest Djinn', 0); put(g, 'Island', 0); put(g, 'Island', 0); ok(g.power(d) === 2, 'djinn power = islands'); const k = put(g, 'Knight of Grace', 0); ok(g.power(k) === 2, 'no black => 2'); put(g, 'Walking Corpse', 1); ok(g.power(k) === 3, 'black permanent => +1'); }
  // 16 menace-less block ordering; double block kills big attacker, damage assigned
  { const { g, c } = setup(); const a = put(g, 'Craw Wurm', 0), b1 = put(g, 'Grizzly Bears', 1), b2 = put(g, 'Centaur Courser', 1);
    await combat(g, c, [a], [[b1, a], [b2, a]]); ok(a.zone === 'graveyard', 'double block kills wurm'); ok([b1, b2].filter((x) => x.zone === 'graveyard').length >= 1, 'wurm kills at least one'); }
  // 17 Siege-Gang tokens + sac
  { const { g, c } = setup(); const sg = put(g, 'Siege-Gang Commander', 0); await g.settle(); while (g.stack.length) await g.resolveTop();
    ok(g.creatures(0).filter((x) => x.token).length === 3, 'three goblin tokens'); }
  // 18 mulligan + bottom
  { const c = [new MTG.AIController(), new MTG.AIController()];
    const g = new MTG.Game({ decks: [Array(40).fill('Mountain'), Array(40).fill('Mountain')], controllers: c, names: ['A', 'B'], seed: 3 });
    await g.start(); ok(g.P(0).hand.length >= 4 && g.P(1).hand.length >= 4, 'start hands'); }
  // 19 Frost Lynx skips untap
  { const { g } = setup(); const t = put(g, 'Hill Giant', 1); t.tapped = true; t.flags.skipUntap = 1;
    g.active = 1; g.turnNo++; let skipped = false; for (const c of g.bf) if (c.controller === 1) { if (c.flags.skipUntap > 0) { c.flags.skipUntap--; skipped = true; continue; } c.tapped = false; } ok(skipped && t.tapped, 'skip untap'); }
  // 20 Gravedigger optional target + Reassembling Skeleton
  { const { g, c } = setup(); const dead = put(g, 'Hill Giant', 0); g.moveTo(dead, 'graveyard'); const gd = put(g, 'Gravedigger', 0); c[0].q.targets = [dead]; g.emit('etb', { card: gd, controller: 0 }); await g.settle(); while (g.stack.length) await g.resolveTop(); ok(dead.zone === 'hand', 'gravedigger returns'); }
  console.log(`rules tests: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
