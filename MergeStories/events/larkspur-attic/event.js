/* Larkspur Attic: a Merge Stories cartridge (the Second Pass balance). Words, cast, chains, board, orders,
   balance, cover, colours and music for this story. The engine is shared. */
const EVENT = {
  id: 'larkspur-attic', title: 'Larkspur Attic', tagline: 'The Vanishing Moon', version: 'v8',
  themeColor: '#1a1316',
  cover: { art: "<svg class=\"cover\" viewBox=\"0 0 360 230\" role=\"img\" aria-label=\"Moonlight through a round attic window onto a trunk and a black cat\"><defs><radialGradient id=\"atGlow\" cx=\".5\" cy=\".42\" r=\".6\"><stop offset=\"0\" stop-color=\"#4a2c36\"/><stop offset=\"1\" stop-color=\"#1a1316\"/></radialGradient><radialGradient id=\"atBeam\" cx=\".5\" cy=\"0\" r=\"1\"><stop offset=\"0\" stop-color=\"#f4e8d3\" stop-opacity=\".22\"/><stop offset=\"1\" stop-color=\"#f4e8d3\" stop-opacity=\"0\"/></radialGradient></defs><rect width=\"360\" height=\"230\" fill=\"url(#atGlow)\"/><path d=\"M0 0 L180 -40 L360 0 V20 L180 -18 L0 20Z\" fill=\"#2c1e22\"/><path d=\"M40 0 L40 230 M320 0 L320 230\" stroke=\"#3f2c21\" stroke-width=\"10\"/><path d=\"M0 28 L180 -8 L360 28\" stroke=\"#3f2c21\" stroke-width=\"12\" fill=\"none\"/><circle cx=\"180\" cy=\"78\" r=\"46\" fill=\"#0f1a2c\" stroke=\"#4a3427\" stroke-width=\"9\"/><path d=\"M180 32 V124 M134 78 H226\" stroke=\"#4a3427\" stroke-width=\"4\"/><circle cx=\"196\" cy=\"66\" r=\"15\" fill=\"#f4e8d3\"/><circle cx=\"190\" cy=\"62\" r=\"13\" fill=\"#0f1a2c\"/><g fill=\"#f4e8d3\" opacity=\".8\"><circle cx=\"160\" cy=\"60\" r=\"1.4\"/><circle cx=\"208\" cy=\"98\" r=\"1.1\"/><circle cx=\"165\" cy=\"100\" r=\"1\"/></g><path d=\"M150 124 L110 230 H250 L210 124Z\" fill=\"url(#atBeam)\"/><rect x=\"0\" y=\"196\" width=\"360\" height=\"34\" fill=\"#2c1e22\"/><path d=\"M0 196 H360\" stroke=\"#4a3427\" stroke-width=\"3\"/><g transform=\"translate(118 150)\"><rect width=\"96\" height=\"50\" rx=\"5\" fill=\"#a3303d\"/><rect y=\"0\" width=\"96\" height=\"16\" rx=\"5\" fill=\"#c9455a\"/><path d=\"M0 16 H96\" stroke=\"#e4b84c\" stroke-width=\"2\"/><rect x=\"40\" y=\"10\" width=\"16\" height=\"12\" rx=\"2\" fill=\"#e4b84c\"/><path d=\"M0 0 h8 v50 h-8z M88 0 h8 v50 h-8z\" fill=\"#e4b84c\" opacity=\".7\"/></g><g transform=\"translate(232 170)\" fill=\"#0b0809\"><ellipse cx=\"18\" cy=\"22\" rx=\"16\" ry=\"11\"/><circle cx=\"32\" cy=\"8\" r=\"9\"/><path d=\"M26 2 l3 -8 l4 7z M34 1 l4 -7 l2 8z\"/><path d=\"M2 24 q-14 -4 -8 -18\" stroke=\"#0b0809\" stroke-width=\"4\" fill=\"none\" stroke-linecap=\"round\"/></g><circle cx=\"263\" cy=\"177\" r=\"1.6\" fill=\"#e4b84c\"/><circle cx=\"268\" cy=\"177\" r=\"1.6\" fill=\"#e4b84c\"/><g fill=\"#e4b84c\"><path d=\"M74 150 l3 7 l7 1 l-5 5 l1 7 l-6 -4 l-6 4 l1 -7 l-5 -5 l7 -1z\" opacity=\".75\"/></g><text x=\"70\" y=\"192\" font-size=\"18\">🃏</text></svg>", sub: 'The Vanishing Moon',
    key: [["🌙", "Find out who Great-Aunt Odile really was"], ["🧩", "Merge and fill orders to clear her attic"], ["☀️", "No timer. Play at your own pace"]],
    more: ["Tap a generator twice to make items", "Drag two matching items together to merge", "Merges open the boxes next to them", "Fill orders to uncover Odile’s story", "Tap coins and stars twice to claim", "Generators are free to tap; they rest after a while and ⏲️ egg timers refill one", "Tea isn’t for drinking: drop it on a generator and it finds rare items more often", "Tap 🪙 for Mrs Pike’s shop", "Jumble Sale orders are always open", "Claim moons 🌑 for Moon Pass rewards; merged moons are worth more", "No timer. Play at your own pace", "📖 Quests and new finds pay out rewards"] },
  terms: {
    passName: 'Moon Pass', tokenNoun: 'moon', tokenIcon: '🌙',
    passHelp: '• Moon tokens 🌑 drop from generators and orders<br>• Tap twice to claim them any time: 🌑 1 · 🌒 3 · 🌓 7 · 🌕 16 points<br>• Merging first is worth more, but takes board space<br>• Every 3rd reward comes with a letter from Felix ✉️',
    notesTitle: 'Odile’s moon notebook', notesItem: 'A page from Odile’s moon notebook is folded inside. Tap it to read. It can’t be merged until you do.',
    lettersTitle: 'Felix’s letters', letterWord: 'Letter',
    sheetBlocked: 'That part of the attic is still under dust sheets.', sheetTap: 'Still under dust sheets.',
    sideSold: '🏷️ Sold at the jumble sale. Rewards are on the board',
    sideSay: 'For the church jumble sale. Anything you can spare.', sideLucky: 'A lucky find! Something small for the jumble sale.',
    doneTitle: 'The attic is yours', doneHas: 'You found the Vanishing Moon. Odile would be smug.', doneNot: 'Keep merging. The Circus Trunk still hides one last secret.',
    presentDesc: 'Something new for the attic.',
    loreFound: 'Found in the Circus Trunk', loreHeading: 'The Great Odelia', loreEmpty: 'Nothing yet. Somewhere up here is a trunk with no keyhole.',
  },
  complete: { title: 'The Vanishing Moon', text: 'You restored Odile’s attic and found out who she really was.',
    note: 'The board stays open. Merge as long as you like. The Circus Trunk chain has one level nobody has reached yet.' },
  css: ":root{--bg:#1a1316;--panel:#271c1f;--panel2:#30232a;--wood:#4a3427;--wood2:#3f2c21;--ink:#f4e8d3;--muted:#b8a387;--gold:#e4b84c;--velvet:#a3303d}\nbody{background-image:radial-gradient(120% 60% at 50% -10%, #3a2530 0%, transparent 60%)}\n#title{background-image:radial-gradient(90% 55% at 50% 30%,#4a2c36 0%,transparent 70%)}\n#board{box-shadow:0 0 0 3px #2a1d16,0 0 0 4px #6b4a33,0 14px 30px #0008}\n.cell.sheet{background:repeating-linear-gradient(115deg,#5e5248 0 7px,#544940 7px 15px)}\n.dlg{background:linear-gradient(180deg,#2e2125,#241a1d)}\n.overlay{background:#0d080acc}\n#scene.clear{background:#0d080a33}\n.order.side{background:#2a2420}\n#toast .t{background:linear-gradient(180deg,#3a2b1d,#2c2017);border-color:#e4b84c88}\n#title .go{background:linear-gradient(transparent,var(--bg) 30%)}",
  /* reward numbers (the engine hands them out). Tables read "value or more → level": [[30,3],[14,2],[0,1]] */
  rewards: {
    order: { coins:[[30,3],[14,2],[0,1]], xp:[[4,3],[2,2],[0,1]], points:[[3,2],[0,1]] },
    finale: [['C',4],['X',4],['N',3]],
    side: { coins:[[28,4],[12,3],[4,2],[0,1]], bigPoints:24, timerAt:12, timerChance:.3, lucky:[['C',1],['N',1]] },   // a level-4 item pays a level-2 coin
    discovery: { coinsPerLevel:2, xpFrom:5 },
    quests: [[['C',1],['E',1]],[['C',2],['E',2]],[['E',3],['H',1]],[['E',3],['H',2],['N',1]],[['E',4],['H',2],['N',2]],[['E',4],['H',3],['N',3]]],
  },
  wheel: null,
  /* slow, warm 4/4 chill: pads, sub bass, soft keys, a faint arpeggio */
  music: { bpm: 76, beats: 128,
    mix: { lp: 2200, send: .55, rev: .5, fb: .3, dlp: 1300, wet: .22, wetToRev: true },
    pad: { wave: 'sawtooth', det: 9, g: .022, a: 1.4, lp: [520, 900, 560], sub: .9 },
    compose({voice, pad, BEAT, rnd}) {
  const PROGS=[
    [[45,[57,60,64,67]],[41,[57,60,64,65]],[36,[55,60,64,67]],[43,[55,59,62,65]]],   // Am7  Fmaj7  Cadd  G7sus-ish
    [[38,[57,60,62,65]],[41,[57,60,64,65]],[40,[56,59,62,64]],[40,[56,59,64,68]]],   // Dm7  Fmaj7  E7   E
    [[36,[55,59,64,67]],[45,[57,60,64,67]],[41,[57,60,65,69]],[43,[55,59,62,67]]],   // Cmaj7 Am7  F    G
    [[36,[55,59,64,67]],[40,[55,59,64,67]],[41,[57,60,64,69]],[43,[55,59,62,65]]],   // Cmaj7 Em7  Fmaj7 G7
  ];
  const SCALE=[57,59,60,62,64,65,67,69,71,72];
      const bass=(m,t,dur,g=.17)=>{ voice({m,t,dur,g,a:.06,wave:'sine',det:0,lp:300}); voice({m,t,dur:dur*.6,g:g*.18,a:.05,wave:'triangle',det:3,lp:420}); };
      const keys=(m,t,g,dur)=>{ voice({m,t,dur,g,a:.025,wave:'triangle',det:6,lp:1500,lpEnd:550}); voice({m:m+12,t,dur:dur*.4,g:g*.15,a:.02,wave:'sine',det:3,lp:2000}); };
      const STEPS=128;
    let lastNote=57;
    for(let step=0;step<STEPS;step++){
      const t=step*BEAT+.01, bar=Math.floor(step/4), beat=step%4, phrase=Math.floor(bar/4);
      const [root,chord]=PROGS[phrase%PROGS.length][bar%4];
      if(beat===0){ pad(chord,t,BEAT*4.6); bass(root,t,BEAT*2.8); }
      if(beat===2 && rnd()<.5) bass(root+(rnd()<.5?7:12),t,BEAT*1.6,.1);
      if(phrase%2===1){ [0,.5].forEach(h=>{ const n=chord[(step*2+h*2)%chord.length]+12; voice({m:n,t:t+h*BEAT,dur:BEAT*.9,g:.012,a:.01,wave:'triangle',det:5,lp:1700,lpEnd:600}); }); }
      const p = beat===0?.7 : beat===2?.4 : .15;
      if(rnd()<p && !(bar%4===3 && beat>1)){
        const pool = beat===0 ? chord.map(x=>x+12).concat(chord.filter(x=>x>=57)) : SCALE;
        let target=pool[Math.floor(rnd()*pool.length)];
        if(Math.abs(target-lastNote)>7) target=pool.reduce((a,b)=>Math.abs(b-lastNote)<Math.abs(a-lastNote)?b:a);
        lastNote=target; keys(target,t,.07,BEAT*(beat===0?3:2));
      }
    }
    } },
};

