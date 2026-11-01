/* The Left Luggage Office: a Merge Stories cartridge.
   A night station where people leave behind the things they no longer want to carry. You missed the last train,
   and somehow you have the job. Balance is built on Pennywhistle Fete's (generator numbers, order sizes, side stall
   with sales orders), plus Vesna's tarot deck: coins buy readings, every card is new, and story orders need cards. */
const EVENT = {
  id: 'left-luggage', title: 'The Left Luggage Office', tagline: 'What You Came to Leave', version: 'v1',
  themeColor: '#16131f',
  cover: { art: `<svg class="cover" viewBox="0 0 360 230" role="img" aria-label="A night station: a big clock, a lit office window, a suitcase, an owl and a tarot card"><defs><linearGradient id="llSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2140"/><stop offset="1" stop-color="#16131f"/></linearGradient><radialGradient id="llLamp" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffd77a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd77a" stop-opacity="0"/></radialGradient></defs><rect width="360" height="230" fill="url(#llSky)"/><g stroke="#3d3358" stroke-width="6" fill="none"><path d="M0 40 Q180 -20 360 40"/><path d="M40 30 V230 M320 30 V230 M110 14 V230 M250 14 V230"/></g><g transform="translate(180 62)"><circle r="30" fill="#efe3c4" stroke="#d9b45a" stroke-width="5"/><path d="M0 0 V-20 M0 0 L13 6" stroke="#2a2140" stroke-width="3" stroke-linecap="round"/><circle r="2.5" fill="#2a2140"/></g><rect x="118" y="112" width="124" height="70" rx="4" fill="#2a2140" stroke="#d9b45a" stroke-width="3"/><rect x="126" y="120" width="108" height="44" fill="#ffd77a" opacity=".85"/><rect x="100" y="96" width="160" height="110" fill="url(#llLamp)"/><text x="180" y="176" font-size="9" text-anchor="middle" fill="#d9b45a" font-family="serif" letter-spacing="1.5">LEFT LUGGAGE</text><path d="M0 200 H360 V230 H0Z" fill="#1f1a2e"/><path d="M0 200 H360" stroke="#d9b45a" stroke-width="2" opacity=".6"/><g transform="translate(58 166)"><rect width="52" height="36" rx="5" fill="#8c3b5a"/><rect x="18" y="-8" width="16" height="10" rx="3" fill="none" stroke="#d9b45a" stroke-width="3"/><path d="M0 14 H52" stroke="#d9b45a" stroke-width="2"/><rect x="40" y="18" width="10" height="7" fill="#efe3c4"/></g><g transform="translate(280 150)"><rect x="-4" y="40" width="40" height="8" fill="#3d3358"/><ellipse cx="16" cy="22" rx="15" ry="19" fill="#8a7458"/><ellipse cx="16" cy="28" rx="9" ry="11" fill="#cbb38d"/><circle cx="10" cy="14" r="6" fill="#f6ecd2"/><circle cx="22" cy="14" r="6" fill="#f6ecd2"/><circle cx="10" cy="14" r="3" fill="#16131f"/><circle cx="22" cy="14" r="3" fill="#16131f"/><path d="M14 19 l2 3 l2 -3z" fill="#d9b45a"/><path d="M3 4 l5 6 M29 4 l-5 6" stroke="#8a7458" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(216 186) rotate(-12)"><rect width="26" height="40" rx="3" fill="#f6ecd2" stroke="#d9b45a" stroke-width="2"/><circle cx="13" cy="17" r="6" fill="none" stroke="#8c3b5a" stroke-width="2"/><path d="M13 8 v2 M13 24 v2 M4 17 h2 M20 17 h2" stroke="#8c3b5a" stroke-width="2"/></g><g fill="#efe3c4" opacity=".7"><circle cx="70" cy="70" r="1.2"/><circle cx="296" cy="84" r="1.4"/><circle cx="240" cy="40" r="1"/><circle cx="96" cy="110" r="1"/></g></svg>`,
    sub: 'What You Came to Leave',
    key: [["🔮", "Find out what everyone here came to leave behind, you included"], ["🧩", "Merge and fill orders to run the night office"], ["☀️", "No timer. Play at your own pace"]],
    more: ["Tap a generator twice to make items; drag two matching items together to merge", "Generators are free to tap; they rest after a while and ⏲️ kitchen timers refill one", "🃏 Vesna’s deck: pay coins for a reading; every card is new and gives a small blessing", "Story orders need cards read, so keep some coins for Vesna", "🧳 Zofia’s kiosk buys anything you can spare, for coins and moons; her story orders need sales", "Tea isn’t for drinking: drop it on a generator and it finds rare items more often", "🔥 The furnace takes what you’re done with and gives you a moon of insight", "📦 Unclaimed parcels are free to tap, then fold flat", "⏱️ Time chargers make the generators around them recharge twice as fast", "Tap 🪙 for the Station Buffet"] },
  terms: {
    passName: 'Insight', tokenNoun: 'moon', tokenIcon: '🌒',
    passHelp: '• Moons 🌒 drop from generators, orders, the furnace and Zofia’s kiosk<br>• Tap twice to claim them any time: 🌒 1 · 🌓 3 · 🌔 7 · 🌕 16 points<br>• Merging first is worth more, but takes board space<br>• Every 3rd reward comes with a postcard from Mr Pell ✉️',
    notesTitle: 'Vesna’s card notes', notesItem: 'A page from Vesna’s card notes is folded inside. Tap it to read. It can’t be merged until you do.',
    lettersTitle: 'Postcards from Mr Pell', letterWord: 'Postcard',
    sheetBlocked: 'That part of the office is still stacked to the ceiling.', sheetTap: 'Still stacked to the ceiling.',
    sideSold: '🧳 Sold at Zofia’s kiosk. Rewards are on the board',
    sideSay: 'For the kiosk, dear. Anything nobody came back for.', sideLucky: 'A lucky find! Something small for the kiosk.',
    doneTitle: 'The office is yours', doneHas: 'You found the morning train. Mr Thursday has stamped it APPROVED.', doneNot: 'Keep merging. Locker Thirteen still has one thing nobody has claimed.',
    presentDesc: 'Something nobody came back for.',
    loreFound: 'Found in Locker Thirteen', loreHeading: 'What Mr Pell Left', loreEmpty: 'Nothing yet. Somewhere in the lockers is everything the last clerk couldn’t carry.',
  },
  complete: { title: 'The Morning Train', text: 'You ran the night office, read all twenty-two cards and found out what you came to leave.',
    note: 'The office stays open. Merge as long as you like. Locker Thirteen has one thing nobody has claimed yet.' },
  /* reward numbers (the engine hands them out). Tables read "value or more → level" */
  rewards: {
    order: { coins:[[30,3],[14,2],[0,1]], xp:[[4,3],[2,2],[0,1]], points:[[3,2],[0,1]] },
    finale: [['C',4],['X',4],['N',3]],
    side: { coins:[[24,3],[8,2],[0,1]], bigPoints:24, timerAt:12, timerChance:.3, lucky:[['C',1],['N',1]] },
    discovery: { coinsPerLevel:1, xpFrom:5 },
    quests: [[['C',1],['E',1]],[['C',2],['E',2]],[['E',3],['H',1]],[['C',3],['H',2],['N',1]],[['E',4],['H',2],['N',2]],[['C',3],['H',3],['N',3]]],
  },
  css: ":root{--bg:#16131f;--panel:#211c30;--panel2:#2b2440;--wood:#3a3350;--wood2:#332d47;--ink:#f3ead6;--muted:#b3a8c4;--gold:#d9b45a;--velvet:#8c3b5a}\n"
     + "body{background-image:radial-gradient(120% 60% at 50% -10%, #2f2448 0%, transparent 60%)}\n"
     + "#title{background-image:radial-gradient(90% 55% at 50% 30%,#3a2d58 0%,transparent 70%)}\n"
     + "#board{box-shadow:0 0 0 3px #1f1a2e,0 0 0 4px #d9b45a88,0 14px 30px #0009}\n"
     + ".cell.sheet{background:repeating-linear-gradient(0deg,#4a3e30 0 9px,#3f3428 9px 11px,#4a3e30 11px 18px)}\n"
     + ".dlg{background:linear-gradient(180deg,#2a2340,#1d1830)}\n.overlay{background:#0b0911cc}\n#scene.clear{background:#0b091133}\n"
     + ".order.side{background:#2a2230}\n#toast .t{background:linear-gradient(180deg,#2e2645,#221c33);border-color:#d9b45a88}\n#title .go{background:linear-gradient(transparent,var(--bg) 30%)}",
  wheel: null,
  /* Vesna's tarot: 22 major arcana, drawn without replacement. Each card is a reading and a small blessing. */
  deck: { title: '🔮 Vesna’s Table', sub: 'Twenty-two cards',
    price: { base: 6, step: 1, max: 30 },
    intro: [
      ['V','Sit. No, the other chair. That one belongs to the owl.'],
      ['V','Twenty-two cards. Each one turns over once, and only for you. I charge by the card, and the price goes up as you get braver.'],
      ['N','You ask what happens if you don’t like a card.'],
      ['V','Then you’ve learned something. That’s extra. I don’t charge for it.'],
      ['N','<em>• Pay coins to draw a card: every card is new<br>• Each one gives a small blessing<br>• Story orders need cards read</em>'],
    ],
    last: [
      ['V','All twenty-two. The whole road, start to end.'],
      ['V','Most people stop at the ones they like. You kept going. I won’t say I’m impressed. Pass the sugar.'],
    ],
    cards: [
      {num:'0', n:'The Fool', e:'🐕', effect:{gift:['H',2]}, story:[['V','The Fool. A man stepping off a cliff, with a dog. Everyone thinks it’s a warning. It’s an invitation.'],['V','Zero. Not nothing: the number before anything happens.']]},
      {num:'I', n:'The Magician', e:'🪄', effect:{focus:12}, story:[['V','The Magician. Everything you need is already on the table. You keep looking under it.'],['M','<em>(Mr Thursday looks under the table. Nothing. He seems relieved.)</em>']]},
      {num:'II', n:'The High Priestess', e:'🌙', effect:{unweb:3}, story:[['V','The High Priestess. She knows something you don’t, and she’s not telling.'],['V','Don’t look at me like that. I’m not her. I’m much chattier.']]},
      {num:'III', n:'The Empress', e:'🌾', effect:{gift:['E',3]}, story:[['V','The Empress. Things grow when you stop checking on them every five minutes.'],['V','Have some tea. Sit still. Let something grow.']]},
      {num:'IV', n:'The Emperor', e:'👑', effect:{gift:['ET',1]}, story:[['V','The Emperor. Rules, order, a very comfortable chair.'],['V','Mr Holub would love him. They’d form a committee.']]},
      {num:'V', n:'The Hierophant', e:'🔑', effect:{gift:['C',3]}, story:[['V','The Hierophant. The way things have always been done.'],['V','Notice he holds a key. Even tradition knows it might need to leave.']]},
      {num:'VI', n:'The Lovers', e:'💞', effect:{gift:['N',2]}, story:[['V','The Lovers. People think it’s romance. Mostly it’s a choice. You can’t walk two roads.'],['V','Well. You can. Very slowly. Badly.']]},
      {num:'VII', n:'The Chariot', e:'🐎', effect:{refill:true}, story:[['V','The Chariot. Two horses pulling different ways, and someone holding the reins anyway.'],['V','You don’t need them to agree. You just need to decide where you’re going.']]},
      {num:'VIII', n:'Strength', e:'🦁', effect:{gift:['V',2]}, story:[['V','Strength. A woman closing a lion’s mouth with her bare hands. Gently.'],['V','The gently is the hard part.']]},
      {num:'IX', n:'The Hermit', e:'🏮', effect:{focus:12}, story:[['V','The Hermit. An old man alone with a lantern, lighting one step at a time.'],['N','You point out that this is, roughly, the night shift.'],['V','Exactly. You’re a natural.']]},
      {num:'X', n:'Wheel of Fortune', e:'🎡', effect:{refill:true}, story:[['V','The Wheel. What goes up comes round again.'],['V','People hate this card when they’re on top and love it when they’re not. It doesn’t care either way.']]},
      {num:'XI', n:'Justice', e:'⚖️', effect:{gift:['C',3]}, story:[['V','Justice. Every account balances in the end.'],['M','<em>(Mr Thursday stamps the table. Then the card. Then, after some thought, your hand.)</em>']]},
      {num:'XII', n:'The Hanged Man', e:'🙃', effect:{unweb:3}, story:[['V','The Hanged Man. Upside down, perfectly calm.'],['V','Sometimes the only way to see a thing properly is to stop trying to stand on it.']]},
      {num:'XIII', n:'Death', e:'🥀', effect:{unweb:4}, story:[['N','You go a bit pale.'],['V','Oh, relax. Nobody dies. Something ends so something else has room. It’s housekeeping, not a funeral.']]},
      {num:'XIV', n:'Temperance', e:'🏺', effect:{gift:['H',1]}, story:[['V','Temperance. Pouring water between two cups, not spilling a drop.'],['V','Patience, but the active kind. Not waiting. Mixing.']]},
      {num:'XV', n:'The Devil', e:'😈', effect:{gift:['C',4]}, story:[['V','The Devil. Two people chained to a rock. Look closer: the chains are loose. They could just step out.'],['V','He pays well, though. I’ll give him that.']]},
      {num:'XVI', n:'The Tower', e:'⚡', effect:{unweb:5}, story:[['V','The Tower. Lightning, a crown falling off, people leaping out of windows.'],['V','Everyone screams at this one. It’s only the bits that were built wrong falling down. The ground’s still there.']]},
      {num:'XVII', n:'The Star', e:'🌟', effect:{gift:['N',3]}, story:[['V','The Star. After the Tower, this. A woman pouring water under a sky full of stars.'],['V','Hope, but quiet. The kind that doesn’t need to tell anyone.']]},
      {num:'XVIII', n:'The Moon', e:'🐺', effect:{focus:20}, story:[['V','The Moon. Two dogs howling, a path into the dark, nothing quite what it seems.'],['V','You don’t have to see the whole path. You have to see the next stone.']]},
      {num:'XIX', n:'The Sun', e:'🌻', effect:{refill:true}, story:[['V','The Sun. A child on a horse, everything bright.'],['V','Don’t be suspicious of it. Some days are simply good.']]},
      {num:'XX', n:'Judgement', e:'📯', effect:{gift:['N',3]}, story:[['V','Judgement. A trumpet, and everyone sitting up in their graves to answer it.'],['V','Not the judgement of others. Your own. The call to become what you were going to be anyway.']]},
      {num:'XXI', n:'The World', e:'🌍', effect:{gift:['H',2]}, story:[['V','The World. A dancer in a wreath. Something finished, and finished well.'],['V','And look: the ribbon has no end. Finished things are always also beginnings. Terribly inconvenient.']]},
    ] },
  /* a slow minor-key waltz: accordion pad, oom-pah-pah, a music box, then a clarinet takes the tune */
  music: { bpm: 92, beats: 96,
    mix: { lp: 2400, send: .5, rev: .5, fb: .26, dlp: 1300, wet: .16, wetToRev: true },
    pad: { wave: 'triangle', det: 10, g: .012, a: .6, lp: [600, 950, 650] },
    compose({voice, puff, pad, mallet, BEAT, rnd}) {
      const CH={Dm:[38,[57,62,65]], Gm:[43,[58,62,67]], A7:[45,[55,61,64]], Bb:[46,[58,62,65]], F:[41,[57,60,65]], C:[36,[55,60,64]]};
      const SONG=['Dm','Dm','Gm','A7', 'Dm','Bb','Gm','A7', 'F','C','Dm','Bb', 'Gm','A7','Dm','Dm'];
      const MEL=[
        [[0,74,1],[1,77,1],[2,81,1]], [[0,82,1.5],[1.5,81,.5],[2,77,1]], [[0,79,1],[1,82,1],[2,79,1]], [[0,76,2],[2,73,1]],
        [[0,74,1],[1,77,.5],[1.5,76,.5],[2,74,1]], [[0,77,1],[1,74,1],[2,70,1]], [[0,79,1.5],[1.5,77,.5],[2,76,1]], [[0,73,1],[1,76,1],[2,79,1]],
        [[0,81,1],[1,77,1],[2,72,1]], [[0,79,1.5],[1.5,77,.5],[2,76,1]], [[0,77,1],[1,74,1],[2,81,1]], [[0,82,2],[2,81,1]],
        [[0,79,1],[1,82,1],[2,86,1]], [[0,85,1.5],[1.5,82,.5],[2,79,1]], [[0,77,1],[1,76,1],[2,73,1]], [[0,74,3]],
      ];
      const bass=(m,t,dur,g=.15)=>{ voice({m,t,dur,g,a:.012,wave:'sine',det:0,lp:380,lpEnd:240}); voice({m:m+12,t,dur:dur*.5,g:g*.2,a:.01,wave:'triangle',det:3,lp:620}); };
      const pluck=(m,t,g=.014)=>voice({m,t,dur:.26,g,a:.008,wave:'triangle',det:6,lp:1800,lpEnd:650});
      const clar=(m,t,len)=>voice({m,t,dur:len*BEAT*.95,g:.04,a:.06,wave:'triangle',det:3,lp:1500,lpEnd:1100});
      const brush=(t,g)=>puff({t,dur:.09,g,f:2200,to:1400});
      for(let bar=0;bar<32;bar++){
        const half=Math.floor(bar/16), b16=bar%16, t0=bar*3*BEAT+.02, [root,chord]=CH[SONG[b16]];
        pad(chord,t0,BEAT*3.1);
        bass(root,t0,BEAT*.9);
        chord.forEach(m=>{ pluck(m,t0+BEAT); pluck(m,t0+2*BEAT,.011); });
        for(let b=0;b<3;b++) brush(t0+b*BEAT, b?.004:.007);
        MEL[b16].forEach(([bt,m,len])=>{ const t=t0+bt*BEAT;
          if(!half) mallet(m,t,.065,Math.min(1.5,len*BEAT+.4));
          else { clar(m-12,t,len); mallet(m,t,.025,len*BEAT*.7); } });
        if(b16%4===3) [86,89,93].forEach((m,j)=>mallet(m,t0+(2+j*.2)*BEAT,.014,.7));
      }
    } },
};

