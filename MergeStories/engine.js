/* Merge Stories engine (the console). Everything here is shared by every story.
   A story (a "cartridge", events/<id>/event.js) is configuration only: EVENT (title, terms, cover, css, music,
   rewards, wheel), CONFIG, CHAINS, LAYOUT, CAST, CHAPTERS, TASKS, PASS, FELIX, MOON_NOTES, P2, SHOP_ITEMS,
   REFLECTIONS, GEN_STORY, QUESTS. All behaviour lives here.
   Framework item types use reserved chain keys; a story only names them and sets their numbers:
     E  booster (tea): drop on a generator so its next taps find rare items more often. Can't be claimed.
     C coins · X applause/xp · N pass points · H time skips · CP wheel tickets: tap twice to claim
     ET egg timer (refills one generator) · V time chargers · Q donation boxes (free taps)
     G/Y/O orchard: seedlings → tree (a generator that withers into a log) → fruit · Z compost bin · U stove
     WH (any chain with wheel:true) prize wheel · the chain with story:true holds the lore items
   See README.md for the full list. */
const T = EVENT.terms;
const WH_ = EVENT.wheel || {}, WHEEL_COST = WH_.cost || 10, WHEEL_N = WH_.n || 20,
      WHEEL_SEGS = WH_.segs || [], WHEEL_LAST = WH_.last || [], WHEEL_INTRO = WH_.intro || [],
      WHEEL_LIGHT = WH_.light || [['C',1]], WHEEL_REPEAT = WH_.repeat || [['C',1]];
const WHEEL_KEY = Object.keys(CHAINS).find(k=>CHAINS[k].wheel);
const STORY_KEY = Object.keys(CHAINS).find(k=>CHAINS[k].story);
/* ---------- rewards. A story sets the numbers in EVENT.rewards; how they're handed out lives here.
   A table like [[30,2],[0,1]] means "value 30 or more gives 2, otherwise 1". */
const RW = Object.assign({
  order:   { coins:[[0,1]], xp:[[4,3],[2,2],[0,1]], points:[[3,2],[0,1]], tickets:null },
  finale:  [['C',3],['X',4],['N',3]],
  side:    { coins:[[0,1]], bigPoints:24, timerAt:12, timerChance:.3, tickets:null, lucky:[['C',1],['N',1]] },
  stage:   l => l%4===0 ? [['H',1],['C',2]] : l%2 ? [['C',2]] : [['E',2]],
  discovery: { coinsPerLevel:2, topCoins:0, xpFrom:5 },
  quests:  [[['C',1],['E',1]],[['C',2],['E',2]],[['E',3],['H',1]],[['E',3],['H',2],['N',1]],[['E',4],['H',2],['N',2]],[['E',4],['H',3],['N',3]]],
}, EVENT.rewards||{});
const tierOf=(table,v)=>{ for(const [min,val] of table) if(v>=min) return val; return table[table.length-1][1]; };
function taskRewards(t){
  if(t.who==='O') return RW.finale;              // the last order of the story
  const o=RW.order, rw=[['C',tierOf(o.coins,t.coins||0)],['X',tierOf(o.xp,t.ch)],['N',tierOf(o.points,t.ch)]];
  if(o.tickets && CHAINS.CP) rw.push(['CP',tierOf(o.tickets,t.ch)]);   // one of each, never two of the same item
  return rw;
}
function sideRewards(size,lucky){
  const s=RW.side; if(lucky) return s.lucky;
  const rw=[['C',tierOf(s.coins,size)],['N', size>=s.bigPoints&&Math.random()<.5?2:1]];
  if(size>=s.timerAt && Math.random()<s.timerChance) rw.push(['ET',1]);
  if(s.tickets && CHAINS.CP && (size>=s.tickets.always || Math.random()<s.tickets.chance)) rw.push(['CP',1]);
  return rw;
}
const stageReward = l => RW.stage(l);
/* collection reveal: coins per level (or only for a chain's top item) and applause for big finds */
function discRw(k,l){ const d=RW.discovery, L=l+(CHAINS[k].gen?1:0);
  return {c: d.coinsPerLevel ? d.coinsPerLevel*L : (l===maxL(k)&&l>1 ? d.topCoins : 0), x: L>=d.xpFrom ? L : 0}; }
const QUEST_RW = RW.quests;
/* the board: 9 rows × 7, four zones from the bottom up (rows 7-9 open, then 5-6, 3-4, 1-2) */
const zoneOfRow = r => r>=6?0 : r>=4?1 : r>=2?2 : 3;
/* ============================================================
   LARKSPUR ATTIC — event #1 of a Merge-Mansion-style event game
   All tuning lives in CONFIG / CHAINS / LAYOUT / TASKS / CHAPTERS
   ============================================================ */

/* ---------- merge chains ---------- */

/* ---------- board: o=open, w=cobweb (visible, merge onto it to free), b=box (hidden until a merge next to it) ---------- */

/* ---------- cast ---------- */

/* ---------- story ---------- */

/* ---------- orders ---------- */
/* wheel:n = the order also needs n Prize Wheel lights back on */
/* stable ids: original orders keep 0..27 so existing saves line up; orders added later (x:1) get 100+ */
{ let n=0, m=100; TASKS.forEach(t=>{ if(t.id!=null) return; t.id = t.x ? m++ : n++; }); } // preset ids (200+) never shift old saves
/* order rewards land on the board as claimable items (coins + applause), like Merge Mansion */
/* Jumble Sale: side orders that never run out, built from generators you already have,
   so there is always something to work on whatever happens to the story orders */
function sideGens(){ const g=new Set(); S.cells.forEach(c=>{ if(c.s==='open'&&c.it&&isGen(c.it)){ const m=CHAINS[c.it.k].main; if(m&&m!=='E'&&m!=='M') g.add(m); } }); return [...g]; }
/* JUMBLE SALE DIFFICULTY. Orders get harder as the event goes on (higher levels, more rare items,
   more two-item orders), which pushes you to upgrade generators. About 1 in 6 is a 🍀 lucky easy one.
   progress(): 0 at the start of the event, 1 near the end. */
function sideTargets(){
  // chains you can actually make right now: each generator on the board gives its main chain and its rare chain
  const m=new Map();
  S.cells.forEach(c=>{ if(c.s==='open'&&c.it&&isGen(c.it)){ const ch=CHAINS[c.it.k];
    if(ch.main&&ch.main!=='E'&&ch.main!=='M'&&ch.main!=='V') m.set(ch.main,false);
    if(typeof ch.rare==='string'&&CHAINS[ch.rare]&&!CHAINS[ch.rare].type) m.set(ch.rare,true); } });
  return [...m].map(([k,rare])=>({k,rare}));
}
function makeSide(){
  const all=sideTargets(); if(!all.length) return null;
  const common=all.filter(x=>!x.rare), rares=all.filter(x=>x.rare);
  const p=Math.max(0,Math.min(1,sideProgress()));
  const lucky=Math.random()<1/6;
  const pickOne=(allowRare)=>{
    const rare = allowRare && rares.length && Math.random() < .08+.32*p;
    const t = rare ? rares[Math.floor(Math.random()*rares.length)] : (common.length?common:all)[Math.floor(Math.random()*(common.length?common:all).length)];
    const top=maxL(t.k);
    let l;
    if(lucky) l=1+Math.floor(Math.random()*2);                          // 🍀 level 1-2
    else if(t.rare) l=1+Math.floor(p*2.6+Math.random()*1.2);             // rare: 1-2 early, up to 4 late
    else l=Math.round(1.6+p*3.6+(Math.random()*2-1));                    // common: ~2 early, ~5 late, ±1
    return [t.k, Math.max(1,Math.min(l, top, t.rare?4:6))];
  };
  let need;
  for(let tries=0;tries<20;tries++){
    need=[pickOne(!lucky)];
    if(!lucky && Math.random()<.2+.35*p){ const b=pickOne(true); b[1]=Math.max(1,b[1]-1); if(b[0]!==need[0][0]||b[1]!==need[0][1]) need.push(b); }
    if(!need.every(([k,l])=>openCount(k,l)>0)) break;                    // never already sitting on the board
  }
  const size=need.reduce((a,[k,l])=>a+(1<<(l-1))*(CHAINS[k].rare?3:1),0); // effort in level-1 items
  S.sideN=(S.sideN||0)+1;
  return {id:'s'+S.sideN, who:'S', side:true, lucky, need, rw:sideRewards(size,lucky), say: lucky?T.sideLucky:T.sideSay};
}
function sideProgress(){ return S.ch/5*.8 + Math.min(.2,(S.sideDone||0)/150); }
/* the White Elephant stall only opens once you've met Mrs Hale (order 200) */
function ensureSide(){ S.side=S.side||[]; if(!S.sideOn) return; while(S.side.length<2){ const o=makeSide(); if(!o) break; S.side.push(o); } }

/* Rosette Board: event points from rosettes unlock tiers of rewards outside the board */
/* every third tier also unlocks a note from a past winner */
/* winners' notes: every third Rosette Board reward unlocks one (the story told by past winners) */
/* the first time you claim each rosette level, Dot's fete scrapbook has something to say */
const FOCUS=[2,5,12,30,75], FOCUS_MULT=5;
const isBoost = it => CHAINS[it.k].type==='boost';
const canFocus=it=>isGen(it)&&typeof CHAINS[it.k].rare==='string'&&!!CHAINS[CHAINS[it.k].rare]&&CHAINS[CHAINS[it.k].rare].rare===true;
function useOn(a,b){
  const A=S.cells[a].it, B=S.cells[b].it; if(!A||!B||!isGen(B)||S.cells[b].s!=='open') return false;
  const T=def(B);
  if(A.k==='ET'){
    if(!T.charges){ SND.play('nope'); flo(`${def(A).e} That doesn’t need refilling`, b); return true; }
    refreshCharges(B);
    if(B.ch>=T.charges){ SND.play('nope'); flo(`${T.e} Already full. Save the ${def(A).e} for later`, b); return true; }
    S.cells[a].it=null; B.ch=T.charges; B.t=now(); fx[b]='pop'; SND.play('unweb'); if(sel===a) sel=b;
    flo(`${def(A).e} ${T.n} refilled`, b); save(); render(); return true;
  }
  if(isBoost(A) && !A.st){
    if(!canFocus(B)){ SND.play('nope'); flo(`${def(A).e} Only works on a generator with rare finds`, b); return true; }
    const n=FOCUS[A.l-1]; S.cells[a].it=null; B.focus=(B.focus||0)+n; fx[b]='pop'; SND.play('drink'); if(sel===a) sel=b;
    const RC=CHAINS[CHAINS[B.k].rare];
    flo(`${def(A).e} Focused: ${B.focus} taps with ${FOCUS_MULT}× ${RC.items[0].e}`, b); save(); render(); return true;
  }
  return false;
}
function showShop(){
  const row=it=>{ const p=it.price(), d=shopLook(it);
    return `<div class="tier"><span class="tp">${d.e}</span><span class="tr" style="font-size:14px;letter-spacing:0">${d.n}<br><small style="color:var(--muted)">${it.what}</small></span><button class="sbtn" data-buy="${it.id}" ${S.coins<p?'disabled style="opacity:.5"':''}>🪙 ${p}</button></div>`; };
  openModal(`<h2>🛒 ${P2.shopName}</h2><p style="color:var(--muted);font-size:13px">• ${P2.shopBlurb}<br>• Earn coins from orders and the ${CAST.S.name} stall<br>• Tickets go straight in; the rest goes to your gifts 🎁</p>
    <p>🪙 ${S.coins} · 🎟️ ${S.chips||0}</p>${SHOP_ITEMS.map(row).join('')}<div class="row-btns"><button class="bigbtn" onclick="closeModal()">Close</button></div>`);
  $('modalBody').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const it=SHOP_ITEMS.find(x=>x.id===b.dataset.buy), p=it.price(); if(S.coins<p) return;
    S.coins-=p; it.give(); SND.play('coin'); stat('shop'); save(); render(); showShop(); flo(it.id==='TK'?'+10 🎟️':'Added to your gifts 🎁'); });
}
const shopLook = it => it.id==='TK'?{e:'🎟️',n:'10 Raffle Tickets'} : it.id==='ET'?CHAINS.ET.items[0] : it.id==='H1'?CHAINS.H.items[0] : {e:'🛒',n:it.id};
/* the mini shop: one item, offered right where you need it (a resting generator, the wheel when you're short).
   Saves a trip to the menu. `use` runs after paying (e.g. refill this generator now). */
function miniShop({id, title, sub, use, label}){
  closeMini();
  const it=SHOP_ITEMS.find(x=>x.id===id); if(!it) return false;
  const p=it.price(), d=shopLook(it), ok=S.coins>=p;
  const m=document.createElement('div'); m.id='mini';
  m.innerHTML=`<button class="op-x" aria-label="Close">✕</button><div class="mini-h">${title}</div>${sub?`<p class="mini-s">${sub}</p>`:''}
    <div class="mini-row"><span class="e">${d.e}</span><span class="n">${label||d.n}<small>You have 🪙 ${S.coins}</small></span>
    <button class="bigbtn${ok?' gold':''}" id="miniBuy" ${ok?'':'disabled style="opacity:.5"'}>🪙 ${p}</button></div>
    ${ok?'':`<p class="mini-s">Earn coins from orders and the ${CAST.S.name} stall</p>`}`;
  document.body.appendChild(m);
  m.querySelector('.op-x').onclick=closeMini;
  if(ok) m.querySelector('#miniBuy').onclick=()=>{ if(S.coins<it.price()) return; S.coins-=it.price(); stat('shop'); SND.play('coin');
    if(use) use(); else it.give(); closeMini(); save(); render(); };
  SND.play('tap'); return true;
}
function closeMini(){ const m=$('mini'); if(m) m.remove(); }
document.addEventListener('pointerdown',e=>{ const m=$('mini'); if(m && !m.contains(e.target)) closeMini(); },true);

/* ---------- the Prize Wheel ----------
   20 segments, each painted with an old Mystery Prize under a dark bulb. A ticket spins it. You never win the old
   prizes: the wheel just shows you what was there. Every stop shakes some loose change out of the old wheel.
   - 1st stop on a segment: its light comes back on, you see what was underneath and hear its story (+ a fiver)
   - 2nd stop: a fun, useless extra about it (+ a penny)
   - 3rd stop on: "this again, keep spinning" (+ a penny)
   Each story stands on its own, so the order you light them in never matters. The wheel leans towards dark
   segments (70%). Story orders need a number of lights on: the wheel is how the story moves. */