const CONFIG = {
  cols: 7, rows: 9,
  saveKey: 'merge-stories:larkspur-attic', legacySaveKey: 'larkspur-attic-pass2',
  sideOpen: true,         // the Jumble Sale is open from the start
};

const CHAINS = {
  P:{name:'Papers', items:[
    {e:'📄',n:'Torn Scrap'},{e:'📃',n:'Note'},{e:'✉️',n:'Envelope'},{e:'📨',n:'Letter Bundle'},
    {e:'📔',n:'Diary'},{e:'📚',n:'Diary Stack'},{e:'🗃️',n:'Archive Box'}]},
  F:{name:'Fabric', items:[
    {e:'🧵',n:'Thread'},{e:'🧶',n:'Yarn'},{e:'🧦',n:'Odd Sock'},{e:'🧤',n:'Opera Gloves'},
    {e:'🧣',n:'Silk Scarf'},{e:'👗',n:'Stage Gown'},{e:'🎭',n:'Costume Masks'}]},
  T:{name:'Tools', items:[
    {e:'🔩',n:'Bolt'},{e:'🔧',n:'Wrench'},{e:'🔨',n:'Hammer'},{e:'🪛',n:'Screwdriver'},
    {e:'🪚',n:'Saw'},{e:'🛠️',n:'Tool Roll'},{e:'⚒️',n:"Stagehand's Tools"}]},
  L:{name:'Lights', items:[
    {e:'🕯️',n:'Candle Stub'},{e:'💡',n:'Bulb'},{e:'🔦',n:'Torch'},{e:'🏮',n:'Paper Lantern'},
    {e:'🪔',n:'Oil Lamp'},{e:'🔆',n:'Spotlight'}]},
  /* resource chains: tap twice to claim, or merge first for a bigger payout (values follow Merge Mansion's 2/6/16/40/100 curve) */
  E:{name:'Tea Time', type:'boost', items:[
    {e:'🍬',n:'Sugar Lump',v:2},{e:'🍪',n:'Biscuit',v:6},{e:'☕',n:'Cuppa',v:16},
    {e:'🧁',n:'Cupcake',v:40},{e:'🍰',n:'Victoria Sponge',v:100}]},
  C:{name:'Coins', type:'res', claim:'coins', items:[
    {e:'🪙',n:'Old Penny',v:2},{e:'💷',n:'Banknote',v:5},{e:'👛',n:'Coin Purse',v:12},
    {e:'💰',n:'Money Bag',v:30},{e:'💎',n:'Heirloom Jewel',v:75}]},
  X:{name:'Applause', type:'res', claim:'xp', items:[
    {e:'⭐',n:'Star',v:1},{e:'🌟',n:'Bright Star',v:3},{e:'💫',n:'Shooting Star',v:8},
    {e:'🌠',n:'Star Shower',v:20},{e:'🏆',n:'Standing Ovation',v:50}]},
  N:{name:'Moon Tokens', type:'res', claim:'points', items:[
    {e:'🌑',n:'New Moon',v:1},{e:'🌒',n:'Crescent Moon',v:3},{e:'🌓',n:'Half Moon',v:7},{e:'🌕',n:'Full Moon',v:16}]},
  H:{name:'Time Skips', type:'res', claim:'skip', items:[{e:'⏳',n:'Hourglass',v:15},{e:'⌛',n:'Sand Timer',v:60},{e:'🗓️',n:'Calendar Page',v:240}]},
  /* rare chains: each generator's occasional bonus drop */
  K:{name:'Keepsakes', rare:true, items:[{e:'🔖',n:'Bookmark'},{e:'🎟️',n:'Ticket Stub'},{e:'🖼️',n:'Photograph'},{e:'📸',n:'Box Camera'}]},
  B:{name:'Haberdashery', rare:true, items:[{e:'🔘',n:'Button'},{e:'🎀',n:'Silk Bow'},{e:'👒',n:'Bonnet'},{e:'👑',n:'Paste Tiara'}]},
  W:{name:'Clockwork', rare:true, items:[{e:'⚙️',n:'Cog'},{e:'🗝️',n:'Wind-up Key'},{e:'⏱️',n:'Stopwatch'},{e:'🕰️',n:'Mantel Clock'}]},
  R:{name:'Music', rare:true, items:[{e:'🎵',n:'Sheet Music'},{e:'🎶',n:'Duet Score'},{e:'📻',n:'Wireless Set'},{e:'🎻',n:'Violin'}]},
  M:{name:'The Great Odelia', story:true, items:[
    {e:'🃏',n:'Playing Card', lore:'The ace of moons. There is no such card. This one was printed for a single show, in 1968.'},
    {e:'🎴',n:'Trick Deck', lore:'Fifty-two cards, every one the ace of moons. A note in the box: “Nobody checks. Nobody ever checks.”'},
    {e:'🪄',n:'Wand', lore:'Ebony with a silver cap. Her initials, O.L., are worn almost smooth where her thumb rested.'},
    {e:'🎩',n:'Top Hat', lore:'Felix’s. The label says “If found, return to the better magician.” It is crossed out. Underneath, in Odile’s hand: “I have.”'},
    {e:'🐇',n:'White Rabbit', lore:'A programme note: “The rabbit is played by Bertrand.” Bertrand had a pension and his own dressing room.'},
    {e:'🕊️',n:'Paper Dove', lore:'Folded from one of Felix’s letters. You can still read the word “sorry” along one wing.'},
    {e:'🔮',n:'Crystal Ball', lore:'Not crystal. Glass, polished by hand until it holds the whole attic upside down.'},
    {e:'🌙',n:'The Vanishing Moon', lore:'The full method, written out. Two pages. The second page is a drawing of a black cat.'}]},
  /* egg timers: drag onto a generator to refill it straight away */
  ET:{name:'Egg Timers', items:[{e:'⏲️',n:'Egg Timer'}]},
  /* generators */
  gD:{name:'Paper Tray', gen:true, main:'P', rare:'K', items:[
    {e:'🗂️',n:'Paper Tray', charges:24, rechargeMs:60000, drop:[['P',1,75],['P',2,10],['K',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5]]},
    {e:'🗄️',n:'Writing Bureau', charges:20, rechargeMs:75000, drop:[['P',1,44],['P',2,28],['P',3,10],['K',1,9],['K',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5]]},
    {e:'🖨️',n:'Printing Press', charges:16, rechargeMs:90000, drop:[['P',1,22],['P',2,30],['P',3,22],['P',4,6],['K',1,8],['K',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6]]}]},
  gS:{name:'Sewing Basket', gen:true, main:'F', rare:'B', items:[
    {e:'🧺',n:'Sewing Basket', charges:24, rechargeMs:60000, drop:[['F',1,75],['F',2,10],['B',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5]]},
    {e:'🪡',n:'Sewing Kit', charges:20, rechargeMs:75000, drop:[['F',1,44],['F',2,28],['F',3,10],['B',1,9],['B',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5]]},
    {e:'🧷',n:'Tailor’s Studio', charges:16, rechargeMs:90000, drop:[['F',1,22],['F',2,30],['F',3,22],['F',4,6],['B',1,8],['B',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6]]}]},
  gT:{name:'Toolbox', gen:true, main:'T', rare:'W', items:[
    {e:'🧰',n:'Toolbox', charges:24, rechargeMs:60000, drop:[['T',1,75],['T',2,10],['W',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5]]},
    {e:'🗜️',n:'Workbench', charges:20, rechargeMs:75000, drop:[['T',1,44],['T',2,28],['T',3,10],['W',1,9],['W',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5]]},
    {e:'🏭',n:'Stage Workshop', charges:16, rechargeMs:90000, drop:[['T',1,22],['T',2,30],['T',3,22],['T',4,6],['W',1,8],['W',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6]]}]},
  gL:{name:'Fuse Box', gen:true, main:'L', rare:'R', items:[
    {e:'🔌',n:'Fuse Box', charges:24, rechargeMs:60000, drop:[['L',1,75],['L',2,10],['R',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5]]},
    {e:'🎚️',n:'Lighting Desk', charges:20, rechargeMs:75000, drop:[['L',1,44],['L',2,28],['L',3,10],['R',1,9],['R',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5]]},
    {e:'🎇',n:'Stage Lights', charges:16, rechargeMs:90000, drop:[['L',1,22],['L',2,30],['L',3,22],['L',4,6],['R',1,8],['R',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6]]}]},
  gM:{name:'Circus Trunk', gen:true, main:'M', rare:'X', items:[
    {e:'🎪',n:'Circus Trunk', charges:24, rechargeMs:60000, drop:[['M',1,80],['M',2,8],['X',1,7],['C',1,5],['N',1,5]]},
    {e:'🪞',n:'Magic Mirror', charges:20, rechargeMs:75000, drop:[['M',1,50],['M',2,26],['M',3,10],['X',1,8],['X',2,3],['C',1,3],['N',1,5]]},
    {e:'✨',n:'Grand Illusion', charges:16, rechargeMs:90000, drop:[['M',1,26],['M',2,30],['M',3,20],['M',4,6],['X',1,8],['X',2,4],['C',1,2],['N',1,6]]}]},
  gK:{name:'Kettle', gen:true, main:'E', items:[
    {e:'🫖',n:'Kettle', free:true, charges:3, rechargeMs:480000, drop:[['E',1,70],['E',2,25],['E',3,5]]}]},
};

