'use strict';
/* Game UI + the human player's controller. */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const { Brain, Coach, Images } = MTG;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const COLOR_HEX = { W: '#f4edcf', U: '#2f80d8', B: '#6a5a78', R: '#d9553f', G: '#3fa564', C: '#a9a9b3' };

/* ---------- settings ---------- */
const Settings = {
  hints: true, images: true, speed: 'normal', confirmEnd: true, stopEnd: true,
  load() { try { Object.assign(Settings, JSON.parse(localStorage.getItem('magicduel.settings') || '{}')); } catch (e) { /* ignore */ } Images.enabled = Settings.images; },
  save() { try { localStorage.setItem('magicduel.settings', JSON.stringify({ hints: Settings.hints, images: Settings.images, speed: Settings.speed, confirmEnd: Settings.confirmEnd, stopEnd: Settings.stopEnd })); } catch (e) { /* ignore */ } Images.enabled = Settings.images; },
  pace() { return { slow: 1.7, normal: 1, fast: 0.35 }[Settings.speed] || 1; },
};
MTG.Settings = Settings;

/* ---------- text helpers ---------- */
const KW_NAMES = { 'first strike': 'First strike', 'double strike': 'Double strike', flying: 'Flying', deathtouch: 'Deathtouch', lifelink: 'Lifelink', trample: 'Trample', vigilance: 'Vigilance', haste: 'Haste', reach: 'Reach', menace: 'Menace', defender: 'Defender', hexproof: 'Hexproof', indestructible: 'Indestructible', flash: 'Flash', cantBlock: "Can't block", cantAttack: "Can't attack", attacksEachCombat: 'Attacks each combat if able', 'hexproofFrom:B': 'Hexproof from black' };
const kwText = (kws) => kws.map((k) => KW_NAMES[k] || k).join(', ');
function rulesText(d) {
  if (d.text) return d.text;
  const k = (d.kw || []).filter((x) => KW_NAMES[x]);
  return k.length ? kwText(k) + '.' : '';
}
function costHTML(cost) {
  if (!cost) return '';
  return cost.replace(/[0-9]+|[WUBRGCX]/g, (m) => /\d|X/.test(m) ? `<b class="cn">${m}</b>` : `<span class="pip ${m}"></span>`);
}
const typeLine = (d) => [...d.types, ...(d.subtypes && d.subtypes.length ? ['—', ...d.subtypes] : [])].join(' ') + (d.basic ? '' : '');
const faceClass = (d) => { if (d.types.includes('Land')) return 'L'; const cs = d.colors; if (cs.length === 0) return 'A'; if (cs.length > 1) return 'M'; return cs[0]; };