/* when the last light comes on */
/* why the wheel matters: twenty dark bulbs, and an old prize painted under each */
let wheelBusy=false, wheelCell=-1;
const wheelDone=()=>(S.wheel||[]).filter(Boolean).length;
function wheelPick(){ return Math.floor(Math.random()*WHEEL_N); }
/* stop on segment idx: counts the visit and shakes out loose change. Returns {hits, n} */
function wheelLand(idx){
  const hits=(S.wheel[idx]||0)+1; S.wheel[idx]=hits;
  dropItems(hits===1?WHEEL_LIGHT:WHEEL_REPEAT, wheelCell>=0?wheelCell:59); stat('wheel');
  const n=wheelDone();
  if(hits===1 && n===WHEEL_N) S.gifts.push(['H',2],['C',3]);
  return {hits, n};
}
function wheelSVG(){
  const R=130, c=140, seg=360/WHEEL_N, rad=a=>(a-90)*Math.PI/180, OPEN=['#e8547a','#ffc94a','#4fb3a9','#8f9cf0'];
  let g='';
  for(let i=0;i<WHEEL_N;i++){
    const a0=i*seg, a1=(i+1)*seg, open=S.wheel[i];
    const p0=[c+R*Math.cos(rad(a0)), c+R*Math.sin(rad(a0))], p1=[c+R*Math.cos(rad(a1)), c+R*Math.sin(rad(a1))];
    const fill = open ? OPEN[i%4] : (i%2?'#1f4651':'#28545f');
    g+=`<path d="M${c},${c} L${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${R},${R} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)} Z" fill="${fill}" stroke="#123039" stroke-width="1.5" ${S.wheelLast&&S.wheelLast.hits===1&&S.wheelLast.i===i?' class="justlit"':''}/>`;
    const m=rad(a0+seg/2), tx=c+98*Math.cos(m), ty=c+98*Math.sin(m);
    g+= open ? `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" font-size="19" text-anchor="middle" dominant-baseline="central" transform="rotate(${a0+seg/2} ${tx.toFixed(1)} ${ty.toFixed(1)})">${WHEEL_SEGS[i].e}</text>`
             : '';
  }
  return `<svg viewBox="0 0 280 280" width="100%" height="100%" aria-hidden="true">${g}<circle cx="140" cy="140" r="26" fill="#123039" stroke="#ffc94a" stroke-width="3"/><text x="140" y="141" font-size="22" text-anchor="middle" dominant-baseline="central">🎟️</text></svg>`;
}
/* the lit segments, oldest first, with their extra bit once you've heard it */
function wheelListHtml(withSpeakers){
  const fmtL=ls=>ls.map(([w,t])=>(w==='N'||t.startsWith('<em>')||!withSpeakers)?t:`<span style="font-weight:800">${CAST[w].name}:</span> ${t}`).join(withSpeakers?'<br>':' ');
  return WHEEL_SEGS.map((sg,i)=>{ const h=S.wheel[i]||0; if(!h) return '';
    return `<div class="lore" style="margin:4px 0"><span>${sg.e}</span><div><b>${sg.n}</b> · ${sg.yr}<br>${fmtL(withSpeakers?sg.story:sg.story.slice(0,1))}${h>=2?`<br><span style="color:var(--muted)">✨ ${fmtL(sg.tidbit)}</span>`:''}</div></div>`; }).join('');
}
function openWheel(i){
  wheelCell=i;
  const done=wheelDone(), last=S.wheelLast, sg=last?WHEEL_SEGS[last.i]:null;
  const got=l=>l.map(([k,lv])=>`${CHAINS[k].items[lv-1].e} ${CHAINS[k].items[lv-1].n}`).join(' + ')+' → on the board';
  const banner = !last ? '' : last.hits===1
      ? `<div class="wbanner new"><div class="wb1">💡 Light ${last.n} of ${WHEEL_N} is back on!</div><div class="wb2">Under it: ${sg.e} ${sg.n}, ${sg.yr}<br>${got(WHEEL_LIGHT)}</div></div>`
      : last.hits===2
      ? `<div class="wbanner"><div class="wb1">${sg.e} The ${sg.n} again</div><div class="wb2">✨ A little extra about it<br>${got(WHEEL_REPEAT)}</div></div>`
      : `<div class="wbanner"><div class="wb1">Oh, the ${sg.n} again ${sg.e}</div><div class="wb2">Some tickets back for your trouble<br>${got(WHEEL_REPEAT)}</div></div>`;
  openModal(`<h2>🎡 Prize Wheel</h2>
    <div class="wheelwrap"><div class="wheelptr">▼</div><div class="wheelclip"><div class="wheelspin" id="wheelSpin" style="transform:rotate(${S.wheelRot||0}deg)">${wheelSVG()}</div></div></div>
    <p style="text-align:center;margin:4px 0;font-variant-numeric:tabular-nums">💡 <b>${done}/${WHEEL_N}</b> lights on · 🎟️ ${S.chips||0} tickets</p>${banner}
    <div class="row-btns" style="justify-content:center;margin-top:4px"><button class="bigbtn gold" id="wheelGo" ${wheelBusy?'disabled':''}>Spin · ${WHEEL_COST} 🎟️</button><button class="bigbtn" id="wheelClose">Close</button></div>
    <h3>💡 Under the lights</h3>${wheelListHtml(false)||'<p style="color:var(--muted);font-size:13px">All dark so far. Each light shows an old Mystery Prize.</p>'}
    <details class="howto"><summary>How it works</summary><p>• ${WHEEL_COST} raffle tickets 🎟️ per spin · every segment equally likely<br>• Stop on a dark segment: 💡 its light comes back on and you see the old prize under it<br>• You don’t win the old prizes<br>• A new light shakes out ${WHEEL_LIGHT.map(([k,l])=>CHAINS[k].items[l-1].e).join(' ')} · a lit one gives back ${WHEEL_REPEAT.map(([k,l])=>CHAINS[k].items[l-1].e+' '+CHAINS[k].items[l-1].n).join(' ')}<br>• Story orders need lights on</p></details>`);
  $('wheelClose').onclick=()=>{ if(!wheelBusy) closeModal(); };
  $('wheelGo').onclick=spinWheel;
  if(!S.wheelIntro){ S.wheelIntro=1; save(); playScene({clear:true, title:'The Prize Wheel', sub:'Twenty dark bulbs', lines:WHEEL_INTRO}); }
}
function spinWheel(){
  if(wheelBusy) return;
  if((S.chips||0)<WHEEL_COST){ SND.play('nope'); ticketShop(); return; }
  S.wheelLast=null; const bn=$('modalBody').querySelector('.wbanner'); if(bn) bn.remove();
  S.chips-=WHEEL_COST; wheelBusy=true; save(); renderHud();
  const idx=wheelPick();
  const seg=360/WHEEL_N, target=-(idx*seg+seg/2);
  const base=(S.wheelRot||0)+360*5, rot=base+(((target-base)%360)+360)%360;
  S.wheelRot=rot;
  const el=$('wheelSpin'); $('wheelGo').disabled=true;
  el.style.transition='transform 3.2s cubic-bezier(.15,.7,.2,1)'; el.style.transform=`rotate(${rot}deg)`;
  let ticks=0; const tk=setInterval(()=>{ if(++ticks<14) SND.play('tap'); else clearInterval(tk); },180);
  setTimeout(()=>{
    wheelBusy=false; S.wheelRot%=360;
    const r=wheelLand(idx), sg=WHEEL_SEGS[idx];
    S.wheelLast={i:idx, hits:r.hits, n:r.n};
    save(); render(); openWheel(wheelCell);
    if(r.hits===1){ SND.play('magic'); playScene({title:`💡 Light ${r.n} of ${WHEEL_N}`, sub:`${sg.e} ${sg.n} · ${sg.yr}`, lines:sg.story.concat(r.n===WHEEL_N?WHEEL_LAST:[])}, ()=>openWheel(wheelCell)); }
    else if(r.hits===2){ SND.play('coins'); playScene({title:`${sg.e} The ${sg.n} again`, sub:'A little extra', lines:sg.tidbit}, ()=>openWheel(wheelCell)); }
    else SND.play('coin');
  },3300);
}
/* short of tickets: buy a spin right here, with where else tickets come from tucked underneath */
function ticketShop(){
  if(!miniShop({id:'TK', title:`🎟️ ${S.chips||0} of ${WHEEL_COST} tickets`, sub:'Buy a spin’s worth now', label:`${WHEEL_COST} raffle tickets`,
    use:()=>{ S.chips=(S.chips||0)+10; flo('+10 🎟️'); if(!$('modal').hidden && $('wheelGo')) openWheel(wheelCell); }})) showTicketHelp();
  else $('mini').insertAdjacentHTML('beforeend',`<details class="howto"><summary>Other ways to get tickets</summary><p>• Story orders<br>• 📦 Donation boxes<br>• ${CAST.S.name} sales<br>• 📖 Quests<br>• A lit wheel segment gives some back</p></details>`);
}
function showTicketHelp(){
  openModal(`<h2>🎟️ Out of tickets</h2><p>Each spin costs ${WHEEL_COST} tickets.</p><h3>Where tickets come from</h3>
    <p style="font-size:14px;line-height:1.6">• Every story order pays tickets<br>• 📦 Donation boxes<br>• Every ${CAST.S.name} sale<br>• 📖 Quests<br>• ${P2.shopName}: 10 for 🪙 80</p>
    <div class="row-btns"><button class="bigbtn gold" id="tkShop">🛒 ${P2.shopName}</button><button class="bigbtn" onclick="closeModal()">Close</button></div>`);
  $('tkShop').onclick=showShop;
}
/* after the ending: the cast look back, knowing everything */
function showReflections(){ playScene({title:'Reflections', sub:'Now that you know everything', lines:REFLECTIONS.map(([w,t])=>[w,t.replace(/\(([^)]*)\)/g,'<em>($1)</em>')])}); }

function passReady(){ return PASS.filter((t,i)=>S.pts>=t.pts && !S.passGot[i]).length; }

/* stage level: claimed applause (XP) fills it; each level-up drops a gift */
const STAGE_XP=[0,6,15,28,45,66,92,124,162,206,256,316,386,466];
function stageOf(xp){ let l=1; while(l<60 && xp>=stageNeed(l)) l++; return l; }
function stageNeed(l){ return l<STAGE_XP.length ? STAGE_XP[l] : STAGE_XP[STAGE_XP.length-1]+(l-STAGE_XP.length+1)*80; }

/* ============================================================ sound — all synthesised with Web Audio, no files
   Everything runs through a soft master chain (high-shelf cut, gentle compressor) so it stays
   warm on phone speakers. Voices are filtered, detuned pairs with soft attacks: no raw square or
   bright partials, which is what makes synth audio sound "8-bit". */
