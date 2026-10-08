'use strict';
/* Brain: evaluation + planning shared by the computer opponent AND the strategy Coach.
 * Every planning function returns its decision together with a human-readable reason,
 * so the Coach can explain "what and why" using exactly the logic the AI plays with.
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const Brain = (MTG.Brain = {});

const BONUS = { 'Prodigal Sorcerer': 3, 'Siege-Gang Commander': 4, 'Mulldrifter': 2.5, 'Cloudkin Seer': 1.5, 'Gravedigger': 1.5, 'Spectral Sailor': 1, 'Frost Lynx': 1, 'Vampire Sovereign': 3,
  'Goblin Chainwhirler': 1.5, 'Pelakka Wurm': 3, 'Wood Elves': 1.2, 'Charming Prince': 0.8, 'Goblin Instigator': 1.2, 'Viashino Pyromancer': 1, 'Reassembling Skeleton': 1.2, 'Rotting Regisaur': -2.5,
  'Llanowar Elves': 0.8, 'Elvish Mystic': 0.8, 'Shivan Dragon': 2.5, 'Furnace Whelp': 1.5, 'Mogg Fanatic': 0.8, 'Pegasus Courser': 1, 'Youthful Valkyrie': 1, "Ajani's Pridemate": 0.8, 'Juggernaut': -0.5,
  'Knight of Grace': 0.5, 'Glorious Anthem': 0 };
const maxBy = (arr, f) => { let b = null, bv = -Infinity; for (const x of arr) { const v = f(x); if (v > bv) { bv = v; b = x; } } return b; };
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const kwList = (g, c) => [...g.chars(c).kw].filter((k) => !/^(hexproofFrom|protection|cantBlock|cantAttack|attacksEachCombat)/.test(k) || true);

/* ---------- valuation ---------- */
Brain.cv = function (g, c) {
  const d = c.def, ch = g.chars(c), k = ch.kw;
  if (k.has('cantAttack') && k.has('cantBlock')) return 1;
  let p = Math.max(0, ch.power), t = Math.max(0, ch.toughness);
  if (d.dyn && c.zone !== 'battlefield') { const r = d.dyn(g, c); p += r[0]; t += r[1]; }
  let v = 1 + 1.25 * p + 1.05 * t;
  if (k.has('flying')) v += 0.9 * p + 0.5;
  if (k.has('first strike')) v += 0.4 * p + 0.4;
  if (k.has('double strike')) v += 1.4 * p;
  if (k.has('deathtouch')) v += 1.4;
  if (k.has('lifelink')) v += 0.5 * p + 0.4;
  if (k.has('trample')) v += 0.2 * p;
  if (k.has('vigilance')) v += 0.4;
  if (k.has('haste')) v += 0.3;
  if (k.has('reach')) v += 0.3;
  if (k.has('menace')) v += 0.3 * p;
  if (k.has('hexproof')) v += 0.8;
  if (k.has('indestructible')) v += 2;
  if (k.has('cantBlock')) v -= 1.2;
  if (k.has('cantAttack')) v -= 1.25 * p * 0.9;
  if (k.has('attacksEachCombat')) v -= 0.8;
  if (k.has('defender')) v -= 1.5;
  v += BONUS[d.name] || 0;
  return Math.max(1, v);
};
const permValue = (g, t) => {
  if (g.isCreature(t)) return Brain.cv(g, t) + 0.4 * t.attachments.length;
  if (t.def.static) return 3 + 1.5 * g.creatures(t.controller).length;
  if (t.def.aura && t.attachedTo) return Brain.cv(g, t.attachedTo) * 0.6 + 1;
  if (t.def.subtypes.includes('Equipment')) return 2.5;
  return 2;
};
Brain.permValue = permValue;
Brain.boardValue = (g, pi) => sum(g.creatures(pi), (c) => Brain.cv(g, c));
const fsOf = (g, c) => g.has(c, 'first strike') || g.has(c, 'double strike');
const lethalTo = (g, a, b) => {
  const pw = g.power(a); if (pw <= 0) return false;
  if (g.has(b, 'indestructible')) return false;
  for (const col of g.colorsOf(a)) if (g.has(b, 'protection:' + col)) return false;
  if (g.has(a, 'deathtouch')) return true;
  return pw >= g.toughness(b) - b.damage;
};
Brain.duel = (g, a, b) => {
  let aK = lethalTo(g, a, b), bK = lethalTo(g, b, a);
  if (fsOf(g, a) && !fsOf(g, b) && aK) bK = false; else if (fsOf(g, b) && !fsOf(g, a) && bK) aK = false;
  return { aKillsB: aK, bKillsA: bK };
};
const withMod = (g, c, pt, kws, fn) => {
  if (!c) return fn();
  const e = { pt, kw: kws || [], until: 'sim' }; c.temp.push(e); g.touch();
  try { return fn(); } finally { c.temp.splice(c.temp.indexOf(e), 1); g.touch(); }
};
Brain.minDamage = function (g, attackers, blockers) {
  const sorted = attackers.slice().sort((a, b) => g.power(b) - g.power(a));
  const flex = (b) => attackers.filter((a) => g.canBlock(b, a)).length;
  const used = new Set(); let dmg = 0;
  for (const a of sorted) {
    const need = g.has(a, 'menace') ? 2 : 1;
    const elig = blockers.filter((b) => !used.has(b) && g.canBlock(b, a)).sort((x, y) => flex(x) - flex(y));
    let pw = g.power(a);
    if (elig.length >= need) {
      const bl = elig.slice(0, need); bl.forEach((b) => used.add(b));
      pw = g.has(a, 'trample') ? Math.max(0, pw - sum(bl, (b) => Math.max(0, g.toughness(b) - b.damage))) : 0;
    }
    dmg += pw;
  }
  return dmg;
};
Brain.burnReach = function (g, p) {
  const opp = g.players[1 - p.idx]; let total = 0;
  const burn = p.hand.filter((c) => c.def.fx && c.def.fx.kind === 'damage' && !c.def.fx.combatOnly && (g.hasFlash(c) || g.sorceryTiming(p.idx)));
  const costSum = { generic: 0, W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, x: 0 };
  const add = (co, s) => { for (const k of Object.keys(costSum)) costSum[k] += (co[k] || 0) * s; };
  for (const c of burn.sort((a, b) => (b.def.fx.n === 'x' ? 0 : b.def.fx.n) - (a.def.fx.n === 'x' ? 0 : a.def.fx.n))) {
    if (c.def.fx.n === 'x') continue;
    add(c.def.costObj, 1);
    if (g.canPay(p, costSum)) total += c.def.fx.n; else add(c.def.costObj, -1);
  }
  for (const c of burn) if (c.def.fx.n === 'x') { // spend what's left on X
    let x = 0; while (x < 20) { const t = Object.assign({}, costSum); t.generic = costSum.generic + x + 1; for (const k of ['R']) t[k] = costSum[k] + 1; if (g.canPay(p, t)) x++; else break; }
    total += x; break;
  }
  void opp; return total;
};
Brain.availableMana = (g, p) => g.availableMana(p);

/* ---------- lands ---------- */
Brain.colorNeeds = function (g, p) {
  const have = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const l of g.lands(p.idx)) for (const k of (l.def.abilities.find((a) => a.mana) || { mana: { colors: [] } }).mana.colors) if (have[k] != null) have[k]++;
  const need = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const c of p.hand) { const co = c.def.costObj; if (!co || g.isLand(c)) continue; for (const k of MTG.COLORS) if (co[k]) need[k] = Math.max(need[k], co[k]); }
  return { have, need };
};
Brain.landChoice = function (g, p) {
  const lands = p.hand.filter((c) => g.isLand(c));
  if (!lands.length || p.landDrops <= 0) return null;
  const { have, need } = Brain.colorNeeds(g, p);
  const nLands = g.lands(p.idx).length;
  const spells = p.hand.filter((c) => !g.isLand(c));
  const wantsUntapped = spells.some((c) => c.def.cmc === nLands + 1 || (c.def.cmc <= nLands + 1 && c.def.cmc > nLands - 1)) && spells.length > 0;
  let best = null, bs = -Infinity;
  for (const l of lands) {
    const cols = l.def.dual ? l.def.dual.split('') : (l.def.basic ? [l.def.abilities[0].mana.colors[0]] : []);
    let s = 0; const why = [];
    for (const k of cols) {
      const deficit = Math.max(0, (need[k] || 0) - have[k]);
      if (deficit > 0) { s += 3 * deficit; why.push(`you need ${MTG.COLOR_NAMES[k].toLowerCase()} mana for ${spells.filter((c) => c.def.costObj[k]).map((c) => c.name).slice(0, 2).join(' / ')} and don't have enough ${MTG.COLOR_NAMES[k].toLowerCase()} sources yet`); }
      else if (have[k] === 0) s += 1;
    }
    if (cols.length === 0 && l.def.name === 'Evolving Wilds') { s += 2; why.push('it fixes your colors'); }
    if (l.def.etbTapped || l.def.name === 'Evolving Wilds') {
      s -= wantsUntapped ? 3.5 : 0.4;
      if (!wantsUntapped) why.push('entering tapped costs you nothing this turn');
    } else if (wantsUntapped) { s += 1.5; why.push('it enters untapped so you can use the mana right away'); }
    if (cols.length > 1) s += 0.8;
    if (!(l.def.etbTapped || l.def.name === 'Evolving Wilds')) {
      const haveCols = new Set(); for (const x of g.lands(p.idx)) for (const k of (x.def.abilities.find((a) => a.mana) || { mana: { colors: [] } }).mana.colors) haveCols.add(k);
      for (const k of cols) haveCols.add(k);
      const enabled = spells.filter((c) => !c.def.fx || c.def.fx.kind !== 'counter').filter((c) => c.def.cmc <= nLands + 1 && c.def.cmc >= 1 && MTG.COLORS.every((k) => !c.def.costObj[k] || haveCols.has(k)));
      const before = spells.filter((c) => c.def.cmc <= nLands && MTG.COLORS.every((k) => !c.def.costObj[k] || (have[k] > 0)));
      const gain = enabled.filter((c) => !before.includes(c));
      const best = gain.sort((a, b) => b.def.cmc - a.def.cmc)[0];
      if (best) { s += g.isCreature(best) ? 2.5 : 1.2; why.unshift(`it lets you cast ${best.name} this turn`); }
    }
    s += (4 - Math.min(4, cols.reduce((a, k) => a + have[k], 0))) * 0.05;
    if (s > bs) { bs = s; best = { card: l, why }; }
  }
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const reason = best.why.length ? cap(best.why[0]) + '.' : 'Always make your land drop — hitting every land drop is the foundation of the game.';
  return { card: best.card, reason, principle: 'mana' };
};

