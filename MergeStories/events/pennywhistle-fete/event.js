/* Pennywhistle Fete: a Merge Stories cartridge. Everything that makes this story itself lives here:
   words, cast, chains, board, orders, balance, wheel, cover, colours and music. The engine is shared. */
const EVENT = {
  id: 'pennywhistle-fete', title: 'Pennywhistle Fete', tagline: 'The Mystery Prize', version: 'v19',
  themeColor: '#14303a',
  cover: { art: "<svg class=\"cover\" viewBox=\"0 0 360 230\" role=\"img\" aria-label=\"A prize wheel on the village green at sunset, under bunting\"><defs><linearGradient id=\"cvSky\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#173f4c\"/><stop offset=\".55\" stop-color=\"#2f7a80\"/><stop offset=\".85\" stop-color=\"#f0a46a\"/><stop offset=\"1\" stop-color=\"#ffd27a\"/></linearGradient><radialGradient id=\"cvGlow\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ffe9a0\" stop-opacity=\".55\"/><stop offset=\"1\" stop-color=\"#ffe9a0\" stop-opacity=\"0\"/></radialGradient></defs><rect width=\"360\" height=\"230\" fill=\"url(#cvSky)\"/><circle cx=\"292\" cy=\"160\" r=\"30\" fill=\"#ffd27a\" opacity=\".85\"/><rect y=\"160\" width=\"360\" height=\"16\" fill=\"#2b7487\"/><path d=\"M0 166h360\" stroke=\"#ffe3a8\" stroke-opacity=\".35\" stroke-width=\"1.5\" stroke-dasharray=\"14 10\"/><path d=\"M0 178 Q90 160 180 172 T360 168 V230 H0Z\" fill=\"#4f8a4b\"/><path d=\"M0 200 Q120 186 240 198 T360 194 V230 H0Z\" fill=\"#3f7640\"/><g transform=\"translate(18,140)\"><rect x=\"0.0\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#e8547a\"/><rect x=\"11.7\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#fdf6e3\"/><rect x=\"23.3\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#e8547a\"/><rect x=\"35.0\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#fdf6e3\"/><rect x=\"46.7\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#e8547a\"/><rect x=\"58.3\" y=\"16.1\" width=\"11.7\" height=\"29.9\" fill=\"#fdf6e3\"/><path d=\"M-4 17.0 L35.0 0 L74 17.0Z\" fill=\"#e8547a\"/><path d=\"M35.0 0 v-8\" stroke=\"#fdf6e3\" stroke-width=\"1.5\"/><path d=\"M35.0 -8 l7 3 l-7 3z\" fill=\"#ffc94a\"/><path d=\"M26.6 46 L35.0 23.0 L43.4 46Z\" fill=\"#7a2a3e\" opacity=\".6\"/></g><g transform=\"translate(300,150)\"><rect x=\"0.0\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#e8547a\"/><rect x=\"7.3\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#fdf6e3\"/><rect x=\"14.7\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#e8547a\"/><rect x=\"22.0\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#fdf6e3\"/><rect x=\"29.3\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#e8547a\"/><rect x=\"36.7\" y=\"10.5\" width=\"7.3\" height=\"19.5\" fill=\"#fdf6e3\"/><path d=\"M-4 11.1 L22.0 0 L48 11.1Z\" fill=\"#e8547a\"/><path d=\"M22.0 0 v-8\" stroke=\"#fdf6e3\" stroke-width=\"1.5\"/><path d=\"M22.0 -8 l7 3 l-7 3z\" fill=\"#ffc94a\"/><path d=\"M16.7 30 L22.0 15.0 L27.3 30Z\" fill=\"#7a2a3e\" opacity=\".6\"/></g><circle cx=\"180\" cy=\"104\" r=\"86\" fill=\"url(#cvGlow)\"/><path d=\"M146 190 L180 104 L214 190\" stroke=\"#123039\" stroke-width=\"7\" fill=\"none\" stroke-linecap=\"round\"/><g transform=\"translate(180,104)\"><circle r=\"65\" fill=\"#123039\"/><g class=\"spin\"><path d=\"M0 0 L0.0 -60.0 A60 60 0 0 1 30.0 -52.0Z\" fill=\"#e8547a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L30.0 -52.0 A60 60 0 0 1 52.0 -30.0Z\" fill=\"#ffc94a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L52.0 -30.0 A60 60 0 0 1 60.0 0.0Z\" fill=\"#4fb3a9\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L60.0 0.0 A60 60 0 0 1 52.0 30.0Z\" fill=\"#8f9cf0\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L52.0 30.0 A60 60 0 0 1 30.0 52.0Z\" fill=\"#e8547a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L30.0 52.0 A60 60 0 0 1 0.0 60.0Z\" fill=\"#ffc94a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L0.0 60.0 A60 60 0 0 1 -30.0 52.0Z\" fill=\"#4fb3a9\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L-30.0 52.0 A60 60 0 0 1 -52.0 30.0Z\" fill=\"#8f9cf0\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L-52.0 30.0 A60 60 0 0 1 -60.0 0.0Z\" fill=\"#e8547a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L-60.0 0.0 A60 60 0 0 1 -52.0 -30.0Z\" fill=\"#ffc94a\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L-52.0 -30.0 A60 60 0 0 1 -30.0 -52.0Z\" fill=\"#4fb3a9\" stroke=\"#123039\" stroke-width=\"1.5\"/><path d=\"M0 0 L-30.0 -52.0 A60 60 0 0 1 -0.0 -60.0Z\" fill=\"#8f9cf0\" stroke=\"#123039\" stroke-width=\"1.5\"/><circle class=\"bulb\" cx=\"15.8\" cy=\"-58.9\" r=\"3.4\" style=\"animation-delay:0.00s\"/><circle class=\"bulb\" cx=\"43.1\" cy=\"-43.1\" r=\"3.4\" style=\"animation-delay:0.13s\"/><circle class=\"bulb\" cx=\"58.9\" cy=\"-15.8\" r=\"3.4\" style=\"animation-delay:0.26s\"/><circle class=\"bulb\" cx=\"58.9\" cy=\"15.8\" r=\"3.4\" style=\"animation-delay:0.39s\"/><circle class=\"bulb\" cx=\"43.1\" cy=\"43.1\" r=\"3.4\" style=\"animation-delay:0.52s\"/><circle class=\"bulb\" cx=\"15.8\" cy=\"58.9\" r=\"3.4\" style=\"animation-delay:0.65s\"/><circle class=\"bulb\" cx=\"-15.8\" cy=\"58.9\" r=\"3.4\" style=\"animation-delay:0.78s\"/><circle class=\"bulb\" cx=\"-43.1\" cy=\"43.1\" r=\"3.4\" style=\"animation-delay:0.91s\"/><circle class=\"bulb\" cx=\"-58.9\" cy=\"15.8\" r=\"3.4\" style=\"animation-delay:1.04s\"/><circle class=\"bulb\" cx=\"-58.9\" cy=\"-15.8\" r=\"3.4\" style=\"animation-delay:1.17s\"/><circle class=\"bulb\" cx=\"-43.1\" cy=\"-43.1\" r=\"3.4\" style=\"animation-delay:1.30s\"/><circle class=\"bulb\" cx=\"-15.8\" cy=\"-58.9\" r=\"3.4\" style=\"animation-delay:1.43s\"/></g><circle r=\"11\" fill=\"#123039\" stroke=\"#ffc94a\" stroke-width=\"2.5\"/><path d=\"M-8 -72 h16 l-8 13z\" fill=\"#fdf6e3\"/></g><path d=\"M-5 6 Q180 38 365 6\" stroke=\"#fdf6e3\" stroke-opacity=\".8\" stroke-width=\"1.2\" fill=\"none\"/><path d=\"M0.2 8.2 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M26.6 12.1 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M53.1 15.4 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M79.5 18.0 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M105.9 20.0 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M132.4 21.3 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M158.8 21.9 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M185.2 21.9 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M211.6 21.3 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M238.1 20.0 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M264.5 18.0 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M290.9 15.4 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M317.4 12.1 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M343.8 8.2 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M-5 26 Q180 70 365 26\" stroke=\"#fdf6e3\" stroke-opacity=\".8\" stroke-width=\"1.2\" fill=\"none\"/><path d=\"M0.2 29.0 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M26.6 34.4 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M53.1 38.9 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M79.5 42.5 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M105.9 45.2 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M132.4 47.0 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M158.8 47.9 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M185.2 47.9 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M211.6 47.0 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M238.1 45.2 h16 l-8 14z\" fill=\"#8f9cf0\"/><path d=\"M264.5 42.5 h16 l-8 14z\" fill=\"#e8547a\"/><path d=\"M290.9 38.9 h16 l-8 14z\" fill=\"#ffc94a\"/><path d=\"M317.4 34.4 h16 l-8 14z\" fill=\"#4fb3a9\"/><path d=\"M343.8 29.0 h16 l-8 14z\" fill=\"#8f9cf0\"/><text x=\"250\" y=\"212\" font-size=\"22\">🐕</text><text x=\"120\" y=\"216\" font-size=\"16\">🎈</text></svg>", sub: 'The Mystery Prize',
    key: [["🎡", "Spin the Prize Wheel to light up sixty years of old prizes"], ["🧩", "Merge and fill orders to find out who leaves the Mystery Prize"], ["☀️", "No timer. Play at your own pace"]],
    more: ["Tap a generator twice to make items; drag two matching items together to merge", "Generators are free to tap; they rest after a while", "Story orders and the White Elephant pay 🎟️ tickets; 10 tickets spin the wheel", "Mrs Hale’s story orders need sales at her White Elephant stall", "You don’t win the old prizes on the wheel; a segment that’s already lit gives some tickets back", "Generators need a rest; ⏲️ egg timers refill one", "Tea isn’t for drinking: drop it on a generator and it finds rare items more often", "📦 Donation boxes are free, then fold flat", "🗑️ Feed the compost bin, grow 🌳 apple trees, burn 🪵 logs in the ♨️ stove for tea", "⏱️ Time chargers make generators around them recharge twice as fast", "Tap 🪙 for Dot’s tombola table"] },
  terms: {
    passName: 'Rosette Board', tokenNoun: 'rosette', tokenIcon: '🎗️',
    passHelp: '• Rosettes 🎗️ drop from generators and orders<br>• Tap twice to claim them any time: 🎗️ 1 · 🏵️ 3 · 🥈 7 · 🥇 16 points<br>• Merging first is worth more, but takes board space<br>• Every 3rd reward comes with a note from a past winner 💌',
    notesTitle: 'Dot’s fete scrapbook', notesItem: 'A page from Dot’s fete scrapbook is tucked inside. Tap it to read. It can’t be merged until you do.',
    lettersTitle: 'Winners’ notes', letterWord: 'Note',
    sheetBlocked: 'That part of the storeroom is still under covers.', sheetTap: 'Still under covers.',
    sideSold: '🐘 Sold at the white elephant stall. Rewards are on the board',
    sideSay: 'For the white elephant stall. Anything you can spare.', sideLucky: 'A lucky find! Something small for the white elephant stall.',
    doneTitle: 'The fete is yours', doneHas: 'You found the very first prize. Dot is pretending not to be pleased.', doneNot: 'Keep merging. The Lost Property Box still hides one last secret.',
    presentDesc: 'Something new for the fete.',
    loreFound: 'Found in the Lost Property Box', loreHeading: 'The Mystery Prizes', loreEmpty: 'Nothing yet. Somewhere in here is a trunk full of other people’s good years.',
  },
  complete: { title: 'The Mystery Prize', text: 'You ran the Prize Wheel and found out who’s been leaving the Mystery Prize since 1962. Next year it’s your turn.',
    note: 'The board stays open. Merge as long as you like. The Lost Property Box chain has one level nobody has reached yet.' },
  /* reward numbers (the engine hands them out). Tables read "value or more → level": [[30,2],[0,1]] */
  rewards: {
    order: { coins:[[30,2],[0,1]], xp:[[4,3],[2,2],[0,1]], points:[[3,2],[0,1]], tickets:[[3,2],[0,1]] },
    finale: [['C',3],['X',4],['N',3],['CP',2]],
    side: { coins:[[24,2],[0,1]], bigPoints:24, timerAt:12, timerChance:.3, tickets:{always:12, chance:.5}, lucky:[['C',1],['N',1]] },
    discovery: { coinsPerLevel:0, topCoins:5, xpFrom:1 },   // coins only for a chain's top item
    quests: [[['C',1],['CP',1]],[['E',2],['CP',2]],[['E',2],['CP',2]],[['E',3],['H',1],['N',1]],[['E',3],['CP',2],['N',2]],[['E',3],['H',1],['N',3]]],
  },
  css: '',   /* the engine's default look is this story's */
  wheel: { cost: 10, n: 20,
    light: [['C',1]],     // a new light shakes out a penny
    repeat: [['CP',2]],   // a lit segment gives a Ticket Strip back, so a late run of repeats still refunds something
    segs: [
  {e:'🍬', n:'Humbugs', yr:1964, story:[['N','1964. A jar of humbugs, wrapped in a hanky. Tag: “From a friend.”'],['P','Humbugs! Fred the fisherman won those. He sucked one all the way through the sermon.']],
   tidbit:[['N','Fred kept one humbug in his top pocket for a whole year, “for emergencies”. There was never an emergency.']]},
  {e:'🐔', n:'Hen Tea Cosy', yr:1967, story:[['N','1967. A tea cosy shaped like a hen.'],['T','Who knits a hen? Who has that kind of time?']],
   tidbit:[['P','The hen has a name, you know. Gloria. Nobody remembers why.']]},
  {e:'🌸', n:'Sweet Pea Seeds', yr:1970, story:[['N','1970. Sweet pea seeds in a hand-folded packet.'],['P','They came up purple all down Fred’s path. He never would say where he got them.']],
   tidbit:[['P','They came second at the flower show. First went to a dahlia the size of a dinner plate. Fred never got over it.']]},
  {e:'🦆', n:'Wooden Duck', yr:1973, story:[['N','1973. A painted wooden duck on wheels, with a string to pull it.'],['M','<em>(Biscuit chases it under a trestle and will not give it back.)</em>']],
   tidbit:[['N','The duck’s wheels squeak in B flat. The brass band once tuned up to it.']]},
  {e:'🧃', n:'Elderflower Cordial', yr:1976, story:[['N','1976. A bottle of elderflower cordial. Hot summer, that.'],['P','The winner drank it on the spot, in front of everyone. Mrs Hale has never quite lived it down.']],
   tidbit:[['P','It was gooseberry, actually. Wrong label. Nobody noticed until 1990.']]},
  {e:'🧶', n:'Crocheted Bunting', yr:1979, story:[['N','1979. Crocheted bunting, eleven flags long.'],['T','Eleven! Who does eleven? You do ten or you do twelve.']],
   tidbit:[['T','I counted again. Still eleven. Still wrong.']]},
  {e:'🗺️', n:'Treasure Map', yr:1982, story:[['N','1982. A hand-drawn map of the village, with an X on the duck pond.'],['P','Half the Cubs went in after it. There was a fifty pence under the bridge.']],
   tidbit:[['P','The duck pond is a foot deep. The Cubs’ mums were not amused.']]},
  {e:'🫙', n:'Chutney', yr:1985, story:[['N','1985. A jar of chutney. Very, very strong.'],['T','That’s not a prize. That’s a dare.']],
   tidbit:[['T','My dad had one spoonful in 1985. He says he can still taste it.']]},
  {e:'📼', n:'Brass Band Tape', yr:1988, story:[['N','1988. A cassette of the brass band, taped off the bandstand.'],['N','It still plays. Mostly. Somebody coughs all the way through the slow bit.']],
   tidbit:[['N','Right at the end, someone shouts “Don’t forget the urn!” It’s Dot.']]},
  {e:'🌉', n:'Lolly-stick Pier', yr:1991, story:[['N','1991. A model of the pier, made of lolly sticks.'],['P','The real pier lost a plank that year. People did wonder.']],
   tidbit:[['P','Two thousand and forty lolly sticks. Somebody ate a great many lollies.']]},
  {e:'🧣', n:'Football Scarf', yr:1994, story:[['N','1994. A scarf in the football club colours.'],['T','Wrong club. Deliberately the wrong club. That’s someone with a sense of humour.']],
   tidbit:[['T','The other lot won the league that year. Whoever knitted it must have been unbearable.']]},
  {e:'🍪', n:'Rock Buns', yr:1997, story:[['N','1997. A cake tin full of rock buns.'],['T','These are my nan’s rock buns. I’d know them anywhere. She won the year before, you know.']],
   tidbit:[['T','The secret’s a pinch of nutmeg. Don’t tell anyone. Nan would haunt me.']]},
  {e:'🥫', n:'Time Capsule', yr:2000, story:[['N','2000. A time capsule, to be opened in 2025. It’s empty. Someone opened it in 2001.'],['P','Patience was never this village’s strong suit.']],
   tidbit:[['P','There was one thing left inside. A note saying “Sorry.” In very small writing.']]},
  {e:'🥄', n:'Teaspoon Chime', yr:2003, story:[['N','2003. Ten teaspoons, quietly missing from the tea tent.'],['P','So that’s where they went! I blamed the Scouts for a decade.']],
   tidbit:[['N','One spoon rings slightly flat. It’s the one the vicar always used for his sugar.']]},
  {e:'🐶', n:'Knitted Terrier', yr:2006, story:[['N','2006. A knitted terrier, the spitting image of Crumpet, the vicarage dog before Biscuit.'],['M','<em>(Biscuit growls at it. Then falls asleep on it.)</em>']],
   tidbit:[['P','Crumpet once ate a whole Victoria sponge off the judging table. Still won Best Dog.']]},
  {e:'🧩', n:'Fete Jigsaw', yr:2010, story:[['N','2010. A jigsaw of the fete itself, every stall in it.'],['T','Look, there’s the wheel. And a tiny Dot, waving.']],
   tidbit:[['T','The box says 500 pieces. There are 501. Nobody’s ever found where the extra one goes.']]},
  {e:'🧤', n:'Oven Gloves', yr:2014, story:[['N','2014. A pair of oven gloves, embroidered “Hot Stuff”.'],['P','The old vicar won those. Wore them at the Christmas service. Nobody ever asked.']],
   tidbit:[['P','He wore them for the Nativity, too. The donkey was terrified.']]},
  {e:'🐚', n:'Painted Shells', yr:2018, story:[['N','2018. A bag of shells, each one painted with a face.'],['T','Every face is somebody in the village. That one’s me. Why am I frowning?']],
   tidbit:[['T','Oh, I’m not frowning. I’m squinting. It was very sunny that year. That’s better.']]},
  {e:'📒', n:'Recipe Book', yr:2022, story:[['N','2022. A little book of everyone’s recipes, typed up.'],['P','Page twelve is my Victoria sponge. I never gave that recipe to anybody. Well. Hardly anybody.']],
   tidbit:[['P','Page thirty is Mrs Hale’s chutney. Underneath, in her own hand: “Do not make this.”']]},
  {e:'🐭', n:'Knitted Mouse', yr:2025, story:[['N','Last year. A knitted mouse, wearing a rosette the size of a fingernail.'],['T','…Nice mouse. Very nice mouse. Moving on.']],
   tidbit:[['T','Its rosette’s on crooked. I tried to straighten it once. It went right back.']]},
],
    last: [
  ['N','All twenty lights are on. Behind the last bulb, wedged in tight: a parcel with no year and no tag.'],
  ['P','That one’s for Saturday, love. <em>(She tucks it under her arm before you can look.)</em>'],
  ['N','<em>(Wheel complete. A gift is waiting 🎁)</em>'],
],
    intro: [
  ['T','Right. Twenty dark bulbs. How do we get them back on?'],
  ['P','Ten tickets in the slot at the back. The slot weighs them, the brake lets go, and round she goes. No tickets, no spin. Fred didn’t believe in freebies.'],
  ['T','A wheel with a cover charge.'],
  ['P','Every ticket goes to the church roof, love. That’s always been the deal.'],
  ['P','When she stops on a dark segment, the jolt knocks its bulb back on. Loose contacts. Fred again.'],
  ['P','Under each bulb there’s a little painting of an old Mystery Prize. And sixty years of loose change rattles about inside her. It falls out when she stops.'],
  ['N','<em>• 10 tickets 🎟️ a spin<br>• Light a dark segment: 💡 see the old prize under it and hear its story<br>• You don’t win the old prizes; every stop shakes out loose change 🪙<br>• Story orders need lights on</em>'],
] },
  /* a bright, bouncy village-fete tune in C major: plucky offbeat chords, oom-pah bass, glockenspiel then whistle */
  music: { bpm: 108, beats: 128,
    mix: { lp: 3000, send: .35, rev: .4, fb: .22, dlp: 1500, wet: .12, wetToRev: false },
    pad: { wave: 'triangle', det: 7, g: .010, a: .6, lp: [700, 1100, 750] },
    compose({voice, puff, pad, mallet, BEAT, rnd}) {
  const CH={C:[48,[60,64,67]], F:[41,[60,65,69]], G:[43,[59,62,67]], Am:[45,[60,64,69]], Em:[40,[59,64,67]], Dm:[50,[62,65,69]], G7:[43,[59,62,65]]};
  const SONG=['C','F','G','C', 'Am','F','G','G7', 'C','Em','F','G', 'F','G7','C','C'];
  /* melody: [beat in bar, midi, length in beats] for each of the 16 bars */
  const MEL=[
    [[0,76,1],[1,79,.5],[1.5,76,.5],[2,72,1],[3,74,1]],
    [[0,77,1.5],[1.5,76,.5],[2,74,1],[3,72,1]],
    [[0,74,1],[1,71,.5],[1.5,74,.5],[2,79,1.5],[3.5,77,.5]],
    [[0,76,2],[2,72,1.5]],
    [[0,72,.5],[.5,74,.5],[1,76,1],[2,81,1],[3,79,1]],
    [[0,77,1],[1,76,.5],[1.5,74,.5],[2,72,1],[3,69,1]],
    [[0,71,1],[1,74,1],[2,79,1],[3,77,.5],[3.5,76,.5]],
    [[0,74,3]],
    [[0,79,1],[1,79,.5],[1.5,81,.5],[2,79,1],[3,76,1]],
    [[0,79,1.5],[1.5,76,.5],[2,71,2]],
    [[0,77,1],[1,81,1],[2,77,1],[3,76,.5],[3.5,74,.5]],
    [[0,74,1],[1,79,2]],
    [[0,81,1],[1,79,.5],[1.5,77,.5],[2,76,1],[3,74,1]],
    [[0,74,.5],[.5,76,.5],[1,77,1],[2,79,1],[3,71,1]],
    [[0,72,2],[2,76,1],[3,79,1]],
    [[0,72,3]],
  ];
      const bass=(m,t,dur,g=.15)=>{ voice({m,t,dur,g,a:.012,wave:'sine',det:0,lp:420,lpEnd:260}); voice({m:m+12,t,dur:dur*.5,g:g*.22,a:.01,wave:'triangle',det:3,lp:700}); };
      const pluck=(m,t,g=.016)=>voice({m,t,dur:.22,g,a:.008,wave:'triangle',det:6,lp:2100,lpEnd:700});
      const whistle=(m,t,dur,g=.035)=>voice({m,t,dur,g,a:.04,wave:'triangle',det:4,lp:1900,lpEnd:1200});
      const shake=(t,g)=>puff({t,dur:.06,g,f:2900,to:1800});
      const BARS=32;
    for(let bar=0;bar<BARS;bar++){
      const half=Math.floor(bar/16), b16=bar%16, t0=bar*4*BEAT+.02, [root,chord]=CH[SONG[b16]];
      pad(chord,t0,BEAT*4.1);
      // oom-pah bass: root on 1, fifth on 3, a little walk into the next bar now and then
      bass(root,t0,BEAT*.9); bass(root+7>52?root-5:root+7,t0+2*BEAT,BEAT*.9,.12);
      if(rnd()<.35) bass(root+(rnd()<.5?4:2),t0+3.5*BEAT,BEAT*.4,.09);
      // offbeat chord plucks
      for(let b=0;b<4;b++) chord.forEach((m,j)=>pluck(m+(j===2&&b%2?12:0),t0+(b+.5)*BEAT, b%2?.014:.017));
      // shaker on every eighth, accent on the offbeat
      for(let e8=0;e8<8;e8++) shake(t0+e8*BEAT/2, e8%2?.010:.005);
      // melody: glockenspiel first time, whistle second time with the glock doubling an octave down
      MEL[b16].forEach(([bt,m,len])=>{
        const t=t0+bt*BEAT;
        if(!half) mallet(m,t,.075,Math.min(1.4,len*BEAT+.4));
        else { whistle(m,t,len*BEAT*.95); mallet(m-12,t,.035,len*BEAT*.8); }
      });
      // a little sparkle at the end of each 4-bar phrase
      if(b16%4===3) [84,88,91].forEach((m,j)=>mallet(m,t0+(3+j*.17)*BEAT,.018,.6));
    }
    } },
};