const SND = (()=>{
  /* Everything is pre-rendered in an OfflineAudioContext (music loop + every sound effect), so the
     live audio thread only plays buffers: no real-time synthesis, no live convolver, nothing the
     main thread can starve. That is what removes the intermittent crackle on phones. */
  const PREF_KEY='merge-stories-audio';
  let pref={music:true,sfx:true};
  try{ const p=JSON.parse(localStorage.getItem(PREF_KEY)||'null'); if(p) pref={...pref,...p}; }catch(e){}
  let ctx=null, out, sfxG, musG, live=0, musSrc=null, musBuf=null, musWant=false;
  const BUF={};
  const MAX_SFX_VOICES=28;
  const mtof=m=>440*Math.pow(2,(m-69)/12);
  const SFX_VOL=.8, MUS_VOL=.75;
  const BPM=EVENT.music.bpm, BEAT=60/BPM;
  const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;

  /* --- builders: C is the offline context being rendered, D the bus to write into --- */
  let C=null, D=null, noiseBuf=null, LAZY=null, DEAD=[]; const IR={};
  /* builders queue their events; render() creates the nodes just ahead of the render position and
     disconnects finished ones, so the offline graph stays small (16x faster than building it all up front) */
  const lazy=(t,fn)=>{ const d=D; LAZY.push([t,()=>{ const k=D; D=d; fn(); D=k; }]); };
  const voice=o=>{ o={...o,t:(o.t||0)+OFF}; lazy(o.t,()=>voiceNow(o)); };
  const puff=o=>{ o={...o,t:(o.t||0)+OFF}; lazy(o.t,()=>puffNow(o)); };
  const pad=(n,t,dur)=>lazy(t,()=>padNow(n,t,dur));
  async function render(c){
    const ev=LAZY.sort((a,b)=>a[0]-b[0]), dead=DEAD=[]; LAZY=null; let k=0;
    const build=s=>{ while(k<ev.length&&ev[k][0]<s+1.5) ev[k++][1]();
      for(const d of dead) if(d[1]&&d[0]<s){ d[1].forEach(n=>{ try{ n.disconnect(); }catch(e){} }); d[1]=null; } };
    build(0);
    const dur=c.length/c.sampleRate;
    for(let s=1;s<dur-.2;s++) c.suspend(s).then(()=>{ build(s); c.resume(); });
    return c.startRendering();
  }
  function voiceNow({m,f,t=0,dur=.4,g=.1,a=.012,wave='triangle',det=7,lp=1800,lpEnd=0,glide=0,sub=0}){
    a=Math.max(a,.008);
    const t0=t+.005, fr=f||mtof(m), e=C.createGain(), fl=C.createBiquadFilter(), stop=t0+dur+.12;
    fl.type='lowpass'; fl.Q.value=.6; fl.frequency.setValueAtTime(lp,t0);
    if(lpEnd) fl.frequency.exponentialRampToValueAtTime(lpEnd,t0+dur);
    e.gain.setValueAtTime(0,t0); e.gain.linearRampToValueAtTime(g,t0+a); e.gain.exponentialRampToValueAtTime(.0001,t0+dur); e.gain.linearRampToValueAtTime(0,t0+dur+.05);
    const oscs=[[-det,wave],[det,wave]], nodes=[]; if(sub) oscs.push([0,'sine',sub]);
    oscs.forEach(([dt,w,lvl])=>{
      const o=C.createOscillator(), og=C.createGain(); o.type=w; o.frequency.setValueAtTime(lvl?fr/2:fr,t0); o.detune.value=dt;
      if(glide) o.frequency.exponentialRampToValueAtTime((lvl?glide/2:glide),t0+dur*.7);
      og.gain.value=lvl||.5; o.connect(og); og.connect(fl); o.start(t0); o.stop(stop); nodes.push(o,og);
    });
    fl.connect(e); e.connect(D); nodes.push(fl,e); DEAD.push([stop+.05,nodes]);
  }
  const mallet=(m,t,g=.12,dur=.5)=>{ voice({m,t,dur,g,a:.006,wave:'sine',det:3,lp:2600,lpEnd:900}); voice({f:mtof(m)*4,t,dur:dur*.18,g:g*.07,a:.003,wave:'sine',det:0,lp:3000}); };
  function puffNow({t=0,dur=.25,g=.06,f=900,to=300}){
    const t0=t+.005, s=C.createBufferSource(), fl=C.createBiquadFilter(), e=C.createGain();
    s.buffer=noiseBuf; fl.type='lowpass'; fl.frequency.setValueAtTime(f,t0); fl.frequency.exponentialRampToValueAtTime(to,t0+dur);
    e.gain.setValueAtTime(0,t0); e.gain.linearRampToValueAtTime(g,t0+.02); e.gain.exponentialRampToValueAtTime(.0001,t0+dur); e.gain.linearRampToValueAtTime(0,t0+dur+.03);
    s.connect(fl); fl.connect(e); e.connect(D); s.start(t0); s.stop(t0+dur+.05); DEAD.push([t0+dur+.1,[s,fl,e]]);
  }
  function makeAssets(sr){
    noiseBuf=new AudioBuffer({length:sr,sampleRate:sr,numberOfChannels:1});
    const nd=noiseBuf.getChannelData(0); let b=0; for(let i=0;i<nd.length;i++){ b=.97*b+.03*(Math.random()*2-1); nd[i]=b*6; } // brown-ish noise: soft, not hissy
  }
  function irFor(sr){
    if(IR[sr]) return IR[sr];
    const len=Math.floor(sr*2.2), b=new AudioBuffer({length:len,sampleRate:sr,numberOfChannels:2});
    for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6); }
    return IR[sr]=b;
  }
  function reverb(c,gain){
    const revIn=c.createBiquadFilter(); revIn.type='lowpass'; revIn.frequency.value=2400;
    const rev=c.createConvolver(); rev.buffer=irFor(c.sampleRate); const ro=c.createGain(); ro.gain.value=gain;
    revIn.connect(rev); rev.connect(ro); ro.connect(c.destination); return revIn;
  }

  /* --- sound effects --- */
  const SFX={
    tap:()=>voice({f:440,glide:330,dur:.07,g:.05,a:.004,wave:'sine',det:0,lp:1400}),
    move:()=>{ voice({f:200,glide:140,dur:.12,g:.08,a:.006,wave:'sine',det:0,lp:900}); puff({dur:.1,g:.03,f:700,to:250}); },
    spawn:lv=>{ const f=260+lv*35; voice({f,glide:f*1.5,dur:.18,g:.11,a:.01,wave:'sine',det:4,lp:1600}); puff({dur:.14,g:.025,f:900,to:300}); },
    merge:lv=>{ const base=55+lv*2;
      [0,4,7,12].forEach((iv,i)=>voice({m:base+iv,t:i*.035,dur:1.0,g:.06,a:.02,wave:'triangle',det:8,lp:2400,lpEnd:700}));
      voice({m:base-12,dur:.35,g:.12,a:.01,wave:'sine',det:0,lp:600}); },
    reveal:()=>{ puff({dur:.35,g:.07,f:1400,to:250}); voice({f:150,glide:95,dur:.22,g:.07,a:.01,wave:'sine',det:0,lp:500}); },
    unweb:()=>[76,79,83].forEach((m,i)=>voice({m,t:.05+i*.06,dur:.7,g:.025,a:.05,wave:'sine',det:6,lp:3000})),
    coins:()=>[67,71,74,79].forEach((m,i)=>mallet(m,i*.075,.11,.55)),
    coin:()=>{ mallet(74,0,.1,.4); mallet(79,.07,.09,.5); },
    drink:()=>{ voice({f:260,glide:200,dur:.1,g:.07,a:.01,wave:'sine',det:0,lp:900}); voice({f:280,glide:210,t:.13,dur:.12,g:.07,a:.01,wave:'sine',det:0,lp:900}); puff({t:.02,dur:.25,g:.03,f:600,to:200}); },
    nope:()=>voice({f:150,glide:110,dur:.2,g:.09,a:.008,wave:'triangle',det:5,lp:500}),
    page:()=>puff({dur:.16,g:.035,f:1800,to:600}),
    gift:()=>[67,71,74,79,83].forEach((m,i)=>mallet(m,i*.09,.09,.6)),
    magic:()=>{ [60,64,67,71,74].forEach((m,i)=>voice({m:m+12,t:i*.06,dur:2.2,g:.03,a:.35,wave:'sawtooth',det:12,lp:500,lpEnd:2000})); [83,86,91].forEach((m,i)=>voice({m,t:.4+i*.12,dur:1.2,g:.018,a:.08,wave:'sine',det:5,lp:3000})); },
    fanfare:()=>{ [[55,59,62,67],[60,64,67,72]].forEach((ch,k)=>ch.forEach(m=>voice({m,t:k*.55,dur:k?2.0:.6,g:.035,a:.06,wave:'sawtooth',det:10,lp:k?600:500,lpEnd:k?1800:1200})));
      voice({m:36,t:.55,dur:2.0,g:.16,a:.03,wave:'sine',det:0,lp:400}); },
  };
  const SFX_LEN={magic:2.8,fanfare:2.7,merge:1.2,gift:1.1,coins:1};
  const LV={merge:8,spawn:6};
  function sfxList(){ const L=[]; Object.keys(SFX).forEach(n=>{ if(LV[n]) for(let l=1;l<=LV[n];l++) L.push([n,l]); else L.push([n,0]); }); return L; }

  /* render every effect into one offline pass, then slice it up */
  async function renderSfx(sr){
    const TAIL=1.4, list=sfxList(), slots=[]; let t=0;
    list.forEach(([n,l])=>{ const len=(SFX_LEN[n]||.6)+TAIL; slots.push([n,l,t,len]); t+=len+.1; });
    const c=new OAC(2,Math.ceil(t*sr),sr); C=c; LAZY=[];
    const bus=c.createGain(), lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3400; lp.Q.value=.4;
    const send=c.createGain(); send.gain.value=.35; bus.connect(lp); lp.connect(c.destination); lp.connect(send); send.connect(reverb(c,.5));
    slots.forEach(([n,l,t0])=>{ D=c.createGain(); D.connect(bus); withOffset(t0,()=>SFX[n](l)); });
    const r=await render(c);
    slots.forEach(([n,l,t0,len])=>{
      const s0=Math.floor(t0*sr), N=Math.floor(len*sr), b=new AudioBuffer({length:N,sampleRate:sr,numberOfChannels:2}), fade=Math.floor(.3*sr);
      for(let ch=0;ch<2;ch++){ const src=r.getChannelData(ch), d=b.getChannelData(ch); for(let i=0;i<N;i++) d[i]=src[s0+i]*(i>N-fade?(N-i)/fade:1); }
      BUF[n+(l||'')]=b;
    });
  }
  /* run a builder with every start time shifted by `off` seconds */
  let OFF=0;
  function withOffset(off,fn){ OFF=off; try{ fn(); } finally{ OFF=0; } }

  /* --- background music: each story brings its own tune (EVENT.music.compose) and mix; the engine renders it
     offline into one seamless loop, so nothing is synthesised live and nothing can crackle. --- */
  function padNow(notes,t,dur){
    const p=EVENT.music.pad||{}, lp=p.lp||[700,1100,750], g=p.g||.010, a=p.a||.6;
    const fl=C.createBiquadFilter(), e=C.createGain(), stop=t+dur+.2, nodes=[fl,e]; DEAD.push([stop+.05,nodes]);
    fl.type='lowpass'; fl.Q.value=.5; fl.frequency.setValueAtTime(lp[0],t); fl.frequency.linearRampToValueAtTime(lp[1],t+dur*.5); fl.frequency.linearRampToValueAtTime(lp[2],t+dur);
    e.gain.setValueAtTime(0,t); e.gain.linearRampToValueAtTime(g,t+a); e.gain.setValueAtTime(g,t+dur-a); e.gain.linearRampToValueAtTime(0,t+dur+.15);
    notes.forEach((m,i)=>{ const o=C.createOscillator(); o.type=p.wave||'triangle'; o.frequency.value=mtof(m); o.detune.value=i%2?(p.det||7):-(p.det||7); o.connect(fl); o.start(t); o.stop(stop); nodes.push(o); });
    if(p.sub){ const s=C.createOscillator(), sg=C.createGain(); s.type='sine'; s.frequency.value=mtof(notes[0]); sg.gain.value=p.sub; s.connect(sg); sg.connect(fl); s.start(t); s.stop(stop); nodes.push(s,sg); }
    fl.connect(e); e.connect(D);
  }
  async function renderMusic(sr,seed){
    const M=EVENT.music, X=M.mix, L=M.beats*BEAT, TAIL=3.2, c=new OAC(2,Math.ceil((L+TAIL)*sr),sr); C=c; LAZY=[];
    let rs=seed*9301+49297; const rnd=()=>((rs=(rs*9301+49297)%233280)/233280);
    D=c.createGain();
    const mLP=c.createBiquadFilter(); mLP.type='lowpass'; mLP.frequency.value=X.lp; mLP.Q.value=.3;
    D.connect(mLP); mLP.connect(c.destination);
    const mSend=c.createGain(); mSend.gain.value=X.send; mLP.connect(mSend); const rv=reverb(c,X.rev); mSend.connect(rv);
    const dly=c.createDelay(2), fb=c.createGain(), dlp=c.createBiquadFilter(), wet=c.createGain();
    dly.delayTime.value=BEAT*.75; fb.gain.value=X.fb; dlp.type='lowpass'; dlp.frequency.value=X.dlp; wet.gain.value=X.wet;
    mLP.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(wet); wet.connect(c.destination); if(X.wetToRev) wet.connect(rv);
    M.compose({voice, puff, pad, mallet, mtof, BEAT, rnd});
    const r=await render(c);
    // fold the tail (reverb/echo ring-out) back onto the start so the loop is seamless
    const N=Math.round(L*sr), b=new AudioBuffer({length:N,sampleRate:sr,numberOfChannels:2});
    for(let ch=0;ch<2;ch++){ const s=r.getChannelData(ch), d=b.getChannelData(ch); d.set(s.subarray(0,N)); for(let i=N;i<s.length;i++) d[i-N]+=s[i]; }
    return b;
  }

  function init(){
    if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
    const AC=window.AudioContext||window.webkitAudioContext;
    try{ ctx=new AC({latencyHint:'playback'}); }catch(e){ try{ ctx=new AC(); }catch(e2){ return; } }
    // master: high-pass (phone speakers distort below 90 Hz) → warm shelf → low-pass → gentle glue compression
    const shelf=ctx.createBiquadFilter(); shelf.type='highshelf'; shelf.frequency.value=3200; shelf.gain.value=-9;
    const top=ctx.createBiquadFilter(); top.type='lowpass'; top.frequency.value=7500; top.Q.value=.5;
    const hp=ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=90; hp.Q.value=.5;
    const comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=12; comp.ratio.value=2.5; comp.attack.value=.03; comp.release.value=.25;
    out=ctx.createGain(); out.gain.value=.7; // headroom so nothing ever hits 0 dBFS
    out.connect(hp); hp.connect(shelf); shelf.connect(top); top.connect(comp); comp.connect(ctx.destination);
    sfxG=ctx.createGain(); sfxG.gain.value=pref.sfx?SFX_VOL:0; sfxG.connect(out);
    musG=ctx.createGain(); musG.gain.value=0; musG.connect(out);
    if(!OAC) return;
    const sr=ctx.sampleRate; makeAssets(sr);
    if(pref.music) musWant=true;
    renderSfx(24000).then(()=>renderMusic(24000,1)).then(b=>{ musBuf=b; if(musWant) startMusic(); }).catch(()=>{});
  }

  function play(name,lv=1){
    if(!ctx||!pref.sfx||live>=MAX_SFX_VOICES) return;
    const b=BUF[name+(LV[name]?Math.max(1,Math.min(lv,LV[name])):'')]; if(!b) return;
    const s=ctx.createBufferSource(); s.buffer=b; s.connect(sfxG); live++;
    s.onended=()=>{ live--; s.disconnect(); };
    s.start(ctx.currentTime+.02);
  }
  function startMusic(){
    if(!ctx) return; musWant=true;
    if(musSrc||!musBuf) return;
    const t=ctx.currentTime;
    musG.gain.cancelScheduledValues(t); musG.gain.setValueAtTime(0,t); musG.gain.linearRampToValueAtTime(MUS_VOL,t+3);
    const s=ctx.createBufferSource(); s.buffer=musBuf; s.loop=true; s.connect(musG); s.start(t+.05); musSrc=s;
    s.onended=()=>s.disconnect();
  }
  function stopMusic(){
    musWant=false; if(!ctx) return;
    const t=ctx.currentTime;
    musG.gain.cancelScheduledValues(t); musG.gain.setValueAtTime(musG.gain.value,t); musG.gain.linearRampToValueAtTime(0,t+.8);
    const s=musSrc; musSrc=null; if(s){ try{ s.stop(t+.85); }catch(e){} }
  }
  function savePref(){ try{ localStorage.setItem(PREF_KEY,JSON.stringify(pref)); }catch(e){} }
  function setMusic(on){ pref.music=on; savePref(); if(!ctx) return; on?startMusic():stopMusic(); }
  function setSfx(on){ pref.sfx=on; savePref(); if(sfxG) sfxG.gain.value=on?SFX_VOL:0; }
  document.addEventListener('visibilitychange',()=>{ if(!ctx) return; document.hidden?ctx.suspend():ctx.resume(); });
  const unlock=()=>{ init(); };
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  return {play,setMusic,setSfx,get pref(){return pref;},get ready(){return !!musBuf;},_buf:BUF,get _mus(){return musBuf;}};
})();

/* ============================================================ state */
let S, sel = -1, fx = {};
const $ = id => document.getElementById(id);
const now = () => Date.now();
const def = it => CHAINS[it.k].items[it.l-1];
const maxL = k => CHAINS[k].items.length;
const isGen = it => !!CHAINS[it.k].gen || !!CHAINS[it.k].items[it.l-1].gen;
const key = (k,l) => k+l;

function mkItem(k,l){
  const it={k,l};
  const d=CHAINS[k].items[l-1];
  if(d.charges){ it.ch=d.charges; it.t=now(); }
  if(d.uses) it.left=d.uses;
  if(d.fuelled) it.fuel=0;
  if(d.want) it.want=pickWant();
  if(k==='N' && typeof S!=='undefined' && S && !(S.moonSeen||{})[l] && !moonPending()) it.st=1;
  return it;
}
const WANTS=(CONFIG.bin&&CONFIG.bin.wants)||[];
/* can the player make chain k right now? (an item of it is out, or a generator on the board drops it) */
function obtainable(k){ if(typeof S==='undefined'||!S) return !!genFor(k);
  return S.cells.some(c=>c.s==='open'&&c.it&&(c.it.k===k || (isGen(c.it)&&(CHAINS[c.it.k].main===k||(def(c.it).drop||[]).some(d=>d[0]===k))))); }
/* the bin never asks for something you can't make yet (fruit before you've grown a tree) */
function pickWant(){ const ok=WANTS.filter(w=>obtainable(w[0])), pool=ok.length?ok:WANTS.filter(w=>genFor(w[0]));
  return pool[Math.floor(Math.random()*pool.length)]; }
const FUEL=CONFIG.fuel||{};
const fuelNames=()=>Object.keys(FUEL).map(k=>`${CHAINS[k].items[0].e} ${CHAINS[k].name.toLowerCase()}`).join(' or ');
function fuelValue(it){ return FUEL[it.k] ? FUEL[it.k]*it.l : 0; }
/* Time Chargers */
const isCharger = it => !!(it && CHAINS[it.k].items[it.l-1].hours);
const chargerMs = it => CHAINS[it.k].items[it.l-1].hours*3600000*CONFIG.chargerScale;
function around(i){ const [r,c]=rc(i), out=[]; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ if(!dr&&!dc) continue; const rr=r+dr, cc=c+dc; if(rr>=0&&rr<9&&cc>=0&&cc<7) out.push(rr*7+cc); } return out; }
/* is this tile inside an active charger's 8-tile area? */
function chargedCell(i){ return around(i).some(n=>{ const it=S.cells[n].it; return S.cells[n].s==='open' && isCharger(it) && it.on; }); }
let lastChargeTick=now();
function chargerTick(){
  const t=now(), dt=Math.min(t-lastChargeTick, 5000); lastChargeTick=t; let changed=false;
  // double speed: each covered timed generator gets dt of extra recharge (once, even if two chargers overlap)
  const boosted=new Set();
  S.cells.forEach((c,i)=>{ if(c.s==='open'&&isCharger(c.it)&&c.it.on&&t<c.it.end) around(i).forEach(n=>{ const g=S.cells[n].it; if(g&&isGen(g)&&def(g).charges) boosted.add(n); }); });
  boosted.forEach(n=>{ const g=S.cells[n].it; if(g.ch<def(g).charges) g.t-=dt; });
  // finished chargers top up their neighbours (not always fully, like MM) and vanish
  S.cells.forEach((c,i)=>{
    if(c.s!=='open'||!isCharger(c.it)||!c.it.on||t<c.it.end) return;
    around(i).forEach(n=>{ const g=S.cells[n].it; if(g&&isGen(g)&&def(g).charges){ refreshCharges(g); const miss=def(g).charges-g.ch; g.ch+=Math.ceil(miss*.75); if(g.ch>=def(g).charges) g.t=now(); fx[n]='pop'; } });
    flo(`${def(c.it).e} Ran out and topped up its neighbours`, i);
    c.it=null; fx[i]='reveal'; if(sel===i) sel=-1; changed=true; SND.play('gift');
  });
  return changed;
}
function activateCharger(i){
  const it=S.cells[i].it; it.on=true; it.end=now()+chargerMs(it);
  SND.play('magic'); flo(`${def(it).e} On: neighbours recharge ×2`, i);
  save(); render();
}
/* a story rosette is waiting to be tapped */
function moonPending(){ return typeof S!=='undefined' && S && S.cells.some(c=>c.it&&c.it.st); }
function freshState(){
  const cells=[];
  const map={o:'open',w:'web',b:'box'};
  LAYOUT.forEach((row,r)=>row.trim().split(/\s+/).forEach(tok=>{
    const st=map[tok[0]], rest=tok.slice(1);
    let it=null;
    if(rest!=='.'){ const m=rest.match(/^([a-zA-Z]+?)(\d)$/); it=mkItem(m[1],+m[2]); }
    const z=zoneOfRow(r);
    cells.push({s: z>0?'sheet':st, ps:st, it, z});
  }));
  const disc={};
  cells.forEach(c=>{ if(c.s==='open'&&c.it) disc[key(c.it.k,c.it.l)]=1; });
  return {v:1, sideOn:CONFIG.sideOpen?1:0, salesBase:{}, genQ:cells.filter(c=>c.s==='open'&&c.it&&isGen(c.it)&&GEN_STORY[key(c.it.k,c.it.l)]).map(c=>key(c.it.k,c.it.l)), wheel:Array(20).fill(0), wheelRot:0, chips:0, xp:0, pts:0, passGot:{}, side:[], sideN:0, cells, coins:0, ch:0, done:{}, disc, unrev:{}, stats:{}, qt:{}, seenOrd:{}, gifts:[], seenIntro:{}, journal:[], complete:false};
}
function load(){
  try{ const raw=localStorage.getItem(CONFIG.saveKey) || (CONFIG.legacySaveKey && localStorage.getItem(CONFIG.legacySaveKey)); if(raw){ const s=JSON.parse(raw); if(s&&s.v===1&&s.cells&&s.cells.length===63){ if(CHAINS.gK && s.ch>=1 && !s.cells.some(c=>c.it&&c.it.k==='gK') && !(s.gifts||[]).some(g=>g[0]==='gK')) (s.gifts=s.gifts||[]).push(['gK',1]);
      s.xp=s.xp||0; s.pts=s.pts||0; s.passGot=s.passGot||{}; s.side=s.side||[];
      if(!s.wheel){ s.wheel=Array(20).fill(0); s.wheelRot=0; } if(s.chips==null) s.chips=3; if(s.sideOn==null) s.sideOn=(s.ch>0||(s.sideDone||0)>0||(s.side||[]).length)?1:0; if(WHEEL_KEY && (s.ch>0||(s.done||{})[3]) && !s.cells.some(c=>c.it&&c.it.k===WHEEL_KEY) && !(s.gifts||[]).some(g=>g[0]===WHEEL_KEY)) (s.gifts=s.gifts||[]).push([WHEEL_KEY,1]); delete s.wheelUnread; s.wheelLast=null;
      if(!s.unrev) s.unrev={...s.disc}; // saves from before the collection: everything found so far waits to be revealed
      if(!s.stats){ const story=Object.keys(s.done||{}).length; s.stats={side:s.sideDone||0, story, disc:Object.keys(s.disc||{}).length}; }
      s.qt=s.qt||{}; s.salesBase=s.salesBase||{}; delete s.energy; delete s.eT; delete s.buys;
      if(!s.seenOrd){ s.seenOrd={}; TASKS.filter(t=>t.ch===s.ch&&!(s.done||{})[t.id]).slice(0,3).forEach(t=>s.seenOrd[t.id]=1); }
      return s; } } }catch(e){}
  return freshState();
}
function save(){ try{ localStorage.setItem(CONFIG.saveKey, JSON.stringify(S)); }catch(e){} }