/* ---------- targeting helpers ---------- */
const dmgOf = (fx, x) => (fx.n === 'x' ? x : fx.n);
function kills(g, t, fx, x) {
  switch (fx.kind) {
    case 'damage': return dmgOf(fx, x) >= g.toughness(t) - t.damage && !g.has(t, 'indestructible');
    case 'shrink': return fx.n >= g.toughness(t) - t.damage;
    case 'destroy': return !g.has(t, 'indestructible');
    case 'pacify': case 'exile': case 'bounce': return true;
    default: return false;
  }
}
Brain.kills = kills;
function bestKill(g, p, card, spec, fx, x) {
  const legal = g.legalTargets(spec, { controller: p.idx, source: card });
  let best = null, bv = -1;
  for (const t of legal) {
    if (t.isPlayer || t.kind === 'spell' || t.controller === p.idx) continue;
    if (!kills(g, t, fx, x)) continue;
    const v = permValue(g, t); if (v > bv) { bv = v; best = t; }
  }
  return best ? { t: best, v: bv } : null;
}
Brain.removalThreshold = function (g, p) {
  const oppPow = sum(g.creatures(1 - p.idx), (c) => g.power(c));
  let th = 4.0; if (p.life <= 10) th = 3.2; if (oppPow >= p.life * 0.5) th = 2.4;
  return th;
};
const describe = (g, c) => { const ch = g.chars(c); return `${c.name} (${ch.power}/${ch.toughness})`; };
const kwNice = (g, c) => [...g.chars(c).kw].filter((k) => !/:/.test(k) && k !== 'cantBlock' && k !== 'cantAttack' && k !== 'attacksEachCombat').join(', ');

/* ---------- danger: can they kill me (or nearly) next turn? ---------- */
Brain.danger = function (g, p) {
  const me = p.idx;
  const atk = g.creatures(1 - me).filter((c) => !g.has(c, 'defender') && !g.has(c, 'cantAttack'));
  const mine = g.creatures(me).filter((c) => !c.tapped);
  const dmg = Brain.minDamage(g, atk, mine);
  const burn = 0;   // we do not assume hidden burn
  return { dmg, life: p.life, lethal: dmg + burn >= p.life, near: dmg >= p.life - 3 && dmg > 0 };
};
// A castable instant worth keeping mana open for while in danger
Brain.reserveCard = function (g, p, exclude) {
  const cands = p.hand.filter((c) => !exclude.includes(c) && g.hasFlash(c) && !g.isLand(c) && c.def.fx && ['damage', 'destroy', 'shrink', 'pump', 'protect'].includes(c.def.fx.kind) || (c.def.name === 'Raise the Alarm' && !exclude.includes(c)) || (c.def.name === 'Valorous Stance' && !exclude.includes(c)));
  return cands.sort((a, b) => a.def.cmc - b.def.cmc)[0] || null;
};