const CONFIG = {
  chargerScale: 1/6,     // a 2h Merge Mansion charger runs 20 min here
  cols: 7, rows: 9,
  saveKey: 'merge-stories:left-luggage',
};

const CHAINS = {
  P:{name:'Paperwork', items:[
    {e:'📄',n:'Blank Form'},{e:'🧾',n:'Receipt'},{e:'📋',n:'Clipboard'},{e:'📑',n:'Dossier'},
    {e:'🗂️',n:'Card Index'},{e:'🗄️',n:'Filing Cabinet'},{e:'🏛️',n:'The Ministry Archive'}]},
  F:{name:'Left Behind', items:[
    {e:'🧤',n:'Odd Glove'},{e:'☂️',n:'Umbrella'},{e:'🎩',n:'Top Hat'},{e:'🧥',n:'Overcoat'},
    {e:'💼',n:'Briefcase'},{e:'🧳',n:'Suitcase'},{e:'🛄',n:'Steamer Trunk'}]},
  T:{name:'Timetables', items:[
    {e:'🎟️',n:'Platform Ticket'},{e:'📰',n:'Evening Paper'},{e:'🔔',n:'Platform Bell'},{e:'🔦',n:'Guard’s Lantern'},
    {e:'🚦',n:'Signal'},{e:'🚂',n:'Steam Engine'},{e:'🚄',n:'Night Express'}]},
  L:{name:'The Occult Shelf', items:[
    {e:'🕯️',n:'Candle'},{e:'🪶',n:'Quill'},{e:'🧿',n:'Evil Eye'},{e:'📿',n:'Prayer Beads'},
    {e:'🔭',n:'Brass Telescope'},{e:'📜',n:'Star Chart'}]},
  E:{name:'Strong Tea', type:'boost', items:[
    {e:'🍵',n:'Glass of Tea'},{e:'☕',n:'Black Coffee'},{e:'🍯',n:'Honey Cake'},{e:'🥮',n:'Mooncake'},{e:'🎂',n:'Name-Day Cake'}]},
  C:{name:'Coins', type:'res', claim:'coins', items:[
    {e:'🪙',n:'Kopek',v:1},{e:'💶',n:'Banknote',v:5},{e:'👛',n:'Coin Purse',v:12},{e:'💰',n:'Money Bag',v:30},{e:'💎',n:'Unclaimed Fortune',v:75}]},
  X:{name:'Approval', type:'res', claim:'xp', items:[
    {e:'👍',n:'Nod',v:1},{e:'🙌',n:'Cheer',v:3},{e:'🎉',n:'Hooray',v:8},{e:'🎊',n:'Celebration',v:20},{e:'🏆',n:'Commendation',v:50}]},
  N:{name:'Insight', type:'res', claim:'points', items:[
    {e:'🌒',n:'Crescent',v:1},{e:'🌓',n:'Half Moon',v:3},{e:'🌔',n:'Gibbous Moon',v:7},{e:'🌕',n:'Full Moon',v:16}]},
  H:{name:'Time Skips', type:'res', claim:'skip', items:[{e:'⏳',n:'Hourglass',v:15},{e:'⌛',n:'Sand Timer',v:60},{e:'🗓️',n:'Calendar Page',v:240}]},
  /* rare chains: each generator's occasional bonus drop */
  K:{name:'Keepsakes', rare:true, items:[{e:'💍',n:'Wedding Ring'},{e:'🩰',n:'Dancing Shoes'},{e:'📸',n:'Old Camera'},{e:'🎓',n:'Mortarboard'}]},
  B:{name:'Lucky Charms', rare:true, items:[{e:'🍀',n:'Four-Leaf Clover'},{e:'🎲',n:'Lucky Dice'},{e:'🐘',n:'Brass Elephant'},{e:'⚓',n:'Sailor’s Anchor'}]},
  W:{name:'Maps', rare:true, items:[{e:'🧭',n:'Compass'},{e:'🗺️',n:'Railway Map'},{e:'🌐',n:'Globe'},{e:'🛰️',n:'Star Finder'}]},
  R:{name:'Station Buffet', rare:true, items:[{e:'🥐',n:'Croissant'},{e:'🥨',n:'Pretzel'},{e:'🍰',n:'Sachertorte'},{e:'🍫',n:'Box of Chocolates'}]},
  /* the story chain: everything the last clerk couldn't carry */
  M:{name:'What Mr Pell Left', story:true, items:[
    {e:'🏷️',n:'Claim Tag', lore:'No. 0001. Item: one overcoat, still warm. “Left because:” and then nothing. The reason is blank.'},
    {e:'📛',n:'Name Badge', lore:'ANSELM PELL, SENIOR ACTUARY. Thirty-one years of calculating the odds that something might go wrong.'},
    {e:'📝',n:'Resignation Letter', lore:'Dated 1994. And 1995. And every year since, all beautifully punctuated. Not one of them sent.'},
    {e:'🎻',n:'Violin Case', lore:'A violin bought at nineteen and never learned. The strings are still in their paper.'},
    {e:'🌊',n:'Drawing of the Sea', lore:'A child’s drawing of the sea, signed “Anselm, age 7”. On the back, in grown-up pencil: “One day.”'},
    {e:'🎫',n:'Ticket Stub', lore:'One way, no return. Punched last Tuesday at 23:58. He went.'},
    {e:'💌',n:'Note for the Next Clerk', lore:'“If you’re reading this, you missed a train too. Good. Some trains are worth missing. Be kind to the owl. — A.P.”'},
    {e:'🌅',n:'The Morning Train', lore:'A ticket for the 6:04. The destination line is empty. It’s in your name, and the ink is still wet.'}]},
  /* kitchen timers: drag onto a generator to refill it straight away */
  ET:{name:'Kitchen Timers', items:[{e:'⏲️',n:'Kitchen Timer'}]},
  /* unclaimed parcels (Merge Mansion chests): free taps, then gone. Two unopened ones merge into a bigger one. */
  Q:{name:'Unclaimed Parcels', gen:true, items:[
    {e:'📦',n:'Unclaimed Parcel', free:true, uses:6, drop:[['C',1,30],['E',1,12],['X',1,20],['P',1,10],['F',1,10],['N',1,8],['V',1,6]]},
    {e:'📫',n:'Mail Sack', free:true, uses:14, drop:[['C',1,22],['C',2,12],['E',1,12],['E',2,4],['X',1,14],['N',1,5],['V',1,8],['H',1,8],['X',2,2]]}]},
  /* time chargers: the station clock throws off shards that merge up into chargers */
  V:{name:'Time Chargers', items:[
    {e:'🕐',n:'Charger Shard'},{e:'🕒',n:'Shard Pair'},{e:'🕕',n:'Shard Cluster'},{e:'🕘',n:'Charger Core'},
    {e:'⏱️',n:'Small Time Charger',hours:2},{e:'⏰',n:'Medium Time Charger',hours:4},{e:'⌚',n:'Big Time Charger',hours:8},{e:'🌀',n:'Huge Time Charger',hours:16}]},
  gC:{name:'Station Clock', gen:true, main:'V', items:[
    {e:'🕰️',n:'Station Clock', charges:8, rechargeMs:240000, drop:[['V',1,85],['V',2,15]]},
    {e:'🗼',n:'Clock Tower', charges:10, rechargeMs:200000, drop:[['V',1,60],['V',2,30],['V',3,10]]}]},
  /* the furnace: give it something you're done with and it gives you a little insight */
  Z:{name:'The Furnace', gen:true, items:[{e:'🔥',n:'The Furnace', want:true, wants:[['F',1],['F',2],['P',1],['P',2],['T',1],['T',2]], gives:'N', count:1}]},
  /* Vesna's table: the tarot deck (EVENT.deck) */
  TR:{name:'Vesna’s Deck', gen:true, deck:true, items:[{e:'🃏',n:'Vesna’s Deck'}]},
  /* generators */
  gD:{name:'In-Tray', gen:true, main:'P', rare:'K', items:[
    {e:'📥',n:'In-Tray', charges:24, rechargeMs:60000, drop:[['P',1,75],['P',2,10],['K',1,8],['E',1,2],['C',1,7],['X',1,2],['N',1,5]]},
    {e:'🖨️',n:'Copying Machine', charges:20, rechargeMs:75000, drop:[['P',1,44],['P',2,28],['P',3,10],['K',1,9],['K',2,3],['E',1,2],['C',1,6],['X',1,2],['N',1,5]]},
    {e:'🏢',n:'Registry Office', charges:16, rechargeMs:90000, drop:[['P',1,22],['P',2,30],['P',3,22],['P',4,6],['K',1,8],['K',2,5],['E',1,2],['C',1,6],['X',1,3],['N',1,6]]}]},
  gS:{name:'Luggage Trolley', gen:true, main:'F', rare:'B', items:[
    {e:'🛒',n:'Luggage Trolley', charges:24, rechargeMs:60000, drop:[['F',1,75],['F',2,10],['B',1,8],['E',1,2],['C',1,7],['X',1,2],['N',1,5]]},
    {e:'🚃',n:'Luggage Van', charges:20, rechargeMs:75000, drop:[['F',1,44],['F',2,28],['F',3,10],['B',1,9],['B',2,3],['E',1,2],['C',1,6],['X',1,2],['N',1,5]]},
    {e:'🏨',n:'Station Hotel', charges:16, rechargeMs:90000, drop:[['F',1,22],['F',2,30],['F',3,22],['F',4,6],['B',1,8],['B',2,5],['E',1,2],['C',1,6],['X',1,3],['N',1,6]]}]},
  gT:{name:'Signal Box', gen:true, main:'T', rare:'W', items:[
    {e:'📻',n:'Station Radio', charges:24, rechargeMs:60000, drop:[['T',1,75],['T',2,10],['W',1,8],['E',1,2],['C',1,7],['X',1,2],['N',1,5]]},
    {e:'📡',n:'Telegraph', charges:20, rechargeMs:75000, drop:[['T',1,44],['T',2,28],['T',3,10],['W',1,9],['W',2,3],['E',1,2],['C',1,6],['X',1,2],['N',1,5]]},
    {e:'🚉',n:'Signal Box', charges:16, rechargeMs:90000, drop:[['T',1,22],['T',2,30],['T',3,22],['T',4,6],['W',1,8],['W',2,5],['E',1,2],['C',1,6],['X',1,3],['N',1,6]]}]},
  gL:{name:'Curiosity Cart', gen:true, main:'L', rare:'R', items:[
    {e:'🛍️',n:'Curiosity Cart', charges:24, rechargeMs:60000, drop:[['L',1,75],['L',2,10],['R',1,8],['E',1,2],['C',1,7],['X',1,2],['N',1,5]]},
    {e:'⛺',n:'Fortune Tent', charges:20, rechargeMs:75000, drop:[['L',1,44],['L',2,28],['L',3,10],['R',1,9],['R',2,3],['E',1,2],['C',1,6],['X',1,2],['N',1,5]]},
    {e:'🎪',n:'Night Circus', charges:16, rechargeMs:90000, drop:[['L',1,22],['L',2,30],['L',3,22],['L',4,6],['R',1,8],['R',2,5],['E',1,2],['C',1,6],['X',1,3],['N',1,6]]}]},
  gM:{name:'Locker Wall', gen:true, main:'M', rare:'X', items:[
    {e:'🔐',n:'Locker Thirteen', charges:24, rechargeMs:60000, drop:[['M',1,80],['M',2,8],['X',1,7],['C',1,5],['N',1,5]]},
    {e:'🚪',n:'Locker Room', charges:20, rechargeMs:75000, drop:[['M',1,50],['M',2,26],['M',3,10],['X',1,8],['X',2,3],['C',1,3],['N',1,5]]},
    {e:'🏤',n:'Lost Property Hall', charges:16, rechargeMs:90000, drop:[['M',1,26],['M',2,30],['M',3,20],['M',4,6],['X',1,8],['X',2,4],['C',1,2],['N',1,6]]}]},
  gK:{name:'Samovar', gen:true, main:'E', items:[
    {e:'🫖',n:'Samovar', free:true, charges:3, rechargeMs:480000, drop:[['E',1,70],['E',2,25],['E',3,5]]}]},
};