/* ============================================================ generator charges (no energy: taps are free, generators rest) */
function refreshCharges(it){
  const d=def(it); if(!d.charges) return;
  if(it.ch>=d.charges){ it.t=now(); return; }
  const g=Math.floor((now()-it.t)/d.rechargeMs);
  if(g>0){ it.ch=Math.min(d.charges,it.ch+g); it.t+=g*d.rechargeMs; if(it.ch>=d.charges) it.t=now(); }
}
/* a resting generator: refill it now from the shop, or with an egg timer you already have */
function restingShop(i){
  const it=S.cells[i].it, d=def(it), have=S.cells.findIndex(c=>c.s==='open'&&c.it&&c.it.k==='ET');
  if(have>=0){ fx[have]='hint'; render(); flo(`${d.e} Resting. Drag your ${CHAINS.ET.items[0].e} onto it`, i); return; }
  miniShop({id:'ET', title:`${d.e} ${d.n} is resting`, sub:`Next one in ${fmt(nextChargeIn(it))} · or refill it now`, label:`Refill it now (${d.charges} taps)`,
    use:()=>{ const g=S.cells[i].it; if(!g) return; g.ch=d.charges; g.t=now(); fx[i]='pop'; SND.play('unweb'); flo(`${CHAINS.ET.items[0].e} ${d.n} refilled`, i); }});
}
function nextChargeIn(it){ const d=def(it); return Math.max(0, Math.ceil((d.rechargeMs-(now()-it.t))/1000)); }

/* ============================================================ board logic */
const rc = i => [Math.floor(i/CONFIG.cols), i%CONFIG.cols];
function neighbours(i){
  const [r,c]=rc(i), out=[];
  if(r>0) out.push(i-7); if(r<8) out.push(i+7); if(c>0) out.push(i-1); if(c<6) out.push(i+1);
  return out;
}
function revealCell(i){
  const c=S.cells[i];
  if(c.s!=='box') return false;
  c.s = (c.it && !isGen(c.it)) ? 'web' : 'open';
  if(c.s==='open' && c.it) discover(c.it, true);
  fx[i]='reveal';
  SND.play('reveal');
  return true;
}
function revealAround(i){ neighbours(i).forEach(n=>{ if(revealCell(n)) stat('open'); }); }

function nearestEmpty(from){
  const [r0,c0]=rc(from); let best=-1, bd=1e9;
  S.cells.forEach((c,i)=>{
    if(c.s!=='open'||c.it) return;
    const [r,cc]=rc(i); const d=(r-r0)**2+(cc-c0)**2 + Math.random()*.01;
    if(d<bd){bd=d;best=i;}
  });
  return best;
}
function pickDrop(drop){
  const tot=drop.reduce((a,d)=>a+d[2],0); let x=Math.random()*tot;
  for(const d of drop){ x-=d[2]; if(x<=0) return d; }
  return drop[0];
}
/* every generator gets a little story the first time it appears on the board (each level counts) */
let genBusy=false;
function playGenStory(){
  genBusy=false;
  if(!S.genQ||!S.genQ.length||storyOpen()||!$('modal').hidden||!$('title').hidden) return;
  const k=S.genQ.shift(); save();
  if((S.genSeen||{})[k]){ playGenStory(); return; }
  const i=S.cells.findIndex(c=>c.s==='open'&&c.it&&key(c.it.k,c.it.l)===k);
  if(i<0||!GEN_STORY[k]){ playGenStory(); return; }
  (S.genSeen=S.genSeen||{})[k]=1; save();
  const d=def(S.cells[i].it); sel=i; fx[i]='hint'; render();
  playScene({clear:true, title:`${d.e} ${d.n}`, sub:'New on the board', lines:GEN_STORY[k]}, ()=>{ fx[i]='hint'; render(); });
}
function discover(it, quiet){
  const k=key(it.k,it.l);
  if(S.disc[k]) return;
  S.disc[k]=1;
  (S.unrev||(S.unrev={}))[k]=1; stat('disc');
  if(isGen(it) && GEN_STORY[k] && !(S.genSeen||{})[k]){ (S.genQ=S.genQ||[]).push(k); return; }
  if(quiet) return;
  const d=def(it), ch=CHAINS[it.k];
  if(ch.story && d.lore){ setTimeout(()=>showLore(it),350); }
  else toast(`New: ${d.e} <b>${d.n}</b> · reveal it in 📖 for a reward`,2600);
}

function produce(i){
  const it=S.cells[i].it, d=def(it);
  if(CHAINS[it.k].wheel){ openWheel(i); return; }
  if(d.want){ const w=CHAINS[it.want[0]].items[it.want[1]-1]; SND.play('nope'); toast(`${d.e} Wants ${w.e} ${w.n}. Drag one onto it for a seedling 🌱`); return; }
  if(d.fuelled){ if(!(it.fuel>0)){ SND.play('nope'); toast(`${d.e} The stove is cold. Drag a 🪵 log or some ${CHAINS.P.name.toLowerCase()} onto it.`); return; } }
  else {
    if(d.charges){
      refreshCharges(it);
      if(it.ch<=0){ SND.play('nope'); if(d.free) flo(`${d.e} Boiling… ready in ${nextChargeIn(it)}s`, i); else restingShop(i); return; }
    }
  }
  const t=nearestEmpty(i);
  if(t<0){ SND.play('nope'); flo('No room. Merge or sell something first', i); fx[i]='pulse'; render(); return; }
  if(d.fuelled) it.fuel--;
  else if(d.charges){ if(it.ch>=d.charges) it.t=now(); it.ch--; }
  let [k,l]=pickDrop(it.focus>0 ? d.drop.map(x=>CHAINS[x[0]].rare===true?[x[0],x[1],x[2]*FOCUS_MULT]:x) : d.drop);
  if(it.focus>0) it.focus--;
  if(k==='N' && moonPending()){ const alt=d.drop.filter(x=>x[0]!=='N'); [k,l]=pickDrop(alt); } // one story rosette at a time
  S.cells[t].it=mkItem(k,l);
  fx[i]='pulse'; fx[t]='spawn';
  SND.play('spawn',l);
  discover(S.cells[t].it); stat('gen'); if(CHAINS[k].rare===true) stat('rare');
  if(d.uses){
    it.left--;
    if(it.left<=0){
      S.cells[i].it = d.after ? mkItem(d.after[0],d.after[1]) : null; fx[i]='reveal'; SND.play('reveal');
      if(sel===i && !S.cells[i].it) sel=-1;
      flo(d.after ? `${d.e} Spent. It leaves a ${CHAINS[d.after[0]].items[d.after[1]-1].e}` : `${d.e} Empty. It folds flat`, i);
    }
  }
  save(); render();
}
/* feeding: drop the wanted item on the bin, or fuel on the stove */
function feed(a,b){
  const A=S.cells[a].it, B=S.cells[b].it, T=def(B);
  if(T.want){
    const [wk,wl]=B.want, w=CHAINS[wk].items[wl-1];
    if(A.k!==wk||A.l!==wl){ SND.play('nope'); flo(`${T.e} Wants ${w.e} ${w.n}, not that`, b); return true; }
    S.cells[a].it=null;
    const t=nearestEmpty(b), l=Math.random()<.8?1:2;
    const G=CONFIG.bin.gives; if(t>=0){ S.cells[t].it=mkItem(G,l); fx[t]='spawn'; discover(S.cells[t].it); } else S.gifts.push([G,l]);
    B.want=pickWant(); fx[b]='pop'; SND.play('merge',2); stat('compost');
    flo(`${T.e} Out pops a ${CHAINS[CONFIG.bin.gives].items[l-1].e}`, b); save(); render(); return true;
  }
  if(T.fuelled){
    const fv=fuelValue(A);
    if(!fv){ SND.play('nope'); flo(`${T.e} That won’t burn. Try ${fuelNames()}`, b); return true; }
    S.cells[a].it=null; B.fuel=(B.fuel||0)+fv; fx[b]='pop'; SND.play('reveal');
    flo(`${T.e} +${fv} fuel`, b); save(); render(); return true;
  }
  return false;
}

function claim(i){
  const it=S.cells[i].it, d=def(it), kind=CHAINS[it.k].claim; delete it.st; stat('claim');
  S.cells[i].it=null; sel=-1; fx[i]='pulse';
  if(kind==='coins'){ S.coins+=d.v; SND.play('coins'); flo(`+🪙${d.v}`, i); }
  else if(kind==='points'){
    S.pts+=d.v; SND.play('magic'); flo(`${d.e} +${d.v}`, i); if(passReady()) flo(`${T.passName}: a reward is ready`);
    S.moonSeen=S.moonSeen||{};
    if(!S.moonSeen[it.l]){ S.moonSeen[it.l]=1; save(); setTimeout(()=>playScene({title:T.notesTitle, sub:d.n, lines:MOON_NOTES[it.l-1]}),250); }
  }
  else if(kind==='chips'){ S.chips=(S.chips||0)+d.v; SND.play('coin'); flo(`+${d.v} 🎟️`, i); }
  else if(kind==='skip'){ timeSkip(d.v); SND.play('unweb'); flo(`${d.e} ${d.v} min skipped`, i); }
  else { SND.play('unweb'); flo(`+${d.v} ⭐`, i); addXP(d.v); }
  save(); render();
}
/* time skip: fast-forwards every generator's recharge */
function timeSkip(min){
  const ms=min*60000;
  S.cells.forEach(c=>{ if(c.it&&isGen(c.it)&&def(c.it).charges){ c.it.t-=ms; refreshCharges(c.it); } });
}
function addXP(v){
  const before=stageOf(S.xp); S.xp+=v; const after=stageOf(S.xp);
  for(let l=before+1;l<=after;l++){
    stageReward(l).forEach(r=>S.gifts.push(r));
    setTimeout(()=>{ SND.play('gift'); toast(`⭐ Stage level ${l}! A gift is waiting 🎁`,3000); },300);
  }
}
function isRes(it){ return CHAINS[it.k].type==='res'; }
/* put items on the board near the bottom; anything that doesn't fit goes to gifts */
function dropItems(list, near=59){
  let overflow=0;
  let held=0;
  list.forEach(([k,l])=>{ if(k==='N' && moonPending()){ S.gifts.push([k,l]); held++; return; } const t=nearestEmpty(near); if(t<0){ S.gifts.push([k,l]); overflow++; return; } S.cells[t].it=mkItem(k,l); fx[t]='spawn'; discover(S.cells[t].it); });
  if(overflow) toast(`No room for ${overflow} reward${overflow>1?'s':''}. Find ${overflow>1?'them':'it'} in 🎁`);
  if(held) toast(`${T.tokenIcon} Saved in 🎁 until you tap the glowing ${T.tokenNoun} on the board`);
}

/* important things (generators) arrive on the board as a wrapped present you open; the rest go to 🎁 gifts */
const isImportant=(k,l)=>!!(CHAINS[k].gen||(CHAINS[k].items[l-1]||{}).gen);
function give(k,l){
  if(!isImportant(k,l)){ S.gifts.push([k,l]); return; }
  const t=nearestEmpty(59);
  if(t<0){ S.gifts.push([k,l]); return; }
  const it=mkItem(k,l); it.wrap=1; S.cells[t].it=it; fx[t]='spawn';
}
function unwrap(i){
  const it=S.cells[i].it; delete it.wrap; fx[i]='reveal'; SND.play('gift'); sel=i;
  if(CHAINS[it.k].wheel) S.chips=Math.max(S.chips||0,2*WHEEL_COST); // the wheel comes with two spins' worth
  discover(it); save(); render();
}
function canMerge(a,b){ return a&&b&&!a.st&&!b.st&&!a.on&&!b.on&&!a.wrap&&!b.wrap&&a.k===b.k&&a.l===b.l&&a.l<maxL(a.k); }

function drop(a,b){
  if(b<0||a===b){ return; }
  const A=S.cells[a], B=S.cells[b];
  if(B.s==='sheet'){ SND.play('nope'); flo(T.sheetBlocked, b); return; }
  if(B.s==='box'){ SND.play('nope'); flo('Merge next to a box to open it', b); return; }
  if(B.s==='web'){
    if(canMerge(A.it,B.it)){ doMerge(a,b); }
    else { SND.play('nope'); flo(`Stuck. Drop another ${def(B.it).e} on it`, b); }
    return;
  }
  // open
  if(!B.it){ B.it=A.it; A.it=null; sel=b; SND.play('move'); save(); render(); return; }
  if(A.it.wrap||B.it.wrap){ const tmp=B.it; B.it=A.it; A.it=tmp; sel=b; SND.play('move'); save(); render(); return; }
  if(canMerge(A.it,B.it)){ doMerge(a,b); return; }
  if(isGen(B.it) && feed(a,b)) return;
  if(useOn(a,b)) return;
  const tmp=B.it; B.it=A.it; A.it=tmp; sel=b; SND.play('move'); save(); render();
}
function doMerge(a,b){
  const A=S.cells[a], B=S.cells[b];
  const it=mkItem(A.it.k, A.it.l+1);
  if(def(A.it).uses && def(A.it).free && def(it).uses){ // two donation boxes: an unopened pair makes a full big box
    const fa=A.it.left===def(A.it).uses, fb=B.it.left===def(B.it).uses;
    it.left = fa&&fb ? def(it).uses : A.it.left+B.it.left+2;
  }
  SND.play('merge',it.l); stat('merge'); if(it.l>=5&&!isGen(it)&&!isRes(it)) stat('high'); if(B.s==='web'){ SND.play('unweb'); stat('open'); }
  A.it=null; B.it=it; B.s='open';
  fx[b]='pop';
  revealAround(b);
  discover(it);
  if(!isGen(it) && !isRes(it) && it.l>=5){ const t=nearestEmpty(b); if(t>=0){ S.cells[t].it=mkItem('X',1); fx[t]='spawn'; } }
  sel=b;
  save(); render();
}