/* ---------- option evaluation (what could I do right now, and how good is it?) ---------- */
function mkOpt(kind, ref, extra) { return Object.assign({ kind, score: 0, pre: false, order: 6, reason: '', principle: 'development', intent: { targets: [] }, cost: null }, ref, extra); }
function costWith(co, x) { return Object.assign({}, co, { generic: co.generic + (x || 0), x: 0 }); }
function evalCast(g, p, card) {
  const d = card.def, me = p.idx, opp = g.players[1 - me];
  const myCs = g.creatures(me), oppCs = g.creatures(1 - me);
  const o = mkOpt('cast', { card }); o.cost = costWith(d.costObj, 0);
  const nLands = g.lands(me).length;
  const th = Brain.removalThreshold(g, p);
  if (g.isCreature(card)) {
    const v = Brain.cv(g, card);
    o.score = v; o.order = 6;
    const ch = g.chars(card);
    o.reason = `Cast ${card.name}${d.cmc ? ` for ${d.cmc} mana` : ''} — it adds a ${ch.power || (d.dyn ? '*' : 0)}/${ch.toughness} body` + (kwNice(g, card) ? ` with ${kwNice(g, card)}` : '') + ' to your board.';
    if (d.tag === 'mana') { o.principle = 'ramp'; o.reason = `Cast ${card.name}: it will produce extra mana from next turn, letting you cast bigger spells ahead of schedule.`; o.order = 1; o.pre = true; o.score = v + 1.5; }
    else if (g.has(card, 'haste')) { o.pre = true; o.reason += ' Haste lets it attack right away.'; o.score += 0.5; }
    else if (d.triggers.some((t) => t.ev === 'etb' && t.self)) o.reason += ' Its enters-the-battlefield effect gives immediate value.';
    if (d.triggers.some((t) => t.ev === 'etb' && t.self && t.targets && t.targets.length && !t.targets[0].optional) && !g.legalTargets(d.triggers[0].targets[0], { controller: me, source: card }).length) o.score *= 0.8;
    if (card.def.name === 'Rotting Regisaur' && p.hand.length <= 2) o.score -= 2;
    return o;
  }
  const fx = d.fx || {};
  const tag = d.tag;
  // ---- modal ----
  if (d.modes) {
    let best = null;
    d.modes.forEach((m, i) => {
      if (m.fx && m.fx.kind === 'destroy') {
        const bk = bestKill(g, p, card, m.targets[0], m.fx, 0);
        if (bk && bk.v >= th) {
          const s = bk.v * 1.1 - d.cmc * 0.3;
          if (!best || s > best.score) { best = mkOpt('cast', { card }, { score: s, order: 2, pre: true, principle: 'removal', cost: o.cost, intent: { targets: [bk.t], mode: i }, reason: `Destroy ${describe(g, bk.t)} with ${card.name} — its biggest creature is the one that matters most, and this answers it for just ${d.cmc} mana.` }); }
        }
      }
    });
    return best;
  }
  // ---- removal / burn ----
  if (fx.kind === 'damage' || fx.kind === 'shrink' || fx.kind === 'destroy' || fx.kind === 'pacify' || fx.kind === 'exile') {
    if (fx.combatOnly) return null;
    const spec = d.aura || (d.targets && d.targets[0]) || (d.triggers[0] && d.triggers[0].targets && d.triggers[0].targets[0]);
    let x = 0, best = null;
    if (d.x) { const mx = g.maxX(p, d.costObj); if (mx < 1) return null; x = mx; }
    if (spec) best = bestKill(g, p, card, spec, fx, x);
    // face damage / lethal
    if (fx.kind === 'damage') {
      const dmg = dmgOf(fx, x);
      if (dmg >= opp.life) { o.score = 100; o.pre = true; o.order = 0; o.intent = { targets: [opp], x }; o.cost = costWith(d.costObj, x); o.principle = 'lethal'; o.reason = `${card.name} deals ${dmg} — that's exactly lethal (${opp.name} is at ${opp.life}). Take the win.`; return o; }
    }
    const premium = (fx.kind === 'destroy' || fx.kind === 'pacify' || fx.kind === 'exile') && !Brain.danger(g, p).near ? 1.8 : 0;
    if (best && best.v >= th + premium) {
      let xx = x;
      if (d.x) { xx = Math.max(1, g.toughness(best.t) - best.t.damage); xx = Math.min(xx, x); }
      o.intent = { targets: [best.t], x: xx }; o.cost = costWith(d.costObj, xx);
      o.score = best.v * 1.1 - d.cmc * 0.3 - (d.x ? xx * 0.25 : 0); o.pre = true; o.order = 2; o.principle = 'removal';
      const mana = d.cmc + xx;
      const tc = best.t.def.cmc;
      const eco = tc > mana ? ` It costs you ${mana} mana to answer a ${tc}-mana card — a tempo win.` : tc === mana ? ` It's an even trade of mana, but it's a clean one-for-one that removes their best body.` : ` Their creature is cheap, but it is the most dangerous thing they have right now.`;
      o.reason = `${fx.kind === 'pacify' ? 'Neutralise' : fx.kind === 'exile' ? 'Exile' : 'Kill'} ${describe(g, best.t)} with ${card.name}.${eco} Removing blockers/threats first also makes your attacks safer.`;
      return o;
    }
    if (fx.kind === 'damage' && d.targets && d.targets[0].kind === 'any') {
      const dmg = dmgOf(fx, x);
      if (opp.life <= dmg * 3 + (myCs.length ? 2 : 0) && !d.x) {
        o.score = dmg * 0.9 + 0.5; o.intent = { targets: [opp] }; o.pre = false; o.order = 8; o.principle = 'reach';
        o.reason = `${opp.name} is low (${opp.life}). Burn to the face with ${card.name} gets them into lethal range.`; return o;
      }
    }
    return null;
  }
  if (fx.kind === 'fight') {
    const mine = maxBy(myCs, (c) => Brain.cv(g, c)); if (!mine) return null;
    let best = null;
    for (const t of oppCs) {
      if (!g.legalTargets(d.targets[1], { controller: me, source: card }).includes(t)) continue;
      const p2 = g.power(mine) + 1, t2 = g.toughness(mine) + 1 - mine.damage;
      if (p2 >= g.toughness(t) - t.damage && g.power(t) < t2) { const v = permValue(g, t); if (!best || v > best.v) best = { t, v }; }
    }
    if (!best || best.v < th) return null;
    o.intent = { targets: [mine, best.t] }; o.score = best.v * 1.05 - d.cmc * 0.3 + 1; o.pre = true; o.order = 2; o.principle = 'removal';
    o.reason = `Hunt the Weak: your ${describe(g, mine)} gets a +1/+1 counter and fights ${describe(g, best.t)}. It kills the creature and survives, leaving you with a permanently bigger body — a 2-for-1 swing.`;
    return o;
  }
  if (fx.kind === 'naturalize') {
    const legal = g.legalTargets(d.targets[0], { controller: me, source: card }).filter((t) => t.controller !== me || false);
    const best = maxBy(legal.filter((t) => t.controller !== me), (t) => permValue(g, t));
    if (!best || permValue(g, best) < 3.5) return null;
    o.intent = { targets: [best] }; o.score = permValue(g, best) * 0.9; o.order = 3; o.principle = 'removal';
    o.reason = `Destroy ${best.name}: it's giving them a lasting advantage and this answers it cleanly.`; return o;
  }
  // ---- Banishing Light (trigger-targeted enchantment) ----
  if (fx.kind === 'exile') return null;
  if (fx.kind === 'counter' || fx.kind === 'bounce' || fx.kind === 'pump' || fx.kind === 'protect') return null;
  // ---- card draw / ramp / other ----
  const hand = p.hand.length;
  if (tag === 'draw' || tag === 'cantrip') {
    const n = d.name === 'Tidings' ? 4 : d.name === 'Opt' ? 1 : 2;
    o.score = (tag === 'cantrip' ? 1.6 : 2.0 * Math.pow(n, 0.75) + 0.4) * (hand >= 6 ? 0.6 : 1);
    if (!p.hand.some((c) => g.isLand(c)) && p.landDrops > 0) { o.pre = true; o.score += 1; }
    o.order = 7; o.principle = 'card-advantage';
    o.reason = `${card.name}: ${tag === 'cantrip' ? 'replaces itself and smooths your draws' : `draw ${n} cards`}. Spending spare mana on card advantage means you won't run out of gas.`;
    return o;
  }
  if (tag === 'ramp' && d.name === 'Rampant Growth') {
    const expensive = p.hand.some((c) => c.def.cmc >= nLands + 2);
    o.score = expensive && nLands <= 4 ? 4.5 : 1.2; o.pre = true; o.order = 1; o.principle = 'ramp';
    o.reason = `Rampant Growth: fetch a land tapped now so next turn you have an extra mana — you have expensive spells in hand that you can cast sooner.`; return o;
  }
  if (tag === 'ramp' && d.types.includes('Artifact')) { o.score = nLands <= 4 && p.hand.some((c) => c.def.cmc >= nLands + 1) ? 3.2 : 1; o.order = 1; o.principle = 'ramp'; o.reason = `${card.name} fixes your mana development.`; return o; }
  if (tag === 'mana') { o.score = nLands <= 5 ? 3.5 : 1.8; o.pre = true; o.order = 1; o.principle = 'ramp'; o.reason = `${card.name} gives you an extra mana every turn (and enables a bigger play next turn).`; return o; }
  if (tag === 'anthem') {
    o.score = myCs.length >= 2 ? 1.6 * myCs.length + 1 : 0.5; o.pre = true; o.order = 3;
    o.reason = `Glorious Anthem makes each of your ${myCs.length} creatures +1/+1 — it gets better with every body on the board.`; return o;
  }
  if (tag === 'equipment') { o.score = myCs.length ? 3 : 1.6; o.order = 4; o.reason = `${card.name} is cheap now and makes every creature you own more dangerous later.`; return o; }
  if (tag === 'aura' && d.aura) {
    const legal = g.legalTargets(d.aura, { controller: me, source: card }).filter((t) => t.controller === me);
    const best = maxBy(legal, (c) => Brain.cv(g, c) + (g.has(c, 'flying') ? 2 : 0));
    if (!best) return null;
    o.intent = { targets: [best] }; o.score = 3 + 0.5 * g.chars(best).power; o.pre = true; o.order = 3;
    o.reason = `Rancor on ${best.name}: +2 power and trample. If the creature dies, Rancor returns to your hand, so it costs you no card.`; return o;
  }
  if (tag === 'tokens') { o.score = 2.3; o.order = 7; o.reason = `Two 1/1 bodies for ${d.cmc} mana — cheap chump blockers and attackers. (Tip: Instant-speed token makers are even better during the opponent's turn.)`; return o; }
  if (tag === 'drain') {
    o.intent = { targets: [opp] }; o.score = opp.life <= 3 ? 100 : 2.6; o.order = 5; o.principle = 'reach';
    o.reason = `${card.name} drains 3: a point of life for you and a point against them in the race.`; return o;
  }
  if (tag === 'sweeper') {
    const dies = (c) => g.toughness(c) - c.damage <= 2 && !g.has(c, 'indestructible');
    const gain = sum(oppCs.filter(dies), (c) => Brain.cv(g, c)) - sum(myCs.filter(dies), (c) => Brain.cv(g, c));
    if (gain < 3.5) return null;
    o.score = gain * 0.9; o.pre = true; o.order = 2; o.principle = 'removal';
    o.reason = `Pyroclasm kills ${oppCs.filter(dies).length} of their creatures while only costing you ${myCs.filter(dies).length}. A sweeper is best when you're behind on board or they've over-extended with small creatures.`; return o;
  }
  if (d.name === 'Sleep') {
    const atk = myCs.filter((c) => g.canAttack(c));
    const dmg = sum(atk, (c) => g.power(c));
    const blk = oppCs.filter((c) => !c.tapped);
    if (!blk.length) return null;
    if (dmg >= opp.life) { o.score = 100; o.pre = true; o.order = 0; o.principle = 'lethal'; o.intent = { targets: [opp] }; o.reason = `Sleep taps all their blockers — your ${dmg} damage is lethal (they're at ${opp.life}).`; return o; }
    if (dmg < 5) return null;
    o.score = Math.min(8, dmg * 0.9) - 0.5; o.pre = true; o.order = 2; o.intent = { targets: [opp] }; o.principle = 'tempo';
    o.reason = `Sleep taps their whole team: your ${atk.length} attackers get through for ${dmg}, and their creatures stay tapped through their next turn, so they can't attack back either.`; return o;
  }
  if (d.name === 'Act of Treason') {
    const atkMine = myCs.filter((c) => g.canAttack(c));
    const spec = d.targets[0]; const legal = g.legalTargets(spec, { controller: me, source: card });
    const best = maxBy(legal, (c) => g.power(c)); if (!best) return null;
    const blockers = oppCs.filter((c) => c !== best && !c.tapped);
    const dmg = Brain.minDamage(g, [...atkMine, best], blockers);
    if (dmg >= opp.life) { o.score = 100; o.pre = true; o.order = 0; o.intent = { targets: [best] }; o.principle = 'lethal'; o.reason = `Steal ${best.name} and swing: ${dmg} damage gets through and that's lethal.`; return o; }
    return null;
  }
  if (d.name === 'Overrun') {
    const atk = myCs.filter((c) => g.canAttack(c));
    const blockers = oppCs.filter((c) => !c.tapped);
    let dmg = 0;
    for (const c of atk) c.temp.push({ pt: [3, 3], kw: ['trample'], until: 'sim' });
    g.touch(); dmg = Brain.minDamage(g, atk, blockers);
    for (const c of atk) c.temp = c.temp.filter((e) => e.until !== 'sim'); g.touch();
    if (dmg >= opp.life) { o.score = 100; o.pre = true; o.order = 0; o.principle = 'lethal'; o.reason = `Overrun gives your ${atk.length} attackers +3/+3 and trample — ${dmg} damage gets through, which is lethal.`; return o; }
    if (atk.length >= 4 && dmg >= opp.life * 0.6) { o.score = 6; o.pre = true; o.order = 2; o.reason = `Overrun turns your wide board into a huge attack: ${dmg} trample damage.`; return o; }
    return null;
  }
  return null;
}
function evalAbility(g, p, perm, idx) {
  const ab = perm.def.abilities[idx], d = perm.def, me = p.idx, opp = g.players[1 - me];
  const o = mkOpt('activate', { perm, idx }); const cost = ab.cost || {};
  o.cost = cost.mana ? parseC(cost.mana) : { generic: 0, W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, x: 0 };
  const oppCs = g.creatures(1 - me);
  if (d.subtypes.includes('Equipment')) {
    const mine = g.creatures(me).filter((c) => c.attachments.indexOf(perm) < 0);
    if (perm.attachedTo && perm.attachedTo.controller === me && mine.length < 1) return null;
    const gr = d.grants || {};
    const pick = maxBy(mine, (c) => Brain.cv(g, c) + (g.has(c, 'flying') && gr.pt && gr.pt[0] ? 2 : 0) + (g.canAttack(c) ? 1 : 0));
    if (!pick) return null;
    if (perm.attachedTo === pick) return null;
    const gain = (gr.pt ? gr.pt[0] * 1.25 + gr.pt[1] * 1.05 : 0) + (gr.kw ? 1 : 0);
    if (perm.attachedTo && perm.attachedTo.controller === me && Brain.cv(g, perm.attachedTo) >= Brain.cv(g, pick) - 1) return null;
    o.intent = { targets: [pick] }; o.score = 1 + gain * 1.1; o.pre = true; o.order = 3; o.principle = 'development';
    o.reason = `Equip ${perm.name} to ${pick.name}: ${gain.toFixed(0) === '0' ? 'a small boost' : 'a permanent bonus'} for just ${ab.cost.mana} mana. Equipment makes every creature a bigger threat.`;
    return o;
  }
  if (d.name === 'Prodigal Sorcerer' || d.name === 'Mogg Fanatic' || d.name === 'Siege-Gang Commander') {
    const dmg = d.name === 'Siege-Gang Commander' ? 2 : 1;
    const spec = ab.targets[0]; const legal = g.legalTargets(spec, { controller: me, source: perm });
    if (opp.life <= dmg && legal.includes(opp)) { o.score = 100; o.pre = true; o.order = 0; o.intent = { targets: [opp] }; o.principle = 'lethal'; o.reason = `${perm.name} deals the last ${dmg} damage.`; return o; }
    const kill = maxBy(legal.filter((t) => !t.isPlayer && t.controller !== me && g.toughness(t) - t.damage <= dmg), (t) => Brain.cv(g, t));
    if (kill && Brain.cv(g, kill) >= (d.name === 'Mogg Fanatic' ? 4 : 3)) {
      if (d.name === 'Siege-Gang Commander' && !g.bf.some((c) => c.controller === me && c.def.subtypes.includes('Goblin') && c !== perm)) return null;
      o.intent = { targets: [kill] }; o.score = Brain.cv(g, kill) * 0.9 - (cost.sacOther || cost.sacSelf ? 1.5 : 0); o.pre = true; o.order = 2; o.principle = 'removal';
      o.reason = `Use ${perm.name} to finish off ${describe(g, kill)} (it only has ${g.toughness(kill) - kill.damage} toughness left).`; return o;
    }
    if (d.name === 'Prodigal Sorcerer' && (g.step === 'main2' || g.step === 'end')) { o.intent = { targets: [opp] }; o.score = 0.7; o.order = 9; o.reason = 'Ping the opponent with Prodigal Sorcerer — free damage while the Sorcerer would otherwise sit untapped.'; return o; }
    return null;
  }
  if (d.name === 'Reassembling Skeleton') { o.score = 1.8; o.order = 8; o.reason = 'Bring Reassembling Skeleton back — a recurring chump blocker/attacker costs only mana.'; o.principle = 'mana-efficiency'; return o; }
  if (d.name === 'Mind Stone') { if (g.lands(me).length < 5) return null; o.score = 1.6; o.order = 8; o.principle = 'card-advantage'; o.reason = 'You have plenty of mana: cycle Mind Stone into a fresh card.'; return o; }
  if (d.name === "Wayfarer's Bauble") { if (g.lands(me).length > 4) return null; o.score = 2.2; o.order = 1; o.principle = 'ramp'; o.reason = 'Use Wayfarer\'s Bauble to fetch a land and keep hitting land drops.'; return o; }
  if (d.name === 'Spectral Sailor') { o.score = 1.5; o.order = 8; o.principle = 'card-advantage'; o.reason = 'You have spare mana — pay 3U to draw a card.'; return o; }
  if (d.tag === 'fetch') { o.score = 1.0; o.order = 9; o.reason = 'Crack Evolving Wilds for a basic land to smooth your mana.'; return o; }
  return null;
}
const parseC = (s) => MTG.parseCost(s);

