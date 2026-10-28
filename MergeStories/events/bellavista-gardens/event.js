/* Bellavista Gardens: a Merge Stories cartridge, rebuilt from Merge Mansion's Ignatius Boulton event.
   Same machine, new story: a box pallet unpacks tills and clocks, tills make telephones, telephones make brass
   numbers, numbers feed the mulcher, the mulcher makes seedlings, seedlings grow into garden furniture, and the
   fountain, gazebo and folly turn up pieces of Emilio Bellavista's life. Merging numbers 2 and up drops stars;
   stars fill the Star Board, which pays out the statue fragments; the statue becomes a stonemason's yard that
   carves the final piece. Everything here is configuration; the engine does the rest. */
const EVENT = {
  id: 'bellavista-gardens', title: 'Bellavista Gardens', tagline: 'The Girl with the Oranges', version: 'v3',
  themeColor: '#18241a',
  cover: { art: `<svg class="cover" viewBox="0 0 360 230" role="img" aria-label="An overgrown walled garden with an empty statue plinth, an orange tree and a tortoise"><defs><linearGradient id="bgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4a3a"/><stop offset="1" stop-color="#18241a"/></linearGradient><radialGradient id="bgSun" cx=".72" cy=".28" r=".5"><stop offset="0" stop-color="#f6c66b" stop-opacity=".55"/><stop offset="1" stop-color="#f6c66b" stop-opacity="0"/></radialGradient></defs><rect width="360" height="230" fill="url(#bgSky)"/><rect width="360" height="230" fill="url(#bgSun)"/><path d="M0 120 H360 V230 H0Z" fill="#203222"/><g fill="#8a4f35"><rect x="0" y="104" width="360" height="18"/><path d="M0 104 h360" stroke="#a8644a" stroke-width="3"/></g><g stroke="#6e3f2b" stroke-width="1"><path d="M30 104v18M70 104v18M110 104v18M250 104v18M290 104v18M330 104v18"/></g><g transform="translate(150 54)"><rect x="0" y="0" width="12" height="76" fill="#cfc7b4"/><rect x="48" y="0" width="12" height="76" fill="#cfc7b4"/><path d="M0 0 Q30 -26 60 0" stroke="#3a3a36" stroke-width="4" fill="none"/><path d="M8 8 L52 8 M8 30 L52 30 M18 8 V76 M30 8 V76 M42 8 V76" stroke="#2b2b28" stroke-width="2.5"/></g><g transform="translate(70 112)"><rect x="-14" y="18" width="28" height="30" fill="#bdb5a2"/><rect x="-18" y="14" width="36" height="6" fill="#d9d1bd"/><rect x="-18" y="46" width="36" height="6" fill="#d9d1bd"/><text x="0" y="40" font-size="10" text-anchor="middle" fill="#6b6455">?</text></g><g transform="translate(280 70)"><rect x="-3" y="34" width="6" height="40" fill="#5b3a26"/><circle cx="0" cy="22" r="30" fill="#2f6b3a"/><circle cx="-14" cy="14" r="5" fill="#f0a63a"/><circle cx="10" cy="8" r="5" fill="#f0a63a"/><circle cx="14" cy="30" r="5" fill="#f0a63a"/><circle cx="-6" cy="34" r="5" fill="#f0a63a"/><path d="M-18 74 h36 l-6 22 h-24z" fill="#b5653f"/></g><g fill="#1e3a24"><path d="M0 150 q20 -30 40 0 q20 -26 40 0 q14 -20 30 0 V230 H0Z"/><path d="M360 160 q-20 -30 -40 0 q-18 -24 -36 0 V230 H360Z"/></g><g transform="translate(196 186)"><ellipse cx="0" cy="0" rx="20" ry="11" fill="#6b5a35"/><path d="M-14 -4 q14 -16 28 0" fill="#857043"/><circle cx="22" cy="-2" r="5" fill="#7c6a40"/><circle cx="24" cy="-3" r="1" fill="#111"/></g><circle cx="196" cy="160" r="5" fill="#f0a63a"/><path d="M196 155 l2 -4" stroke="#2f6b3a" stroke-width="2"/></svg>`,
    sub: 'The Girl with the Oranges',
    key: [["🍊", "Find the girl Emilio Bellavista looked for all his life"], ["🧩", "Merge and fill orders to bring his garden back"], ["☀️", "No timer. Play at your own pace"]],
    more: ["Tap a generator twice to make items; drag two matching items together to merge", "Generators are free to tap; they rest after a while and ⏲️ egg timers refill one", "📦 The box pallet unpacks tills and clocks; a 🧾 till makes ☎️ telephones; a telephone makes brass numbers", "⚙️ The mulcher wants the number it shows: drop it in for six 🌱 seedlings", "Merge seedlings up to a ⛲ fountain, 🛖 gazebo or 🏯 folly: they turn up Emilio’s story", "Merging numbers to 2 and up drops ✨ stars for the Star Board", "The Star Board pays out the statue pieces; the statue becomes a 🏛️ stonemason’s yard", "🪶 Feather dusters clear a cobwebbed tile", "Tap 🪙 for Mrs Lindqvist’s Garden Shop"] },
  terms: {
    passName: 'Star Board', tokenNoun: 'star', tokenIcon: '✨',
    passHelp: '• Stars ✨ drop when you merge numbers to 2 and up, and from orders<br>• Tap twice to claim them any time: ✨ 1 · 🌟 3 · 💫 7 · 🌠 16 points<br>• Merging first is worth more, but takes board space<br>• The Star Board pays out the statue pieces<br>• Every 3rd reward comes with one of Emilio’s postcards 📮',
    notesTitle: 'Wilf’s garden diary', notesItem: 'A page from Wilf’s garden diary is folded inside. Tap it to read. It can’t be merged until you do.',
    lettersTitle: 'Unsent postcards', letterWord: 'Postcard',
    sheetBlocked: 'That part of the garden is still under brambles.', sheetTap: 'Still under brambles.',
    sideSold: 'Sold.', sideSay: 'Anything you can spare.', sideLucky: 'A lucky find!',
    doneTitle: 'The garden is yours', doneHas: 'You found the last of Emilio’s story. Garibaldi approves.', doneNot: 'Keep merging. Emilio’s story still has pieces nobody has found.',
    presentDesc: 'Something new for the garden.',
    loreFound: 'Turned up in the garden', loreHeading: 'The Bellavista Story', loreEmpty: 'Nothing yet. Emilio’s life is out there somewhere, one piece at a time.',
  },
  complete: { title: 'Clara’s Garden', text: 'You brought the Bellavista garden back and found the girl with the oranges.',
    note: 'The board stays open. Merge as long as you like. Emilio’s story has pieces nobody has found yet.' },
  /* reward numbers (the engine hands them out). Tables read "value or more → level" */
  rewards: {
    order: { coins:[[30,3],[16,2],[0,1]], xp:[[4,3],[2,2],[0,1]], points:[[3,2],[0,1]] },
    finale: [['C',4],['X',4],['N',3]],
    discovery: { coinsPerLevel:2, xpFrom:5 },
    stage: l => l%4===0 ? [['H',1],['C',2]] : l%2 ? [['C',2]] : [['ET',1]],
    quests: [[['C',1],['X',1]],[['C',2],['ET',1]],[['H',1],['N',1]],[['C',3],['N',2]],[['H',2],['ET',1]],[['C',3],['N',3]]],
  },
  css: ":root{--bg:#18241a;--panel:#213024;--panel2:#2a3c2d;--wood:#3e5a35;--wood2:#37512f;--ink:#f4eedc;--muted:#a8b79a;--gold:#f0a63a;--velvet:#c0573a}\n"
     + "body{background-image:radial-gradient(120% 60% at 50% -10%, #2d4a3a 0%, transparent 60%)}\n"
     + "#title{background-image:radial-gradient(90% 55% at 50% 30%,#3a5a3e 0%,transparent 70%)}\n"
     + "#board{box-shadow:0 0 0 3px #26331f,0 0 0 4px #a8644a,0 14px 30px #0008}\n"
     + ".cell.sheet{background:repeating-linear-gradient(60deg,#2a3f26 0 6px,#33492c 6px 9px,#26391f 9px 14px)}\n"
     + ".dlg{background:linear-gradient(180deg,#26382a,#1c2a1f)}\n.overlay{background:#0a120bcc}\n#scene.clear{background:#0a120b33}\n"
     + "#toast .t{background:linear-gradient(180deg,#2c4230,#213325);border-color:#f0a63a88}\n#title .go{background:linear-gradient(transparent,var(--bg) 30%)}",
  wheel: null,
  /* a slow garden waltz in F: accordion pad, oom-pah-pah bass, a mandolin that tremolos the tune the second time round */
  music: { bpm: 112, beats: 96,
    mix: { lp: 2600, send: .45, rev: .45, fb: .24, dlp: 1400, wet: .14, wetToRev: true },
    pad: { wave: 'triangle', det: 9, g: .012, a: .5, lp: [650, 1000, 700] },
    compose({voice, puff, pad, mallet, BEAT, rnd}) {
      const CH={F:[41,[57,60,65]], C7:[36,[55,58,64]], Bb:[46,[58,62,65]], Dm:[38,[57,62,65]], Gm:[43,[58,62,67]]};
      const SONG=['F','C7','F','Bb', 'F','C7','F','F', 'Dm','Gm','C7','F', 'Bb','C7','F','F'];
      const MEL=[
        [[0,72,1],[1,69,1],[2,72,1]], [[0,70,1.5],[1.5,69,.5],[2,67,1]], [[0,69,1],[1,65,1],[2,69,1]], [[0,74,2],[2,72,1]],
        [[0,72,1],[1,74,.5],[1.5,72,.5],[2,69,1]], [[0,67,1],[1,70,1],[2,76,1]], [[0,77,2],[2,72,1]], [[0,69,3]],
        [[0,74,1],[1,77,1],[2,74,1]], [[0,74,1.5],[1.5,72,.5],[2,70,1]], [[0,72,1],[1,70,1],[2,67,1]], [[0,69,2],[2,72,1]],
        [[0,74,1],[1,77,1],[2,74,1]], [[0,72,1],[1,76,1],[2,79,1]], [[0,77,1.5],[1.5,76,.5],[2,74,1]], [[0,77,3]],
      ];
      const bass=(m,t,dur,g=.15)=>{ voice({m,t,dur,g,a:.012,wave:'sine',det:0,lp:400,lpEnd:250}); voice({m:m+12,t,dur:dur*.5,g:g*.2,a:.01,wave:'triangle',det:3,lp:650}); };
      const pluck=(m,t,g=.015)=>voice({m,t,dur:.24,g,a:.008,wave:'triangle',det:6,lp:2000,lpEnd:700});
      const mando=(m,t,len)=>{ const n=Math.max(1,Math.round(len*4)); for(let i=0;i<n;i++) voice({m,t:t+i*BEAT/4,dur:BEAT/4*.9,g:i?.018:.026,a:.006,wave:'triangle',det:5,lp:2300,lpEnd:1100}); };
      const brush=(t,g)=>puff({t,dur:.08,g,f:2400,to:1500});
      for(let bar=0;bar<32;bar++){
        const half=Math.floor(bar/16), b16=bar%16, t0=bar*3*BEAT+.02, [root,chord]=CH[SONG[b16]];
        pad(chord,t0,BEAT*3.1);
        bass(root,t0,BEAT*.9);                                   // oom
        chord.forEach(m=>{ pluck(m,t0+BEAT); pluck(m,t0+2*BEAT,.012); }); // pah-pah
        if(rnd()<.3) bass(root+7,t0+2.5*BEAT,BEAT*.4,.08);
        for(let b=0;b<3;b++) brush(t0+b*BEAT, b?.005:.008);
        MEL[b16].forEach(([bt,m,len])=>{ const t=t0+bt*BEAT;
          if(!half) mallet(m,t,.07,Math.min(1.4,len*BEAT+.4));
          else { mando(m,t,len); mallet(m-12,t,.03,len*BEAT*.8); } });
        if(b16%4===3) [81,84,89].forEach((m,j)=>mallet(m,t0+(2+j*.2)*BEAT,.016,.6));
      }
    } },
};

