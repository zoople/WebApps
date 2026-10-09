'use strict';
/* App shell: menu, deck selection, settings, strategy guide, game lifecycle. */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const { UI, Decks, Coach, Settings, Images } = MTG;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = (s) => UI.emojiText(String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
const PIPE = { W: '⚪', U: '🔵', B: '⚫', R: '🔴', G: '🟢', C: '◆' };
const pips = (cols) => `<span class="pips" style="font-size:15px">${(cols.length ? cols : ['C']).map((c) => PIPE[c]).join('')}</span>`;

const App = (MTG.App = {
  sel: { tab: 'starter', starter: 's-rw', packs: [], opp: 'random' },
  last: null, game: null,

  /* ---------- records ---------- */
  record() { try { return JSON.parse(localStorage.getItem('magicduel.record') || '{"w":0,"l":0,"d":0}'); } catch (e) { return { w: 0, l: 0, d: 0 }; } },
  addRecord(res) { const r = App.record(); r[res]++; try { localStorage.setItem('magicduel.record', JSON.stringify(r)); } catch (e) { /* ignore */ } },

  /* ---------- menu ---------- */
  showMenu() {
    const r = App.record(); const s = $('#screen-menu');
    s.innerHTML = `<div class="menu-wrap">
      <div class="mana-row">${['W', 'U', 'B', 'R', 'G'].map((c) => `<span class="mana-dot" style="background:var(--${c})"></span>`).join('')}</div>
      <div class="logo">MAGIC DUEL<small>Play · Learn · Win</small></div>
      <button class="btn primary" id="mQuick">⚡ Quick play</button>
      <button class="btn" id="mDecks">🃏 Choose decks</button>
      <button class="btn" id="mGuide">📘 Strategy guide</button>
      <button class="btn" id="mSet">⚙️ Settings</button>
      ${UI.isNative ? '' : '<button class="btn ghost" id="mFs">⛶ Full screen</button>'}
      <div class="record">Record: ${r.w} wins · ${r.l} losses${r.d ? ' · ' + r.d + ' draws' : ''}</div>
      <div class="menu-sub">Starter decks and Jumpstart-style theme packs, full Magic rules, and a coach that explains every decision.</div>
    </div>`;
    $('#mQuick').onclick = () => App.quickPlay();
    $('#mDecks').onclick = () => App.showDecks();
    $('#mGuide').onclick = () => App.showGuide();
    $('#mSet').onclick = () => App.showSettings();
    const mf = $('#mFs'); if (mf) mf.onclick = () => UI.toggleFullscreen();
    UI.showScreen('menu');
  },
  quickPlay() {
    const a = Decks.starters[Math.floor(Math.random() * Decks.starters.length)];
    let b; do b = Decks.starters[Math.floor(Math.random() * Decks.starters.length)]; while (b === a);
    App.startGame(a, b);
  },

  /* ---------- deck selection ---------- */
  showDecks() {
    const s = $('#screen-decks'); const S = App.sel;
    s.innerHTML = '';
    const top = el('div', 'topbar', '<button class="back" id="dBack">←</button><h2>Choose your deck</h2>');
    const scroll = el('div', 'scroll pad'); scroll.style.flex = '1';
    const seg = el('div', 'seg', `<button data-t="starter" class="${S.tab === 'starter' ? 'on' : ''}">Starter decks</button><button data-t="jump" class="${S.tab === 'jump' ? 'on' : ''}">Jumpstart · pick 2</button>`);
    scroll.append(seg);
    if (S.tab === 'starter') {
      scroll.append(el('p', 'menu-sub', 'Ready-made 40-card decks inspired by recent starter products. Pick one.'));
      for (const d of Decks.starters) {
        const prof = Coach.deckProfile(Decks.names(d));
        const c = el('div', 'deckcard' + (S.starter === d.id ? ' sel' : ''), `<div class="row"><h3>${esc(d.name)}</h3>${pips(Decks.colorsOf(Decks.names(d)))}<span class="tag">${prof.archetype}</span></div><p>${esc(d.blurb)}</p><p><b>Plan:</b> ${esc(d.plan)}</p><div class="row"><button class="btn small ghost" data-view="${d.id}">View cards</button></div>`);
        c.onclick = (e) => { if (e.target.dataset.view) { App.viewDeck(d); return; } S.starter = d.id; App.showDecks(); };
        scroll.append(c);
      }
    } else {
      scroll.append(el('p', 'menu-sub', 'Jumpstart style: choose two 20-card theme packs and they combine into one 40-card deck. You can pick the same colour twice.'));
      const grid = el('div', 'packgrid');
      for (const p of Decks.packs) {
        const n = S.packs.filter((x) => x === p.id).length;
        const c = el('div', 'deckcard' + (n ? ' sel' : ''), `<div class="row"><h3>${esc(p.name)}</h3>${pips([p.color])}</div><p>${esc(p.blurb)}</p>${n ? `<span class="tag" style="align-self:flex-start">Chosen${n > 1 ? ' ×2' : ''}</span>` : ''}<div class="row"><button class="btn small ghost" data-view="${p.id}">Cards</button></div>`);
        c.onclick = (e) => {
          if (e.target.dataset.view) { App.viewDeck({ name: p.name + ' pack', list: [...p.list, ...p.lands] }); return; }
          if (S.packs.length >= 2) S.packs = S.packs.slice(1); S.packs.push(p.id); App.showDecks();
        };
        grid.append(c);
      }
      scroll.append(grid);
      if (S.packs.length === 2) {
        const d = App.jumpDeck(); const prof = Coach.deckProfile(Decks.names(d));
        scroll.append(el('div', 'deckcard sel', `<div class="row"><h3>${esc(d.name)}</h3>${pips(Decks.colorsOf(Decks.names(d)))}<span class="tag">${prof.archetype}</span></div><p><b>Plan:</b> ${esc(prof.plan)}</p><div class="row"><button class="btn small ghost" id="dView">View cards</button><button class="btn small ghost" id="dClear">Clear</button></div>`));
      } else scroll.append(el('p', 'menu-sub', `Chosen ${S.packs.length}/2 themes.`));
    }
    const bottom = el('div', 'bottombar');
    const oppOpts = ['<option value="random">Random starter deck</option>', '<option value="jump">Random Jumpstart deck</option>', ...Decks.starters.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`)];
    bottom.innerHTML = `<div class="field-row"><span>Opponent</span><select id="dOpp">${oppOpts.join('')}</select></div><button class="btn primary" id="dStart" style="max-width:none">Start game</button>`;
    s.append(top, scroll, bottom);
    $('#dOpp', s).value = S.opp;
    $('#dOpp', s).onchange = (e) => { S.opp = e.target.value; };
    $('#dBack', s).onclick = () => App.showMenu();
    seg.querySelectorAll('button').forEach((b) => (b.onclick = () => { S.tab = b.dataset.t; App.showDecks(); }));
    const dv = $('#dView', s); if (dv) dv.onclick = () => App.viewDeck(App.jumpDeck());
    const dc = $('#dClear', s); if (dc) dc.onclick = () => { S.packs = []; App.showDecks(); };
    const start = $('#dStart', s);
    start.disabled = S.tab === 'jump' && S.packs.length !== 2;
    start.onclick = () => {
      const mine = S.tab === 'starter' ? Decks.starters.find((d) => d.id === S.starter) : App.jumpDeck();
      let opp;
      if (S.opp === 'random') opp = Decks.starters[Math.floor(Math.random() * Decks.starters.length)];
      else if (S.opp === 'jump') opp = Decks.randomJumpstart();
      else opp = Decks.starters.find((d) => d.id === S.opp);
      App.startGame(mine, opp);
    };
    UI.showScreen('decks');
  },
  jumpDeck() { const [a, b] = App.sel.packs.map((id) => Decks.packs.find((p) => p.id === id)); return Decks.fromPacks(a, b); },
  viewDeck(d) {
    const body = el('div');
    const rows = d.list.slice().sort((a, b) => (MTG.cards[a[0]].types.includes('Land') - MTG.cards[b[0]].types.includes('Land')) || MTG.cards[a[0]].cmc - MTG.cards[b[0]].cmc);
    for (const [n, q] of rows) {
      const def = MTG.cards[n];
      const r = el('div', 'logline', `<b>${q}×</b> ${esc(n)} <span style="float:right">${def.cost ? UI.manaHTML(def.cost) : esc(def.types[0])}</span>`);
      r.onclick = () => UI.inspect({ id: -1, def, name: n, zone: null, counters: {}, attachments: [], controller: 0, owner: 0, damage: 0, tapped: false, flags: {} }, {});
      body.append(r);
    }
    const prof = Coach.deckProfile(Decks.expand(d.list));
    body.prepend(el('div', 'lesson', `<h3>${prof.archetype}</h3><p>${esc(prof.plan)}</p><p style="color:var(--muted);margin-top:6px">${esc(prof.tips.join(' '))}</p>`));
    UI.modal({ title: d.name, body });
  },

  /* ---------- settings & guide ---------- */
  showSettings() {
    const body = el('div');
    const row = (key, title, sub) => {
      const r = el('div', 'toggle', `<div>${esc(title)}<small>${esc(sub)}</small></div>`); const sw = el('button', 'switch' + (Settings[key] ? ' on' : ''));
      sw.onclick = () => { Settings[key] = !Settings[key]; Settings.save(); sw.classList.toggle('on', Settings[key]); };
      r.append(sw); return r;
    };
    if (UI.isNative) body.append(el('div', 'toggle', '<div>Full screen<small>The Android app is already full screen.</small></div>'));
    else {
      const fr = el('div', 'toggle', `<div>Full screen<small>${UI.fsSupported() ? 'Hide the browser bars for more room for the cards' : "Not supported by this browser (on iPhone: Share → Add to Home Screen)"}</small></div>`);
      const fs = el('button', 'switch' + (UI.fsElement() ? ' on' : ''), ''); fs.id = 'fsSwitch';
      fs.onclick = async () => { await UI.toggleFullscreen(); fs.classList.toggle('on', !!UI.fsElement()); };
      fr.append(fs); body.append(fr);
    }
    body.append(row('hints', 'Coach hints', 'Show advice and highlight the recommended play on the board'));
    body.append(row('images', 'Card artwork', 'Download card images from Scryfall by name (needs internet). Off = text cards'));
    const art = el('div', 'toggle', '<div>Card art<small id="artStatus">Not downloaded yet. Art loads as cards appear.</small></div>');
    const dl = el('button', 'btn small', 'Download all'); dl.onclick = () => {
      dl.disabled = true; const st = $('#artStatus'); st.textContent = 'Downloading…';
      Images.downloadAll((d, t, f) => { st.textContent = `Downloading ${d}/${t}` + (f ? ` (${f} failed)` : ''); }).then((r) => { dl.disabled = false; st.textContent = r.failed ? `${r.total - r.failed}/${r.total} cards downloaded. ${Images.lastError || 'Some art could not be fetched; those cards show as text.'}` : `All ${r.total} cards downloaded and cached.`; });
    };
    art.append(dl); body.append(art);
    body.append(row('confirmEnd', 'Confirm wasteful turn end', 'Ask before ending the turn with castable cards and spare mana'));
    body.append(row('stopEnd', 'Stop at opponent\'s end step', 'Pause when you hold a castable instant at the end of their turn'));
    body.append(row('holdPriority', 'Hold priority after casting', 'Get priority back with your spell on the stack (to chain spells). Off = it resolves automatically'));
    const sp = el('div', 'toggle', '<div>Game speed<small>How fast the opponent\'s actions play out</small></div>');
    const sel = el('select'); sel.style.flex = '0 0 120px'; sel.innerHTML = ['slow', 'normal', 'fast'].map((s) => `<option ${Settings.speed === s ? 'selected' : ''}>${s}</option>`).join('');
    sel.onchange = () => { Settings.speed = sel.value; Settings.save(); if (UI.g) UI.g.pace = Settings.pace(); }; sp.append(sel); body.append(sp);
    const rec = el('button', 'btn small ghost', 'Reset win/loss record'); rec.style.marginTop = '12px'; rec.onclick = () => { try { localStorage.removeItem('magicduel.record'); } catch (e) { /* ignore */ } UI.toast('Record reset'); if (UI.screen === 'menu') App.showMenu(); };
    body.append(rec);
    UI.modal({ title: 'Settings', body, buttons: [{ label: 'Done', cls: 'primary', value: null }] });
  },
  guideHTML() {
    let h = '<div class="lesson"><h3>Controls</h3><p><b>Tap</b> a card to see it and its actions (cast, play land, activate). <b>Press and hold</b> any card to inspect it. Cards with a green glow in your hand are castable. Mana is paid automatically from your lands. Press the gold button to move the game on: it always says what it will do next. When you attack, tap your creatures then confirm; when you block, tap your blocker, then the attacker. 💡 asks the coach, 📜 shows the log, tap a graveyard icon to see it.</p></div><p class="menu-sub" style="max-width:none">The Coach in this game uses the same planner as the computer opponent, so its advice is a real, working strategy — plus the reasoning behind it. These are the core ideas it keeps coming back to.</p>';
    for (const k of Object.keys(Coach.lessons)) { const L = Coach.lessons[k]; h += `<div class="lesson"><h3>${esc(L.title)}</h3><p>${esc(L.text)}</p></div>`; }
    h += `<div class="lesson"><h3>Turn checklist</h3><p>1) Check for lethal for both players. 2) Play a land. 3) Remove the biggest threat if the trade is good. 4) Attack if it is safe. 5) Spend the rest of your mana on the best development. 6) Keep instants for when they matter.</p></div>`;
    return h;
  },
  showGuide() {
    const s = $('#screen-guide'); s.innerHTML = '';
    s.append(el('div', 'topbar', '<button class="back" id="gBack">←</button><h2>Strategy guide</h2>'));
    const sc = el('div', 'scroll pad', App.guideHTML()); sc.style.flex = '1'; s.append(sc);
    $('#gBack', s).onclick = () => App.showMenu(); UI.showScreen('guide');
  },
  showGuideModal() { UI.modal({ title: 'Strategy guide', body: App.guideHTML() }); },

  /* ---------- game lifecycle ---------- */
  startGame(myDeck, oppDeck) {
    App.last = [myDeck, oppDeck]; Images.reset();
    if (Settings.fullscreen && !UI.isNative && !UI.fsElement()) UI.setFullscreen(true);
    const human = new MTG.HumanController(), ai = new MTG.AIController();
    const g = new MTG.Game({ decks: [Decks.names(myDeck), Decks.names(oppDeck)], controllers: [human, ai], names: ['You', 'Opponent'], deckNames: [myDeck.name, oppDeck.name] });
    App.game = g; UI.bindGame(g); UI.showScreen('game'); UI.render();
    Images.preload([...Decks.names(myDeck), ...Decks.names(oppDeck)], 'small');
    const mp = Coach.deckProfile(Decks.names(myDeck)), op = Coach.deckProfile(Decks.names(oppDeck));
    const brief = el('div', 'coach');
    brief.innerHTML = `<div class="item"><b>You: ${esc(myDeck.name)} <span style="color:var(--muted)">(${mp.archetype})</span></b><span>${esc(mp.plan)}</span></div>
      <div class="item" style="border-left-color:#ff8f86"><b>Opponent: ${esc(oppDeck.name)} <span style="color:var(--muted)">(${op.archetype})</span></b><span>${esc(op.plan)}</span></div>` +
      (Settings.hints ? `<div class="lessonbox"><b>Matchup tip.</b> ${esc(Coach.matchup(mp, op))}</div>` : '');
    const m = UI.modal({ title: 'Match start', body: brief, center: true, closable: false, buttons: [{ label: 'Let\'s play', cls: 'primary', value: true }] });
    m.promise.then(() => {
      g.run().then(() => { if (App.game === g && !UI.aborted) App.gameEnded(g); }).catch((e) => { console.error(e); UI.toast('Game error: ' + e.message, 8000); });
    });
    UI.aborted = false;
  },
  abortGame() {
    const g = App.game; if (!g) return;
    UI.aborted = true; g.over = true;
    if (UI.priorityResolve) { const r = UI.priorityResolve; UI.priorityResolve = null; r({ type: 'pass' }); }
    if (UI.attackRes) { const r = UI.attackRes; UI.attackRes = null; r([]); }
    if (UI.blockRes) { const r = UI.blockRes; UI.blockRes = null; r([]); }
    if (UI.targetRes) { const r = UI.targetRes; UI.targetRes = null; r(null); }
    while (UI.closeTopDialog());
    UI.mode = 'idle'; UI.setPrompt(null); App.game = null;
  },
  gameEnded(g) {
    if (UI.gameOver) return; UI.gameOver = true; $('#toast').classList.add('hidden'); UI.mode = 'idle'; UI.setPrompt(null); UI.highlight = new Set(); UI.render();
    const won = g.winner === 0, draw = g.winner < 0;
    App.addRecord(draw ? 'd' : won ? 'w' : 'l');
    const rv = Coach.gameReview(g, 0);
    const body = el('div', 'coach review');
    const maxA = Math.max(1, ...rv.turns.map((t) => t.avail));
    body.innerHTML = `<div class="head" style="color:${won ? '#7be3a4' : draw ? 'var(--gold)' : '#ff8f86'}">${draw ? 'Draw' : won ? 'Victory!' : 'Defeat'}</div><div class="state">${esc(g.resultReason)} · ${g.turnNo} turns</div>` +
      rv.items.map((i) => `<div class="item" style="border-left-color:${i.ok ? '#7be3a4' : 'var(--gold)'}"><b>${i.ok ? '✔' : '•'} ${esc(i.title)}</b><span>${esc(i.text)}</span></div>`).join('') +
      `<div class="alts"><b>Mana used each of your turns</b>` + rv.turns.map((t) => `<div class="tr"><span>T${Math.ceil(t.turn / 2)}</span><div class="bar"><i style="width:${Math.min(100, 100 * t.spent / maxA)}%"></i></div><span style="width:56px">${t.spent}/${t.avail}</span></div>`).join('') + `</div>` +
      `<div class="lessonbox"><b>Strategy: ${esc(Coach.lessons[rv.lesson].title)}.</b> ${esc(Coach.lessons[rv.lesson].text)}</div>`;
    const m = UI.modal({ title: 'Game review', body, closable: false, buttons: [{ label: 'Menu', value: 'menu', cls: 'ghost' }, { label: 'Rematch', value: 'again', cls: 'primary' }] });
    m.promise.then((v) => { if (v === 'again') App.startGame(App.last[0], App.last[1]); else App.showMenu(); });
  },
  gameMenu() {
    const g = App.game; if (!g || g.over) { App.showMenu(); return; }
    const body = el('div');
    const add = (label, fn, danger) => { const b = el('button', 'abtn', label); if (danger) b.style.borderColor = '#a04a44'; b.onclick = () => { m.close(null); fn(); }; body.append(b); };
    add('▶ Resume', () => {});
    add('💡 Strategy guide', () => App.showGuideModal());
    if (!UI.isNative) add(UI.fsElement() ? '⛶ Exit full screen' : '⛶ Full screen', () => UI.toggleFullscreen());
    add('⚙️ Settings', () => App.showSettings());
    add('🏳️ Concede', () => UI.modal({ center: true, title: 'Concede?', body: '<p>This counts as a loss.</p>', buttons: [{ label: 'Keep playing', value: false }, { label: 'Concede', value: true, cls: 'primary' }] }).promise.then((v) => { if (v) { if (UI.priorityResolve) { g.concede(0); const r = UI.priorityResolve; UI.priorityResolve = null; r({ type: 'concede' }); } else g.concede(0); setTimeout(() => { if (!UI.gameOver) App.gameEnded(g); }, 50); } }), true);
    add('🏠 Quit to menu', () => { App.abortGame(); App.showMenu(); }, true);
    const m = UI.modal({ title: 'Menu', body });
  },
});

// Android Back button (called from the native shell)
window.onAndroidBack = function () {
  if (UI.closeTopDialog()) return true;
  if (UI.screen === 'game') { App.gameMenu(); return true; }
  if (UI.screen === 'decks' || UI.screen === 'guide') { App.showMenu(); return true; }
  return false;
};

window.addEventListener('DOMContentLoaded', () => {
  Settings.load();
  UI.g = new MTG.Game({ decks: [[], []], controllers: [], names: ['You', 'Opponent'] });   // dummy game so card inspection works on menus
  UI.init(); App.showMenu();
});
})();