Brain.options = function (g, p) {
  const opts = [];
  const danger = Brain.danger(g, p);
  for (const card of p.hand) {
    if (g.isLand(card)) continue;
    if (!g.canCast(p, card).ok) continue;
    const o = evalCast(g, p, card);
    if (o && o.score > 0) { if (g.isCreature(card) && danger.near && !g.has(card, 'cantBlock')) { o.score += 2.5; o.reason += ' You are under pressure, so you need blockers.'; } opts.push(o); }
  }
  const pool = [...g.bf.filter((c) => c.controller === p.idx), ...p.graveyard];
  for (const perm of pool) {
    const abs = perm.def.abilities; if (!abs.length) continue;
    for (let i = 0; i < abs.length; i++) {
      if (abs[i].mana) continue;
      if (!g.abilityUsable(p, perm, i).ok) continue;
      const o = evalAbility(g, p, perm, i); if (o && o.score > 0) opts.push(o);
    }
  }
  return opts;
};
function sumCost(list) {
  const t = { generic: 0, W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, x: 0 };
  for (const c of list) for (const k of Object.keys(t)) t[k] += c[k] || 0;
  return t;
}
Brain.bestSubset = function (g, p, opts, reserve) {
  const cand = opts.filter((o) => o.score >= 0.9).sort((a, b) => b.score - a.score).slice(0, 8);
  let best = { score: 0, set: [] };
  const rec = (i, set, score) => {
    if (score > best.score) best = { score, set: set.slice() };
    for (let j = i; j < cand.length; j++) {
      const o = cand[j];
      const c = sumCost([...set.map((s) => s.cost), o.cost, ...(reserve ? [reserve.def.costObj] : [])]);
      if (!g.canPay(p, c)) continue;
      // same card can't be used twice
      if (set.some((s) => s.card && s.card === o.card)) continue;
      // don't stack two removal effects on the same target
      if (o.intent.targets[0] && set.some((s) => s.intent.targets[0] === o.intent.targets[0] && s.principle === 'removal' && o.principle === 'removal')) continue;
      set.push(o); rec(j + 1, set, score + o.score); set.pop();
    }
  };
  rec(0, [], 0);
  return best;
};
Brain.planMain = function (g, p) {
  const steps = [];
  const land = Brain.landChoice(g, p);
  if (land) steps.push({ kind: 'land', card: land.card, reason: land.reason, principle: land.principle, pre: true, order: -1 });
  // Plan as if the land drop has already happened (it may unlock spells), then undo the simulation.
  let undo = null;
  if (land) {
    const c = land.card, idx = p.hand.indexOf(c), st = { zone: c.zone, tapped: c.tapped, summoned: c.summonedTurn, controller: c.controller };
    p.hand.splice(idx, 1); c.zone = 'battlefield'; c.controller = p.idx; c.tapped = !!c.def.etbTapped || c.def.name === 'Evolving Wilds'; c.summonedTurn = g.turnNo; g.bf.push(c); g.touch();
    undo = () => { const j = g.bf.indexOf(c); if (j >= 0) g.bf.splice(j, 1); c.zone = st.zone; c.tapped = st.tapped; c.summonedTurn = st.summoned; c.controller = st.controller; p.hand.splice(idx, 0, c); g.touch(); };
  }
  try {
  const opts = Brain.options(g, p);
  const danger = Brain.danger(g, p);
  let reserve = null;
  if (danger.near) {
    const r = Brain.reserveCard(g, p, []);
    // only worth holding if it is not itself the best proactive play (e.g. lethal burn)
    if (r && !opts.some((o) => o.card === r && o.score >= 50)) reserve = r;
  }
  let best = Brain.bestSubset(g, p, opts, reserve);
  if (reserve && !best.set.length && !opts.length) reserve = null;
  if (reserve) { if (g.step === 'main1' || true) { /* keep mana for the instant */ } }
  const set = best.set.slice().sort((a, b) => a.order - b.order || b.score - a.score);
  const post = g.step === 'main1';
  const holdNotes = [];
  const counter = p.hand.find((c) => c.def.fx && c.def.fx.kind === 'counter');
  if (counter) holdNotes.push(`You hold ${counter.name}: consider leaving ${counter.def.cmc} mana untapped on their turn so you can counter their best spell.`);
  const castable = opts.filter((o) => !set.includes(o)).sort((a, b) => b.score - a.score);
  void post;
  if (reserve) holdNotes.unshift(`Danger: they can deal about ${danger.dmg} next turn and you're at ${p.life}. Holding ${reserve.name} mana open is better than tapping out.`);
  return { steps: [...steps, ...set], land, opts, castable, notes: holdNotes, set, danger, reserve };
  } finally { if (undo) undo(); }
};
// Next action for the *current* main phase. Returns an option/step or null (= nothing left to do / move to combat).
Brain.nextMainAction = function (g, p) {
  const plan = Brain.planMain(g, p);
  const inMain1 = g.step === 'main1';
  for (const s of plan.steps) {
    if (s.kind === 'land') return s;
    if (inMain1 && !s.pre) continue;
    return s;
  }
  return null;
};

