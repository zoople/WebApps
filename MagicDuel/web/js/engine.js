'use strict';
/* Magic Duel rules engine.
 * Pure JS (no DOM) so it runs in the browser/WebView and in Node for AI-vs-AI testing.
 * Everything that needs a decision from a player is `await`ed on a controller (human UI or AI).
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const COLORS = ['W', 'U', 'B', 'R', 'G'];
const COLOR_NAMES = { W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless' };
const MANA_KEYS = ['W', 'U', 'B', 'R', 'G', 'C'];
const STEP_LABEL = {
  setup: 'Setup', untap: 'Untap', upkeep: 'Upkeep', draw: 'Draw', main1: 'Main 1', begin: 'Combat',
  attackers: 'Attackers', blockers: 'Blockers', firstStrike: 'First strike', damage: 'Damage',
  endCombat: 'End combat', main2: 'Main 2', end: 'End step', cleanup: 'Cleanup',
};
MTG.COLORS = COLORS; MTG.COLOR_NAMES = COLOR_NAMES; MTG.STEP_LABEL = STEP_LABEL;

function parseCost(str) {
  const c = { generic: 0, W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, x: 0, cmc: 0, str: str || '' };
  const re = /(\d+)|([WUBRGCX])/g; let m;
  while ((m = re.exec(str || ''))) {
    if (m[1]) { c.generic += +m[1]; c.cmc += +m[1]; }
    else if (m[2] === 'X') c.x++;
    else { c[m[2]]++; c.cmc++; }
  }
  return c;
}
MTG.parseCost = parseCost;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const emptyPool = () => ({ W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 });
let CARD_ID = 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Game {
  constructor(opts) {
    this.rng = mulberry32(opts.seed != null ? opts.seed : (Math.random() * 4294967296) >>> 0);
    this.seed = opts.seed;
    this.pace = opts.pace || 0;            // ms pause between visible AI actions (0 in tests)
    this.ctrls = opts.controllers;
    this.players = [0, 1].map((i) => ({
      idx: i, isPlayer: true, name: opts.names[i], life: 20, library: [], hand: [], graveyard: [], exile: [],
      pool: emptyPool(), landDrops: 0, drewEmpty: false, deckName: (opts.deckNames || [])[i] || '',
      stats: { manaSpent: 0, manaAvail: 0, turns: [], missedLands: 0, cardsPlayed: 0, damageDealt: 0 },
    }));
    this.bf = []; this.stack = []; this.turnNo = 0; this.active = 0; this.step = 'setup';
    this.ver = 0; this.ts = 0; this.logs = []; this.over = false; this.winner = null;
    this.combat = null; this.pending = []; this.firstPlayer = 0; this.lastTurn = [0, 0]; this.resultReason = '';
    this.onChange = null; this.onLog = null; this.onEvent = null;
    this.history = [];   // short summaries of turns, for the post-game review
    opts.decks.forEach((names, i) => {
      for (const n of names) {
        const def = MTG.cards[n];
        if (!def) throw new Error('Unknown card: ' + n);
        const c = this.newCard(def, i); c.zone = 'library'; this.players[i].library.push(c);
      }
    });
  }

  /* ---------- basics ---------- */
  P(i) { return this.players[i]; }
  ctrl(i) { return this.ctrls[i]; }
  rand() { return this.rng(); }
  touch() { this.ver++; }
  changed() { if (this.onChange) this.onChange(this); }
  log(msg) { this.logs.push(msg); if (this.onLog) this.onLog(msg); }
  fx(type, data) { if (this.onEvent) this.onEvent(type, data); }
  async pause(ms) { if (this.pace > 0 && ms > 0) { this.changed(); await sleep(ms * this.pace); } }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  newCard(def, owner) {
    return { id: CARD_ID++, def, name: def.name, owner, controller: owner, zone: null, tapped: false, damage: 0,
      counters: {}, temp: [], attachedTo: null, attachments: [], summonedTurn: -1, token: false, ts: 0, flags: {}, dt: false };
  }
  makeToken(owner, spec) {
    const def = Object.assign({ token: true, types: ['Creature'], subtypes: [], kw: [], cost: '', cmc: 0, text: '' }, spec);
    def.costObj = parseCost(''); def.abilities = def.abilities || []; def.triggers = def.triggers || [];
    const c = this.newCard(def, owner); c.token = true; return c;
  }

  /* ---------- derived characteristics ---------- */
  isType(c, t) { return c.def.types.includes(t); }
  isCreature(c) { return c.def.types.includes('Creature'); }
  isLand(c) { return c.def.types.includes('Land'); }
  chars(c) {
    if (c._cv === this.ver && c._cc) return c._cc;
    const d = c.def; let p = d.power || 0, t = d.toughness || 0;
    const kw = new Set(d.kw || []); let colors = d.colors || [];
    p += (c.counters.p1p1 || 0) - (c.counters.m1m1 || 0);
    t += (c.counters.p1p1 || 0) - (c.counters.m1m1 || 0);
    if (d.dyn && c.zone === 'battlefield') { const r = d.dyn(this, c); p += r[0]; t += r[1]; }
    if (c.zone === 'battlefield') {
      for (const a of c.attachments) {
        const gr = a.def.grants; if (!gr) continue;
        if (gr.pt) { p += gr.pt[0]; t += gr.pt[1]; }
        if (gr.kw) gr.kw.forEach((k) => kw.add(k));
      }
      if (this.isCreature(c)) for (const s of this.bf) {
        const sts = s.def.static; if (!sts) continue;
        for (const st of sts) if (st.applies(this, s, c)) {
          if (st.pt) { p += st.pt[0]; t += st.pt[1]; }
          if (st.kw) st.kw.forEach((k) => kw.add(k));
        }
      }
    }
    for (const e of c.temp) {
      if (e.pt) { p += e.pt[0]; t += e.pt[1]; }
      if (e.kw) e.kw.forEach((k) => kw.add(k));
    }
    const r = { power: p, toughness: t, kw, colors };
    c._cv = this.ver; c._cc = r; return r;
  }
  power(c) { return this.chars(c).power; }
  toughness(c) { return this.chars(c).toughness; }
  has(c, k) { return this.chars(c).kw.has(k); }
  colorsOf(c) { return this.chars(c).colors; }
  isSick(c) { return this.isCreature(c) && c.summonedTurn >= this.lastTurn[c.controller] && !this.has(c, 'haste'); }
  creatures(pi) { return this.bf.filter((c) => this.isCreature(c) && (pi == null || c.controller === pi)); }
  lands(pi) { return this.bf.filter((c) => this.isLand(c) && (pi == null || c.controller === pi)); }
  permsOf(pi) { return this.bf.filter((c) => c.controller === pi); }
  countType(pi, sub) { return this.bf.filter((c) => c.controller === pi && c.def.subtypes.includes(sub)).length; }

  /* ---------- zones ---------- */
  zoneList(c, zone) {
    if (zone === 'battlefield') return this.bf;
    if (zone === 'stack') return this.stack;
    return this.players[c.owner][zone];
  }
  removeFromZone(c) {
    if (!c.zone) return;
    if (c.zone === 'stack') { const i = this.stack.findIndex((s) => s.card === c); if (i >= 0) this.stack.splice(i, 1); return; }
    const l = this.zoneList(c, c.zone); const i = l.indexOf(c); if (i >= 0) l.splice(i, 1);
    c.zone = null;
  }
  // Move a card between non-battlefield zones, or off the battlefield.
  moveTo(c, zone, opts = {}) {
    const from = c.zone;
    if (from === 'battlefield') return this.leaveBattlefield(c, zone, opts);
    this.removeFromZone(c);
    if (c.token) { c.zone = null; return c; }
    c.zone = zone; const l = this.players[c.owner][zone];
    if (opts.bottom) l.unshift(c); else l.push(c);
    this.touch();
    return c;
  }
  leaveBattlefield(c, zone, opts = {}) {
    const lki = { card: c, controller: c.controller, power: this.power(c), toughness: this.toughness(c), wasCreature: this.isCreature(c), kw: new Set(this.chars(c).kw) };
    const i = this.bf.indexOf(c); if (i < 0) return c;
    this.bf.splice(i, 1);
    if (c.attachedTo) { const a = c.attachedTo.attachments; const j = a.indexOf(c); if (j >= 0) a.splice(j, 1); c.attachedTo = null; }
    for (const a of c.attachments.slice()) a.attachedTo = null;
    c.attachments = [];
    const wasController = c.controller;
    c.tapped = false; c.damage = 0; c.counters = {}; c.temp = []; c.dt = false; c.controlTemp = null; c.flags = {};
    c.zone = null;
    if (c.def.onLeave) c.def.onLeave(this, c, lki);
    if (!c.token) { c.zone = zone; const l = this.players[c.owner][zone]; if (opts.bottom) l.unshift(c); else l.push(c); }
    this.touch();
    this.emit('leave', { card: c, to: zone, lki, controller: wasController });
    if (zone === 'graveyard' && lki.wasCreature) this.emit('dies', { card: c, lki, controller: wasController });
    return c;
  }
  enter(c, controller, opts = {}) {
    this.removeFromZone(c);
    c.zone = 'battlefield'; c.controller = controller; c.summonedTurn = this.turnNo; c.ts = ++this.ts;
    c.tapped = !!(c.def.etbTapped || opts.tapped); c.damage = 0; c.temp = []; c.dt = false;
    c.counters = Object.assign({}, c.def.entersWith || {}, opts.counters || {});
    c.attachments = []; c.attachedTo = null;
    this.bf.push(c);
    if (opts.attachTo) this.attach(c, opts.attachTo);
    this.touch();
    this.emit('etb', { card: c, controller, from: opts.from });
    return c;
  }
  attach(a, target) {
    if (a.attachedTo) { const l = a.attachedTo.attachments; const i = l.indexOf(a); if (i >= 0) l.splice(i, 1); }
    a.attachedTo = target; target.attachments.push(a); this.touch();
  }
  sacrifice(c) { if (c.zone === 'battlefield') { this.log(`${this.pn(c.controller)} sacrifices ${c.name}.`); this.moveTo(c, 'graveyard'); } }
  pn(i) { return this.players[i].name; }
  destroy(c) {
    if (!c || c.zone !== 'battlefield') return false;
    if (this.has(c, 'indestructible')) { this.log(`${c.name} is indestructible.`); return false; }
    this.log(`${c.name} is destroyed.`); this.moveTo(c, 'graveyard'); return true;
  }
  exile(c) { if (!c || c.zone !== 'battlefield') return; this.log(`${c.name} is exiled.`); this.moveTo(c, 'exile'); }
  bounce(c) { if (!c || c.zone !== 'battlefield') return; this.log(`${c.name} returns to hand.`); this.moveTo(c, 'hand'); }
  tap(c) { if (c) { c.tapped = true; this.touch(); } }
  untap(c) { if (c) { c.tapped = false; this.touch(); } }
  addCounters(c, kind, n) { if (!c || c.zone !== 'battlefield') return; c.counters[kind] = (c.counters[kind] || 0) + n; this.touch(); }
  pump(c, p, t, kws, until = 'eot') { if (!c || c.zone !== 'battlefield') return; c.temp.push({ pt: [p, t], kw: kws || [], until }); this.touch(); }
  grantTemp(c, kws, until = 'eot') { this.pump(c, 0, 0, kws, until); }

  /* ---------- life, damage, cards ---------- */
  gainLife(pi, n) { if (n <= 0) return; this.players[pi].life += n; this.log(`${this.pn(pi)} gains ${n} life.`); this.fx('life', { p: pi, n }); this.emit('lifegain', { player: pi, n }); }
  loseLife(pi, n) { if (n <= 0) return; this.players[pi].life -= n; this.log(`${this.pn(pi)} loses ${n} life.`); this.fx('life', { p: pi, n: -n }); }
  dealDamage(src, tgt, n, opts = {}) {
    if (!tgt || n <= 0) return 0;
    const sc = src ? this.colorsOf(src) : [];
    if (tgt.isPlayer) {
      tgt.life -= n; this.log(`${src ? src.name : 'Something'} deals ${n} damage to ${tgt.name}.`);
      if (src) this.players[src.controller].stats.damageDealt += n;
      this.fx('damage', { target: tgt, n });
    } else {
      if (tgt.zone !== 'battlefield') return 0;
      for (const c of sc) if (this.has(tgt, 'protection:' + c)) { this.log(`${tgt.name} is protected from ${COLOR_NAMES[c]}.`); return 0; }
      tgt.damage += n; this.touch();
      if (src && this.has(src, 'deathtouch')) tgt.dt = true;
      this.log(`${src ? src.name : 'Something'} deals ${n} damage to ${tgt.name}.`);
      this.fx('damage', { target: tgt, n });
    }
    if (src && this.has(src, 'lifelink')) this.gainLife(src.controller, n);
    this.emit('damage', { source: src, target: tgt, n, combat: !!opts.combat });
    return n;
  }
  fight(a, b) {
    if (!a || !b || a.zone !== 'battlefield' || b.zone !== 'battlefield') return;
    const pa = this.power(a), pb = this.power(b);
    this.dealDamage(a, b, pa); this.dealDamage(b, a, pb);
  }
  drawCards(pi, n) {
    const p = this.players[pi]; let drawn = 0;
    for (let i = 0; i < n; i++) {
      if (!p.library.length) { p.drewEmpty = true; break; }
      const c = p.library.pop(); c.zone = 'hand'; p.hand.push(c); drawn++;
    }
    if (drawn) { this.log(`${p.name} draws ${drawn === 1 ? 'a card' : drawn + ' cards'}.`); this.touch(); this.emit('draw', { player: pi, n: drawn }); }
    return drawn;
  }
  async discard(pi, n, opts = {}) {
    const p = this.players[pi];
    n = Math.min(n, p.hand.length); if (n <= 0) return;
    const ch = await this.ctrl(pi).chooseCards(this, p, { prompt: `Discard ${n} card${n > 1 ? 's' : ''}`, cards: p.hand.slice(), min: n, max: n, mode: 'discard' });
    for (const c of ch) { this.log(`${p.name} discards ${c.name}.`); this.moveTo(c, 'graveyard'); }
  }
  mill(pi, n) { const p = this.players[pi]; for (let i = 0; i < n && p.library.length; i++) this.moveTo(p.library[p.library.length - 1], 'graveyard'); }
  async scry(pi, n) {
    const p = this.players[pi]; n = Math.min(n, p.library.length); if (n <= 0) return;
    const top = p.library.splice(p.library.length - n, n).reverse();   // top first
    const res = await this.ctrl(pi).scry(this, p, top);
    const bottom = res.bottom || [], keep = res.top || [];
    for (const c of bottom) p.library.unshift(c);
    for (const c of keep.slice().reverse()) p.library.push(c);
    this.log(`${p.name} scries ${n}.`); this.touch();
  }
  async searchLibrary(pi, filter, opts = {}) {
    const p = this.players[pi];
    const cands = p.library.filter(filter);
    let chosen = [];
    if (cands.length) {
      chosen = await this.ctrl(pi).chooseCards(this, p, { prompt: opts.prompt || 'Search your library', cards: cands, min: 0, max: opts.count || 1, mode: 'search', source: opts.source });
    }
    this.shuffle(p.library); this.log(`${p.name} searches their library.`);
    return chosen;
  }
  createToken(pi, spec, n = 1) {
    const out = [];
    for (let i = 0; i < n; i++) { const t = this.makeToken(pi, spec); this.enter(t, pi); out.push(t); }
    this.log(`${this.pn(pi)} creates ${n} ${spec.name} token${n > 1 ? 's' : ''}.`);
    return out;
  }
  counterSpell(item) {
    if (!item || item.countered) return;
    item.countered = true; this.log(`${item.card ? item.card.name : 'A spell'} is countered.`);
  }

  /* ---------- targets ---------- */
  protectedFrom(tgt, srcCard, controller) {
    if (tgt.isPlayer) return false;
    if (tgt.zone !== 'battlefield') return false;
    if (tgt.controller !== controller) {
      if (this.has(tgt, 'hexproof') || this.has(tgt, 'shroud')) return true;
      if (srcCard) for (const c of this.colorsOf(srcCard)) if (this.has(tgt, 'hexproofFrom:' + c)) return true;
    } else if (this.has(tgt, 'shroud')) return true;
    if (srcCard) for (const c of this.colorsOf(srcCard)) if (this.has(tgt, 'protection:' + c)) return true;
    return false;
  }
  legalTargets(spec, ctx) {
    const me = ctx.controller, src = ctx.source, out = [];
    const ok = (o, ctrlOf) => {
      if (spec.who === 'you' && ctrlOf !== me) return false;
      if (spec.who === 'opp' && ctrlOf === me) return false;
      if (spec.not && spec.not === o) return false;
      if (spec.filter && !spec.filter(this, o, ctx)) return false;
      if (this.protectedFrom(o, src, me)) return false;
      return true;
    };
    const k = spec.kind;
    if (k === 'player' || k === 'any') for (const p of this.players) if (ok(p, p.idx)) out.push(p);
    if (k === 'creature' || k === 'any') for (const c of this.bf) if (this.isCreature(c) && ok(c, c.controller)) out.push(c);
    if (k === 'permanent') for (const c of this.bf) if (ok(c, c.controller)) out.push(c);
    if (k === 'spell') for (const it of this.stack) if (it.kind === 'spell' && it.card !== src && !it.countered && ok(it.card, it.controller)) out.push(it);
    if (k === 'graveyard') for (const p of this.players) for (const c of p.graveyard) if (ok(c, p.idx)) out.push(c);
    return out;
  }
  describeSpec(spec) { return spec.label || 'target'; }

  /* ---------- mana ---------- */
  manaSources(p) {
    const out = [];
    for (const perm of this.bf) {
      if (perm.controller !== p.idx || perm.tapped) continue;
      const abs = perm.def.abilities; if (!abs) continue;
      for (let i = 0; i < abs.length; i++) {
        const ab = abs[i]; if (!ab.mana) continue;
        if (this.isCreature(perm) && this.isSick(perm)) continue;
        if (ab.cond && !ab.cond(this, perm)) continue;
        const colors = ab.mana.colors === 'any' ? ['W', 'U', 'B', 'R', 'G'] : ab.mana.colors;
        out.push({ perm, ab, idx: i, colors });
      }
    }
    return out;
  }
  colorWeights(p) {
    const w = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
    for (const c of p.hand) { const co = c.def.costObj; if (!co) continue; for (const k of MANA_KEYS) w[k] += co[k] || 0; }
    return w;
  }
  // Returns a payment plan or null. Does not change state.
  planPayment(p, cost, x = 0, extra) {
    const need = {}; for (const k of MANA_KEYS) need[k] = cost[k] || 0;
    let generic = (cost.generic || 0) + x * (cost.x || 0) + ((extra && extra.generic) || 0);
    const pool = Object.assign({}, p.pool); const poolUse = {};
    for (const k of MANA_KEYS) { const u = Math.min(pool[k], need[k]); poolUse[k] = u; pool[k] -= u; need[k] -= u; }
    for (const k of MANA_KEYS) { if (generic <= 0) break; const u = Math.min(pool[k], generic); poolUse[k] += u; pool[k] -= u; generic -= u; }
    const sources = this.manaSources(p);
    const units = []; for (const k of MANA_KEYS) for (let i = 0; i < need[k]; i++) units.push(k);
    const match = new Array(sources.length).fill(-1);
    const tryAssign = (u, seen) => {
      for (let s = 0; s < sources.length; s++) {
        if (seen[s] || !sources[s].colors.includes(units[u])) continue;
        seen[s] = true;
        if (match[s] < 0 || tryAssign(match[s], seen)) { match[s] = u; return true; }
      }
      return false;
    };
    for (let u = 0; u < units.length; u++) if (!tryAssign(u, [])) return null;
    const w = this.colorWeights(p);
    const keep = (s) => s.colors.reduce((a, k) => a + (w[k] || 0), 0) + (this.isCreature(s.perm) ? 6 : 0) + (s.colors.length > 1 ? 0.7 : 0) + (s.perm.def.abilities.length > 1 ? 3 : 0);
    const free = []; for (let s = 0; s < sources.length; s++) if (match[s] < 0) free.push(s);
    if (free.length < generic) return null;
    free.sort((a, b) => keep(sources[a]) - keep(sources[b]));
    const taps = [];
    for (let s = 0; s < sources.length; s++) if (match[s] >= 0) taps.push({ src: sources[s], color: units[match[s]] });
    for (let i = 0; i < generic; i++) { const s = sources[free[i]]; taps.push({ src: s, color: s.colors.length === 1 ? s.colors[0] : s.colors.reduce((a, k) => ((w[k] || 0) < (w[a] || 0) ? k : a), s.colors[0]) }); }
    return { poolUse, taps };
  }
  canPay(p, cost, x = 0, extra) { return !!this.planPayment(p, cost, x, extra); }
  maxX(p, cost) { let x = 0; while (x < 30 && this.canPay(p, cost, x + 1)) x++; return this.canPay(p, cost, 0) ? x : -1; }
  execPlan(p, plan) {
    let spent = 0;
    for (const k of MANA_KEYS) { p.pool[k] -= plan.poolUse[k]; spent += plan.poolUse[k]; }
    for (const t of plan.taps) { this.tap(t.src.perm); spent++; this.emit('tapMana', { card: t.src.perm, color: t.color }); }
    p.stats.manaSpent += spent;
    this.touch();
  }
  availableMana(p) { return MANA_KEYS.reduce((a, k) => a + p.pool[k], 0) + this.manaSources(p).length; }
  addMana(p, color, n = 1) { p.pool[color] += n; }
  tapForMana(perm, srcInfo, color) {
    const p = this.players[perm.controller];
    this.tap(perm); p.pool[color]++; this.emit('tapMana', { card: perm, color });
  }

  /* ---------- timing helpers ---------- */
  isMain() { return this.step === 'main1' || this.step === 'main2'; }
  sorceryTiming(pi) { return this.active === pi && this.isMain() && this.stack.length === 0 && !this.over; }
  hasFlash(c) { return c.def.types.includes('Instant') || (c.def.kw || []).includes('flash'); }
  landPlayable(p, c) { return this.isLand(c) && this.sorceryTiming(p.idx) && p.landDrops > 0; }
  // Can `p` cast card `c` right now? Returns {ok, reason}
  canCast(p, c, zone = 'hand') {
    const d = c.def;
    if (this.isLand(c)) return { ok: this.landPlayable(p, c), reason: p.landDrops <= 0 ? 'Already played a land this turn' : 'Only in your main phase' };
    if (!this.hasFlash(c) && !this.sorceryTiming(p.idx)) return { ok: false, reason: this.active !== p.idx ? "Only on your turn" : 'Sorcery speed: main phase, empty stack' };
    if (this.over) return { ok: false, reason: 'Game over' };
    const co = d.costObj;
    if (d.canCast && !d.canCast(this, p, c)) return { ok: false, reason: 'No valid choice' };
    if (!this.canPay(p, co, 0)) return { ok: false, reason: 'Not enough mana' };
    // targets
    const specs = d.modes ? null : (d.aura ? [d.aura] : (d.targets || []));
    const ctx = { controller: p.idx, source: c };
    if (specs) { for (const s of specs) if (!s.optional && this.legalTargets(s, ctx).length < (s.min != null ? s.min : 1)) return { ok: false, reason: 'No legal target' }; }
    else if (!d.modes.some((m) => (m.targets || []).every((s) => s.optional || this.legalTargets(s, ctx).length > 0))) return { ok: false, reason: 'No legal target' };
    return { ok: true };
  }
  // Activated abilities
  abilityUsable(p, perm, idx) {
    const ab = perm.def.abilities[idx]; if (!ab || ab.mana) return { ok: false };
    const zone = ab.zone || 'battlefield';
    if (perm.zone !== zone) return { ok: false };
    if (perm.controller !== p.idx && zone === 'battlefield') return { ok: false };
    if (zone !== 'battlefield' && perm.owner !== p.idx) return { ok: false };
    if (ab.sorcery && !this.sorceryTiming(p.idx)) return { ok: false, reason: 'Sorcery speed' };
    if (ab.cond && !ab.cond(this, perm)) return { ok: false };
    const cost = ab.cost || {};
    if (cost.tap) { if (perm.tapped) return { ok: false, reason: 'Tapped' }; if (this.isCreature(perm) && this.isSick(perm)) return { ok: false, reason: 'Summoning sick' }; }
    if (cost.mana && !this.canPay(p, parseCost(cost.mana), 0)) return { ok: false, reason: 'Not enough mana' };
    if (cost.sacOther && !this.bf.some((c) => c.controller === p.idx && cost.sacOther.filter(this, c))) return { ok: false };
    if (cost.discard && p.hand.length < cost.discard) return { ok: false };
    if (cost.life && p.life <= cost.life) return { ok: false };
    const ctx = { controller: p.idx, source: perm };
    for (const s of ab.targets || []) if (!s.optional && this.legalTargets(s, ctx).length === 0) return { ok: false, reason: 'No legal target' };
    return { ok: true };
  }
  stackSpells() { return this.stack.filter((s) => s.kind === 'spell'); }

  /* ---------- events & triggers ---------- */
  emit(ev, data) {
    data.ev = ev;
    const listeners = this.bf.slice();
    if ((ev === 'dies' || ev === 'leave') && data.card && !listeners.includes(data.card)) listeners.push(data.card);
    for (const c of listeners) {
      const trs = c.def.triggers; if (!trs) continue;
      for (const t of trs) {
        if (t.ev !== ev) continue;
        const ctrlr = (ev === 'dies' || ev === 'leave') && data.card === c ? data.controller : c.controller;
        if (t.self && data.card !== c) continue;
        if (t.mine && data.player !== ctrlr && data.controller !== ctrlr) continue;
        if (t.theirs && (data.player === ctrlr || data.controller === ctrlr)) continue;
        if (t.cond && !t.cond(this, data, c)) continue;
        this.pending.push({ src: c, ctrl: ctrlr, t, data });
      }
    }
  }
  async flushTriggers() {
    if (!this.pending.length) return false;
    const list = this.pending; this.pending = [];
    const order = [this.active, 1 - this.active];
    for (const pi of order) {
      for (const tr of list.filter((x) => x.ctrl === pi)) {
        const ctx = { controller: pi, source: tr.src, data: tr.data };
        let targets = [];
        const specs = tr.t.targets || [];
        let fail = false;
        for (const s of specs) {
          const legal = this.legalTargets(s, ctx);
          if (!legal.length) { if (!s.optional) { fail = true; break; } targets.push(null); continue; }
          const ch = await this.ctrl(pi).chooseTargets(this, this.players[pi], s, { source: tr.src, legal, forced: true, label: tr.t.text || tr.src.name });
          targets.push(ch && ch[0] ? ch[0] : legal[0]);
        }
        if (fail) continue;
        this.stack.push({ id: ++this.ts, kind: 'trigger', source: tr.src, controller: pi, targets, specs, effect: tr.t.do, text: tr.t.text || '', data: tr.data, card: null });
        this.log(`${tr.src.name} triggers${tr.t.text ? ': ' + tr.t.text : ''}.`);
        this.fx('trigger', { card: tr.src });
      }
    }
    this.touch();
    return true;
  }
  async settle() {
    let loops = 0;
    while (loops++ < 50) {
      const sba = this.checkSBA();
      const trig = await this.flushTriggers();
      if (this.over) return;
      if (!sba && !trig) break;
    }
    this.changed();
  }
  checkSBA() {
    let any = false, again = true;
    while (again && !this.over) {
      again = false;
      for (const p of this.players) {
        if (p.life <= 0 || p.drewEmpty) { p.lost = true; }
      }
      if (this.players.some((p) => p.lost)) { this.endGame(); return true; }
      for (const c of this.bf.slice()) {
        if (c.zone !== 'battlefield') continue;
        if (this.isCreature(c)) {
          const t = this.toughness(c);
          if (t <= 0) { this.log(`${c.name} dies (toughness 0).`); this.moveTo(c, 'graveyard'); again = any = true; }
          else if ((c.damage >= t || (c.dt && c.damage > 0)) && !this.has(c, 'indestructible')) { this.log(`${c.name} dies.`); this.moveTo(c, 'graveyard'); again = any = true; }
        }
        if (c.def.aura && c.zone === 'battlefield') {
          const a = c.attachedTo;
          if (!a || a.zone !== 'battlefield' || (c.def.aura.filter && !c.def.aura.filter(this, a, { controller: c.controller, source: c })) || this.protectedFromAura(a, c)) {
            this.log(`${c.name} falls off.`); this.moveTo(c, 'graveyard'); again = any = true;
          }
        } else if (c.attachedTo && (!this.isCreature(c.attachedTo))) { this.attachedFix(c); again = any = true; }
      }
    }
    return any;
  }
  attachedFix(c) { const l = c.attachedTo.attachments; const i = l.indexOf(c); if (i >= 0) l.splice(i, 1); c.attachedTo = null; this.touch(); }
  protectedFromAura(a, aura) { for (const col of this.colorsOf(aura)) if (this.has(a, 'protection:' + col)) return true; return false; }
  endGame() {
    if (this.over) return;
    this.over = true;
    const lost = this.players.filter((p) => p.lost);
    if (lost.length === 2) { this.winner = -1; this.resultReason = 'Both players lose — a draw.'; }
    else {
      this.winner = 1 - lost[0].idx;
      const nm = lost[0].name, be = nm === 'You' ? 'are' : 'is';
      this.resultReason = lost[0].drewEmpty ? `${nm} tried to draw from an empty library.` : (lost[0].conceded ? `${nm} conceded.` : `${nm} ${be} at ${lost[0].life} life.`);
    }
    this.log('Game over: ' + (this.winner < 0 ? 'draw' : this.pn(this.winner) + ' wins') + '. ' + this.resultReason);
    this.changed();
  }
  concede(pi) { this.players[pi].lost = true; this.players[pi].conceded = true; this.endGame(); }

  /* ---------- casting ---------- */
  async playLand(p, c) {
    if (!this.landPlayable(p, c)) return false;
    p.landDrops--; this.log(`${p.name} plays ${c.name}.`);
    p.stats.cardsPlayed++;
    this.enter(c, p.idx, { from: 'hand' });
    this.fx('play', { card: c });
    return true;
  }
  async castSpell(p, c, opts = {}) {
    const ck = this.canCast(p, c, opts.zone || 'hand');
    if (!ck.ok) return false;
    const d = c.def; const ctrl = this.ctrl(p.idx);
    let modeIdx = null, specs = d.aura ? [d.aura] : (d.targets || []);
    if (d.modes) {
      const avail = d.modes.map((m, i) => ({ m, i })).filter(({ m }) => (m.targets || []).every((s) => s.optional || this.legalTargets(s, { controller: p.idx, source: c }).length > 0));
      modeIdx = avail.length === 1 ? avail[0].i : await ctrl.chooseMode(this, p, c, avail.map((a) => a.i));
      if (modeIdx == null) return false;
      specs = d.modes[modeIdx].targets || [];
    }
    const ctx = { controller: p.idx, source: c };
    const targets = [];
    for (const s of specs) {
      const legal = this.legalTargets(s, ctx);
      if (!legal.length) { if (s.optional) { targets.push(null); continue; } return false; }
      const ch = await ctrl.chooseTargets(this, p, s, { source: c, legal, label: c.name });
      if (!ch || !ch.length) return false;
      targets.push(...(s.count > 1 ? ch : [ch[0]]));
    }
    let x = 0;
    if (d.x) {
      const mx = this.maxX(p, d.costObj);
      if (mx < 0) return false;
      x = await ctrl.chooseX(this, p, c, mx);
      if (x == null) return false;
    }
    const plan = this.planPayment(p, d.costObj, x);
    if (!plan) return false;
    // all choices made — commit
    const hadFromHand = c.zone === 'hand';
    this.execPlan(p, plan);
    this.removeFromZone(c); c.zone = 'stack';
    const item = { id: ++this.ts, kind: 'spell', card: c, controller: p.idx, targets, specs, x, mode: modeIdx, countered: false };
    this.stack.push(item);
    p.stats.cardsPlayed++;
    this.log(`${p.name} casts ${c.name}${targets.filter(Boolean).length ? ' targeting ' + targets.filter(Boolean).map((t) => t.isPlayer ? t.name : t.card ? t.card.name : t.name).join(', ') : ''}${d.x ? ' (X=' + x + ')' : ''}.`);
    this.fx('cast', { item });
    this.touch();
    this.emit('cast', { card: c, controller: p.idx, item });
    return true;
  }
  async payAbilityCost(p, perm, cost) {
    // choose sacrifice first (can cancel)
    let sac = null;
    if (cost.sacOther) {
      const cands = this.bf.filter((c) => c.controller === p.idx && cost.sacOther.filter(this, c));
      const ch = await this.ctrl(p.idx).chooseCards(this, p, { prompt: 'Sacrifice a permanent', cards: cands, min: 1, max: 1, mode: 'sacrifice', source: perm });
      if (!ch.length) return null; sac = ch[0];
    }
    let discards = [];
    if (cost.discard) {
      discards = await this.ctrl(p.idx).chooseCards(this, p, { prompt: 'Discard a card', cards: p.hand.slice(), min: cost.discard, max: cost.discard, mode: 'discard', source: perm });
      if (discards.length < cost.discard) return null;
    }
    return { sac, discards };
  }
  async activate(p, perm, idx) {
    const ab = perm.def.abilities[idx];
    const ck = this.abilityUsable(p, perm, idx); if (!ck.ok) return false;
    const ctrl = this.ctrl(p.idx); const cost = ab.cost || {};
    const ctx = { controller: p.idx, source: perm };
    const targets = [];
    for (const s of ab.targets || []) {
      const legal = this.legalTargets(s, ctx);
      if (!legal.length) { if (s.optional) { targets.push(null); continue; } return false; }
      const ch = await ctrl.chooseTargets(this, p, s, { source: perm, legal, label: ab.text || perm.name });
      if (!ch || !ch.length) return false;
      targets.push(ch[0]);
    }
    let x = 0;
    if (ab.x) { const co = parseCost(cost.mana); const mx = this.maxX(p, co); x = await ctrl.chooseX(this, p, perm, mx); if (x == null) return false; }
    const paid = await this.payAbilityCost(p, perm, cost); if (!paid) return false;
    let plan = null;
    if (cost.mana) { plan = this.planPayment(p, parseCost(cost.mana), x); if (!plan) return false; }
    // commit
    if (plan) this.execPlan(p, plan);
    if (cost.tap) this.tap(perm);
    if (cost.life) this.loseLife(p.idx, cost.life);
    for (const d of paid.discards) { this.log(`${p.name} discards ${d.name}.`); this.moveTo(d, 'graveyard'); }
    if (paid.sac) this.sacrifice(paid.sac);
    if (cost.sacSelf) this.sacrifice(perm);
    const snapshot = { power: perm.zone === 'battlefield' ? this.power(perm) : 0 };
    this.stack.push({ id: ++this.ts, kind: 'ability', source: perm, controller: p.idx, targets, specs: ab.targets || [], effect: ab.do, text: ab.text || '', x, card: null, snapshot, sacrificed: paid.sac });
    this.log(`${p.name} activates ${perm.name}: ${ab.text || ''}`);
    this.fx('ability', { card: perm });
    this.touch();
    return true;
  }
  async activateMana(p, perm, srcIdx, color) {
    const info = this.manaSources(p).find((s) => s.perm === perm && s.idx === srcIdx);
    if (!info) return false;
    this.tapForMana(perm, info, color || info.colors[0]); this.changed(); return true;
  }

  /* ---------- resolution ---------- */
  specsOf(item) { return item.specs || []; }
  async resolveTop() {
    const it = this.stack.pop(); if (!it) return;
    const p = this.players[it.controller];
    const ctx = { src: it.card || it.source, controller: it.controller, source: it.card || it.source, me: p, opp: this.players[1 - it.controller], x: it.x || 0, mode: it.mode, item: it, g: this, data: it.data, sacrificed: it.sacrificed, snapshot: it.snapshot };
    // re-validate targets
    let any = !it.specs.length, t = it.targets.slice();
    if (it.specs.length) {
      let ti = 0;
      for (const s of it.specs) {
        const n = s.count > 1 ? Math.min(s.count, t.length - ti) : 1;
        for (let k = 0; k < n; k++, ti++) {
          const tg = t[ti]; if (!tg) continue;
          let ok;
          if (tg.isPlayer) ok = this.legalTargets(s, { controller: it.controller, source: ctx.source }).includes(tg);
          else if (tg.kind === 'spell') ok = this.stack.includes(tg) && !tg.countered;
          else ok = tg.zone === (s.kind === 'graveyard' ? 'graveyard' : 'battlefield') && this.legalTargets(s, { controller: it.controller, source: ctx.source }).includes(tg);
          if (ok) any = true; else t[ti] = null;
        }
      }
    }
    ctx.t = t;
    if (it.kind === 'spell') {
      const c = it.card; const d = c.def;
      if (it.countered) { this.moveTo(c, 'graveyard'); this.log(`${c.name} is put into the graveyard.`); return; }
      if (!any) { this.log(`${c.name} fizzles (no legal target).`); this.moveTo(c, 'graveyard'); return; }
      this.log(`${c.name} resolves.`);
      this.fx('resolve', { card: c });
      const permanent = d.types.some((x) => ['Creature', 'Artifact', 'Enchantment', 'Land'].includes(x));
      if (permanent) {
        if (d.aura) {
          const tgt = t[0];
          if (!tgt || tgt.zone !== 'battlefield') { this.moveTo(c, 'graveyard'); return; }
          this.enter(c, it.controller, { attachTo: tgt, from: 'stack' });
        } else this.enter(c, it.controller, { from: 'stack' });
        if (d.onCast) await d.onCast(this, ctx);
      } else {
        const fn = d.modes ? d.modes[it.mode].resolve : d.resolve;
        if (fn) await fn(this, ctx);
        if (c.zone === 'stack') { if (d.exileAfter) this.moveTo(c, 'exile'); else this.moveTo(c, 'graveyard'); }
      }
    } else {
      if (!any) return;
      if (it.effect) await it.effect(this, ctx);
    }
    this.touch();
  }

  /* ---------- priority ---------- */
  async priority() {
    await this.settle(); if (this.over) return;
    let passes = 0, cur = this.active, fails = 0;
    while (!this.over) {
      this.priorityPlayer = cur; this.changed();
      let act = await this.ctrl(cur).priority(this, this.players[cur]);
      if (this.over) return;
      if (fails >= 3) { act = { type: 'pass' }; fails = 0; }
      if (!act || act.type === 'pass') {
        fails = 0;
        passes++;
        if (passes >= 2) {
          if (this.stack.length) {
            await this.resolveTop(); await this.settle(); if (this.over) return;
            await this.pause(350);
            passes = 0; cur = this.active; continue;
          }
          return;
        }
        cur = 1 - cur; continue;
      }
      let ok = false;
      const p = this.players[cur];
      if (act.type === 'land') ok = await this.playLand(p, act.card);
      else if (act.type === 'cast') ok = await this.castSpell(p, act.card);
      else if (act.type === 'activate') ok = await this.activate(p, act.perm, act.idx);
      else if (act.type === 'mana') ok = await this.activateMana(p, act.perm, act.srcIdx, act.color);
      else if (act.type === 'concede') { this.concede(cur); return; }
      await this.settle();
      if (ok) { passes = 0; fails = 0; await this.pause(act.type === 'mana' ? 0 : 450); } else fails++;
    }
  }

  /* ---------- turn structure ---------- */
  setStep(s) {
    this.step = s;
    for (const p of this.players) p.pool = emptyPool();
    this.changed();
  }
  async start() {
    const first = this.rng() < 0.5 ? 0 : 1; this.firstPlayer = first; this.active = first;
    for (const p of this.players) this.shuffle(p.library);
    this.log(`${this.pn(first)} goes first.`);
    // London mulligan
    const keep = [false, false], mulls = [0, 0];
    for (const p of this.players) { this.drawCards(p.idx, 7); }
    this.setStep('setup');
    const order = [first, 1 - first];
    for (const pi of order) {
      const p = this.players[pi];
      while (mulls[pi] < 6) {
        this.changed();
        const k = await this.ctrl(pi).mulligan(this, p, p.hand.slice(), mulls[pi]);
        if (k) break;
        mulls[pi]++;
        this.log(`${p.name} takes a mulligan (${mulls[pi]}).`);
        for (const c of p.hand.slice()) this.moveTo(c, 'library');
        this.shuffle(p.library); this.drawCards(pi, 7);
      }
      if (mulls[pi] > 0) {
        const n = mulls[pi];
        const ch = await this.ctrl(pi).chooseCards(this, p, { prompt: `Put ${n} card${n > 1 ? 's' : ''} on the bottom of your library`, cards: p.hand.slice(), min: n, max: n, mode: 'bottom' });
        for (const c of ch) this.moveTo(c, 'library', { bottom: true });
        this.log(`${p.name} keeps ${7 - n} cards.`);
      }
    }
    this.touch();
  }
  async run() {
    await this.start();
    while (!this.over) {
      await this.takeTurn();
      if (this.turnNo > 200) { this.log('Turn limit reached — draw.'); this.winner = -1; this.over = true; this.resultReason = 'Turn limit.'; }
    }
    return this.winner;
  }
  async takeTurn() {
    this.turnNo++;
    if (this.turnNo > 1) this.active = 1 - this.active;
    const ap = this.players[this.active]; const ai = this.active;
    this.lastTurn[ai] = this.turnNo;
    ap.landDrops = 1; this.combat = null;
    this.log(`— Turn ${this.turnNo}: ${ap.name} —`);
    this.fx('turn', { player: ai });
    const ts = { turn: this.turnNo, player: ai, landPlayed: false, avail: 0, spent0: ap.stats.manaSpent };
    // untap
    this.setStep('untap');
    for (const c of this.bf) if (c.controller === ai) {
      if (c.flags.skipUntap > 0) { c.flags.skipUntap--; continue; }
      c.tapped = false;
    }
    this.touch();
    // upkeep
    this.setStep('upkeep'); this.emit('upkeep', { player: ai }); await this.settle(); await this.priority(); if (this.over) return;
    // draw
    this.setStep('draw');
    if (!(this.turnNo === 1)) this.drawCards(ai, 1);
    this.emit('drawStep', { player: ai });
    await this.settle(); await this.priority(); if (this.over) return;
    // main 1
    this.setStep('main1'); await this.settle();
    const landsBefore = this.lands(ai).length;
    await this.priority(); if (this.over) return;
    // combat
    await this.combatPhase(); if (this.over) return;
    // main 2
    this.setStep('main2'); await this.settle(); await this.priority(); if (this.over) return;
    // end
    this.setStep('end'); this.emit('endStep', { player: ai }); await this.settle();
    ts.avail = this.manaSources({ idx: ai, pool: emptyPool() }).length + this.bf.filter((c) => c.controller === ai && c.tapped && c.def.abilities && c.def.abilities.some((a) => a.mana)).length;
    ap.stats.manaAvail += ts.avail; ts.spent = ap.stats.manaSpent - ts.spent0;
    ts.landPlayed = ap.landDrops === 0;
    if (!ts.landPlayed && ap.hand.some((c) => this.isLand(c))) ap.stats.missedLands++;
    ts.lands = this.lands(ai).length; ap.stats.turns.push(ts);
    await this.priority(); if (this.over) return;
    // cleanup
    this.setStep('cleanup');
    const over = ap.hand.length - 7;
    if (over > 0) await this.discard(ai, over);
    for (const c of this.bf) {
      c.damage = 0; c.dt = false;
      c.temp = c.temp.filter((e) => e.until !== 'eot');
      if (c.controlTemp) { c.controller = c.controlTemp.back; c.controlTemp = null; c.summonedTurn = this.turnNo; }
    }
    this.touch();
    await this.settle();
  }

  /* ---------- combat ---------- */
  canAttack(c) {
    if (!this.isCreature(c) || c.zone !== 'battlefield' || c.controller !== this.active) return false;
    if (c.tapped || this.isSick(c)) return false;
    if (this.has(c, 'defender') || this.has(c, 'cantAttack')) return false;
    return true;
  }
  canBlock(b, a) {
    if (!this.isCreature(b) || b.tapped || b.controller === a.controller || b.zone !== 'battlefield') return false;
    if (this.has(b, 'cantBlock')) return false;
    if (this.has(a, 'flying') && !this.has(b, 'flying') && !this.has(b, 'reach')) return false;
    if (this.has(a, 'unblockable')) return false;
    for (const c of this.colorsOf(b)) if (this.has(a, 'protection:' + c)) return false;
    return true;
  }
  cvalue(c) { const ch = this.chars(c); return ch.power * 1.5 + ch.toughness + (ch.kw.has('flying') ? 1.5 : 0) + (ch.kw.has('deathtouch') ? 2 : 0) + (ch.kw.has('lifelink') ? 1 : 0) + (ch.kw.has('first strike') ? 1 : 0); }
  async combatPhase() {
    const ai = this.active, di = 1 - ai, ap = this.players[ai], dp = this.players[di];
    this.combat = { attackers: [] };
    this.setStep('begin'); this.emit('beginCombat', { player: ai }); await this.settle(); await this.priority(); if (this.over) return;
    this.setStep('attackers');
    const possible = this.bf.filter((c) => this.canAttack(c));
    let chosen = [];
    if (possible.length) {
      chosen = await this.ctrl(ai).declareAttackers(this, ap, possible);
      chosen = chosen.filter((c) => possible.includes(c));
      for (const c of possible) if (this.has(c, 'attacksEachCombat') && !chosen.includes(c)) chosen.push(c);
    }
    if (!chosen.length) { this.combat = null; this.log(`${ap.name} does not attack.`); this.setStep('endCombat'); return; }
    for (const c of chosen) {
      if (!this.has(c, 'vigilance')) c.tapped = true;
      this.combat.attackers.push({ card: c, blockers: [], blocked: false });
    }
    this.log(`${ap.name} attacks with ${chosen.map((c) => c.name).join(', ')}.`);
    this.touch();
    for (const c of chosen) this.emit('attacks', { card: c, controller: ai });
    await this.settle(); await this.pause(500); await this.priority(); if (this.over) return;
    // blockers
    this.combat.attackers = this.combat.attackers.filter((a) => a.card.zone === 'battlefield');
    this.setStep('blockers');
    const atkCards = this.combat.attackers.map((a) => a.card);
    const blockersPoss = this.bf.filter((b) => b.controller === di && this.isCreature(b) && !b.tapped && !this.has(b, 'cantBlock'));
    let pairs = [];
    if (atkCards.length && blockersPoss.length) pairs = await this.ctrl(di).declareBlockers(this, dp, atkCards, blockersPoss);
    const usedB = new Set();
    for (const [b, a] of pairs) {
      const rec = this.combat.attackers.find((x) => x.card === a);
      if (!rec || usedB.has(b) || !blockersPoss.includes(b) || !this.canBlock(b, a)) continue;
      usedB.add(b); rec.blockers.push(b); rec.blocked = true;
    }
    for (const rec of this.combat.attackers) {
      if (rec.blockers.length === 1 && this.has(rec.card, 'menace')) { rec.blockers = []; rec.blocked = false; }
      if (rec.blockers.length) this.log(`${rec.blockers.map((b) => b.name).join(' & ')} blocks ${rec.card.name}.`);
    }
    for (const rec of this.combat.attackers) for (const b of rec.blockers) this.emit('blocks', { card: b, attacker: rec.card, controller: di });
    await this.settle(); await this.pause(500); await this.priority(); if (this.over) return;
    // damage steps
    const anyFS = this.combat.attackers.some((r) => this.has(r.card, 'first strike') || this.has(r.card, 'double strike') || r.blockers.some((b) => this.has(b, 'first strike') || this.has(b, 'double strike')));
    if (anyFS) {
      this.setStep('firstStrike'); await this.combatDamage(true); await this.settle(); await this.pause(350); await this.priority(); if (this.over) return;
    }
    this.setStep('damage'); await this.combatDamage(false); await this.settle(); await this.pause(500); await this.priority(); if (this.over) return;
    this.setStep('endCombat'); await this.settle(); await this.priority();
    this.combat = null;
  }
  async combatDamage(fsStep) {
    const strikes = (c) => {
      const f = this.has(c, 'first strike') || this.has(c, 'double strike');
      const ds = this.has(c, 'double strike');
      return fsStep ? f : (!f || ds);
    };
    const ops = [];   // [source, target, amount]
    for (const rec of this.combat.attackers) {
      const a = rec.card;
      const blockers = rec.blockers.filter((b) => b.zone === 'battlefield');
      if (a.zone === 'battlefield' && strikes(a)) {
        const pw = this.power(a);
        if (pw > 0) {
          const defender = this.players[1 - a.controller];
          if (!rec.blocked) ops.push([a, defender, pw]);
          else if (!blockers.length) { if (this.has(a, 'trample')) ops.push([a, defender, pw]); }
          else {
            const ordered = blockers.slice().sort((x, y) => this.cvalue(y) / Math.max(1, this.toughness(y) - y.damage) - this.cvalue(x) / Math.max(1, this.toughness(x) - x.damage));
            let left = pw;
            for (let i = 0; i < ordered.length; i++) {
              const b = ordered[i];
              const lethal = this.has(a, 'deathtouch') ? 1 : Math.max(1, this.toughness(b) - b.damage);
              let give = i === ordered.length - 1 && !this.has(a, 'trample') ? left : Math.min(left, lethal);
              if (give > 0) { ops.push([a, b, give]); left -= give; }
            }
            if (left > 0 && this.has(a, 'trample')) ops.push([a, defender, left]);
          }
        }
      }
      for (const b of blockers) {
        if (strikes(b) && b.zone === 'battlefield' && a.zone === 'battlefield') { const pw = this.power(b); if (pw > 0) ops.push([b, a, pw]); }
      }
    }
    // damage is dealt simultaneously: precompute lifelink etc by applying in order
    for (const [s, t, n] of ops) this.dealDamage(s, t, n, { combat: true });
    this.touch();
    for (const [s, t, n] of ops) if (t.isPlayer) this.emit('combatDamage', { card: s, player: t.idx, n, controller: s.controller });
  }
}
MTG.Game = Game;
MTG.sleep = sleep;
})();