const CONFIG = {
  chargerScale: 1/6,     // a 2h Merge Mansion charger runs 20 min here
  cols: 7, rows: 9,
  saveKey: 'merge-stories:bellavista-gardens',
};

const CHAINS = {
  /* brass numbers 0–9, from the telephones. Merging to "2" and up shakes out a star. Fuel for the mulcher. */
  D:{name:'Brass Numbers', tile:true, mergeBonus:{from:3, give:['N',1]}, items:[
    {e:'0',n:'Zero'},{e:'1',n:'One'},{e:'2',n:'Two'},{e:'3',n:'Three'},{e:'4',n:'Four'},
    {e:'5',n:'Five'},{e:'6',n:'Six'},{e:'7',n:'Seven'},{e:'8',n:'Eight'},{e:'9',n:'Nine'}]},
  /* the garden: seedlings from the mulcher grow into garden furniture; the top three make story pieces */
  GB:{name:'The Garden', items:[
    {e:'🌱',n:'Seedlings'},{e:'🌿',n:'Cuttings'},{e:'🪴',n:'Potted Shrub'},{e:'🌳',n:'Topiary Tree'},{e:'🪑',n:'Garden Bench'},
    {e:'⛲',n:'Fountain', gen:true, charges:16, rechargeMs:100000, drop:[['M',1,58],['M',2,28],['M',3,8],['X',1,3],['C',1,3]]},
    {e:'🛖',n:'Gazebo', gen:true, charges:18, rechargeMs:90000, drop:[['M',1,32],['M',2,32],['M',3,20],['M',4,10],['X',1,3],['C',1,3]]},
    {e:'🏯',n:'Garden Folly', gen:true, charges:20, rechargeMs:80000, drop:[['M',2,26],['M',3,30],['M',4,24],['M',5,12],['X',2,4],['C',2,4]]}]},
  /* Emilio's life, one piece at a time (the story chain). The top is the last secret. */
  M:{name:'The Bellavista Story', story:true, items:[
    {e:'🧳',n:'Steamer Trunk', lore:'A new life lies ahead for young Emilio and his family. “E. Bellavista, Genoa” is painted on the lid in a child’s careful capitals.'},
    {e:'🎫',n:'Steerage Ticket', lore:'They crossed the ocean to New York, 1893. A red-haired girl on deck shared her oranges with him every single day.'},
    {e:'🥫',n:'Mama’s Preserves', lore:'Mama’s jars kept the family fed on the crossing. Half of them leaked. Emilio, aged nine, was furious about it.'},
    {e:'🚂',n:'Railway Ticket', lore:'At the docks the girl was gone. The Bellavistas took the train west and settled by a cold lake in Wisconsin.'},
    {e:'🪧',n:'Papa’s Shop Sign', lore:'Papa’s got a brand new hardware store. Nails, string, lamp oil, and a lemon tree by the till that never once fruited.'},
    {e:'🎒',n:'School Satchel', lore:'By fifteen Emilio had left school for good. His teacher wrote “restless” on every report.'},
    {e:'🧹',n:'Shop Broom', lore:'He took a job in his father’s store and swept its floor every morning, thinking about lids.'},
    {e:'🔩',n:'The Twist Lid', lore:'Sweeping up a smashed jar of marmalade, Emilio had his idea: a lid that screws on and never leaks.'},
    {e:'🏭',n:'Factory Deed', lore:'He took the idea to the bank, and the Bellavista Jar Works was born.'},
    {e:'💸',n:'The Fortune', lore:'By 1910 every kitchen in America had a Bellavista jar. Emilio was a very rich man, and still restless.'},
    {e:'🏡',n:'House Plans', lore:'With his fortune he built a house with a great walled garden, and an orangery for forty trees, because oranges smelled like the one good thing about the crossing.'},
    {e:'🌍',n:'Postcards from Everywhere', lore:'Passion for travel, the papers said. It wasn’t. He sailed the world for twenty years looking for the girl with the oranges.'}]},
  /* the statue: the Star Board pays out its fragments; whole again, it becomes the stonemason's yard */
  ST:{name:'The Statue', items:[
    {e:'🪨',n:'Marble Fragment'},{e:'🗿',n:'Broken Statue'},
    {e:'🏛️',n:'Stonemason’s Yard', gen:true, charges:24, rechargeMs:60000, drop:[['SJ',1,30],['SJ',2,32],['SJ',3,22],['SJ',4,12],['SJ',5,4]]}]},
  /* the stonemason's work, up to the piece the statue is missing */
  SJ:{name:'Stonework', items:[
    {e:'🫙',n:'Jam Jar'},{e:'🍯',n:'Marmalade Pot'},{e:'🏺',n:'Terracotta Pot'},{e:'⚱️',n:'Stone Urn'},
    {e:'🧱',n:'Carving Block'},{e:'✋',n:'Stone Hand'},{e:'🤚',n:'Polished Hand'},{e:'🍊',n:'The Stone Orange'}]},
  /* resources: tap twice to claim */
  C:{name:'Coins', type:'res', claim:'coins', items:[
    {e:'🪙',n:'Penny',v:1},{e:'💶',n:'Banknote',v:5},{e:'👛',n:'Coin Purse',v:12},{e:'💰',n:'Money Bag',v:30},{e:'💎',n:'Jar King’s Fortune',v:75}]},
  X:{name:'Applause', type:'res', claim:'xp', items:[
    {e:'👏',n:'Clap',v:1},{e:'🙌',n:'Cheer',v:3},{e:'🎉',n:'Hooray',v:8},{e:'🎊',n:'Celebration',v:20},{e:'🏆',n:'Garden Prize',v:50}]},
  N:{name:'Stars', type:'res', claim:'points', items:[
    {e:'✨',n:'Sparkle',v:1},{e:'🌟',n:'Bright Star',v:3},{e:'💫',n:'Shooting Star',v:7},{e:'🌠',n:'Star Shower',v:16}]},
  H:{name:'Time Skips', type:'res', claim:'skip', items:[{e:'⏳',n:'Hourglass',v:15},{e:'⌛',n:'Sand Timer',v:60},{e:'🗓️',n:'Calendar Page',v:240}]},
  ET:{name:'Egg Timers', items:[{e:'⏲️',n:'Egg Timer'}]},
  DR:{name:'Feather Dusters', dust:true, items:[{e:'🪶',n:'Feather Duster'}]},
  V:{name:'Time Chargers', items:[
    {e:'🕐',n:'Charger Shard'},{e:'🕒',n:'Shard Pair'},{e:'🕕',n:'Shard Cluster'},{e:'🕘',n:'Charger Core'},
    {e:'⏱️',n:'Small Time Charger',hours:2},{e:'⏰',n:'Medium Time Charger',hours:4},{e:'⌚',n:'Big Time Charger',hours:8},{e:'🌀',n:'Huge Time Charger',hours:16}]},
  /* generators */
  gX:{name:'Box Pallet', gen:true, main:'gR', items:[
    {e:'📦',n:'Box Pallet', charges:16, rechargeMs:120000, drop:[['gR',1,10],['gC',1,2],['D',1,37],['D',2,10],['C',1,24],['X',1,11],['DR',1,6]]},
    {e:'🗃️',n:'Stacked Pallets', charges:20, rechargeMs:100000, drop:[['gR',1,13],['gR',2,3],['gC',1,4],['D',1,24],['D',2,14],['D',3,6],['C',1,20],['X',1,10],['DR',1,6]]}]},
  gR:{name:'Shop Till', gen:true, main:'gP', items:[
    {e:'🧾',n:'Old Till', charges:12, rechargeMs:150000, drop:[['gP',1,18],['C',1,48],['C',2,14],['X',1,12],['ET',1,4],['N',1,4]]},
    {e:'💵',n:'Cash Register', charges:14, rechargeMs:140000, drop:[['gP',1,18],['gP',2,4],['C',1,36],['C',2,20],['X',1,10],['ET',1,4],['H',1,3],['N',1,5]]},
    {e:'🏦',n:'Counting House', charges:16, rechargeMs:130000, drop:[['gP',1,14],['gP',2,8],['C',2,32],['C',3,14],['X',2,12],['ET',1,6],['H',1,6],['N',1,8]]}]},
  gP:{name:'Telephone', gen:true, main:'D', items:[
    {e:'☎️',n:'Rotary Phone', charges:20, rechargeMs:75000, drop:[['D',1,55],['D',2,24],['D',3,10],['D',5,7],['C',1,4]]},
    {e:'📞',n:'Candlestick Phone', charges:22, rechargeMs:70000, drop:[['D',1,34],['D',2,28],['D',3,18],['D',4,8],['D',5,9],['C',1,3]]},
    {e:'📠',n:'Switchboard', charges:24, rechargeMs:60000, drop:[['D',2,28],['D',3,28],['D',4,20],['D',5,16],['D',6,6],['C',1,2]]}]},
  gC:{name:'Grandfather Clock', gen:true, main:'V', items:[
    {e:'🕰️',n:'Grandfather Clock', charges:8, rechargeMs:240000, drop:[['V',1,85],['V',2,15]]},
    {e:'🔔',n:'Chiming Clock', charges:10, rechargeMs:200000, drop:[['V',1,60],['V',2,30],['V',3,10]]}]},
  /* the mulcher: drop in the number it shows, six seedlings come out */
  WC:{name:'Mulcher', gen:true, main:'GB', items:[{e:'⚙️',n:'The Mulcher', want:true, wants:[['D',1],['D',2],['D',3],['D',4]], gives:'GB', count:6, giveL:1}]},
};