/* ---------- combat: attacking ---------- */
function evalAttacker(g, p, a, blockers) {
  const me = p.idx;
  const able = blockers.filter((b) => g.canBlock(b, a));
  const va = Brain.cv(g, a);
  if (!able.length) return { card: a, verdict: 'evasive', value: va, reason: `${a.name} can't be blocked right now${g.has(a, 'flying') ? ' (they have no flyers/reach)' : ''}, so it's free damage.` };
  let eaten = null, trade = null;
  for (const b of able) {
    const r = Brain.duel(g, a, b);
    if (r.bKillsA && !r.aKillsB) { if (!eaten || Brain.cv(g, b) > Brain.cv(g, eaten)) eaten = b; }
    else if (r.bKillsA && r.aKillsB) { if (!trade || Brain.cv(g, b) < Brain.cv(g, trade)) trade = b; }
  }
  if (eaten) return { card: a, verdict: 'bad', value: va, blocker: eaten, reason: `${a.name} would run into ${describe(g, eaten)}, which can block and kill it without dying.` };
  if (trade) return { card: a, verdict: 'trade', value: va, blocker: trade, reason: `${describe(g, trade)} could block and trade with ${a.name}.` };
  return { card: a, verdict: 'safe', value: va, reason: `No creature of theirs can block ${a.name} profitably — if they block, they lose the creature and you keep yours.` };
}
Brain.attackPlan = function (g, p, possible) {
  const me = p.idx, opp = g.players[1 - me];
  const blockers = g.creatures(1 - me).filter((b) => !b.tapped && !g.has(b, 'cantBlock'));
  const res = { attackers: [], stay: [], notes: [], lethal: false };
  if (!possible.length) return res;
  const minD = Brain.minDamage(g, possible, blockers);
  const reach = Brain.burnReach(g, p);
  // lifelink blockers gain life at the same moment combat damage is dealt, so they can save the opponent from "exact" lethal
  const llGain = sum(blockers.filter((b) => g.has(b, 'lifelink')), (b) => Math.max(0, g.power(b)));
  const effLife = opp.life + llGain;
  if (minD >= effLife) {
    res.lethal = true; res.notes.push('LETHAL');
    res.attackers = possible.map((c) => ({ card: c, reason: `Lethal: even with ${opp.name}'s best blocks, ${minD} damage gets through and they're at ${opp.life}.` }));
    return res;
  }
  if (minD + reach >= effLife && reach > 0) {
    res.lethal = true; res.notes.push('LETHAL with burn');
    res.attackers = possible.map((c) => ({ card: c, reason: `Attack with everything: ${minD} combat damage + ${reach} burn from your hand is lethal (${opp.name} is at ${opp.life}).` }));
    return res;
  }
  const evals = possible.map((a) => evalAttacker(g, p, a, blockers));
  const myBoard = Brain.boardValue(g, me), theirBoard = Brain.boardValue(g, 1 - me);
  const ahead = myBoard >= theirBoard * 0.95 || p.life >= opp.life + 5;
  let chosen = [];
  for (const e of evals) {
    if (e.verdict === 'evasive' || e.verdict === 'safe') chosen.push(e);
    else if (e.verdict === 'trade') {
      const bv = Brain.cv(g, e.blocker);
      if (e.value <= bv * 0.9) { e.reason += ' You are happy with that trade: your creature is worth less than theirs.'; chosen.push(e); }
      else if (ahead && e.value <= bv * 1.3 && blockers.length <= possible.length) { e.reason += ' You are ahead on board, so an even trade favours you and speeds up the race.'; chosen.push(e); }
      else res.stay.push({ card: e.card, reason: e.reason + ` Trading ${e.card.name} (worth about ${e.value.toFixed(0)}) for a less valuable creature (${bv.toFixed(0)}) is a bad deal.` });
    } else res.stay.push({ card: e.card, reason: e.reason + ' Keep it home.' });
  }
  // utility creatures that matter more at home
  chosen = chosen.filter((e) => {
    if (e.card.def.tag === 'mana' || (e.card.def.abilities.some((ab) => ab.mana) && g.lands(me).length < 4 && e.value < 4)) { res.stay.push({ card: e.card, reason: `${e.card.name} is worth more producing mana than attacking.` }); return false; }
    return true;
  });
  // defence check: can I survive the crack-back?
  const oppAtk = g.creatures(1 - me).filter((c) => !g.has(c, 'defender') && !g.has(c, 'cantAttack'));
  const evalHome = (att) => {
    const home = g.creatures(me).filter((c) => !att.some((e) => e.card === c) || g.has(c, 'vigilance'));
    return Brain.minDamage(g, oppAtk, home);
  };
  let guard = 0;
  while (chosen.length && guard++ < 10) {
    const dmg = evalHome(chosen);
    if (dmg < p.life - (ahead ? 0 : 2)) break;
    chosen.sort((x, y) => x.value - y.value);
    const drop = chosen.shift();
    res.stay.push({ card: drop.card, reason: `${drop.card.name} stays home as a blocker: if it attacked, ${opp.name}'s counter-attack would deal about ${dmg} and you're at ${p.life}.` });
    res.notes.push('Held back blockers to stay safe.');
  }
  res.attackers = chosen.map((e) => ({ card: e.card, reason: e.reason }));
  if (!res.attackers.length && possible.length) res.notes.push('No attack is profitable this turn.');
  return res;
};