const LAYOUT = [
  'bM4 bF5 bC3 bP5 bgT1 bL4 bM3',   // zone 3 — opens chapter 4
  'bP3 wM2 bT4 bgM1 bF2 wL2 bX2',
  'bM2 bL3 bgD1 bF4 bT3 bgL1 bP4',  // zone 2 — opens chapter 3
  'wM1 bE2 bT1 bP2 wL1 bF3 bM1',
  'bF3 bP2 bL1 bgS1 bT2 bC2 bF1',   // zone 1 — opens chapter 2
  'wT1 bL2 bP1 wE2 bF2 wT2 bP3',
  'bP1 bgT1 wP1 bF2 wF1 bX1 bT1',   // zone 0 — start
  'wF2 oP1 o. o. o. oF1 wP2',
  'oE1 ogD1 o. o. o. ogS1 oE1',
];


const CAST = {
  N:{name:'', av:''},
  T:{name:'Theo', av:'🧔'},
  P:{name:'Mrs Pike', av:'👵'},
  M:{name:'Mothball', av:'🐈‍⬛'},
  O:{name:'Odile’s note', av:'📜'},
  F:{name:'Felix’s letter', av:'✉️'},
  S:{name:'Jumble Sale', av:'🏷️'},
};

const CHAPTERS = [
  { title:'Dust Sheets', zone:0, gifts:[],
    intro:[
      ['N','Great-Aunt Odile left you three things: a tall, thin house on Larkspur Lane, a black cat called Mothball, and a note.'],
      ['O','“Start in the attic. Mind the dust. — O.”'],
      ['T','I’ve brought bin bags and very low expectations. She was a seamstress, Nell. It’ll be buttons all the way down.'],
      ['M','Mrrp. <em>(He sits on a dust sheet and refuses to move.)</em>'],
      ['N','Tap a generator, then tap it again to make something. Drag two matching things together to merge them. Every merge shakes open the boxes beside it.'],
    ],
    outro:[
      ['T','Right. That’s one corner of floor I can actually see.'],
      ['N','Under the last dust sheet, pinned to a rafter with a hatpin: a playing card. The ace of moons. There is no such card.'],
      ['M','<em>(He bats it once, then looks at you as though you ought to know what it means.)</em>'],
      ['P','Coo-ee! Door was open. Oh, you’ve started on her attic. Brave.'],
      ['P','Forty years next door and Odile never let me past the hatch. Mind if I have a nose?'],
    ]},
  { title:'Letters in the Rafters', zone:1, gifts:[['gL',1],['gK',1]],
    intro:[
      ['T','There’s a fuse box up here. Why is there a fuse box in an attic?'],
      ['N','Theo flips the switch. A row of bulbs along the beam stutters on, then off, then on again. It sounds a bit like applause.'],
      ['N','The dust sheets over the next stretch of floor slide away. <em>(A Fuse Box is waiting in your gifts.)</em>'],
      ['P','And you can’t clear an attic without tea. I’ve brought my kettle up. It’s on loan, mind. <em>(Free tea every few minutes. Drop a cup on a generator and it finds rare things more often.)</em>'],
    ],
    outro:[
      ['N','The letters are tied in red ribbon, all addressed to the same name. Not Odile. “The Great Odelia.”'],
      ['P','Paris. Vienna. The Palladium. Those are theatre letterheads, love.'],
      ['T','Your quiet seamstress aunt was on the stage?'],
      ['N','One letter is shorter than the rest. “The trunk is yours, if you can find it. I never could open it without you. — F.”'],
    ]},
  { title:'The Circus Trunk', zone:2, gifts:[['gM',1]],
    intro:[
      ['N','Behind the next dust sheet sits a striped trunk with brass corners. No keyhole. No hinges.'],
      ['T','It’s a trunk designed by someone who hates trunks.'],
      ['M','<em>(He taps the lid twice with one paw. It clicks open.)</em>'],
      ['T','…Did your cat just—'],
      ['N','<em>(The Circus Trunk is in your gifts. Whatever comes out of it tells Odile’s story.)</em>'],
    ],
    outro:[
      ['P','I remember now. Summer of ’68 she went away. Said she was nursing a sister in Lyon.'],
      ['P','Came back ten years later with that trunk and never said one word about it.'],
      ['N','Inside the lid, a programme: “The Great Odelia & Felix Marchetti present THE VANISHING MOON.”'],
      ['T','Felix. “F.”'],
    ]},
  { title:'The Great Odelia', zone:3, gifts:[['E',2]],
    intro:[
      ['N','The last corner of the attic is darker than the rest, as if the light doesn’t quite want to go there.'],
      ['P','I’m not superstitious. I’m just going to stand here. By the hatch.'],
    ],
    outro:[
      ['N','Odile’s diary, spring 1968: “Felix says the Moon can’t be done. A whole moon, gone, in front of two thousand people. I say it’s only a question of where you make them look.”'],
      ['N','Autumn 1969: “We did it. Then he took the method and ran. Let him. He only has half.”'],
      ['T','Half a trick?'],
      ['P','He stole it. Her own trick, and he walked off with it.'],
      ['T','And she just… let him?'],
      ['P','“Let him.” That’s Odile all over. She never raised her voice. She just went very quiet and very busy.'],
      ['M','<em>(Mothball hops off the diary and sits facing the round window.)</em>'],
    ]},
  { title:'Smoke and Mirrors', zone:null, gifts:[['E',3]],
    intro:[
      ['T','These aren’t shelves. Look at the joins. This whole wall is a stage flat.'],
      ['N','The attic isn’t an attic. Or not only. Odile built a little theatre up here, then hid it under dust sheets.'],
    ],
    outro:[
      ['N','Behind the false wall: a tall mirror on a swivel, angled at the round window. A second diary: “The other half of the Moon is a window, a mirror, and patience.”'],
      ['M','<em>(He jumps onto the sill and sits very straight, like an assistant waiting for a cue.)</em>'],
      ['P','There was always a black cat. Always called Mothball. I assumed it was the same one, for a while there.'],
    ]},
  { title:'The Vanishing Moon', zone:null, gifts:[['E',3]],
    intro:[
      ['O','“Light, cloth, a crystal, and someone who looks.” <em>(Pinned to the mirror.)</em>'],
      ['T','That’s a shopping list. She’s left us a shopping list for a magic trick.'],
    ],
    outro:[
      ['N','You set the crystal ball on its stand. Theo kills the bulbs. Mrs Pike, despite herself, climbs the ladder.'],
      ['N','The full moon sits in the round window. You tilt the mirror. For one long breath the window is empty: just dark sky where the moon should be.'],
      ['T','Where did it go?'],
      ['N','You tilt it back. The moon is where it always was. Mothball purrs like a drum roll.'],
      ['O','“Felix had the trick. I had the reason. It was never about the moon, Nell. It was about two thousand people looking up at once. Keep the attic. Keep the cat. — O.”'],
      ['N','The attic is yours. Merge as long as you like. Somewhere in the Circus Trunk’s chain there is still one thing nobody has seen.'],
    ]},
];

