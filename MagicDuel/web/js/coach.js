'use strict';
/* Coach: explains the best play and WHY, using the same Brain the AI plays with.
 * Every advise*() returns { title, headline, items: [{text, why}], highlight: [cardIds], lesson: principleKey, alternatives: [string] }.
 */
(function () {
const MTG = (globalThis.MTG = globalThis.MTG || {});
const B = MTG.Brain;
const Coach = (MTG.Coach = {});

Coach.lessons = {
  mana: { title: 'Land drops', text: 'Hit a land drop every turn until you have about 5–6 lands. Mana is the resource that everything else spends, and a turn without a land is a turn of development you never get back. When you have a choice of lands, play the one that gives you the colors your hand needs.' },
  mulligan: { title: 'Keeping a hand', text: 'A good 7-card hand has 2–5 lands and some plays in the first three turns. One-landers and zero-landers are almost always mulligans; six-landers flood. With the London mulligan you draw 7 and bottom one card per mulligan, so a mulligan costs less than it feels like.' },
  development: { title: 'Curve out', text: 'Spend all of your mana every turn if you can: a 2-drop on turn 2, a 3-drop on turn 3, and so on. Unused mana is wasted tempo. The best plays of the early game are efficient creatures that block and attack well for their cost.' },
  ramp: { title: 'Ramp & acceleration', text: 'Mana creatures and ramp spells convert early turns into extra mana, letting you cast your expensive spells a turn or two ahead of the opponent. Protect your mana creatures from cheap removal if you can, and use the extra mana every turn — ramp is only good if you cash it in.' },
  removal: { title: 'Using removal well', text: 'Removal is best spent on creatures that are more expensive or more dangerous than the removal spell. Do not waste premium removal on a 1/1 if a Serra Angel could show up next turn — but do not hold it so long that you fall too far behind. Killing a creature before it ever attacks or blocks is the most mana-efficient use.' },
  tempo: { title: 'Tempo', text: 'Tempo is about using your mana more efficiently than your opponent. Cheap interaction (tapping, bouncing, killing a big creature for 2 mana) lets you develop more than they do. A tempo lead lets you attack while they are busy replaying things.' },
  'card-advantage': { title: 'Card advantage', text: 'Every card in hand is a resource. Spells that draw cards, creatures that replace themselves, and 2-for-1 effects win long games. Spend spare mana on draw when you have nothing better — especially at the end of the opponent\'s turn with instants like Opt.' },
  reach: { title: 'Reach & burn', text: 'Burn is flexible: it removes creatures or finishes the game. Early on, use it on creatures; save the leftover for the face when the opponent is in range. Always count how much burn you hold when deciding whether an attack is lethal.' },
  lethal: { title: 'Always check for lethal', text: 'Before anything else each turn, add up: unblocked attackers + burn in hand + pump. If the number meets the opponent\'s life total, take the win now. Likewise, check what they can do to you next turn before you tap out or attack with everything.' },
  attack: { title: 'Attacking', text: 'Before attacking ask: what can block this, and what happens if it does? Attack when your creature is evasive, when no blocker can kill it profitably, or when you are happy with the trade. Do not attack if the counter-attack would put you in danger. Creatures with vigilance attack without giving up defense.' },
  block: { title: 'Blocking', text: 'A good block kills the attacker and keeps your creature (or at least trades evenly). Blocking to save life is fine when you are low, but remember life is a resource: spending a creature to save 2 life early is usually wrong. Chump-block only when you must to stay alive.' },
  counter: { title: 'Counterspells', text: 'Counterspells are best saved for spells that really matter: bombs, big creatures, card-advantage spells and removal on your best creature. Leave the mana open on your opponent\'s turn instead of tapping out. A cheap counter on an expensive spell is a big tempo swing.' },
  protect: { title: 'Protecting your creatures', text: 'A protection spell in response to removal (indestructible, hexproof, +toughness) wins you a full card and the opponent\'s mana. You need to leave mana open and hold priority-aware instants — responding is what the stack is for.' },
  trick: { title: 'Combat tricks', text: 'Pump spells and instant removal are strongest after blockers are declared: the opponent has committed and cannot undo it. The best trick turns a trade or a loss into a one-sided win. Do not cast a trick when your creature would have survived anyway.' },
  racing: { title: 'Who is the beatdown?', text: 'In every matchup one player is the beatdown (the aggressor) and the other is the control. If you are the beatdown, attack and use your spells to push damage. If you are the control, trade resources, stabilise the board and win with card quality. Playing the wrong role is a classic way to lose.' },
  overextend: { title: 'Do not overextend', text: 'Putting too many creatures onto the board into a possible sweeper (like Pyroclasm or Goblin Chainwhirler) can lose you the game. If you are already ahead, keep a threat or two in hand as insurance.' },
};

/* ---------- deck profile ---------- */
Coach.deckProfile = function (names) {
  const cards = names.map((n) => MTG.cards[n]).filter(Boolean);
  const spells = cards.filter((c) => !c.types.includes('Land'));
  const creatures = spells.filter((c) => c.types.includes('Creature'));
  const avg = spells.reduce((a, c) => a + c.cmc, 0) / Math.max(1, spells.length);
  const removal = spells.filter((c) => c.fx && ['damage', 'destroy', 'shrink', 'pacify', 'exile'].includes(c.fx.kind) || c.tag === 'removal').length;
  const counters = spells.filter((c) => c.fx && c.fx.kind === 'counter').length;
  const draw = spells.filter((c) => c.tag === 'draw' || c.tag === 'cantrip').length;
  const fliers = creatures.filter((c) => c.kw.includes('flying')).length;
  const ramp = spells.filter((c) => c.tag === 'mana' || c.tag === 'ramp').length;
  const big = spells.filter((c) => c.cmc >= 5).length;
  const lands = cards.length - spells.length;
  let arch = 'Midrange';
  if (avg <= 2.45 && creatures.length >= 12) arch = 'Aggro';
  else if (counters + draw >= 5 || (creatures.length <= 11 && removal + counters + draw >= 9)) arch = 'Control';
  else if (ramp >= 4 && big >= 2) arch = 'Ramp';
  const plans = {
    Aggro: 'Curve out, attack every turn and use burn/removal to clear blockers. You win by dealing damage before the opponent stabilises.',
    Control: 'Trade one-for-one, keep counter/removal mana up, draw extra cards, and win late with your flyers and big threats.',
    Midrange: 'Develop a solid board, remove the opponent\'s best threats and out-value them. Be flexible: attack when ahead, defend when behind.',
    Ramp: 'Play mana creatures and land-fetchers early, then land huge threats ahead of schedule. Protect the early game with blockers.',
  };
  const tips = [];
  if (lands < 16) tips.push('Your deck runs fewer than 16 lands: keep hands with 2+ lands.');
  tips.push(`${creatures.length} creatures, ${removal} removal/burn, ${counters} counters, ${draw} draw. Average spell cost ${avg.toFixed(1)}.`);
  return { archetype: arch, plan: plans[arch], tips, stats: { creatures: creatures.length, removal, counters, draw, fliers, ramp, big, avg } };
};
Coach.matchup = function (me, opp) {
  const m = {
    'Aggro:Aggro': 'Both decks want to race. The player who curves out best and uses removal on the right attacker wins. Do not trade your removal for a mere 1/1.',
    'Aggro:Control': 'You are the beatdown. Apply pressure early before their counters and removal come online, and do not overextend into a sweeper.',
    'Aggro:Midrange': 'Their creatures are bigger. Use evasion and burn to get damage in, and avoid attacking small creatures into big blockers.',
    'Aggro:Ramp': 'Punish their slow start: attack hard in the first four turns before the big creatures land.',
    'Control:Aggro': 'You are the control. Survive the early game by trading removal for their threats and gaining life, then win with card advantage.',
    'Control:Control': 'A patient mirror. Hold counters for their card-draw spells and bombs, and develop threats only when they are tapped out.',
    'Control:Midrange': 'Answer their best threat each turn and land your finishers. Counter their expensive spells, kill the cheap ones.',
    'Control:Ramp': 'Counter or kill the early mana creatures if you can, and save your answers for their big finishers.',
    'Midrange:Aggro': 'Be the control early: block well and trade, then your bigger creatures take over. Life is a resource but do not fall too low.',
    'Midrange:Control': 'You are the beatdown. Deploy a threat each turn and bait counterspells with less important spells first.',
    'Midrange:Midrange': 'Efficiency decides this one: use removal on their best threat, keep card parity, and make good attacks.',
    'Midrange:Ramp': 'Pressure them while they ramp, and make sure you have answers to the huge creatures they will land.',
    'Ramp:Aggro': 'Your early creatures are your lifeline: block, trade, and get to your big spells. Do not lose all your mana creatures to attacks.',
    'Ramp:Control': 'You can out-mana them. Land threats ahead of schedule and make them have the counter.',
    'Ramp:Midrange': 'Ramp into bigger creatures than they have. Use your fight spells and removal on their best creature.',
    'Ramp:Ramp': 'A race of big spells. Land your biggest threat first and keep removal for theirs.',
  };
  return m[me.archetype + ':' + opp.archetype] || 'Play to your deck\'s strengths.';
};

/* ---------- helpers ---------- */
const nm = (c) => c.name;
const ids = (arr) => arr.map((c) => c.id);
function eval_(g, p) {
  const me = p.idx, opp = g.players[1 - me];
  const my = B.boardValue(g, me), th = B.boardValue(g, 1 - me);
  const myPow = g.creatures(me).reduce((a, c) => a + g.power(c), 0), thPow = g.creatures(1 - me).reduce((a, c) => a + g.power(c), 0);
  return { my, th, myPow, thPow, life: p.life, oppLife: opp.life, hand: p.hand.length, oppHand: opp.hand.length };
}
Coach.positionLine = function (g, p) {
  const e = eval_(g, p);
  const parts = [];
  if (e.my > e.th * 1.25 + 1) parts.push('Your board is stronger'); else if (e.th > e.my * 1.25 + 1) parts.push('Their board is stronger'); else parts.push('The boards are about even');
  if (e.life >= e.oppLife + 5) parts.push('you lead on life'); else if (e.oppLife >= e.life + 5) parts.push('you trail on life');
  if (e.hand > e.oppHand + 1) parts.push('you have more cards'); else if (e.oppHand > e.hand + 1) parts.push('they have more cards');
  return parts.join(', ') + '.';
};

/* ---------- advice ---------- */
Coach.adviseMulligan = function (g, p, hand, mulls) {
  const r = B.keepHand(g, p, hand, mulls);
  return { title: 'Opening hand', headline: r.keep ? 'Keep this hand' : 'Mulligan this hand', items: [{ text: r.keep ? 'Keep' : 'Mulligan', why: r.reason }], highlight: [], lesson: 'mulligan', alternatives: [r.keep ? 'Mulligan only if you think the hand cannot function. A mulligan costs a card, so marginal hands are normally kept.' : 'You could keep it and hope to draw lands, but the odds are against you; the London mulligan lets you choose the best 6 or 5 of 7 cards.'], rec: r.keep ? 'keep' : 'mull' };
};
Coach.adviseMain = function (g, p) {
  const plan = B.planMain(g, p);
  const items = [], highlight = [];
  let lesson = 'development';
  const lethalStep = plan.steps.find((s) => s.principle === 'lethal');
  if (lethalStep) { lesson = 'lethal'; }
  for (const s of plan.steps) {
    const why = s.reason.replace(/^(Cast|Play|Equip|Use|Activate|Crack|Bring|Spend) [^:—]*[:—]\s*/, '').replace(/^./, (ch) => ch.toUpperCase());
    const later = g.step === 'main1' && s.kind !== 'land' && !s.pre && g.creatures(p.idx).some((c) => g.canAttack(c));
    items.push({ text: (s.kind === 'land' ? `Play ${s.card.name}` : s.kind === 'cast' ? `Cast ${s.card.name}` : `Activate ${s.perm.name}`) + (later ? ' (after combat)' : ''), why: why + (later ? ' Cast it after combat in Main 2: the opponent has less information when deciding blocks, and your mana stays open for tricks during combat.' : '') });
    highlight.push((s.card || s.perm).id);
    if (!lethalStep && s.principle && ['removal', 'ramp', 'card-advantage', 'mana', 'tempo', 'reach'].includes(s.principle)) lesson = s.principle;
  }
  if (plan.danger && plan.danger.near) {
    const d = plan.danger;
    items.unshift({ text: d.lethal ? '⚠ You are facing lethal damage' : '⚠ You are under heavy pressure', why: `Their creatures can deal about ${d.dmg} damage next turn and you are at ${p.life}${d.lethal ? ' — that is lethal if you do nothing' : ''}. Priorities: keep blockers back, and hold instant-speed removal${plan.reserve ? ` (${plan.reserve.name})` : ''} with mana open instead of tapping out.` });
    lesson = 'block';
  }
  const state = Coach.positionLine(g, p);
  const mana = g.availableMana(p);
  const post = plan.steps.filter((s) => s.kind !== 'land');
  let headline;
  if (!plan.steps.length) {
    headline = 'Nothing worth casting right now';
    items.push({ text: 'Move to combat or pass the turn', why: p.hand.length ? 'None of your cards is a good play with the mana you have. Holding cards is fine — do not cast things just to cast them.' : 'Your hand is empty. Keep attacking where it is safe and topdeck.' });
  } else headline = (plan.land ? 'Land, then ' : '') + (post.length ? post.slice(0, 2).map((s) => (s.card || s.perm).name).join(' + ') : 'pass');
  const alts = [];
  const top = plan.set.reduce((a, s) => a + s.score, 0);
  for (const o of plan.castable.slice(0, 2)) alts.push(`${o.card ? o.card.name : o.perm.name}: also castable (rated ${o.score.toFixed(1)}), but you can't afford it together with the plan above (plan rated ${top.toFixed(1)}). Pick it instead if you value ${g.isCreature(o.card || o.perm) ? 'a different body on the board' : 'its effect'} more.`);
  for (const n of plan.notes) alts.push(n);
  const unspent = mana - post.reduce((a, s) => a + (s.cost ? s.cost.generic + s.cost.W + s.cost.U + s.cost.B + s.cost.R + s.cost.G + s.cost.C : 0), 0) - (plan.land ? 1 : 0);
  if (post.length && unspent > 1 && p.hand.some((c) => !g.isLand(c))) alts.push(`After this plan you still have about ${Math.max(0, unspent)} mana unspent — normal if nothing else is castable.`);
  return { title: 'Main phase', headline, items, highlight, lesson, alternatives: alts, state, plan };
};
Coach.adviseAttack = function (g, p, possible) {
  const plan = B.attackPlan(g, p, possible);
  const items = [], highlight = [];
  for (const a of plan.attackers) { items.push({ text: `Attack with ${a.card.name}`, why: a.reason }); highlight.push(a.card.id); }
  for (const s of plan.stay) items.push({ text: `Keep ${s.card.name} home`, why: s.reason });
  const opp = g.players[1 - p.idx];
  const headline = plan.lethal ? 'Attack with everything — it\'s lethal!' : plan.attackers.length ? `Attack with ${plan.attackers.map((a) => a.card.name).join(', ')}` : 'No attack this turn';
  const alts = [];
  if (!plan.lethal && plan.attackers.length < possible.length) alts.push('Attacking with more creatures forces chump blocks or trades, but leaves you open to a counter-attack. Stay patient unless the race favours you.');
  if (!plan.attackers.length) alts.push(`If you are the beatdown you can consider trading creatures, but with ${opp.name}'s untapped blockers an attack just loses material.`);
  return { title: 'Declare attackers', headline, items, highlight, lesson: plan.lethal ? 'lethal' : 'attack', alternatives: alts, plan, state: Coach.positionLine(g, p) };
};
Coach.adviseBlock = function (g, p, attackers, blockers) {
  const plan = B.blockPlan(g, p, attackers, blockers);
  const items = [], highlight = [];
  for (const b of plan.blocks) { if (b.reason.startsWith('(')) continue; items.push({ text: `${b.blocker.name} blocks ${b.attacker.name}`, why: b.reason }); highlight.push(b.blocker.id); }
  const total = attackers.reduce((a, c) => a + g.power(c), 0);
  const taken = attackers.filter((a) => !plan.blocks.some((b) => b.attacker === a)).reduce((a, c) => a + g.power(c), 0);
  const headline = plan.blocks.length ? `Block: ${plan.blocks.filter((b) => !b.reason.startsWith('(')).map((b) => `${b.blocker.name}→${b.attacker.name}`).join(', ')}` : 'No block — take the damage';
  if (!plan.blocks.length) items.push({ text: 'Do not block', why: `Taking ${total} (you are at ${p.life}) is fine: none of your possible blocks is profitable. Keep your creatures for your own attacks.` });
  const alts = [`If you block nothing you take ${total}; with the plan above you take ${taken}.`];
  return { title: 'Declare blockers', headline, items, highlight, lesson: 'block', alternatives: alts, plan };
};
Coach.adviseResponse = function (g, p) {
  const top = g.stack[g.stack.length - 1];
  const r = B.respond(g, p);
  if (r && r.kind !== 'skip') return { title: 'Respond?', headline: `Yes: ${r.card ? r.card.name : r.perm.name}`, items: [{ text: `Cast ${(r.card || r.perm).name}`, why: r.reason }], highlight: [(r.card || r.perm).id], lesson: r.principle === 'counter' ? 'counter' : (r.principle === 'protect' ? 'protect' : 'trick'), alternatives: ['Pass priority to let it resolve.'] };
  let why = 'You have nothing useful to respond with.';
  if (!top) { const held = p.hand.filter((c) => g.hasFlash(c)); why = held.length ? `Nothing is worth casting right now. Keep ${held.slice(0, 2).map((c) => c.name).join(' / ')} for a better moment (combat, or in response to their spell).` : 'Nothing to respond to — just pass.'; return { title: 'Priority', headline: held.length ? 'Pass — keep your instants' : 'Pass priority', items: [{ text: 'Pass priority', why }], highlight: [], lesson: 'trick', alternatives: [] }; }
  if (top && top.kind === 'spell') {
    const cn = B.counterAdvice(g, p, top);
    if (cn && cn.kind === 'skip') why = cn.reason;
    else if (p.hand.some((c) => c.def.fx && c.def.fx.kind === 'counter')) why = 'You hold a counterspell but cannot cast it right now (not enough mana or no legal target).';
  }
  return { title: 'Respond?', headline: 'Let it resolve', items: [{ text: 'Pass priority', why }], highlight: [], lesson: 'counter', alternatives: [] };
};
Coach.adviseTarget = function (g, p, spec, o) {
  const pick = B.pickTarget(g, p, spec, { source: o.source, controller: p.idx }, o.legal);
  if (!pick) return null;
  const name = pick.isPlayer ? pick.name : pick.card ? pick.card.name : pick.name;
  let why;
  if (pick.isPlayer) why = pick.idx === p.idx ? 'Targets yourself.' : 'Going face: it puts them closer to lethal, and no creature is a better target.';
  else if (pick.kind === 'spell') why = 'This is the most expensive/threatening spell on the stack.';
  else if (pick.controller !== p.idx) why = `${describe(g, pick)} is the most valuable thing you can hit (value ${B.permValue(g, pick).toFixed(0)}).`;
  else why = `${describe(g, pick)} benefits most from this.`;
  return { title: 'Choose a target', headline: `Target ${name}`, items: [{ text: `Target ${name}`, why }], highlight: [pick.isPlayer ? null : (pick.card ? pick.card.id : pick.id)].filter(Boolean), lesson: 'removal', alternatives: [], pick };
};
function describe(g, c) { const ch = g.chars(c); return `${c.name} (${ch.power}/${ch.toughness})`; }
Coach.adviseScry = function (g, p, cards) {
  const r = B.scryChoice(g, p, cards);
  return { title: 'Scry', headline: r.bottom.length ? `Bottom ${r.bottom.map(nm).join(', ')}` : 'Keep everything on top', items: r.reasons.map((x) => ({ text: x, why: '' })), highlight: [], lesson: 'mana', alternatives: [], r };
};
Coach.adviseDiscard = function (g, p, cards, n) {
  const pick = B.discardPick(g, p, cards, n);
  return { title: 'Discard', headline: `Discard ${pick.map(nm).join(', ')}`, items: pick.map((c) => ({ text: c.name, why: g.isLand(c) ? 'You already have plenty of lands.' : 'Least useful card for your current plan.' })), highlight: ids(pick), lesson: 'card-advantage', alternatives: [] };
};

/* ---------- feedback on what the player did ---------- */
Coach.reviewAttack = function (g, p, chosen, plan) {
  const rec = new Set(plan.attackers.map((a) => a.card));
  const mine = new Set(chosen);
  const extra = chosen.filter((c) => !rec.has(c)), missed = [...rec].filter((c) => !mine.has(c));
  if (!extra.length && !missed.length) return { ok: true, text: 'Matches the coach\'s attack.' };
  const msgs = [];
  for (const c of extra) { const s = plan.stay.find((x) => x.card === c); msgs.push(`${c.name} attacked, but the coach would keep it home: ${s ? s.reason : 'it risks the creature for little gain.'}`); }
  for (const c of missed) { const a = plan.attackers.find((x) => x.card === c); msgs.push(`The coach would also attack with ${c.name}: ${a.reason}`); }
  return { ok: false, text: msgs.join(' ') };
};
Coach.reviewBlock = function (g, p, pairs, plan) {
  const recm = new Map(plan.blocks.map((b) => [b.blocker, b.attacker]));
  const mine = new Map(pairs.map(([b, a]) => [b, a]));
  const diff = [];
  for (const [b, a] of mine) if (recm.get(b) !== a) diff.push(`${b.name} blocking ${a.name} is not what the coach suggested.`);
  for (const [b, a] of recm) if (!mine.has(b)) { const r = plan.blocks.find((x) => x.blocker === b); diff.push(`Coach: ${r.reason}`); }
  return diff.length ? { ok: false, text: diff.join(' ') } : { ok: true, text: 'Your blocks match the coach.' };
};
// End-of-turn check: unused mana + castable cards left in hand
Coach.turnReview = function (g, p) {
  const spare = g.availableMana(p);
  const castable = p.hand.filter((c) => !g.isLand(c) && !g.hasFlash(c) && g.canPay(p, c.def.costObj, 0));
  const holdInst = p.hand.filter((c) => g.hasFlash(c));
  const msgs = [];
  if (castable.length) msgs.push(`You ended the turn with ${spare} mana unused while holding ${castable.map(nm).slice(0, 2).join(' / ')} that you could have cast. Using your mana each turn is the core of tempo.`);
  const landLeft = p.hand.some((c) => g.isLand(c)) && p.landDrops > 0;
  if (landLeft) msgs.push('You still had a land drop available and did not use it.');
  const cheapest = holdInst.length ? Math.min(...holdInst.map((c) => c.def.cmc)) : 99;
  if (!msgs.length && holdInst.length && spare >= cheapest) msgs.push(`Good: you are holding ${holdInst.map(nm).slice(0, 2).join(' / ')} with mana open — that is deliberate play, not wasted mana.`);
  return msgs;
};

/* ---------- post-game review ---------- */
Coach.gameReview = function (g, pi) {
  const p = g.players[pi], opp = g.players[1 - pi];
  const won = g.winner === pi;
  const turns = p.stats.turns;
  const eff = p.stats.manaAvail ? Math.round(100 * p.stats.manaSpent / p.stats.manaAvail) : 0;
  const items = [];
  items.push({ ok: eff >= 65, title: `Mana efficiency: ${eff}%`, text: eff >= 65 ? 'You used most of your mana — good tempo.' : 'You left a lot of mana unspent. Try to curve out: cast a spell at every opportunity in the first five turns, and spend spare mana on card draw or abilities.' });
  items.push({ ok: p.stats.missedLands === 0, title: p.stats.missedLands ? `Missed land drops: ${p.stats.missedLands}` : 'Every land drop made', text: p.stats.missedLands ? 'You skipped a land drop with a land in hand. Always play a land if you have one (unless a trick needs the hidden information).' : 'You played a land every turn you could.' });
  const dealt = p.stats.damageDealt;
  items.push({ ok: dealt >= 10 || won, title: `Damage dealt: ${dealt}`, text: dealt >= 15 ? 'You applied real pressure.' : 'Little damage dealt. If you were the beatdown, try attacking earlier; if you were the control, make sure your late game is strong enough.' });
  const lifeLost = 20 - p.life;
  items.push({ ok: lifeLost < 15 || won, title: `Life lost: ${Math.max(0, lifeLost)}`, text: lifeLost > 15 ? 'You took a lot of damage. Trade creatures and use removal earlier to protect your life total.' : 'You kept your life total under control.' });
  const lesson = won ? 'racing' : (turns.length < 6 ? 'development' : 'removal');
  return { won, summary: g.resultReason, eff, items, turns: turns.map((t) => ({ turn: t.turn, avail: t.avail, spent: t.spent, lands: t.lands })), lesson, opp: opp.name };
};
})();