function sellValue(it){ if(isCharger(it)) return it.on?Math.max(1,(it.l-4)*2):0; return isGen(it)||isRes(it)||isBoost(it)||it.k==='ET'?0 : CHAINS[it.k].story ? it.l*4 : CHAINS[it.k].rare ? it.l*3 : it.l*2; }
function sell(i){
  const it=S.cells[i].it, v=sellValue(it);
  S.coins+=v; S.cells[i].it=null; sel=-1; stat('sell');
  SND.play('coin');
  flo(`Sold ${def(it).e} +🪙${v}`, i);
  save(); render();
}

/* ============================================================ orders & chapters */
let armSide=null;
/* a Jumble Sale order would take an item an active story order is still waiting for */
function sideConflict(t){
  for(const [k,l] of t.need){
    const story=activeTasks().filter(s=>s.need.some(n=>n[0]===k&&n[1]===l)); if(!story.length) continue;
    const storyN=story.reduce((a,s)=>a+s.need.filter(n=>n[0]===k&&n[1]===l).length,0), sideN=t.need.filter(n=>n[0]===k&&n[1]===l).length;
    if(openCount(k,l)-sideN<storyN) return [k,l,story[0]];
  }
  return null;
}
function activeTasks(){
  if(S.complete) return [];
  return TASKS.filter(t=>t.ch===S.ch && !S.done[t.id]).slice(0,3);
}
function openCount(k,l){ return S.cells.reduce((n,c)=>n+(c.s==='open'&&c.it&&c.it.k===k&&c.it.l===l?1:0),0); }
/* sales:n orders count stall sales made since the order first appeared */
function salesFor(t){ if(!t.sales) return 0; const b=S.salesBase||(S.salesBase={}); if(b[t.id]==null) b[t.id]=S.sideDone||0; return (S.sideDone||0)-b[t.id]; }
function taskStatus(t){
  const need={}; t.need.forEach(([k,l])=>need[key(k,l)]=(need[key(k,l)]||0)+1);
  const have=t.need.map(([k,l])=>openCount(k,l)>=need[key(k,l)]);
  const wok=!t.wheel || wheelDone()>=t.wheel, sok=!t.sales || salesFor(t)>=t.sales;
  return {have, wok, sok, ready:have.every(Boolean)&&wok&&sok};
}
function completeTask(t){
  // remove items, preferring ones not currently selected
  t.need.forEach(([k,l])=>{
    let idx=S.cells.findIndex((c,i)=>i!==sel&&c.s==='open'&&c.it&&c.it.k===k&&c.it.l===l);
    if(idx<0) idx=S.cells.findIndex(c=>c.s==='open'&&c.it&&c.it.k===k&&c.it.l===l);
    if(idx===sel) sel=-1;
    S.cells[idx].it=null; fx[idx]='pulse';
  });
  SND.play('coins');
  if(t.side){
    S.side=S.side.filter(o=>o.id!==t.id); S.sideDone=(S.sideDone||0)+1; stat('side'); dropItems(t.rw); ensureSide();
    flo(T.sideSold);
    save(); render(); return;
  }
  S.done[t.id]=1; stat('story');
  if(t.side0) S.sideOn=1;
  (t.gifts||[]).forEach(g=>{ if(CHAINS[g[0]].wheel && (S.cells.some(c=>c.it&&c.it.k===g[0])||S.gifts.some(x=>x[0]===g[0]))) return; give(g[0],g[1]); });
  dropItems(taskRewards(t));
  const chTasks=TASKS.filter(x=>x.ch===S.ch);
  if(chTasks.every(x=>S.done[x.id])) finishChapter(t.beat, t.more);
  else if(t.beat) playScene({lines:[t.beat].concat(t.more||[])});
  save(); render();
}
/* big story beats carry `more`: a short exchange where the cast confirm what just happened */
function finishChapter(beat, more){
  const c=S.ch;
  S.journal.push(c);
  setTimeout(()=>SND.play('fanfare'),350);
  const queue=[{title:'Chapter '+(c+1)+' complete', sub:CHAPTERS[c].title, lines:(beat?[beat]:[]).concat(more||[], CHAPTERS[c].outro)}];
  S.ch++;
  if(S.ch>=CHAPTERS.length){ S.complete=true; }
  else{
    const nc=CHAPTERS[S.ch];
    if(nc.zone) unlockZone(nc.zone);
    nc.gifts.forEach(([k,l])=>give(k,l));
    S.seenIntro[S.ch]=1;
    queue.push({title:'Chapter '+(S.ch+1), sub:nc.title, lines:nc.intro});
  }
  save();
  playQueue(queue, ()=>{ if(S.complete) showComplete(); });
}
function unlockZone(z){
  S.cells.forEach((c,i)=>{ if(c.z===z&&c.s==='sheet'){ c.s=c.ps; if(c.s==='open'&&c.it) discover(c.it,true); fx[i]='reveal'; } });
  // the row touching the open floor shakes loose straight away
  S.cells.forEach((c,i)=>{ if(c.z===z && neighbours(i).some(n=>S.cells[n].z<z)) revealCell(i); });
}
function placeGift(){
  if(!S.gifts.length) return;
  const t=nearestEmpty(59);
  if(t<0){ toast('No room for your gift. Clear a space first.'); return; }
  let gi=0;
  if(moonPending()){ gi=S.gifts.findIndex(g=>g[0]!=='N'); if(gi<0){ SND.play('nope'); flo(`Tap the glowing ${T.tokenNoun} first ${T.tokenIcon}`); return; } }
  const [k,l]=S.gifts.splice(gi,1)[0];
  S.cells[t].it=mkItem(k,l); fx[t]='spawn'; sel=t;
  SND.play('gift');
  discover(S.cells[t].it);
  flo(`${def(S.cells[t].it).e} on the board`, t);
  save(); render();
}
function genFor(k){ return Object.values(CHAINS).find(ch=>ch.gen&&(ch.main===k||ch.rare===k)); }
function hintTask(t){
  if(t.wheel && wheelDone()<t.wheel && t.need.every(([k,l])=>openCount(k,l)>0)){
    S.cells.forEach((c,i)=>{ if(c.s==='open'&&c.it&&CHAINS[c.it.k].wheel) fx[i]='hint'; });
    toast(`${CAST[t.who].av} <i>${t.say}</i><br>Needs 💡 ${t.wheel} wheel lights on (${wheelDone()} so far)`,4200); render(); return;
  }
  const ks=new Set(t.need.map(n=>n[0]));
  S.cells.forEach((c,i)=>{ if(c.s==='open'&&c.it&&(ks.has(c.it.k)||(isGen(c.it)&&(ks.has(CHAINS[c.it.k].main)||ks.has(CHAINS[c.it.k].rare))))) fx[i]='hint'; });
  const parts=t.need.map(([k,l])=>{ const d=CHAINS[k].items[l-1]; const g=genFor(k); return `${d.e} ${d.n}${g?` <small>(${CHAINS[k].rare?'rare from ':''}${genLabel(g)})</small>`:''}`; });
  if(t.wheel && wheelDone()<t.wheel) parts.push(`💡 ${t.wheel} wheel lights <small>(${wheelDone()} so far)</small>`);
  toast(`${CAST[t.who].av} <i>${t.say}</i><br>Needs: ${parts.join(' + ')}`, 4200);
  render();
}


/* order details: opens under the orders row (opt-in, so it may cover the board); never delivers by itself */
function deliver(t){
  if(!taskStatus(t).ready) return;
  const clash=t.side?sideConflict(t):null;
  if(clash && armSide!==t.id){ armSide=t.id; setTimeout(()=>{ if(armSide===t.id) armSide=null; },8000); SND.play('nope');
    const [k,l,st]=clash, d=CHAINS[k].items[l-1];
    toast(`⚠️ ${d.e} ${d.n} is needed for ${CAST[st.who].name}’s order<br><small>Tap Hand over again to sell it anyway</small>`,3500); return; }
  armSide=null; closeOrder(); completeTask(t);
}
/* name the generator you'd actually use: your highest level one on the board (level 1 if you have none) */
function genLabel(g){ const gk=Object.keys(CHAINS).find(x=>CHAINS[x]===g); let l=0;
  S.cells.forEach(c=>{ if(c.s==='open'&&c.it&&c.it.k===gk&&c.it.l>l) l=c.it.l; });
  const d=g.items[Math.max(1,l)-1]; return `${d.e} ${d.n}`; }
function closeOrder(){ const p=$('orderPop'); if(p) p.remove(); }
function showOrder(t){
  if(!t.side){ (S.readOrd=S.readOrd||{})[t.id]=1; save(); }
  closeOrder(); const st=taskStatus(t), wd=typeof wheelDone==='function'?wheelDone():0;
  const ks=new Set(t.need.map(n=>n[0]));
  S.cells.forEach((c,i)=>{ if(c.s==='open'&&c.it&&(ks.has(c.it.k)||(isGen(c.it)&&(ks.has(CHAINS[c.it.k].main)||ks.has(CHAINS[c.it.k].rare))))) fx[i]='hint'; });
  if(t.wheel && wd<t.wheel) S.cells.forEach((c,i)=>{ if(c.s==='open'&&c.it&&CHAINS[c.it.k].wheel) fx[i]='hint'; });
  if(t.sales && !st.sok) document.querySelectorAll('.order.side').forEach(o=>o.classList.add('hint'));
  const rows=t.need.map(([k,l],j)=>{ const d=CHAINS[k].items[l-1], g=genFor(k);
      return `<div class="op-need${st.have[j]?' have':''}"><span class="e">${d.e}</span><span class="n">${d.n}${g?`<small>${CHAINS[k].rare?'Rare find from':'From'} ${genLabel(g)}</small>`:''}</span><b>${st.have[j]?'✓':''}</b></div>`; }).join('')
    + (t.wheel?`<div class="op-need${st.wok?' have':''}"><span class="e">💡</span><span class="n">${t.wheel} wheel lights on<small>${wd} lit so far</small></span><b>${st.wok?'✓':''}</b></div>`:'')
    + (t.sales?`<div class="op-need${st.sok?' have':''}"><span class="e">${CAST.S.av}</span><span class="n">${t.sales} ${CAST.S.name} sales<small>${Math.min(salesFor(t),t.sales)} done since this order came in</small></span><b>${st.sok?'✓':''}</b></div>`:'');
  const rw=(t.side?t.rw:taskRewards(t)).map(([k,l])=>CHAINS[k].items[l-1].e).join(' ');
  const p=document.createElement('div'); p.id='orderPop';
  p.innerHTML=`<button class="op-x" aria-label="Close">✕</button><div class="op-who"><span class="av">${CAST[t.who].av}</span><b>${t.lucky?'🍀 Lucky find':CAST[t.who].name}</b></div>
    <p class="op-say">${t.say}</p>${rows}<div class="op-rw">Reward ${rw}</div>${st.ready?'<button class="bigbtn gold op-go">Hand over</button>':''}`;
  document.body.appendChild(p);
  p.style.top=($('orders').getBoundingClientRect().bottom+6)+'px';
  p.querySelector('.op-x').onclick=closeOrder; if(st.ready) p.querySelector('.op-go').onclick=()=>deliver(t);
  SND.play('tap'); render();
}
document.addEventListener('pointerdown',e=>{ const p=$('orderPop'); if(p && !p.contains(e.target) && !e.target.closest('.order')) closeOrder(); },true);