const TASKS = [
  // ch1 — zone 0 only
  {beat:['T','Bin bags tied. And under this sheet… a hatbox full of sequins. Buttons, apparently.'], ch:0, who:'T', need:[['F',2]], coins:8,  say:'Got any yarn? I want to tie these bin bags shut properly.'},
  {beat:['M','(He bats the note under a floorboard. Something underneath it rattles.)'], ch:0, who:'M', need:[['P',2]], coins:8, say:'Mrrp. (He wants a note to bat about under the rafters.)'},
  {beat:['T','These receipts are all from a theatrical costumier in Covent Garden. Forty years of them.'], ch:0, who:'T', need:[['P',3]], coins:10, say:'Find me an envelope for the receipts. There are… a lot of receipts.'},
  {beat:['N','Under the floorboard: a playbill, folded small. The name on it has been scratched out.'], ch:0, who:'M', need:[['T',1],['F',2]], coins:8, say:'(He is pawing at a loose floorboard. A bolt and some yarn might shift it.)'},
  {beat:['T','Hatch fixed. Sock… deployed. Now we can get the big dust sheets off.'], ch:0, who:'T', need:[['T',2],['F',3]], coins:12, say:'Wrench for the hatch hinge, and a sock to stop it squeaking. Don’t ask.'},
  // ch2 — zone 1, fuse box
  {beat:['T','Now I can see the rafters have writing on them. Dates. Cities. Paris, 1964.'], ch:1, who:'T', need:[['L',2]], coins:12, say:'Half these bulbs are dead. Spare one?'},
  {beat:['P','Look at the postmarks. She told us she’d never been further than Brighton.'], ch:1, who:'P', need:[['P',4]], coins:14, say:'Bundle up those letters, dear. Letters want keeping together.'},
  {beat:['M','(He curls up in the opera gloves like they were made for him. They may have been.)'], ch:1, who:'M', need:[['F',4]], coins:12, say:'(He has claimed a pair of opera gloves. Or he would like to.)'},
  {beat:['T','The fuses are labelled in her handwriting. “Stage left.” “Stage right.” “Moon.”'], ch:1, who:'T', need:[['T',3],['L',1]], coins:14, say:'Hammer and a candle. The fuse box has opinions.'},
  {beat:['P','A ticket stub. Front row, the Palladium. She kept one from every night.'], ch:1, who:'P', need:[['P',4],['K',2]], coins:16, say:'Another bundle. And look for ticket stubs tucked in them, I want to see where she played.'},
  {beat:['N','Mothball has found the warmest spot in the attic. It is directly above the dust sheet with the trunk under it.'], x:1, ch:1, who:'M', need:[['F',4],['L',3]], coins:14, say:'(He wants gloves to sleep on and a torch to guard them with.)'},
  // ch3 — zone 2, circus trunk
  {beat:['N','Every card in the deck is the same card. The ace of moons.'], ch:2, who:'M', need:[['M',2]], coins:16, say:'(He drops a playing card at your feet. Then another. He wants the whole deck.)'},
  {beat:['T','The panel opens on a tiny clockwork stage. Little moon, little curtains. It still works.'], ch:2, who:'T', need:[['L',4],['W',2]], coins:18, say:'A lantern and a wind-up key. That panel has a keyhole, and I’m not leaving it alone.'},
  {beat:['P','This silk was a costume once. You can see where the sequins were unpicked.'], ch:2, who:'P', need:[['F',5]], coins:18, say:'Is that silk? Let me see. Oh, that’s real silk.'},
  {beat:['T','I waved it. Nothing happened. I’m a bit gutted, honestly.'], ch:2, who:'T', need:[['M',3]], coins:20, say:'If there’s a wand in that trunk I am absolutely going to wave it.'},
  {beat:['N','The diary he chooses to sit on is the one from 1968.'], ch:2, who:'M', need:[['P',5]], coins:18, say:'(He is sitting on a stack of nothing, waiting for a diary to sit on instead.)'},
  {beat:['P','She tied her letters with silk bows. I used to see them on her doormat.'], x:1, ch:2, who:'P', need:[['P',5],['B',2]], coins:20, say:'A diary and a silk bow to tie it shut. Some secrets want a ribbon.'},
  // ch4 — zone 3
  {beat:['P','It fits. Don’t you dare laugh.'], ch:3, who:'P', need:[['M',4]], coins:22, say:'A top hat! Bring it here, I want to try it on. Don’t tell anyone.'},
  {beat:['T','The stopwatch is stopped at four minutes twelve. The exact length of the Moon act on the programme.'], ch:3, who:'T', need:[['T',5],['W',3]], coins:22, say:'A saw and a stopwatch. Every trick in that corner is timed.'},
  {beat:['N','In the nest of letters: one from Felix. Never opened.'], ch:3, who:'M', need:[['F',5],['P',6]], coins:22, say:'(He has made a nest of letters. It needs a scarf.)'},
  {beat:['T','It’s not a real rabbit. It’s a very good puppet. I’m not crying, it’s dusty.'], ch:3, who:'T', need:[['M',5]], coins:26, say:'The programme says there was a rabbit. I need to see the rabbit.'},
  {beat:['P','She wore this to my wedding. I never knew it was a costume.'], ch:3, who:'P', need:[['B',3],['F',6]], coins:20, say:'A bonnet! And the gown she wore with it. I had one just like it. Well. Nearly.'},
  {beat:['N','The photograph is of the last night of the Vanishing Moon. Seat A1 is empty. It was reserved for “F.”'], more:[['P','She kept him a seat. After all that.'],['T','Front row, dead centre. Best view in the house, and she saved it for the man who robbed her.']], x:1, ch:3, who:'M', need:[['T',6],['K',3]], coins:24, say:'(He is batting a photograph around her tool roll. He wants both.)'},
  // ch5
  {beat:['T','The false wall comes away. Behind it, a mirror. Of course there’s a mirror.'], ch:4, who:'T', need:[['T',6],['L',5]], coins:28, say:'Her tool roll and the oil lamp. This false wall comes down today.'},
  {beat:['P','Oh, Odile. You were magnificent.'], ch:4, who:'P', need:[['F',6],['L',6]], coins:30, say:'Her stage gown, under the spotlight. I want to see it properly.'},
  {beat:['N','The music settles it. Cat and rabbit share the windowsill.'], ch:4, who:'M', need:[['M',5],['R',3]], coins:30, say:'(He and the rabbit are having a standoff. Music might calm everyone down.)'},
  {beat:['T','The photos line up with the diaries. Every city, every year. Then nothing after 1969.'], ch:4, who:'T', need:[['P',7],['K',3]], coins:30, say:'The whole archive, in order. And the photographs that go with it.'},
  {beat:['P','Every bead stitched by hand. That’s months of work, love.'], x:1, ch:4, who:'P', need:[['F',6],['T',6]], coins:30, say:'Hold the gown still while I fix the beading, love. Pass me the tool roll.'},
  // ch6
  {beat:['T','Mirror angled. Wireless tuned. All we need now is the moon.'], ch:5, who:'T', need:[['T',7],['R',4]], coins:34, say:'Stagehand’s tools to angle the mirror, and the violin for the overture.'},
  {beat:['P','She forgave him, you know. She just never told him.'], more:[['T','How can you tell?'],['P','That dove is his apology, love. She made it part of the show. You don’t give pride of place to something you’re still angry about.'],['T','So his “sorry” was on stage every night, and he never saw it.']], ch:5, who:'P', need:[['M',6]], coins:34, say:'The dove. It belongs with the trick.'},
  {beat:['N','The set is dressed. Mothball takes his mark.'], ch:5, who:'M', need:[['F',7],['B',4]], coins:34, say:'(The masks and the tiara. He is dressing the set like he’s done it before.)'},
  {beat:['P','A bit of music for the finale. She’d insist.'], x:1, ch:5, who:'P', need:[['L',6],['R',4]], coins:34, say:'The spotlight and the violin. She’d have wanted music.'},
  {ch:5, who:'O', need:[['M',7]], coins:50, say:'“…a crystal, and someone who looks.”'},
];