/* board: 9 rows × 7. Bottom three rows open at the start; each chapter clears more brambles */
const LAYOUT = [
  'bM3 bD4 bGB4 bgP2 bD5 bGB3 bM2',     // zone 3: opens chapter 4
  'bD3 wM2 bD4 bGB3 bD2 wD4 bC2',
  'bGB3 bM2 bD3 bD2 bDR1 wGB3 bD5',     // zone 2: opens chapter 3
  'wD3 bD2 bGB2 bET1 bM1 bD4 wGB2',
  'bD3 bGB2 bgR1 bD2 wGB3 bC2 bD1',     // zone 1: opens chapter 2
  'wD2 bGB1 bD4 bM1 bD1 wD3 bGB2',
  'bD2 wGB1 bD1 bC1 wD2 bGB2 bD1',      // zone 0: the garage, open from the start
  'wD1 o. o. oWC1 o. o. wGB2',
  'oD1 ogX1 o. o. o. ogP1 oDR1',
];

const CAST = {
  N:{name:'', av:''},
  P:{name:'Priya', av:'👩🏽‍💼'},
  W:{name:'Wilf', av:'👴'},
  M:{name:'Garibaldi', av:'🐢'},
  O:{name:'A note on the plinth', av:'📜'},
  F:{name:'Emilio’s postcard', av:'📮'},
};