/* ============================================================ rendering */
const board=$('board');
function buildBoard(){
  board.innerHTML='';
  for(let i=0;i<63;i++){
    const d=document.createElement('div');
    const [r,c]=rc(i);
    d.className='cell'+((r+c)%2?' alt':'');
    d.dataset.i=i;
    board.appendChild(d);
  }
}
function render(){
  const tasks=activeTasks();
  ensureSide();
  const needed=new Set(), sideNeeded=new Set(); tasks.forEach(t=>t.need.forEach(([k,l])=>needed.add(key(k,l)))); S.side.forEach(t=>t.need.forEach(([k,l])=>sideNeeded.add(key(k,l))));
  const cellEls=board.children;
  S.cells.forEach((c,i)=>{
    const el=cellEls[i]; const [r,cc]=rc(i);
    let cls='cell'+((r+cc)%2?' alt':'');
    let html='';
    if(c.s==='sheet'){
      cls+=' sheet';
      const zr=[6,4,2,0][c.z];
      if(r===zr && cc===3){ const chN=CHAPTERS.findIndex(ch=>ch.zone===c.z)+1; html=`<span class="lock">🔒 Chapter ${chN}</span>`; }
    } else if(c.s==='box'){ cls+=' box'; }
    else if(c.it){
      const d=def(c.it);
      if(c.s==='web') cls+=' web';
      html=`<span class="em">${d.e}</span>`;
      if(c.it.wrap){ html='<span class="em">🎁</span><b class="musttag">Open</b>'; cls+=' must'; }
      else if(c.s==='open'){
        if(isGen(c.it)){
          cls+=' isgen';
          if(CHAINS[c.it.k].wheel){ html+=`<i class="gen">${wheelDone()}/20</i>`; if(S.chips>0) html+=`<i class="slotchips">🎟️${S.chips}</i>`; }
          else if(d.want){ if(!obtainable(c.it.want[0])){ c.it.want=pickWant(); save(); } const w=CHAINS[c.it.want[0]].items[c.it.want[1]-1]; html+=`<i class="bubble">${w.e}<b class="arr">↓</b></i>`; cls+=' hungry'; }
          else if(d.fuelled){ if(c.it.fuel) html+=`<i class="gen">🔥${c.it.fuel}</i>`; else { html+=`<i class="bubble">🪵<b class="arr">↓</b></i>`; cls+=' cool hungry'; } }
          else if(d.uses) html+=`<i class="gen">${c.it.left}</i>`;
          else if(d.charges){
            refreshCharges(c.it);
            html+=`<i class="gen">${c.it.ch}/${d.charges}</i>`;
            if(c.it.focus) html+=`<i class="focus">${CHAINS.E.items[2].e}${c.it.focus}</i>`;
            if(c.it.ch<d.charges){
              const p=Math.min(1,(now()-c.it.t)/d.rechargeMs), C=2*Math.PI*44;
              html+=`<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="44"/><circle class="arc" cx="50" cy="50" r="44" stroke-dasharray="${(p*C).toFixed(1)} ${C.toFixed(1)}"/></svg>`;
              if(c.it.ch===0) cls+=' cool';
            }
          }
          if(d.charges && chargedCell(i)){ cls+=' charged'; html+=`<i class="x2">×2</i>`; }
        } else {
          if(isRes(c.it)) cls+=' res'; else if(isBoost(c.it)) cls+=' boost';
          if(isCharger(c.it)){
            if(c.it.on){ const C=2*Math.PI*44, p=Math.max(0,(c.it.end-now())/chargerMs(c.it)); cls+=' charging';
              html+=`<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="44"/><circle class="arc tc" cx="50" cy="50" r="44" stroke-dasharray="${(p*C).toFixed(1)} ${C.toFixed(1)}"/></svg><i class="gen">⏳${fmt(Math.ceil((c.it.end-now())/1000))}</i>`; }
            else html+=`<b class="musttag tc">Tap</b>`;
          }
          if(c.it.st){ cls+=' must'; html+=`<b class="musttag">Tap</b>`; }
          else if(c.it.l===maxL(c.it.k) && (isRes(c.it)||def(c.it).recycle)) cls+=' maxed'; // only pulse tops you can tap to collect
          if(needed.has(key(c.it.k,c.it.l))) html+=`<b class="chk">✓</b>`;
          else if(sideNeeded.has(key(c.it.k,c.it.l))) html+=`<b class="chk side">✓</b>`;
        }
      }
    }
    if(i===sel) cls+=' sel';
    if(fx[i]) cls+=' '+fx[i];
    if(el.className!==cls) el.className=cls;
    if(el._h!==html){ el.innerHTML=html; el._h=html; }
  });
  // replay animations: force reflow for fx cells then clear
  if(Object.keys(fx).length){
    const f=fx; fx={};
    setTimeout(()=>{ Object.keys(f).forEach(i=>cellEls[i]&&cellEls[i].classList.remove(f[i])); }, f && Object.values(f).includes('hint')?2400:420);
  }
  renderHud(); renderOrders(tasks); renderInfo();
  if(S.genQ&&S.genQ.length&&!genBusy){ genBusy=true; setTimeout(playGenStory,450); }
}
function renderHud(){
  $('coins').textContent=S.coins; $('chips').textContent=S.chips||0;
  $('passIc').textContent=CHAINS.N.items[0].e; $('pts').textContent=S.pts||0; $('passDot').hidden=!passReady();
  { const l=stageOf(S.xp), lo=l>1?stageNeed(l-1):0, hi=stageNeed(l);
    $('xpLv').textContent=l; $('xpTxt').textContent=`${S.xp-lo}/${hi-lo}`; $('xpBar').style.width=((S.xp-lo)/(hi-lo)*100)+'%'; }
  $('giftBtn').hidden=!S.gifts.length; $('giftCount').textContent=S.gifts.length; renderPip();
  const ci=Math.min(S.ch,CHAPTERS.length-1);
  const chT=TASKS.filter(t=>t.ch===ci), dn=chT.filter(t=>S.done[t.id]).length;
  $('chNum').textContent = S.complete?'Event complete':'Chapter '+(ci+1);
  $('chName').textContent = CHAPTERS[ci].title;
  $('chCount').textContent = S.complete?'✨':`${dn}/${chT.length}`;
  $('chBar').style.width = (S.complete?100:dn/chT.length*100)+'%';
}
function fmt(s){ s=Math.max(0,s); return s>=60? Math.floor(s/60)+':'+String(s%60).padStart(2,'0') : '0:'+String(s).padStart(2,'0'); }
const readySince={};
function renderOrders(tasks){
  const box=$('orders');
  box.innerHTML='';
  if(S.complete){
    const has=STORY_KEY && S.disc[key(STORY_KEY,maxL(STORY_KEY))];
    box.innerHTML=`<div class="empty done"><div><b>${T.doneTitle}</b>${has?T.doneHas:T.doneNot}${REFLECTIONS.length?'<button class="sbtn refl" id="reflBtn">✨ Reflections</button>':''}</div></div>`;
    const rb=box.querySelector('#reflBtn'); if(rb) rb.onclick=e=>{ e.stopPropagation(); showReflections(); };
  }
  ensureSide();
  /* two groups, Story then Jumble Sale; a ready order jumps to the front of its own group only */
  const tnow=now(); let storyNewlyReady=false;
  const group=arr=>{
    const list=arr.map((t,i)=>({t,i,ready:taskStatus(t).ready}));
    list.forEach(o=>{ if(o.ready){ if(!readySince[o.t.id]){ readySince[o.t.id]=tnow; if(!o.t.side) storyNewlyReady=true; } } else delete readySince[o.t.id]; });
    list.sort((a,b)=>(b.ready-a.ready) || (a.ready ? readySince[a.t.id]-readySince[b.t.id] : 0) || (a.i-b.i));
    return list.map(o=>o.t);
  };
  const story=group(tasks), side=group(S.side);
  const label=(txt,cls)=>{ const l=document.createElement('div'); l.className='grp '+cls; l.innerHTML=`<span>${txt}</span>`; box.appendChild(l); };
  if(storyNewlyReady) box.scrollTo({left:0,behavior:'smooth'});
  const rows=[];
  if(story.length){ rows.push(['label','Story','g-story']); story.forEach(t=>rows.push(t)); }
  if(side.length){ rows.push(['label',CAST.S.name,'g-side']); side.forEach(t=>rows.push(t)); }
  rows.forEach(t=>{
    if(Array.isArray(t)){ label(t[1],t[2]); return; }
    const st=taskStatus(t);
    const el=document.createElement('div');
    el.className='order'+(st.ready?' ready':'')+(t.side?' side':'')+(t.lucky?' lucky':'');
    el.dataset.id=t.id;
    if(!t.side && (!(S.seenOrd||{})[t.id] || flying===String(t.id))) el.classList.add('incoming');
    el.innerHTML=`${!t.side&&!(S.readOrd||{})[t.id]?'<i class="opip" title="New story"></i>':''}<div class="who"><span class="av">${CAST[t.who].av}</span><span>${t.lucky?'🍀 Lucky':CAST[t.who].name}</span></div>
      <div class="needs">${t.need.map(([k,l],j)=>`<span class="need${st.have[j]?' have':''}">${CHAINS[k].items[l-1].e}${st.have[j]?'<i>✓</i>':''}</span>`).join('')}${t.wheel?`<span class="need wh${st.wok?' have':''}">💡<small>${Math.min(wheelDone(),t.wheel)}/${t.wheel}</small>${st.wok?'<i>✓</i>':''}</span>`:''}${t.sales?`<span class="need wh${st.sok?' have':''}">${CAST.S.av}<small>${Math.min(salesFor(t),t.sales)}/${t.sales}</small>${st.sok?'<i>✓</i>':''}</span>`:''}</div>
      <div class="act${st.ready&&!t.side?' rd':''}">${st.ready?(t.side?'Hand over':'✓ Ready'):(t.side?t.rw:taskRewards(t)).map(([k,l])=>CHAINS[k].items[l-1].e).join(' ')}</div>`;
    // tap the card for details; only the green "Hand over" strip delivers
    // story orders only hand over from their details popup; side orders can still go from the strip
    el.onclick=e=>{ if(t.side && e.target.closest('.act') && taskStatus(t).ready){ deliver(t); return; } showOrder(t); };
    box.appendChild(el);
  });
  if(flying===null && box.querySelector('.order.incoming')) setTimeout(runArrivals,60);
}
let sellArm=false;
function renderInfo(){
  const box=$('info');
  const c=S.cells[sel];
  if(sel<0||!c||!c.it||c.s!=='open'){
    const tip = S.gifts.length ? 'You have a gift waiting. Tap 🎁 to put it on the board.'
      : 'Tap a generator twice to make something. Drag matching items together to merge.';
    box.innerHTML=`<div class="big">🐕</div><div class="txt hintline">${tip}</div>`;
    return;
  }
  const it=c.it, d=def(it), ch=CHAINS[it.k];
  if(it.wrap){ box.innerHTML=`<div class="big">🎁</div><div class="txt"><div class="nm">A present</div><div class="ds">${T.presentDesc} Tap to open it.</div></div>`; return; }
  let ds='';
  if(ch.wheel){
    box.innerHTML=`<div class="big">🎡</div><div class="txt"><div class="nm">Prize Wheel<small>💡 ${wheelDone()}/20 lit</small></div><div class="ds">Tap to open. ${WHEEL_COST} 🎟️ per spin. New segments move the story on.</div></div><div class="btns"><button class="sbtn" id="wOpen">Spin</button><button class="sbtn" id="tkBtn">Get 🎟️</button></div>`;
    $('wOpen').onclick=()=>openWheel(sel); $('tkBtn').onclick=ticketShop; return;
  }
  if(isGen(it)){
    if(d.want){ const w=CHAINS[it.want[0]].items[it.want[1]-1]; ds=`Wants ${w.e} ${w.n}. Drag one onto it to get a seedling 🌱. It asks for something new each time.`; }
    else if(d.fuelled) ds = it.fuel>0 ? `Tap again to cook. ${it.fuel} fuel left.` : `Cold. Drag ${fuelNames()} onto it.`;
    else if(d.uses) ds=`Tap again. ${it.left} left, then it ${d.after?`leaves a ${CHAINS[d.after[0]].items[d.after[1]-1].e}`:'folds flat for good'}.${d.free&&it.l<maxL(it.k)?` Merge two unopened ones for a ${ch.items[it.l].n}.`:''}`;
    else if(d.free){ refreshCharges(it); ds = it.ch>0 ? `Tap again to brew. ${it.ch} left.` : `Boiling… ready in ${nextChargeIn(it)}s.`; }
    else { ds=`Tap again to make ${CHAINS[ch.main].name.toLowerCase()}${ch.rare?`, sometimes a rare ${CHAINS[ch.rare].name.toLowerCase()} item`:''}.`; if(d.charges) ds+= it.ch>0?` ${it.ch} left before a rest.`:` Resting: next in ${fmt(nextChargeIn(it))}.`;
      if(canFocus(it)) ds+= it.focus?` Focused for ${it.focus} more taps.`:` Drag ${CHAINS.E.items[0].e} onto it for better rare odds.`; }
    if(it.l<maxL(it.k) && !d.want && !d.fuelled && !d.free) ds+=` Merge two to get a ${ch.items[it.l].n}.`;
    if(d.charges && chargedCell(sel)) ds+=' ⏱️ A Time Charger is doubling its recharge speed.';
  } else if(isCharger(it)){
    const here=Math.round(d.hours*60*CONFIG.chargerScale);
    ds = it.on ? `Running: ${fmt(Math.ceil((it.end-now())/1000))} left. Timed generators in the 8 tiles around it recharge twice as fast. When it runs out it tops them up and disappears.`
               : `Tap again to switch on. Runs ${here} min, doubling the recharge speed of timed generators around it. Can’t be merged once on.`+(it.l<maxL(it.k)?` Merge two for a ${ch.items[it.l].n}.`:'');
  } else if(it.st){
    ds=T.notesItem;
  } else if(isBoost(it)){
    ds=`Drag onto a generator: its next ${FOCUS[it.l-1]} taps find rare items ${FOCUS_MULT}× more often.`+(it.l<maxL(it.k)?` Merge two for ${FOCUS[it.l]} taps.`:' Top of the chain.');
  } else if(ch.type==='res'){
    const unit = ch.claim==='coins'?'🪙' : ch.claim==='skip'?'min time skip' : ch.claim==='points'?T.passName+' points' : ch.claim==='chips'?'🎟️ (raffle tickets)' : '⭐ applause';
    if(ch.claim==='skip') ds=`Tap again to skip ${d.v} min on every generator’s recharge.`+(it.l<maxL(it.k)?` Merge two for ${ch.items[it.l].v} min.`:'');
    else ds=`Tap again to collect +${d.v} ${unit}.`+(it.l<maxL(it.k)?` Merge two for +${ch.items[it.l].v}.`:' Top of the chain.');
  } else if(it.k==='ET'){
    ds=`Drag onto a generator to refill it straight away.`;
  } else {
    ds = (fuelValue(it)?`Burns in the stove for ${fuelValue(it)} fuel. `:'') + (ch.rare?`Rare find from the ${genLabel(genFor(it.k))}. `:'') + (it.l<maxL(it.k) ? `Merge two to make: ${ch.items[it.l].e} ${S.disc[key(it.k,it.l+1)]?ch.items[it.l].n:'???'}` : 'The top of this chain.');
  }
  const sv=sellValue(it);
  box.innerHTML=`<div class="big">${d.e}</div>
    <div class="txt"><div class="nm">${d.n}<small>${ch.name!==d.n?ch.name+' · ':''}Lv ${it.l}</small></div><div class="ds">${ds}</div></div>
    <div class="btns"><button class="sbtn" id="chainBtn">Chain</button>${sv?`<button class="sbtn${sellArm?' warn':''}" id="sellBtn">${sellArm?'Sure?':'Sell 🪙'+sv}</button>`:''}</div>`;
  $('chainBtn').onclick=()=>showChain(it.k, it.l);
  if(sv) $('sellBtn').onclick=()=>{ if(sellArm){ sellArm=false; sell(sel); } else { sellArm=true; renderInfo(); } };
}

/* ============================================================ input: tap / drag */
const ghost=$('ghost');
let press=null;
board.addEventListener('pointerdown',e=>{
  const el=e.target.closest('.cell'); if(!el) return;
  const i=+el.dataset.i;
  press={i,x:e.clientX,y:e.clientY,drag:false,id:e.pointerId};
  board.setPointerCapture?.(e.pointerId);
});
board.addEventListener('pointermove',e=>{
  if(!press) return;
  const c=S.cells[press.i];
  if(!press.drag){
    if(Math.hypot(e.clientX-press.x,e.clientY-press.y)<8) return;
    if(c.s!=='open'||!c.it){ press=null; return; }
    if(c.it.st){ const pi=press.i; press=null; flo(`Tap to read it ${T.tokenIcon}`, pi); return; }
    press.drag=true; sellArm=false;
    ghost.textContent=def(c.it).e;
    board.children[press.i].classList.add('lift');
  }
  ghost.style.transform=`translate(${e.clientX}px,${e.clientY}px) translate(-50%,-60%) scale(1.1)`;
  const t=cellAt(e.clientX,e.clientY);
  [...board.querySelectorAll('.drop')].forEach(x=>x.classList.remove('drop'));
  if(t>=0&&t!==press.i) board.children[t].classList.add('drop');
});
function endPress(e,cancel){
  if(!press) return;
  const p=press; press=null;
  ghost.style.transform='translate(-999px,-999px)';
  [...board.querySelectorAll('.drop,.lift')].forEach(x=>x.classList.remove('drop','lift'));
  if(cancel) return;
  if(p.drag){ drop(p.i, cellAt(e.clientX,e.clientY)); }
  else tap(p.i);
}
board.addEventListener('pointerup',e=>endPress(e,false));
board.addEventListener('pointercancel',e=>endPress(e,true));
function cellAt(x,y){
  const r=board.getBoundingClientRect();
  if(x<r.left||x>=r.right||y<r.top||y>=r.bottom) return -1;
  const cs=r.width/7;
  return Math.floor((y-r.top)/cs)*7+Math.floor((x-r.left)/cs);
}
function tap(i){
  const c=S.cells[i];
  SND.play('tap');
  if(c.s==='sheet'){ const n=CHAPTERS.findIndex(ch=>ch.zone===c.z)+1; flo(`${T.sheetTap} Opens in Chapter ${n}`, i); return; }
  if(c.s==='box'){ flo('Merge next to a box to open it', i); return; }
  if(c.s==='web'){ const d=def(c.it); flo(`Stuck. Drop another ${d.e} on it`, i); sel=-1; render(); return; }
  if(!c.it){ sel=-1; sellArm=false; render(); return; }
  if(c.it.wrap){ unwrap(i); return; }
  if(c.it.st){ sel=i; claim(i); return; } // story rosette: one tap reads it
  if(CHAINS[c.it.k].wheel){ sel=i; render(); openWheel(i); return; } // the wheel opens on one tap
  if(sel===i){
    if(isCharger(c.it) && !c.it.on){ activateCharger(i); return; }
    if(isGen(c.it)){ produce(i); return; }
    if(isBoost(c.it)){ SND.play('nope'); flo(`${def(c.it).e} Drag me onto a generator for rarer finds`, i); return; }
    if(isRes(c.it)){ const ch=CHAINS[c.it.k]; if(ch.claimMax && c.it.l<maxL(c.it.k)){ SND.play('nope'); toast(`Merge up to a ${ch.items[maxL(c.it.k)-1].e} ${ch.items[maxL(c.it.k)-1].n} to claim ${T.passName} points`); return; } claim(i); return; }
    return;
  }
  if(isGen(c.it)){ const gk=key(c.it.k,c.it.l); // a generator you never heard about: its story plays when you first pick it up
    if(GEN_STORY[gk]&&!(S.genSeen||{})[gk]&&!(S.genQ||[]).includes(gk)){ (S.genQ=S.genQ||[]).unshift(gk); genBusy=true; setTimeout(playGenStory,150); } }
  sel=i; sellArm=false; render();
}