/* ---------- combat: blocking ---------- */
Brain.blockPlan = function (g, p, attackers, blockers) {
  const me = p.idx;
  const res = { blocks: [], notes: [] };
  const used = new Set();
  const order = attackers.slice().sort((a, b) => g.power(b) - g.power(a));
  const unblockedDamage = () => sum(attackers.filter((a) => !res.blocks.some((b) => b.attacker === a)), (a) => g.power(a)) + sum(res.blocks.filter((b) => g.has(b.attacker, 'trample')), (b) => Math.max(0, g.power(b.attacker) - Math.max(0, g.toughness(b.blocker) - b.blocker.damage)));
  const addBlock = (b, a, reason) => { used.add(b); res.blocks.push({ blocker: b, attacker: a, reason }); };
  const total = sum(attackers, (a) => g.power(a));
  const danger = total >= p.life;
  // pass 1: profitable blocks
  for (const a of order) {
    if (g.has(a, 'menace')) continue;
    const opts = blockers.filter((b) => !used.has(b) && g.canBlock(b, a));
    if (!opts.length) continue;
    const info = opts.map((b) => ({ b, r: Brain.duel(g, a, b), v: Brain.cv(g, b) }));
    const free = info.filter((i) => i.r.bKillsA && !i.r.aKillsB).sort((x, y) => x.v - y.v)[0];
    if (free) { addBlock(free.b, a, `Block ${a.name} with ${free.b.name}: it kills the attacker and survives — a free kill.`); continue; }
    const wall = info.filter((i) => !i.r.aKillsB && !i.r.bKillsA).sort((x, y) => x.v - y.v)[0];
    if (wall && !g.has(a, 'trample')) { addBlock(wall.b, a, `Block ${a.name} with ${wall.b.name}: neither dies, but you prevent ${g.power(a)} damage for free.`); continue; }
    const tr = info.filter((i) => i.r.bKillsA && i.r.aKillsB).sort((x, y) => x.v - y.v)[0];
    if (tr && (Brain.cv(g, a) >= tr.v - 0.3 || danger || p.life <= 8)) { addBlock(tr.b, a, `Trade ${tr.b.name} for ${a.name}: their creature is worth ${Brain.cv(g, a) >= tr.v ? 'more' : 'about the same'}, and trading keeps your life total healthy.`); continue; }
  }
  // double blocks on big attackers
  for (const a of order) {
    if (res.blocks.some((b) => b.attacker === a)) continue;
    const opts = blockers.filter((b) => !used.has(b) && g.canBlock(b, a));
    if (opts.length < (g.has(a, 'menace') ? 2 : 2)) continue;
    let bestPair = null;
    for (let i = 0; i < opts.length; i++) for (let j = i + 1; j < opts.length; j++) {
      const b1 = opts[i], b2 = opts[j];
      const dmg = g.power(b1) + g.power(b2) + (g.has(b1, 'deathtouch') || g.has(b2, 'deathtouch') ? 99 : 0);
      if (dmg < g.toughness(a) - a.damage) continue;
      // attacker can kill at most one blocker?
      const l1 = Math.max(1, g.toughness(b1) - b1.damage), l2 = Math.max(1, g.toughness(b2) - b2.damage);
      const killsBoth = g.has(a, 'deathtouch') || g.power(a) >= l1 + l2;
      const lost = killsBoth ? Brain.cv(g, b1) + Brain.cv(g, b2) : Math.min(Brain.cv(g, b1), Brain.cv(g, b2));
      const gain = Brain.cv(g, a) - lost;
      if (gain > 0.5 && (!bestPair || gain > bestPair.gain)) bestPair = { b1, b2, gain };
    }
    if (bestPair) {
      addBlock(bestPair.b1, a, `Double-block ${a.name} with ${bestPair.b1.name} and ${bestPair.b2.name}: together they kill it and the attacker can't kill both.`);
      addBlock(bestPair.b2, a, `(second blocker on ${a.name})`);
    }
  }
  // menace attackers need 2 blockers
  for (const a of order) {
    if (!g.has(a, 'menace') || res.blocks.some((b) => b.attacker === a)) continue;
    const opts = blockers.filter((b) => !used.has(b) && g.canBlock(b, a));
    if (opts.length >= 2 && (danger || Brain.cv(g, a) > 4)) {
      const two = opts.sort((x, y) => Brain.cv(g, x) - Brain.cv(g, y)).slice(0, 2);
      addBlock(two[0], a, `Double-block menace attacker ${a.name}.`); addBlock(two[1], a, '(second blocker)');
    }
  }
  // pass 2: survival chump blocks
  let guard = 0;
  while (guard++ < 10) {
    const rem = unblockedDamage();
    if (p.life - rem > 3) break;
    if (rem <= 0) break;
    const unblocked = order.filter((a) => !res.blocks.some((b) => b.attacker === a) && !g.has(a, 'menace'));
    const target = unblocked[0]; if (!target) break;
    const cands = blockers.filter((b) => !used.has(b) && g.canBlock(b, target)).sort((x, y) => Brain.cv(g, x) - Brain.cv(g, y));
    if (!cands.length) { unblocked.shift(); const alt = order.filter((a) => !res.blocks.some((b) => b.attacker === a) && blockers.some((b) => !used.has(b) && g.canBlock(b, a)))[0]; if (!alt) break; const c2 = blockers.filter((b) => !used.has(b) && g.canBlock(b, alt)).sort((x, y) => Brain.cv(g, x) - Brain.cv(g, y))[0]; addBlock(c2, alt, `Chump-block ${alt.name} with ${c2.name} — you'd otherwise take too much damage (life ${p.life}).`); continue; }
    addBlock(cands[0], target, `Chump-block ${target.name} with ${cands[0].name} to protect your life total (you're at ${p.life}, incoming ${rem}).`);
  }
  if (!res.blocks.length) res.notes.push(attackers.length ? 'No good blocks: take the damage and keep your creatures.' : '');
  return res;
};

/* ---------- mulligan / scry / discard ---------- */
Brain.keepHand = function (g, p, hand, mulls) {
  const lands = hand.filter((c) => g.isLand(c)), n = hand.length, spells = hand.filter((c) => !g.isLand(c));
  const cheap = spells.filter((c) => c.def.cmc <= 3).length;
  const L = lands.length;
  if (mulls >= 3) return { keep: true, reason: 'At this point you must keep: going lower hurts more than a clunky hand.' };
  if (L === 0) return { keep: false, reason: 'No lands — you can\'t cast anything. Always mulligan zero-landers.' };
  if (L === 1 && n >= 6) return { keep: false, reason: 'Only one land: you need to draw lands on nearly every turn to function. Mulligan.' };
  if (L >= 6) return { keep: false, reason: `${L} lands and ${spells.length} spell${spells.length === 1 ? '' : 's'} — you\'d flood out. Mulligan.` };
  if (L === 2 && cheap === 0 && n >= 7) return { keep: false, reason: 'Two lands but nothing cheap to cast — too risky to keep.' };
  // colour check
  const colorsHave = new Set(); lands.forEach((l) => { const d = l.def.dual ? l.def.dual.split('') : (l.def.basic ? [l.def.abilities[0].mana.colors[0]] : []); d.forEach((x) => colorsHave.add(x)); });
  const castableColors = spells.filter((c) => c.def.colors.every((col) => colorsHave.has(col)) || !c.def.colors.length).length;
  if (castableColors === 0 && spells.length >= 3 && L >= 2 && !lands.some((l) => l.def.name === 'Evolving Wilds')) return { keep: false, reason: 'None of your spells match the colors of your lands — mulligan.' };
  return { keep: true, reason: `${L} lands and ${spells.length} spells (${cheap} cheap) — a solid keep. You have enough mana to start and things to do with it.` };
};
Brain.scryChoice = function (g, p, cards) {
  const lands = g.lands(p.idx).length + p.hand.filter((c) => g.isLand(c)).length;
  const res = { top: [], bottom: [], reasons: [] };
  for (const c of cards) {
    if (g.isLand(c)) {
      if (lands >= 5) { res.bottom.push(c); res.reasons.push(`${c.name}: bottom — you already have ${lands} lands.`); }
      else { res.top.push(c); res.reasons.push(`${c.name}: keep — you only have ${lands} lands.`); }
    } else {
      if (lands <= 2 && c.def.cmc >= 4) { res.bottom.push(c); res.reasons.push(`${c.name}: bottom — too expensive for your current mana.`); }
      else { res.top.push(c); res.reasons.push(`${c.name}: keep — a good spell you can cast.`); }
    }
  }
  return res;
};
Brain.discardPick = function (g, p, cards, n) {
  const lands = g.lands(p.idx).length;
  const score = (c) => (g.isLand(c) ? (lands >= 5 ? -5 : 10 - lands) : (c.def.fx && c.def.fx.kind === 'counter' ? 5 : 3) + (g.isCreature(c) ? Brain.cv(g, c) * 0.4 : 3) - (c.def.cmc > lands + 3 ? 3 : 0));
  return cards.slice().sort((a, b) => score(a) - score(b)).slice(0, n);
};

/* ---------- target picking ---------- */
Brain.pickTarget = function (g, p, spec, ctx, legal) {
  const me = p.idx, src = ctx.source; const d = src && src.def;
  if (!legal.length) return null;
  if (spec.kind === 'spell') return maxBy(legal, (it) => it.card.def.cmc);
  if (spec.kind === 'graveyard') return maxBy(legal, (c) => (g.isCreature(c) ? Brain.cv(g, c) : 1));
  const fx = (d && d.fx) || {};
  const harm = spec.ai === 'harm';
  const opp = g.players[1 - me];
  if (harm) {
    const dmg = ctx.dmg != null ? ctx.dmg : (fx.kind === 'damage' ? dmgOf(fx, ctx.x || 0) : (d && d.name === 'Siege-Gang Commander' ? 2 : (d && d.name === 'Prodigal Sorcerer' ? 1 : 2)));
    const enemy = legal.filter((t) => (t.isPlayer ? t.idx !== me : (t.kind === 'spell' ? true : t.controller !== me)));
    const players = enemy.filter((t) => t.isPlayer), perms = enemy.filter((t) => !t.isPlayer);
    if (spec.kind === 'player') return players[0] || legal[0];
    if (spec.kind === 'any') {
      if (players.length && dmg >= opp.life) return players[0];
      const killable = perms.filter((t) => g.toughness(t) - t.damage <= dmg);
      const k = maxBy(killable, (t) => Brain.cv(g, t));
      if (k && Brain.cv(g, k) >= 3.5) return k;
      return players[0] || maxBy(perms, (t) => Brain.cv(g, t)) || legal[0];
    }
    // creature / permanent
    const pick = maxBy(perms, (t) => permValue(g, t) + (g.combat && g.combat.attackers.some((a) => a.card === t) ? 1 : 0));
    return pick || legal[0];
  }
  // help: my own best / most relevant creature
  const mine = legal.filter((t) => !t.isPlayer && t.controller === me);
  const inCombat = mine.filter((t) => g.combat && g.combat.attackers.some((a) => a.card === t || a.blockers.includes(t)));
  return maxBy(inCombat.length ? inCombat : mine, (t) => Brain.cv(g, t) + (g.canAttack(t) ? 1 : 0)) || legal[0];
};