const CHAPTERS = [
  { title:'The Garage', zone:0, gifts:[],
    intro:[
      ['N','Bellavista House, Wisconsin. Shut up for forty years. Priya bought it at auction, sight unseen.'],
      ['P','I’m turning the garden into a public park. You’re my first hire. Congratulations, you’re also my only hire.'],
      ['N','The garage is stacked to the rafters: shop pallets, an old till, a telephone that still has a dial tone.'],
      ['W','Wilf. Head gardener. Fifty-one years. Mind the mulcher, she bites.'],
      ['M','<em>(Something under the workbench moves. It is a tortoise the size of a footstool.)</em>'],
      ['W','That’s Garibaldi. He was here before me. He was here before everybody.'],
      ['N','<em>• Tap the ☎️ telephone twice for brass numbers<br>• The ⚙️ mulcher shows the number it wants: drop it in for six 🌱 seedlings<br>• Tap the 📦 pallet to unpack it</em>'],
    ],
    outro:[
      ['P','Look at that. Actual floor. There’s a whole garden out there under the brambles.'],
      ['W','There’s a plinth by the front gate, too. Empty. Has been since before my time.'],
      ['P','An empty plinth. Who steals a statue?'],
      ['W','<em>(Wilf finds something urgent to do with a hosepipe.)</em>'],
    ]},
  { title:'Brambles', zone:1, gifts:[['DR',1]],
    intro:[
      ['N','Behind the garage the brambles are taller than you. Somewhere in there is a walled garden.'],
      ['P','There’s a trunk in here with a name on it. E. Bellavista, Genoa.'],
      ['W','Emilio. He built this place. Came over on a boat when he was nine.'],
      ['N','<em>(A 🪶 feather duster is in your gifts. Drag it onto a cobwebbed tile to clear it.)</em>'],
    ],
    outro:[
      ['N','Under the brambles: a long glasshouse, its panes green with age. Inside, a row of dead trees in tubs.'],
      ['W','Orange trees. Forty of them. He had them shipped from Sicily, one by one.'],
      ['P','Oranges. In Wisconsin.'],
      ['W','He didn’t like being told no. Especially by the weather.'],
    ]},
  { title:'The Orangery', zone:2, gifts:[['GB',5]],
    intro:[
      ['N','You prop the orangery doors open. It smells of dust and, very faintly, still of oranges.'],
      ['P','Why oranges? He made jars. He should have built a jar museum.'],
      ['W','Ask Garibaldi. He was there.'],
      ['M','<em>(Garibaldi walks slowly to the oldest tree and lies against its tub, the way you might lean on an old friend.)</em>'],
      ['N','<em>(A 🪑 garden bench is in your gifts. Merge two benches for a ⛲ fountain: it turns up pieces of Emilio’s story.)</em>'],
    ],
    outro:[
      ['N','Tucked in the soil of the oldest tub: a dried orange peel, kept in wax paper for a hundred years.'],
      ['P','Who keeps orange peel for a hundred years?'],
      ['W','Somebody who couldn’t keep the girl it came from.'],
      ['P','What girl?'],
      ['W','Ask me tomorrow.'],
    ]},
  { title:'Postcards', zone:3, gifts:[['gC',1]],
    intro:[
      ['N','The last corner of the garden is a potting shed, and the potting shed is full of postcards.'],
      ['N','Hundreds. Cairo, Lima, Bombay, Cork. All addressed the same way: “To the girl with the oranges.” Not one of them sent.'],
      ['P','He wrote to her for twenty years and never posted a single one?'],
      ['W','He had no address. No name. Just the oranges, and the colour of her hair.'],
      ['N','<em>(A 🕰️ grandfather clock is in your gifts. It makes time charger shards: merge them up and switch one on to speed up the generators around it.)</em>'],
    ],
    outro:[
      ['P','So. He crossed on the ship, she shared her oranges, and they lost each other at the docks.'],
      ['P','Then he spent his whole life getting rich enough to go and look for her, and never found her.'],
      ['W','I never said that.'],
      ['P','Wilf.'],
      ['W','The statue on the front gate. Bring it back, and I’ll tell you who it was.'],
    ]},
  { title:'The Empty Plinth', zone:null, gifts:[['ET',1]],
    intro:[
      ['N','Wilf leads you to a corner of the garage you haven’t opened. Under a tarpaulin: broken marble.'],
      ['W','Taken down in 1943 for safekeeping. The stonemason died before he could put her back. Nobody else knew how.'],
      ['P','Her. So it IS a woman.'],
      ['W','<em>(Wilf says nothing at all, very loudly.)</em>'],
      ['N','<em>(Earn ✨ stars to collect the statue fragments from the Star Board. Merge them back into a 🗿 statue, then into a 🏛️ stonemason’s yard.)</em>'],
    ],
    outro:[
      ['N','The statue stands on the bench in two halves: a woman in a gardener’s apron, one hand held out. The hand is missing.'],
      ['P','What was she holding?'],
      ['W','What do you think?'],
      ['P','…An orange.'],
    ]},
  { title:'The Stone Orange', zone:null, gifts:[],
    intro:[
      ['N','The stonemason’s yard is working again. Wilf has found the old man’s chisels.'],
      ['W','He carved the hand and the orange from life. Said he’d never had a sitter keep so still.'],
      ['P','A sitter? She was HERE? He found her?'],
      ['W','…Finish the hand.'],
    ],
    outro:[
      ['N','The stone orange goes back into the stone hand. It fits as if it never left.'],
      ['W','He came home in 1921, old and tired and done with looking. And the orangery smelled of oranges.'],
      ['W','The housekeeper had hired a gardener while he was away. A widow from Cork, red hair going grey. She’d kept his forty trees alive for six years.'],
      ['P','The girl from the ship.'],
      ['W','Clara. She saw the house in the papers, the jar king who built an orangery in Wisconsin, and she knew. So she came, and she waited.'],
      ['P','Why didn’t she just write to him?'],
      ['W','She said a man who plants forty orange trees for you can come home and find you himself.'],
      ['W','They had eleven years. He put her on the gate so she’d be the first thing anyone saw.'],
      ['M','<em>(Garibaldi walks to the plinth and settles at its foot, exactly where the moss is worn smooth.)</em>'],
      ['W','Clara was my grandmother. I’ve kept her trees for fifty-one years. Somebody had to.'],
      ['P','Wilf. The park opens in the spring. It’s going to be called Clara’s Garden.'],
      ['W','<em>(Wilf looks at the hosepipe for a very long time.)</em>'],
      ['N','The garden is yours. Merge as long as you like. There are still pieces of Emilio’s story nobody has found.'],
    ]},
];

