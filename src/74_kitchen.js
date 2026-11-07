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
  TICKET_W: 78,
  RAIL_MAX: 3, QUEUE_MAX: 3,
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
  buzzT: 0, barkT: 0, complained: false,
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
    this.diff = diff.kitchen;
    this.demo = !!demo;
    this.menu = (typeof MENUS !== 'undefined' && MENUS[this.era]) || this.fallbackMenu();
    this.bins = this.menu.bins.map((b) => this.norm(b));
    this.left = (this.menu.bases && this.menu.bases.left || ['SMALL', 'SHELL', 'LARGE']).map((b) => this.norm(b));
    this.right = (this.menu.bases && this.menu.bases.right || ['CHIPS']).map((b) => this.norm(b));
    this.tickets = []; this.queue = []; this.walkers = []; this.pops = [];
    this.cur = { c: 3, r: 0, z: 0 };
    this.arriveT = 1.5;                   // the first ticket arrives almost at once
    this.docket = 0;
    this.flashKey = null; this.flashT = 0; this.wrongKey = null; this.hintT = 0;
    this.buzzT = 0; this.barkT = 0; this.complained = false;
    this.stats = { served: 0, walkouts: 0, items: 0, clean: 0, mistakes: 0, best: 0 };
    this.bot = { t: 0.6, slip: null };
    if (!this.wells) this.buildWells();
    this.picCache = Object.create(null);
    this.bg = this.buildBg();
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
      if (!this.complained) { this.complained = true; this.bark(G, 'queue', t, true); }
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
    const casts = this.castFor(this.era);
    return {
      i: (Math.random() * Art.ped.length) | 0,
      face: casts[(Math.random() * casts.length) | 0],
      x: VW + 4, y: 92, dir: 3, f: 0, ft: 0, leaving: 0,
    };
  },

  castFor(era) {
    const pre = 'c' + (era === 1 ? 7 : era === 2 ? 8 : 9);
    const out = [];
    if (typeof FACES !== 'undefined') for (const k in FACES) if (k.startsWith(pre)) out.push(k);
    if (!out.length) out.push(DLG_FACE);
    return out;
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

    if (this.demo) this.botStep(dt, G);
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
    const it = this.item(), c = this.cur;
    const key = this.keyAt(c.c, c.r, c.z);
    if (!it || it.step >= it.def.recipe.length || !key) { this.buzz(); return; }
    const want = it.def.recipe[it.step];
    if (key === want) {
      it.step++;
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
      if (G.diffKey === 'easy') this.hintT = 1.6;     // easy: show the right bin
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
        if (hit.c !== undefined) {
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
    if (mx >= 321 && mx < 380 && my >= 170 && my < 214) return { button: true };
    if (my < ROW_Y[0] || my >= ROW_Y[1] + CELL_H) return null;
    const c = Math.floor((mx - this.COL0) / (CELL_W + 1));
    if (c < 0 || c > 7) return null;
    if (c === 0) {
      const z = clamp(Math.floor((my - ROW_Y[0]) / ((ROW_Y[1] + CELL_H - ROW_Y[0]) / this.left.length)), 0, this.left.length - 1);
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
    const line = G.pickLine(kind);
    if (!line) return;
    this.barkT = 5;
    Dialog.say(DIALOGUE.who || 'CUSTOMER', line, {
      face: t && t.cust ? t.cust.face : DLG_FACE,
      hostile: !!hostile,
      hood: hostile ? 3 : 1,
      sub: t ? 'TICKET ' + t.n + (kind === 'walkout' ? '  -  WALKING OUT' : '') : '',
      meter: t && t.max ? clamp(t.tip / t.max, 0, 1) : null,
      secs: 1.9,
    });
  },

  pop(s, x, y, col) { this.pops.push({ s, x, y, col, t: 0 }); },

  /* ================================================================ */
  /* drawing                                                          */
  /* ================================================================ */

  colX(i) { return this.COL0 + i * (this.CELL_W + 1); },

  /* Everything that never changes during a level, baked once: the back
     wall, the pantry, the dining-room floor and its wall, the steam table
     under the bins, and the prep counter with its board. */
  buildBg() {
    const t = mkCanvas(VW, VH), x = t.x;
    const BRICK_H = PAL.roadHi, MORTAR = PAL.roadLo;
    const STEEL_D = PAL.roadLo, STEEL_X = PAL.road, STEEL = PAL.walkLo, STEEL_M = PAL.walk, STEEL_H = PAL.walkHi;
    const WOOD = PAL.walkLo, WOOD_H = PAL.walk, WOOD_L = shade(PAL.curb, -0.12);

    /* back wall */
    R(x, PAL.road, 0, 0, VW, 108);
    let rng = makeRng(1972);
    for (let by = 0, row = 0; by < 108; by += 7, row++) {
      const off = row % 2 ? -7 : 0;
      for (let bx = off; bx < VW; bx += 15) {
        if (rng.chance(0.28)) R(x, BRICK_H, bx, by, 14, 6);
        else if (rng.chance(0.14)) R(x, MORTAR, bx, by, 14, 6);
      }
      R(x, MORTAR, 0, by + 6, VW, 1);
    }
    for (let i = 0; i < 16; i++) { x.globalAlpha = 0.034 - i * 0.002; R(x, '#cfe0f0', 0, i * 3, VW, 3); }
    x.globalAlpha = 1;

    /* pantry, behind the tickets */
    const shelf = (sy) => {
      R(x, STEEL_X, 4, sy, 244, 3); R(x, STEEL_M, 4, sy, 244, 1);
      for (let i = 12; i < 250; i += 44) R(x, STEEL_X, i, sy + 3, 2, 10);
    };
    const can = (cx, cy, h, col) => {
      R(x, PAL.ink, cx, cy, 9, h); R(x, col, cx + 1, cy + 1, 7, h - 2);
      R(x, shade(col, 0.28), cx + 1, cy + 1, 2, h - 2);
      R(x, PAL.bone, cx + 1, (cy + h / 2 - 2) | 0, 7, 4);
      R(x, shade(col, -0.35), cx + 1, cy + h - 3, 7, 2);
    };
    shelf(72);
    can(207, 60, 12, '#b8442e'); can(218, 58, 14, '#c98a2a');
    shelf(96);
    can(171, 84, 12, PAL.treeLo); can(182, 82, 14, '#c98a2a');
    R(x, PAL.ink, 234, 82, 17, 14); R(x, PAL.boneDim, 235, 83, 15, 12);
    R(x, PAL.bone, 235, 83, 15, 2); R(x, shade(PAL.boneDim, -0.28), 235, 93, 15, 2);
    R(x, PAL.jadeLo, 240, 87, 5, 4);                // the shop's cactus stamp

    /* the rail spans the pass, not the whole kitchen */
    R(x, STEEL_X, 2, 1, 250, 6); R(x, STEEL_H, 2, 1, 250, 1); R(x, STEEL_M, 2, 2, 250, 1);
    R(x, shade(STEEL_X, -0.4), 2, 6, 250, 1);
    for (const bx of [2, 249]) { R(x, STEEL_D, bx, 0, 3, 10); R(x, STEEL_M, bx, 0, 3, 1); }

    /* the dining room, in plan -- the same projection as the driving half */
    const OX = this.OV_X, OW = VW - OX, OH = this.OV_H;
    R(x, shade(PAL.walk, -0.26), OX, 0, OW, OH);
    rng = makeRng(4412);
    for (let ty = 0; ty < OH; ty += 8)
      for (let tx = OX; tx < VW; tx += 8) {
        if (rng.chance(0.42)) R(x, shade(PAL.walk, -0.18), tx, ty, 7, 7);
        R(x, shade(PAL.walk, -0.32), tx, ty, 8, 1);
        R(x, shade(PAL.walk, -0.32), tx, ty, 1, 8);
      }
    R(x, PAL.ink, OX - 1, 0, 2, OH);
    const wy = 48, wh = 11, ox = OX + 47, ow = 40;
    const wall2 = (px, w2) => {
      R(x, PAL.ink, px, wy, w2, wh);
      R(x, shade(PAL.wallMd, -0.30), px, wy + 1, w2, wh - 2);
      R(x, shade(PAL.wallLt, -0.24), px, wy + 1, w2, 2);
      R(x, shade(PAL.wallDk, -0.24), px, wy + wh - 3, w2, 2);
    };
    wall2(OX, ox - OX); wall2(ox + ow, VW - (ox + ow));
    R(x, shade(PAL.ink, 0.05), ox, wy, ow, 4);
    R(x, PAL.ink, ox, wy + 4, ow, 8);
    R(x, STEEL_M, ox, wy + 5, ow, 5); R(x, STEEL_H, ox, wy + 5, ow, 2); R(x, STEEL_X, ox, wy + 10, ow, 2);
    R(x, 'rgba(12,8,20,0.30)', ox, wy + 12, ow, 4);
    for (const jx of [ox - 5, ox + ow]) {
      R(x, PAL.ink, jx, wy + wh, 5, 16);
      R(x, shade(PAL.wallMd, -0.34), jx + 1, wy + wh, 3, 15);
      R(x, shade(PAL.wallLt, -0.30), jx + 1, wy + wh, 1, 15);
      R(x, 'rgba(12,8,20,0.34)', jx + 4, wy + wh, 3, 15);
    }
    /* the door customers come in by, bottom right */
    R(x, shade(PAL.walk, -0.40), VW - 12, 80, 12, 24);
    R(x, shade(PAL.walk, -0.12), VW - 12, 80, 1, 24);

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
    rng = makeRng(88);
    for (let i = 0; i < 70; i++) {
      const gy = 174 + rng.int(VH - 183), gx = BX + 2 + rng.int(BW - 14);
      const gw = Math.min(6 + rng.int(22), BX + BW - 2 - gx);
      R(x, rng.chance(0.5) ? shade(PAL.dirt, -0.13) : shade(PAL.dirt, 0.09), gx, gy, gw, 1);
    }
    x.globalAlpha = 0.20; R(x, PAL.ink, 0, VH - 7, VW, 7); x.globalAlpha = 1;
    return t.c;
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
      if (G.winter) { R(x, PAL.bone, dx + 3, dy, 4, 1); }   // snow on the hat, winter
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
    if (this.hintT > 0 && want && (G.time * 5 | 0) % 2) this.plate(x, want, PAL.amber, 1);

    const r = this.cellRect(this.cur.c, this.cur.r, this.cur.z);
    this.cursor(x, r[0], r[1], r[2], r[3]);
  },

  cellRect(c, r, z) {
    const { CELL_W, CELL_H, ROW_Y } = this;
    const SH = ROW_Y[1] + CELL_H - ROW_Y[0];
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
    const [px, py, w] = this.cellRect(cell.c, cell.r, cell.z);
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
      textOut(x, 'TICKET ' + t.n, 6, 200, PAL.amber, 1);
      textOut(x, 'ALL BAGGED', 60, 200, PAL.boneDim, 1);
    } else {
      const name = it.def.short || it.def.name;
      textOut(x, name, 6, 182, PAL.bone, 2);
      textOut(x, 'TICKET ' + t.n, 6, 200, PAL.amber, 1);
      const idx = t.items.indexOf(it) + 1, lab = 'ITEM ' + idx + ' OF ' + t.items.length;
      textOut(x, lab, 60, 200, PAL.boneDim, 1);
      this.star(x, 60 + textW(lab, 1) + 4, 200, it.clean ? PAL.bone : this.STAR_LOST, PAL.ink);
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
    this.button_(x, 321, 170, 59, VH - 172, it || !t ? ['WRAP', 'IT!'] : ['SEND', 'IT!'], ready, G);
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
