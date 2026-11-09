/* ============================================================
   KITCHEN SHIFT -- the other half of the game
   ============================================================

   Ported from reference/kitchen/kitchen.mjs, which is the approved LOOK. The
   regions keep the names its README gives them, so the docs and the code talk
   about the same things:

     TICKET RAIL   y 0..74     three dockets, x4 / x86 / x168, 78 wide
     OVERHEAD      x249..384   the dining room from above; the only place a
                   y 0..104    customer exists
     LATTICE       y104..164   TWELVE bins in 2x6, plus a base station either
                               side. Nothing on it ever moves between levels.
     PREP BOARD    y164..216   BUILD PROGRESS readout, the board, the button
     DIALOGUE STRIP            the shared strip, src/72_dialog.js

   One object, deliberately. The reference module had fifty top-level names,
   six times what a src module averages; in the bundle every one of them would
   share a scope with 140 others. Everything lives under `Kitchen`.

   The rules it plays by are GDD IV and docs/PURE-CARNAGE-DECISIONS.md:
     - the recipes are hidden: pips say how many steps, not which
     - a wrong pick flashes the PLATE red and holds until the right pick, costs
       the item's star and the ticket's clean bonus, and never undoes progress
     - focus is assigned (oldest ticket, next item) -- there is no input left
       for choosing it: select, wrap and serve are the three buttons
     - the tip is the patience; at zero the customer walks out
     - the rail holds three; more queue in the room and complain, and while
       anyone is queueing every live ticket drains half again as fast
*/
'use strict';