/* orders. Big beats carry `more`: a short exchange where the cast confirm what just happened. */
const TASKS = [
  // ch1: the garage
  {ch:0, who:'P', need:[['D',2]], coins:8, say:'This phone still has a dial tone! Bring me a brass “1” from it. I need to ring somebody about the brambles.', beat:['P','Engaged. The council’s line has been engaged since 1971, apparently.']},
  {ch:0, who:'W', need:[['GB',2]], coins:8, say:'Feed the mulcher and get me some cuttings. If the hedge sees we mean business it might behave.', beat:['W','There. Now she knows we’re serious.']},
  {ch:0, who:'M', need:[['GB',1]], coins:6, say:'(Garibaldi is staring at the seedlings. He has been staring for some time.)', beat:['M','<em>(He eats one seedling, very slowly, and looks at you as if you’ve done well.)</em>']},
  {ch:0, who:'P', need:[['D',3],['GB',2]], coins:10, say:'A “2” for the gate code and some cuttings for the planters. I want the drive to look less haunted.', beat:['P','Less haunted. Still a bit haunted. It’s a start.']},
  {ch:0, who:'W', need:[['GB',3]], coins:10, say:'A potted shrub by the garage door. His father kept one there, for luck.', beat:['W','A lemon tree, by the till. Never fruited once in thirty winters. He kept it anyway.']},
  // ch2: brambles
  {ch:1, who:'P', need:[['M',1]], coins:12, say:'There’s a steamer trunk in the brambles with a name on it. Bring it up to the house. Carefully!', beat:['P','E. Bellavista. Genoa to New York. He was nine.'], more:[['W','Nine years old, two weeks in steerage. No wonder he never sat still after.']]},
  {ch:1, who:'W', need:[['GB',4]], coins:12, say:'A topiary tree for the gate. Even an empty plinth deserves company.', beat:['W','He had it clipped into a swan. I’ve only ever managed a duck.']},
  {ch:1, who:'M', need:[['D',4],['GB',3]], coins:12, say:'(Garibaldi has knocked a “3” behind the shrubs and is sitting on a pot. He would like both back.)', beat:['M','<em>(He accepts both with great dignity and goes to sleep on them.)</em>']},
  {ch:1, who:'P', need:[['D',5]], coins:14, say:'A “4” for the house number. Bellavista House, number four. There are no numbers one to three. Nobody knows why.', beat:['P','Wilf says Emilio bought the whole street, then couldn’t decide where to start.']},
  {ch:1, who:'W', need:[['GB',5]], coins:16, say:'Bring me a garden bench. I’ve been standing up for fifty-one years and I’d like a sit.', beat:['W','Ahh. That’s the stuff. Don’t tell Priya.']},
  // ch3: the orangery
  {ch:2, who:'P', need:[['M',2]], coins:16, say:'Wilf says there’s a ship’s ticket somewhere in the orangery soil. Find it before he “tidies” it.', beat:['P','Steerage, 1893. Look, there’s an orange drawn in the corner. A child’s drawing.'], more:[['W','Not his. Hers.'],['P','Whose?'],['W','Ask me tomorrow.']]},
  {ch:2, who:'W', need:[['D',6],['GB',4]], coins:16, say:'A “5” for the glasshouse thermostat and a topiary for the door. Oranges need coaxing.', beat:['W','Fifty-five degrees. Not one less. Clara’s rule.'], more:[['P','Who’s Clara?'],['W','Did I say Clara? Fifty-five degrees.']]},
  {ch:2, who:'M', need:[['GB',5]], coins:16, say:'(Garibaldi wants a bench in the orangery, by the oldest tree. He is very clear about this.)', beat:['M','<em>(He doesn’t sit on it. He sits beside it, as if he’s saving it for somebody.)</em>']},
  {ch:2, who:'P', need:[['M',3]], coins:18, say:'There were jars in that trunk. Mama’s preserves, Wilf says. I want one for the house.', beat:['P','Half of them leaked on the crossing. Look at that lid. Terrible lid.'], more:[['W','He thought so too. Nine years old and already cross about lids.']]},
  {ch:2, who:'W', need:[['D',7],['M',3]], coins:18, say:'A “6” for the old railway timetable, and another of Mama’s jars. I’ve a hunch about something.', beat:['W','Train west, 1894. Papa opened a hardware shop by the lake. Nails, string and very good marmalade.']},
  // ch4: postcards
  {ch:3, who:'P', need:[['M',4]], coins:20, say:'A railway ticket keeps turning up in the fountain. Bring it to me. I’m building a timeline.', beat:['P','New York, then Wisconsin. And a girl on a boat. Why is she in every story and nowhere in the records?']},
  {ch:3, who:'W', need:[['GB',5],['D',7]], coins:20, say:'Another bench, and a “6”. The potting shed has a combination lock and I’ve forgotten it. Twice.', beat:['W','Six-six-six. He had a sense of humour, Emilio.']},
  {ch:3, who:'M', need:[['M',5]], coins:20, say:'(Garibaldi is scratching at a painted sign in the fountain. He wants it hung up.)', beat:['M','<em>(Once it’s hung, he sits under it and doesn’t move until supper.)</em>'], more:[['W','He was Papa’s tortoise first. Came over from Genoa in a hatbox.'],['P','He’s a hundred and thirty?'],['W','He doesn’t like to talk about it.']]},
  {ch:3, who:'P', need:[['D',8],['GB',4]], coins:22, say:'A “7” for the postcard boxes and a topiary for the shed. I’m sorting all of them, every single one.', beat:['P','Four hundred and twelve postcards. Not one name. Just “the girl with the oranges”.']},
  {ch:3, who:'W', need:[['M',6]], coins:24, say:'His school satchel is in that fountain somewhere. Fifteen, he was, when he left school.', beat:['W','Left school, swept his father’s floor and never complained once. Well. Once. Loudly.']},
  // ch5: the empty plinth
  {id:20, ch:4, who:'P', need:[['SJ',1]], coins:26, say:'Put the statue back together and the stonemason’s yard comes back to life. Bring me the first thing it carves.', beat:['N','A woman in a gardener’s apron, one hand held out. The hand is gone.'], more:[['P','Wilf. Who is she?'],['W','Finish her and I’ll tell you.']]},
  {id:23, ch:4, who:'P', after:true, need:[['SJ',3]], coins:28, say:'Now the yard’s carving again, bring me a terracotta pot. Practice, before we carve the hand.', beat:['P','Wonky. Characterful. Wilf says that’s what the stonemason used to say.']},
  {id:21, ch:4, who:'W', need:[['M',7]], coins:26, say:'There’s a shop broom in the story pile. He swept that floor every morning before school, then instead of school.', beat:['W','He was sweeping up a smashed jar when it came to him. A lid that screws on and never leaks.']},
  {id:22, ch:4, who:'M', need:[['D',8],['GB',5]], coins:26, say:'(Garibaldi has pushed a “7” and a bench up against the plinth. He wants a seat with a view.)', beat:['M','<em>(He watches the gate all afternoon, as if somebody is due.)</em>']},
  {id:24, ch:4, who:'W', need:[['M',8]], coins:30, say:'Bring me the twist lid. The very first one. It’s in the story pile somewhere, I’d stake my hosepipe on it.', beat:['W','The Bellavista lid. Every kitchen in the country had one by 1910.'], more:[['P','So he was rich. Why not hire somebody to find her?'],['W','He did. Eleven detectives. Then he went himself.']]},
  // ch6: the stone orange
  {id:25, ch:5, who:'P', need:[['SJ',5],['GB',4]], coins:32, say:'A carving block from the yard and a topiary for the gate post. We’re nearly there.', beat:['P','The gate post says 1921. Wilf says that’s the year he came home.']},
  {id:26, ch:5, who:'W', need:[['M',9]], coins:34, say:'The factory deed. Bring it. I want it framed in the hall, where she wanted it.', beat:['W','She said a man should be proud of a good lid. She was the only one who never laughed at it.'], more:[['P','She. You keep saying she.'],['W','Do I.']]},
  {id:27, ch:5, who:'M', need:[['SJ',6],['GB',5]], coins:34, say:'(Garibaldi has his nose against the stone hand. He wants it finished, and a bench to watch from.)', beat:['M','<em>(He has decided the stone face is somebody he knows.)</em>']},
  {id:28, ch:5, who:'P', need:[['D',8]], coins:36, say:'One more number. A “7”. The gate code is 1-9-2-1 and the lock wants a 7 to reset, don’t ask me why.', beat:['P','The gate swings open on its own, which is either the wind or a sign. I choose sign.']},
  {id:29, ch:5, who:'O', need:[['SJ',8],['M',8]], coins:50, say:'“For the gate. Finish her hand, and bring the story home.”'},
];

