/* ============================================================
   TACO SHOP: CARNAGE ASADA  --  the run, both shifts, render pipeline
   ============================================================

   A run is twenty levels that alternate the Delivery Shift and the Kitchen
   Shift (content/levels.json). Every level is a checkpoint race: reach the
   target (15, or 9 on Supreme) before the clock reaches 0:00. Time comes only
   from the starting clock and the extensions every third completion earns
   (GDD II.D, difficulty.md, owner ruling 2026-10-25 "every 3 completed").

   The score is the money across every level played -- G.earned, for the whole
   run. Each level also keeps levelEarned for its clear card. Stars are a
   report card, never money and never on the board.

   Flow:  title -> mode select -> level card -> shift -> LEVEL CLEAR -> ...
          0:00 -> GAME OVER -> initials if it places -> CONTINUE? 10s
          level 20 cleared -> victory -> initials if it places -> board
*/
'use strict';

const HEAT_MAX = 100;
/* Weather, rolled per delivery level (see G.rollWeather). Grip multiplies
   Player's: snow is the shipped winter at 0.62; rain is a little slick; a
   sunny winter's ploughed roads keep a little of winter's slip. */
/* the chance of the season's NON-default: rain in summer, sun in winter. Winter
   is mostly snowy (owner ruling, 2026-11-07): snow is the winter the game was
   tuned in, and an even chance made half of all winters nearly as easy as summer. */
const WEATHER_CHANCE = { summer: 0.5, winter: 0.2 };
const WEATHER_GRIP = { summer: { sunny: 1, rainy: 0.84 }, winter: { snowy: 0.62, sunny: 0.9 } };
const WEATHER_ROADS = {
  summer: { sunny: 'DRY', rainy: 'WET - A LITTLE SLICK' },
  winter: { snowy: 'SNOW - THE BACK END STEPS OUT', sunny: 'PLOUGHED - THE ODD ICY PATCH' },
};
const BAG_MAX = 3;
const RAIL_EJECT = 52;      // px from the corridor centre a wreck throws you
const THROW_CD = 0.34;
const CONTINUE_SECS = 10;   // GDD II.F

/* Used only if content/difficulty.json fails to load, so a broken content
   file can never blank the game. build.mjs validates the real thing. */
const DIFF_FALLBACK = {
  start: 180, extend: 90, maxExt: 5, target: 15,
  tipStart: 2000, tipFloor: 200, tipDecay: 100 / 3, perfectBonus: 500,
  fines: { ticket: 500, ped: 200, train: 500, remake: 150 },
  nav: { panel: true, line: true, dot: true, edge: true, beacon: true },
  kitchen: { tipPerItem: 500, decay: 100 / 8, maxItems: 3, every: 25,
             cleanBonus: 500, hint: true, railMax: 3, queueMax: 3 },
};
const NAV_FULL = { panel: true, line: true, dot: true, edge: true, beacon: true };

/* Attract rotation, cabinet-style: title -> winners -> scores -> demo. The
   durations are authored in content/attract.json and inlined as ATTRACT by
   build.mjs. attract.md asks for the board as its own screen (the owner's
   authored content wins over the old alternating middle slot). */
const ATTRACT_TITLE = ATTRACT.title.seconds;
const ATTRACT_WINNERS = ATTRACT.winners.seconds;
const ATTRACT_DEMO = ATTRACT.demo.seconds;
const ATTRACT_SCORES = ATTRACT.scores.seconds;
const TITLE_HOLD = ATTRACT.title.wordmarkHold;   // badge alone, before the slam
const TITLE_FADE = 0.25;                         // how fast it stops being transparent
const TITLE_GROW = 2.0;                          // and how long it takes to reach full size
const TITLE_FROM = 0.28;                         // starting scale of that grow
const TITLE_Y    = 137;                          // top of the wordmark at rest
const TAG_Y      = 126;                          // and of the "IN" that links the two halves
const TAG_HOLD   = 0.5;                          // which arrives on its own beat, before it
/* The lockup reads TACO SHOP / IN / CARNAGE ASADA and stages in that order:
   badge, then the tag at 0.5s, then the wordmark growing from 1s. At scale 1
   the tag is 11x7, which centres in the 15px the badge and wordmark leave with
   4px of air either side -- badge ends 122, tag 126-133, wordmark 137. */
const ENTRY_TIMEOUT = 30;                        // seconds idle before the wheel confirms itself
const WINNERS_BLUE = '#1f1fa8';

const MODES = [
  { k: 'A', name: 'KEYBOARD + MOUSE', sub: 'WASD OR ARROWS, MOUSE TO AIM' },
  { k: 'B', name: 'ARCADE STICK', sub: 'STICK + 3 BUTTONS, NO MOUSE' },
  { k: 'C', name: 'TOUCH', sub: 'ON-SCREEN STICK AND BUTTONS' },
];