const Kitchen = {
  /* ---------------- geometry (reference/kitchen/README.md) ---------- */
  OV_X: 249, OV_H: 104,
  CELL_W: 46, CELL_H: 28, COL0: 5, ROW_Y: [105, 135],
  BX: 138, BW: 177,                      // the assembly board
  BTN: [321, 170, 59, 44],               // WRAP IT! / SEND IT! (x, y, w, h)
  /* The baked rack's three trays, in its own pixels: the inside of each
     compartment, between the posts (x) and the shelf bars (rows). The cursor
     draws 2px outside its rect, so it lands on those bars and posts. The trays
     are not even (the top one is shorter), which is why an even three-way
     split of the column missed them. Measured from LATTICE.TORTILLA. */
  TRAY_X: [6, 30], TRAY_ROWS: [[4, 10], [16, 14], [32, 15]], TRAY_SPLIT: [15, 31],
  TICKET_W: 78,
  get RAIL_MAX() { return G.diff.kitchen.railMax; },      // difficulty content
  get QUEUE_MAX() { return G.diff.kitchen.queueMax; },
  COMPLAIN_MUL: 1.5,
  PIP_W: 8, PIP_G: 1,

  /* Ingredient colours for what is still drawn: the stage pips, and the
     fallback blob in a well with no baked art. The wells (LATTICE) and the
     item on the board (BOARD) are baked pixel art; these are the same foods'
     mid / high / low, taken from the reference ING table. */
  ING: {
    BEEF:    ['#6b4326', '#8a5a33', '#452a15', 'chunk'],
    BEANS:   ['#8d5a33', '#a87243', '#66401f', 'mass'],
    LETTUCE: ['#5aa14c', '#7ddc5a', '#3d7534', 'shred'],
    TOMATO:  ['#e05a2a', '#ff8552', '#9c3410', 'chunk'],
    ONION:   ['#e6ddc6', '#ffffff', '#a89e86', 'chunk'],
    CCQ:     ['#e8a33c', '#ffc466', '#a86a18', 'sauce'],
    PEPPERS: ['#3e8a47', '#63b86b', '#204a28', 'chunk'],
    CREAM:   ['#f2e9d0', '#ffffff', '#c2b89c', 'sauce'],
    CHEESE:  ['#e0b055', '#f5d478', '#b0812c', 'shred'],
    SAUCE:   ['#b8361a', '#d9502a', '#7a2210', 'sauce'],
    CHILI:   ['#7a2416', '#9c3a22', '#4f160c', 'mass'],
    CHICKEN: ['#c9a25e', '#e2bd77', '#8f6d33', 'chunk'],
    SHELL:   ['#e0b055', '#f0c96f', '#b78a3a'],
    SMALL:   ['#d8c69c', '#ecdcb4', '#b8a37c'],
    LARGE:   ['#d8c69c', '#ecdcb4', '#b8a37c'],
    CHIPS:   ['#e6bb63', '#f7d488', '#b0812c'],
  },

  STAR: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
  STAR_LOST: '#6b5f84',

  /* ---------------- runtime state ------------------------------------ */
  menu: null, diff: null, era: 1, demo: false,
  bins: [], left: [], right: [],
  tickets: [], queue: [], walkers: [], pops: [],
  cur: { c: 3, r: 0, z: 0 },
  arriveT: 0, docket: 0,
  flashKey: null, flashT: 0, wrongKey: null, hintT: 0,
  newDishes: null, stallT: 0, hintItem: null, hintStep: -1,
  buzzT: 0, barkT: 0, complained: false,
  cleanRun: 0, troubleSaid: false, clockinSaid: false, shiftT: 0,   // the coworker's moments
  bg: null, wells: null, frames: null, picCache: null,
  lastMx: -1, lastMy: -1,
  bot: null,
  stats: null,

  /* ================================================================ */
  /* setup                                                            */
  /* ================================================================ */

  /* Called by G when a kitchen level starts (or the attract demo plays one). */
  enter(level, diff, demo) {
    this.era = level.era || 1;
    this.year = level.year || 1972; this.winter = level.season === 'winter';   // the wall calendar
    this.month = level.month;           // the season rule's month, carried on LEVELS by the validator
    this.diff = diff.kitchen;
    this.demo = !!demo;
    this.menu = (typeof MENUS !== 'undefined' && MENUS[this.era]) || this.fallbackMenu();
    this.bins = this.menu.bins.map((b) => this.norm(b));
    this.left = (this.menu.bases && this.menu.bases.left || ['SMALL', 'SHELL', 'LARGE']).map((b) => this.norm(b));
    this.right = (this.menu.bases && this.menu.bases.right || ['CHIPS']).map((b) => this.norm(b));
    this.tickets = []; this.queue = []; this.walkers = []; this.pops = [];
    this.cur = { c: 3, r: 0, z: 0 };
    this.onBtn = false;                   // the cursor is on WRAP IT! (Down past the bottom row)
    this.arriveT = 1.5;                   // the first ticket arrives almost at once
    this.docket = 0;
    this.flashKey = null; this.flashT = 0; this.wrongKey = null; this.hintT = 0;
    this.stallT = 0; this.hintItem = null; this.hintStep = -1;
    this.newDishes = this.findNewDishes();
    this.buzzT = 0; this.barkT = 0; this.complained = false;
    this.cleanRun = 0; this.troubleSaid = false; this.clockinSaid = false; this.shiftT = 0;
    this.stats = { served: 0, walkouts: 0, items: 0, clean: 0, mistakes: 0, best: 0 };
    this.bot = { t: 0.6, slip: null };
    if (!this.wells) this.buildWells();
    this.picCache = Object.create(null);
    this.bg = this.buildBg();
  },

  /* The dishes new to this era: not on the previous era's menu under the same
     name and recipe. Every dish is new in era 1. Medium's hint is for these. */
  findNewDishes() {
    const out = new Set(), prev = typeof MENUS !== 'undefined' && MENUS[this.era - 1];
    const old = new Map(prev ? prev.items.map((i) => [i.name, i.recipe.join('|')]) : []);
    for (const i of this.menu.items) if (old.get(i.name) !== i.recipe.join('|')) out.add(i.name);
    return out;
  },

  /* whether this difficulty gives the next-ingredient hint for this item */
  hintFor(item) {
    const d = this.diff;
    if (!d || !d.hint || !item) return false;
    return !d.hintNewOnly || this.newDishes.has(item.def.name);
  },

  /* blink the wanted plate; the coworker says it once per item step */
  fireHint(G, why) {
    const it = this.item();
    if (!it || it.step >= it.def.recipe.length) return;
    const want = it.def.recipe[it.step];
    this.hintT = 1.6;
    this.stallT = 0;
    if (this.hintItem !== it || this.hintStep !== it.step) {
      /* recorded only if the coworker actually spoke, so a refused line is tried again */
      if (Cast.say('coworker', 'hint', { vars: { ING: this.plateName(want) } })) { this.hintItem = it; this.hintStep = it.step; }
    }
  },

  /* bins and bases arrive as {key, name, plate} or a bare key */
  norm(b) {
    if (!b) return null;
    if (typeof b === 'string') return { key: b, name: b, plate: b.slice(0, 7) };
    return { key: b.key, name: b.name || b.key, plate: (b.plate || b.key).slice(0, 7) };
  },

  /* The game must never blank because content failed to load. build.mjs
     validates MENUS loudly; this exists only so a missing global cannot
     take the kitchen down with it. */
  fallbackMenu() {
    return {
      bins: ['BEEF', 'BEANS', 'LETTUCE', 'TOMATO', 'ONION', 'CCQ', 'PEPPERS', 'CREAM', 'CHEESE', null, null, null],
      bases: { left: ['SMALL', 'SHELL', 'LARGE'], right: ['CHIPS'] },
      items: [
        { name: 'HARD TACO', ticket: 'HARD TACO', short: 'HD TACO', price: 29, recipe: ['SHELL', 'BEEF', 'LETTUCE', 'CHEESE'] },
        { name: 'BEAN BURRITO', ticket: 'BEAN BURRITO', short: 'BEAN BUR', price: 49, recipe: ['LARGE', 'BEANS', 'CHEESE'] },
        { name: 'NACHOS', ticket: 'NACHOS', short: 'NACHOS', price: 49, recipe: ['CHIPS', 'CCQ', 'PEPPERS'] },
      ],
    };
  },

  /* Baked wells decode once, like Faces.build. Same run-length format, so the
     same decoder. */
  buildWells() {
    this.wells = Object.create(null);
    if (typeof LATTICE === 'undefined') return;
    for (const k in LATTICE) this.wells[k] = Faces.decode(LATTICE[k]);
  },

  /* ================================================================ */
  /* tickets and customers                                            */
  /* ================================================================ */

  /* Items per ticket, weighted toward one and two: a five-item ticket is an
     event, not the norm, or the rail would be nothing but backlog. */
  rollItems() {
    const max = clamp(this.diff.maxItems | 0, 1, 5);
    const W = [0, 0.42, 0.30, 0.15, 0.08, 0.05].slice(1, max + 1);
    let tot = W.reduce((a, b) => a + b, 0), r = Math.random() * tot;
    for (let i = 0; i < W.length; i++) { r -= W[i]; if (r <= 0) return i + 1; }
    return 1;
  },

  /* The coworker's two clock moments. Cast.say only speaks in the kitchen state,
     and the state goes card -> kitchen after enter(), so the clock-in waits for
     the first update inside the shift. Never in the attract demo. */
  coworker(G, dt) {
    if (this.demo) return;
    this.shiftT += dt;
    if (!this.clockinSaid) {
      if (Cast.say('coworker', 'clockin') || this.shiftT >= 1) this.clockinSaid = true;
    }
    if (!this.troubleSaid && G.shift < 30 && Cast.say('coworker', 'trouble')) this.troubleSaid = true;
  },

  arrive(G) {
    const n = this.rollItems(), items = [];
    for (let i = 0; i < n; i++) {
      const def = this.menu.items[(Math.random() * this.menu.items.length) | 0];
      items.push({ def, step: 0, clean: true, wrapped: false });
    }
    const t = {
      n: ++this.docket, items,
      tip: 0, max: 0, clean: true, onRail: false, x: 4 + 2 * 82 + 90, warned: false,
      cust: this.newCustomer(),
    };
    if (this.tickets.length < this.RAIL_MAX) this.toRail(t);
    else {
      this.queue.push(t);
      if (!this.complained) {
        this.complained = true;
        /* the coworker replaces the customer's complaint half the time */
        if (this.demo || !(Math.random() < TROUBLE_QUEUE_ODDS && Cast.say('coworker', 'trouble'))) this.bark(G, 'queue', t, true);
      }
    }
    Audio5.sfx('kbell');
    if (Math.random() < 0.18) this.bark(G, 'arrive', t, false);
  },

  /* The tip starts when the docket goes on the rail -- GDD IV.F.1, "from the
     moment the ticket arrives on the rail". A customer still queueing has no
     docket up yet, so they are not costing themselves; they are costing
     everyone else, which is the complaint. */
  toRail(t) {
    t.onRail = true;
    t.max = t.tip = this.diff.tipPerItem * t.items.length;
    this.tickets.push(t);
  },

  newCustomer() {
    const casts = this.castFor(this.era, this.year);
    return {
      i: (Math.random() * Art.ped.length) | 0,
      face: casts[(Math.random() * casts.length) | 0],
      x: VW + 4, y: 92, dir: 3, f: 0, ft: 0, leaving: 0,
    };
  },

  /* the era's customers, from content/casts.json (the build checks every name
     is a face and no era is empty); the dialogue default if there are none.
     With a year, only the faces that have arrived by then: CASTS.from holds a
     face's first year, so the decade's crowd grows level by level. The build
     guarantees somebody at an era's first level; the full list is the
     fallback all the same. */
  castFor(era, year) {
    const c = typeof CASTS !== 'undefined' ? CASTS[era] : null;
    if (!c || !c.length) return [DLG_FACE];
    const from = CASTS.from;
    if (year === undefined || !from) return c;
    const now = c.filter((n) => !(n in from) || from[n] <= year);
    return now.length ? now : c;
  },

  /* where the k-th person in line stands: a LINE perpendicular to the window,
     overlapping, the way a queue looks from directly above (reference) */
  spot(k) {
    const S = [[312, 61], [308, 72], [315, 82], [305, 90], [326, 89], [292, 84], [333, 78]];
    return S[Math.min(k, S.length - 1)];
  },

  /* ================================================================ */
  /* update                                                           */
  /* ================================================================ */

  update(dt, G) {
    this.flashT = Math.max(0, this.flashT - dt);
    this.buzzT = Math.max(0, this.buzzT - dt);
    this.barkT = Math.max(0, this.barkT - dt);
    this.hintT = Math.max(0, this.hintT - dt);
    this.coworker(G, dt);

    /* a stall: nothing picked for hintStall seconds while an item is being built */
    const building = this.item();
    if (building && building.step < building.def.recipe.length && this.hintFor(building)) {
      this.stallT += dt;
      if (this.stallT >= (this.diff.hintStall || 3)) this.fireHint(G, 'stall');
    } else this.stallT = 0;

    /* arrivals: on the clock, and at once whenever the room is empty */
    this.arriveT -= dt;
    const live = this.tickets.length + this.queue.length;
    if (live === 0 && this.arriveT > 0.6) this.arriveT = 0.6;
    if (this.arriveT <= 0) {
      if (live < this.RAIL_MAX + this.QUEUE_MAX) this.arrive(G);
      this.arriveT = this.diff.every;
    }

    /* patience. The complaint is a rate, not a meter: one more number on a
       screen that already has three would not be read. */
    const mul = this.queue.length ? this.COMPLAIN_MUL : 1;
    if (!this.queue.length) this.complained = false;
    for (let i = this.tickets.length - 1; i >= 0; i--) {
      const t = this.tickets[i];
      t.tip -= this.diff.decay * mul * dt;
      if (!t.warned && t.tip < t.max * 0.3) { t.warned = true; this.bark(G, 'wait', t, true); }
      if (t.tip <= 0) this.walkout(G, t, i);
    }

    /* the rail slides left as dockets come off it */
    this.tickets.forEach((t, s) => {
      const tx = 4 + s * 82;
      t.x += (tx - t.x) * (1 - Math.exp(-12 * dt));
      if (Math.abs(tx - t.x) < 0.5) t.x = tx;
    });

    this.walk(dt);

    if (this.demo || G.autopilot) this.botStep(dt, G);     // the attract cook, or the Test panel's autopilot
    else this.input(G);

    for (let i = this.pops.length - 1; i >= 0; i--) {
      const p = this.pops[i]; p.t += dt; p.y -= 14 * dt;
      if (p.t > 1.3) this.pops.splice(i, 1);
    }
  },

  /* everyone in the room walks toward where they should be standing */
  walk(dt) {
    const line = this.tickets.concat(this.queue);
    line.forEach((t, k) => { const [sx, sy] = this.spot(k); t.cust.tx = sx; t.cust.ty = sy; });
    const step = (c) => {
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d > 0.6) {
        const v = Math.min(d, (c.leaving ? 46 : 38) * dt);
        c.x += dx / d * v; c.y += dy / d * v;
        c.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        c.ft += dt; if (c.ft > 0.16) { c.ft = 0; c.f ^= 1; }
      } else { c.dir = c.leaving ? c.dir : 0; c.f = 0; }
    };
    for (const t of line) step(t.cust);
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const c = this.walkers[i]; step(c);
      if (Math.hypot(c.tx - c.x, c.ty - c.y) < 1) this.walkers.splice(i, 1);
    }
  },

  /* A customer leaving -- served out the side, or walked out the front. */
  leave(c, served) {
    c.leaving = 1;
    if (served) { c.tx = VW + 8; c.ty = c.y + 6; }
    else { c.tx = c.x + 6; c.ty = this.OV_H + 16; }
    this.walkers.push(c);
  },

  walkout(G, t, i) {
    this.tickets.splice(i, 1);
    this.leave(t.cust, false);
    this.stats.walkouts++;
    G.combo = 1;
    this.pop('WALKED OUT!', 300, 70, PAL.bad);
    this.bark(G, 'walkout', t, true, true);
    Audio5.sfx('walkout');
    G.say('WALKOUT!', PAL.bad);
    this.fillRail();
  },

  fillRail() {
    while (this.tickets.length < this.RAIL_MAX && this.queue.length) this.toRail(this.queue.shift());
  },

  focus() { return this.tickets[0] || null; },
  item() {
    const t = this.focus();
    if (!t) return null;
    for (const it of t.items) if (!it.wrapped) return it;
    return null;
  },

  /* ================================================================ */
  /* the three actions                                                */
  /* ================================================================ */

  keyAt(c, r, z) {
    if (c === 0) { const b = this.left[z]; return b ? b.key : null; }
    if (c === 7) { const b = this.right[0]; return b ? b.key : null; }
    const b = this.bins[r * 6 + (c - 1)];
    return b ? b.key : null;
  },

  select(G) {
    if (this.onBtn) { this.button(G); return; }
    const it = this.item(), c = this.cur;
    const key = this.keyAt(c.c, c.r, c.z);
    if (!it || it.step >= it.def.recipe.length || !key) { this.buzz(); return; }
    const want = it.def.recipe[it.step];
    if (key === want) {
      it.step++;
      this.stallT = 0;
      this.hintT = 0;                    // hintPlate follows the live step: end the blink or it jumps ahead
      this.flashKey = key; this.flashT = 0.32;
      this.wrongKey = null;
      Audio5.sfx('kpick', it.step);
      if (it.step >= it.def.recipe.length) Audio5.sfx('kready');
    } else {
      /* Counted, flashed and held -- but never undone. Losing progress on a
         mis-click would make the punishment out of all proportion to the
         slip, and the slip already costs the star and the clean bonus. */
      it.clean = false;
      this.focus().clean = false;
      this.wrongKey = key;
      this.flashKey = key; this.flashT = 0.32;
      this.stats.mistakes++;
      this.stallT = 0;
      if (this.hintFor(it)) this.fireHint(G, 'wrong');     // show the right bin
      Audio5.sfx('kwrong');
      if (Math.random() < 0.3) this.bark(G, 'wrong', this.focus(), true);
    }
  },

  wrap(G) {
    const it = this.item();
    if (!it || it.step < it.def.recipe.length) { this.buzz(); return; }
    it.wrapped = true;
    this.stats.items++;
    if (it.clean) { this.stats.clean++; G.levelStars++; G.stars++; }
    this.wrongKey = null;
    Audio5.sfx('kwrap');
    this.pop(it.clean ? 'WRAPPED  *' : 'WRAPPED', this.BX + this.BW / 2, 168, it.clean ? PAL.amber : PAL.bone);
  },

  serve(G) {
    const t = this.focus();
    if (!t || t.items.some((it) => !it.wrapped)) { this.buzz(); return; }
    const base = Math.max(0, Math.round(t.tip)) + (t.clean ? G.cleanBonus() : 0);
    const paid = Math.round(base * G.combo);
    G.earned += paid; G.levelEarned += paid;
    G.combo = Math.min(3, G.combo + 0.25); G.comboPop = 0.4;
    this.stats.served++;
    this.stats.best = Math.max(this.stats.best, paid);
    this.tickets.shift();
    this.leave(t.cust, true);
    this.pop('+' + money(paid), 312, 56, PAL.good);
    if (t.clean) this.pop('CLEAN TICKET +' + money(G.cleanBonus()), 300, 66, PAL.amber);
    if (t.clean) {
      if (++this.cleanRun >= 3) { this.cleanRun = 0; if (!this.demo) Cast.say('coworker', 'streak'); }
    } else this.cleanRun = 0;
    Audio5.sfx('kserve'); Audio5.sfx('cash');
    if (Math.random() < 0.35) this.bark(G, 'served', t, false);
    G.flash = 0.08;
    this.fillRail();
    G.onComplete();
  },

  buzz() { if (this.buzzT <= 0) { Audio5.sfx('kbuzz'); this.buzzT = 0.25; } },

  /* the button does whichever of WRAP or SEND is next */
  button(G) {
    const it = this.item();
    if (it) this.wrap(G); else this.serve(G);
  },

  /* ================================================================ */
  /* input                                                            */
  /* ================================================================ */

  move(dc, dr) {
    const c = this.cur;
    /* WRAP IT! sits below the line: Down from the bottom row steps onto it,
       and any other direction steps back to the bin you came from. */
    if (this.onBtn) {
      if (dr > 0) return;
      this.onBtn = false; Audio5.sfx('ktick'); return;
    }
    if (dr > 0 && !dc && (c.c === 0 ? c.z >= this.left.length - 1 : c.c === 7 || c.r >= 1)) {
      this.onBtn = true; Audio5.sfx('ktick'); return;
    }
    if (dc) {
      const nc = clamp(c.c + dc, 0, 7);
      if (nc === c.c) return;
      /* moving between a station and the bins maps by height: the station's
         three zones are 19px tall against the bins' 28, so zone 0 meets row 0
         and zone 2 meets row 1 */
      if (c.c === 0) c.r = c.z >= 2 ? 1 : 0;
      if (nc === 0) c.z = c.c === 0 ? c.z : (c.r === 0 ? 0 : 2);
      c.c = nc;
    }
    if (dr) {
      if (c.c === 0) c.z = clamp(c.z + dr, 0, this.left.length - 1);
      else if (c.c !== 7) c.r = clamp(c.r + dr, 0, 1);
    }
    Audio5.sfx('ktick');
  },

  input(G) {
    if (Input.p('ArrowLeft', 'KeyA')) this.move(-1, 0);
    if (Input.p('ArrowRight', 'KeyD')) this.move(1, 0);
    if (Input.p('ArrowUp', 'KeyW')) this.move(0, -1);
    if (Input.p('ArrowDown', 'KeyS')) this.move(0, 1);
    if (Input.p('Space', 'KeyZ')) this.select(G);
    if (Input.p('KeyX')) this.wrap(G);
    if (Input.p('Enter', 'NumpadEnter', 'KeyC')) this.serve(G);

    /* The mouse jumps the cursor to whatever it is over, and only when it
       actually moves -- otherwise a resting pointer would fight the arrows. */
    const touch = typeof Pad !== 'undefined' && Pad.touched;
    /* The clock card is a pause button. A phone has no Esc, and the driving
       half's on-screen pause sits where this half's ticket rail is. */
    if (Input.mhit && Input.mx >= VW - 131 && Input.my < 58) { G.paused = true; Input.mhit = false; return; }
    if (Input.hasMouse || touch) {
      const moved = Input.mx !== this.lastMx || Input.my !== this.lastMy;
      this.lastMx = Input.mx; this.lastMy = Input.my;
      const hit = this.hitTest(Input.mx, Input.my);
      if (hit && (moved || Input.mhit)) {
        if (hit.button) this.onBtn = true;
        if (hit.c !== undefined) {
          this.onBtn = false;
          const ch = hit.c !== this.cur.c || hit.r !== this.cur.r || hit.z !== this.cur.z;
          this.cur.c = hit.c; this.cur.r = hit.r; this.cur.z = hit.z;
          if (ch && !Input.mhit) Audio5.sfx('ktick');
        }
      }
      if (Input.mhit && hit) {
        if (hit.button) this.button(G);
        else this.select(G);
      }
    }
  },

  hitTest(mx, my) {
    const { CELL_W, CELL_H, ROW_Y } = this;
    const [bx, by, bw, bh] = this.BTN;
    if (mx >= bx && mx < bx + bw && my >= by && my < by + bh) return { button: true };
    if (my < ROW_Y[0] || my >= ROW_Y[1] + CELL_H) return null;
    const c = Math.floor((mx - this.COL0) / (CELL_W + 1));
    if (c < 0 || c > 7) return null;
    if (c === 0) {
      const rack = this.rack();
      const z = rack ? (my < rack.y + this.TRAY_SPLIT[0] ? 0 : my < rack.y + this.TRAY_SPLIT[1] ? 1 : 2)
        : clamp(Math.floor((my - ROW_Y[0]) / ((ROW_Y[1] + CELL_H - ROW_Y[0]) / this.left.length)), 0, this.left.length - 1);
      return { c: 0, r: z >= 2 ? 1 : 0, z };
    }
    if (c === 7) return { c: 7, r: 0, z: 0 };
    const r = my < ROW_Y[1] ? 0 : 1;
    return { c, r, z: 0 };
  },

  /* ================================================================ */
  /* the attract-mode cook                                            */
  /* ================================================================ */

  /* Plays through the same three actions a player has, at a human pace, and
     slips about one pick in twelve -- a demo that never errs shows nobody what
     a wrong pick looks like. */
  botStep(dt, G) {
    const b = this.bot;
    b.t -= dt;
    if (b.t > 0) return;
    const it = this.item();
    if (!this.focus()) { b.t = 0.4; return; }
    if (!it) { this.serve(G); b.t = 0.7; return; }
    if (it.step >= it.def.recipe.length) { this.wrap(G); b.t = 0.45; return; }
    const want = it.def.recipe[it.step];
    if (!b.slip && Math.random() < 0.08) {
      const keys = this.bins.filter((x) => x && x.key !== want);
      b.slip = keys.length ? keys[(Math.random() * keys.length) | 0].key : null;
    }
    const goal = this.cellOf(b.slip || want);
    if (!goal) { b.slip = null; b.t = 0.3; return; }
    const c = this.cur;
    if (c.c !== goal.c) { this.move(sign(goal.c - c.c), 0); b.t = 0.11; return; }
    if (c.c === 0 && c.z !== goal.z) { this.move(0, sign(goal.z - c.z)); b.t = 0.11; return; }
    if (c.c > 0 && c.c < 7 && c.r !== goal.r) { this.move(0, sign(goal.r - c.r)); b.t = 0.11; return; }
    this.select(G);
    b.slip = null;
    b.t = 0.26 + Math.random() * 0.2;
  },

  cellOf(key) {
    const z = this.left.findIndex((b) => b && b.key === key);
    if (z >= 0) return { c: 0, r: z >= 2 ? 1 : 0, z };
    if (this.right.some((b) => b && b.key === key)) return { c: 7, r: 0, z: 0 };
    const i = this.bins.findIndex((b) => b && b.key === key);
    if (i < 0) return null;
    return { c: (i % 6) + 1, r: (i / 6) | 0, z: 0 };
  },

  /* ================================================================ */
  /* dialogue                                                         */
  /* ================================================================ */

  /* One line over the shared strip. Rate-limited: the strip covers the lower
     bins, and a kitchen that talked every time something happened would hide
     the very thing you are working on. `force` is for the moments that earn
     it -- a walkout always speaks. */
  bark(G, kind, t, hostile, force) {
    if (this.demo || typeof DIALOGUE === 'undefined') return;
    if (this.barkT > 0 && !force) return;
    if (!force && Cast.showing()) return;      // a coworker is talking: one speaker at a time
    const line = G.lineFor(kind, t && t.cust ? t.cust.face : null);
    if (!line) return;
    this.barkT = 5;
    const face = t && t.cust ? t.cust.face : DLG_FACE;
    const rows = Math.max(1, Dialog.wrap(line, face).length);
    Dialog.say(DIALOGUE.who || 'CUSTOMER', line, {
      face: t && t.cust ? t.cust.face : DLG_FACE,
      hostile: !!hostile,
      hood: hostile ? 3 : 1,
      sub: t ? 'TICKET ' + t.n + (kind === 'walkout' ? '  -  WALKING OUT' : '') : '',
      meter: t && t.max ? clamp(t.tip / t.max, 0, 1) : null,
      secs: 1.9 + (rows - 1) * 1.0,        // two-row lines (most personal ones) need longer to read
    });
  },

  pop(s, x, y, col) { this.pops.push({ s, x, y, col, t: 0 }); },

  /* ================================================================ */
  /* drawing                                                          */
  /* ================================================================ */

  colX(i) { return this.COL0 + i * (this.CELL_W + 1); },

  /* Everything that never changes during a level, baked once: the back
     wall and its pantry, the dining room and its line-up, the steam table
     under the bins, and the prep counter with its board.

     The wall and the room change with the decade (owner, 2026-11-07, from
     the art director's mockups in reference/kitchen/surroundings/): '70s
     enamel tile and galvanized shelving, '80s wood paneling, '90s blue
     laminate and molded plastic. Cool colours, like the driving half -- the
     colour comes from the stock. The bins, the steam table and the board are
     the same in every decade. Everything the player reads sits in the band
     from y 56 to the bins, because the tickets cover the wall above it. */
  buildBg() {
    const t = mkCanvas(VW, VH), x = t.x;
    const STEEL_D = PAL.roadLo, STEEL_X = PAL.road, STEEL = PAL.walkLo, STEEL_M = PAL.walk, STEEL_H = PAL.walkHi;
    const WOOD = PAL.walkLo, WOOD_H = PAL.walk, WOOD_L = shade(PAL.curb, -0.12);
    const era = clamp(this.era || 1, 1, 3);

    /* back wall, its pantry, the calendar and the sign */
    this.drawWall(x, era);

    /* the rail spans the pass, not the whole kitchen */
    R(x, STEEL_X, 2, 1, 250, 6); R(x, STEEL_H, 2, 1, 250, 1); R(x, STEEL_M, 2, 2, 250, 1);
    R(x, shade(STEEL_X, -0.4), 2, 6, 250, 1);
    for (const bx of [2, 249]) { R(x, STEEL_D, bx, 0, 3, 10); R(x, STEEL_M, bx, 0, 3, 1); }

    /* the dining room, in plan -- the same projection as the driving half */
    this.drawDining(x, era);

    /* steam table */
    R(x, STEEL_D, 0, 104, VW, 60);
    R(x, STEEL_H, 0, 104, VW, 1); R(x, STEEL_M, 0, 105, VW, 2); R(x, STEEL, 0, 107, VW, 1);
    for (let i = 0; i < VW; i += 3) R(x, shade(STEEL_D, 0.06), i, 108, 1, 53);
    R(x, STEEL, 0, 160, VW, 2); R(x, STEEL_H, 0, 160, VW, 1); R(x, STEEL_X, 0, 162, VW, 2);

    /* prep counter and the board -- warmth as an island */
    R(x, WOOD_H, 0, 164, VW, 3);
    R(x, shade(WOOD_L, -0.35), 0, 167, VW, 1);
    R(x, WOOD, 0, 168, VW, VH - 168);
    const BX = this.BX, BW = this.BW;
    R(x, PAL.ink, BX - 1, 170, BW + 2, VH - 172);
    R(x, PAL.dirt, BX, 171, BW, VH - 174);
    R(x, PAL.porch, BX, 171, BW, 2);
    R(x, PAL.dirtLo, BX, VH - 5, BW, 2);
    let rng = makeRng(88);
    for (let i = 0; i < 70; i++) {
      const gy = 174 + rng.int(VH - 183), gx = BX + 2 + rng.int(BW - 14);
      const gw = Math.min(6 + rng.int(22), BX + BW - 2 - gx);
      R(x, rng.chance(0.5) ? shade(PAL.dirt, -0.13) : shade(PAL.dirt, 0.09), gx, gy, gw, 1);
    }
    x.globalAlpha = 0.20; R(x, PAL.ink, 0, VH - 7, VW, 7); x.globalAlpha = 1;
    /* the counter's front lip is the one place the decade shows on it: the
       surface stays quiet behind NOW BUILDING */
    const lip = era === 1 ? ['#b4bac8', '#8b8f9f', '#6a6e80'] :     // brushed steel
                era === 2 ? ['#5e3d2a', '#3a2418', '#2a1810'] :     // dark laminate
                            ['#b0a4f0', '#8a7ae0', '#5a4ab0'];      // plastic bumper
    R(x, PAL.ink, 0, VH - 6, VW, 1);
    R(x, lip[0], 0, VH - 5, VW, 1); R(x, lip[1], 0, VH - 4, VW, 3); R(x, lip[2], 0, VH - 1, VW, 1);
    return t.c;
  },

  /* the calendar shows the level's own month and year. The month is the
     level's (validate.mjs levelMonth: winter kitchen levels are December);
     with none, the season's usual one. */
  calendarText() {
    const m = this.month >= 1 && this.month <= 12 ? this.month : (this.winter ? 12 : 7);
    return ['JANFEBMARAPRMAYJUNJULAUGSEPOCTNOVDEC'.substr((m - 1) * 3, 3), String(this.year || 1972)];
  },

  /* The pieces every shelf is built from. Each is an ink-outlined block with
     a lit left edge and a shaded right one, standing on a baseline b. */
  stockKit(x) {
    const INK = PAL.ink;
    const blk = (bx, by, w, h, fill, hi, lo) => {
      R(x, INK, bx, by, w, h);
      R(x, fill, bx + 1, by + 1, w - 2, h - 2);
      if (hi) R(x, hi, bx + 1, by + 1, 1, h - 2);
      if (lo) R(x, lo, bx + w - 2, by + 1, 1, h - 2);
    };
    return {
      blk,
      can(cx, b, w, h, body, stripe) {
        blk(cx, b - h, w, h, body, shade(body, 0.25), shade(body, -0.3));
        R(x, '#a2a8b6', cx + 1, b - h, w - 2, 1);
        if (stripe) R(x, stripe, cx + 1, b - h + ((h / 2) | 0) - 1, w - 2, 2);
      },
      jar(jx, b, w, h, fill, lid) {
        R(x, INK, jx, b - h, w, h);
        R(x, lid, jx + 1, b - h + 1, w - 2, 2);
        R(x, fill, jx + 1, b - h + 3, w - 2, h - 4);
        R(x, shade(fill, 0.35), jx + 2, b - h + 4, 1, h - 6);
        for (let i = 0; i < 3; i++) R(x, shade(fill, -0.3), jx + 2 + ((i * 3) % (w - 4)), b - h + 5 + i * 3, 2, 1);
      },
      bottle(bx, b, h, fill, cap) {
        R(x, INK, bx + 2, b - h, 3, 4); R(x, INK, bx, b - h + 4, 7, h - 4);
        R(x, cap, bx + 3, b - h + 1, 1, 2);
        R(x, fill, bx + 1, b - h + 5, 5, h - 6); R(x, shade(fill, 0.3), bx + 1, b - h + 5, 1, h - 6);
      },
      squeeze(bx, b, h, fill) {
        R(x, INK, bx + 3, b - h, 2, 3); R(x, INK, bx + 1, b - h + 3, 6, 2); R(x, INK, bx, b - h + 4, 8, h - 4);
        R(x, '#f2e9d0', bx + 2, b - h + 4, 4, 1);
        R(x, fill, bx + 1, b - h + 5, 6, h - 6); R(x, shade(fill, 0.3), bx + 1, b - h + 5, 1, h - 6);
      },
      carton(bx, b, w, h, fill, stripe) {
        blk(bx, b - h, w, h, fill, shade(fill, 0.2), shade(fill, -0.22));
        R(x, shade(fill, -0.12), bx + 1, b - h + 2, w - 2, 1);
        if (stripe) R(x, stripe, bx + 2, b - ((h / 2) | 0) - 1, w - 4, 2);
      },
      shelf(x0, x1, sy, top, face, under) {
        R(x, PAL.shadow, x0, sy + 4, x1 - x0, 2);
        R(x, INK, x0 - 1, sy - 1, x1 - x0 + 2, 5);
        R(x, top, x0, sy, x1 - x0, 1); R(x, face, x0, sy + 1, x1 - x0, 2);
        R(x, under, x0, sy + 3, x1 - x0, 1);
      },
      post(px, y0, y1, col) {
        R(x, INK, px - 1, y0, 5, y1 - y0);
        R(x, col, px, y0, 3, y1 - y0); R(x, shade(col, 0.25), px, y0, 1, y1 - y0);
        for (let py = y0 + 3; py < y1 - 2; py += 4) R(x, shade(col, -0.45), px + 1, py, 1, 2);
      },
      grid(y0, h, sz, fill, grout, lit) {
        R(x, fill, 0, y0, 248, h);
        for (let gy = y0; gy < y0 + h; gy += sz) { R(x, grout, 0, gy, 248, 1); R(x, lit, 0, gy + 1, 248, 1); }
        for (let gx = 4; gx < 248; gx += sz) R(x, grout, gx, y0, 1, h);
      },
    };
  },

  drawWall(x, era) {
    const K = this.stockKit(x), INK = PAL.ink;
    const CRM = '#ece2c6';
    let cal, sign;
    if (era === 1) {
      /* '70s: cool enamel tile, galvanized shelving */
      K.grid(0, 104, 10, '#8b9b8c', '#6c7b6e', '#9aab9c');
      const G0 = '#8f94a0';
      K.post(40, 56, 102, G0); K.post(195, 56, 102, G0);
      K.shelf(40, 198, 73, '#b4b9c4', G0, '#6a6e80');
      K.shelf(40, 198, 97, '#b4b9c4', G0, '#6a6e80');
      // top: canned goods in a pyramid, jars, a bottle, an enamel coffee pot
      const RED = '#b8442e', GRN = '#3d6b33';
      K.can(50, 73, 13, 9, CRM, RED); K.can(63, 73, 13, 9, CRM, RED); K.can(57, 64, 13, 8, CRM, RED);
      K.can(81, 73, 12, 13, CRM, RED); K.can(93, 73, 12, 13, CRM, RED);
      K.jar(106, 73, 11, 14, '#8a9a3a', GRN); K.jar(118, 73, 11, 14, '#c0392b', GRN); K.jar(130, 73, 10, 14, '#e0a030', GRN);
      K.bottle(143, 73, 19, GRN, '#d0b04a');
      K.can(154, 73, 12, 13, CRM, GRN); R(x, GRN, 155, 67, 10, 1);
      K.blk(170, 56, 16, 17, CRM, '#fff8e4', '#c4b394');
      R(x, '#2e4a7a', 171, 56, 14, 2); R(x, INK, 175, 53, 6, 3); R(x, '#2e4a7a', 176, 54, 4, 1);
      R(x, INK, 186, 59, 4, 9); R(x, CRM, 187, 60, 2, 7); R(x, INK, 186, 61, 2, 5);
      // bottom: flour sacks, taco-shell cartons, sheet pans, paper goods
      for (const sx of [48, 70]) {
        R(x, INK, sx + 1, 78, 19, 19); R(x, INK, sx, 80, 21, 17);
        R(x, '#d8c7a0', sx + 1, 81, 19, 15); R(x, '#d8c7a0', sx + 2, 79, 17, 2);
        R(x, '#e6d8b8', sx + 2, 81, 2, 14); R(x, '#b49e78', sx + 17, 81, 2, 15);
        R(x, RED, sx + 1, 87, 19, 2); R(x, '#b49e78', sx + 4, 79, 13, 1);
      }
      for (const by of [78, 87]) {
        K.blk(93, by, 35, 10, '#c98a4a', '#dca064', '#9e6a38');
        R(x, '#f0c03a', 107, by + 3, 8, 4); R(x, '#f0c03a', 109, by + 2, 4, 1); R(x, INK, 107, by + 7, 8, 1);
        for (const dx of [97, 118]) { R(x, RED, dx, by + 4, 6, 1); R(x, RED, dx, by + 6, 6, 1); }
      }
      for (let i = 0; i < 3; i++) { const py = 86 + i * 4; R(x, INK, 129, py, 32, 4); R(x, '#c9cede', 130, py, 30, 1); R(x, PAL.walk, 131, py + 1, 28, 2); }
      K.blk(163, 80, 11, 17, '#d8c09a', '#e8d4b0', '#b49e78'); R(x, PAL.dirtLo, 167, 80, 3, 1);
      for (let i = 0; i < 4; i++) K.blk(175, 83 + i * 3, 16, i === 3 ? 6 : 4, '#d0b088', '#e0c49c', '#a88a64');
      cal = { x: 7, y: 63, w: 27, h: 34, band: RED, ink: '#55413b', paper: '#e9d8b4', rings: 1 };
      sign = { x: 205, y: 69, w: 39 };
    } else if (era === 2) {
      /* '80s: tile above, wood paneling below, wooden shelf boards */
      K.grid(0, 52, 7, '#6e7896', '#57607c', '#7c86a4');
      const WD = '#8e4c26', WG = '#6e3a1c', WL = '#a05a2e';
      R(x, WD, 0, 52, 248, 52);
      for (let px = 0; px < 248; px += 7) { R(x, WG, px, 55, 1, 49); R(x, WL, px + 1, 55, 1, 49); }
      const rng = makeRng(1984);
      for (let i = 0; i < 60; i++) R(x, rng.chance(0.5) ? '#7e4220' : '#9a5630', rng.int(248), 57 + rng.int(45), 1, 3 + rng.int(8));
      R(x, INK, 0, 51, 248, 1); R(x, '#c06a35', 0, 52, 248, 1); R(x, '#a5582a', 0, 53, 248, 2);   // chair rail
      for (const px of [37, 115, 199]) K.post(px, 55, 102, '#7a84a0');
      for (const sy of [73, 93]) { K.shelf(40, 115, sy, '#d07a40', '#a5582a', WG); K.shelf(119, 199, sy, '#d07a40', '#a5582a', WG); }
      const RED = '#d0402c', BLU = '#2f5fc0', YEL = '#f0c030';
      // top: cans, jars, bottles | cartons, a jug, nested pans, paper
      K.can(42, 73, 12, 15, RED, CRM); K.can(54, 73, 9, 10, RED, CRM); K.can(63, 73, 12, 14, BLU, CRM); K.can(75, 73, 7, 9, BLU, CRM);
      K.jar(84, 73, 8, 11, '#b09a30', '#3f3f4e'); K.jar(92, 73, 7, 11, '#d0602c', '#3f3f4e');
      K.bottle(99, 73, 17, '#c0392b', '#e8d4b0'); K.bottle(106, 73, 17, '#3d8a3d', '#e8d4b0');
      K.carton(121, 66, 18, 8, '#ecd8b0', RED); K.carton(121, 73, 18, 7, '#ecd8b0', BLU);
      K.blk(141, 58, 13, 15, '#f2ecdc', '#ffffff', '#c9c0a8'); R(x, '#c0392b', 142, 65, 11, 3); R(x, INK, 146, 56, 5, 3); R(x, '#f2ecdc', 147, 57, 3, 1);
      for (let i = 0; i < 3; i++) { const w = 22 - i * 4, px = 158 + i * 2, py = 69 - i * 4; R(x, INK, px, py, w, 4); R(x, '#c9cede', px + 1, py, w - 2, 1); R(x, PAL.walkHi, px + 1, py + 1, w - 2, 2); }
      for (let i = 0; i < 6; i++) { R(x, INK, 185, 59 + i * 2, 12, 2); R(x, i % 2 ? '#c0392b' : '#f2e9d0', 186, 59 + i * 2, 10, 1); }
      R(x, INK, 185, 71, 12, 2);
      // bottom: canisters, boxes | cans, a stockpot and a saucepan
      [['#3d8a3d', 42], ['#c0392b', 53], [BLU, 64], [YEL, 75]].forEach(([col, cx]) => {
        K.blk(cx, 78, 11, 15, CRM, '#fff8e4', '#c4b394'); R(x, '#c9cede', cx + 1, 78, 9, 1); R(x, col, cx + 1, 84, 9, 3);
      });
      K.carton(88, 93, 10, 16, RED, null); R(x, CRM, 90, 81, 6, 2);
      K.carton(97, 93, 9, 16, BLU, null); R(x, CRM, 99, 81, 5, 2);
      K.carton(105, 93, 9, 6, YEL, null); K.carton(105, 87, 9, 6, YEL, null);
      for (const [cx, col] of [[120, RED], [134, BLU], [148, YEL]]) { K.can(cx, 93, 8, 15, col, CRM); K.can(cx + 8, 93, 6, 9, col, CRM); }
      K.blk(163, 80, 20, 13, '#a2a8b6', '#c9cede', '#7c8292'); R(x, '#c9cede', 162, 79, 22, 2);
      R(x, INK, 171, 77, 4, 2); R(x, INK, 160, 82, 3, 2); R(x, INK, 183, 82, 3, 2);
      K.blk(186, 85, 12, 8, '#a2a8b6', '#c9cede', '#7c8292'); R(x, '#c9cede', 185, 84, 14, 2); R(x, INK, 191, 82, 3, 2);
      cal = { x: 5, y: 61, w: 27, h: 34, band: '#c0392b', ink: '#4e3739', paper: '#e8d7b9', rings: 2 };
      sign = { x: 205, y: 62, w: 40 };
    } else {
      /* '90s: blue laminate, purple epoxy shelving, molded totes, a poster */
      K.grid(0, 104, 10, '#8d9cc4', '#7484ae', '#9cabd0');
      for (const px of [33, 95, 163, 199]) K.post(px, 55, 102, '#5a5f74');
      K.shelf(32, 203, 74, '#c0b4f4', '#9a8ae6', '#5a4ab0');
      K.shelf(32, 203, 98, '#c0b4f4', '#9a8ae6', '#5a4ab0');
      const tote = (tx, b, w, h, inside) => {
        for (const [k, c] of inside) { R(x, INK, tx + 2 + k, b - h - 3, 8, 5); R(x, c, tx + 3 + k, b - h - 2, 6, 3); }
        K.blk(tx, b - h, w, h, '#7cb4e8', '#a8d0f4', '#5a8ec4'); R(x, '#4a78b0', tx + (w >> 1) - 3, b - h + 4, 6, 1);
      };
      const WHT = '#f2ecdc';
      // top: cans, a tote of packets, squeeze bottles, cartons, two pans
      K.can(38, 74, 12, 15, WHT, '#c0392b'); K.can(51, 74, 12, 15, WHT, '#3fa35a');
      tote(67, 74, 27, 9, [[0, '#d0428a'], [10, '#f0c030']]);
      K.squeeze(99, 74, 18, '#e0402c'); K.squeeze(108, 74, 18, '#f0c030'); K.squeeze(117, 74, 18, '#3fa35a');
      for (const [cx, col] of [[129, '#4a8fd0'], [140, '#c0392b'], [151, '#3fa35a']]) { K.blk(cx, 59, 11, 15, WHT, '#ffffff', '#c9c0a8'); R(x, col, cx + 1, 63, 9, 2); R(x, INK, cx + 2, 58, 7, 1); }
      for (let i = 0; i < 2; i++) { const py = 61 + i * 6; R(x, INK, 168, py, 22, 6); R(x, '#c9cede', 169, py, 20, 1); R(x, PAL.walkHi, 169, py + 1, 20, 4); R(x, INK, 190, py + 1, 6, 2); }
      // bottom: striped cartons, a box, totes of paper and tortillas, bottles, cups
      for (const [sy, col] of [[80, '#c0392b'], [89, '#3fa35a']]) { K.blk(38, sy, 23, 9, WHT, '#ffffff', '#c9c0a8'); R(x, col, 39, sy + 3, 21, 2); }
      K.carton(61, 98, 12, 18, '#e8702c', null); for (let i = 0; i < 3; i++) R(x, '#f0a050', 62, 83 + i * 5, 10, 1);
      tote(76, 98, 23, 11, [[1, WHT], [9, WHT]]);
      tote(101, 98, 23, 11, [[1, PAL.dirt], [9, PAL.dirt]]);
      K.squeeze(124, 98, 18, '#e0402c'); K.squeeze(132, 98, 18, '#e8802c'); K.squeeze(140, 98, 18, '#d0405a');
      for (const [cx, col] of [[151, '#f0c030'], [162, '#4a8fd0']]) { K.blk(cx, 82, 11, 16, WHT, '#ffffff', '#c9c0a8'); R(x, col, cx + 1, 88, 9, 2); }
      for (const [cx, h] of [[176, 19], [188, 14]]) { K.blk(cx, 98 - h, 11, h, WHT, '#ffffff', '#c9c0a8'); for (let py = 98 - h + 3; py < 97; py += 4) R(x, '#d0428a', cx + 1, py, 9, 1); }
      // the promo poster: it peeks out under the third ticket on a busy shift
      K.blk(205, 34, 41, 28, '#f0c030', null, null);
      for (let i = 0; i < 26; i++) {
        R(x, '#d0428a', 206, 35 + i, Math.max(0, 22 - i), 1);
        const bw = Math.max(0, i - 6); R(x, '#3a8ad0', 245 - bw, 35 + i, bw, 1);
      }
      R(x, INK, 213, 44, 20, 10); R(x, '#f0c030', 214, 45, 18, 8); R(x, '#3d8a3d', 215, 45, 16, 2);
      R(x, '#c0392b', 218, 45, 2, 1); R(x, '#c0392b', 225, 45, 2, 1); R(x, '#8a5a2a', 215, 47, 3, 3);
      cal = { x: 4, y: 60, w: 27, h: 35, band: '#3a78c8', ink: '#364658', paper: '#e9e1cb', rings: 2, stripe: '#f0c030' };
      sign = { x: 207, y: 69, w: 38 };
    }

    /* the calendar: the level's own month and year */
    const [mon, yr] = this.calendarText();
    R(x, PAL.shadow, cal.x + 2, cal.y + 2, cal.w, cal.h);
    K.blk(cal.x, cal.y, cal.w, cal.h, cal.paper, null, shade(cal.paper, -0.12));
    R(x, cal.band, cal.x + 1, cal.y + 1, cal.w - 2, 5);
    if (cal.stripe) R(x, cal.stripe, cal.x + 1, cal.y + 6, cal.w - 2, 1);
    for (const rx of cal.rings === 1 ? [cal.x + (cal.w >> 1) - 2] : [cal.x + 5, cal.x + cal.w - 8]) {
      R(x, INK, rx, cal.y - 3, 4, 5); R(x, '#a2a8b6', rx + 1, cal.y - 2, 2, 3);
    }
    text(x, mon, cal.x + cal.w / 2, cal.y + 10, cal.ink, 1, 1);
    text(x, yr, cal.x + cal.w / 2, cal.y + 19, cal.ink, 1, 1);
    for (let c = 0; c < 6; c++) R(x, shade(cal.paper, -0.2), cal.x + 3 + c * 4, cal.y + cal.h - 5, 2, 1);
    this.calRect = cal;

    /* the sign: jade and gold, in the shop's own lettering (the rooftop's) */
    const sh = 25;
    R(x, PAL.shadow, sign.x + 2, sign.y + 2, sign.w, sh);
    R(x, INK, sign.x, sign.y, sign.w, sh);
    R(x, PAL.goldLo, sign.x + 1, sign.y + 1, sign.w - 2, sh - 2);
    R(x, PAL.jadeLo, sign.x + 2, sign.y + 2, sign.w - 4, sh - 4);
    for (const [dx, dy] of [[3, 3], [sign.w - 4, 3], [3, sh - 4], [sign.w - 4, sh - 4]]) R(x, PAL.gold, sign.x + dx, sign.y + dy, 1, 1);
    const cx = sign.x + sign.w / 2;
    logoText(x, 'TACO', cx + 1, sign.y + 3, 1, 0, '#0e3d30'); logoText(x, 'SHOP', cx + 1, sign.y + 13, 1, 0, '#0e3d30');
    logoText(x, 'TACO', cx, sign.y + 2, 1, 0, PAL.gold); logoText(x, 'SHOP', cx, sign.y + 12, 1, 0, PAL.gold);
    this.signRect = { x: sign.x, y: sign.y, w: sign.w, h: sh };
  },

  /* The dining room, from directly above. The score card covers it down to
     y 57, service window included, so everything added here is on the
     visible floor -- and off the queue spots and the walk paths (spot(),
     the door at the right, a walkout straight down). */
  drawDining(x, era) {
    const OX = this.OV_X, OW = VW - OX, OH = this.OV_H, INK = PAL.ink;
    const F = era === 1 ? ['#7c7f8c', '#8a8d98'] : era === 2 ? ['#6e7080', '#787a8a'] : ['#8d93a6', '#979db0'];
    R(x, F[0], OX, 0, OW, OH);
    for (let ty = 0; ty < OH; ty += 8)
      for (let tx = OX + 1; tx < VW; tx += 8) {
        if (era === 1 && ((tx + ty) >> 3) % 2) R(x, F[1], tx, ty, 8, 8);
        if (era === 2) { R(x, F[1], tx, ty, 7, 7); R(x, '#5a5266', tx + 7, ty, 1, 8); R(x, '#5a5266', tx, ty + 7, 8, 1); }
      }
    if (era === 3) {
      const rng = makeRng(1993);
      for (let i = 0; i < 26; i++) R(x, rng.pick(['#d0428a', '#4a8fd0', '#e8d24a', '#7c8292']), OX + 2 + rng.int(OW - 3), rng.int(OH), 1, 1);
    }
    R(x, INK, OX - 1, 0, 2, OH);

    /* the service wall and its window */
    const wy = 48, wh = 11, ox = OX + 47, ow = 40;
    const STEEL_X = PAL.road, STEEL_M = PAL.walk, STEEL_H = PAL.walkHi;
    const wall2 = (px, w2) => {
      R(x, INK, px, wy, w2, wh);
      R(x, shade(PAL.wallMd, -0.30), px, wy + 1, w2, wh - 2);
      R(x, shade(PAL.wallLt, -0.24), px, wy + 1, w2, 2);
      R(x, shade(PAL.wallDk, -0.24), px, wy + wh - 3, w2, 2);
    };
    wall2(OX, ox - OX); wall2(ox + ow, VW - (ox + ow));
    R(x, shade(INK, 0.05), ox, wy, ow, 4);
    R(x, INK, ox, wy + 4, ow, 8);
    R(x, STEEL_M, ox, wy + 5, ow, 5); R(x, STEEL_H, ox, wy + 5, ow, 2); R(x, STEEL_X, ox, wy + 10, ow, 2);
    R(x, 'rgba(12,8,20,0.30)', ox, wy + 12, ow, 4);
    for (const jx of [ox - 5, ox + ow]) {
      R(x, INK, jx, wy + wh, 5, 16);
      R(x, shade(PAL.wallMd, -0.34), jx + 1, wy + wh, 3, 15);
      R(x, shade(PAL.wallLt, -0.30), jx + 1, wy + wh, 1, 15);
      R(x, 'rgba(12,8,20,0.34)', jx + 4, wy + wh, 3, 15);
    }

    /* the door customers come in by, bottom right, and a mat inside it */
    R(x, shade(PAL.walk, -0.40), VW - 12, 80, 12, 24);
    R(x, shade(PAL.walk, -0.12), VW - 12, 80, 1, 24);
    const MAT = era === 1 ? '#5c5040' : era === 2 ? '#7a2f3a' : '#3a5a8a';
    R(x, INK, VW - 26, 84, 13, 16); R(x, MAT, VW - 25, 85, 11, 14);
    for (let i = 0; i < 6; i++) R(x, shade(MAT, -0.25), VW - 24, 86 + i * 2, 9, 1);

    /* the rope line the queue forms along: a velvet rope, a '90s belt */
    const ROPE = era === 3 ? '#3a78c8' : '#a02a2a';
    for (const rx of [286, 345]) {
      R(x, shade(ROPE, -0.4), rx + 2, 65, 1, 29); R(x, ROPE, rx + 1, 65, 1, 29);
      for (const sy of [63, 78, 93]) {
        R(x, PAL.shadow, rx, sy + 2, 4, 2); R(x, INK, rx - 1, sy - 1, 5, 5);
        R(x, era === 2 ? '#d0a040' : '#c9cede', rx, sy, 3, 3); R(x, '#ffffff', rx, sy, 1, 1);
      }
    }

    /* a trash can with the tray stack on top, by the left jamb */
    R(x, PAL.shadow, 254, 77, 14, 4); R(x, INK, 252, 63, 15, 15);
    R(x, era === 3 ? '#8a5fc0' : era === 2 ? '#6b4630' : PAL.walk, 253, 64, 13, 13);
    R(x, INK, 255, 66, 9, 3); R(x, '#c9cede', 253, 64, 13, 1);
    R(x, era === 3 ? '#b38ae0' : era === 2 ? '#8a5c3e' : '#a2a8b6', 253, 71, 13, 2);

    /* a potted cactus, and the condiment stand by the exit */
    R(x, PAL.shadow, 358, 70, 11, 3); R(x, INK, 356, 61, 11, 10); R(x, '#a8603a', 357, 62, 9, 8);
    R(x, INK, 358, 58, 7, 7); R(x, PAL.tree, 359, 59, 5, 5); R(x, PAL.treeHi, 360, 59, 1, 4); R(x, PAL.treeHi, 362, 60, 1, 3);
    const STAND = era === 1 ? '#a2a8b6' : era === 2 ? '#d8ccb0' : '#3f3f4e';
    R(x, PAL.shadow, 352, 82, 14, 3); R(x, INK, 350, 76, 14, 8); R(x, STAND, 351, 77, 12, 6);
    R(x, INK, 352, 74, 5, 5); R(x, '#f2e9d0', 353, 75, 3, 3);
    R(x, INK, 358, 73, 4, 6); R(x, '#c0392b', 359, 74, 1, 4); R(x, '#3a78c8', 360, 74, 1, 4);
  },

  draw(x, G) {
    x.drawImage(this.bg, 0, 0);
    this.drawRoom(x, G);
    for (let i = this.tickets.length - 1; i >= 0; i--) this.drawTicket(x, this.tickets[i], i === 0);
    this.drawLattice(x, G);
    this.drawPrep(x, G);
    this.drawCard(x, G);
    for (const p of this.pops) {
      x.globalAlpha = clamp(1.3 - p.t, 0, 1);
      textOut(x, p.s, p.x, p.y | 0, p.col, 1, 1);
      x.globalAlpha = 1;
    }
  },

  /* the dining room: everyone is Art.ped, the same people who walk the
     pavements in the driving half */
  drawRoom(x, G) {
    x.save();
    x.beginPath(); x.rect(this.OV_X + 1, 0, VW - this.OV_X - 1, this.OV_H); x.clip();
    const people = this.tickets.concat(this.queue).map((t) => t.cust).concat(this.walkers);
    people.sort((a, b) => a.y - b.y);
    for (const c of people) {
      const dx = c.x | 0, dy = c.y | 0;
      R(x, 'rgba(12,8,20,0.32)', dx + 1, dy + 12, 7, 3);
      x.drawImage(Art.ped[c.i % Art.ped.length][c.dir][c.f], dx, dy);
      if (G.weather === 'snowy') { R(x, PAL.bone, dx + 3, dy, 4, 1); }   // snow on the hat, while it snows
    }
    x.restore();

    /* the line is long and they are letting you know */
    if (this.queue.length && (G.time * 3 | 0) % 2) {
      const [sx, sy] = this.spot(this.tickets.length);
      textOut(x, '!', sx + 4, sy - 9, PAL.bad, 1, 1);
    }
  },

  drawTicket(x, t, active) {
    const w = this.TICKET_W, py = 5, h = 26 + t.items.length * 8 + 3, px = Math.round(t.x);
    const STEEL_X = PAL.road, STEEL_H = PAL.walkHi;
    const PAPER = shade(PAL.lineW, -0.13), PAPER_D = PAL.boneDim, INKDIM = shade(PAL.bone, -0.46);
    R(x, STEEL_X, px + 36, 3, 5, 5); R(x, STEEL_H, px + 37, 3, 3, 2);
    R(x, 'rgba(12,8,20,0.38)', px + 2, py + 2, w, h);
    R(x, PAL.ink, px, py, w, h);
    R(x, PAPER, px + 1, py + 1, w - 2, h - 2);
    R(x, PAPER_D, px + 1, py + h - 2, w - 2, 1);
    if (active) { x.strokeStyle = PAL.amber; x.lineWidth = 1; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1); }
    text(x, String(t.n), px + w / 2, py + 4, PAL.ink, 2, 1);
    if (t.clean && active) this.star(x, px + w - 10, py + 4, PAL.amber, PAL.ink);
    R(x, PAL.ink, px + 3, py + 20, w - 6, 1);

    /* patience: the tip-decay bar's idiom, because it is the same thing */
    const pat = t.max ? clamp(t.tip / t.max, 0, 1) : 0;
    R(x, INKDIM, px + 3, py + 22, w - 6, 3);
    const pw = Math.round((w - 8) * pat);
    const hi = pat > 0.5 ? PAL.amber : pat > 0.22 ? '#e07a1f' : PAL.bad;
    R(x, hi, px + 4, py + 23, pw, 1); R(x, shade(hi, -0.32), px + 4, py + 24, pw, 1);

    const cur = active ? t.items.findIndex((it) => !it.wrapped) : -1;
    t.items.forEach((it, i) => {
      const ty = py + 27 + i * 8;
      const nm = it.def.ticket || it.def.name;
      if (i === cur) R(x, PAL.amber, px + 2, ty - 1, w - 4, 9);
      /* done reads as CROSSED OFF, not faded: still legible, struck the way
         a cook strikes a docket */
      text(x, nm, px + 3, ty, it.wrapped ? shade(PAL.bone, -0.40) : PAL.ink, 1);
      if (it.wrapped) R(x, PAL.ink, px + 2, ty + 3, textW(nm, 1) + 2, 1);
    });
  },

  drawLattice(x, G) {
    const { CELL_W, CELL_H, ROW_Y } = this;
    const it = this.item();
    const want = it && it.step < it.def.recipe.length ? it.def.recipe[it.step] : null;
    for (let i = 0; i < 12; i++) {
      const b = this.bins[i], c = (i % 6) + 1, r = (i / 6) | 0;
      const px = this.colX(c), py = ROW_Y[r];
      if (!b) { this.emptyBin(x, px, py); continue; }
      this.bin(x, px, py, b);
    }
    const SH = ROW_Y[1] + CELL_H - ROW_Y[0];
    this.station(x, this.colX(0), ROW_Y[0], SH, 'TORTILLA', this.left);
    this.station(x, this.colX(7), ROW_Y[0], SH, this.right[0] ? this.right[0].key : 'CHIPS', this.right);

    /* plates: the name exists only at the moment you touch the bin. Bone/green
       means that went in; red means it did not, and red HOLDS until the right
       pick (GDD IV rule 2). Flashing the plate rather than the contents is the
       reference's finding: TOMATO, SAUCE and CHILI are red already. */
    if (this.wrongKey) this.plate(x, this.wrongKey, PAL.bad, (G.time * 6 | 0) % 2 ? 1 : 0.7);
    if (this.flashT > 0 && this.flashKey && this.flashKey !== this.wrongKey) this.plate(x, this.flashKey, PAL.good, 1);
    this.hintPlate(x, G);

    const r = this.onBtn ? this.BTN : this.cellRect(this.cur.c, this.cur.r, this.cur.z);
    this.cursor(x, r[0], r[1], r[2], r[3]);
  },

  /* the amber blink on the wanted plate. Drawn again after the strip, because
     the strip covers the lower bins and the station under the portrait */
  hintPlate(x, G) {
    const it = this.item();
    const want = it && it.step < it.def.recipe.length ? it.def.recipe[it.step] : null;
    if (this.hintT > 0 && want && (G.time * 5 | 0) % 2) this.plate(x, want, PAL.amber, 1);
  },

  /* where the baked tortilla rack sits on screen, or null when there is no
     baked rack or it is not the three-tray one the TRAY_ constants measure */
  rack() {
    const W = this.wells && this.wells.TORTILLA;
    if (!W || this.left.length !== 3) return null;
    const SH = this.ROW_Y[1] + this.CELL_H - this.ROW_Y[0];
    return { x: this.colX(0) + ((this.CELL_W - W.width) >> 1), y: this.ROW_Y[0] + ((SH - W.height) >> 1) };
  },

  cellRect(c, r, z) {
    const { CELL_W, CELL_H, ROW_Y } = this;
    const SH = ROW_Y[1] + CELL_H - ROW_Y[0];
    const rack = c === 0 && this.rack();
    if (rack) {
      const [ty, th] = this.TRAY_ROWS[z];
      return [rack.x + this.TRAY_X[0], rack.y + ty, this.TRAY_X[1], th];
    }
    if (c === 0) {
      const n = this.left.length, zh = SH / n;
      return [this.colX(0), Math.round(ROW_Y[0] + z * zh), CELL_W, Math.round(zh)];
    }
    if (c === 7) return [this.colX(7), ROW_Y[0], CELL_W, SH];
    return [this.colX(c), ROW_Y[r], CELL_W, CELL_H];
  },

  plate(x, key, col, alpha) {
    const cell = this.cellOf(key);
    if (!cell) return;
    let [px, py, w] = this.cellRect(cell.c, cell.r, cell.z);
    if (cell.c === 0) { px = this.colX(0); w = this.CELL_W; }   // a tray is narrower than its name
    const name = this.plateName(key);
    x.globalAlpha = alpha;
    R(x, PAL.ink, px + 1, py + 1, w - 2, 10);
    R(x, col, px + 1, py + 1, w - 2, 9);
    R(x, shade(col, -0.38), px + 1, py + 9, w - 2, 1);
    text(x, name, px + w / 2, py + 2, PAL.ink, 1, 1);
    x.globalAlpha = 1;
  },

  plateName(key) {
    for (const b of this.bins.concat(this.left, this.right)) if (b && b.key === key) return b.plate;
    return key.slice(0, 7);
  },

  bin(x, px, py, b) {
    const { CELL_W: w, CELL_H: h } = this;
    const baked = this.wells[b.key];
    R(x, PAL.roadLo, px, py, w, h);
    R(x, PAL.roadLo, px + 1, py + 1, w - 2, h - 2);
    R(x, PAL.walk, px + 1, py + 1, w - 2, 1);
    R(x, PAL.road, px + 2, py + 2, w - 4, h - 4);
    if (baked) x.drawImage(baked, px + ((w - baked.width) >> 1), py + ((h - baked.height) >> 1));
    else {
      const [m, hi, lo] = this.ING[b.key] || ['#888', '#aaa', '#666'];
      this.blob(x, px + w / 2, py + h - 6, 26, 12, m, hi, lo);
    }
  },

  emptyBin(x, px, py) {
    const { CELL_W: w, CELL_H: h } = this;
    const e = this.wells.EMPTY;
    if (e) { x.drawImage(e, px + ((w - e.width) >> 1), py + ((h - e.height) >> 1)); return; }
    R(x, PAL.roadLo, px, py, w, h);
    R(x, PAL.roadLo, px + 1, py + 1, w - 2, h - 2);
    R(x, PAL.walk, px + 1, py + 1, w - 2, 1);
    R(x, shade(PAL.road, -0.16), px + 2, py + 2, w - 4, h - 4);
  },

  station(x, px, py, h, key, list) {
    const w = this.CELL_W, baked = this.wells[key];
    if (baked) { x.drawImage(baked, px + ((w - baked.width) >> 1), py + ((h - baked.height) >> 1)); return; }
    R(x, PAL.roadLo, px, py, w, h);
    R(x, PAL.road, px + 2, py + 2, w - 4, h - 4);
    list.forEach((b, i) => {
      if (!b) return;
      const [m, hi, lo] = this.ING[b.key] || ['#ccc', '#eee', '#999'];
      const zh = h / list.length;
      this.blob(x, px + w / 2, py + zh * (i + 1) - 4, 30, Math.min(12, zh - 6), m, hi, lo);
    });
  },

  blob(x, cx, by, w, h, mid, hi, lo) {
    const hw = w / 2;
    for (let r = 0; r < h; r++) {
      const t = r / Math.max(1, h - 1);
      const half = Math.round(hw * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t) * 0.86)));
      if (half < 1) continue;
      const y = by - h + 1 + r;
      R(x, PAL.ink, cx - half - 1, y, half * 2 + 2, 1);
      R(x, r < 2 ? hi : r > h - 3 ? lo : mid, cx - half, y, half * 2, 1);
    }
  },

  /* bone-free and fill-free: a frame at every corner, so it survives sitting
     over any colour of food (reference: "shape, not colour") */
  cursor(x, px, py, w, h) {
    R(x, PAL.ink, px - 2, py - 2, w + 4, 2); R(x, PAL.ink, px - 2, py + h, w + 4, 2);
    R(x, PAL.ink, px - 2, py - 2, 2, h + 4); R(x, PAL.ink, px + w, py - 2, 2, h + 4);
    x.strokeStyle = PAL.amber; x.lineWidth = 1;
    x.strokeRect(px - 1.5, py - 1.5, w + 3, h + 3);
    const k = Math.min(7, (h >> 1));
    for (const [cx, cy, dx, dy] of [[px - 2, py - 2, 1, 1], [px + w + 1, py - 2, -1, 1],
      [px - 2, py + h + 1, 1, -1], [px + w + 1, py + h + 1, -1, -1]]) {
      R(x, PAL.amber, cx - (dx < 0 ? k - 1 : 0), cy, k, 2);
      R(x, PAL.amber, cx, cy - (dy < 0 ? k - 1 : 0), 2, k);
    }
  },

  /* ---------------- BUILD PROGRESS --------------------------------- */
  drawPrep(x, G) {
    const t = this.focus(), it = this.item();
    const BX = this.BX, BW = this.BW;

    /* the item on the board: one frame of an item x stage sequence */
    if (t) {
      const shown = it || t.items[t.items.length - 1];
      const pic = this.pic(shown.def, it ? shown.step : shown.def.recipe.length, !it);
      x.drawImage(pic, BX + ((BW - pic.width) >> 1), 171 + ((VH - 174 - pic.height) >> 1));
      /* what this ticket has already produced, along the board's left edge */
      let wx = BX + 4;
      for (const w of t.items) if (w.wrapped) {
        R(x, PAL.ink, wx, 175, 11, 8); R(x, PAL.bone, wx + 1, 176, 9, 6);
        R(x, PAL.boneDim, wx + 1, 180, 9, 2); R(x, PAL.jade, wx + 4, 177, 3, 2);
        wx += 13;
      }
    }

    textOut(x, 'NOW BUILDING', 6, 172, PAL.boneDim, 1);
    if (!t) {
      textOut(x, 'WAITING', 6, 182, shade(PAL.bone, -0.3), 2);
      textOut(x, 'NO TICKETS UP', 6, 200, PAL.boneDim, 1);
    } else if (!it) {
      textOut(x, 'SEND IT', 6, 182, PAL.amber, 2);
      const tx = this.afterTicket(x, t);
      textOut(x, 'ALL BAGGED', tx, 200, PAL.boneDim, 1);
    } else {
      const name = it.def.short || it.def.name;
      textOut(x, name, 6, 182, PAL.bone, 2);
      const tx = this.afterTicket(x, t);
      const idx = t.items.indexOf(it) + 1, lab = 'ITEM ' + idx + '/' + t.items.length;
      textOut(x, lab, tx, 200, PAL.boneDim, 1);
      this.star(x, tx + textW(lab, 1) + 4, 200, it.clean ? PAL.bone : this.STAR_LOST, PAL.ink);
      /* pips right of the name, derived from its width -- build.mjs holds
         every Short name to 12*chars + 9*steps <= 127 so they clear the board */
      const lx = 6 + textW(name, 2) + 7, cy = 182 + 7 - (this.PIP_W >> 1);
      it.def.recipe.forEach((k, i) => {
        const px = lx + i * (this.PIP_W + this.PIP_G), w = this.PIP_W;
        if (i < it.step) {
          const col = (this.ING[k] || ['#ccc'])[0];
          R(x, PAL.ink, px, cy, w, w); R(x, col, px + 1, cy + 1, w - 2, w - 2);
          R(x, shade(col, 0.28), px + 1, cy + 1, w - 2, 1);
          R(x, shade(col, -0.32), px + 1, cy + w - 3, w - 2, 2);
        } else {
          R(x, '#2c2338', px, cy, w, w);
          x.strokeStyle = '#4a4058'; x.lineWidth = 1; x.strokeRect(px + 0.5, cy + 0.5, w - 1, w - 1);
        }
      });
    }

    /* WRAP IT! / SEND IT! -- one button, labelled with whichever comes next */
    const ready = it ? it.step >= it.def.recipe.length : !!t;
    this.button_(x, this.BTN[0], this.BTN[1], this.BTN[2], this.BTN[3], it || !t ? ['WRAP', 'IT!'] : ['SEND', 'IT!'], ready, G);
  },

  button_(x, px, py, w, h, lines, ready, G) {
    const lit = ready && (G.time * 4 | 0) % 2 === 0;
    const STEEL = PAL.walkLo;
    R(x, PAL.ink, px, py, w, h);
    R(x, shade(STEEL, lit ? -0.08 : -0.24), px + 1, py + 1, w - 2, h - 2);
    R(x, shade(STEEL, -0.10), px + 1, py + 1, w - 2, 1);
    R(x, shade(STEEL, -0.42), px + 1, py + h - 2, w - 2, 1);
    const col = ready ? PAL.amber : '#7a6a4a';
    x.strokeStyle = col; x.lineWidth = 1;
    x.strokeRect(px + 2.5, py + 2.5, w - 5, h - 5);
    const k = 7;
    for (const [bx, by, dx, dy] of [[px + 2, py + 2, 1, 1], [px + w - 4, py + 2, -1, 1],
      [px + 2, py + h - 4, 1, -1], [px + w - 4, py + h - 4, -1, -1]]) {
      R(x, col, bx - (dx < 0 ? k - 2 : 0), by, k, 2);
      R(x, col, bx, by - (dy < 0 ? k - 2 : 0), 2, k);
    }
    textOut(x, lines[0], px + w / 2, py + 11, col, 2, 1);
    textOut(x, lines[1], px + w / 2, py + 26, col, 2, 1);
  },

  /* The driving shift's own clock card, third row STARS (GDD IV.F.1), and a
     fourth: SERVED against the target, with the streak. In the driving half
     those two sit under the card on the road; here that spot is the service
     window, where the customer being served stands, so they move inside. */
  drawCard(x, G) {
    const pw = 128, px0 = VW - pw + 1, ph = 54;
    R(x, 'rgba(10,6,16,0.50)', VW - pw - 1, 6, pw, ph);
    Hud.panel(x, VW - pw - 3, 3, pw, ph, '#6b5f84');
    text(x, 'SERVED', px0, 47, PAL.boneDim, 1);
    text(x, G.done + '/' + G.diff.target, VW - 7, 47, PAL.bone, 1, 2);
    if (G.combo > 1.001) text(x, 'X' + G.combo.toFixed(2), px0 + 44, 47, G.comboPop > 0 ? PAL.bone : PAL.amber, 1);
    text(x, 'SHIFT', px0, 8, PAL.boneDim, 1);
    const low = G.shift < 20;
    text(x, clockStr(G.shift), VW - 7, 5, low && (G.time * 4 | 0) % 2 ? PAL.bad : PAL.bone, 2, 2);
    text(x, 'PAID', px0, 23, PAL.boneDim, 1);
    text(x, money(G.earned), VW - 7, 20, PAL.good, 2, 2);
    text(x, 'STARS', px0, 37, PAL.boneDim, 1);
    const n = String(G.levelStars), nx = VW - 7 - textW(n, 1);
    this.star(x, nx - 10, 37, PAL.bone);
    text(x, n, VW - 7, 37, PAL.bone, 1, 2);
  },

  star(x, sx, sy, col, ink) {
    const S = this.STAR;
    const on = (i, j) => j >= 0 && j < 7 && i >= 0 && i < 7 && S[j][i] === '#';
    if (ink) for (let j = -1; j <= 7; j++) for (let i = -1; i <= 7; i++)
      if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) R(x, ink, sx + i, sy + j, 1, 1);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) if (S[j][i] === '#') R(x, col, sx + i, sy + j, 1, 1);
  },

  /* "TICKET n", and where the next label on that line starts. It used to
     start at a fixed x60, which "TICKET 9" clears and "TICKET 15" does not:
     every kitchen level reaches the teens, and the line read "TICKET 15ALL
     BAGGED". "ITEM 3/3" rather than "ITEM 3 OF 3" so that, with its star, the
     line still ends clear of the board at x137 for any ticket under 1000. */
  afterTicket(x, t) {
    const s = 'TICKET ' + t.n;
    textOut(x, s, 6, 200, PAL.amber, 1);
    return 6 + textW(s, 1) + 6;
  },

  /* ---------------- the item on the board -------------------------- */
  /* One baked frame per recipe prefix (BOARD, from content/board/): after
     tortilla, beef and beans the board shows LARGE-BEEF-BEANS, so a pick always
     changes the picture and a dish at step 2 is visibly not the same dish at
     step 4. The finished picture is BOARD_FINISH[name] when the dish changes
     shape on wrapping (a roll, a folded soft taco), and otherwise its last
     build frame. build.mjs refuses a menu with a frame missing, so a gap here
     means content failed to load, and the board is left empty rather than the
     kitchen taken down. Cached by item x stage: it only changes when a pip
     does. The art came from the art-direction pass of 2026-11-07; the frames,
     the review renders and the reasoning are in reference/kitchen/. */
  pic(def, step, done) {
    const ck = def.name + '|' + step + '|' + (done ? 1 : 0);
    if (this.picCache[ck]) return this.picCache[ck];
    const t = mkCanvas(64, 42);
    /* step 0 draws nothing: an empty board says "pick a base" better than text */
    if (step > 0) {
      const img = this.frame(this.frameKey(def, step, done));
      if (img) t.x.drawImage(img, (64 - img.width) >> 1, (42 - img.height) >> 1);
    }
    return (this.picCache[ck] = t.c);
  },

  /* LARGE-BEEF-BEANS after three picks; the finish when wrapped */
  frameKey(def, step, done) {
    const fin = done && typeof BOARD_FINISH !== 'undefined' && BOARD_FINISH[def.name];
    return fin || def.recipe.slice(0, step).join('-');
  },

  /* decoded on first use: a shift only ever shows its own menu's frames */
  frame(key) {
    if (!this.frames) this.frames = Object.create(null);
    if (!(key in this.frames))
      this.frames[key] = typeof BOARD !== 'undefined' && BOARD[key] ? Faces.decode(BOARD[key]) : null;
    return this.frames[key];
  },
};