/* ---------- instant-speed responses ---------- */
function stackFx(it) { const d = it.card && it.card.def; if (!d) return null; return d.modes && it.mode != null ? d.modes[it.mode].fx : d.fx; }
Brain.threatOfSpell = function (g, p, it) {
  const d = it.card.def; const fx = stackFx(it) || {};
  let t = d.cmc;
  if (g.isCreature(it.card)) t = Brain.cv(g, it.card) * 0.8;
  if (fx.kind === 'destroy' || fx.kind === 'damage' || fx.kind === 'pacify' || fx.kind === 'exile') t += 3;
  if (d.tag === 'draw') t += 1;
  if (d.tag === 'bomb') t += 3;
  if (d.tag === 'finisher' || d.tag === 'threaten') t += 3;
  return t;
};
function countersFor(g, p, it) {
  const out = [];
  for (const c of p.hand) {
    if (!c.def.fx || c.def.fx.kind !== 'counter') continue;
    if (!g.canCast(p, c).ok) continue;
    const spec = c.def.targets[0];
    if (g.legalTargets(spec, { controller: p.idx, source: c }).includes(it)) out.push(c);
  }
  return out.sort((a, b) => a.def.cmc - b.def.cmc);
}
Brain.counterAdvice = function (g, p, it) {
  const cs = countersFor(g, p, it); if (!cs.length) return null;
  const th = Brain.threatOfSpell(g, p, it);
  const c = cs[0];
  const need = p.life <= 8 ? 2.5 : 3.5;
  if (th >= need) return { kind: 'cast', card: c, intent: { targets: [it] }, score: th, reason: `Counter ${it.card.name} with ${c.name}: it's a ${g.isCreature(it.card) ? 'strong creature' : 'spell worth stopping'} (value ≈ ${th.toFixed(0)}) and trading a cheap counter for it is good tempo/card economy.`, principle: 'counter' };
  return { kind: 'skip', reason: `${it.card.name} isn't threatening enough to spend ${c.name} on — save the counterspell for a bigger threat.` };
};
Brain.protectAdvice = function (g, p, it) {
  // opponent spell on the stack targeting my creature: can I save it?
  const fx = stackFx(it) || {}; if (!fx.kind) return null;
  if (!['destroy', 'damage', 'shrink', 'pacify', 'exile', 'bounce'].includes(fx.kind)) return null;
  const tgt = it.targets.find((t) => t && !t.isPlayer && t.kind !== 'spell' && t.controller === p.idx);
  if (!tgt) return null;
  const val = Brain.cv(g, tgt); if (val < 4.5) return null;
  const x = it.x || 0;
  const willDie = kills(g, tgt, fx, x) && fx.kind !== 'bounce';
  for (const c of p.hand) {
    if (!c.def.fx || !g.canCast(p, c).ok) continue;
    const f = c.def.fx;
    if (c.def.name === 'Valorous Stance' && ['destroy', 'damage'].includes(fx.kind) && willDie) {
      return { kind: 'cast', card: c, intent: { targets: [tgt], mode: 0 }, score: val, reason: `Respond with Valorous Stance: ${tgt.name} would die, but indestructible saves it (for destroy/damage effects).`, principle: 'protect' };
    }
    if (f.kind === 'pump' && f.protect && g.legalTargets(c.def.targets[0], { controller: p.idx, source: c }).includes(tgt)) {
      return { kind: 'cast', card: c, intent: { targets: [tgt] }, score: val, reason: `Respond with ${c.name}: hexproof makes their spell fizzle (it has no legal target) and ${tgt.name} survives.`, principle: 'protect' };
    }
    if (f.kind === 'pump' && f.t && fx.kind === 'damage' && g.toughness(tgt) + f.t - tgt.damage > dmgOf(fx, x)) {
      return { kind: 'cast', card: c, intent: { targets: [tgt] }, score: val, reason: `Respond with ${c.name}: +${f.t} toughness lets ${tgt.name} survive the damage.`, principle: 'protect' };
    }
    if (f.kind === 'bounce' && willDie && val >= 6 && g.legalTargets(c.def.targets[0], { controller: p.idx, source: c }).includes(tgt)) {
      return { kind: 'cast', card: c, intent: { targets: [tgt] }, score: val * 0.8, reason: `Respond with ${c.name}: return your own ${tgt.name} to hand so their removal spell fizzles. You replay the creature later.`, principle: 'protect' };
    }
  }
  return null;
};
// Combat tricks and instant-speed removal during combat. `stepName` = g.step.
Brain.combatAdvice = function (g, p) {
  const me = p.idx, cb = g.combat; if (!cb) return null;
  const isAtk = g.active === me;
  const spare = g.availableMana(p);
  const insts = p.hand.filter((c) => (g.hasFlash(c)) && g.canCast(p, c).ok && c.def.fx);
  // Abilities that pump (firebreathing)
  const pumpers = g.bf.filter((c) => c.controller === me && c.def.abilities.some((ab) => ab.tag === 'pump' && ab.cost && ab.cost.mana));
  if (g.step === 'blockers') {
    for (const rec of cb.attackers) {
      const a = rec.card; if (a.zone !== 'battlefield') continue;
      const blockers = rec.blockers.filter((b) => b.zone === 'battlefield');
      const mine = isAtk ? a : null;
      const outcome = () => {
        if (!blockers.length) return { mineDies: false, theirsDie: 0 };
        if (isAtk) {
          const dmgIn = sum(blockers, (b) => g.power(b)); const dt = blockers.some((b) => g.has(b, 'deathtouch'));
          const aDies = dt || dmgIn >= g.toughness(a) - a.damage;
          let left = g.power(a), kills2 = 0; for (const b of blockers.slice().sort((x, y) => Brain.cv(g, y) - Brain.cv(g, x))) { const need = g.has(a, 'deathtouch') ? 1 : Math.max(1, g.toughness(b) - b.damage); if (left >= need) { kills2 += Brain.cv(g, b); left -= need; } }
          return { mineDies: aDies, theirsDie: kills2, mineVal: Brain.cv(g, a) };
        }
        return null;
      };
      if (isAtk && mine) {
        const oc = outcome();
        // unblocked: finish with burn pump?
        if (!blockers.length) {
          const opp = g.players[1 - me];
          const dmg = g.power(a);
          for (const pm of pumpers) { const ab = pm.def.abilities.find((x) => x.tag === 'pump'); const cost = MTG.parseCost(ab.cost.mana); const extra = Math.floor(spare / Math.max(1, cost.cmc)); if (pm === a && extra > 0 && dmg + extra >= opp.life && dmg < opp.life) return { kind: 'activate', perm: pm, idx: pm.def.abilities.indexOf(ab), intent: { targets: [] }, reason: `Pump ${pm.name} with spare mana for lethal damage.` }; }
          continue;
        }
        if (oc.mineDies) {
          // save it with a pump or kill the blocker
          for (const c of insts) {
            const f = c.def.fx;
            if (f.kind === 'pump' && g.legalTargets(c.def.targets[0], { controller: me, source: c }).includes(a)) {
              const after = withMod(g, a, [f.p, f.t], f.kind === 'pump' ? ['trample'] : [], () => { const dmgIn = sum(blockers, (b) => g.power(b)); const dt = blockers.some((b) => g.has(b, 'deathtouch')); return { dies: dt || dmgIn >= g.toughness(a) - a.damage, kills: blockers.some((b) => g.power(a) >= g.toughness(b) - b.damage) }; });
              if (!after.dies && after.kills) return { kind: 'cast', card: c, intent: { targets: [a] }, reason: `${c.name} on ${a.name}: it survives the block AND kills the blocker — a blowout.`, principle: 'trick' };
            }
            if ((f.kind === 'damage' || f.kind === 'destroy' || f.kind === 'shrink') && !f.combatOnly || (c.def.name === "Gideon's Reproach")) {
              const spec = c.def.targets && c.def.targets[0]; if (!spec) continue;
              const legal = g.legalTargets(spec, { controller: me, source: c });
              const tgt = maxBy(blockers.filter((b) => legal.includes(b) && kills(g, b, f.kind === 'damage' ? f : f, 0)), (b) => Brain.cv(g, b));
              if (tgt && blockers.length === 1) return { kind: 'cast', card: c, intent: { targets: [tgt] }, reason: `${c.name} the blocker ${tgt.name} before damage: your ${a.name} survives and their blocker is gone.`, principle: 'trick' };
            }
          }
        }
      } else if (!isAtk && blockers.length) {
        // I'm defending: protect blockers / punish attackers
        const b = blockers.find((x) => x.controller === me); if (!b) continue;
        const dmgIn = g.power(a), dt = g.has(a, 'deathtouch');
        const bDies = dt || dmgIn >= g.toughness(b) - b.damage;
        const aDies = g.power(b) >= g.toughness(a) - a.damage || g.has(b, 'deathtouch');
        for (const c of insts) {
          const f = c.def.fx;
          if (f.kind === 'pump' && g.legalTargets(c.def.targets[0], { controller: me, source: c }).includes(b)) {
            const res = withMod(g, b, [f.p, f.t], [], () => ({ dies: g.has(a, 'deathtouch') || g.power(a) >= g.toughness(b) - b.damage, kills: g.power(b) >= g.toughness(a) - a.damage || g.has(b, 'deathtouch') }));
            if (bDies && !res.dies && res.kills) return { kind: 'cast', card: c, intent: { targets: [b] }, reason: `${c.name} on your blocker ${b.name}: it survives and kills ${a.name}.`, principle: 'trick' };
            if (!bDies && !aDies && res.kills && !res.dies) return { kind: 'cast', card: c, intent: { targets: [b] }, reason: `${c.name} on your blocker ${b.name} kills ${a.name} without losing anything.`, principle: 'trick' };
          }
        }
        void aDies;
      }
    }
  }
  if (g.step === 'attackers' && !isAtk && cb.attackers.length) {
    // use instant removal on an attacker before blocks
    for (const c of insts) {
      const f = c.def.fx; if (!f || !c.def.targets || !c.def.targets[0]) continue;
      if (!['damage', 'destroy', 'shrink'].includes(f.kind)) continue;
      const legal = g.legalTargets(c.def.targets[0], { controller: me, source: c });
      const atk = cb.attackers.map((r) => r.card).filter((t) => legal.includes(t) && kills(g, t, f, f.n === 'x' ? 0 : 0) && (f.kind !== 'damage' || f.n !== 'x'));
      const tgt = maxBy(atk, (t) => Brain.cv(g, t));
      if (tgt && Brain.cv(g, tgt) >= Brain.removalThreshold(g, p) + 1) return { kind: 'cast', card: c, intent: { targets: [tgt] }, reason: `${c.name} on the attacking ${describe(g, tgt)}: killing it now stops its damage and costs you only ${c.def.cmc} mana.`, principle: 'removal' };
    }
    // flash blockers / tokens
    for (const c of insts) {
      if (c.def.name === 'Raise the Alarm' && g.creatures(me).length < 3) return { kind: 'cast', card: c, intent: { targets: [] }, reason: 'Raise the Alarm now: two surprise blockers can absorb or trade with the attackers.', principle: 'trick' };
      if (c.def.name === 'Spectral Sailor' && false) return null;
    }
  }
  return null;
};
Brain.endStepAdvice = function (g, p) {
  const me = p.idx, opp = g.players[1 - me];
  const insts = p.hand.filter((c) => g.hasFlash(c) && g.canCast(p, c).ok);
  const spare = g.availableMana(p);
  // lethal burn
  for (const c of insts) {
    const f = c.def.fx; if (f && f.kind === 'damage' && !f.combatOnly && f.n !== 'x' && f.n >= opp.life) return { kind: 'cast', card: c, intent: { targets: [opp] }, reason: `${c.name} to the face for the win.`, principle: 'lethal' };
  }
  for (const c of insts) {
    const f = c.def.fx; if (!f || !['damage', 'destroy', 'shrink'].includes(f.kind) || f.combatOnly || c.def.x) continue;
    const spec = c.def.targets && c.def.targets[0]; if (!spec) continue;
    const bk = bestKill(g, p, c, spec, f, 0);
    if (bk && bk.v >= Brain.removalThreshold(g, p) + (f.kind === 'destroy' ? 1.8 : 0)) return { kind: 'cast', card: c, intent: { targets: [bk.t] }, reason: `End of their turn: ${c.name} kills ${describe(g, bk.t)} using mana that would otherwise go to waste, and you untap with all your mana free for your own turn.`, principle: 'mana-efficiency' };
  }
  for (const c of insts) {
    if (c.def.name === 'Opt' && spare >= 1) return { kind: 'cast', card: c, intent: { targets: [] }, reason: 'Cast Opt at end of turn: the mana would be wasted otherwise, and you dig toward the card you need.', principle: 'mana-efficiency' };
    if (c.def.name === 'Raise the Alarm' && spare >= 2) return { kind: 'cast', card: c, intent: { targets: [] }, reason: 'Make Soldiers at end of turn so they can attack on your turn without giving the opponent time to answer.', principle: 'mana-efficiency' };
    if (c.def.name === 'Spectral Sailor' && spare >= 1) return { kind: 'cast', card: c, intent: { targets: [] }, reason: 'Flash in Spectral Sailor at end of turn: it dodges sorcery-speed removal and attacks next turn.', principle: 'mana-efficiency' };
  }
  if (spare >= 4) for (const perm of g.bf.filter((c) => c.controller === me && c.def.name === 'Spectral Sailor')) {
    const i = perm.def.abilities.findIndex((ab) => ab.cost && ab.cost.mana === '3U'); if (i >= 0 && g.abilityUsable(p, perm, i).ok) return { kind: 'activate', perm, idx: i, intent: { targets: [] }, reason: 'Spend spare mana at end of turn to draw with Spectral Sailor.' };
  }
  return null;
};
Brain.respond = function (g, p) {
  const top = g.stack[g.stack.length - 1];
  if (top && top.controller !== p.idx) {
    if (top.kind === 'spell') {
      const prot = Brain.protectAdvice(g, p, top); if (prot) return prot;
      const cn = Brain.counterAdvice(g, p, top); if (cn && cn.kind === 'cast') return cn;
    }
    return null;
  }
  if (g.stack.length) return null;
  if (g.combat && (g.step === 'attackers' || g.step === 'blockers')) { const r = Brain.combatAdvice(g, p); if (r) return r; }
  if (g.step === 'end' && g.active !== p.idx) { const r = Brain.endStepAdvice(g, p); if (r) return r; }
  return null;
};
Brain.chooseXFor = function (g, p, card, max, ctx) {
  const fx = card.def.fx || {}; const opp = g.players[1 - p.idx];
  if (fx.kind === 'damage') {
    if (max >= opp.life) return max;
    const th = Brain.removalThreshold(g, p);
    const k = maxBy(g.creatures(1 - p.idx).filter((c) => g.toughness(c) - c.damage <= max && Brain.cv(g, c) >= th), (c) => Brain.cv(g, c));
    if (k) return Math.max(1, g.toughness(k) - k.damage);
  }
  return max;
};