const G = {
  state: 'boot', time: 0, shift: 0, earned: 0,
  combo: 1, comboPop: 0, heat: 0, heatMax: HEAT_MAX,
  bag: BAG_MAX, bagMax: BAG_MAX, needPickup: false,
  player: null, traffic: [], peds: [], flying: [], cop: null, copT: 0,
  train: null, trainT: 0, crossings: [], railSide: 0, wreckCd: 0,
  cam: { x: 0, y: 0 }, shake: 0, shakeX: 0, shakeY: 0, hitstop: 0,
  order: null, banner: '', bannerT: 0, bannerCol: PAL.bone,
  throwCd: 0, restock: 0, tipPop: 0, infraction: 0,
  stats: null, titleCam: 0, titleT: 0, titleSlam: false, paused: false, flash: 0,
  attractT: 0, demoAim: null,
  scoresFromShift: false, scoreIdx: -1,
  entryIni: [0, 0, 0], entrySlot: 0, entryT: 0, placed: false, afterEntry: 'scores',
  rl: [],

  /* the run */
  seed: 0, levelN: 1, level: null, diffKey: 'easy', diff: DIFF_FALLBACK, nav: NAV_FULL,
  era: 1, winter: false, weather: 'sunny', weatherPin: null, stage: 'delivery', mapN: 0,
  levelEarned: 0, levelStars: 0, stars: 0, done: 0, extUsed: 0,
  cardT: 0, contT: 0, modeIdx: 0, startLevel: 1,
  snow: [], snowMask: null, snowImgs: null,
  rain: [], splash: [], rainMask: null,

  /* ---------------- setup ------------------------------- */
  boot(seed) {
    this.seed = seed;
    Art.build(makeRng(seed ^ 0x5eed));
    Scores.load();       // before any overlay can draw the board
    Faces.build();       // decode baked likenesses once, like Art.build
    const p = typeof location !== 'undefined' && location.search ? new URLSearchParams(location.search) : null;
    this.startLevel = clamp(parseInt(p && p.get('level'), 10) || 1, 1, this.levels().length);
    /* ?weather=rainy|snowy|sunny pins the roll, for looking at one on purpose */
    if (p && p.get('weather')) this.weatherPin = p.get('weather');
    this.setLevel(1);    // builds Map 1, which the title drives over
    Hud.buildMap();
    this.toTitle();
  },

  levels() {
    if (typeof LEVELS !== 'undefined' && LEVELS.length) return LEVELS;
    const out = [];
    for (let n = 1; n <= 20; n++) out.push({ n, type: n % 2 ? 'delivery' : 'kitchen', name: 'LEVEL ' + n,
      era: n <= 6 ? 1 : n <= 12 ? 2 : 3, season: n % 4 === 1 || n % 4 === 0 ? 'summer' : 'winter',
      difficulty: n <= 6 ? 'easy' : n <= 12 ? 'medium' : n <= 18 ? 'hard' : 'supreme', year: 1972 });
    return out;
  },

  /* Point the whole game at level n: difficulty, era, season, map. Regenerates
     the city when the era's map changes -- the streets are the same in every
     era, the zoning is not. */
  setLevel(n) {
    const L = this.levels();
    this.levelN = clamp(n, 1, L.length);
    this.level = L[this.levelN - 1];
    this.diffKey = this.level.difficulty || 'easy';
    const D = typeof DIFFICULTY !== 'undefined' && DIFFICULTY[this.diffKey];
    this.diff = D || DIFF_FALLBACK;
    this.nav = this.diff.nav || NAV_FULL;
    this.era = this.level.era || 1;
    this.winter = this.level.season === 'winter';
    this.stage = this.level.type === 'kitchen' ? 'kitchen' : 'delivery';
    this.weather = this.rollWeather();
    Player.gripMul = WEATHER_GRIP[this.winter ? 'winter' : 'summer'][this.weather];
    const map = this.level.map || this.era;
    if (map !== this.mapN) {
      City.map = typeof MAPS !== 'undefined' && MAPS[map] ? MAPS[map] : HAYS;
      City.gen(makeRng(this.seed));
      this.mapN = map;
      this.snowMask = null; this.snowImgs = null; this.rainMask = null;
    }
    if (this.winter && !this.snowMask) this.buildSnow();
    if (this.weather === 'rainy' && !this.rainMask) this.buildRain();
  },

  /* Weather, the owner's ruling of 2026-11-07: a delivery level rolls its own
     every time it is played. Summer is sunny or rainy; winter is snowy or
     sunny, and a sunny winter keeps the old snow on the ground and roofs --
     the look -- with the roads ploughed and nothing falling. The kitchen keeps
     the season's default: there is no sky to see from the line, and a level
     card promising rain over a steam table would be a lie.
     weatherPin (?weather=, or 'season' for the default) fixes the roll; the
     test suite pins 'season' so the driving it measures is the summer it was
     tuned in. */
  rollWeather() {
    const pick = this.winter ? ['snowy', 'sunny'] : ['sunny', 'rainy'];
    const pin = this.weatherPin;
    if (this.stage === 'kitchen' || pin === 'season') return pick[0];
    if (pick.includes(pin)) return pin;
    return Math.random() < WEATHER_CHANCE[this.winter ? 'winter' : 'summer'] ? pick[1] : pick[0];
  },

  /* the level card's title: the weather is news only when it is not the
     season's default, so a rainy summer and a sunny winter say so */
  levelTitle() {
    const n = (this.level && this.level.name) || '';
    if (this.weather === 'rainy') return 'RAINY ' + n;
    if (this.winter && this.weather === 'sunny') return 'SUNNY ' + n;
    return n;
  },

  toTitle() {
    this.state = 'title';
    this.titleCam = 0;
    this.titleT = 0; this.titleSlam = false;
    this.shake = 0;
    this.attractT = ATTRACT_TITLE;
    this.paused = false; this.demoAim = null;
    Audio5.sirenOff();
    Dialog.drop();
    this.player = new Player(City.shop.dock.x, City.shop.dock.y + 70, -PI / 2);
    this.traffic.length = 0; this.peds.length = 0; this.flying.length = 0;
    this.cop = null; Nav.clear(); Fx.clear();
    this.resetRail();
    this.cam.x = clamp(City.shop.x - VW / 2, 0, WW - VW);
    this.cam.y = clamp(City.shop.y - VH / 2, 0, WH - VH);
    this.seedTraffic(26); this.seedPeds(20);
    this.playMusic('title');
  },

  toWinners() {
    this.state = 'winners';
    this.attractT = ATTRACT_WINNERS;
  },

  /* The board serves twice: an attract screen on a timer, and the screen at
     the end of a finished run. One flag tells them apart. */
  toScores(fromShift) {
    this.state = 'scores';
    this.scoresFromShift = !!fromShift;
    this.attractT = ATTRACT_SCORES;
    if (!fromShift) this.scoreIdx = -1;
  },

  toEntry() {
    this.state = 'entry';
    this.entryIni = [0, 0, 0];        // all slots start at A, so a timeout yields AAA
    this.entrySlot = 0;
    this.entryT = ENTRY_TIMEOUT;
  },

  commitEntry() {
    const ini = this.entryIni.map((i) => INI_ALPHA[i]).join('');
    this.scoreIdx = Scores.insert(ini, this.earned);
    Audio5.sfx('cash');
    if (this.afterEntry === 'cont') this.toCont();
    else this.toScores(true);
  },

  /* attract.md: the demo plays a RANDOM level -- a delivery level driven by
     Demo, or a kitchen level cooked by the Kitchen's autoplayer. The tests
     pass a level number to pin it. */
  toDemo(n) {
    const L = this.levels();
    const pick = n || this.demoPin || (1 + ((Math.random() * L.length) | 0));
    this.setLevel(pick);
    this.combo = 1; this.levelEarned = 0; this.levelStars = 0; this.done = 0; this.extUsed = 0;
    this.nav = NAV_FULL;                      // the demo shows the game at its friendliest
    if (this.stage === 'kitchen') {
      Kitchen.enter(this.level, this.diff, true);
      this.shift = 999; this.earned = 0;
      this.state = 'kdemo';
    } else {
      this.startShift();
      this.state = 'demo';
      this.shift = Math.max(this.shift, ATTRACT_DEMO + 30);
      this.banner = ''; this.bannerT = 0;
      this.demoAim = null;
      Demo.reset(this.player);
    }
    this.attractT = ATTRACT_DEMO;
    this.playMusic(pick);
  },

  toMode() {
    this.state = 'mode';
    this.modeTouched = false;
    const want = typeof Pad !== 'undefined' ? Pad.detect() : 'A';
    this.modeIdx = Math.max(0, MODES.findIndex((m) => m.k === want));
  },

  /* ---------------- the run ------------------------------ */
  startRun(n) {
    this.earned = 0; this.stars = 0;
    this.runStart = n;
    this.toCard(n);
  },

  /* The level card. The stage is built underneath it -- the city or the
     kitchen -- so the card reads as the shift about to start, not as a
     loading screen. */
  toCard(n) {
    this.setLevel(n);
    this.state = 'card';
    this.cardT = 0;
    this.paused = false;
    Dialog.drop();
    if (this.stage === 'kitchen') Kitchen.enter(this.level, this.diff, false);
    else this.prepDelivery();
    this.shift = this.diff.start;
    this.playMusic(n);
  },

  beginShift() {
    this.shift = this.diff.start;
    this.levelEarned = 0; this.levelStars = 0; this.done = 0; this.extUsed = 0;
    this.combo = 1; this.comboPop = 0;
    if (this.stage === 'kitchen') {
      this.state = 'kitchen';
      this.stats = Kitchen.stats;
      Nav.clear();
      this.say('ORDER UP!', PAL.amber);
      Audio5.sfx('start');
    } else this.startShift(true);
  },

  /* A delivery shift. Kept as its own entry point: the test suite and the
     attract demo both call it directly. */
  startShift(fromCard) {
    if (!fromCard) {
      this.shift = this.diff.start;
      this.levelEarned = 0; this.levelStars = 0; this.done = 0; this.extUsed = 0;
      this.combo = 1; this.comboPop = 0;
    }
    this.stage = 'delivery';
    this.prepDelivery();
    this.state = 'play';
    this.newOrder();
    this.say('CLOCK IN!', PAL.amber);
    Audio5.sfx('start');
  },

  prepDelivery() {
    this.heat = 0;
    this.bag = BAG_MAX; this.needPickup = false;
    this.cop = null; this.copT = 0; this.shake = 0; this.hitstop = 0;
    this.throwCd = 0; this.restock = 0; this.infraction = 0;
    this.stats = { delivered: 0, perfect: 0, splat: 0, best: 0, peds: 0, tickets: 0 };
    this.flying.length = 0; Fx.clear();
    this.order = null; Nav.clear();
    this.resetRail();
    const d = City.shop.dock;
    this.player = new Player(d.x, d.y + 40, PI / 2);
    this.cam.x = clamp(d.x - VW / 2, 0, WW - VW);
    this.cam.y = clamp(d.y - VH / 2, 0, WH - VH);
    this.traffic.length = 0; this.peds.length = 0;
    this.seedTraffic(30); this.seedPeds(24);
  },

  /* Every completion, in either shift, comes through here: every third earns
     an extension, up to the difficulty's cap, and the target clears the
     level. The target is 3 x the cap, so the level clears on the completion
     that would have earned the last extension. */
  onComplete() {
    if (this.state !== 'play' && this.state !== 'kitchen') return;
    this.done++;
    const D = this.diff;
    if (this.done >= D.target) { this.levelClear(); return; }
    if (this.done % 3 === 0 && this.extUsed < D.maxExt) {
      this.extUsed++;
      this.shift += D.extend;
      this.say('+' + clockStr(D.extend) + ' EXTENSION', PAL.cyan);
      Audio5.sfx('extend');
    }
  },

  cleanBonus() { return this.diff.kitchen.cleanBonus; },

  levelClear() {
    this.state = 'clear';
    this.cardT = 0;
    Audio5.engineOff(); Audio5.sirenOff();
    this.cop = null; Nav.clear(); Dialog.drop();
    Audio5.sfx('clear');
    this.flash = 0.2;
  },

  nextLevel() {
    if (this.levelN >= this.levels().length) { this.toVictory(); return; }
    this.toCard(this.levelN + 1);
  },

  timeUp() {
    this.state = 'over';
    this.cardT = 0;
    this.shift = 0;
    this.placed = Scores.qualifies(this.earned);
    this.scoreIdx = -1;
    Audio5.engineOff(); Audio5.sirenOff();
    this.cop = null; Nav.clear(); Dialog.drop();
    Audio5.sfx('over');
  },

  /* GDD II.F: initials FIRST, so the run is on the board before anything
     else can happen to it; then CONTINUE?. */
  afterOver() {
    if (this.placed) { this.afterEntry = 'cont'; this.toEntry(); }
    else this.toCont();
  },

  toCont() {
    this.state = 'cont';
    this.contT = CONTINUE_SECS;
  },

  toVictory() {
    this.state = 'victory';
    this.cardT = 0;
    this.placed = Scores.qualifies(this.earned);
    this.scoreIdx = -1;
    Audio5.sfx('clear');
  },

  playMusic(key) {
    this.musicKey = key;
    if (typeof Music === 'undefined' || typeof PLAYLIST === 'undefined' || !Audio5.ready) return;
    const ids = PLAYLIST[key];
    if (ids && ids.length && Music.playList) Music.playList(ids);
  },

  /* ---------------- orders ------------------------------- */
  newOrder() {
    const p = this.player;
    let best = null, bestScore = -1;
    for (let i = 0; i < 90; i++) {
      const h = City.houses[(Math.random() * City.houses.length) | 0];
      if (this.order && this.order.house === h) continue;
      const d = hyp(h.cx - p.x, h.cy - p.y);
      // the demo gets nearer addresses: it has 45 seconds to show a delivery
      // actually completing, and cross-town runs eat the whole window
      if (d < 230 || d > (this.state === 'demo' ? 560 : 980)) continue;
      const s = Math.random();
      if (s > bestScore) { bestScore = s; best = h; }
    }
    if (!best) best = City.houses[(Math.random() * City.houses.length) | 0];
    const D = this.diff;
    this.order = {
      house: best, label: best.addr,
      tip: D.tipStart, max: D.tipStart, floor: D.tipFloor, decay: D.tipDecay,
    };
    this.syncNav();
    /* at the dock -- where every order after a restock starts -- a pop above
       the car lands on the shop's own sign, so it goes below there */
    const atDock = hyp(p.x - City.shop.dock.x, p.y - City.shop.dock.y) < 60;
    Fx.pop(p.x, atDock ? p.y + 16 : p.y - 22, 'NEW ORDER', PAL.amber);
  },

  syncNav() {
    if (this.needPickup) {
      const z = City.shop;
      Nav.setGoal({ x: z.dock.x, y: z.dock.y, node: z.node, label: 'TACO SHOP' });
    } else if (this.order) {
      const h = this.order.house;
      Nav.setGoal({ x: h.porch.x + h.porch.w / 2, y: h.porch.y + h.porch.h / 2, node: h.node, label: h.addr });
    }
  },

  say(msg, col) { this.banner = msg; this.bannerCol = col || PAL.bone; this.bannerT = 1.6; },

  fine(cents) {
    this.earned = Math.max(0, this.earned - cents);
    this.levelEarned = Math.max(0, this.levelEarned - cents);
  },

  /* ---------------- spawning ----------------------------- */
  seedTraffic(n) { for (let i = 0; i < n; i++) this.spawnCar(true); },
  spawnCar(anywhere) {
    const p = this.player;
    for (let a = 0; a < 24; a++) {
      const dir = (Math.random() * 4) | 0;
      const perp = dir % 2 === 0 ? p.y : p.x;
      const lane = clamp(Math.round((perp - SEG0) / PITCH) + ((Math.random() * 3) | 0) - 1, 0, BLOCKS);
      const fixed = Traffic.laneFixed(lane, dir);
      const alongP = dir % 2 === 0 ? p.x : p.y;
      const off = anywhere ? rand(-620, 620) : (Math.random() < 0.5 ? -1 : 1) * rand(300, 600);
      const along = alongP + off;
      if (along < SEG0 + 40 || along > SEG0 + BLOCKS * PITCH + 40) continue;
      const x = dir % 2 === 0 ? along : fixed;
      const y = dir % 2 === 0 ? fixed : along;
      if (hyp(x - p.x, y - p.y) < 120) continue;
      let clash = false;
      for (const c of this.traffic) if (hyp(c.x - x, c.y - y) < 42) { clash = true; break; }
      if (clash) continue;
      this.traffic.push(new Traffic(x, y, dir, lane, (Math.random() * Art.car.length) | 0));
      return;
    }
  },
  seedPeds(n) { for (let i = 0; i < n; i++) this.spawnPed(); },
  spawnPed() {
    const p = this.player;
    const pbx = clamp(Math.floor((p.x / TS - BORDER) / SPAN), 0, BLOCKS - 1);
    const pby = clamp(Math.floor((p.y / TS - BORDER) / SPAN), 0, BLOCKS - 1);
    const bx = clamp(pbx + ((Math.random() * 5) | 0) - 2, 0, BLOCKS - 1);
    const by = clamp(pby + ((Math.random() * 5) | 0) - 2, 0, BLOCKS - 1);
    this.peds.push(new Ped(bx, by));
  },

  nearScreen(x, y) {
    return x > this.cam.x - 40 && x < this.cam.x + VW + 40 && y > this.cam.y - 40 && y < this.cam.y + VH + 40;
  },

  /* ---------------- throwing ----------------------------- */
  aimPoint() {
    const p = this.player;
    let ax, ay;
    const pad = typeof Pad !== 'undefined' && Pad.aiming;
    if (this.state === 'demo' && this.demoAim) { ax = this.demoAim.x; ay = this.demoAim.y; }
    /* throwNow too: on the release that throws, aiming is already false, and
       the bag must still go where the stick was pointing */
    else if (pad || (typeof Pad !== 'undefined' && Pad.throwNow)) { ax = p.x + Pad.aimX; ay = p.y + Pad.aimY; }
    else if (Input.hasMouse && (typeof Pad === 'undefined' || Pad.mode === 'A')) { ax = this.cam.x + Input.mx; ay = this.cam.y + Input.my; }
    else { ax = p.x + Math.cos(p.ang) * 84; ay = p.y + Math.sin(p.ang) * 84; }
    const dx = ax - p.x, dy = ay - p.y, d = hyp(dx, dy);
    if (d > MAXTHROW) { ax = p.x + dx / d * MAXTHROW; ay = p.y + dy / d * MAXTHROW; }
    if (d < 14) { ax = p.x + Math.cos(p.ang) * 14; ay = p.y + Math.sin(p.ang) * 14; }
    return { x: ax, y: ay };
  },

  tryThrow() {
    if (this.throwCd > 0 || this.bag <= 0 || this.player.spinT > 0) {
      // keep this under 31 chars: the banner box is textW(str,2)+16 and the
      // screen is only 384px, so a longer string hangs off both edges
      if (this.bag <= 0) { this.say('OUT OF TACOS - BACK TO SHOP', PAL.bad); Audio5.sfx('recalc'); }
      return;
    }
    const p = this.player, a = this.aimPoint();
    // accuracy falls off with speed -- slowing down is the skill, not a chore
    const spread = clamp(p.speed / MAXSPD, 0, 1) * 22;
    this.flying.push(new Bag(p.x, p.y, a.x, a.y, spread));
    this.bag--;
    this.throwCd = THROW_CD;
    if (this.bag === 0) { this.needPickup = true; this.syncNav(); }
    Audio5.sfx('throw');
  },

  onLand(z) {
    const o = this.order;
    const hit = (r) => z.x > r.x && z.x < r.x + r.w && z.y > r.y && z.y < r.y + r.h;

    if (o && hit(o.house.porch)) {
      const perfect = hit(o.house.door);
      this.complete(perfect, z);
      return;
    }
    /* wrong address? */
    let wrong = null;
    for (const h of City.houses) {
      if (Math.abs(h.cx - z.x) > 120 || Math.abs(h.cy - z.y) > 120) continue;
      if (z.x > h.porch.x && z.x < h.porch.x + h.porch.w && z.y > h.porch.y && z.y < h.porch.y + h.porch.h) { wrong = h; break; }
    }
    this.miss(z, wrong);
  },

  /* A line for the dialogue strip, from content/dialogue.json. A line may
     carry an era floor -- "2|HELLOOO? MCFLY?" only plays from the 1980s on
     -- so nobody quotes a film that has not come out yet. */
  pickLine(kind) {
    if (typeof DIALOGUE === 'undefined') return null;
    const all = DIALOGUE[kind];
    if (!all || !all.length) return null;
    const ok = [];
    for (const s of all) {
      const m = /^(\d)\|(.*)$/.exec(s);
      if (!m) ok.push(s);
      else if (this.era >= +m[1]) ok.push(m[2]);
    }
    return ok.length ? ok[(Math.random() * ok.length) | 0] : null;
  },

  /* One line from the customer, over the dialogue strip. Kept out of the demo:
     attract mode is a shop window and a talking head over it reads as a
     cutscene rather than as play. */
  react(kind, order, hostile) {
    if (this.state !== 'play' || typeof DIALOGUE === 'undefined') return;
    const line = this.pickLine(kind);
    if (!line) return;
    const cast = Kitchen.castFor(this.era);
    Dialog.say(DIALOGUE.who, line, {
      face: cast[(Math.random() * cast.length) | 0],
      hostile: hostile,
      hood: hostile ? 3 : 1,
      sub: order && order.house ? order.house.addr : '',
      meter: order ? clamp((order.tip - order.floor) / Math.max(1, order.max - order.floor), 0, 1) : null,
      secs: 3.0,
    });
  },

  complete(perfect, z) {
    const o = this.order;
    const base = Math.round(o.tip) + (perfect ? this.diff.perfectBonus : 0);
    const paid = Math.round(base * this.combo);
    this.earned += paid; this.levelEarned += paid;
    this.stats.delivered++;
    if (perfect) { this.stats.perfect++; this.levelStars++; this.stars++; }
    this.stats.best = Math.max(this.stats.best, paid);
    this.combo = Math.min(3, this.combo + 0.25);
    this.comboPop = 0.4;

    Fx.cash(z.x, z.y);
    Fx.pop(z.x, z.y - 10, money(paid), PAL.good, true);
    if (perfect) Fx.pop(z.x, z.y - 26, 'ON THE DOORSTEP! +' + money(this.diff.perfectBonus), PAL.amber);
    this.say(perfect ? 'PERFECT TOSS!' : 'DELIVERED!', perfect ? PAL.amber : PAL.good);
    const late = o.tip < (o.floor + (o.max - o.floor) * 0.25);
    this.react(late && DIALOGUE.late ? 'late' : 'delivered', o, late);
    Audio5.sfx(perfect ? 'perfect' : 'deliver');
    Audio5.sfx('cash');
    this.flash = 0.14;

    this.order = null;
    if (this.bag > 0) this.newOrder();
    else { this.needPickup = true; this.syncNav(); }
    this.onComplete();
  },

  miss(z, wrong) {
    Fx.splat(z.x, z.y);
    Fx.spill(z.x, z.y);
    Audio5.sfx('splat');
    this.react('missed', this.order, true);
    this.stats.splat++;
    const fee = this.diff.fines.remake;
    this.fine(fee);
    this.combo = 1;
    if (wrong && this.order && wrong !== this.order.house) {
      Fx.pop(z.x, z.y - 10, 'WRONG HOUSE! ' + wrong.num, PAL.bad);
      this.say('THAT IS NOT ' + (this.order ? this.order.house.num : ''), PAL.bad);
    } else {
      Fx.pop(z.x, z.y - 10, 'SPLAT! -' + money(fee), PAL.bad);
      this.say('SPLAT!', PAL.bad);
    }
    if (this.bag === 0 && this.order) { this.needPickup = true; this.syncNav(); }
  },

  onCrash() { this.bumpHeat(7); },

  /* THE most important function in the railway. A wreck that leaves the car
     on the rails is a repeat-hit loop, which is the same class of defect as
     the collision wedge: not merely awkward but unescapable by any input.
     Throwing the car clear is the safety property, not a polish step.

     RAIL_EJECT is derived, not chosen: the ballast band runs y 480-543 either
     side of railY = 512, and a car body reaches 9px along its long axis, so 52
     clears the ballast by 11px north and 12px south. */
  wreck() {
    const p = this.player;
    this.wreckCd = 1.5;

    let cx = p.x, nd = 1e9;
    for (const c of this.crossings) { const d = Math.abs(c.x - p.x); if (d < nd) { nd = d; cx = c.x; } }
    const first = p.y < City.railY ? -1 : 1;
    let placed = false;
    for (const s of [first, -first]) {
      const ny = City.railY + s * RAIL_EJECT;
      if (!carBlocked(cx, ny, p.ang)) { p.x = cx; p.y = ny; placed = true; break; }
    }
    if (!placed) {
      p.x = City.nodeX(City.nearNodeX(cx));
      p.y = City.nodeY(City.nearNodeY(City.railY + first * 200));
    }
    p.vx = p.vy = 0;
    p.spinOut(Math.random() < 0.5 ? -1 : 1);
    p.spinT = 1.3;                       // longer than a crunch: this is a wreck
    this.railSide = p.y < City.railY ? -1 : 1;   // do not read the eject as beating the train

    for (let i = 0; i < this.bag; i++) Fx.splat(cx + rand(-30, 30), City.railY + rand(-14, 14));
    Fx.spill(cx, City.railY);
    for (let k = 0; k < 22; k++) Fx.spark(p.x, p.y, rand(-140, 140), rand(-140, 140));
    this.bag = 0;
    this.needPickup = true;
    this.syncNav();

    this.shake = 12; this.hitstop = 0.14; this.flash = 0.18;
    this.combo = 1;
    this.say('HIT BY TRAIN', PAL.bad);   // 12 chars -- well inside the banner box
    Audio5.sfx('crash'); Audio5.sfx('trainhorn');
    /* difficulty.md adds a fine the railway spec did not have. The demo is
       spared it: it never scores. */
    if (this.state === 'play') {
      this.fine(this.diff.fines.train);
      Fx.pop(p.x, p.y - 30, '-' + money(this.diff.fines.train), PAL.bad);
    }
  },

  onRail(x, y) { return Math.abs(y - City.railY) < 44; },

  /* Running a closed crossing is always allowed -- the gates are drawn, not
     solid. Surviving one is what costs you, because the cops saw you do it. */
  railCheck() {
    const p = this.player;
    const side = p.y < City.railY ? -1 : 1;
    if (this.railSide === 0) { this.railSide = side; return; }
    if (side === this.railSide) return;
    this.railSide = side;
    let near = null, nd = 1e9;
    for (const c of this.crossings) { const d = Math.abs(c.x - p.x); if (d < nd) { nd = d; near = c; } }
    if (near && nd < 40 && near.down) {
      this.bumpHeat(20);
      Fx.pop(p.x, p.y - 22, 'BEAT THE TRAIN!', PAL.amber);
    }
  },

  bumpHeat(n) {
    this.heat = clamp(this.heat + n, 0, HEAT_MAX);
    this.infraction = 1.2;
    if (this.heat >= HEAT_MAX && !this.cop) this.spawnCop();
  },

  spawnCop() {
    const p = this.player;
    const a = Math.random() * TAU;
    let x = p.x + Math.cos(a) * 210, y = p.y + Math.sin(a) * 210;
    x = clamp(x, 40, WW - 40); y = clamp(y, 40, WH - 40);
    for (let i = 0; i < 30 && (City.isSolid(x, y) || this.onRail(x, y)); i++) { x = clamp(p.x + rand(-260, 260), 40, WW - 40); y = clamp(p.y + rand(-260, 260), 40, WH - 40); }
    this.cop = new Cop(x, y, Math.atan2(p.y - y, p.x - x));
    this.copT = 26;
    this.say("HAYS PD! LOSE 'EM!", PAL.bad);
    Audio5.sirenOn();
  },
  dropCop() { this.cop = null; this.heat = Math.min(this.heat, 45); Audio5.sirenOff(); },

  resetRail() {
    this.train = null;
    this.trainT = rand(10, 22);
    this.railSide = 0;
    this.wreckCd = 0;
    this.crossings = City.crossings.map((c) => new Crossing(c));
  },

  /* which control scheme the Pad layer should map to */
  padContext() {
    if (this.state === 'kitchen' || this.state === 'kdemo') return 'kitchen';
    if (this.state === 'play' && !this.paused) return 'drive';
    return 'menu';
  },

  /* ---------------- update ------------------------------- */
  update(dt) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.bannerT -= dt;
    if (this.weather === 'snowy' && this.snow.length) this.updateSnow(dt);
    if (this.weather === 'rainy' && this.rainMask) this.updateRain(dt);

    const S = this.state;

    if (S === 'title') {
      this.titleCam += dt * 26;
      /* shake has to be decayed HERE as well as in the play branch -- this
         branch returns early, so a rumble started on the title would never stop */
      this.titleT += dt;
      if (!this.titleSlam && this.titleT >= TITLE_HOLD + TITLE_GROW) {
        this.titleSlam = true;
        this.shake = 9;                 // the same rumble a collision gives
        Audio5.sfx('bump');
      }
      this.shake = Math.max(0, this.shake - dt * 22);
      const r = 300;
      this.cam.x = clamp(City.shop.x - VW / 2 + Math.cos(this.titleCam / 62) * r, 0, WW - VW);
      this.cam.y = clamp(City.shop.y - VH / 2 + Math.sin(this.titleCam / 41) * r * 0.7, 0, WH - VH);
      this.player.x = this.cam.x + VW / 2; this.player.y = this.cam.y + VH / 2;
      this.simCrowd(dt);
      if (Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit) { Audio5.sfx('select'); this.toMode(); return; }
      this.attractT -= dt;
      if (this.attractT <= 0) this.toWinners();
      return;
    }

    if (S === 'winners') {
      this.attractT -= dt;
      if (Input.anyKey || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
      if (this.attractT <= 0) this.toScores(false);
      return;
    }

    if (S === 'scores') {
      if (this.scoresFromShift) {
        if (Input.p('Enter', 'NumpadEnter', 'Escape', 'Space') || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
      } else {
        this.attractT -= dt;
        if (Input.anyKey || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
        if (this.attractT <= 0) { this.toDemo(); return; }
      }
      this.simCrowd(dt);
      return;
    }

    if (S === 'mode') {
      /* A gamepad is invisible to the browser until a button on it is pressed,
         so keep re-detecting until the player makes a choice of their own. */
      if (!this.modeTouched && typeof Pad !== 'undefined') {
        const i = MODES.findIndex((m) => m.k === Pad.detect());
        if (i >= 0) this.modeIdx = i;
      }
      if (Input.p('ArrowUp', 'KeyW')) { this.modeIdx = (this.modeIdx + MODES.length - 1) % MODES.length; this.modeTouched = true; Audio5.sfx('tick'); }
      if (Input.p('ArrowDown', 'KeyS')) { this.modeIdx = (this.modeIdx + 1) % MODES.length; this.modeTouched = true; Audio5.sfx('tick'); }
      if (Input.mhit) {
        const i = Math.floor((Input.my - 70) / 34);
        if (i >= 0 && i < MODES.length && Math.abs(Input.mx - VW / 2) < 130) {
          if (i === this.modeIdx) { this.chooseMode(); return; }
          this.modeIdx = i; Audio5.sfx('tick');
        }
      }
      if (Input.p('Enter', 'NumpadEnter', 'Space')) { this.chooseMode(); return; }
      if (Input.p('Escape')) { this.toTitle(); return; }
      this.simCrowd(dt);
      return;
    }

    if (S === 'entry') {
      const n = INI_ALPHA.length;
      let acted = false;
      if (Input.p('ArrowUp', 'KeyW'))    { this.entryIni[this.entrySlot] = (this.entryIni[this.entrySlot] + 1) % n; acted = true; }
      if (Input.p('ArrowDown', 'KeyS'))  { this.entryIni[this.entrySlot] = (this.entryIni[this.entrySlot] + n - 1) % n; acted = true; }
      if (Input.p('ArrowLeft', 'KeyA'))  { if (this.entrySlot > 0) this.entrySlot--; acted = true; }
      if (Input.p('ArrowRight', 'KeyD')) { if (this.entrySlot < INI_LEN - 1) this.entrySlot++; acted = true; }
      if (Input.p('Enter', 'NumpadEnter', 'Space')) {
        if (this.entrySlot < INI_LEN - 1) { this.entrySlot++; acted = true; }
        else { this.commitEntry(); return; }
      }
      // the timeout fires on abandonment, not on someone taking their time
      if (acted) { this.entryT = ENTRY_TIMEOUT; Audio5.sfx('tick'); }
      this.entryT -= dt;
      if (this.entryT <= 0) { this.commitEntry(); return; }
      if (this.stage === 'delivery') this.simCrowd(dt);
      return;
    }

    if (S === 'card') {
      this.cardT += dt;
      if (this.stage === 'delivery') this.simCrowd(dt);
      const go = Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit;
      if ((go && this.cardT > 0.5) || this.cardT > 12) { Audio5.sfx('select'); this.beginShift(); }
      return;
    }

    if (S === 'clear') {
      this.cardT += dt;
      if (this.stage === 'delivery') this.simCrowd(dt);
      if (this.stage === 'kitchen') Kitchen.walk(dt);
      const go = Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit;
      if ((go && this.cardT > 1.0) || this.cardT > 10) { Audio5.sfx('select'); this.nextLevel(); }
      return;
    }

    if (S === 'over') {
      this.cardT += dt;
      if (this.stage === 'delivery') this.simCrowd(dt);
      const go = Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit;
      if ((go && this.cardT > 1.2) || this.cardT > 6) { Audio5.sfx('select'); this.afterOver(); }
      return;
    }

    if (S === 'cont') {
      const was = Math.ceil(this.contT);
      this.contT -= dt;
      if (Math.ceil(this.contT) !== was) Audio5.sfx('tick');
      if (Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit) { Audio5.sfx('start'); this.startRun(this.levelN); return; }
      if (Input.p('Escape') || this.contT <= 0) { this.toTitle(); return; }
      if (this.stage === 'delivery') this.simCrowd(dt);
      return;
    }

    if (S === 'victory') {
      this.cardT += dt;
      const go = Input.p('Enter', 'NumpadEnter', 'Space') || Input.mhit;
      if (go && this.cardT > 2) {
        Audio5.sfx('select');
        if (this.placed) { this.afterEntry = 'scores'; this.toEntry(); }
        else this.toScores(true);
      }
      return;
    }

    if (S === 'kitchen' || S === 'kdemo') {
      const demo = S === 'kdemo';
      if (demo) {
        this.attractT -= dt;
        if (Input.anyKey || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
        if (this.attractT <= 0) { this.toTitle(); return; }
      } else {
        if (this.pauseInput()) return;
        const was = Math.ceil(this.shift);
        this.shift -= dt;
        if (this.shift > 0 && this.shift < 6 && Math.ceil(this.shift) !== was) Audio5.sfx('tick');
        if (this.shift <= 0) { this.timeUp(); return; }
      }
      this.comboPop = Math.max(0, this.comboPop - dt);
      Kitchen.update(dt, this);
      Dialog.update(dt);
      return;
    }

    /* ---- play, and the demo which runs the same simulation ---- */
    const demo = S === 'demo';
    if (demo) {
      this.attractT -= dt;
      if (Input.anyKey || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
      if (this.attractT <= 0) { this.toTitle(); return; }
    } else if (this.pauseInput()) return;

    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }

    const wasSec = Math.ceil(this.shift);
    this.shift -= dt;
    if (!demo && this.shift > 0 && this.shift < 6 && Math.ceil(this.shift) !== wasSec) Audio5.sfx('tick');
    // a demo that outlasts the clock returns to the title, it does not post a score
    if (this.shift <= 0) { if (demo) this.toTitle(); else this.timeUp(); return; }

    this.comboPop = Math.max(0, this.comboPop - dt);
    this.tipPop = Math.max(0, this.tipPop - dt);
    this.throwCd -= dt;
    this.infraction = Math.max(0, this.infraction - dt);

    /* tip decay, down to the floor (owner ruling: the $2 floor stays) */
    if (this.order) {
      const before = this.order.tip;
      this.order.tip = Math.max(this.order.floor, this.order.tip - this.order.decay * dt);
      if (((before / 25) | 0) !== ((this.order.tip / 25) | 0)) this.tipPop = 0.07;
    }

    /* player */
    const p = this.player;
    if (demo) Demo.drive(dt, this); else p.control(Input);
    p.update(dt, this);

    if (!demo) {
      const padThrow = typeof Pad !== 'undefined' && Pad.throwNow;
      const click = Input.mhit && (typeof Pad === 'undefined' || Pad.mode === 'A');
      if (click || Input.p('Space') || padThrow) this.tryThrow();
      if (padThrow) Pad.throwNow = false;      // after the throw: aimPoint reads it
    }

    /* engine audio */
    const sf = clamp(p.speed / MAXSPD, 0, 1);
    Audio5.engineSet(sf, p.throttle > 0 ? 1 : 0);

    /* heat from bad driving */
    const surf = City.surfaceAt(p.x, p.y);
    if ((surf === S_GRASS || surf === S_WALK) && p.speed > 40) this.bumpHeat(9 * dt);
    else if (this.infraction <= 0) this.heat = Math.max(0, this.heat - 7 * dt);

    /* traffic */
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const c = this.traffic[i];
      c.update(dt, this);
      if (hyp(c.x - p.x, c.y - p.y) > 1000 || c.x < SEG0 - 60 || c.y < SEG0 - 60 ||
          c.x > SEG0 + BLOCKS * PITCH + 90 || c.y > SEG0 + BLOCKS * PITCH + 90) {
        this.traffic.splice(i, 1); continue;
      }
      const d = hyp(c.x - p.x, c.y - p.y);
      if (d < 15 && c.stun <= 0) {
        const rel = hyp(p.vx - DIRV[c.dir][0] * c.spd, p.vy - DIRV[c.dir][1] * c.spd);
        if (rel > 55) {
          c.stun = 1.1; c.spd *= 0.3;
          p.spinOut(Math.random() < 0.5 ? -1 : 1);
          this.shake = 8; this.hitstop = 0.08;
          Audio5.sfx('crash');
          for (let k = 0; k < 16; k++) Fx.spark(p.x, p.y, rand(-90, 90), rand(-90, 90));
          Fx.pop(p.x, p.y - 20, 'CRUNCH!', PAL.bad);
          this.bumpHeat(15);
          this.combo = 1;
        }
        // Separate the two cars, but never shove the player into geometry:
        // an unchecked push is how you end up overlapping a building, and an
        // overlapping car cannot drive or steer its way out.
        const nx2 = (p.x - c.x) / (d || 1), ny2 = (p.y - c.y) / (d || 1);
        if (!carBlocked(p.x + nx2 * 2, p.y, p.ang)) p.x += nx2 * 2;
        if (!carBlocked(p.x, p.y + ny2 * 2, p.ang)) p.y += ny2 * 2;
      }
    }
    while (this.traffic.length < 30) { const n = this.traffic.length; this.spawnCar(false); if (this.traffic.length === n) break; }

    /* peds */
    for (let i = this.peds.length - 1; i >= 0; i--) {
      const q = this.peds[i];
      q.update(dt, this);
      if (hyp(q.x - p.x, q.y - p.y) > 780) { this.peds.splice(i, 1); continue; }
      if (q.tumble <= 0 && hyp(q.x - p.x, q.y - p.y) < 11 && p.speed > 42) {
        q.hitBy(p.x, p.y, p.vx, p.vy);
        const f = this.diff.fines.ped;
        if (!demo) this.fine(f);
        this.stats.peds++;
        this.combo = 1;
        this.bumpHeat(34);
        Fx.star(q.x, q.y - 8);
        Fx.pop(q.x, q.y - 18, 'OW! -' + money(f), PAL.bad);
        this.shake = 5; this.hitstop = 0.05;
        Audio5.sfx('ped');
      }
    }
    while (this.peds.length < 24) this.spawnPed();

    /* the Union Pacific */
    this.wreckCd -= dt;
    this.trainT -= dt;
    if (!this.train && this.trainT <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      // eastbound keeps to the south track -- City.tracks is [north, south]
      this.train = new Train(dir, City.tracks[dir > 0 ? 1 : 0]);
      this.trainT = rand(22, 40);
    }
    if (this.train) {
      this.train.update(dt, this);
      if (this.train.hits(p) && this.wreckCd <= 0) this.wreck();
      /* Beat the train across and the pursuit eats it. heat = 0 has to come
         BEFORE dropCop, which only clamps it to 45. */
      if (this.cop && this.train.hits(this.cop)) {
        for (let k = 0; k < 20; k++) Fx.spark(this.cop.x, this.cop.y, rand(-150, 150), rand(-150, 150));
        Fx.pop(this.cop.x, this.cop.y - 22, 'CRUNCH!', PAL.good);
        this.shake = Math.max(this.shake, 7);
        Audio5.sfx('crash');
        this.say('THE TRAIN GOT THEM', PAL.good);
        this.heat = 0;
        this.dropCop();
      }
      if (this.train.dead) this.train = null;
    }
    for (const c of this.crossings) c.update(dt, this);
    this.railCheck();

    /* cop */
    if (this.cop) {
      this.cop.update(dt, this);
      this.copT -= dt;
      const d = hyp(this.cop.x - p.x, this.cop.y - p.y);
      Audio5.sirenSet(clamp(1 - d / 420, 0, 1));
      if (d < 16 && this.cop.hitCd <= 0) {
        this.cop.hitCd = 3;
        const f = this.diff.fines.ticket;
        if (!demo) this.fine(f);
        this.stats.tickets++;
        this.combo = 1;
        p.spinOut(1);
        this.shake = 9; this.hitstop = 0.1;
        Fx.pop(p.x, p.y - 22, 'TICKET! -' + money(f), PAL.bad, true);
        this.say('PULLED OVER', PAL.bad);
        Audio5.sfx('ticket');
        this.heat = 0;
        this.dropCop();
      } else if (this.copT <= 0 || (d > 620 && this.heat < 55)) {
        this.say('LOST THEM', PAL.good);
        this.dropCop();
      }
    }

    /* bags in flight */
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const z = this.flying[i];
      z.update(dt);
      if (z.dead) { this.flying.splice(i, 1); this.onLand(z); if (this.state !== 'play' && this.state !== 'demo') return; }
    }

    /* restock at the shop */
    const dock = City.shop.dock;
    if (this.needPickup && hyp(p.x - dock.x, p.y - dock.y) < 54 && p.speed < 62) {
      this.restock += dt;
      if (this.restock >= 1.0) {
        this.restock = 0;
        this.bag = this.bagMax;
        this.needPickup = false;
        Audio5.sfx('restock');
        Fx.pop(p.x, p.y - 22, 'TACOS LOADED', PAL.amber);
        if (!this.order) this.newOrder(); else this.syncNav();
      }
    } else this.restock = Math.max(0, this.restock - dt * 2);

    Nav.update(dt, p);
    Fx.update(dt);
    Dialog.update(dt);

    /* camera */
    const lead = 46;
    const tx = p.x + clamp(p.vx / MAXSPD, -1, 1) * lead - VW / 2;
    const ty = p.y + clamp(p.vy / MAXSPD, -1, 1) * lead - VH / 2;
    const k = 1 - Math.exp(-7 * dt);
    this.cam.x = clamp(this.cam.x + (tx - this.cam.x) * k, 0, WW - VW);
    this.cam.y = clamp(this.cam.y + (ty - this.cam.y) * k, 0, WH - VH);
    this.shake = Math.max(0, this.shake - dt * 22);
  },

  /* P / Esc toggle pause in every mode. While paused, Enter (a stick's
     Button 1) and a tap also resume -- a stick or a phone has no Esc. Returns
     true while the game is paused. */
  pauseInput() {
    if (this.paused) {
      if (Input.p('Escape', 'KeyP', 'Enter', 'NumpadEnter') || Input.mhit) { this.paused = false; Input.mhit = false; Input.hit = Object.create(null); }
      return this.paused;
    }
    if (Input.p('Escape', 'KeyP')) { this.paused = true; return true; }
    return false;
  },

  chooseMode() {
    const m = MODES[this.modeIdx];
    if (typeof Pad !== 'undefined') Pad.setMode(m.k);
    Audio5.sfx('start');
    this.startRun(this.startLevel);
  },

  simCrowd(dt) {
    for (const c of this.traffic) c.update(dt, this);
    for (const q of this.peds) q.update(dt, this);
    Fx.update(dt);
  },

  /* Rank titles for a whole 20-level run (2026-10-25). The board stores
     {ini, cents} and nothing else, so retuning these reflows it. rank() must
     read nothing but this.earned: overlayScores calls it on a fake `this`. */
  rank() {
    const e = this.earned;
    return e < 25000 ? 'TRAINEE' : e < 100000 ? 'DRIVER' : e < 250000 ? 'ACE' : e < 500000 ? 'SALSA BARON' : 'LEGEND OF THE ASADA';
  },

  /* ---------------- winter ------------------------------- */
  /* Snow on the ground is one more baked layer, the size of the ground canvas,
     drawn straight after it. Snow on the roofs is a whitened copy of each
     building sprite's roof rows, cached per sprite. */
  buildSnow() {
    const t = mkCanvas(WW, WH), x = t.x, rng = makeRng(0x5170);
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      const c = classify(tx, ty), px = tx * TS, py = ty * TS;
      if (c === T_ROAD || c === T_INTER) {
        /* ploughed: slush along the kerbs, tyre tracks clear */
        for (let i = 0; i < 3; i++) { x.fillStyle = 'rgba(232,236,246,0.30)'; x.fillRect(px + rng.int(TS), py + rng.int(TS), 2, 1); }
        continue;
      }
      const dense = c === T_WALK ? 0.38 : 0.62;
      x.fillStyle = 'rgba(236,240,250,' + dense + ')';
      x.fillRect(px, py, TS, TS);
      for (let i = 0; i < 6; i++) {
        x.fillStyle = rng.chance(0.5) ? 'rgba(255,255,255,0.55)' : 'rgba(170,184,210,0.35)';
        x.fillRect(px + rng.int(TS - 3), py + rng.int(TS - 1), 2 + rng.int(3), 1);
      }
    }
    this.snowMask = t.c;
    this.snowImgs = new Map();
    this.snow = [];
    for (let i = 0; i < 110; i++) this.snow.push({ x: Math.random() * VW, y: Math.random() * VH, v: 14 + Math.random() * 26, w: Math.random() * TAU, s: Math.random() < 0.2 ? 2 : 1 });
  },

  snowImg(it) {
    let m = this.snowImgs.get(it.img);
    if (m) return m;
    const w = it.img.width, h = it.img.height, roof = Math.min(h, it.h || h);
    const t = mkCanvas(w, h);
    t.x.drawImage(it.img, 0, 0);
    t.x.globalCompositeOperation = 'source-atop';
    t.x.fillStyle = 'rgba(240,244,252,0.62)';
    t.x.fillRect(0, 0, w, roof);
    t.x.globalCompositeOperation = 'source-over';
    this.snowImgs.set(it.img, t.c);
    return t.c;
  },

  /* ---------------- rain -------------------------------- */
  /* The same shape as winter: one baked layer over the ground canvas -- wet
     tarmac reads darker and catches pale streaks of sky, with the odd puddle
     -- plus rain and splashes drawn over the world each frame. Baked once per
     map, like the snow, because it is the whole 1632px ground. */
  buildRain() {
    const t = mkCanvas(WW, WH), x = t.x, rng = makeRng(0x7a1d);
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      const c = classify(tx, ty), px = tx * TS, py = ty * TS;
      if (c === T_ROAD || c === T_INTER) {
        x.fillStyle = 'rgba(12,18,42,0.30)'; x.fillRect(px, py, TS, TS);
        for (let i = 0; i < 2; i++) {
          x.fillStyle = 'rgba(170,192,228,0.22)';
          x.fillRect(px + rng.int(TS), py + rng.int(TS - 5), 1, 2 + rng.int(4));
        }
        if (rng.chance(0.07)) {                     // a puddle: dark, with a lit far rim
          const w = 6 + rng.int(7), h = 2 + rng.int(2);
          const ox = px + rng.int(TS - w + 1), oy = py + 2 + rng.int(TS - h - 3);
          x.fillStyle = 'rgba(14,22,50,0.42)'; x.fillRect(ox + 1, oy, w - 2, h); x.fillRect(ox, oy + 1, w, h - 1);
          x.fillStyle = 'rgba(190,206,236,0.35)'; x.fillRect(ox + 2, oy, w - 4, 1);
        }
      } else if (c === T_WALK) {
        x.fillStyle = 'rgba(12,18,42,0.16)'; x.fillRect(px, py, TS, TS);
      } else {
        x.fillStyle = 'rgba(8,26,22,0.12)'; x.fillRect(px, py, TS, TS);
      }
    }
    this.rainMask = t.c;
    this.rain = [];
    for (let i = 0; i < 170; i++)
      this.rain.push({ x: Math.random() * VW, y: Math.random() * VH, v: 260 + Math.random() * 110, l: 6 + ((Math.random() * 5) | 0) });
    this.splash = [];
  },

  updateRain(dt) {
    for (const f of this.rain) {
      f.y += f.v * dt; f.x -= f.v * 0.22 * dt;
      if (f.y > VH) {
        if (this.splash.length < 40 && Math.random() < 0.5) this.splash.push({ x: f.x, y: 20 + Math.random() * (VH - 24), t: 0.16 });
        f.y = -f.l - Math.random() * 20; f.x = Math.random() * (VW + 60);
      }
      if (f.x < -4) f.x += VW + 8;
    }
    for (let i = this.splash.length - 1; i >= 0; i--) if ((this.splash[i].t -= dt) <= 0) this.splash.splice(i, 1);
  },

  /* an overcast cast over the whole street, then the rain on top of it */
  drawRain(x) {
    x.fillStyle = 'rgba(16,24,52,0.12)'; x.fillRect(0, 0, VW, VH);
    x.fillStyle = 'rgba(178,198,232,0.55)';
    for (const f of this.rain) {
      const h = f.l >> 1;
      x.fillRect(f.x | 0, f.y | 0, 1, h);
      x.fillRect((f.x - 1) | 0, (f.y + h) | 0, 1, f.l - h);
    }
    x.fillStyle = 'rgba(206,220,244,0.6)';
    for (const s of this.splash) {
      const o = s.t > 0.08 ? 1 : 2;
      x.fillRect((s.x - o) | 0, s.y | 0, 1, 1); x.fillRect((s.x + o) | 0, s.y | 0, 1, 1);
    }
  },

  updateSnow(dt) {
    for (const f of this.snow) {
      f.w += dt * 1.7;
      f.y += f.v * dt;
      f.x += Math.sin(f.w) * 8 * dt - 4 * dt;
      if (f.y > VH) { f.y = -2; f.x = Math.random() * VW; }
      if (f.x < 0) f.x += VW;
    }
  },

  drawSnowfall(x) {
    for (const f of this.snow) {
      x.fillStyle = f.s > 1 ? '#ffffff' : 'rgba(240,244,252,0.8)';
      x.fillRect(f.x | 0, f.y | 0, f.s, f.s);
    }
  },

  /* ---------------- render ------------------------------- */
  render(x) {
    // the winners card is a solid field -- no world behind it, as on a cabinet
    if (this.state === 'winners') { this.overlayWinners(x); Post.apply(x); return; }

    const S = this.state;
    const kitchenView = S === 'kitchen' || S === 'kdemo' ||
      (this.stage === 'kitchen' && (S === 'card' || S === 'clear' || S === 'over' || S === 'cont' ||
        (S === 'entry' && this.afterEntry === 'cont')));
    if (kitchenView) this.renderKitchen(x);
    else this.renderCity(x);
    /* The era grade colours the WORLD -- the city, the kitchen, the HUD that
       lives in them. The cards and menus drawn over it are the game talking
       to the player, and keep the game's own colours in every era. */
    Post.grade(x, this.era);

    if ((S === 'play' || S === 'kitchen') && this.paused) this.overlayPause(x);
    if (S === 'title')   this.overlayTitle(x);
    if (S === 'mode')    this.overlayMode(x);
    if (S === 'scores')  this.overlayScores(x);
    if (S === 'entry')   this.overlayEntry(x);
    if (S === 'card')    this.overlayCard(x);
    if (S === 'clear')   this.overlayClear(x);
    if (S === 'over')    this.overlayOver(x);
    if (S === 'cont')    this.overlayCont(x);
    if (S === 'victory') this.overlayVictory(x);

    if (this.flash > 0) {
      x.globalAlpha = this.flash * 2.4;
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, VW, VH);
      x.globalAlpha = 1;
    }
    Post.apply(x);
  },

  renderKitchen(x) {
    Kitchen.draw(x, this);
    const live = this.state === 'kitchen' || this.state === 'kdemo';
    if (live) {
      this.drawLevelLine(x);
      this.drawBanner(x);
      if (this.state === 'kdemo') this.overlayDemo(x);
      Dialog.draw(x);
    }
  },

  renderCity(x) {
    /* `shake` displaces the CAMERA, which moves the world under a HUD that
       stays put. That is right in play. It is wrong on the title, where the
       badge and wordmark are drawn at fixed screen coordinates -- so the
       offset is published for overlays that want to move with it. Negated,
       because raising the source-rect origin slides the world LEFT. */
    const sh = this.shake;
    const jx = sh > 0 ? rand(-sh, sh) : 0, jy = sh > 0 ? rand(-sh, sh) : 0;
    const cx = Math.round(this.cam.x + jx);
    const cy = Math.round(this.cam.y + jy);
    this.shakeX = -Math.round(jx); this.shakeY = -Math.round(jy);
    const cam = { x: cx, y: cy };

    x.fillStyle = PAL.void; x.fillRect(0, 0, VW, VH);
    x.drawImage(City.ground, cx, cy, VW, VH, 0, 0, VW, VH);
    const snowy = this.winter && this.snowMask;
    if (snowy) x.drawImage(this.snowMask, cx, cy, VW, VH, 0, 0, VW, VH);
    const rainy = this.weather === 'rainy' && this.rainMask;
    if (rainy) x.drawImage(this.rainMask, cx, cy, VW, VH, 0, 0, VW, VH);

    const live = this.state === 'play' || this.state === 'demo';
    const nav = this.state === 'demo' ? NAV_FULL : this.nav;
    if ((live || this.state === 'clear') && nav.panel) Nav.drawRoute(x, cam, this.time);
    if (live && nav.beacon) this.drawBeacon(x, cam);

    /* ---- y-sorted sprite pass ---- */
    const rl = this.rl; rl.length = 0;
    City.collect(cx - 140, cy - 150, cx + VW + 140, cy + VH + 150, rl);
    if (this.state !== 'title' && this.state !== 'mode') rl.push({ sortY: this.player.y, e: this.player });
    for (const c of this.traffic) if (this.nearScreen(c.x, c.y)) rl.push({ sortY: c.y, e: c });
    for (const q of this.peds)    if (this.nearScreen(q.x, q.y)) rl.push({ sortY: q.y, e: q });
    if (this.cop) rl.push({ sortY: this.cop.y, e: this.cop });
    if (this.train) rl.push({ sortY: this.train.y, e: this.train });
    for (const c of this.crossings)
      if (this.nearScreen(c.x, c.y)) rl.push({ sortY: c.y + 44, e: c });
    for (const z of this.flying) rl.push({ sortY: z.y, e: z });
    rl.sort((a, b) => a.sortY - b.sortY);
    for (const it of rl) {
      if (it.e) it.e.draw(x, cam);
      else x.drawImage(snowy && it.oy > 0 ? this.snowImg(it) : it.img, it.x - cx, it.y - it.oy - cy);
    }

    Fx.draw(x, cam);
    if (this.weather === 'snowy') this.drawSnowfall(x);
    if (rainy) this.drawRain(x);

    if (live) {
      this.drawAim(x, cam);
      Hud.draw(x, this);
      this.drawLevelLine(x);
      if (this.restock > 0) this.drawRestock(x, cam);
      if (typeof Pad !== 'undefined' && this.state === 'play') Pad.draw(x, 'drive');
      if (this.state === 'demo') this.overlayDemo(x);
      /* over the HUD -- it is meant to cover the minimap -- but under Post */
      Dialog.draw(x);
    }
  },

  /* Progress toward the level target, the run's stars, and the streak, under
     the clock card in both shifts. */
  drawLevelLine(x) {
    if (this.state === 'demo' || this.state === 'kdemo' || this.stage === 'kitchen') return;
    const lab = 'ORDERS ' + this.done + '/' + this.diff.target;
    const w = textW(lab, 1);
    textOut(x, lab, VW - 6, 51, PAL.bone, 1, 2);
    const n = String(this.levelStars), sx = VW - 6 - w - 10 - textW(n, 1) - 9;
    Kitchen.star(x, sx, 51, PAL.amber, PAL.ink);
    textOut(x, n, sx + 9, 51, PAL.amber, 1);
    if (this.combo > 1.001)
      textOut(x, 'X' + this.combo.toFixed(2) + ' STREAK', VW - 6, 61, this.comboPop > 0 ? PAL.bone : PAL.amber, 1, 2);
  },

  drawBanner(x) {
    if (!this.banner || this.bannerT <= 0) return;
    const a = clamp(this.bannerT / 0.4, 0, 1);
    x.globalAlpha = a;
    const w = textW(this.banner, 2) + 16;
    R(x, PAL.ink, (VW - w) / 2 | 0, 60, w, 20);
    x.strokeStyle = this.bannerCol; x.lineWidth = 1;
    x.strokeRect(((VW - w) / 2 | 0) + 0.5, 60.5, w - 1, 19);
    text(x, this.banner, VW / 2, 63, this.bannerCol, 2, 1);
    x.globalAlpha = 1;
  },

  drawBeacon(x, cam) {
    if (!this.order || this.needPickup) {
      if (this.needPickup) {
        const d = City.shop.dock;
        const sx = d.x - cam.x, sy = d.y - cam.y;
        if (sx > -40 && sx < VW + 40 && sy > -40 && sy < VH + 40) {
          const b = Math.sin(this.time * 5) * 3;
          x.globalAlpha = 0.5 + 0.35 * Math.sin(this.time * 6);
          triArrow(x, sx, sy - 34 + b, PI / 2, 8, PAL.amber, PAL.ink);
          x.globalAlpha = 1;
          textOut(x, 'PICK UP', sx, sy - 52, PAL.amber, 1, 1);
        }
      }
      return;
    }
    const h = this.order.house, r = h.porch;
    const sx = r.x - cam.x, sy = r.y - cam.y;
    if (sx < -80 || sy < -80 || sx > VW + 80 || sy > VH + 80) return;
    const pu = 0.45 + 0.4 * Math.sin(this.time * 6);
    x.globalAlpha = pu;
    x.strokeStyle = PAL.amber; x.lineWidth = 1;
    x.strokeRect((sx | 0) + 0.5, (sy | 0) + 0.5, r.w - 1, r.h - 1);
    x.strokeRect((sx | 0) - 1.5, (sy | 0) - 1.5, r.w + 2, r.h + 2);
    x.globalAlpha = 0.16 * pu + 0.06;
    x.fillStyle = PAL.amber; x.fillRect(sx | 0, sy | 0, r.w, r.h);
    x.globalAlpha = 1;

    const bob = Math.sin(this.time * 5) * 3;
    const ax = h.cx - cam.x, ay = h.y - cam.y - 22 + bob;
    triArrow(x, ax, ay, PI / 2, 8, PAL.amber, PAL.ink);
    textOut(x, '' + h.num, ax, ay - 16, PAL.amber, 1, 1);
  },

  drawAim(x, cam) {
    const p = this.player;
    if (this.bag <= 0) return;
    const a = this.aimPoint();
    const sx0 = p.x - cam.x, sy0 = p.y - cam.y;
    const sx1 = a.x - cam.x, sy1 = a.y - cam.y;

    let lock = false;
    if (this.order && !this.needPickup) {
      const r = this.order.house.porch;
      lock = a.x > r.x && a.x < r.x + r.w && a.y > r.y && a.y < r.y + r.h;
    }
    const col = lock ? PAL.good : PAL.bone;
    const aiming = typeof Pad !== 'undefined' && Pad.aiming;

    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const px = lerp(sx0, sx1, t), py = lerp(sy0, sy1, t);
      const z = Z0 + (0 - Z0 + 0.5 * GRAV * THROW_T * THROW_T) / THROW_T * (t * THROW_T) - 0.5 * GRAV * (t * THROW_T) ** 2;
      x.globalAlpha = (0.18 + t * 0.32) * (aiming ? 1.6 : 1);
      x.fillStyle = col;
      x.fillRect(px | 0, (py - z) | 0, 2, 2);
    }
    x.globalAlpha = 1;

    const rx = sx1 | 0, ry = sy1 | 0;
    x.fillStyle = col;
    for (const [dx, dy] of [[-5, 0], [4, 0], [0, -5], [0, 4]]) x.fillRect(rx + dx, ry + dy, dx ? 2 : 1, dy ? 2 : 1);
    if (lock) {
      const b = (this.time * 8 | 0) % 2;
      x.globalAlpha = b ? 1 : 0.45;
      x.strokeStyle = PAL.good; x.lineWidth = 1;
      x.strokeRect(rx - 6.5, ry - 6.5, 13, 13);
      x.globalAlpha = 1;
    }
    if (this.throwCd > 0) {
      x.globalAlpha = 0.4; x.fillStyle = PAL.ink;
      x.fillRect(rx - 4, ry - 4, 9, 9); x.globalAlpha = 1;
    }
  },

  /* Pinned to the dock, just above the painted bay -- not to the car. Hung
     26px over the car, it covered the bay's own PICKUP ONLY lettering, which
     the car is parked on, and the screen read "PICKUP ONLLOADING". */
  drawRestock(x, cam) {
    const d = City.shop.dock;
    const sx = (d.x - cam.x) | 0, sy = ((d.y - cam.y) | 0) - 26;
    R(x, PAL.ink, sx - 21, sy - 4, 42, 11);
    text(x, 'LOADING', sx, sy - 2, PAL.amber, 1, 1);
    R(x, '#2c2338', sx - 18, sy + 5, 36, 3);
    R(x, PAL.amber, sx - 18, sy + 5, Math.round(36 * clamp(this.restock, 0, 1)), 3);
  },

  /* ---------------- overlays ----------------------------- */
  card(x, w, h, py, accent) {
    const px = (VW - w) / 2 | 0;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = accent || PAL.amber; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    return px;
  },

  overlayTitle(x) {
    x.fillStyle = 'rgba(20,12,28,0.62)'; x.fillRect(0, 0, VW, VH);
    const t = this.time;
    const jx = this.shakeX, jy = this.shakeY;
    x.drawImage(Art.badge, (((VW - Art.badge.width) / 2) | 0) + jx, 14 + jy);

    const tagHeld = this.titleT - TAG_HOLD;
    if (tagHeld >= 0) {
      x.globalAlpha = clamp(tagHeld / TITLE_FADE, 0, 1);
      textOut(x, 'IN', VW / 2 + jx, TAG_Y + jy, PAL.bone, 1, 1);
      x.globalAlpha = 1;
    }

    /* The wordmark grows into place: quadratic and ACCELERATING, so it
       arrives fast enough to earn the rumble that fires as it lands. */
    const held = this.titleT - TITLE_HOLD;
    if (held >= 0) {
      const g = clamp(held / TITLE_GROW, 0, 1);
      const sc = TITLE_FROM + (1 - TITLE_FROM) * (g * g);
      const w = Art.wordmark.w, h = Art.wordmark.h;
      const cy = TITLE_Y + h / 2;
      x.globalAlpha = clamp(held / TITLE_FADE, 0, 1);
      if (g >= 1) {
        x.drawImage(Art.wordmark.c, (((VW - w) / 2) | 0) + jx, TITLE_Y + jy);
      } else {
        const dw = Math.round(w * sc), dh = Math.round(h * sc);
        x.drawImage(Art.wordmark.c, Math.round(VW / 2 - dw / 2) + jx, Math.round(cy - dh / 2) + jy, dw, dh);
      }
      x.globalAlpha = 1;
      if (g >= 1 && (t * 2 | 0) % 2) textOut(x, 'PRESS ENTER TO CLOCK IN', VW / 2, 184, PAL.amber, 1, 1);
    }
    this.versionTag(x, VW - 4, VH - 11);
  },

  /* the build's version, so a screenshot or a bug report says which build */
  versionTag(x, rx, y) {
    if (typeof RELEASE !== 'undefined') text(x, 'V' + RELEASE.version, rx, y, PAL.boneDim, 1, 2);
  },

  overlayMode(x) {
    x.fillStyle = 'rgba(20,12,28,0.80)'; x.fillRect(0, 0, VW, VH);
    text(x, 'CHOOSE YOUR CONTROLS', VW / 2, 30, PAL.amber, 2, 1);
    MODES.forEach((m, i) => {
      const y = 70 + i * 34, on = i === this.modeIdx;
      const px = this.card(x, 260, 28, y, on ? PAL.amber : '#4a4058');
      text(x, 'MODE ' + m.k, px + 10, y + 6, on ? PAL.amber : PAL.boneDim, 1);
      text(x, m.name, px + 58, y + 6, on ? PAL.bone : PAL.boneDim, 1);
      text(x, m.sub, px + 58, y + 16, PAL.boneDim, 1);
      if (on && (this.time * 3 | 0) % 2) text(x, '>', px - 10, y + 10, PAL.amber, 1);
    });
    text(x, 'UP/DOWN - CHOOSE   ENTER - CLOCK IN', VW / 2, 182, PAL.boneDim, 1, 1);
    if (this.startLevel > 1) text(x, 'STARTING AT LEVEL ' + this.startLevel, VW / 2, 196, PAL.cyan, 1, 1);
  },

  shiftName() { return this.stage === 'kitchen' ? 'KITCHEN SHIFT' : 'DELIVERY SHIFT'; },

  /* The level card. For a kitchen level it carries the MENU: the recipes are
     hidden during play (GDD IV rule 1), so this card and the pause overlay are
     the only places they are written down -- learning them is the mastery
     curve, and you get one look before the clock starts. [INVENTED] */
  overlayCard(x) {
    x.fillStyle = 'rgba(20,12,28,0.84)'; x.fillRect(0, 0, VW, VH);
    const L = this.level, D = this.diff;
    const px = this.card(x, 364, 204, 6);
    text(x, 'LEVEL ' + this.levelN, px + 12, 14, PAL.amber, 2);
    text(x, this.levelTitle(), px + 352, 14, PAL.bone, 2, 2);
    const kind = this.shiftName() + '  -  ' + this.diffKey.toUpperCase();
    text(x, kind, px + 12, 34, PAL.boneDim, 1);
    R(x, PAL.red, px + 12, 44, 340, 1);
    if (this.stage === 'kitchen') {
      text(x, 'SERVE ' + D.target + ' TICKETS BEFORE THE CLOCK RUNS OUT', px + 12, 50, PAL.bone, 1);
      text(x, 'THE MENU', px + 12, 62, PAL.amber, 1);
      this.drawRecipes(x, px + 12, 72, 352 - 12);
    } else {
      const rows = [
        ['TARGET', D.target + ' DELIVERIES'],
        ['CLOCK', clockStr(D.start) + '  +' + clockStr(D.extend) + ' EVERY 3, UP TO ' + D.maxExt],
        ['TIPS', money(D.tipStart) + ' FALLING TO ' + money(D.tipFloor)],
        ['FINES', 'TICKET ' + money(D.fines.ticket) + '  PED ' + money(D.fines.ped) + '  TRAIN ' + money(D.fines.train)],
        ['TACO-NAV', this.navName()],
        ['ROADS', WEATHER_ROADS[this.winter ? 'winter' : 'summer'][this.weather]],
      ];
      rows.forEach((r, i) => {
        text(x, r[0], px + 12, 56 + i * 14, PAL.boneDim, 1);
        text(x, r[1], px + 80, 56 + i * 14, PAL.bone, 1);
      });
    }
    if ((this.time * 2 | 0) % 2) text(x, 'PRESS ENTER TO CLOCK IN', VW / 2, 198, PAL.amber, 1, 1);
  },

  navName() {
    const n = this.nav;
    if (n.panel && n.line && n.edge) return 'FULL GUIDANCE';
    if (n.panel) return 'PANEL AND MAP DOT ONLY';
    if (n.dot) return 'MAP DOT ONLY - YOU KNOW THE WAY';
    return 'NONE. READ THE ADDRESS.';
  },

  /* Ticket name, then the build in order, each step in its ingredient's own
     colour. Long builds abbreviate rather than overflow -- the width is the
     card's, asserted in the test suite. */
  drawRecipes(x, px, py, w) {
    const items = (Kitchen.menu || Kitchen.fallbackMenu()).items;
    const rowH = items.length > 12 ? 8 : 9;
    items.forEach((it, i) => {
      const y = py + i * rowH;
      text(x, it.ticket || it.name, px, y, PAL.bone, 1);
      let cx = px + 78;
      const parts = it.recipe.map((k) => Kitchen.plateName(k));
      let full = parts.join(' ');
      const short = textW(full, 1) > w - 78;
      parts.forEach((p, j) => {
        const s = short ? p.slice(0, 4) : p;
        const c = (Kitchen.ING[it.recipe[j]] || [PAL.bone, PAL.bone])[1];
        text(x, s, cx, y, c, 1);
        cx += textW(s, 1) + 6;
      });
    });
  },

  overlayClear(x) {
    x.fillStyle = 'rgba(20,12,28,0.78)'; x.fillRect(0, 0, VW, VH);
    const px = this.card(x, 280, 168, 20, PAL.good);
    text(x, 'LEVEL ' + this.levelN + ' CLEAR!', VW / 2, 30, PAL.good, 3, 1);
    R(x, PAL.good, px + 16, 56, 248, 1);
    const k = this.stage === 'kitchen', s = this.stats || {};
    const made = k ? s.items : this.done;
    const rows = k ? [
      ['TICKETS SERVED', this.done + ''],
      ['WALKOUTS', (s.walkouts || 0) + ''],
      ['WRONG PICKS', (s.mistakes || 0) + ''],
      ['STARS', this.levelStars + ' OF ' + (made || 0) + ' ITEMS CLEAN'],
    ] : [
      ['DELIVERED', this.done + ''],
      ['ORDERS DROPPED', (s.splat || 0) + ''],
      ['PEDESTRIANS CLIPPED', (s.peds || 0) + ''],
      ['STARS', this.levelStars + ' OF ' + this.done + ' ON THE DOORSTEP'],
    ];
    rows.forEach((r, i) => {
      text(x, r[0], px + 16, 64 + i * 11, PAL.boneDim, 1);
      text(x, r[1], px + 264, 64 + i * 11, PAL.bone, 1, 2);
    });
    R(x, '#3a2c48', px + 16, 112, 248, 1);
    text(x, 'THIS SHIFT', px + 16, 120, PAL.boneDim, 1);
    text(x, money(this.levelEarned), px + 264, 118, PAL.good, 2, 2);
    text(x, 'RUN TOTAL', px + 16, 138, PAL.boneDim, 1);
    text(x, money(this.earned), px + 264, 136, PAL.amber, 2, 2);
    const L = this.levels();
    if (this.levelN < L.length) {
      const n = L[this.levelN];
      text(x, 'NEXT: LEVEL ' + n.n + ' ' + (n.name || '') + ' - ' + (n.type === 'kitchen' ? 'KITCHEN' : 'DELIVERY'), VW / 2, 166, PAL.bone, 1, 1);
    }
    if (this.cardT > 1 && (this.time * 2 | 0) % 2) text(x, 'PRESS ENTER', VW / 2, 198, PAL.amber, 1, 1);
  },

  overlayOver(x) {
    x.fillStyle = 'rgba(20,12,28,0.80)'; x.fillRect(0, 0, VW, VH);
    const px = this.card(x, 260, 150, 30, PAL.red);
    text(x, "TIME'S UP", VW / 2, 40, PAL.red, 3, 1);
    text(x, 'GAME OVER ON LEVEL ' + this.levelN, VW / 2, 66, PAL.bone, 1, 1);
    R(x, PAL.red, px + 16, 78, 228, 1);
    text(x, 'RUN TOTAL', px + 16, 90, PAL.boneDim, 1);
    text(x, money(this.earned), px + 244, 88, PAL.good, 2, 2);
    text(x, 'STARS', px + 16, 108, PAL.boneDim, 1);
    text(x, String(this.stars), px + 244, 108, PAL.amber, 1, 2);
    text(x, this.rank(), VW / 2, 126, PAL.amber, 2, 1);
    if (this.placed) text(x, 'NEW HIGH SCORE!', VW / 2, 150, PAL.amber, 1, 1);
    else text(x, 'BEAT ' + money(Scores.lowest()) + ' TO MAKE THE BOARD', VW / 2, 150, PAL.boneDim, 1, 1);
    if (this.cardT > 1.2 && (this.time * 2 | 0) % 2) text(x, 'PRESS ENTER', VW / 2, 166, PAL.bone, 1, 1);
  },

  overlayCont(x) {
    this.overlayScores(x);
    const n = Math.max(0, Math.ceil(this.contT));
    R(x, PAL.ink, 62, 150, 260, 34);
    x.strokeStyle = PAL.amber; x.lineWidth = 1; x.strokeRect(62.5, 150.5, 259, 33);
    text(x, 'CONTINUE? ' + n, VW / 2, 154, (this.time * 3 | 0) % 2 ? PAL.amber : PAL.bone, 2, 1);
    text(x, 'ENTER - LEVEL ' + this.levelN + ' AT $0.00   ESC - QUIT', VW / 2, 172, PAL.boneDim, 1, 1);
  },

  overlayVictory(x) {
    x.fillStyle = 'rgba(20,12,28,0.82)'; x.fillRect(0, 0, VW, VH);
    const px = this.card(x, 320, 170, 20, PAL.gold);
    text(x, 'ALL 20 SHIFTS', VW / 2, 30, PAL.gold, 3, 1);
    text(x, 'WORKED. 1972 TO 1999.', VW / 2, 56, PAL.bone, 1, 1);
    R(x, PAL.gold, px + 16, 70, 288, 1);
    text(x, 'RUN TOTAL', px + 16, 82, PAL.boneDim, 1);
    text(x, money(this.earned), px + 304, 80, PAL.good, 2, 2);
    text(x, 'STARS', px + 16, 102, PAL.boneDim, 1);
    text(x, String(this.stars), px + 304, 102, PAL.amber, 1, 2);
    text(x, this.rank(), VW / 2, 124, PAL.amber, 2, 1);
    text(x, 'THE ASADA THANKS YOU FOR YOUR SERVICE', VW / 2, 150, PAL.bone, 1, 1);
    if (this.cardT > 2 && (this.time * 2 | 0) % 2) text(x, 'PRESS ENTER', VW / 2, 172, PAL.amber, 1, 1);
  },

  /* Ten rows on a 12px pitch. The rank title is derived from the score rather
     than stored, so retuning rank() reflows the whole board. */
  overlayScores(x) {
    x.fillStyle = 'rgba(20,12,28,0.78)'; x.fillRect(0, 0, VW, VH);
    const w = 300, px = (VW - w) / 2 | 0, py = 6, h = 178;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'HIGH SCORES', VW / 2, 12, PAL.amber, 2, 1);
    R(x, PAL.amber, px + 16, 32, w - 32, 1);

    for (let i = 0; i < Scores.board.length; i++) {
      const e = Scores.board[i], y = 38 + i * 12;
      const mine = i === this.scoreIdx;
      const on = !mine || (this.time * 3 | 0) % 2 === 0;
      const col = mine ? (on ? PAL.amber : PAL.bone) : PAL.bone;
      text(x, (i + 1) + '', 75, y, mine ? col : PAL.boneDim, 1, 2);
      text(x, e.ini, 93, y, col, 1);
      text(x, money(e.cents), 193, y, col, 1, 2);
      text(x, this.rank.call({ earned: e.cents }), 208, y, mine ? col : PAL.boneDim, 1);
    }

    if (this.state === 'cont') return;
    if (this.scoresFromShift) {
      if ((this.time * 2 | 0) % 2) text(x, 'ENTER - TITLE', VW / 2, 167, PAL.bone, 1, 1);
    } else {
      text(x, 'BEAT THE BOARD', VW / 2, 167, PAL.boneDim, 1, 1);
    }
  },

  /* Arrows only, by design. A keyboard player's instinct is to type, so the
     prompt has to say plainly what drives it. */
  overlayEntry(x) {
    x.fillStyle = 'rgba(20,12,28,0.82)'; x.fillRect(0, 0, VW, VH);
    const w = 240, h = 118, px = (VW - w) / 2 | 0, py = 44;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'NEW HIGH SCORE', VW / 2, py + 10, PAL.amber, 2, 1);
    text(x, money(this.earned) + '  ' + this.rank(), VW / 2, py + 30, PAL.good, 1, 1);

    for (let i = 0; i < INI_LEN; i++) {
      const cx = VW / 2 + (i - 1) * 24, active = i === this.entrySlot;
      const on = !active || (this.time * 3 | 0) % 2 === 0;
      text(x, INI_ALPHA[this.entryIni[i]], cx, py + 48, on ? PAL.bone : PAL.boneDim, 2, 1);
      R(x, active ? PAL.amber : '#3a2c48', cx - 7, py + 66, 14, 1);
    }

    text(x, 'UP/DOWN - LETTER', VW / 2, py + 78, PAL.boneDim, 1, 1);
    text(x, 'LEFT/RIGHT - MOVE', VW / 2, py + 89, PAL.boneDim, 1, 1);
    text(x, 'ENTER - DONE', VW / 2, py + 100, PAL.bone, 1, 1);
  },

  /* The cabinet public-service card, following the period original: flat blue
     field, seal above, slogan in quotes, attribution beneath, credit counter
     bottom right. Copy is content/winners.json. */
  overlayWinners(x) {
    R(x, WINNERS_BLUE, 0, 0, VW, VH);
    x.drawImage(Art.seal, ((VW - Art.seal.width) / 2) | 0, 12);
    const slog = [].concat(CONTENT.slogan);
    slog.forEach((s, i) => {
      const y = 132 + i * 18;
      text(x, s, VW / 2 + 1, y + 1, '#12126a', 2, 1);
      text(x, s, VW / 2, y, PAL.gold, 2, 1);
    });
    const attY = 132 + slog.length * 18 + 6;
    [].concat(CONTENT.attribution).forEach((s, i) => text(x, s, VW / 2, attY + i * 11, PAL.gold, 1, 1));
    text(x, CONTENT.credit, VW - 8, VH - 12, PAL.bone, 1, 2);
  },

  overlayDemo(x) {
    if ((this.time * 1.2 | 0) % 2) return;
    /* attract.md's overlay text, verbatim. Any key works too: a cabinet that
       ignored everything but one key would read as broken. */
    textOut(x, 'PRESS ESC TO RETURN TO MENU', VW / 2, this.state === 'kdemo' ? 92 : 52, PAL.amber, 1, 1);
  },

  /* The page carries no key legend, so this overlay is the only place the
     controls are written down -- keep them here. In the kitchen it also
     carries the menu: a look at the recipes, paid for in clock time. */
  overlayPause(x) {
    x.fillStyle = 'rgba(20,12,28,0.88)'; x.fillRect(0, 0, VW, VH);
    const mode = typeof Pad !== 'undefined' ? Pad.mode : 'A';
    const lab = (a, def) => (mode !== 'A' && typeof Pad !== 'undefined' && Pad.label(a)) || def;
    if (this.stage === 'kitchen') {
      const px = this.card(x, 368, 206, 5);
      text(x, 'PAUSED', px + 12, 12, PAL.amber, 2);
      const keys = [
        [lab('drive', 'ARROWS/WASD/MOUSE'), 'MOVE'],
        [lab('select', 'SPACE/Z/CLICK'), 'PICK'],
        [lab('wrap', 'X'), 'WRAP'],
        [lab('serve', 'ENTER/C'), 'SEND'],
      ];
      keys.forEach((r, i) => {
        text(x, r[1], px + 356, 9 + i * 8, PAL.boneDim, 1, 2);
        text(x, r[0], px + 356 - 30, 9 + i * 8, PAL.bone, 1, 2);
      });
      R(x, PAL.red, px + 12, 41, 344, 1);
      text(x, 'THE MENU', px + 12, 46, PAL.amber, 1);
      this.drawRecipes(x, px + 12, 56, 344);
      text(x, 'P OR ESC TO RESUME', VW / 2, 202, PAL.cyan, 1, 1);
      this.versionTag(x, px + 356, 202);
      return;
    }
    const w = 222, h = 132, px = (VW - w) / 2 | 0, py = 30;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'PAUSED', VW / 2, py + 10, PAL.amber, 3, 1);
    R(x, PAL.red, px + 16, py + 34, w - 32, 1);

    const rows = [
      [lab('drive', 'W A S D  /  ARROWS'), 'DRIVE'],
      [mode === 'A' ? 'SHIFT' : '-', 'HANDBRAKE'],
      [lab('aim', 'MOUSE'), 'AIM THE TOSS'],
      [lab('throw', 'CLICK  /  SPACE'), 'THROW THE BAG'],
      [lab('mute', 'M  /  N'), 'MUTE  /  MUSIC'],
      [lab('pause', 'P  /  ESC'), 'PAUSE'],
    ];
    rows.forEach((r, i) => {
      const y = py + 46 + i * 13;
      text(x, r[0], 198, y, PAL.bone, 1, 2);
      text(x, r[1], 210, y, PAL.boneDim, 1);
    });
    text(x, 'P OR ESC TO RESUME', VW / 2, py + h + 7, PAL.cyan, 1, 1);
    this.versionTag(x, VW - 4, VH - 11);
  },
};