const PASS=[
  {pts:15, rw:[['E',2]]},{pts:30, rw:[['H',1]]},{pts:50, rw:[['C',2],['X',2]]},{pts:65, rw:[['E',3]]},{pts:80, rw:[['gD',2]]},
  {pts:95, rw:[['H',2]]},{pts:110, rw:[['E',3],['C',3]]},{pts:130, rw:[['gS',2]]},{pts:145, rw:[['H',2]]},{pts:160, rw:[['E',4]]},
  {pts:185, rw:[['gT',2]]},{pts:210, rw:[['H',2],['X',3]]},{pts:230, rw:[['E',4],['C',3]]},{pts:255, rw:[['H',3]]},{pts:290, rw:[['E',5],['H',3]]},
];

const FELIX=[
  [['N','A letter is tucked into the reward bundle. Vienna, 1970.'],['F','“Odelia. I have the method and no idea what to do with it. When I make the moon vanish, they look at me. They’re supposed to look up.” — F.']],
  [['F','“Paris, 1973. I did the Moon tonight. It vanished perfectly and nobody gasped. I don’t understand. It’s the same trick.” — F.']],
  [['F','“London, 1979. I came to the stage door. You’d gone. They said you’d given it all up for sewing. I bought a ticket for a show that wasn’t on.” — F.']],
  [['F','“1985. I have a theory. You never hid the moon. You hid the audience from themselves for a second, then gave them back. I can’t do that part.” — F.']],
  [['F','“Last one, I think. I’m keeping seat A1 warm. If you ever do it again, I’ll be looking up.” — F.'],['M','<em>(Mothball sits on the letter until you’ve finished reading it.)</em>']],
];

