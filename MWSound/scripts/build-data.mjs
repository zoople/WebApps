// Generates www/data.js. Sketch names: British Comedy Guide episode pages (S1-S4). S5 has no published sketch list.
import fs from 'node:fs';
const dates = {
 1:['2003-08-28','2003-09-04','2003-09-11','2003-09-18','2003-09-25','2003-10-02'],
 2:['2005-02-10','2005-02-17','2005-02-24','2005-03-03','2005-03-10','2005-03-17'],
 3:['2007-05-24','2007-05-31','2007-06-07','2007-06-14','2007-06-21','2007-06-28'],
 4:['2009-08-25','2009-09-01','2009-09-08','2009-09-15','2009-09-22','2009-09-29'],
 5:['2013-11-26','2013-12-03','2013-12-10','2013-12-17','2013-12-24']};
const S = {
's01e01':['Bit of Ham','Now We Know','Sciencey Stuff','Busker','Wedding Vows',"Charlie's House",'Pit Ponies','Cosy Crime Quickie','Hairdressers Sans Frontiers','Alcoholic Snooker Commentators','The Wordmaster','Touching Cloth','Incidental Music','Friends of Freddy, Daphine and Velma'],
's01e02':['Middle Earth Dinner Party','Imagine That','Flightless Birds','Swiss History','Mr Sands: Part 1','Jason the New Presenter','Alcoholic Snooker Commentators','Male Sex in the City','Mr Sands: Part 2','Practical Voodoo','Mother Using Child to Pull - Park','Lazy Writers - Medical Drama','Extreme Advice','Mr Sands: Part 3','Friends of Moneypenny'],
's01e03':['Heavens Above!','Big Talk','Castrati Trail','Jason the New Presenter','Child Call Centre','Rabbit Newsnight','Just £3 a Month','Poets with Funny Voices: Part 1','Welcome to Hufflepuff','Environmental Discussion','Poets with Funny Voices: Part 2',"Mowgli's Parents",'Nick Hornby Epiphany','Poets with Funny Voices: Part 3','Friends of Adolf and Eva'],
's01e04':['Birdsong','Pension Payment Ad',"On Her Majesty's Civil Service",'Understanding Man - Car Breakdown','Downloading the Internet','Alcoholic Snooker Commentators','Understanding Man Hotel','Another New Presenter','Intro Quickie','You Should Say Something','Literary Agent','Big Talk','Mother Using Child to Pull - Doctor','Cat Fishing','Understanding Man','Friends of Nehru'],
's01e05':["MP's Pay",'Adrian Locket: Part 1','Pity Beer','Honky Rap','The Surprising Adventures of Sir Digby Ceaser-Salad','Positive Talk','Adrian Locket: Part 2','Correspondence Golf','Insurance Advertising Sketch','Lazy Writers - Spies','But What Do You Really Think?','Adrian Locket: Part 3','Global Warming','Friends of Darth Vader'],
's01e06':['Arguing the Moral Toss','A Song of Everyone','Porn on 4','Real Drama','Jason the New Presenter','The Doomed Whinge: Part 1','Alcoholic Snooker Commentators','Splitting the Bill','Jobbing Footballers','Intro Quickie','The Doomed Whinge: Part 2','Mobile Mate','Horse Aphasia','Polls','The Doomed Whinge: Part 3','Birthday Treat','I Could Have Done That','Friends of Bosie'],
's02e01':['The Fox and the Badger','Big Talk','Adrian Locket: Part 1','Lactose Intolerant','Horny Snooker Commentators: Part 1','Football Trail','Lazy Film Writers - Space','Horny Snooker Commentators: Part 2','Channel 4 Announcement','Adrian Locket: Part 2','Nazi Realisation','Adrian Locket: Part 3','100 Worst Human Beings','Friends of June Sarpong'],
's02e02':['The Corner Shop','Mad Bears: Part 1','Broke-Aware Snooker Commentators: Part 1','Imagine That','Mad Bears: Part 2','Stone Age CSI','Broke-Aware Snooker Commentators: Part 2','Caricaturist','Mad Bears: Part 3','Unity of Purpose','Ex-Eulogy',"Other People's Kids",'Mad Bears: Part 4','Broke-Aware Snooker Commentators: Part 3','Friends of Saddam Hussein','Mad Bears: Part 5'],
's02e03':["Honeymoon's Over Restaurant",'Fight-Obsessed Snooker Commentators: Part 1','No-One Drowned','Numberwang','Final Score','Fight-Obsessed Snooker Commentators: Part 2','Angel Summoner and the BMX Bandit: Part 1','Doors','Football vs Cricket','Angel Summoner and the BMX Bandit: Part 2','Big Talk','Fight-Obsessed Snooker Commentators: Part 3','Angel Summoner and the BMX Bandit: Part 3','Friends of Greg Dyke'],
's02e04':['Preston Loader','Daytime Coverage of Things: Part 1','TV Hungry Snooker Commentators: Part 1','Train Safety','Daytime Coverage of Things: Part 2','Basic Social Interaction Man: Part 1','Imagine That','TV Hungry Snooker Commentators: Part 2','The Row','Public Information Smoke Alarms','Daytime Coverage of Things: Part 3','Sh*tly Famous','Just £3 a Month','Daytime Coverage of Things: Part 4','TV Hungry Snooker Commentators: Part 3','Daytime Coverage of Things: Part 5','Friends of Dr. Jekyll'],
's02e05':['Gay-Obsessed Snooker Commentators: Part 1','Solo Man','Adrian Locket: Part 1','Charity Bitching','Gay-Obsessed Snooker Commentators: Part 2','Imagine Hat','The New Chief Executive','Cocktails','Christmas Newsletter Reply',"So Much You Don't Know",'Gay-Obsessed Snooker Commentators: Part 3','Twins','Friends of Lewis'],
's02e06':['Would Like To Be Normal: Part 1','Would Like To Be Normal: Part 2','Consolidate Your Debts','Suicide-Obsessed Snooker Commentators: Part 1',"Queen's Execution","This isn't a Bookshop",'Pact With the Devil','Suicide-Obsessed Snooker Commentators: Part 2','It','Imagine a World: Radio','Lazy Film Writers: British Sport Underdog Film','Suicide-Obsessed Snooker Commentators: Part 3','Friends of Maid Marion'],
's03e01':['The Dawn of Bronze','Over to You: Part 1','Rally: Part 1','We','Beaufort','Over to You: Part 2','Rally: Part 2','Identity Theft',"Don't Interfere",'Not Listening to Martin','Rally: Part 3','Wedding News','Buy Me','Looser','Rally: Part 4','Speech Impediment','Over to You: Part 3'],
's03e02':['Davenport Recruitment','Week by Week Dickens','Demetrius Unmasked: Part 1','Hard Hitting Interview','Demetrius Unmasked: Part 2','Hot Oil Towers','Little Date: Teacher','Week by Week Mona Lisa','By the Book','HD','Afternoon Play','Ad Music',"I'm here for you",'Week by Week Numbers','Bear Hands'],
's03e03':['Help Desk','Imagine That','Death and Ice Cream','Cars and Cheese','Date With a Warlord','Celebrity Fame Zeppelin','New Bra','Speculate to Accumulate','Ahead of His Time Scientist','Chickens and Taps','Lunatic in a Box','Family Tree','Anything can be music','Asbo Zaprudder'],
's03e04':['Can I come out yet?','Rural Slum','Similes','Undertaker',"Sight Seeing: St Paul's",'Foxtitute','Footie','Master Shinjuku','Sight Seeing: Eye','Step up to the plate','Little Date: Travel Agent','The Surprising Adventures of Sir Digby Chicken-Ceaser','He Man','Sight Seeing: Trafalgar Square'],
's03e05':['Mission Statement','Turner and I','C&A','Are you taking advantage?','Afternoon Play: Postman','The Main Thing is the Three Points','Zombie Poppins','Question Time Rant','Audio Guide','Zoo','The Top 100 Films','Anthropomorphic Shower'],
's03e06':['The Pilot','The Stock Market','Office Olympics: Part 1','Little Date: Library','Office Olympics: Part 2','Gary Rhodes',"But I won't do that",'Office Olympics: Part 3',"The World's Most Ornate Object",'Robin Hood','Plastic Surgery','Nothing Funny Here'],
's04e01':['Caesar','iReckon','Stargate 1','Top Cat','Counting Whales','Bleach','New Formats','Ghost Charity','Institute of Extraordinary Creatures','Brains over Beauty','The Old Lady Hearings 1 (Doctor)','Tycoons'],
's04e02':['All The Gurkhas','Compare Compare Compare','Naming a Star','Make Me a Celebrity Centaur','The Weather Brain','The Telling Off','The Old Lady Hearings 2 (PR Exec)','Certificate 33A','Announcer','Stargate 2 (Urinal)','Medieval Gap Year',"Christopher Hitchins' Hour 1",'Ampersand'],
's04e03':['Need to Know Jesus','Horse','The Old Lady Hearings 3 (City Trader)','Accelerator Razor','Crying Wolf','Metil or Normil','The Bear Man',"Christopher Hitchins' Hour 2",'Stargate 3 (Workplace Bullying)','She Looks Like You','Invisible Chinese Otter Hound','Zorro'],
's04e04':['The Office Next Door',"Who's the Winner?",'Taste Snobbery','Pinocchio Adoption','Stargate 4 (Work Experience)','SayItWithSomeCheese','Lazy Writers (Thatcher)','Pinocchio Lady','Decadence','Balloon Animal Sanctuary','The Old Lady Hearings 4 (Wedding Planner)','Pinocchio Goodbye'],
's04e05':['Heads','Business Drinking Game','Same Voice','Superhero Date','Leave Your Body to Evil','Stargate 5 (Smoking & Supplies)','Goldfish and Dolittle','Rapunzel','The Old Lady Hearings 5 (Traffic Warden)','The Last Farce'],
's04e06':['Geoff is Superman 1','Yoghurt! An Advert','Inspector Wright','Bums on Seats','Geoff is Superman 2 (Message)','Medieval Chef','Weekend Newspaper','Michael Sheen','Geoff is Superman 3 (Parcel)','Stargate 6 (Health & Safety)','Board Games','Geoff is not Superman','The Old Lady Hearings 6 (Comedians)'],
};
const eps = [];
for (const s of [1,2,3,4,5]) dates[s].forEach((d,i)=>{
  const id = `s0${s}e0${i+1}`;
  eps.push({ id, series:s, ep:i+1, date:d,
    file:`That Mitchell and Webb Sound - ${id} - ${d}.mp3`,
    sketches:(S[id]||[]).map(n=>({n})) , named: !!S[id] });
});
const out = `// Generated by scripts/build-data.mjs. Sketch names: British Comedy Guide (S1-S4). S5 has no published sketch list -> auto-named.\n`+
 `window.MW_BASE = 'https://archive.org/download/that-mitchell-and-webb-sound-thmianweso/';\n`+
 `window.MW_EPISODES = ${JSON.stringify(eps)};\n`+
 `// OPTIONAL real timestamps: { "s01e01": [0, 95.5, 210, ...] } one start time (seconds) per sketch, in order. Used until you edit in-app.\n`+
 `window.MW_TIMESTAMPS = {};\n`;
fs.writeFileSync('www/data.js', out);
console.log(eps.length,'episodes;', eps.filter(e=>e.named).length,'with names;', eps.reduce((a,e)=>a+e.sketches.length,0),'sketches');