/* ---------- the computer-player controller ---------- */
class AIController {
  constructor() { this.intent = null; this.isAI = true; }
  take(card) { const i = this.intent; if (i && i.src === card) { return i; } return null; }
  async mulligan(g, p, hand, n) { return Brain.keepHand(g, p, hand, n).keep; }
  async chooseMode(g, p, card, idxs) {
    const i = this.take(card); if (i && i.mode != null && idxs.includes(i.mode)) return i.mode;
    return idxs[idxs.length - 1];
  }
  async chooseTargets(g, p, spec, o) {
    const i = this.take(o.source);
    if (i && i.targets && i.targets.length) {
      const idx = i.used || 0; const t = i.targets[idx];
      if (t != null) { i.used = idx + 1; if (o.legal.includes(t)) return [t]; }
    }
    const pick = Brain.pickTarget(g, p, spec, { source: o.source, controller: p.idx }, o.legal);
    return pick ? [pick] : [o.legal[0]];
  }
  async chooseX(g, p, card, max) { const i = this.take(card); if (i && i.x != null) return Math.min(i.x, max); return Brain.chooseXFor(g, p, card, max); }
  async chooseOption(g, p, o) {
    if (o.source && o.source.def.name === 'Charming Prince') return p.life <= 12 ? 1 : 0;
    return 0;
  }
  async chooseCards(g, p, o) {
    const cards = o.cards;
    if (o.mode === 'discard') return Brain.discardPick(g, p, cards, o.min);
    if (o.mode === 'bottom') return Brain.discardPick(g, p, cards, o.min);
    if (o.mode === 'sacrifice') return [cards.slice().sort((a, b) => Brain.cv(g, a) - Brain.cv(g, b))[0]];
    if (o.mode === 'search') {
      if (!cards.length) return [];
      const { have, need } = Brain.colorNeeds(g, p);
      const sc = (c) => { const col = c.def.abilities[0] && c.def.abilities[0].mana ? c.def.abilities[0].mana.colors[0] : null; return col ? (Math.max(0, (need[col] || 0) - have[col]) * 3 - have[col] * 0.1 + (need[col] ? 0.5 : 0)) : 0; };
      return [maxBy(cards, sc)];
    }
    return cards.slice(0, o.max || 1);
  }
  async scry(g, p, cards) { const r = Brain.scryChoice(g, p, cards); return { top: r.top, bottom: r.bottom }; }
  async declareAttackers(g, p, possible) { return Brain.attackPlan(g, p, possible).attackers.map((a) => a.card); }
  async declareBlockers(g, p, atk, blk) { return Brain.blockPlan(g, p, atk, blk).blocks.map((b) => [b.blocker, b.attacker]); }
  run(opt) { this.intent = { src: opt.card || opt.perm, targets: opt.intent.targets, mode: opt.intent.mode, x: opt.intent.x, used: 0 }; }
  async priority(g, p) {
    // responding to something?
    const r = Brain.respond(g, p);
    if (r && r.kind !== 'skip') return this.act(r);
    if (g.active === p.idx && g.isMain() && g.stack.length === 0) {
      const a = Brain.nextMainAction(g, p);
      if (a) return this.act(a);
    }
    return { type: 'pass' };
  }
  act(a) {
    if (a.kind === 'land') return { type: 'land', card: a.card };
    this.run(a);
    if (a.kind === 'cast') return { type: 'cast', card: a.card };
    if (a.kind === 'activate') return { type: 'activate', perm: a.perm, idx: a.idx };
    return { type: 'pass' };
  }
}
MTG.AIController = AIController;
})();