/* ============================================================ overlays */
/* toasts never cover story dialogue: while a scene is open they wait, then show once it closes */
let heldToasts=[];
function flushToasts(){
  const list=heldToasts.filter((t,i,a)=>a.findIndex(x=>x[0]===t[0])===i).slice(-3); heldToasts=[];
  list.forEach(([h,ms],i)=>setTimeout(()=>toast(h,ms),250+i*450));
}
function storyOpen(){ return !$('scene').hidden || $('modal').dataset.story==='1'; }
/* one toast at a time, docked over the info panel; it stays until tapped, then the next one shows.
   Sits just under dialogs (z 45 vs 50) and waits while one is open, so it never blocks a button. */
let toastQ=[], toastCur=null;
function hideToasts(){
  if(toastCur){ heldToasts.push([toastCur.h,toastCur.ms]); toastCur.el.remove(); toastCur=null; }
  toastQ.forEach(t=>heldToasts.push(t)); toastQ=[];
}
function dockToast(){
  const r=$('info').getBoundingClientRect(), b=$('toast').style;
  b.left=r.left+'px'; b.top=r.top+'px'; b.width=r.width+'px'; b.height=r.height+'px';
}
const overlayOpen=()=>storyOpen()||!$('modal').hidden;
function toastMore(){ if(!toastCur) return; const m=toastCur.el.querySelector('.tm'); m.textContent=toastQ.length?`+${toastQ.length} more`:''; }
function nextToast(){
  if(toastCur||overlayOpen()) return;
  const n=toastQ.shift(); if(!n) return;
  dockToast();
  const el=document.createElement('div'); el.className='t'; el.innerHTML=`<div>${n[0]}</div><span class="tm"></span><span class="tx">✕</span>`;
  $('toast').appendChild(el);
  toastCur={el,h:n[0],ms:n[1]}; toastMore();
}
function closeToast(){
  const cur=toastCur; if(!cur) return;
  toastCur=null; SND.play('tap');
  cur.el.classList.add('out'); setTimeout(()=>{ cur.el.remove(); nextToast(); },150);
}
$('toast').addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); closeToast(); });
/* flo: a small message that floats up from a tile (or the middle of the board) and fades. No tap needed, never queues.
   Keep toast() for things you need to read or decide on. */
let floN=0;
function flo(html, cell){
  if(storyOpen()){ return; }
  const host=document.body, el=document.createElement('div'); el.className='flo'; el.innerHTML=html;
  let x, y; const br=board.getBoundingClientRect();
  if(cell!=null && cell>=0 && board.children[cell]){ const r=board.children[cell].getBoundingClientRect(); x=r.left+r.width/2; y=r.top+4; }
  else { x=br.left+br.width/2; y=br.top+br.height*.42; }
  y-= (floN%3)*20; floN++; setTimeout(()=>floN=Math.max(0,floN-1),900);
  el.style.left=Math.max(70,Math.min(innerWidth-70,x))+'px'; el.style.top=y+'px';
  host.appendChild(el); setTimeout(()=>el.remove(),1900);
}
function toast(html,ms=2200){
  if(storyOpen()){ heldToasts.push([html,ms]); return; }
  if(toastQ.some(t=>t[0]===html) || (toastCur&&toastCur.h===html)) return;
  toastQ.push([html,ms]); if(toastQ.length>5) toastQ.splice(0,toastQ.length-5);
  if(toastCur) toastMore(); else nextToast();
}
function playQueue(q,done){
  if(!q.length){ done&&done(); return; }
  const s=q.shift();
  playScene(s, ()=>playQueue(q,done));
}
function playScene(sc,done){
  const ov=$('scene'); let i=0;
  hideToasts();
  ov.hidden=false; ov.classList.toggle('clear',!!sc.clear);
  const show=()=>{
    if(i>=sc.lines.length){ ov.hidden=true; ov.innerHTML=''; if(done) done(); if(!storyOpen()) flushToasts(); setTimeout(runArrivals,300); return; }
    const [who,txt]=sc.lines[i], cst=CAST[who];
    const cls = who==='N'?'narr': (who==='O'||who==='F')?'note':'';
    ov.innerHTML=`${i===0&&sc.title&&!sc.clear?`<div class="scene-title"><small>${sc.title}</small>${sc.sub||''}</div>`:sc.clear?'':'<div style="margin:auto"></div>'}
      <div class="dlg ${cls}" id="dlg" role="button" tabindex="0">
        ${sc.clear&&sc.title?`<div class="dtitle">${sc.title}${sc.sub?` · <span>${sc.sub}</span>`:''}</div>`:''}${cst.name?`<div class="spk"><span class="av">${cst.av}</span><b>${cst.name}</b></div>`:''}
        <p>${txt}</p>
        <div class="foot"><span>${i+1} / ${sc.lines.length}</span><span>Tap to continue ›</span></div>
      </div>
      <button class="sbtn" id="skipBtn" style="margin-top:10px">Skip scene</button>`;
    $('dlg').onclick=()=>{ SND.play('page'); i++; show(); };
    $('dlg').onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); SND.play('page'); i++; show(); } };
    $('skipBtn').onclick=()=>{ i=sc.lines.length; show(); };
    $('dlg').focus();
  };
  show();
}
function openModal(html,story){ $('modalBody').innerHTML=html; $('modal').hidden=false; $('modal').dataset.story=story?'1':''; if(story) hideToasts(); }
function closeModal(){ const was=$('modal').dataset.story==='1'; $('modal').hidden=true; $('modal').dataset.story=''; if(was && !storyOpen()) flushToasts(); setTimeout(nextToast,200); setTimeout(runArrivals,250); }
$('modal').addEventListener('click',e=>{ if(e.target.id==='modal' && !wheelBusy) closeModal(); });

function chainHtml(k,cur){
  const ch=CHAINS[k];
  return `<div class="chain">${ch.items.map((d,j)=>{
    const kk=key(k,j+1), known=S.disc[kk];
    if(known && (S.unrev||{})[kk]) return `<div class="ci wrap${cur===j+1?' cur':''}" data-rv="${kk}" role="button"><span>🎁</span>Tap</div>`;
    return `<div class="ci${known?'':' unk'}${cur===j+1?' cur':''}"><span>${known?d.e:'?'}</span>${known?d.n:'Lv '+(j+1)}</div>`;
  }).join('')}</div>`;
}
function showChain(k,cur){
  const ch=CHAINS[k];
  let extra='';
  if(ch.gen){ const d=ch.items[0]; extra=`<p class="ds">Makes: ${[...new Set(d.drop.map(x=>x[0]))].map(x=>CHAINS[x].name).join(', ')}.</p>${chainHtml(d.drop[0][0])}`; }
  else { const g=genFor(k); if(g) extra=`<p style="color:var(--muted);font-size:13px">Comes from the ${genLabel(g)}.</p>`; }
  openModal(`<h2>${ch.name}</h2>${chainHtml(k,cur)}${extra}<div class="row-btns"><button class="bigbtn" onclick="closeModal()">Close</button></div>`);
}
function showLore(it){
  const d=def(it);
  SND.play('magic');
  openModal(`<h3 style="margin-top:0">${T.loreFound}</h3><div style="font-size:54px;text-align:center">${d.e}</div><h2 style="text-align:center">${d.n}</h2><p style="font-style:italic;text-align:center">${d.lore}</p><div class="row-btns" style="justify-content:center"><button class="bigbtn gold" onclick="closeModal()">Into the journal</button></div>`,true);
}
function journalHtml(){
  let html=(S.complete&&REFLECTIONS.length?'<div class="row-btns" style="margin-top:4px"><button class="bigbtn gold" data-refl="1">✨ Reflections</button></div>':'')+`<h3 style="margin-top:4px">Chapters</h3>`;
  const upto=S.complete?CHAPTERS.length:S.ch+1;
  for(let c=0;c<upto;c++){
    const fin=S.journal.includes(c);
    html+=`<div class="entry"><b>${c+1}. ${CHAPTERS[c].title}</b><div class="row-btns" style="margin-top:6px">
      <button class="sbtn" data-scene="i${c}">Replay opening</button>${fin?`<button class="sbtn" data-scene="o${c}">Replay ending</button>`:''}</div></div>`;
  }
  html+=`<h3>${T.loreHeading}</h3>`;
  const lore=CHAINS.M.items.map((d,j)=>S.disc[key('M',j+1)]?`<div class="lore"><span>${d.e}</span><div><b>${d.n}</b>${d.lore}</div></div>`:'').join('');
  html+= lore || `<p style="color:var(--muted)">${T.loreEmpty}</p>`;
  if(wheelDone()>0){
    html+=`<h3>💡 Under the wheel lights <span style="color:var(--muted);font-weight:400;font-size:13px">${wheelDone()}/${WHEEL_N}</span></h3>`;
    html+=wheelListHtml(true);
  }
  const mn=MOON_NOTES.filter((_,j)=>(S.moonSeen||{})[j+1]), fx=FELIX.filter((_,j)=>S.passGot[j*3+2]);
  if(mn.length||fx.length){
    html+=`<h3>Letters & notes</h3>`;
    mn.forEach(ls=>html+=`<div class="lore"><span>🌙</span><div>${ls[ls.length-1][1]}</div></div>`);
    fx.forEach(ls=>html+=`<div class="lore"><span>✉️</span><div>${ls.find(l=>l[0]==='F')[1]}</div></div>`);
  }
  return html;
}
function wireJournal(){
  const rf=$('modalBody').querySelector('[data-refl]'); if(rf) rf.onclick=()=>{ closeModal(); showReflections(); };
  $('modalBody').querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{
    const s=b.dataset.scene, c=+s.slice(1), ch=CHAPTERS[c];
    closeModal();
    playScene({title:'Chapter '+(c+1), sub:ch.title, lines: s[0]==='i'?ch.intro:ch.outro});
  });
}
/* ============================================================ mini quests */
function stat(k,n=1){
  if(!S) return;
  const st=S.stats||(S.stats={}); st[k]=(st[k]||0)+n;
  const q=QUESTS.find(x=>x.id===k);
  if(q){ const t=(S.qt||{})[k]||0, tgt=q.steps[t];
    if(tgt && st[k]>=tgt && st[k]-n<tgt) setTimeout(()=>{ SND.play('gift'); toast(`📋 Quest done: ${q.ic} ${q.n} ${tgt}<br><small>Claim it in 📖</small>`,3000); },250); }
  renderPip();
}
function questReady(q){ const t=(S.qt||{})[q.id]||0; return t<q.steps.length && ((S.stats||{})[q.id]||0)>=q.steps[t]; }
function questRw(t){ return QUEST_RW[Math.min(t,QUEST_RW.length-1)].map(([k,l])=>[k,Math.min(l,maxL(k))]); }
function renderPip(){
  const p=$('bookPip'); if(!p||!S) return;
  const n=QUESTS.filter(questReady).length+Object.keys(S.unrev||{}).length;
  p.hidden=!n; p.textContent=n>99?'99+':n;
}
function questsHtml(){
  let h=`<p style="color:var(--muted);font-size:13px;margin-top:0">• Little goals that run all event<br>• Each has several stages<br>• Rewards go to 🎁</p>`;
  const row=q=>{ const t=S.qt[q.id]||0, v=S.stats[q.id]||0, fin=t>=q.steps.length, tgt=q.steps[Math.min(t,q.steps.length-1)], ready=questReady(q);
    return {q,ready,fin,frac:fin?2:Math.min(1,v/tgt),html:`<div class="quest${ready?' done':''}${fin?' fin':''}"><span class="qi">${q.ic}</span><div class="qb"><div class="qn">${q.n}${fin?'':' '+tgt}</div>
      <div class="qbar"><i style="width:${fin?100:Math.min(100,v/tgt*100)}%"></i></div>
      <div class="qs">${fin?'All stages done ✓':`${Math.min(v,tgt)}/${tgt} · stage ${t+1} of ${q.steps.length} · ${questRw(t).map(([k,l])=>CHAINS[k].items[l-1].e).join(' ')}`}</div></div>
      ${ready?`<button class="sbtn" style="background:var(--gold);color:#2a1a10" data-q="${q.id}">Claim</button>`:''}</div>`}; };
  QUESTS.map(row).sort((a,b)=>(b.ready-a.ready)||(a.fin-b.fin)||(b.frac-a.frac)).forEach(r=>h+=r.html);
  return h;
}
function claimQuest(id){
  const q=QUESTS.find(x=>x.id===id); if(!q||!questReady(q)) return;
  const t=S.qt[q.id]||0; S.qt[q.id]=t+1;
  questRw(t).forEach(r=>S.gifts.push(r));
  SND.play('gift');
  save(); render(); showBook('q');
}

/* ============================================================ collection: new finds wait here, wrapped, until tapped */
const rwTxt=r=>[r.c?`🪙${r.c}`:'', r.x?`⭐${r.x}`:''].filter(Boolean).join(' ');
function revealDisc(kk,el,quiet){
  if(!(S.unrev||{})[kk]) return null;
  const m=kk.match(/^([a-zA-Z]+?)(\d+)$/); if(!m||!CHAINS[m[1]]) { delete S.unrev[kk]; return null; }
  const k=m[1], l=+m[2], d=CHAINS[k].items[l-1], r=discRw(k,l);
  delete S.unrev[kk];
  S.coins+=r.c; if(r.x) addXP(r.x);
  if(el){ el.className='ci flip'; el.removeAttribute('data-rv'); el.removeAttribute('role'); el.innerHTML=`<span>${d.e}</span>${d.n}<b class="rw">+${rwTxt(r)}</b>`; }
  if(!quiet){ SND.play(l>=5?'gift':'coin'); save(); render(); bookCounts(); }
  return r;
}
function revealAll(){
  const els=[...$('modalBody').querySelectorAll('[data-rv]')]; if(!els.length) return;
  $('revAll').disabled=true;
  const tot={c:0,x:0};
  els.forEach((el,i)=>setTimeout(()=>{
    const r=revealDisc(el.dataset.rv,el,true); if(r){ tot.c+=r.c; tot.x+=r.x; }
    if(i%2===0) SND.play('coin');
    if(i===els.length-1){ Object.keys(S.unrev||{}).forEach(kk=>{ const r2=revealDisc(kk,null,true); if(r2){ tot.c+=r2.c; tot.x+=r2.x; } });
      SND.play('gift'); save(); render(); bookCounts(); const b=$('revAll'); if(b) b.parentNode.remove(); }
  }, i*110));
}
function collectionHtml(){
  const un=Object.keys(S.unrev||{}).length;
  let h=`<p style="color:var(--muted);font-size:13px;margin-top:0">• New finds wait here, wrapped 🎁<br>• Tap one to reveal it and collect a reward<br>• Higher levels pay more</p>`;
  if(un>1) h+=`<div class="row-btns" style="margin-top:0"><button class="bigbtn gold" id="revAll">Reveal all ${un}</button></div>`;
  const groups=[['Items',ch=>!ch.gen&&!ch.type&&ch.rare!==true],['Rare finds',ch=>!ch.gen&&ch.rare===true],['Resources',ch=>ch.type==='res'||ch.type==='boost'],['Generators',ch=>ch.gen]];
  let hidden=0;
  groups.forEach(([name,fn])=>{
    const ks=Object.keys(CHAINS).filter(k=>fn(CHAINS[k]));
    const found=ks.filter(k=>CHAINS[k].items.some((_,j)=>S.disc[key(k,j+1)]));
    hidden+=ks.length-found.length;
    if(!found.length) return;
    // chains with wrapped finds first
    found.sort((a,b)=>CHAINS[b].items.some((_,j)=>S.unrev[key(b,j+1)])-CHAINS[a].items.some((_,j)=>S.unrev[key(a,j+1)]));
    h+=`<div class="cgrp">${name}</div>`;
    found.forEach(k=>{ const ch=CHAINS[k], n=ch.items.filter((_,j)=>S.disc[key(k,j+1)]).length;
      h+=`<p class="cname">${ch.name}<small>${n}/${ch.items.length}</small></p>${chainHtml(k)}`; });
  });
  if(hidden) h+=`<p style="color:var(--muted);font-size:13px;margin-top:14px">${hidden} more chain${hidden>1?'s':''} still to find.</p>`;
  return h;
}