/* ---------- UI singleton ---------- */
const UI = {
  g: null, cardEls: new Map(), landEls: new Map(), mode: 'idle', renderQueued: false, highlight: new Set(), logLines: [], coachNotes: [],
  priorityResolve: null, advice: null, advCtx: null, lastAdviceKey: '', gameOver: false, dialogs: [], human: null,

  /* ----- basic infra ----- */
  toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(UI._tt); UI._tt = setTimeout(() => t.classList.add('hidden'), ms || 2600); },
  showScreen(id) { document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + id)); UI.screen = id; },
  modal(opts) {
    const root = $('#modal-root');
    const m = el('div', 'modal' + (opts.center ? ' center' : ''));
    const sheet = el('div', 'sheet');
    if (opts.title != null) {
      const h = el('header'); h.append(el('h3', '', opts.title));
      if (opts.closable !== false) { const x = el('button', 'xbtn', '✕'); x.onclick = () => close(null); h.append(x); }
      sheet.append(h);
    }
    const body = el('div', 'body'); if (opts.body instanceof Node) body.append(opts.body); else if (opts.body) body.innerHTML = opts.body; sheet.append(body);
    let footer = null;
    if (opts.buttons) { footer = el('footer'); for (const b of opts.buttons) { const bt = el('button', 'btn ' + (b.cls || ''), b.label); if (b.disabled) bt.disabled = true; bt.onclick = () => { if (b.keep) { b.onclick && b.onclick(close, bt); } else close(b.value, b); }; footer.append(bt); } sheet.append(footer); }
    m.append(sheet); root.append(m);
    let resolve; const p = new Promise((r) => (resolve = r));
    const close = (v) => { if (!m.isConnected) return; m.remove(); UI.dialogs = UI.dialogs.filter((d) => d.m !== m); resolve(v); if (opts.onClose) opts.onClose(v); };
    if (opts.closable !== false) m.addEventListener('click', (e) => { if (e.target === m) close(null); });
    UI.dialogs.push({ m, close });
    return { m, sheet, body, footer, close, promise: p };
  },
  closeTopDialog() { const d = UI.dialogs[UI.dialogs.length - 1]; if (d) { d.close(null); return true; } return false; },
  sleep,

  /* ----- card elements ----- */
  makeFace(d) {
    const f = el('div', 'face ' + faceClass(d) + (d.token ? ' token' : ''));
    f.innerHTML = `<div class="fname">${esc(d.name)}</div><div class="fcost">${esc(d.cost || '')}</div><div class="ftype">${esc(d.token ? 'Token ' + d.types.join(' ') : d.types.join(' '))}</div><div class="ftext">${esc(rulesText(d))}</div>`;
    return f;
  },
  buildCardEl(c, opts) {
    opts = opts || {}; const d = c.def;
    const e = el('div', 'card'); e.dataset.id = c.id;
    const img = el('img', 'art'); img.alt = ''; img.draggable = false;
    e.append(UI.makeFace(d), img);
    if (!d.token && Images.enabled) { img.dataset.name = d.name; Images.attach(img, d.name, opts.big ? 'normal' : 'small', (ok) => { if (ok) e.classList.add('has-art'); }); }
    e.append(el('div', 'mark'));
    return e;
  },
  cardEl(c) {
    let e = UI.cardEls.get(c.id);
    if (!e) {
      e = UI.buildCardEl(c); UI.cardEls.set(c.id, e);
      let timer = null, moved = false;
      e.addEventListener('pointerdown', (ev) => { moved = false; timer = setTimeout(() => { timer = null; UI.inspect(c.card || c, {}); }, 520); });
      e.addEventListener('pointermove', () => { if (timer) { moved = true; } });
      const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
      e.addEventListener('pointerleave', cancel); e.addEventListener('pointercancel', cancel);
      e.addEventListener('pointerup', (ev) => { if (timer) { clearTimeout(timer); timer = null; UI.onCardTap(c); } });
      e.addEventListener('contextmenu', (ev) => ev.preventDefault());
    }
    return e;
  },
  updateCardEl(e, c, inHand) {
    const g = UI.g, d = c.def;
    for (const b of [...e.querySelectorAll('.badge,.zz,.tag')]) b.remove();
    const onBf = c.zone === 'battlefield';
    e.classList.toggle('tapped', onBf && c.tapped);
    e.classList.toggle('attached', onBf && !!c.attachedTo);
    if (onBf && g.isCreature(c)) {
      const ch = g.chars(c); const base = [d.power || 0, d.toughness || 0];
      const t = ch.toughness - c.damage;
      const b = el('div', 'badge pt' + (c.damage ? ' dmg' : ch.power > base[0] || ch.toughness > base[1] ? ' buff' : ch.power < base[0] || ch.toughness < base[1] ? ' nerf' : ''), `${ch.power}/${t}`);
      e.append(b);
      if (g.isSick(c) && c.controller === 0) e.append(el('div', 'zz', '💤'));
    }
    const cn = Object.entries(c.counters).filter(([, v]) => v);
    if (onBf && cn.length) e.append(el('div', 'badge cnt', cn.map(([k, v]) => (k === 'p1p1' ? '+' + v : k === 'm1m1' ? '-' + v : v + k)).join(' ')));
    if (onBf && c.flags.skipUntap > 0) e.append(el('div', 'zz', '❄️'));
    e.classList.toggle('legal', UI.mode === 'target' && UI.legalSet.has(c));
    e.classList.toggle('rec', UI.highlight.has(c.id));
    e.classList.toggle('sel', UI.mode === 'block' && UI.activeBlocker === c);
    e.classList.toggle('atk', (UI.mode === 'attack' && UI.atkSet.has(c)) || (UI.mode === 'block' && UI.blockAtk && UI.blockAtk.has(c)));
    e.classList.remove('castable', 'unplayable');
    if (inHand) {
      const p = g.players[0];
      const ok = UI.mode === 'priority' && g.canCast(p, c).ok;
      e.classList.toggle('castable', ok); e.classList.toggle('unplayable', !ok);
    }
    // attack/block tags
    if (UI.mode === 'attack' && UI.atkSet.has(c)) e.append(el('div', 'tag', 'ATTACK'));
    if (UI.mode === 'block' && UI.blockMap) {
      const bl = [...UI.blockMap.entries()].filter(([, a]) => a === c).length;
      if (bl) e.append(el('div', 'tag blk', 'BLOCKED ×' + bl));
      if (UI.blockMap.has(c)) e.append(el('div', 'tag blk', 'BLOCKS ' + UI.blockMap.get(c).name.split(' ')[0]));
    }
    if (g.combat && onBf && g.combat.attackers.some((a) => a.card === c)) e.classList.add('attacking'); else e.classList.remove('attacking');
  },
  landEl(c) {
    let e = UI.landEls.get(c.id);
    if (!e) {
      const d = c.def; const cols = d.dual ? d.dual.split('') : (d.basic ? [d.abilities[0].mana.colors[0]] : []);
      let cls = 'land ', txt = '';
      if (cols.length === 1) { cls += cols[0]; txt = cols[0]; } else if (cols.length === 2) { cls += 'D'; txt = ''; } else { cls += 'X'; txt = '◆'; }
      e = el('div', cls, txt); if (cols.length === 2) { e.style.setProperty('--d1', COLOR_HEX[cols[0]]); e.style.setProperty('--d2', COLOR_HEX[cols[1]]); }
      e.addEventListener('click', () => UI.onCardTap(c));
      UI.landEls.set(c.id, e);
    }
    e.classList.toggle('tapped', c.tapped);
    return e;
  },

  /* ----- rendering ----- */
  scheduleRender() { if (UI.renderQueued) return; UI.renderQueued = true; requestAnimationFrame(() => { UI.renderQueued = false; UI.render(); }); },
  render() {
    const g = UI.g; if (!g) return;
    UI.renderBars(); UI.renderPhases(); UI.renderStack();
    UI.renderField(1, $('#oppPerms'), $('#oppLands')); UI.renderField(0, $('#myPerms'), $('#myLands'));
    UI.renderHand(); UI.renderButtons(); UI.renderCoachLine();
  },
  renderBars() {
    const g = UI.g;
    for (const [pi, id] of [[1, '#oppBar'], [0, '#myBar']]) {
      const p = g.players[pi], bar = $(id);
      const legal = UI.mode === 'target' && UI.legalSet.has(p);
      bar.classList.toggle('legal', legal);
      let mana = '';
      if (pi === 0) {
        const tally = {}; for (const s of g.manaSources(p)) { const k = s.colors.length === 1 ? s.colors[0] : s.colors.join(''); tally[k] = (tally[k] || 0) + 1; }
        mana = '<div class="manaline">' + Object.entries(tally).map(([k, v]) => `<span class="mchip"><i style="background:${k.length === 1 ? COLOR_HEX[k] : `linear-gradient(135deg,${COLOR_HEX[k[0]]} 50%,${COLOR_HEX[k[1] || k[0]]} 50%)`}"></i>${v}</span>`).join('') + (Object.keys(tally).length ? '' : '<span class="stat">no mana</span>') + '</div>';
        const pool = Object.entries(p.pool).filter(([, v]) => v > 0); if (pool.length) mana = mana.replace('</div>', pool.map(([k, v]) => `<span class="mchip">pool ${k}${v}</span>`).join('') + '</div>');
      }
      bar.innerHTML = `<span class="name">${esc(p.name)}</span><span class="life" data-p="${pi}">♥ ${p.life}</span>` +
        (pi === 1 ? `<span class="stat">🖐 <b>${p.hand.length}</b></span>` : '') +
        `<span class="stat">📚 <b>${p.library.length}</b></span><span class="stat link" data-gy="${pi}">🪦 <b>${p.graveyard.length}</b></span>${p.exile.length ? `<span class="stat">✨ <b>${p.exile.length}</b></span>` : ''}` + mana;
      bar.querySelector('.life').onclick = () => UI.onPlayerTap(pi);
      const gy = bar.querySelector('[data-gy]'); gy.onclick = () => UI.showGraveyard(pi);
      if (UI.lastLife[pi] != null && UI.lastLife[pi] !== p.life) bar.querySelector('.life').classList.toggle('up', p.life > UI.lastLife[pi]);
      UI.lastLife[pi] = p.life;
    }
  },
  lastLife: [null, null],
  renderPhases() {
    const g = UI.g, box = $('#phases');
    const groups = [['upkeep', 'Upkeep', ['upkeep']], ['draw', 'Draw', ['draw']], ['main1', 'Main 1', ['main1']], ['begin', 'Combat', ['begin', 'attackers', 'blockers', 'firstStrike', 'damage', 'endCombat']], ['main2', 'Main 2', ['main2']], ['end', 'End', ['end', 'cleanup']]];
    const mine = g.active === 0;
    box.innerHTML = `<span class="turnlbl ${mine ? 'mine' : 'theirs'}">${g.over ? 'OVER' : (mine ? 'YOU' : 'OPP') + ' · T' + Math.ceil(g.turnNo / 2)}</span>` + groups.map(([k, label, steps]) => `<span class="ph ${steps.includes(g.step) ? 'cur' : ''}">${label}</span>`).join('');
  },
  renderStack() {
    const g = UI.g, box = $('#stackBox'); box.innerHTML = '';
    for (const it of g.stack.slice().reverse()) {
      const name = it.kind === 'spell' ? it.card.name : it.source.name;
      const tg = (it.targets || []).filter(Boolean).map((t) => t.isPlayer ? t.name : t.kind === 'spell' ? t.card.name : t.name);
      const chip = el('div', 'sitem' + (it.controller === 0 ? '' : ' theirs') + (UI.mode === 'target' && UI.legalSet.has(it) ? ' legal' : ''), `<b>${it.kind === 'spell' ? '⚡' : '✦'} ${esc(name)}</b>${it.kind !== 'spell' ? `<span>${esc(it.text || '')}</span>` : ''}${tg.length ? `<span>→ ${esc(tg.join(', '))}</span>` : ''}`);
      chip.onclick = () => { if (UI.mode === 'target' && UI.legalSet.has(it)) UI.pickTarget(it); else UI.inspect(it.card || it.source, {}); };
      box.append(chip);
    }
  },
  fieldCards(pi) {
    const g = UI.g;
    const perms = g.bf.filter((c) => c.controller === pi && !g.isLand(c));
    const roots = perms.filter((c) => !c.attachedTo);
    roots.sort((a, b) => (g.isCreature(b) ? 1 : 0) - (g.isCreature(a) ? 1 : 0));
    const out = [];
    for (const r of roots) { out.push(r); for (const a of r.attachments) if (a.controller === pi) out.push(a); }
    for (const c of perms) if (!out.includes(c)) out.push(c);
    return out;
  },
  renderField(pi, permsBox, landsBox) {
    const g = UI.g;
    const cards = UI.fieldCards(pi);
    const want = new Set();
    for (const c of cards) { const e = UI.cardEl(c); UI.updateCardEl(e, c, false); permsBox.append(e); want.add(e); }
    for (const e of [...permsBox.children]) if (!want.has(e)) e.remove();
    const lands = g.lands(pi); const lw = new Set();
    for (const c of lands) { const e = UI.landEl(c); landsBox.append(e); lw.add(e); }
    for (const e of [...landsBox.children]) if (!lw.has(e)) e.remove();
  },
  renderHand() {
    const g = UI.g, p = g.players[0], box = $('#hand');
    const cards = p.hand.slice().sort((a, b) => (g.isLand(a) - g.isLand(b)) || (a.def.cmc - b.def.cmc) || a.name.localeCompare(b.name));
    const want = new Set();
    for (const c of cards) { const e = UI.cardEl(c); UI.updateCardEl(e, c, true); box.append(e); want.add(e); }
    for (const e of [...box.children]) if (!want.has(e)) e.remove();
    const wrap = $('#handWrap'), n = cards.length;
    if (n) {
      const w = box.firstElementChild.offsetWidth || 70, avail = wrap.clientWidth - 20;
      const need = n * w + (n - 1) * 4, overlap = n > 1 && need > avail ? (need - avail) / (n - 1) : 0;
      cards.forEach((c, i) => { UI.cardEl(c).style.marginLeft = i && overlap ? `-${overlap.toFixed(1)}px` : ''; });
    }
  },
  possibleAttackers() { const g = UI.g; return g.bf.filter((c) => g.canAttack(c)); },
  renderButtons() {
    const g = UI.g, b = $('#btnMain'), pb = $('#promptBar');
    let label = '…', disabled = true, cls = 'primary';
    const m = UI.mode;
    if (g.over) { label = 'Game over'; }
    else if (m === 'priority') {
      disabled = false;
      if (g.stack.length) { const top = g.stack[g.stack.length - 1]; label = top.controller === 0 ? 'Resolve ▶' : 'Let it resolve ▶'; }
      else if (g.active === 0) { label = g.step === 'main1' ? (UI.possibleAttackers().length ? 'Combat ▶' : 'Main 2 ▶') : g.step === 'main2' ? 'End turn ▶' : 'Continue ▶'; }
      else label = 'Pass ▶';
    } else if (m === 'attack') { disabled = false; label = UI.atkSet.size ? `Attack (${UI.atkSet.size}) ▶` : 'No attack ▶'; }
    else if (m === 'block') { disabled = false; label = UI.blockMap.size ? `Block (${UI.blockMap.size}) ▶` : 'No blocks ▶'; }
    else if (m === 'target') { disabled = !UI.targetCancel; label = 'Cancel'; cls = ''; }
    else { label = g.active === 0 ? 'Your turn' : 'Opponent…'; }
    b.textContent = label; b.disabled = disabled; b.className = cls;
    if (!UI.promptText) pb.classList.add('hidden');
  },
  setPrompt(text, buttons) {
    const pb = $('#promptBar'); UI.promptText = text;
    if (!text) { pb.classList.add('hidden'); pb.innerHTML = ''; return; }
    pb.classList.remove('hidden'); pb.innerHTML = '';
    pb.append(el('div', 'ptxt', text));
    for (const bt of buttons || []) { const x = el('button', bt.cls || '', bt.label); x.onclick = bt.onclick; pb.append(x); }
  },

  /* ----- coach ----- */
  setAdviceCtx(kind, args) { UI.advCtx = { kind, args }; UI.lastAdviceKey = ''; UI.refreshAdvice(); },
  getAdvice() {
    const g = UI.g, c = UI.advCtx; if (!g || !c) return null;
    const p = g.players[0];
    try {
      switch (c.kind) {
        case 'mulligan': return Coach.adviseMulligan(g, p, c.args.hand, c.args.n);
        case 'main': return Coach.adviseMain(g, p);
        case 'respond': return Coach.adviseResponse(g, p);
        case 'attack': return Coach.adviseAttack(g, p, c.args.possible);
        case 'block': return Coach.adviseBlock(g, p, c.args.atk, c.args.blk);
        case 'target': return Coach.adviseTarget(g, p, c.args.spec, c.args.o);
        case 'scry': return Coach.adviseScry(g, p, c.args.cards);
        case 'discard': return Coach.adviseDiscard(g, p, c.args.cards, c.args.n);
        default: return null;
      }
    } catch (e) { console.error(e); return null; }
  },
  refreshAdvice() {
    const g = UI.g; if (!g) return;
    const key = UI.advCtx ? UI.advCtx.kind + '|' + g.ver + '|' + g.stack.length + '|' + g.step : 'none';
    if (key === UI.lastAdviceKey) return; UI.lastAdviceKey = key;
    UI.advice = UI.advCtx ? UI.getAdvice() : null;
    UI.highlight = new Set(Settings.hints && UI.advice ? UI.advice.highlight : []);
  },
  renderCoachLine() {
    const g = UI.g, line = $('#coachLine'); UI.refreshAdvice();
    if (UI.mode === 'idle' || !UI.advice) { line.innerHTML = g.over ? '' : (g.active === 0 ? '' : '<span style="color:var(--muted)">Opponent is playing…</span>'); return; }
    if (!Settings.hints) { line.innerHTML = '<span style="color:var(--muted)">Tap 💡 for coach advice</span>'; return; }
    line.innerHTML = `<b>Coach:</b> ${esc(UI.advice.headline)}`;
  },
  showCoach() {
    const g = UI.g; UI.lastAdviceKey = ''; UI.refreshAdvice();
    const a = UI.advice; const body = el('div', 'coach');
    if (!a) body.innerHTML = `<div class="head">Coach</div><p>Nothing to decide right now. ${g && g.active !== 0 ? 'The opponent is playing; I\'ll advise when you can act.' : ''}</p>`;
    else {
      let h = `<div class="head">${esc(a.headline)}</div>`;
      if (a.state) h += `<div class="state">${esc(a.state)}</div>`;
      for (const it of a.items) h += `<div class="item"><b>${esc(it.text)}</b>${it.why ? `<span>${esc(it.why)}</span>` : ''}</div>`;
      const L = Coach.lessons[a.lesson];
      if (L) h += `<div class="lessonbox"><b>Strategy: ${esc(L.title)}.</b> ${esc(L.text)}</div>`;
      if (a.alternatives && a.alternatives.length) h += `<div class="alts"><b>Other options</b><ul>${a.alternatives.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      body.innerHTML = h;
    }
    if (UI.coachNotes.length) {
      const f = el('div', 'alts'); f.innerHTML = '<b>Feedback on your recent plays</b>' + UI.coachNotes.slice(-4).map((n) => `<div class="item fb"><span>${esc(n)}</span></div>`).join('');
      body.append(f);
    }
    const m = UI.modal({ title: '💡 Strategy coach', body, buttons: [{ label: Settings.hints ? 'Hide board hints' : 'Show hints on board', cls: 'ghost', value: 'toggle' }, { label: 'Strategy guide', cls: 'ghost', value: 'guide' }, { label: 'Close', value: null, cls: 'primary' }] });
    m.promise.then((v) => { if (v === 'toggle') { Settings.hints = !Settings.hints; Settings.save(); UI.lastAdviceKey = ''; UI.scheduleRender(); UI.toast(Settings.hints ? 'Coach hints on' : 'Coach hints off'); } else if (v === 'guide') MTG.App.showGuideModal(); });
  },
  coachFeedback(text, ok) {
    if (!Settings.hints) return; UI.coachNotes.push((ok ? '✔ ' : '💬 ') + text); UI.toast((ok ? '✔ ' : '💡 ') + text.slice(0, 160), ok ? 1800 : 4200);
  },

  /* ----- interactions ----- */
  onCardTap(c) {
    const g = UI.g;
    if (UI.mode === 'target' && UI.legalSet.has(c)) return UI.pickTarget(c);
    if (UI.mode === 'attack') {
      if (UI.atkPossible.includes(c)) { if (g.has(c, 'attacksEachCombat')) { UI.toast(c.name + ' must attack.'); return; } if (UI.atkSet.has(c)) UI.atkSet.delete(c); else UI.atkSet.add(c); UI.scheduleRender(); return; }
    }
    if (UI.mode === 'block') {
      if (UI.blockers.includes(c)) {
        if (UI.blockMap.has(c)) { UI.blockMap.delete(c); UI.activeBlocker = null; } else UI.activeBlocker = UI.activeBlocker === c ? null : c;
        UI.scheduleRender(); return;
      }
      if (UI.blockAtk.has(c)) {
        if (UI.activeBlocker) {
          if (g.canBlock(UI.activeBlocker, c)) { if (g.has(c, 'menace') && false) { /* handled at confirm */ } UI.blockMap.set(UI.activeBlocker, c); UI.activeBlocker = null; }
          else UI.toast(`${UI.activeBlocker.name} can't block ${c.name}` + (g.has(c, 'flying') ? ' (flying)' : '') + '.');
        } else UI.toast('Tap one of your untapped creatures first, then the attacker it should block.');
        UI.scheduleRender(); return;
      }
    }
    UI.inspect(c, {});
  },
  onPlayerTap(pi) { if (UI.mode === 'target' && UI.legalSet.has(UI.g.players[pi])) UI.pickTarget(UI.g.players[pi]); },
  pickTarget(t) { if (UI.targetRes) { const r = UI.targetRes; UI.targetRes = null; UI.legalSet = new Set(); UI.setPrompt(null); UI.mode = 'idle'; UI.highlight = new Set(); r([t]); UI.scheduleRender(); } },
  act(action) { if (UI.priorityResolve) { const r = UI.priorityResolve; UI.priorityResolve = null; UI.mode = 'idle'; UI.highlight = new Set(); r(action); UI.scheduleRender(); return true; } UI.toast('Wait for your priority.'); return false; },
  mainButton() {
    const g = UI.g; const m = UI.mode;
    if (m === 'priority') {
      if (Settings.confirmEnd && g.active === 0 && g.step === 'main2' && !g.stack.length) {
        const p = g.players[0];
        const left = p.hand.filter((c) => !g.isLand(c) && !g.hasFlash(c) && g.canPay(p, c.def.costObj, 0));
        const land = p.hand.some((c) => g.isLand(c)) && p.landDrops > 0;
        if (left.length || land) {
          const msg = (land ? 'You still have a land drop. ' : '') + (left.length ? `You have ${g.availableMana(p)} mana and could cast ${left.slice(0, 3).map((c) => c.name).join(', ')}. ` : '');
          UI.modal({ center: true, title: 'End turn?', body: `<p>${esc(msg)}Ending the turn now wastes that mana.</p>`, buttons: [{ label: 'Go back', value: false }, { label: 'End turn', value: true, cls: 'primary' }] }).promise.then((v) => { if (v) { UI.endTurnNote(); UI.act({ type: 'pass' }); } });
          return;
        }
      }
      if (g.active === 0 && g.step === 'main2' && !g.stack.length) UI.endTurnNote();
      UI.act({ type: 'pass' });
    } else if (m === 'attack') UI.finishAttack();
    else if (m === 'block') UI.finishBlock();
    else if (m === 'target') { if (UI.targetCancel && UI.targetRes) { const r = UI.targetRes; UI.targetRes = null; UI.legalSet = new Set(); UI.setPrompt(null); UI.mode = 'idle'; r(null); UI.scheduleRender(); } }
  },
  endTurnNote() {
    if (!Settings.hints) return; const g = UI.g;
    try { const msgs = Coach.turnReview(g, g.players[0]); if (msgs.length) UI.coachFeedback(msgs[0], msgs[0].startsWith('Good')); } catch (e) { /* ignore */ }
  },

  /* ----- inspect sheet ----- */
  inspect(c, ctx) {
    const g = UI.g, d = c.def;
    const wrap = el('div', 'inspect'); const big = el('div', 'big');
    const be = UI.buildCardEl(c, { big: true }); be.classList.remove('tapped'); big.append(be);
    const info = el('div', 'info');
    const ch = c.zone === 'battlefield' ? g.chars(c) : null;
    let h = `<h4>${esc(d.name)}</h4><div class="costline">${costHTML(d.cost)}</div><div class="typeline">${esc(typeLine(d))}${g.isCreature(c) ? ` · ${ch ? ch.power + '/' + (ch.toughness - c.damage) : d.power + '/' + d.toughness}` : ''}</div><div class="rules">${esc(rulesText(d))}</div>`;
    const st = [];
    if (c.zone === 'battlefield') {
      if (c.tapped) st.push('Tapped'); if (g.isSick(c)) st.push('Summoning sick'); if (c.damage) st.push(c.damage + ' damage');
      for (const [k, v] of Object.entries(c.counters)) if (v) st.push((k === 'p1p1' ? '+1/+1' : '-1/-1') + ' counter ×' + v);
      if (c.attachedTo) st.push('Attached to ' + c.attachedTo.name);
      for (const a of c.attachments) st.push(a.name + ' attached');
      if (ch) { const extra = [...ch.kw].filter((k) => !(d.kw || []).includes(k)); if (extra.length) st.push('Has: ' + kwText(extra)); }
      st.push(c.controller === 0 ? 'You control it' : 'Opponent controls it');
    } else if (c.zone) st.push('In ' + c.zone);
    if (st.length) h += `<div class="status">${st.map((s) => `<span>${esc(s)}</span>`).join('')}</div>`;
    info.innerHTML = h; wrap.append(big, info);
    const body = el('div'); body.append(wrap);
    const me = g.players[0]; const waiting = UI.mode !== 'priority';
    const acts = el('div');
    const addAct = (label, sub, enabled, fn) => { const b = el('button', 'abtn', `${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ''}`); b.disabled = !enabled; b.onclick = () => { m.close(null); fn(); }; acts.append(b); };
    if (c.zone === 'hand' && c.owner === 0) {
      if (g.isLand(c)) { const ck = g.canCast(me, c); addAct('Play land', ck.ok ? 'Put it onto the battlefield' : ck.reason, ck.ok && !waiting, () => UI.act({ type: 'land', card: c })); }
      else { const ck = g.canCast(me, c); addAct(`Cast ${d.name}`, ck.ok ? (d.cost ? 'Cost: ' + d.cost : '') : ck.reason, ck.ok && !waiting, () => UI.act({ type: 'cast', card: c })); }
    }
    const abilityZone = c.zone === 'battlefield' ? c.controller === 0 : (c.zone === 'graveyard' && c.owner === 0);
    if (abilityZone) d.abilities.forEach((ab, i) => { if (ab.mana) return; const ck = g.abilityUsable(me, c, i); addAct(ab.text || 'Ability', ab.cost && ab.cost.mana ? 'Cost: ' + ab.cost.mana + (ab.cost.tap ? ', tap' : '') : (ab.cost && ab.cost.tap ? 'Tap' : ''), ck.ok && !waiting, () => UI.act({ type: 'activate', perm: c, idx: i })); });
    if (acts.children.length) body.append(acts);
    const m = UI.modal({ title: '', body, closable: true, buttons: [{ label: 'Close', cls: 'ghost', value: null }] });
    m.sheet.querySelector('header').remove();
    return m;
  },
  showGraveyard(pi) {
    const g = UI.g, p = g.players[pi];
    const body = el('div');
    if (!p.graveyard.length) body.innerHTML = '<p style="color:var(--muted)">Empty.</p>';
    const grid = el('div', 'cardgrid');
    for (const c of p.graveyard.slice().reverse()) { const e = UI.buildCardEl(c); e.onclick = () => { m.close(null); UI.inspect(c, {}); }; grid.append(e); }
    body.append(grid);
    if (p.exile.length) { body.append(el('h3', '', 'Exile')); const g2 = el('div', 'cardgrid'); for (const c of p.exile) g2.append(UI.buildCardEl(c)); body.append(g2); }
    const m = UI.modal({ title: `${p.name}'s graveyard (${p.graveyard.length})`, body });
  },
  showLog() {
    const body = el('div');
    for (const l of UI.logLines.slice(-220).reverse()) body.append(el('div', 'logline' + (l.startsWith('—') ? ' turn' : ''), esc(l)));
    UI.modal({ title: 'Game log', body });
  },

  /* ----- effects ----- */
  fx(type, d) {
    const g = UI.g;
    if (type === 'turn') {
      const b = $('#banner'); b.textContent = d.player === 0 ? 'YOUR TURN' : "OPPONENT'S TURN"; b.className = d.player === 0 ? '' : 'theirs'; void b.offsetWidth; b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; clearTimeout(UI._bt); UI._bt = setTimeout(() => b.classList.add('hidden'), 1300);
      return;
    }
    let target = null, text = '', color = '#ff8f86';
    if (type === 'damage') { text = '-' + d.n; target = d.target.isPlayer ? $(`#${d.target.idx === 0 ? 'myBar' : 'oppBar'} .life`) : (UI.cardEls.get(d.target.id)); }
    else if (type === 'life') { text = (d.n > 0 ? '+' : '') + d.n; color = d.n > 0 ? '#7be3a4' : '#ff8f86'; target = $(`#${d.p === 0 ? 'myBar' : 'oppBar'} .life`); }
    if (target && text) {
      const r = target.getBoundingClientRect(); const f = el('div', 'float', text); f.style.color = color; f.style.position = 'fixed'; f.style.left = (r.left + r.width / 2 - 10) + 'px'; f.style.top = (r.top + r.height / 2 - 12) + 'px'; document.body.append(f); setTimeout(() => f.remove(), 1100);
    }
  },

  /* ----- decision prompts (called by HumanController) ----- */
  autoPass(g, p) {
    if (g.over) return true;
    const top = g.stack[g.stack.length - 1];
    const myTurn = g.active === 0;
    const insts = p.hand.some((c) => !g.isLand(c) && g.hasFlash(c) && g.canCast(p, c).ok);
    if (g.stack.length) {
      if (top.controller === 0) return !UI.holdPriority;
      return !insts && !UI.canActivateAny(g, p, true);
    }
    if (myTurn) {
      if (g.step === 'main1' || g.step === 'main2') return false;
      if (['blockers', 'attackers'].includes(g.step) && insts) return false;
      return true;
    }
    if (['attackers', 'blockers'].includes(g.step) && g.combat && g.combat.attackers.length && insts) return false;
    if (g.step === 'end' && Settings.stopEnd && insts) return false;
    return true;
  },
  canActivateAny(g, p, instantOnly) {
    for (const perm of g.bf.filter((c) => c.controller === 0)) for (let i = 0; i < perm.def.abilities.length; i++) { const ab = perm.def.abilities[i]; if (ab.mana || ab.sorcery) continue; if (g.abilityUsable(p, perm, i).ok && (ab.targets || []).length) return true; }
    return false;
  },
  async priority(g, p) {
    if (UI.autoPass(g, p)) { await sleep(g.pace ? 40 : 0); return { type: 'pass' }; }
    UI.mode = 'priority';
    const isMain = g.active === 0 && g.isMain() && !g.stack.length;
    UI.setAdviceCtx(isMain ? 'main' : 'respond');
    if (g.stack.length && g.stack[g.stack.length - 1].controller !== 0 && Settings.hints) UI.toast(`Opponent cast ${g.stack[g.stack.length - 1].card ? g.stack[g.stack.length - 1].card.name : 'an ability'} — respond or pass.`, 2200);
    UI.setPrompt(g.stack.length && g.stack[g.stack.length - 1].controller !== 0 ? 'The opponent has put something on the stack. You may respond with an instant.' : null);
    UI.render();
    return new Promise((res) => { UI.priorityResolve = res; });
  },
  targeting(g, p, spec, o) {
    return new Promise((resolve) => {
      if (o.forced && o.legal.length === 1) return resolve([o.legal[0]]);
      UI.mode = 'target'; UI.legalSet = new Set(o.legal); UI.targetRes = resolve; UI.targetCancel = !o.forced;
      UI.setAdviceCtx('target', { spec, o });
      UI.setPrompt(`${o.label ? o.label + ': ' : ''}choose ${spec.label || 'a target'}.`, UI.advice && Settings.hints ? [{ label: 'Coach pick', onclick: () => { if (UI.advice.pick) UI.pickTarget(UI.advice.pick); } }] : []);
      UI.render();
    });
  },
  attackMode(g, p, possible) {
    return new Promise((resolve) => {
      UI.mode = 'attack'; UI.atkPossible = possible; UI.atkSet = new Set(possible.filter((c) => g.has(c, 'attacksEachCombat')));
      UI.attackRes = resolve;
      UI.setAdviceCtx('attack', { possible });
      UI.plan = UI.advice && UI.advice.plan;
      UI.setPrompt('Tap the creatures you want to attack with, then confirm.', [
        { label: 'All', onclick: () => { possible.forEach((c) => UI.atkSet.add(c)); UI.scheduleRender(); } },
        { label: 'None', onclick: () => { UI.atkSet = new Set(possible.filter((c) => g.has(c, 'attacksEachCombat'))); UI.scheduleRender(); } },
        { label: '💡 Coach', cls: 'go', onclick: () => { if (UI.plan) { UI.atkSet = new Set(UI.plan.attackers.map((a) => a.card)); possible.forEach((c) => g.has(c, 'attacksEachCombat') && UI.atkSet.add(c)); UI.scheduleRender(); UI.toast('Coach attackers selected. Tap 💡 above for the reasons.'); } } },
      ]);
      UI.render();
    });
  },
  finishAttack() {
    const g = UI.g, p = g.players[0]; const chosen = [...UI.atkSet];
    if (Settings.hints && UI.plan) { const r = Coach.reviewAttack(g, p, chosen, UI.plan); UI.coachFeedback(r.text, r.ok); }
    const res = UI.attackRes; UI.attackRes = null; UI.mode = 'idle'; UI.atkSet = new Set(); UI.setPrompt(null); UI.highlight = new Set(); res(chosen); UI.scheduleRender();
  },
  blockMode(g, p, atk, blk) {
    return new Promise((resolve) => {
      UI.mode = 'block'; UI.blockers = blk; UI.blockAtk = new Set(atk); UI.blockMap = new Map(); UI.activeBlocker = null; UI.blockRes = resolve;
      UI.setAdviceCtx('block', { atk, blk });
      UI.plan = UI.advice && UI.advice.plan;
      const total = atk.reduce((a, c) => a + g.power(c), 0);
      UI.setPrompt(`Incoming: ${total} damage (you're at ${p.life}). Tap your blocker, then the attacker it blocks.`, [
        { label: 'Clear', onclick: () => { UI.blockMap = new Map(); UI.activeBlocker = null; UI.scheduleRender(); } },
        { label: '💡 Coach', cls: 'go', onclick: () => { if (UI.plan) { UI.blockMap = new Map(UI.plan.blocks.map((b) => [b.blocker, b.attacker])); UI.scheduleRender(); UI.toast('Coach blocks selected. Tap 💡 above for the reasons.'); } } },
      ]);
      UI.render();
    });
  },
  finishBlock() {
    const g = UI.g, p = g.players[0]; const pairs = [...UI.blockMap.entries()];
    for (const a of UI.blockAtk) if (g.has(a, 'menace')) { const n = pairs.filter(([, x]) => x === a).length; if (n === 1) { UI.toast(a.name + ' has menace: it needs two blockers.'); return; } }
    if (Settings.hints && UI.plan) { const r = Coach.reviewBlock(g, p, pairs, UI.plan); UI.coachFeedback(r.text, r.ok); }
    const res = UI.blockRes; UI.blockRes = null; UI.mode = 'idle'; UI.blockMap = null; UI.blockAtk = null; UI.activeBlocker = null; UI.setPrompt(null); UI.highlight = new Set(); res(pairs); UI.scheduleRender();
  },
  pickList(title, options, opts) {
    opts = opts || {};
    const body = el('div');
    return new Promise((resolve) => {
      let m; options.forEach((o) => { const b = el('button', 'abtn', esc(o.label) + (o.sub ? `<small>${esc(o.sub)}</small>` : '')); b.onclick = () => m.close(o.value); body.append(b); });
      m = UI.modal({ title, body, closable: opts.cancelable !== false, center: true });
      m.promise.then(resolve);
    });
  },
  cardsDialog(g, o) {
    return new Promise((resolve) => {
      const min = o.min != null ? o.min : 1, max = o.max != null ? o.max : 1;
      const sel = new Set(); const body = el('div'); const grid = el('div', 'cardgrid');
      let advice = null;
      if (Settings.hints && (o.mode === 'discard' || o.mode === 'bottom')) { advice = Coach.adviseDiscard(g, g.players[0], o.cards, o.min); body.append(el('div', 'alts', `<b>Coach:</b> ${esc(advice.headline)} — ${esc(advice.items[0] ? advice.items[0].why : '')}`)); }
      const m = UI.modal({
        title: o.prompt, body, closable: min === 0,
        buttons: [{ label: min === 0 ? 'Done' : 'Confirm', cls: 'primary', keep: true, onclick: (close) => close([...sel]) }],
      });
      const btn = m.footer.querySelector('button');
      const upd = () => { btn.disabled = sel.size < min || sel.size > max; btn.textContent = (min === 0 && sel.size === 0 ? 'None' : 'Confirm') + (max > 0 ? ` (${sel.size}/${max})` : ''); };
      for (const c of o.cards) {
        const e = UI.buildCardEl(c, { big: false });
        if (advice && advice.highlight.includes(c.id)) e.classList.add('rec');
        e.onclick = () => { if (sel.has(c)) sel.delete(c); else { if (max === 1) sel.clear(); if (sel.size < max) sel.add(c); } grid.querySelectorAll('.card').forEach((x, i) => x.classList.toggle('chosen', sel.has(o.cards[i]))); upd(); };
        grid.append(e);
      }
      body.append(grid); upd(); m.promise.then((v) => resolve(v || []));
    });
  },
  scryDialog(g, cards) {
    return new Promise((resolve) => {
      const advice = Settings.hints ? Coach.adviseScry(g, g.players[0], cards) : null;
      const bottom = new Set(advice ? advice.r.bottom : []);
      const body = el('div'); const grid = el('div', 'cardgrid');
      if (advice) body.append(el('div', 'alts', '<b>Coach:</b> ' + advice.items.map((i) => esc(i.text)).join('<br>')));
      body.append(el('p', '', 'Tap a card to flip between keeping it on top and putting it on the bottom.'));
      const draw = () => { grid.innerHTML = ''; cards.forEach((c) => { const wrap = el('div'); wrap.style.textAlign = 'center'; const e = UI.buildCardEl(c); if (bottom.has(c)) e.classList.add('dim'); e.onclick = () => { if (bottom.has(c)) bottom.delete(c); else bottom.add(c); draw(); }; wrap.append(e, el('div', '', bottom.has(c) ? '⬇ Bottom' : '⬆ Top')); grid.append(wrap); }); };
      draw(); body.append(grid);
      const m = UI.modal({ title: `Scry ${cards.length}`, body, closable: false, buttons: [{ label: 'Done', cls: 'primary', value: true }] });
      m.promise.then(() => resolve({ top: cards.filter((c) => !bottom.has(c)), bottom: cards.filter((c) => bottom.has(c)) }));
    });
  },
  xDialog(card, max) {
    return new Promise((resolve) => {
      let x = Math.min(max, Math.max(1, max)); const body = el('div'); const big = el('div', 'big-x', String(x));
      const st = el('div', 'stepper'); const minus = el('button', '', '−'), plus = el('button', '', '+'); st.append(minus, big, plus);
      const upd = () => { big.textContent = x; }; minus.onclick = () => { x = Math.max(0, x - 1); upd(); }; plus.onclick = () => { x = Math.min(max, x + 1); upd(); };
      body.append(el('p', '', `Choose X for ${esc(card.name)} (max ${max}).`), st);
      const m = UI.modal({ title: 'Choose X', body, center: true, buttons: [{ label: 'Cancel', value: null }, { label: 'Cast', cls: 'primary', keep: true, onclick: (close) => close(x) }] });
      m.promise.then((v) => resolve(v));
    });
  },
  mulliganDialog(g, p, hand, n) {
    return new Promise((resolve) => {
      const body = el('div'); const grid = el('div', 'cardgrid');
      for (const c of hand) grid.append(UI.buildCardEl(c));
      const lands = hand.filter((c) => g.isLand(c)).length;
      body.append(el('p', '', `Your opening hand: <b>${lands}</b> land${lands === 1 ? '' : 's'}, <b>${hand.length - lands}</b> spell${hand.length - lands === 1 ? '' : 's'}.` + (n ? ` (Mulligan ${n}: you will put ${n} card${n > 1 ? 's' : ''} on the bottom after keeping.)` : '')), grid);
      const adv = Coach.adviseMulligan(g, p, hand, n);
      if (Settings.hints) body.append(el('div', 'coach', `<div class="item"><b>Coach: ${esc(adv.headline)}</b><span>${esc(adv.items[0].why)}</span></div>`));
      else { const bt = el('button', 'btn small ghost', '💡 Ask the coach'); bt.onclick = () => { bt.replaceWith(el('div', 'coach', `<div class="item"><b>Coach: ${esc(adv.headline)}</b><span>${esc(adv.items[0].why)}</span></div>`)); }; body.append(bt); }
      const m = UI.modal({ title: 'Keep or mulligan?', body, center: true, closable: false, buttons: [{ label: n >= 6 ? 'Keep (forced)' : 'Mulligan', value: false, disabled: n >= 6 }, { label: 'Keep', value: true, cls: 'primary' }] });
      m.promise.then(resolve);
    });
  },
};
UI.legalSet = new Set(); UI.atkSet = new Set(); UI.atkPossible = [];