/* board: 9 rows × 7. Bottom three rows open at the start; each chapter clears more of the stacked luggage */
const LAYOUT = [
  'bM4 bF5 bC3 bP5 bgT1 bL4 bM3',   // zone 3: opens chapter 4
  'bP3 wM2 bT4 bgM1 bF2 wL2 bX2',
  'bM2 bL3 bgD1 bF4 bT3 bgL1 bP4',  // zone 2: opens chapter 3
  'wM1 bQ1 bT1 bP2 wL1 bF3 bM1',
  'bF3 bP2 bL1 bgS1 bT2 bQ1 bF1',   // zone 1: opens chapter 2
  'wT1 bL2 bP1 wE2 bF2 wT2 bP3',
  'bP1 bgT1 wP1 bF2 wF1 bQ1 bT1',   // zone 0: the front counter
  'wF2 oP1 o. o. o. oF1 wP2',
  'oE1 ogD1 o. o. o. ogS1 oE1',
];

const CAST = {
  N:{name:'', av:''},
  V:{name:'Vesna', av:'🔮'},
  H:{name:'Mr Holub', av:'📨'},
  M:{name:'Mr Thursday', av:'🦉'},
  Z:{name:'Zofia', av:'🧓'},
  O:{name:'The Ledger', av:'📒'},
  F:{name:'A postcard', av:'✉️'},
  S:{name:'Zofia’s Kiosk', av:'🧳'},
};