/* ============================================================ the book: quests · collection · journal */
let bookTab='q';
function bookCounts(){
  const qn=QUESTS.filter(questReady).length, un=Object.keys(S.unrev||{}).length;
  document.querySelectorAll('.tabs [data-tab]').forEach(b=>{ const n=b.dataset.tab==='q'?qn:b.dataset.tab==='c'?un:0; let p=b.querySelector('.pip');
    if(n){ if(!p){ p=document.createElement('i'); p.className='pip'; b.appendChild(p); } p.textContent=n; } else if(p) p.remove(); });
  renderPip();
}
function showBook(tab){
  const qn=QUESTS.filter(questReady).length, un=Object.keys(S.unrev||{}).length;
  tab=tab||(qn?'q':un?'c':bookTab); bookTab=tab;
  const T=(id,lbl)=>`<button data-tab="${id}" class="${tab===id?'on':''}">${lbl}</button>`;
  let h=`<div class="tabs">${T('q','📋 Quests')}${T('c','🧩 Collection')}${T('j','📖 Journal')}</div>`;
  h+= tab==='q'?questsHtml() : tab==='c'?collectionHtml() : journalHtml();
  h+=`<div class="row-btns"><button class="bigbtn" onclick="closeModal()">Close</button></div>`;
  openModal(h);
  $('modalBody').scrollTop=0;
  bookCounts();
  $('modalBody').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ SND.play('page'); showBook(b.dataset.tab); });
  $('modalBody').querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>claimQuest(b.dataset.q));
  if($('revAll')) $('revAll').onclick=revealAll;
  if(tab==='j') wireJournal();
}
const showJournal=()=>showBook('j');
$('modalBody').addEventListener('click',e=>{ const t=e.target.closest('[data-rv]'); if(t) revealDisc(t.dataset.rv,t); });

/* ============================================================ new story orders arrive: big at the bottom, then fly up into the row */
var flying=null;
function runArrivals(){
  if(flying!==null||!S||S.complete||storyOpen()||!$('modal').hidden||!$('title').hidden) return;
  const box=$('orders'), el=box.querySelector('.order.incoming'); if(!el) return;
  const id=el.dataset.id; flying=id; const hold=box.querySelectorAll('.order.incoming').length>1?850:1400;
  box.scrollTo({left:0});
  const tr=el.getBoundingClientRect(), W=tr.width, H=tr.height;
  const card=document.createElement('div'); card.className='arrive';
  card.innerHTML='<div class="arrive-tag">📜 New story request</div>';
  const cl=el.cloneNode(true); cl.classList.remove('incoming'); cl.style.cssText=`width:${W}px;height:${H}px;margin:0`; card.appendChild(cl);
  const x0=(innerWidth-W)/2, y0=innerHeight*.74-H/2;
  card.style.left=x0+'px'; card.style.top=y0+'px'; card.style.width=W+'px';
  document.body.appendChild(card);
  SND.play('page');
  card.animate([{transform:'translateY(70px) scale(.6)',opacity:0},{transform:'translateY(0) scale(1.4)',opacity:1}],{duration:450,easing:'cubic-bezier(.2,.9,.3,1.25)',fill:'forwards'});
  setTimeout(()=>{
    const tgt=box.querySelector(`.order[data-id="${id}"]`), r=(tgt||el).getBoundingClientRect();
    card.querySelector('.arrive-tag').animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'});
    const a=card.animate([{transform:'translate(0,0) scale(1.4)',opacity:1},{transform:`translate(${r.left-x0}px,${r.top-y0}px) scale(1)`,opacity:1}],{duration:620,easing:'cubic-bezier(.55,0,.3,1)',fill:'forwards'});
    a.onfinish=()=>{
      card.remove(); (S.seenOrd||(S.seenOrd={}))[id]=1; save(); flying=null;
      const t2=box.querySelector(`.order[data-id="${id}"]`); if(t2){ t2.classList.remove('incoming'); t2.classList.add('landed'); }
      SND.play('tap');
      setTimeout(runArrivals,200);
    };
  },hold);
}

let resetArm=false;
function showMenu(){
  openModal(`<h2>${EVENT.title}</h2><p style="color:var(--muted)">${EVENT.tagline} · no timer · story ${EVENT.version}<br>Merge Stories ${VERSION}</p>
    <div class="row-btns"><button class="bigbtn gold" id="shopOpen">🛒 ${P2.shopName}</button></div>
    <h3>Sound</h3>
    <div class="row-btns" style="margin-top:0"><button class="bigbtn${SND.pref.music?' gold':''}" id="musBtn">♪ Music: ${SND.pref.music?'On':'Off'}</button><button class="bigbtn${SND.pref.sfx?' gold':''}" id="sfxBtn">Sound effects: ${SND.pref.sfx?'On':'Off'}</button></div>
    <h3>Help</h3><div class="row-btns" style="margin-top:0"><button class="bigbtn" id="sosOpen">I’m stuck…</button></div>
    <h3>Stories</h3><div class="row-btns" style="margin-top:0"><button class="bigbtn" id="ejectMenu">⏏ Change story</button></div><p style="color:var(--muted);font-size:13px">Each story keeps its own save.</p>
    <h3>Save</h3><p style="color:var(--muted);font-size:13px">Progress saves in this browser automatically.</p>
    <div class="row-btns"><button class="bigbtn warn" id="resetBtn">${resetArm?'Tap again to wipe everything':'Restart event'}</button><button class="bigbtn" onclick="closeModal()">Close</button></div>`);
  $('shopOpen').onclick=showShop;
  $('ejectMenu').onclick=()=>ejectStory();
  $('musBtn').onclick=()=>{ SND.setMusic(!SND.pref.music); showMenu(); };
  $('sosOpen').onclick=showSOS;
  $('sfxBtn').onclick=()=>{ SND.setSfx(!SND.pref.sfx); showMenu(); SND.play('tap'); };
  $('resetBtn').onclick=()=>{ if(!resetArm){ resetArm=true; showMenu(); return; } resetArm=false; S=freshState(); sel=-1; save(); closeModal(); render(); startIntro(); };
}
/* emergency help: small, slow to refill, a couple of taps deep so it stays a last resort */
const SOS_COOLDOWN=30*60000;
function showSOS(){
  const left=k=>Math.max(0,Math.ceil(((S[k]||0)+SOS_COOLDOWN-now())/1000));
  const tl=left('sosT'), el=left('sosE');
  openModal(`<h2>I’m stuck</h2><p style="color:var(--muted);font-size:13px">• For when there’s genuinely nothing to do<br>• Each one refills every 30 minutes<br>• Time skips and egg timers are the better way</p>
    <div class="row-btns"><button class="bigbtn${tl?'':' gold'}" id="sosT" ${tl?'disabled style="opacity:.5"':''}>⏳ Skip 5 minutes${tl?` · ${fmt(tl)}`:''}</button>
    <button class="bigbtn${el?'':' gold'}" id="sosE" ${el?'disabled style="opacity:.5"':''}>${CHAINS.ET.items[0].e} An egg timer${el?` · ${fmt(el)}`:''}</button></div>
    <div class="row-btns"><button class="bigbtn" id="sosBack">Back</button></div>`);
  $('sosBack').onclick=showMenu;
  if(!tl) $('sosT').onclick=()=>{ S.sosT=now(); timeSkip(5); SND.play('unweb'); flo('⏳ 5 minutes skipped'); save(); render(); showSOS(); };
  if(!el) $('sosE').onclick=()=>{ S.sosE=now(); S.gifts.push(['ET',1]); SND.play('gift'); flo('Added to your gifts 🎁'); save(); render(); showSOS(); };
}
function showPass(){
  const nextT=PASS.find(t=>S.pts<t.pts), max=PASS[PASS.length-1].pts;
  let h=`<h2>${T.passName}</h2><p style="color:var(--muted);font-size:13px">${T.passHelp}</p>
    <div class="passbar"><i style="width:${Math.min(100,S.pts/max*100)}%"></i></div><p style="margin:0 0 6px;font-size:13px">${CHAINS.N.items[0].e} ${S.pts} points${nextT?` · next reward at ${nextT.pts}`:' · pass complete'}</p>`;
  PASS.forEach((t,i)=>{
    const got=S.passGot[i], ok=S.pts>=t.pts;
    h+=`<div class="tier${ok?'':' locked'}"><span class="tp">${t.pts}</span><span class="tr">${t.rw.map(([k,l])=>CHAINS[k].items[l-1].e).join(' ')}</span>${got?'<span style="color:var(--ok);font-weight:800">✓</span>':ok?`<button class="sbtn" style="background:var(--gold);color:#2a1a10" data-tier="${i}">Claim</button>`:''}</div>`;
  });
  h+=`<div class="row-btns"><button class="bigbtn" onclick="closeModal()">Close</button></div>`;
  openModal(h);
  $('modalBody').querySelectorAll('[data-tier]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.tier; if(S.passGot[i]||S.pts<PASS[i].pts) return; S.passGot[i]=1; PASS[i].rw.forEach(r=>give(r[0],r[1])); SND.play('gift'); flo('Added to your gifts 🎁'); save(); render(); if((i+1)%3===0){ closeModal(); playScene({title:T.lettersTitle, sub:`${T.letterWord} ${(i+1)/3} of ${FELIX.length}`, lines:FELIX[(i+1)/3-1]}); } else showPass(); });
}
function showComplete(){
  openModal(`<h3 style="margin-top:0">Event complete</h3><h2>${EVENT.complete.title}</h2><p>${EVENT.complete.text}</p><p style="color:var(--muted)">${EVENT.complete.note}</p><div class="row-btns"><button class="bigbtn gold" onclick="closeModal()">Keep playing</button>${REFLECTIONS.length?'<button class="bigbtn" id="reflGo">✨ Reflections</button>':''}</div>`);
  if($('reflGo')) $('reflGo').onclick=()=>{ closeModal(); showReflections(); };
}

$('journalBtn').onclick=()=>showBook();
$('menuBtn').onclick=()=>{ resetArm=false; showMenu(); };
$('giftBtn').onclick=placeGift;
$('coinPill').onclick=showShop;
$('passBtn').onclick=showPass;
$('xpRow').onclick=()=>{ const l=stageOf(S.xp); toast(`⭐ Stage ${l}. Next level gives: ${stageReward(l+1).map(([k,lv])=>CHAINS[k].items[lv-1].e).join(' ')}<br><small>Claim stars ⭐ on the board to fill it</small>`,3200); };

/* full screen toggle */
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
$('fsBtn').onclick=async()=>{
  try{
    if(fsEl()){ await (document.exitFullscreen||document.webkitExitFullscreen).call(document); return; }
    const el=document.documentElement, req=el.requestFullscreen||el.webkitRequestFullscreen;
    if(!req) throw 0;
    await req.call(el,{navigationUI:'hide'});
  }catch(e){ toast('Full screen isn’t allowed in this view. Open the page in your browser, or add it to your home screen.',3800); }
};
const fsSync=()=>{ $('fsPath').setAttribute('d', fsEl()?'M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4':'M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4'); setTimeout(fit,60); };
document.addEventListener('fullscreenchange',fsSync);
document.addEventListener('webkitfullscreenchange',fsSync);

/* ============================================================ sizing & loop */
function fit(){
  const r=$('wrap').getBoundingClientRect();
  const cs=Math.max(32,Math.floor(Math.min((r.width-8)/7,(r.height-8)/9)));
  document.documentElement.style.setProperty('--cs',cs+'px');
}
window.addEventListener('resize',()=>{ fit(); if(toastCur) dockToast(); });
/* the board is sized to the space left over, so refit whenever that space changes (orders, info bar, fonts) */
if(window.ResizeObserver) new ResizeObserver(()=>{ fit(); if(toastCur) dockToast(); }).observe($('wrap'));
setInterval(()=>{
  renderHud();
  if(S.genQ&&S.genQ.length&&!genBusy){ genBusy=true; setTimeout(playGenStory,300); } // a waiting generator story plays once the screen is free
  if(chargerTick()){ save(); render(); }
  // charger countdown badges tick in place
  S.cells.forEach((c,i)=>{ if(c.s==='open'&&isCharger(c.it)&&c.it.on){ const el=board.children[i].querySelector('.gen'); if(el) el.textContent='⏳'+fmt(Math.ceil((c.it.end-now())/1000)); const arc=board.children[i].querySelector('.arc'); if(arc){ const C=2*Math.PI*44, p=Math.max(0,(c.it.end-now())/chargerMs(c.it)); arc.setAttribute('stroke-dasharray',`${(p*C).toFixed(1)} ${C.toFixed(1)}`); } board.children[i]._h=null; } });
  // refresh kettle counters + info text once a second
  let any=false, woke=false;
  S.cells.forEach((c,i)=>{
    if(c.s!=='open'||!c.it) return; const d=def(c.it); if(!d.charges) return;
    const o=c.it.ch; refreshCharges(c.it); if(o!==c.it.ch){ any=true; if(o===0) woke=true; return; }
    // advance the cooldown ring in place (no full re-render, so taps aren't interrupted)
    const arc=board.children[i].querySelector('.arc');
    if(arc){ const C=2*Math.PI*44, p=Math.min(1,(now()-c.it.t)/d.rechargeMs); arc.setAttribute('stroke-dasharray',`${(p*C).toFixed(1)} ${C.toFixed(1)}`); board.children[i]._h=null; }
  });
  if(woke){ SND.play('unweb'); }
  if(any){ save(); render(); }
  else if(sel>=0 && S.cells[sel].it && def(S.cells[sel].it).charges) renderInfo();
},1000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden) render(); });

function startIntro(){
  if(!S.seenIntro[S.ch] && !S.complete){
    S.seenIntro[S.ch]=1; save();
    const c=CHAPTERS[S.ch];
    playScene({title:'Chapter '+(S.ch+1), sub:c.title, lines:c.intro});
  }
}

/* ============================================================ the cartridge takes over the front screen */
(function applyEvent(){
  document.title=`${EVENT.title} · Merge Stories`;
  $('evcss').textContent=EVENT.css||'';
  const tc=document.querySelector('meta[name="theme-color"]'); if(tc&&EVENT.themeColor) tc.content=EVENT.themeColor;
  $('coverArt').innerHTML=EVENT.cover.art;
  $('tSub').textContent=EVENT.cover.sub; $('tTitle').textContent=EVENT.title;
  $('tKey').innerHTML=EVENT.cover.key.map(([i,t])=>`<li><span>${i}</span>${t}</li>`).join('');
  $('tMore').innerHTML=EVENT.cover.more.map(t=>`<li>${t}</li>`).join('');
  if(!CHAINS.CP){ $('chips').hidden=true; $('chipsIc').hidden=true; }
  $('ejectBtn').onclick=()=>ejectStory();
  $('title').hidden=false;
})();
S=load();
buildBoard();
fit();
render();
requestAnimationFrame(fit);

/* title screen → first Play tap goes full screen */
$('ver').textContent=`Version ${VERSION} · ${EVENT.title} ${EVENT.version}`;
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent) && !(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
if(isIOS && !navigator.standalone) $('iosHint').hidden=false;
$('playBtn').onclick=()=>{
  if(!fsEl()){ try{ const el=document.documentElement, r=el.requestFullscreen||el.webkitRequestFullscreen; const p=r&&r.call(el,{navigationUI:'hide'}); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
  $('title').hidden=true;
  setTimeout(fit,80);
  startIntro();
};