const MOON_NOTES=[
  [['N','Folded inside the token: a strip of paper in Odile’s hand.'],['O','“New moon. Nothing to see. That’s the best time to set up.”']],
  [['O','“Crescent. Show them a sliver and they fill in the rest themselves. People love to finish a picture.”']],
  [['O','“Half moon. Half the trick is the method. The other half is the reason. Felix only ever had the first half.”']],
  [['O','“Full moon. Everyone looks up at once. That’s the moment, Nell. Not the vanishing. The looking.”']],
];

const P2={ shopName:'Mrs Pike’s Odds & Ends', shopBlurb:'Mrs Pike sells whatever turns up in her own loft' };

const SHOP_ITEMS=[
  {id:'ET', item:['ET',1], price:30, what:'Refills one generator. Drag it onto the one you need'},
  {id:'H1', item:['H',1], price:90, what:'Skips 15 minutes on every generator and the kettle'},
];

const REFLECTIONS=[
  ['N','Later, with the bulbs back on and an ordinary moon in the round window, the three of you sit on the trunk and try to put it all in order.'],
  ['T','So. Nineteen sixty-eight. Two of them build a trick nobody thinks can be done. And it works.'],
  ['P','And the night it works, he takes her notebook and goes. Paris, Vienna, wherever they’d book him. Not a word to her.'],
  ['T','But he only took the how. The mirror, the timing, the four minutes twelve. Not the why.'],
  ['P','That’s what she meant by half. He could make the moon disappear. He could never make anyone care that it had.'],
  ['N','She came home, called it a sister in Lyon, and sewed hems on Larkspur Lane for forty years. The theatre went under dust sheets with everything else.'],
  ['P','I used to think she was hiding from him. Now I think she was keeping the other half safe. In case.'],
  ['T','Then why never open his letter?'],
  ['P','She opened one. Folded it into a dove and put it in the act. That was her answer, love. The other one she didn’t need to read.'],
  ['T','And seat A1. Every night, empty. Kept for a man who never came back.'],
  ['P','And he kept her one at a show she never did again. Pair of them. Forty years of saving seats.'],
  ['M','(Mothball settles on the empty stand where the crystal ball sat, exactly where the moon would be.)'],
  ['N','Forgiving him didn’t mean letting him back in. It meant finishing the trick without him, so it was never only his. Tonight, it was finished.'],
  ['T','…Do you reckon Felix ever knew?'],
  ['P','No, love. But he said he’d be looking up. I’d like to think he was.'],
];