const CHAPTERS = [
  { title:'The Night Clerk', zone:0, gifts:[],
    intro:[
      ['N','Grauberg Central, 23:58. You run the length of platform two and watch the last train’s red lamp shrink into the dark.'],
      ['N','The station is empty except for one lit window: LEFT LUGGAGE. On the counter, a memo, already stamped.'],
      ['H','“POSITION VACANT: Night Clerk. Apply within. You have applied. Your shift has begun. — H.”'],
      ['N','A grey overcoat hangs on the hook behind the counter. It is still warm. On top of the coat stand, an owl opens one eye.'],
      ['V','You missed the train. <em>(A woman in a fur hat sets a glass of tea in front of you.)</em> Everyone who works here missed a train. Vesna. I read cards in the buffet. Drink that.'],
      ['N','<em>• Tap the 📥 in-tray or 🛒 trolley twice to make things<br>• Drag matching items together to merge<br>• Fill orders to run the office</em>'],
    ],
    outro:[
      ['N','In the overcoat’s inside pocket: a claim ticket. Left Luggage, No. 0002.'],
      ['N','It has your name on it. Your full name, the one nobody uses. It is dated tomorrow.'],
      ['V','<em>(Vesna looks at it for a long moment.)</em> Well. Somebody’s expecting you.'],
      ['N','You ask who. She’s already gone back to the buffet.'],
    ]},
  { title:'Unclaimed', zone:1, gifts:[['gL',1],['gK',1]],
    intro:[
      ['N','Behind the counter, the shelves go back further than the building should allow. Every parcel has a tag.'],
      ['N','The tags don’t say what was left. They say why. “Left because: I was tired of being careful.” “Left because: it was never my size.”'],
      ['H','“MEMO: The Night Clerk will kindly provide proof of existence (Form 7B). Form 7B is issued on presentation of Form 7A. Form 7A is issued to existing persons only. — H.”'],
      ['V','Welcome to Grauberg. <em>(A 🛍️ curiosity cart and a 🫖 samovar are in your gifts. Tea from the samovar isn’t for drinking: drop it on a generator.)</em>'],
    ],
    outro:[
      ['N','At the back of the shelves: the Ledger. A book as tall as you are, every page ruled in green.'],
      ['N','The newest entry is in fresh ink. “Pell, A. Left: himself (partial). Collected: pending.”'],
      ['V','Anselm. Thirty-one years he came here, every night, to check one coat. He never once took it home.'],
      ['N','You ask where he went. Vesna turns over a card she didn’t draw. It’s blank on both sides.'],
      ['V','That’s not an answer. That’s a deck in need of a good shuffle.'],
    ]},
  { title:'The Ledger', zone:2, gifts:[['gM',1],['Z',1]],
    intro:[
      ['N','The Ledger rewrites itself while you’re not looking. Entries appear for things nobody has left yet.'],
      ['N','Halfway down tonight’s page, in your own handwriting: your name. “Left: ———.” The line is smudged, as if someone keeps changing their mind.'],
      ['H','“MEMO: The Night Clerk is reminded that the Ledger may not be read by persons listed in the Ledger. — H.”'],
      ['V','Ignore him. Here: the old furnace from the boiler room. <em>(🔥 The Furnace is in your gifts. Feed it what you’re done with; it gives you insight.)</em>'],
    ],
    outro:[
      ['N','Three in the morning. You hear stamping from the back office: thunk, thunk, thunk.'],
      ['N','Mr Thursday is standing on the desk with the rubber stamp clamped in his beak, approving a stack of memos one by one.'],
      ['M','<em>(He sees you. He stops. He stamps one more, very deliberately, and looks you in the eye.)</em>'],
      ['V','Ah. You’ve met the Deputy Under-Registrar.'],
      ['N','The Deputy Under-Registrar is an owl. This explains a great deal about the forms.'],
      ['V','He means well. He just thinks everyone should have to prove they exist. He had to, once.'],
    ]},
  { title:'Locker Thirteen', zone:3, gifts:[['E',2]],
    intro:[
      ['N','The last of the stacked luggage comes down, and behind it: a wall of lockers. Number thirteen has no lock.'],
      ['V','Anselm’s. He kept things in there he couldn’t throw away and couldn’t bear to use.'],
      ['N','A postcard arrives on the night mail, addressed to “The Night Clerk”. The handwriting is very neat.'],
      ['V','<em>(She reads it over your shoulder, and smiles despite herself.)</em> Geraniums. Of course it was geraniums.'],
    ],
    outro:[
      ['N','Locker Thirteen is empty now, except for one line scratched inside the door. “Everyone stays until they’re ready to leave what they came to leave.”'],
      ['V','I was the night clerk before Anselm. Eleven years. I came here to leave a marriage, and I stayed until I could.'],
      ['N','You ask why she didn’t get on a train.'],
      ['V','I did. The 6:04. I got off two stops later and came back to open the buffet. Leaving isn’t always going far, dear. Sometimes it’s just going differently.'],
      ['N','You realise you’ve been sitting on the same suitcase all night. Yours. You haven’t opened it since you arrived.'],
    ]},
  { title:'The Night Train', zone:null, gifts:[['E',3],['gC',1]],
    intro:[
      ['N','At four in the morning, a train comes in that isn’t on any timetable. Black carriages, every window lit.'],
      ['V','The night train. It only stops when someone in the station is ready.'],
      ['Z','Don’t look at me. I’m not ready. I’ve got stock. <em>(Zofia is already putting her coat on.)</em>'],
      ['N','<em>(A 🕰️ station clock is in your gifts. It makes time charger shards: merge them up, switch one on, and nearby generators recharge twice as fast.)</em>'],
    ],
    outro:[
      ['N','Zofia stands on the step of the night train with one small bag. Thirty-one years of stock, gone. Not one thing in the bag is from the kiosk.'],
      ['Z','Ready isn’t a feeling, dear. It’s a thing you do while you’re still frightened.'],
      ['Z','Mind the owl. Water the kiosk geranium. Don’t wait as long as I did.'],
      ['N','The doors close. The train pulls out without a sound, and the station is very quiet.'],
      ['M','<em>(Mr Thursday flies to the empty kiosk, stamps the counter APPROVED, and stays there a while.)</em>'],
    ]},
  { title:'The Claim', zone:null, gifts:[['E',3]],
    intro:[
      ['N','Five in the morning. Grey light at the end of the platforms. Your claim ticket says No. 0002, and you know now what it’s for.'],
      ['V','Open it, then. Your suitcase. You’ve been sitting on it all night like it might hatch.'],
      ['N','Inside: a work lanyard with your photo, a list titled “When Things Calm Down”, and a name you answered to for years because it was easier.'],
      ['V','That’s what you came to leave. Not much, is it, once it’s out on the counter.'],
    ],
    outro:[
      ['N','You fill in a tag for your own suitcase. “Left because:” You think for a long time. Then you write: “I don’t need to carry this any more.”'],
      ['N','The Ledger turns a page on its own. Your line is no longer smudged. “Left: the old life (complete). Collected: the rest.”'],
      ['V','And the last card. <em>(She turns it over: a fool stepping off a cliff, with a dog.)</em> Zero. The beginning. You’ll want comfortable shoes.'],
      ['N','The claim ticket in your hand has changed. It’s a ticket for the 6:04, one way. The destination line is blank.'],
      ['M','<em>(Mr Thursday lands on the counter, stamps the ticket APPROVED, and then, after a pause, stamps your hand as well.)</em>'],
      ['V','Write anything. Or don’t. You can stay and run the office until you know. Nobody here will hurry you.'],
      ['N','The office is yours, for as long as you want it. Merge as long as you like. Locker Thirteen still holds one thing nobody has claimed.'],
    ]},
];