/* ---------- the human controller ---------- */
class HumanController {
  constructor() { this.isHuman = true; }
  mulligan(g, p, hand, n) { UI.showScreenGame(); return UI.mulliganDialog(g, p, hand, n); }
  async chooseMode(g, p, card, idxs) {
    return UI.pickList(card.name + ' — choose one', idxs.map((i) => ({ label: card.def.modes[i].text, value: i })), { cancelable: true });
  }
  chooseTargets(g, p, spec, o) { return UI.targeting(g, p, spec, o); }
  chooseX(g, p, card, max) { return UI.xDialog(card, max); }
  async chooseOption(g, p, o) { const v = await UI.pickList(o.prompt, o.options.map((l, i) => ({ label: l, value: i })), { cancelable: false }); return v == null ? 0 : v; }
  chooseCards(g, p, o) { if (!o.cards.length) return Promise.resolve([]); if (o.cards.length <= (o.min || 0) && o.min === o.max) return Promise.resolve(o.cards.slice(0, o.min)); return UI.cardsDialog(g, o); }
  scry(g, p, cards) { return UI.scryDialog(g, cards); }
  declareAttackers(g, p, possible) { return UI.attackMode(g, p, possible); }
  declareBlockers(g, p, atk, blk) { return UI.blockMode(g, p, atk, blk); }
  priority(g, p) { return UI.priority(g, p); }
}
MTG.HumanController = HumanController;

UI.showScreenGame = () => { UI.showScreen('game'); };
UI.bindGame = function (g) {
  UI.g = g; UI.cardEls.clear(); UI.landEls.clear(); UI.logLines = []; UI.coachNotes = []; UI.mode = 'idle'; UI.highlight = new Set(); UI.lastLife = [null, null]; UI.advCtx = null; UI.advice = null; UI.gameOver = false;
  for (const id of ['#oppPerms', '#oppLands', '#myPerms', '#myLands', '#hand']) $(id).innerHTML = '';
  g.pace = Settings.pace();
  g.onChange = () => UI.scheduleRender();
  g.onLog = (m) => { UI.logLines.push(m); };
  g.onEvent = (t, d) => UI.fx(t, d);
};
UI.init = function () {
  $('#btnMain').onclick = () => UI.mainButton();
  $('#btnCoach').onclick = () => UI.showCoach();
  $('#coachLine').onclick = () => UI.showCoach();
  $('#btnLog').onclick = () => UI.showLog();
  $('#btnMenu').onclick = () => MTG.App.gameMenu();
};
MTG.UI = UI;
})();