/* ---------------- CRT-ish post, and the era grade ------------- */
/* The grade is the owner's ruling of 2026-10-25: a full colour grade per era.
   It runs on the world frame, before the cards and the scanlines, as a
   per-pixel curve:
     1970s  warm and lifted, a little sepia, blacks never quite black
     1980s  punchy: more saturation and contrast, magenta in the shadows
     1990s  cooler and a touch desaturated, teal in the shadows
   On a context with no pixel readback (the test stubs) it is skipped, and
   everything else still draws. */
const Post = {
  lines: null, vig: null, luts: null,
  build() {
    let t = mkCanvas(VW, VH);
    t.x.fillStyle = 'rgba(10,6,16,0.13)';
    for (let y = 0; y < VH; y += 2) t.x.fillRect(0, y, VW, 1);
    this.lines = t.c;
    t = mkCanvas(VW, VH);
    const g = t.x.createRadialGradient(VW / 2, VH / 2, VH * 0.34, VW / 2, VH / 2, VH * 0.92);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(12,6,20,0.5)');
    t.x.fillStyle = g; t.x.fillRect(0, 0, VW, VH);
    this.vig = t.c;
  },
  apply(x, era) {
    if (!this.lines) this.build();
    x.drawImage(this.lines, 0, 0);
    x.drawImage(this.vig, 0, 0);
    if (era) this.grade(x, era);
  },

  /* era -> [sat, contrast, lift, [r,g,b] gain, [r,g,b] shadow tint] */
  GRADES: {
    1: [1.04, 1.02, 8, [1.08, 1.00, 0.84], [14, 6, -8]],
    2: [1.28, 1.08, 0, [1.03, 0.98, 1.06], [10, -4, 14]],
    3: [0.80, 1.04, 4, [0.94, 1.00, 1.06], [-8, 6, 8]],
  },

  grade(x, era) {
    const G2 = this.GRADES[era];
    if (!G2 || !x.getImageData) return;
    let img;
    try { img = x.getImageData(0, 0, VW, VH); } catch (_) { return; }
    if (!img || !img.data || !img.data.length) return;
    const d = img.data, [sat, con, lift, gain, tint] = G2;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      r = l + (r - l) * sat; g = l + (g - l) * sat; b = l + (b - l) * sat;
      r = (r - 128) * con + 128; g = (g - 128) * con + 128; b = (b - 128) * con + 128;
      const sh = 1 - l / 255;                    // shadows take the tint
      r = r * gain[0] + tint[0] * sh + lift * (1 - r / 255);
      g = g * gain[1] + tint[1] * sh + lift * (1 - g / 255);
      b = b * gain[2] + tint[2] * sh + lift * (1 - b / 255);
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
      d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b;
    }
    x.putImageData(img, 0, 0);
  },
};