/* orders. Built on Pennywhistle Fete's order sizes; Zofia (ids 200+) needs kiosk sales; cards:n needs Vesna's readings */
const TASKS = [
  // ch1 — the front counter
  {ch:0, who:'V', need:[['F',2]], coins:8, say:'An umbrella came in with the rain and nobody’s come back for it. Bring it here before Mr Thursday nests in it.', beat:['V','The tag says “Left because: it never rained when I had it.” People are funny.']},
  {ch:0, who:'M', need:[['P',2]], coins:8, say:'(Mr Thursday drops a blank form on the counter and stares at you until you produce a receipt.)', beat:['M','<em>(He stamps the receipt. He seems, briefly, at peace.)</em>']},
  {id:200, side0:1, ch:0, who:'Z', need:[['P',2],['F',1]], coins:8, say:'You’re the new one? Zofia, the kiosk on platform zero. Bring me a receipt and an odd glove. I sell what nobody claims.', beat:['Z','Platform zero. No, it’s not on the map. It is if you’re standing on it.'], more:[['Z','Regulation eleven: anything unclaimed after thirty days goes to the kiosk. Or sooner, if I like the look of it.'],['V','She always likes the look of it.'],['Z','Bring me anything you can spare, any time. Fair prices. Coins and a little insight, for those who need it.'],['N','<em>(Zofia’s Kiosk is open. Its orders never run out: sell anything you can spare for coins and moons.)</em>']]},
  {ch:0, who:'H', need:[['P',3]], coins:10, say:'“MEMO: The Night Clerk will submit a clipboard, in triplicate, to confirm receipt of this memo. — H.”', beat:['H','“MEMO: Clipboard received. One copy will do. — H.”']},
  {ch:0, who:'V', need:[['T',1],['F',2]], gifts:[['TR',1]], coins:8, say:'A platform ticket and an umbrella, and I’ll lend you my deck. You look like someone who needs a reading.', beat:['V','There. Twenty-two cards. The owl sits on the left.'], more:[['V','I don’t tell fortunes, before you ask. Fortunes are for people who want to be told. Cards are for people who want to look.']]},
  {ch:0, who:'V', cards:1, need:[['T',2],['F',3]], coins:12, say:'Read your first card, then bring me the evening paper and a top hat. I’m doing a man’s horoscope by his hat. It’s more reliable.', beat:['V','One card. Most people stop there. You won’t.']},
  // ch2 — unclaimed
  {ch:1, who:'V', need:[['L',2]], coins:12, say:'A quill from the curiosity cart, please. I write the readings down. Nobody remembers them properly otherwise.', beat:['V','Thank you. Now I can be wrong in writing.']},
  {ch:1, who:'H', need:[['P',4]], coins:14, say:'“MEMO: The Night Clerk will submit a dossier proving the Night Clerk is the Night Clerk. — H.”', beat:['H','“MEMO: Dossier received. Inconclusive. Please continue to exist pending review. — H.”']},
  {ch:1, who:'M', need:[['F',4]], coins:12, say:'(Mr Thursday wants an overcoat to sleep in. Not that one. That one is Mr Pell’s. Another one.)', beat:['M','<em>(He climbs into the overcoat’s hood and is asleep at once.)</em>']},
  {id:201, ch:1, who:'Z', sales:3, need:[['F',3]], coins:12, say:'Three sales at the kiosk, dear, and a top hat for the window. I’ve been about to leave this station since 1991. I just need to sell down the stock first.', beat:['Z','Three sold. The hat’s going nowhere. Neither am I, apparently.'], more:[['V','She says that every year.'],['Z','And every year I mean it. Mostly.']]},
  {ch:1, who:'V', cards:3, need:[['T',3],['L',1]], coins:14, say:'Three cards read, a platform bell and a candle. Some readings need a bell. Don’t ask me why, ask the bell.', beat:['V','Three cards. A pattern’s starting. You’re trying very hard not to notice it.']},
  {ch:1, who:'H', need:[['P',4],['K',2]], coins:16, say:'“MEMO: An unclaimed pair of dancing shoes requires an accompanying dossier. Shoes may not be danced in pending the dossier. — H.”', beat:['N','The tag on the shoes says “Left because: I only ever danced in the kitchen.” Someone has added, in pencil: “Good.”']},
  {x:1, ch:1, who:'M', need:[['F',4],['L',3]], coins:14, say:'(Mr Thursday has dragged another overcoat to the counter and is pointing at a candle.)', beat:['M','<em>(He sits by the candle, inside the overcoat, looking extremely official.)</em>']},
  // ch3 — the ledger
  {ch:2, who:'V', need:[['M',2]], coins:16, say:'There’s a name badge in Locker Thirteen. Bring it. I want to see if it still says what it said.', beat:['V','“Senior Actuary.” He calculated how likely things were to go wrong. For thirty-one years. Then he came here at night to sit with a coat.'], more:[['V','People think a man like that is boring. He was terrified. That’s different.']]},
  {ch:2, who:'M', need:[['L',4],['W',2]], coins:18, say:'(Mr Thursday wants prayer beads and a railway map. He is planning something.)', beat:['M','<em>(He arranges the beads on the map in a circle around one small town. Then he stamps it.)</em>']},
  {ch:2, who:'H', need:[['F',5]], coins:18, say:'“MEMO: All briefcases are to be checked for briefs. — H.”', beat:['N','Inside the briefcase: one sandwich, untouched since 1987, and a note that says “Called in sick. Went to the sea.”']},
  {id:202, ch:2, who:'Z', sales:4, need:[['B',2]], coins:18, say:'Four more sales, dear, and a pair of lucky dice. I keep my old ticket framed behind the till, did you know? 1991. Grauberg to the coast.', beat:['Z','Four sold. I polished the frame. Doesn’t mean anything.'], more:[['V','It’s the most polished thing in Grauberg.']]},
  {ch:2, who:'V', cards:6, need:[['M',3]], coins:20, say:'Six cards read, and his resignation letter. Any year will do. He wrote one every year.', beat:['V','1994. “Dear Sirs, I have decided to become a different man.” He crossed out “different” and wrote “braver”. Then he didn’t send it.'], more:[['V','He sent it to me instead. Every year. I have thirty-one. I’ve never told him I read them.']]},
  {ch:2, who:'H', need:[['P',5]], coins:18, say:'“MEMO: The Ledger is now considered evidence. Evidence must be filed. Please submit a card index. — H.”', beat:['H','“MEMO: Filed under L for Ledger, E for Evidence and W for Why. — H.”']},
  {x:1, ch:2, who:'V', need:[['P',5],['B',2]], coins:20, say:'A card index for my readings and some lucky dice. Not for luck. For the look of the thing.', beat:['V','There. Now it looks like I know what I’m doing. Which I do. Mostly.']},
  // ch4 — locker thirteen
  {ch:3, who:'V', need:[['M',4]], coins:22, say:'Bring me his violin case. Not the violin. Just the case. I want to see if he ever opened it.', beat:['V','The strings are still in their paper. Forty-four years. You can wait that long for something and still not be ready. Or you can not wait.']},
  {ch:3, who:'M', need:[['T',5],['W',3]], coins:22, say:'(Mr Thursday has brought you a signal and a globe and is spinning the globe with one foot.)', beat:['M','<em>(It stops on the sea. He hoots, once, with great satisfaction.)</em>']},
  {ch:3, who:'H', need:[['F',5],['P',6]], coins:22, say:'“MEMO: All unclaimed briefcases are to be filed in a filing cabinet, alphabetically, by regret. — H.”', beat:['H','“MEMO: Filed. The R drawer is very full. — H.”']},
  {id:203, ch:3, who:'Z', sales:5, need:[['L',3]], coins:22, say:'Five more sales, and the evil eye charm. My sister left on the night train in 1991. She wrote: “Come when you’re ready.” I never felt ready.', beat:['Z','Five sold. I haven’t told anyone that about my sister in thirty years.'], more:[['V','You’ve told me every Thursday for thirty years, Zofia.'],['Z','Well. I haven’t told anyone who listened.']]},
  {ch:3, who:'V', cards:10, need:[['M',5]], coins:26, say:'Ten cards read, and his drawing of the sea. He drew it when he was seven. He kept it for fifty-six years.', beat:['V','“One day.” On the back. He wrote that when he was forty, I think. The handwriting’s tired.'], more:[['N','You ask if he ever went.'],['V','Look at the postcards, dear. Look at the postmarks.']]},
  {ch:3, who:'H', need:[['B',3],['F',6]], coins:20, say:'“MEMO: A brass elephant has been reported in a suitcase. Elephants are not permitted in suitcases. Please investigate. — H.”', beat:['N','It is a very small brass elephant. The tag says: “Left because: Grandmother said it would bring luck, and it did, and I don’t need it now.”']},
  {x:1, ch:3, who:'M', need:[['T',6],['K',3]], coins:24, say:'(Mr Thursday has wheeled a steam engine to the counter and is sitting on an old camera.)', beat:['M','<em>(He takes your photograph. It is mostly owl.)</em>']},
  // ch5 — the night train
  {ch:4, who:'V', need:[['T',6],['L',5]], coins:28, say:'A steam engine and a telescope. I want to see where the night train comes from. Nobody’s ever looked.', beat:['V','Nowhere. It comes from nowhere. It just comes when you’re ready. I knew that. I wanted to check.']},
  {ch:4, who:'H', need:[['F',6],['L',6]], coins:30, say:'“MEMO: Departing passengers must present one suitcase and one star chart. The night train does not use maps. — H.”', beat:['H','“MEMO: Approved. All departures approved. — H.”'], more:[['V','He’s never written that before.']]},
  {ch:4, who:'M', need:[['M',5],['R',3]], coins:30, say:'(Mr Thursday wants the drawing of the sea, and a slice of cake for the journey. He isn’t going anywhere. It’s for Zofia.)', beat:['M','<em>(He tucks both into Zofia’s bag when she isn’t looking.)</em>']},
  {id:204, ch:4, who:'Z', sales:6, need:[['P',6]], coins:30, say:'Six more sales, dear. The last of the stock. And a filing cabinet, to put my thirty years in. I’m not taking them with me.', beat:['Z','There. Empty. Thirty-one years of other people’s things, all gone to people who wanted them.'], more:[['Z','Funny. I thought I’d feel lighter. I feel like I’ve been holding my breath and only just noticed.'],['V','That’s what lighter feels like, Zofia. At first.']]},
  {ch:4, who:'V', cards:15, need:[['P',7],['K',3]], coins:30, say:'Fifteen cards read, the ministry archive and the old camera. I want a photograph of Zofia before she goes. For the buffet wall.', beat:['V','Look at her. She looks about nineteen.']},
  {x:1, ch:4, who:'V', need:[['F',6],['T',6]], coins:30, say:'A suitcase and the steam engine. Not for me. I just like to see them side by side, once a year. Indulge me.', beat:['V','Every year I almost go. Every year I open the buffet instead. It’s not cowardice. I like the buffet.']},
  // ch6 — the claim
  {ch:5, who:'V', need:[['T',7],['R',4]], coins:34, say:'The night express and a box of chocolates. You don’t have to take the train. But you should know which one it is.', beat:['V','There. Now you know. Have a chocolate. Knowing is tiring.']},
  {ch:5, who:'V', need:[['M',6]], coins:34, say:'His ticket stub. Bring it. I want to see the date with my own eyes.', beat:['V','Last Tuesday. 23:58. The same train you missed, a week later. He waited for someone to come and take the coat.'], more:[['N','You ask who he was waiting for.'],['V','Whoever came next, dear. He was waiting for you.']]},
  {ch:5, who:'M', need:[['F',7],['B',4]], coins:34, say:'(Mr Thursday has pushed a steamer trunk to the door and is sitting on an anchor. It’s symbolic. Probably.)', beat:['M','<em>(He doesn’t get in the trunk. He just wants it to know it could leave.)</em>']},
  {x:1, ch:5, who:'H', need:[['L',6],['R',4]], coins:34, say:'“MEMO: The Deputy Under-Registrar requests one star chart and one box of chocolates. For filing. — H.”', beat:['H','“MEMO: The chocolates have been filed. In the Deputy Under-Registrar. — H.”']},
  {ch:5, who:'O', cards:22, need:[['M',7]], coins:50, say:'Read the last cards, and claim what you came to leave. “No. 0002. Left because: ———.”'},
];