const CONFIG = {
  chargerScale: 1/6,     // a 2h Merge Mansion charger runs 20 min here
  cols: 7, rows: 9,
  bin: { wants:[['P',1],['P',2],['F',1],['F',2],['T',1],['T',2],['Y',1],['Y',2]], gives:'G' },  // what the compost bin asks for, and what it gives
  fuel: { O:4, P:1 },     // stove fuel per item level
  saveKey:'merge-stories:pennywhistle-fete', legacySaveKey:'pennywhistle-fete',  // Second Pass: its own save, the original game is untouched  // v12: order list rebalanced, fresh start
};

const CHAINS = {
  P:{name:'Bunting', items:[
    {e:'📄',n:'Crepe Paper'},{e:'🚩',n:'Pennant'},{e:'🎏',n:'Flag String'},{e:'🎌',n:'Crossed Flags'},
    {e:'🎈',n:'Balloon Bunch'},{e:'🪧',n:'Stall Sign'},{e:'🎊',n:'Welcome Arch'}]},
  F:{name:'Prize Veg', items:[
    {e:'🫛',n:'Pea Pod'},{e:'🥕',n:'Carrot'},{e:'🥔',n:'Potato'},{e:'🥬',n:'Cabbage'},
    {e:'🌽',n:'Sweetcorn'},{e:'🥒',n:'Prize Marrow'},{e:'🎃',n:'Giant Pumpkin'}]},
  T:{name:'Fete Games', items:[
    {e:'🪀',n:'Yo-yo'},{e:'🥏',n:'Hoopla Ring'},{e:'🎯',n:'Dartboard'},{e:'🎳',n:'Skittles'},
    {e:'🏏',n:'Cricket Bat'},{e:'🪁',n:'Kite'},{e:'🎠',n:'Carousel Horse'}]},
  L:{name:'Brass Band', items:[
    {e:'🔔',n:'Bell'},{e:'🥁',n:'Drum'},{e:'🎺',n:'Trumpet'},{e:'🎷',n:'Saxophone'},
    {e:'📯',n:'Post Horn'},{e:'🎼',n:'Band Score'}]},
  /* resource chains: tap twice to claim, or merge first for a bigger payout (values follow Merge Mansion's 2/6/16/40/100 curve) */
  E:{name:'Tea Time', type:'boost', items:[
    {e:'🍬',n:'Sugar Lump',v:2},{e:'🍪',n:'Biscuit',v:6},{e:'☕',n:'Cuppa',v:16},
    {e:'🧁',n:'Cupcake',v:40},{e:'🍰',n:'Victoria Sponge',v:100}]},
  C:{name:'Coins', type:'res', claim:'coins', items:[
    {e:'🪙',n:'Penny',v:1},{e:'💷',n:'Fiver',v:5},{e:'👛',n:'Coin Purse',v:12},
    {e:'💰',n:'Money Bag',v:30},{e:'💎',n:'Church Roof Fund',v:75}]},
  X:{name:'Cheers', type:'res', claim:'xp', items:[
    {e:'⭐',n:'Star',v:1},{e:'🌟',n:'Bright Star',v:3},{e:'💫',n:'Shooting Star',v:8},
    {e:'🌠',n:'Star Shower',v:20},{e:'🏆',n:'Three Cheers',v:50}]},
  N:{name:'Rosettes', type:'res', claim:'points', items:[
    {e:'🎗️',n:'Ribbon',v:1},{e:'🏵️',n:'Rosette',v:3},{e:'🥈',n:'Silver Medal',v:7},{e:'🥇',n:'Gold Medal',v:16}]},
  H:{name:'Time Skips', type:'res', claim:'skip', items:[{e:'⏳',n:'Hourglass',v:15},{e:'⌛',n:'Sand Timer',v:60},{e:'🗓️',n:'Calendar Page',v:240}]},
  CP:{name:'Raffle Tickets', type:'res', claim:'chips', items:[{e:'🎟️',n:'Raffle Ticket',v:1},{e:'🎫',n:'Ticket Strip',v:3},{e:'🧾',n:'Ticket Roll',v:10}]},
  /* rare chains: each generator's occasional bonus drop */
  K:{name:'Keepsakes', rare:true, items:[{e:'🔑',n:'Old Key'},{e:'🧸',n:'Teddy Bear'},{e:'📻',n:'Wireless'},{e:'📸',n:'Box Camera'}]},
  B:{name:'Dressing Up', rare:true, items:[{e:'🔘',n:'Button'},{e:'🎀',n:'Silk Bow'},{e:'👒',n:'Sun Hat'},{e:'👑',n:'May Queen Crown'}]},
  W:{name:'Seaside', rare:true, items:[{e:'🐚',n:'Shell'},{e:'🦀',n:'Toy Crab'},{e:'⛱️',n:'Beach Brolly'},{e:'⛵',n:'Model Boat'}]},
  R:{name:'Sweet Shop', rare:true, items:[{e:'🍭',n:'Lollipop'},{e:'🍫',n:'Chocolate Bar'},{e:'🍿',n:'Popcorn'},{e:'🍩',n:'Iced Doughnut'}]},
  M:{name:'The Mystery Prizes', story:true, items:[
    {e:'🏷️',n:'Gift Tag', lore:'“For the wheel. From a friend.” Green string, a double knot, and a very curly ‘y’.'},
    {e:'🐭',n:'Knitted Mouse', lore:'It wears a rosette the size of a fingernail. There are dozens of these mice. Somebody in this village knits a lot of mice.'},
    {e:'🪆',n:'Painted Doll', lore:'1974. The tag is all spiky capitals, nothing like the curly one. There’s a blue fingerprint on the doll’s bonnet.'},
    {e:'🧩',n:'Hand-cut Jigsaw', lore:'1990. The village green, every stall. One piece is shaped like a tiny prize wheel.'},
    {e:'🎐',n:'Wind Chime', lore:'2003. Ten teaspoons on fishing line. The tea tent lost ten teaspoons in 2003. Dot blamed the Scouts.'},
    {e:'💌',n:'“Your Turn” Card', lore:'“You won it. Now it’s your turn. Make one for next year. Don’t tell a soul.” There’s one in every box, all in different writing.'},
    {e:'🏺',n:'Wonky Cake Stand', lore:'This year’s. Hand-thrown, a bit lopsided, glazed lemon yellow. A lemon drizzle recipe is taped underneath, in bakery biro.'},
    {e:'🎡',n:'The First Prize', lore:'A wooden wheel no bigger than a jam-jar lid, carved in 1962. On the back, in pencil: “So I can be part of it. — D.”'}]},
  /* egg timers: drag onto a generator to refill it straight away */
  ET:{name:'Egg Timers', items:[{e:'⏲️',n:'Egg Timer'}]},
  /* donation boxes (Merge Mansion chests): free taps, then gone. Two unopened boxes merge into a bigger one. */
  Q:{name:'Donation Boxes', gen:true, items:[
    {e:'📦',n:'Donation Box', free:true, uses:6, drop:[['CP',1,8],['C',1,30],['E',1,12],['X',1,20],['P',1,10],['F',1,10],['V',1,6]]},
    {e:'🗳️',n:'Big Donation Box', free:true, uses:14, drop:[['C',1,22],['C',2,12],['E',1,12],['E',2,4],['X',1,14],['CP',1,5],['V',1,8],['H',1,8],['X',2,2]]}]},
  /* the orchard: a chain whose top item becomes a limited generator, then withers into a log */
  G:{name:'Orchard', main:'Y', items:[{e:'🌱',n:'Seedling'},{e:'🌿',n:'Sapling'},{e:'🪴',n:'Potted Tree'},
    {e:'🌳',n:'Apple Tree', gen:true, uses:10, after:['O',1], drop:[['Y',1,70],['Y',2,20],['O',1,10]]}]},
  Y:{name:'Orchard Fruit', items:[{e:'🍒',n:'Cherries'},{e:'🍎',n:'Apple'},{e:'🍐',n:'Pear'},{e:'🍑',n:'Peach'},{e:'🥧',n:'Fruit Pie'}]},
  O:{name:'Firewood', items:[{e:'🪵',n:'Log'}]},
  /* fed generators: the bin wants a specific item (CONFIG.bin), the stove burns fuel (CONFIG.fuel) */
  Z:{name:'Compost Bin', gen:true, items:[{e:'🗑️',n:'Compost Bin', want:true}]},
  U:{name:'Camping Stove', gen:true, main:'E', items:[{e:'♨️',n:'Camping Stove', fuelled:true, drop:[['E',1,55],['E',2,30],['E',3,10],['Y',2,5]]}]},
  /* Time Chargers: shards from the church clock merge up into a charger. Tap to switch on: timed generators in the
     8 tiles around it recharge twice as fast, then it tops them up and disappears. */
  V:{name:'Time Chargers', items:[
    {e:'🕐',n:'Charger Shard'},{e:'🕒',n:'Shard Pair'},{e:'🕕',n:'Shard Cluster'},{e:'🕘',n:'Charger Core'},
    {e:'⏱️',n:'Small Time Charger',hours:2},{e:'⏰',n:'Medium Time Charger',hours:4},{e:'⌚',n:'Big Time Charger',hours:8},{e:'🌀',n:'Huge Time Charger',hours:16}]},
  gC:{name:'Church Clock', gen:true, main:'V', items:[{e:'🕰️',n:'Church Clock', charges:8, rechargeMs:240000, drop:[['V',1,85],['V',2,15]]}]},
  /* the Prize Wheel: tickets spin it; every new segment is an old Mystery Prize and a piece of the story */
  WH:{name:'Prize Wheel', gen:true, wheel:true, items:[{e:'🎡',n:'Prize Wheel'}]},
  /* generators */
  gD:{name:'Craft Box', gen:true, main:'P', rare:'K', items:[
    {e:'🖍️',n:'Craft Box', charges:24, rechargeMs:60000, drop:[['P',1,75],['P',2,10],['K',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'✂️',n:'Craft Table', charges:20, rechargeMs:75000, drop:[['P',1,44],['P',2,28],['P',3,10],['K',1,9],['K',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🖼️',n:'Art Club', charges:16, rechargeMs:90000, drop:[['P',1,22],['P',2,30],['P',3,22],['P',4,6],['K',1,8],['K',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6],['CP',1,4]]}]},
  gS:{name:'Veg Trug', gen:true, main:'F', rare:'B', items:[
    {e:'🪣',n:'Veg Trug', charges:24, rechargeMs:60000, drop:[['F',1,75],['F',2,10],['B',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🌾',n:'Allotment', charges:20, rechargeMs:75000, drop:[['F',1,44],['F',2,28],['F',3,10],['B',1,9],['B',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🚜',n:'Farm Cart', charges:16, rechargeMs:90000, drop:[['F',1,22],['F',2,30],['F',3,22],['F',4,6],['B',1,8],['B',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6],['CP',1,4]]}]},
  gT:{name:'Games Bag', gen:true, main:'T', rare:'W', items:[
    {e:'🎒',n:'Games Bag', charges:24, rechargeMs:60000, drop:[['T',1,75],['T',2,10],['W',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'⛺',n:'Games Tent', charges:20, rechargeMs:75000, drop:[['T',1,44],['T',2,28],['T',3,10],['W',1,9],['W',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🎢',n:'Funfair', charges:16, rechargeMs:90000, drop:[['T',1,22],['T',2,30],['T',3,22],['T',4,6],['W',1,8],['W',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6],['CP',1,4]]}]},
  gL:{name:'Microphone', gen:true, main:'L', rare:'R', items:[
    {e:'🎙️',n:'Microphone', charges:24, rechargeMs:60000, drop:[['L',1,75],['L',2,10],['R',1,8],['E',1,2],['C',1,3],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🔊',n:'PA System', charges:20, rechargeMs:75000, drop:[['L',1,44],['L',2,28],['L',3,10],['R',1,9],['R',2,3],['E',1,2],['C',1,2],['X',1,2],['N',1,5],['CP',1,4]]},
    {e:'🎪',n:'Bandstand', charges:16, rechargeMs:90000, drop:[['L',1,22],['L',2,30],['L',3,22],['L',4,6],['R',1,8],['R',2,5],['E',1,2],['C',1,2],['X',1,3],['N',1,6],['CP',1,4]]}]},
  gM:{name:'Lost Property Box', gen:true, main:'M', rare:'X', items:[
    {e:'🗃️',n:'Lost Property Box', charges:24, rechargeMs:60000, drop:[['M',1,80],['M',2,8],['X',1,7],['C',1,5],['N',1,5],['CP',1,4]]},
    {e:'🧳',n:'Prize Trunk', charges:20, rechargeMs:75000, drop:[['M',1,50],['M',2,26],['M',3,10],['X',1,8],['X',2,3],['C',1,3],['N',1,5],['CP',1,4]]},
    {e:'🏛️',n:'Fete Archive', charges:16, rechargeMs:90000, drop:[['M',1,26],['M',2,30],['M',3,20],['M',4,6],['X',1,8],['X',2,4],['C',1,2],['N',1,6],['CP',1,4]]}]},
  gK:{name:'Tea Urn', gen:true, main:'E', items:[
    {e:'🫖',n:'Tea Urn', free:true, charges:3, rechargeMs:480000, drop:[['E',1,70],['E',2,25],['E',3,5]]}]},
};

const LAYOUT = [
  'bM4 bF5 bC3 bP5 bgT1 bL4 bM3',   // zone 3 — opens chapter 4
  'bP3 wM2 bT4 bgM1 bF2 wL2 bX2',
  'bM2 bL3 bgD1 bF4 bT3 bgL1 bP4',  // zone 2 — opens chapter 3
  'wM1 bQ1 bT1 bP2 wL1 bF3 bM1',
  'bF3 bP2 bL1 bgS1 bT2 bQ1 bF1',   // zone 1 — opens chapter 2
  'wT1 bL2 bP1 wE2 bF2 wT2 bP3',
  'bP1 bgT1 wP1 bF2 wF1 bQ1 bT1',   // zone 0 — start
  'wF2 oP1 o. o. o. oF1 wP2',
  'oE1 ogD1 o. o. o. ogS1 oE1',
];


const CAST = {
  N:{name:'', av:''},
  T:{name:'Arjun', av:'🧑‍🍳'},
  P:{name:'Dot', av:'👵'},
  M:{name:'Biscuit', av:'🐕'},
  O:{name:'The mystery tag', av:'🏷️'},
  F:{name:'A winner’s note', av:'💌'},
  S:{name:'White Elephant', av:'🐘'},
  H:{name:'Mrs Hale', av:'👒'},
};

const CHAPTERS = [
  { title:'Bunting Up', zone:0, gifts:[],
    intro:[
      ['N','Three weeks in Pennywhistle-on-Sea, and Dot has already made you keeper of the Prize Wheel.'],
      ['P','Nothing to it, Robin love. A ticket in, a spin, a prize for everyone. Only one person has ever cried. And that was the goat’s fault.'],
      ['T','All the fete stuff lives in the village hall storeroom. Untouched since last August. Watch the bunting, it’s got a temper.'],
      ['M','Wuff! <em>(Biscuit has vanished under a trestle table. Only his tail is showing, wagging double time.)</em>'],
      ['N','Tap a generator to pick it up, then again to make something. Drag matching things onto each other to merge them. Every merge rattles open the boxes around it.'],
      ['P','The wheel’s hiding in here under a sheet somewhere. Biscuit will sniff it out. Nothing gets past that nose.'],
    ],
    outro:[
      ['T','Look at that. Actual floorboards. First time anyone’s seen them since 2019.'],
      ['N','Tucked under the last trestle, tied up in green string: a brown paper parcel. Its tag reads “For the wheel. From a friend.”'],
      ['P','Well I never. The Mystery Prize, and it’s early!'],
      ['P','Every fete since 1962 there’s been one parcel like this on the wheel. Handmade, always lovely. And not a soul knows who brings it.'],
      ['T','Not a soul knows <em>so far</em>. Give me till Saturday.'],
      ['P','And hands off, the pair of you. It doesn’t get opened till the fete.'],
    ]},
  { title:'Names in the Rafters', zone:1, gifts:[['gL',1],['gK',1]],
    intro:[
      ['T','There’s a microphone up here. Why is there a microphone in a storeroom?'],
      ['N','Arjun taps it. The old speakers play four bars of brass band, then a man saying “Testing, testing, Pennywhistle” in about 1988.'],
      ['N','The covers over the next stretch of floor slide off. <em>(A Microphone is waiting in your gifts.)</em>'],
      ['P','And you can’t run a fete without tea. Here’s the urn. It’s on loan, mind. <em>(Free tea every few minutes.)</em>'],
    ],
    outro:[
      ['N','Biscuit’s shoebox is full of gift tags. Sixty of them, one for every year. Every one says “From a friend.”'],
      ['T','Look at the sixties ones. Loopy writing. Curly ‘y’s. That’s the vicar. I’d put money on it.'],
      ['P','The vicar’s been here six years, love.'],
      ['T','…A very long-lived vicar, then. Respect.'],
    ]},
  { title:'Sixty Years of Parcels', zone:2, gifts:[['gM',1],['Z',1]],
    intro:[
      ['N','Behind a tower of stacking chairs: a tin trunk, stencilled LOST PROPERTY.'],
      ['P','That’s where the old Mystery Prizes end up. House moves, grandchildren, spring cleans. They always come back to the hall.'],
      ['M','<em>(Biscuit noses the lid open and comes out wearing a crocheted hat. He is extremely pleased with himself.)</em>'],
      ['N','<em>(The Lost Property Box is in your gifts, with a Compost Bin for the scraps. Whatever comes out of the box tells the story.)</em>'],
    ],
    outro:[
      ['N','You lay the tags out on a trestle, year by year. Arjun stops talking. That never happens.'],
      ['T','Hang on. These aren’t the same writing. 1974 is all spikes. 1981 is tiny capitals. 1990 is green felt tip.'],
      ['P','Well I never. <em>(She says it very quickly, and goes to put the urn on.)</em>'],
      ['T','So it’s not one person. It’s a gang. A secret prize gang. In Pennywhistle.'],
      ['M','<em>(Biscuit sneezes. Arjun takes this as agreement.)</em>'],
      ['T','Sixty years and nobody let it slip? Mrs Hale can’t keep a secret for one bus stop.'],
    ]},
  { title:'Your Turn', zone:3, gifts:[['E',2],['U',1]],
    intro:[
      ['N','The last corner of the storeroom is bunting. Decades of it, in one enormous knot.'],
      ['T','New theory. It’s Mrs Hale. She runs the gang. Master criminal. Hides it all behind chutney.'],
      ['P','Mrs Hale thinks a crochet hook is a kind of fish.'],
      ['N','<em>(A Camping Stove is in your gifts. Feed it logs or old bunting and it brews tea.)</em>'],
    ],
    outro:[
      ['N','At the bottom of the 1981 box, under the tissue paper: a folded card. “You won it. Now it’s your turn. Make one for next year. Don’t tell a soul.”'],
      ['T','Oh.'],
      ['P','Oh, my.'],
      ['N','There’s a card like it in every box. Every one in different writing.'],
      ['T','So whoever wins the Mystery Prize makes the next one. Winner to winner. For sixty years.'],
      ['P','And not one of them told. In Pennywhistle. That’s the real miracle, love.'],
      ['M','<em>(Biscuit puts his head on your knee, as if he’s known all along.)</em>'],
    ]},
  { title:'Loud Theories', zone:null, gifts:[['E',3],['gC',1]],
    intro:[
      ['N','Two days to go. The vicar lends you the church clock’s spare works, “for luck”. <em>(A Church Clock is in your gifts. It makes Time Chargers.)</em>'],
      ['T','Right. If the winner makes the next one, whoever won last year made this year’s. Easy. Who won last year?'],
      ['P','Ooh, I couldn’t possibly remember, love.'],
      ['T','You remember the price of jam in 1971.'],
      ['P','…Nine pence.'],
    ],
    outro:[
      ['N','You hold this year’s parcel tag next to the bakery order pad. Same biro. Same smudge. Arjun has gone very red.'],
      ['P','Arjun.'],
      ['T','…It was me. I won last year. First fete without Nan.'],
      ['T','I won a knitted mouse with a rosette on and I cried in the car park. Then I found the card and panicked, so I’ve been accusing everyone very loudly so nobody would look at me.'],
      ['P','You accused the vicar four times.'],
      ['T','He took it very well. He gave me a biscuit.'],
      ['M','<em>(Biscuit, hearing his name, licks Arjun’s hand. It feels like a pardon.)</em>'],
    ]},
  { title:'The Last Segment', zone:null, gifts:[['E',3]],
    intro:[
      ['N','Saturday. The green is full. Bunting on every lamppost, the band warming up, and a queue at your wheel already.'],
      ['O','“Spin it fair. Mostly.” <em>(A new tag, pinned to the wheel. Curly ‘y’s.)</em>'],
      ['T','Mostly? What does she mean, mostly? Who’s she?'],
      ['P','<em>(Dot is very busy with the tea urn.)</em>'],
    ],
    outro:[
      ['N','The last ticket of the day is yours. Dot insists. The wheel clicks round, slows, and stops on the Mystery Prize.'],
      ['N','Inside: Arjun’s wonky cake stand. Under it, a tiny wooden wheel worn smooth, and a card with curly ‘y’s.'],
      ['O','“1962. I was nine and couldn’t afford a ticket, so I made a prize instead, so I could be part of it. Welcome to Pennywhistle, Robin. Your turn. — D.”'],
      ['T','D. DOT. The curly ‘y’! I had it! I just had the wrong vicar!'],
      ['P','And the wheel’s always been a teeny bit rigged, love. Once a year. The Mystery Prize goes to whoever needs it most.'],
      ['P','Fred, the summer his boat went down. Mrs Hale, the year she lost her Ron. Arjun, last year. And you, eating your tea on your own at the bus shelter.'],
      ['T','You knew. Sixty years, and you knew every single one.'],
      ['P','Course I did. It’s my fete. I just liked watching you all look.'],
      ['M','<em>(Biscuit sits on your feet and refuses to move. The band starts the march. Somebody starts a conga.)</em>'],
      ['N','The fete is yours. Merge as long as you like. Somewhere in the Lost Property Box’s chain there is still one thing nobody has seen.'],
    ]},
];

const TASKS = [
  // ch1 — zone 0 only
  {beat:['T','There. He looks startled now, not sinister. That’s an improvement.'], ch:0, who:'T', need:[['F',2]], coins:8, say:'The hoopla rabbit’s missing his nose. Any chance of a carrot?'},
  {beat:['M','(Three proud laps of the storeroom, pennant held high. On the third he knocks over a box, and something inside it rattles.)'], ch:0, who:'M', need:[['P',2]], coins:8, say:'(Biscuit has his eye on a pennant. He wants to parade it round the hall.)'},
  {id:200, side0:1, beat:['H','Junk. Lovely junk. Someone will buy it. Someone always does.'], more:[['P','She’s run that stall since 1979. Where she keeps it all is anybody’s guess.'],['H','Anything you can spare, bring it to me, any time. Fair prices, and every penny goes to the church roof.'],['T','That roof’s been “nearly done” since I was in short trousers.'],['H','Which is exactly why it needs more jumble. My stall stays open, dear, until the last leak is fixed.'],['N','<em>(The White Elephant stall is open. Its orders never run out: bring anything you can spare for coins, tickets and rosettes.)</em>']], ch:0, who:'H', need:[['P',2],['F',1]], coins:8, say:'So you’re the new one. Mrs Hale, White Elephant stall, and I’m short of stock. A pennant and a pea pod will do for a start. No arguing.'},
  {beat:['T','She would, too. Eighty-four years old and she owns a whistle.'], ch:0, who:'T', need:[['P',3]], coins:10, say:'I need a flag string. If the bunting’s not up by the weekend, Dot will have my head.'},
  {beat:['N','Beneath the box, beneath a dusty sheet: the old Prize Wheel. Twenty small bulbs ring the rim. Not one of them lit.'], gifts:[['WH',1]], ch:0, who:'M', need:[['T',1],['F',2]], coins:8, say:'(He’s scrabbling at a box and won’t let go. A yo-yo and a carrot might distract him.)'},
  {beat:['T','Potato toss: ready. And the wheel turns! Right, time to get the big covers off.'], ch:0, who:'T', wheel:1, need:[['T',2],['F',3]], coins:12, say:'A hoopla ring and a potato, please. And give that wheel a spin or two, I want to see it in action.'},
  // ch2 — zone 1, microphone
  {beat:['T','I can now play the drum. Badly. Hey, there’s writing on the rafters. Names, painted, one a year.'], ch:1, who:'T', need:[['L',2]], coins:12, say:'Is that a drum? Can I have the drum? I’ve always wanted the drum.'},
  {beat:['P','Sixty-odd years I’ve been tying flags to that gate. My knees have opinions.'], ch:1, who:'P', need:[['P',4]], coins:14, say:'Crossed flags for the gate, love. It’s not a fete without flags on the gate.'},
  {id:201, ch:1, who:'H', sales:3, need:[['F',3]], coins:12, say:'Stall’s looking bare, dear. Help me shift three lots at the White Elephant, and bring a potato for the window. A good potato sells a stall.', beat:['H','Three sales before lunch. Ron would have said I was showing off. He’d have been right.'], more:[['T','Who’s Ron?'],['H','My husband, dear. Forty years of him. Mind that pennant, it’s sold.']]},
  {beat:['M','(He rolls the cabbage under a trestle and lies on it, guarding.)'], ch:1, who:'M', need:[['F',4]], coins:12, say:'(Biscuit has found a cabbage-shaped hole in his life.)'},
  {beat:['T','Ding! And look: every name on the rafters has a little star by it. Every one a Mystery Prize winner.'], ch:1, who:'T', wheel:2, need:[['T',3],['L',1]], coins:14, say:'A dartboard and a bell for ring-the-bell. And keep that wheel spinning, people want to see it.'},
  {beat:['P','Poor Mr Buttons. Nobody ever picks a teddy with one eye. We’ll find him a home.'], ch:1, who:'P', need:[['P',4],['K',2]], coins:16, say:'More flags, and that teddy. He was a tombola prize in 1979 and nobody’s ever won him.'},
  {beat:['N','Biscuit has found the sunniest spot in the storeroom. It is directly on top of a shoebox full of old gift tags.'], x:1, ch:1, who:'M', need:[['F',4],['L',3]], coins:14, say:'(He wants a cabbage to sleep on and a trumpet to guard.)'},
  // ch3 — zone 2, lost property box
  {beat:['N','There are dozens of mice in the Lost Property Box. Every single one is wearing a rosette.'], ch:2, who:'M', need:[['M',2]], coins:16, say:'(He drops a knitted mouse at your feet. He would like all of them, please.)'},
  {beat:['T','Hook-a-crab. Revolutionary. Pennywhistle isn’t ready.'], ch:2, who:'T', need:[['L',4],['W',2]], coins:18, say:'A sax and that toy crab. The crab’s for the hook-a-duck. Ducks are expensive.'},
  {id:202, ch:2, who:'H', sales:4, need:[['B',2]], coins:18, say:'Four more sales at my stall, dear, and a silk bow for my hat. The vicar’s coming round and I won’t be outdressed by a vicar.', beat:['H','The vicar bought a teapot with no lid. He called it “characterful”. That’s the roof another inch nearer.'], more:[['P','She’s raised more for that roof than the vicar has, love.'],['H','The vicar has a very nice voice. That’s all he has.']]},
  {beat:['P','Fred won the Mystery Prize in 1964. Humbugs. Ever so pleased, he was. His boat had just gone down, you know.'], ch:2, who:'P', need:[['F',5]], coins:18, say:'Sweetcorn for the veg show. Old Fred once grew corn taller than the church.'},
  {beat:['T','Spiky writing. Not curly. Not the vicar. Interesting. VERY interesting.'], ch:2, who:'T', wheel:3, need:[['M',3]], coins:20, say:'If there’s a painted doll in that trunk, I want to see the tag. And spin the wheel, the old prizes have tags too.'},
  {beat:['M','(He catches one. It pops. He is astonished, then delighted.)'], ch:2, who:'M', need:[['P',5]], coins:18, say:'(Biscuit wants to chase a balloon bunch. He has never caught one. He lives in hope.)'},
  {beat:['P','There. Lovely. Mrs Hale will say it’s too much. Mrs Hale says everything is too much.'], x:1, ch:2, who:'P', need:[['P',5],['B',2]], coins:20, say:'Balloons and a bow for the cake stall, love. Presentation is half the battle.'},
  // ch4 — zone 3
  {beat:['P','There’s me, by the wheel, 1990. Hair like a dandelion clock.'], ch:3, who:'P', need:[['M',4]], coins:22, say:'That jigsaw of the green. Let me do the corners, I always do the corners.'},
  {beat:['T','Sun, rain and a seagull attack, all in one afternoon. Normal Saturday.'], ch:3, who:'T', need:[['T',5],['W',3]], coins:22, say:'Cricket bat and a beach brolly. The stall has to survive Pennywhistle weather.'},
  {id:203, ch:3, who:'H', sales:5, need:[['L',3]], coins:22, say:'Five more lots, dear. And if you find a trumpet, I’ll have it. Ron played one. Very badly.', beat:['H','1976 was a hot summer. Ron had just gone, and I stood by that wheel feeling sorry for myself.'], more:[['H','Then it stopped on the Mystery Prize. A bottle of cordial. I drank it on the spot, in front of everyone.'],['T','Wait. YOU won the Mystery Prize? Then you’re in the gang!'],['H','Gang? Don’t be silly, dear. And I’m not saying another word. A lady is allowed one secret.'],['P','<em>(Dot is suddenly very interested in the tea urn.)</em>']]},
  {beat:['N','Biscuit’s stall sells one sweetcorn, at no price. Three people queue anyway.'], ch:3, who:'M', need:[['F',5],['P',6]], coins:22, say:'(He wants a stall sign and some sweetcorn. He seems to think he runs a stall now.)'},
  {beat:['T','Two thousand and three. Dot blamed the Scouts for a decade. So who’s the spoon thief? WHO?'], ch:3, who:'T', wheel:5, need:[['M',5]], coins:26, say:'The wind chime! Those are tea tent spoons, I know it. Spin the wheel too, I need more suspects.'},
  {beat:['P','Best in show goes to… Mrs Hale. Don’t look at me like that, it’s a very good marrow.'], ch:3, who:'P', need:[['B',3],['F',6]], coins:20, say:'A sun hat and the prize marrow, love. I’m judging the veg and I’ll do it in style.'},
  {beat:['N','The wireless crackles into life: the brass band, live from the bandstand, 1988. Dot hums along without noticing.'], x:1, ch:3, who:'M', need:[['T',6],['K',3]], coins:24, say:'(He wants the kite, and he is dragging the old wireless towards it.)'},
  // ch5
  {beat:['T','That was a fanfare. Everyone heard it. The ducks heard it.'], ch:4, who:'T', need:[['T',6],['L',5]], coins:28, say:'Kite and post horn. Opening fanfare. I’ve been practising. Don’t run.'},
  {beat:['P','Sixty years of marrow parades. I’ve only cried at about forty of them.'], ch:4, who:'P', need:[['F',6],['L',6]], coins:30, say:'The marrow and the band score. Every fete ends with the marrow parade and a march.'},
  {id:204, ch:4, who:'H', sales:6, need:[['P',6]], coins:30, say:'Six more lots and a proper stall sign, dear. Last push. The roofer comes on Monday.', beat:['H','That’s it. The last of the jumble, and the roof is paid for. Fifty years of other people’s teapots.'], more:[['P','The whole roof, Bea?'],['H','The whole roof, Dot. Don’t you dare cry, you’ll set me off.'],['T','I’ve never seen Mrs Hale cry.'],['H','And you still haven’t, dear. It’s hay fever.']]},
  {beat:['N','Peace is made. Seagull and terrier share the popcorn. Mostly.'], ch:4, who:'M', need:[['M',5],['R',3]], coins:30, say:'(Biscuit and a seagull are both eyeing the wind chime. Popcorn might settle it.)'},
  {beat:['T','“Welcome to Pennywhistle Fete.” Look at that arch. I could cry. I won’t. I might.'], ch:4, who:'T', wheel:6, need:[['P',7],['K',3]], coins:30, say:'The Welcome Arch, and that wireless for announcements. And the wheel, nearly all of it. Big entrance.'},
  {beat:['P','The kite marrow. Nobody remembers why. Nobody would dare stop.'], x:1, ch:4, who:'P', need:[['F',6],['T',6]], coins:30, say:'Hold the marrow steady while I tie the kite on, love. Don’t ask why. Tradition.'},
  // ch6
  {beat:['T','Horse up. Doughnut… gone. It was a test doughnut.'], ch:5, who:'T', need:[['T',7],['R',4]], coins:34, say:'The carousel horse and an iced doughnut. Every fete needs a horse. And a doughnut. Mostly the doughnut.'},
  {beat:['P','“Your turn.” Every one in different writing, and every one of them meant it.'], more:[['T','Sixty people, and every one kept it quiet for a whole year.'],['P','Longest anybody in Pennywhistle has kept anything, love.']], ch:5, who:'P', need:[['M',6]], coins:34, say:'That card, love. It belongs on the wheel today.'},
  {beat:['N','Biscuit is crowned May Queen. He accepts with enormous dignity, then sneezes.'], ch:5, who:'M', need:[['F',7],['B',4]], coins:34, say:'(The giant pumpkin and the May Queen crown. He has decided he is the May Queen. Nobody argues.)'},
  {beat:['P','There’s the march. Same march every year, and it’s still the best bit.'], x:1, ch:5, who:'P', need:[['L',6],['R',4]], coins:34, say:'The band score and a doughnut for the bandleader. He plays better with icing on.'},
  {ch:5, who:'O', wheel:7, need:[['M',7]], coins:50, say:'“For the wheel. From a friend.”'},
];



const PASS=[
  {pts:15, rw:[['E',2]]},{pts:30, rw:[['H',1]]},{pts:50, rw:[['C',2],['X',2]]},{pts:65, rw:[['E',3]]},{pts:80, rw:[['gD',2]]},
  {pts:95, rw:[['H',2]]},{pts:110, rw:[['E',3],['C',3]]},{pts:130, rw:[['gS',2]]},{pts:145, rw:[['H',2]]},{pts:160, rw:[['E',4]]},
  {pts:185, rw:[['gT',2]]},{pts:210, rw:[['H',2],['X',3]]},{pts:230, rw:[['E',4],['C',3]]},{pts:255, rw:[['H',3]]},{pts:290, rw:[['E',5],['H',3]]},
];

const FELIX=[
  [['N','Tucked into the reward: a note from a past winner. 1964.'],['F','“Dear friend, thank you for the humbugs. My boat went down in March and I thought nobody had noticed. I’ll make one for next year. — Fred.”']],
  [['F','“1976. I drank the cordial on the spot, I was that thirsty and that happy. Ron says I made a show of myself. Worth it. Your turn, whoever you are. — B. Hale.”']],
  [['F','“1996. Thank you for the scarf, wrong team and all. It made me laugh after a long year. I’ll do rock buns. Everybody likes a rock bun. — Asha.”']],
  [['F','“2014. Oven gloves! For a vicar! I shall wear them at the Christmas service and nobody will know why. Bless you, friend. — Rev. Margaret.”']],
  [['F','“Last year. I don’t know who you are, but thank you. Nan would have loved the mouse. I’ll try my best with next year’s. — A.”'],['M','<em>(Biscuit sits on the note until you’ve finished reading it.)</em>']],
];

const MOON_NOTES=[
  [['N','Folded inside the ribbon: a page from Dot’s fete scrapbook.'],['P','“Ribbons. Every child gets one. Even the ones who came last. Especially them.”']],
  [['P','“Rosettes. I make them the night before, with the telly on. Two hundred, give or take.”']],
  [['P','“Silver. Second is a lovely place to be. Nobody makes you give a speech.”']],
  [['P','“Gold. The best prizes always seem to find the right person. Funny, that.”']],
];

const P2={ shopName:'Dot’s Tombola Table', shopBlurb:'Dot sells whatever’s left from the tombola. All proceeds to the church roof' };

const SHOP_ITEMS=[
  {id:'TK', price:()=>80, what:'Ten raffle tickets: one spin of the Prize Wheel', give:()=>{ S.chips=(S.chips||0)+10; }},
  {id:'ET', price:()=>40, what:'Refills one generator. Drag it onto the one you need', give:()=>S.gifts.push(['ET',1])},
  {id:'H1', price:()=>90, what:'Skips 15 minutes on every generator and the urn', give:()=>S.gifts.push(['H',1])},
];

const REFLECTIONS=[
  ['N','Later, with the bunting coming down and the urn finally off, the three of you sit on the Lost Property trunk and put it all in order.'],
  ['P','I started it because I was nine and skint and wanted to belong to something. That’s all, love. That’s the whole secret.'],
  ['T','Sixty years of people making something lovely for a stranger. And every stranger turned out to be a neighbour.'],
  ['P','The rigging was only ever gentle. A thumb on the wheel. You can’t force kindness on anybody, you can only point it the right way.'],
  ['T','I really did think it was the vicar. I want that on the record. It was a reasonable theory.'],
  ['N','The curly ‘y’ was on the very first tag and on this year’s note. Dot never changed her handwriting. Nobody ever thought to compare.'],
  ['P','Fred kept his humbug jar till the day he died. It’s in the Lost Property Box now. Still full.'],
  ['T','Nan made the rock buns the year after she won. I ate four of them and never knew. I’m baking them every fete from now on.'],
  ['P','Mrs Hale still doesn’t know it’s rigged. Don’t tell her. She’ll want a recount of 1976.'],
  ['N','The cake stand goes back in the box. What you keep is the card, and a whole year to think of something.'],
  ['T','Whatever you make, make it daft. The best ones are always a bit daft. Hook-a-crab. Lolly-stick piers.'],
  ['M','(Biscuit drops the knitted terrier at your feet. He has decided it is yours now.)'],
  ['P','You looked so lost at that bus stop. Now look at you. Bunting in your hair.'],
  ['T','Next year I’m running the hoopla. Dot says no. I’m doing it anyway.'],
  ['P','Same time next year, love. Bring a ticket. Or don’t. You’re part of it now.'],
];


const GEN_STORY={
  gD1:[['P','My craft box. Crayons, crepe paper, and sixty years of glitter that will never, ever come out.'],['T','Every flag on the green started life in that box.']],
  gD2:[['N','Two craft boxes, one trestle, and suddenly it’s a proper craft table.'],['P','The Brownies used to sit here. You could hear the glue sticks from the car park.']],
  gD3:[['P','The Thursday Art Club! Six ladies, one gentleman, and very strong opinions about watercolour.'],['T','They painted the Welcome Arch in 1988. Still the best thing in Pennywhistle.']],
  gS1:[['P','My veg trug. Everything that wins at the show passes through this bucket first.'],['T','Dot’s marrows have their own fan club.']],
  gS2:[['N','Behind the hall, the old allotments. Somebody’s left a deckchair and a flask.'],['P','Fred’s plot, that was. Corn taller than the church.']],
  gS3:[['T','A whole farm cart of veg. We could feed the entire village. Twice.'],['P','We could. Mrs Hale would still bring chutney.']],
  gT1:[['T','The games bag! Hoopla rings, a beanbag, and one skittle with a face drawn on it.'],['M','<em>(Biscuit takes the beanbag. The beanbag is his now.)</em>']],
  gT2:[['N','The games tent goes up with only a little bad language.'],['T','Ring the bell, hook a duck, guess the weight of the cake. The classics.']],
  gT3:[['T','A funfair. An actual funfair. Do you know how long I’ve wanted to say that in Pennywhistle?'],['P','Since you were four, love. You told me every year.']],
  gL1:[['T','“Testing, testing.” Right, it works. Mostly.'],['P','Fred wired that too. If it whistles, give it a thump.']],
  gL2:[['N','Two speakers on poles. Every announcement now reaches the beach.'],['P','“Would the owner of a small brown terrier please collect him from the cake stall.” Every single year.']],
  gL3:[['N','The bandstand, freshly painted. The brass band takes its seats.'],['T','They know four songs. They play them all twice. It’s perfect.']],
  gM1:[['P','Every Mystery Prize that ever came back to the hall ends up in here.'],['T','It smells of mothballs and sixty years of good intentions.']],
  gM2:[['N','The boxes stack into a battered prize trunk, covered in stickers from a dozen seaside towns.'],['P','We took the wheel on tour once. Bognor. Never again.']],
  gM3:[['N','Shelves, labels, dates. The whole history of the fete, finally in order.'],['T','Dot, there’s a whole shelf just labelled “GOAT”.'],['P','We don’t talk about the goat.']],
  gK1:[['P','The urn takes eight minutes to boil and it has never once been rushed.'],['T','It’s older than me. It might be older than the hall.']],
  Q1:[['N','A cardboard box on the step, marked “FOR THE FETE”. Nobody ever sees who leaves them.'],['P','The village gives what it can. There’s always something good in the bottom.']],
  Q2:[['T','A big one! Somebody’s cleared out their whole loft.'],['P','That’ll be the Pattersons. They move house every summer and never leave.']],
  Z1:[['P','The compost bin. Feed it scraps and it gives you seedlings. Don’t ask how. It’s Pennywhistle.'],['M','<em>(Biscuit sniffs it once and decides it is beneath him.)</em>']],
  U1:[['T','Fred’s old camping stove. Logs or old bunting in, tea out.'],['P','Best cup you’ll ever have, and it tastes faintly of 1979.']],
  gC1:[['N','The church clock’s spare works, ticking away in a box.'],['P','The vicar swears it runs fast. Put it near anything slow and see.']],
  G4:[['N','The sapling has grown into a proper little apple tree.'],['P','Fruit for the jam stall. It gives a few crops, then it’s firewood. That’s trees, love.']],
  WH1:[['P','And there’s the old girl. Fred’s Prize Wheel. Not one turn since last summer.'],['T','Will she still go round?'],['P','She takes ten tickets a spin, love. Here, the last of last year’s roll. Twenty, exactly. That’s two goes.'],['N','<em>(Dot hands you twenty raffle tickets 🎟️)</em>']],
};

const QUESTS=[
  {id:'gen',   ic:'🔨', n:'Use generators',        steps:[25,100,250,500,1000,2000]},
  {id:'merge', ic:'🔗', n:'Make merges',           steps:[20,50,150,300,600,1200]},
  {id:'wheel', ic:'🎡', n:'Spin the Prize Wheel',  steps:[5,15,30]},
  {id:'side',  ic:'🐘', n:'Sell at the White Elephant',   steps:[3,10,25,50,100]},
  {id:'rare',  ic:'💎', n:'Find rare items',       steps:[3,10,25,50,100]},
  {id:'story', ic:'📜', n:'Fill story orders',     steps:[3,10,20]},
  {id:'high',  ic:'🌟', n:'Make level 5+ items',   steps:[3,10,25,60]},
  {id:'claim', ic:'🪙', n:'Claim coins, stars & tickets', steps:[10,40,100,250]},
  {id:'open',  ic:'📦', n:'Open boxes & cobwebs',  steps:[10,25,45]},
  {id:'disc',  ic:'🧩', n:'Discover new items',    steps:[15,30,50,70]},
  {id:'sell',  ic:'🪙', n:'Sell items',            steps:[5,20,50]},
];