/* the Star Board: six event levels, as in the original. The statue comes from here. */
const PASS=[
  {pts:20, rw:[['ST',1]]},
  {pts:45, rw:[['ST',1],['H',1]]},
  {pts:80, rw:[['ST',2],['ET',1]]},
  {pts:115, rw:[['C',3],['DR',1]]},
  {pts:150, rw:[['H',2],['ET',1]]},
  {pts:190, rw:[['SJ',4],['C',4]]},
];
const FELIX=[
  [['N','Tucked into the reward: a postcard. Cairo, 1912. Never sent.'],['F','“To the girl with the oranges. I am in Egypt. The oranges here are very good but not as good as yours. I have looked in every market. If you are reading this, I am still looking. — E.”']],
  [['N','Another postcard, the last in the box. Cork, 1920.'],['F','“To the girl with the oranges. I came to Ireland because your hair was the colour of the hills here. Nobody remembers a girl on a ship. I am going home. I have kept your trees. — E.”'],['W','<em>(Wilf reads it twice and puts it in his top pocket.)</em>']],
];
const MOON_NOTES=[
  [['N','Folded inside the sparkle: a page from Wilf’s garden diary.'],['W','“Day one. Planted nothing. Watched the tortoise. He watched me back. I think I have the job.”']],
  [['W','“The oranges must be at fifty-five degrees. Somebody taught me that a long time ago. I still check it twice a day.”']],
  [['W','“Somebody asked me today why I never left. I said the trees need me. That’s mostly true.”']],
  [['W','“Somebody once told me the best things grow where you can see them from the gate. I didn’t understand until I was fifty.”']],
];
const P2={ shopName:'Mrs Lindqvist’s Garden Shop', shopBlurb:'Mrs Lindqvist sells whatever turns up in the old shed' };
/* the event shop, as in the original: rising prices on numbers and shards, flat prices on the rest */
const SHOP_ITEMS=[
  {id:'Z0', item:['D',1], price:{base:15, mult:1.3, max:120}, what:'A brass “0”, for the mulcher or for merging. Gets dearer each time'},
  {id:'V1', item:['V',1], price:{base:12, mult:1.3, max:60}, what:'A time charger shard. Gets dearer each time'},
  {id:'H1', item:['H',1], price:40, what:'Skips 15 minutes on every generator'},
  {id:'DR', item:['DR',1], price:20, what:'Clears one cobwebbed tile'},
  {id:'ET', item:['ET',1], price:30, what:'Refills one generator. Drag it onto the one you need'},
];