/* Insight: points from moons unlock rewards and, every third, a postcard from Mr Pell. It runs to the end of the story. */
const PASS=[
  {pts:12, rw:[['E',2]]},
  {pts:25, rw:[['H',1]]},
  {pts:37, rw:[['C',2],['X',2]]},
  {pts:50, rw:[['E',3]]},
  {pts:62, rw:[['gD',2]]},
  {pts:75, rw:[['H',2]]},
  {pts:87, rw:[['E',3],['C',3]]},
  {pts:100, rw:[['gS',2]]},
  {pts:112, rw:[['H',2]]},
  {pts:125, rw:[['E',4]]},
  {pts:137, rw:[['gT',2]]},
  {pts:150, rw:[['H',2],['X',3]]},
  {pts:165, rw:[['E',4],['C',3]]},
  {pts:182, rw:[['H',3]]},
  {pts:200, rw:[['E',5],['C',4]]},
];
const FELIX=[
  [['N','Tucked into the reward: a postcard. A small station with geraniums in every window box.'],['F','“Halt at Brennow. I got off because the station had geraniums. That’s it. That was the whole reason. I have never done anything for a reason that small. — A.P.”']],
  [['F','“I’ve rented a room above a bakery. I am terrible at bread. The baker says nobody is good at bread for the first ten years. I said I am sixty-three. He said then I’d better hurry. — A.P.”']],
  [['F','“Violin lesson nine. My teacher now wears earplugs. I have decided this is encouraging. — A.P.”']],
  [['F','“I saw the sea today. I spent thirty years calculating it: wave heights, harbour insurance. I had never actually looked. It is very big, Clerk. Nobody mentions that. — A.P.”']],
  [['F','“If this has reached you, you’ve read most of the cards. Vesna will pretend she didn’t know. She did. When you fill in your ticket, use a pen. Pencil is for people who want to change their minds. — A.P.”'],['V','<em>(Vesna reads it, sniffs, and says she has something in her eye.)</em>']],
];
const MOON_NOTES=[
  [['N','Folded inside the crescent: a page from Vesna’s card notes.'],['V','“Insight comes in slivers. Don’t be greedy. A sliver is plenty to see by.”']],
  [['V','“Half a moon, half the truth. The other half is usually funnier.”']],
  [['V','“Nearly full. This is when people want to stop looking. Don’t.”']],
  [['V','“Full. Everything is lit, even the bits you’d rather not see. Look anyway. They’re smaller in the light.”']],
];
const P2={ shopName:'The Station Buffet', shopBlurb:'Vesna sells whatever the night mail brings. Her readings cost coins too, so keep some back' };
const SHOP_ITEMS=[
  {id:'ET', item:['ET',1], price:30, what:'Refills one generator. Drag it onto the one you need'},
  {id:'H1', item:['H',1], price:60, what:'Skips 15 minutes on every generator and the samovar'},
  {id:'E2', item:['E',2], price:25, what:'Strong coffee: drop it on a generator for 5 taps of better rare finds'},
];