const GEN_STORY={
  gD1:[['T','A paper tray. Receipts, ration books, and one very old Valentine.'],['P','Odile kept everything. Every scrap. I always thought it was thrift.']],
  gD2:[['N','The trays slot into a writing bureau with a lid that sticks.'],['T','There’s a stamp in here from 1965. Paris. Never used.']],
  gD3:[['P','A printing press! In an attic!'],['T','Every playbill she ever had. She printed them herself.']],
  gS1:[['P','Her sewing basket. I borrowed thread from this every Christmas for forty years.'],['M','<em>(Mothball climbs in and takes up residence.)</em>']],
  gS2:[['N','A proper sewing kit: tailor’s chalk, pins, a thimble worn through on one side.'],['P','She sewed left-handed. I never noticed till now.']],
  gS3:[['T','This isn’t a hobby corner. It’s a costume department.'],['P','Sequins by the jar. “A seamstress,” she said. Well. She wasn’t lying.']],
  gT1:[['T','Finally, something I understand. Hammer, saw, and… a trick dagger.'],['P','Put that down, love.']],
  gT2:[['N','The tools spread out across a workbench marked with chalk lines.'],['T','These are stage marks. Exits, entrances. Somebody rehearsed a show up here.']],
  gT3:[['T','Trapdoors. Pulleys. A box with false sides. Your aunt was a menace.'],['P','A lovely menace.']],
  gL1:[['T','Labelled in her handwriting. “Moon.” Who labels a fuse “Moon”?'],['P','Someone who needed to find it in the dark.']],
  gL2:[['N','Rows of brass sliders, each with a tiny paper label.'],['T','Footlights, wash, spot… and one just marked “Felix, don’t”.']],
  gL3:[['N','The attic fills with warm stage light. For a moment it’s 1968.'],['P','Oh. Oh, look at it.']],
  gM1:[['P','No keyhole, no hinges, and it opens for the cat.'],['T','Of course it does.']],
  gM2:[['N','A tall mirror in a gilt frame. Your reflection seems to arrive half a second late.'],['T','I’m choosing not to think about that.']],
  gM3:[['P','This is the act. The whole act, laid out and ready.'],['T','Every trick she ever did, in one corner of an attic.']],
  gK1:[['P','My kettle. On loan. It’s seen me through three husbands and a flood.'],['T','It whistles in a minor key. Fitting, really.']],
};

const QUESTS=[
  {id:'gen',   ic:'🔨', n:'Use generators',        steps:[25,100,250,500,1000,2000]},
  {id:'merge', ic:'🔗', n:'Make merges',           steps:[20,50,150,300,600,1200]},
  {id:'side',  ic:'🏷️', n:'Finish Jumble Sales',   steps:[3,10,25,50,100]},
  {id:'rare',  ic:'💎', n:'Find rare items',       steps:[3,10,25,50,100]},
  {id:'story', ic:'📜', n:'Fill story orders',     steps:[3,10,20]},
  {id:'high',  ic:'🌟', n:'Make level 5+ items',   steps:[3,10,25,60]},
  {id:'claim', ic:'🪙', n:'Claim coins, stars & moons', steps:[10,40,100,250]},
  {id:'open',  ic:'📦', n:'Open boxes & cobwebs',  steps:[10,25,45]},
  {id:'disc',  ic:'🧩', n:'Discover new items',    steps:[15,30,50,70]},
  {id:'sell',  ic:'🪙', n:'Sell items',            steps:[5,20,50]},
];