const REFLECTIONS=[
  ['N','Spring. Clara’s Garden opens at nine. There’s a queue by half past eight.'],
  ['P','Forty orange trees, and every one of them in fruit. Wilf won’t say how.'],
  ['W','Fifty-five degrees. And talking to them. Gran talked to them every morning. So did he, once he was home.'],
  ['P','He crossed the whole world looking for her, and she was in his garden the entire time.'],
  ['W','She liked that, I think. Being found, instead of finding.'],
  ['M','<em>(Garibaldi has taken up position at the foot of the statue. Visitors have started leaving him lettuce.)</em>'],
  ['P','Twelve detectives, four hundred postcards and a jar factory. All because of some oranges on a boat.'],
  ['W','Eleven detectives. And it wasn’t the oranges. It was that she shared them. Nobody shared anything in steerage.'],
  ['N','In the hall, framed: the factory deed, and beside it, in wax paper, a hundred-year-old orange peel.'],
  ['P','Wilf. Why did you stay? Really.'],
  ['W','Somebody had to keep her trees. And somebody had to wait for the right person to come and finish her hand.'],
  ['W','Took fifty-one years. Worth it.'],
];

/* every generator gets a little story the first time it appears */
const GEN_STORY={
  gX1:[['P','A pallet of boxes, still shrink-wrapped. The label says “Bellavista Jar Works, Seconds”.'],['W','Papa’s old shop stock. Tills, clocks, all sorts. He never threw anything away.']],
  gX2:[['P','Two pallets, stacked. That’s a lot of unpacking.'],['W','That’s a lot of finding things.']],
  gR1:[['P','An old shop till. It still rings!'],['W','Papa’s. It came from the hardware store. There’s a telephone wedged in the cash drawer, don’t ask me why.']],
  gR2:[['P','A proper brass cash register. It weighs as much as I do.'],['W','Emilio bought it with his first factory wages. For his father. His father never used it. Too fancy.']],
  gR3:[['W','The counting house. The whole factory office, more or less.'],['P','There’s a drawer marked “Detectives”. It’s full of receipts.']],
  gP1:[['P','A rotary phone. And a little brass number fell out of the dial.'],['W','Those numbers are what the mulcher runs on. It has a combination lock. I fitted it after the incident.'],['P','What incident?'],['W','We don’t talk about the incident.']],
  gP2:[['P','A candlestick telephone. It rings by itself sometimes.'],['W','So did the old one. Garibaldi sits on the line.']],
  gP3:[['W','The old switchboard. Emilio had one put in so he could ring every shipping office in New York at once.'],['P','That is either romantic or terrifying.']],
  gC1:[['P','A grandfather clock. It’s stopped at ten past four.'],['W','Stopped the day he died, 1932. Nobody’s had the heart to wind it. You can, if you like. It makes good time charger shards.']],
  WC1:[['W','The mulcher. She eats what you give her and gives you seedlings. Show her the right brass number or she sulks.'],['M','<em>(Garibaldi retreats a respectful distance.)</em>']],
  GB6:[['P','A fountain! And something’s caught in the basin. A ticket?'],['W','Things turn up in that fountain. Bits of him. Always have.']],
  GB7:[['W','The gazebo. He used to sit in there in the evenings, at the end.'],['P','On his own?'],['W','Ask me another time.']],
  GB8:[['P','A garden folly. A tiny castle for no reason at all.'],['W','There was a reason. Somebody’s birthday. He never said whose.']],
  ST3:[['W','The stonemason’s yard. The old man’s chisels, cleaned and oiled.'],['P','Let’s finish her.']],
};

/* little goals that run all event */
const QUESTS=[
  {id:'gen',     ic:'🔨', n:'Use generators',        steps:[25,100,250,500,1000,2000]},
  {id:'merge',   ic:'🔗', n:'Make merges',           steps:[20,50,150,300,600,1200]},
  {id:'compost', ic:'⚙️', n:'Feed the mulcher',       steps:[3,10,25,50]},
  {id:'story',   ic:'📜', n:'Fill story orders',     steps:[3,10,20]},
  {id:'high',    ic:'🌟', n:'Make level 5+ items',   steps:[3,10,25,60]},
  {id:'claim',   ic:'🪙', n:'Claim coins & stars',   steps:[10,40,100,250]},
  {id:'open',    ic:'📦', n:'Open boxes & cobwebs',  steps:[10,25,45]},
  {id:'disc',    ic:'🧩', n:'Discover new items',    steps:[15,30,50,70]},
  {id:'sell',    ic:'🪙', n:'Sell items',            steps:[5,20,50]},
];