const REFLECTIONS=[
  ['N','Spring. The 6:04 runs on time for the first time in living memory. Nobody is sure what to make of it.'],
  ['V','You stayed a while. Most do. It’s not a failure, dear, it’s a waiting room. You were allowed to wait.'],
  ['V','Anselm calculated risk for thirty-one years and then left because of geraniums. People are not sums.'],
  ['N','A postcard on the buffet wall: Zofia and her sister on a beach, both in enormous hats, both laughing at whoever’s holding the camera.'],
  ['V','She sends one a week. They’re mostly about the hats.'],
  ['M','<em>(Mr Thursday still stamps the memos. They’re shorter now. Most of them just say APPROVED.)</em>'],
  ['V','The forms were never about proving you exist, you know. He thought everyone should have to decide to. He had to, once. He fell out of a nest in the roof and decided to stay.'],
  ['N','The Ledger has a new first page. It’s a list of everything people came back for. It’s much shorter than the other list, and much happier.'],
  ['V','What did you write on your ticket in the end?'],
  ['N','You tell her. She nods as if she’d drawn it herself.'],
  ['V','Good. Use a pen.'],
];

/* every generator gets a little story the first time it appears (hints only, nothing from later chapters) */
const GEN_STORY={
  gD1:[['H','“MEMO: The in-tray is for incoming. The out-tray is for outgoing. There is no out-tray. — H.”'],['V','There’s never been an out-tray. Things come in. Nobody quite knows how they leave.']],
  gD2:[['V','A copying machine. It copies everything twice, and the second copy is always slightly more honest.']],
  gD3:[['V','The registry office. Births, marriages, departures. They keep departures in a separate drawer. It sticks.']],
  gS1:[['V','The luggage trolley. One wheel squeaks. It squeaks louder when the thing on it is something someone loved.']],
  gS2:[['V','A whole luggage van. Imagine how much people want to leave behind, to need a van.']],
  gS3:[['V','The station hotel. People check in to leave things. It’s cheaper than therapy and the beds are softer.']],
  gT1:[['V','The station radio. It only plays the shipping forecast and, once a night, a waltz nobody requested.']],
  gT2:[['V','A telegraph. It still taps out messages. Mostly “ARRIVING”. Sometimes, if you’re patient, “STAYING”.']],
  gT3:[['V','The old signal box. Every lever is labelled except one. Nobody has ever pulled that one. You’re thinking about it, aren’t you?']],
  gL1:[['V','My curiosity cart. Candles, quills, the odd charm. Everything on it is slightly cursed and very reasonably priced.']],
  gL2:[['V','A fortune tent. I don’t use it. It’s for people who need to feel they’re somewhere mysterious. The buffet works just as well.']],
  gL3:[['V','A night circus. Don’t ask where it came from. Circuses arrive. That’s what they do.']],
  gM1:[['V','Locker Thirteen. The only locker without a lock. People are always surprised it isn’t empty.']],
  gM2:[['V','The locker room. Every door has a name scratched inside. Most of them have been crossed out. That’s good. It means they came back for themselves.']],
  gM3:[['V','The lost property hall. Everything anyone ever left in Grauberg, all the way back. It smells of rain and peppermints.']],
  gK1:[['V','My samovar. The tea is very strong. I don’t drink it, I think with it. Drop a glass on a generator and see.']],
  gC1:[['V','The station clock. It runs eleven minutes slow, on purpose. Everyone in Grauberg gets eleven extra minutes to decide.']],
  gC2:[['V','The clock tower. From the top you can see the whole line, all the way to the sea. Supposedly. Nobody’s been up in years.']],
  Z1:[['V','The furnace from the boiler room. Give it something you’re finished with. It gives back a little light.'],['M','<em>(Mr Thursday watches it with deep suspicion.)</em>']],
  Q1:[['V','An unclaimed parcel. Open it, it’s allowed. Regulation eleven. Zofia wrote regulation eleven.']],
  Q2:[['V','A whole mail sack. Everything in it was addressed to someone who’d already moved on.']],
  TR1:[['V','My deck. Old, soft at the corners. Every card in it has been wrong at least once and right at the right time.']],
};

const QUESTS=[
  {id:'gen',     ic:'🔨', n:'Use generators',        steps:[25,100,250,500,1000,2000]},
  {id:'merge',   ic:'🔗', n:'Make merges',           steps:[20,50,150,300,600,1200]},
  {id:'deck',    ic:'🃏', n:'Read cards',            steps:[3,8,15,22]},
  {id:'side',    ic:'🧳', n:'Sell at Zofia’s kiosk', steps:[3,10,25,50,100]},
  {id:'compost', ic:'🔥', n:'Feed the furnace',      steps:[3,10,25,50]},
  {id:'rare',    ic:'💎', n:'Find rare items',       steps:[3,10,25,50,100]},
  {id:'story',   ic:'📜', n:'Fill story orders',     steps:[3,10,20]},
  {id:'high',    ic:'🌟', n:'Make level 5+ items',   steps:[3,10,25,60]},
  {id:'claim',   ic:'🪙', n:'Claim coins, nods & moons', steps:[10,40,100,250]},
  {id:'open',    ic:'📦', n:'Open boxes & cobwebs',  steps:[10,25,45]},
  {id:'disc',    ic:'🧩', n:'Discover new items',    steps:[15,30,50,70]},
];
