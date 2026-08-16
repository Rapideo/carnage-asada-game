/* ============================================================
   TACO SHOP: CARNAGE ASADA  --  game loop, shift structure, render pipeline
   ============================================================ */
'use strict';

const SHIFT_START  = 110;
const TIME_PER_JOB = 9;
const TIME_PERFECT = 3;
const TIP_MAX = 1500, TIP_FLOOR = 200, TIP_DECAY = 55;
const PERFECT_BONUS = 500;
const REMAKE_FEE = 150, PED_FINE = 200, TICKET = 1500;
const HEAT_MAX = 100;
const BAG_MAX = 3;
const THROW_CD = 0.34;

const G = {
  state: 'boot', time: 0, shift: 0, earned: 0,
  combo: 1, comboPop: 0, heat: 0, heatMax: HEAT_MAX,
  bag: BAG_MAX, bagMax: BAG_MAX, needPickup: false,
  player: null, traffic: [], peds: [], flying: [], cop: null, copT: 0,
  cam: { x: 0, y: 0 }, shake: 0, hitstop: 0,
  order: null, banner: '', bannerT: 0, bannerCol: PAL.bone,
  throwCd: 0, restock: 0, tipPop: 0, infraction: 0,
  stats: null, titleCam: 0, paused: false, flash: 0,
  rl: [],

  /* ---------------- setup ------------------------------- */
  boot(seed) {
    const rng = makeRng(seed);
    Art.build(makeRng(seed ^ 0x5eed));
    City.gen(rng);
    Hud.buildMap();
    this.toTitle();
  },

  toTitle() {
    this.state = 'title';
    this.titleCam = 0;
    this.player = new Player(City.shop.dock.x, City.shop.dock.y + 70, -PI / 2);
    this.traffic.length = 0; this.peds.length = 0; this.flying.length = 0;
    this.cop = null; Nav.clear(); Fx.clear();
    this.cam.x = clamp(City.shop.x - VW / 2, 0, WW - VW);
    this.cam.y = clamp(City.shop.y - VH / 2, 0, WH - VH);
    this.seedTraffic(26); this.seedPeds(20);
  },

  startShift() {
    this.state = 'play';
    this.time = 0; this.shift = SHIFT_START; this.earned = 0;
    this.combo = 1; this.comboPop = 0; this.heat = 0;
    this.bag = BAG_MAX; this.needPickup = false;
    this.cop = null; this.copT = 0; this.shake = 0; this.hitstop = 0;
    this.throwCd = 0; this.restock = 0; this.infraction = 0;
    this.stats = { delivered: 0, perfect: 0, splat: 0, best: 0, peds: 0, tickets: 0 };
    this.flying.length = 0; Fx.clear();
    const d = City.shop.dock;
    this.player = new Player(d.x, d.y + 40, PI / 2);
    this.cam.x = clamp(d.x - VW / 2, 0, WW - VW);
    this.cam.y = clamp(d.y - VH / 2, 0, WH - VH);
    this.traffic.length = 0; this.peds.length = 0;
    this.seedTraffic(30); this.seedPeds(24);
    this.newOrder();
    this.say('CLOCK IN!', PAL.amber);
    Audio5.sfx('start');
  },

  /* ---------------- orders ------------------------------- */
  newOrder() {
    const p = this.player;
    let best = null, bestScore = -1;
    for (let i = 0; i < 90; i++) {
      const h = City.houses[(Math.random() * City.houses.length) | 0];
      if (this.order && this.order.house === h) continue;
      const d = hyp(h.cx - p.x, h.cy - p.y);
      if (d < 230 || d > 980) continue;
      const s = Math.random();
      if (s > bestScore) { bestScore = s; best = h; }
    }
    if (!best) best = City.houses[(Math.random() * City.houses.length) | 0];
    this.order = {
      house: best, label: best.addr,
      tip: TIP_MAX, max: TIP_MAX, floor: TIP_FLOOR, decay: TIP_DECAY,
    };
    this.syncNav();
    Fx.pop(p.x, p.y - 22, 'NEW ORDER', PAL.amber);
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
    if (Input.hasMouse) { ax = this.cam.x + Input.mx; ay = this.cam.y + Input.my; }
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
    // accuracy falls off with speed — slowing down is the skill, not a chore
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

  complete(perfect, z) {
    const o = this.order;
    const base = Math.round(o.tip) + (perfect ? PERFECT_BONUS : 0);
    const paid = Math.round(base * this.combo);
    this.earned += paid;
    this.shift += TIME_PER_JOB + (perfect ? TIME_PERFECT : 0);
    this.stats.delivered++;
    if (perfect) this.stats.perfect++;
    this.stats.best = Math.max(this.stats.best, paid);
    this.combo = Math.min(3, this.combo + 0.25);
    this.comboPop = 0.4;

    Fx.cash(z.x, z.y);
    Fx.pop(z.x, z.y - 10, money(paid), PAL.good, true);
    if (perfect) Fx.pop(z.x, z.y - 26, 'ON THE DOORSTEP! +' + money(PERFECT_BONUS), PAL.amber);
    Fx.pop(z.x, z.y - 40, '+' + (TIME_PER_JOB + (perfect ? TIME_PERFECT : 0)) + 'S', PAL.cyan);
    this.say(perfect ? 'PERFECT TOSS!' : 'DELIVERED!', perfect ? PAL.amber : PAL.good);
    Audio5.sfx(perfect ? 'perfect' : 'deliver');
    Audio5.sfx('cash');
    this.flash = 0.14;

    this.order = null;
    if (this.bag > 0) this.newOrder();
    else { this.needPickup = true; this.syncNav(); }
  },

  miss(z, wrong) {
    Fx.splat(z.x, z.y);
    Fx.spill(z.x, z.y);
    Audio5.sfx('splat');
    this.stats.splat++;
    this.earned = Math.max(0, this.earned - REMAKE_FEE);
    this.combo = 1;
    if (wrong && this.order && wrong !== this.order.house) {
      Fx.pop(z.x, z.y - 10, 'WRONG HOUSE! ' + wrong.num, PAL.bad);
      this.say('THAT IS NOT ' + (this.order ? this.order.house.num : ''), PAL.bad);
    } else {
      Fx.pop(z.x, z.y - 10, 'SPLAT! -' + money(REMAKE_FEE), PAL.bad);
      this.say('SPLAT!', PAL.bad);
    }
    if (this.bag === 0 && this.order) { this.needPickup = true; this.syncNav(); }
  },

  onCrash() { this.bumpHeat(7); },

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
    for (let i = 0; i < 30 && City.isSolid(x, y); i++) { x = clamp(p.x + rand(-260, 260), 40, WW - 40); y = clamp(p.y + rand(-260, 260), 40, WH - 40); }
    this.cop = new Cop(x, y, Math.atan2(p.y - y, p.x - x));
    this.copT = 26;
    this.say("HAYS PD! LOSE 'EM!", PAL.bad);
    Audio5.sirenOn();
  },
  dropCop() { this.cop = null; this.heat = Math.min(this.heat, 45); Audio5.sirenOff(); },

  /* ---------------- update ------------------------------- */
  update(dt) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);

    if (this.state === 'title') {
      this.titleCam += dt * 26;
      const r = 300;
      this.cam.x = clamp(City.shop.x - VW / 2 + Math.cos(this.titleCam / 62) * r, 0, WW - VW);
      this.cam.y = clamp(City.shop.y - VH / 2 + Math.sin(this.titleCam / 41) * r * 0.7, 0, WH - VH);
      this.player.x = this.cam.x + VW / 2; this.player.y = this.cam.y + VH / 2;
      this.simCrowd(dt);
      if (Input.p('Enter', 'NumpadEnter', 'Space')) { Audio5.sfx('select'); this.startShift(); }
      return;
    }

    if (this.state === 'results') {
      this.simCrowd(dt);
      if (Input.p('Enter', 'NumpadEnter', 'KeyR')) { Audio5.sfx('select'); this.startShift(); }
      if (Input.p('Escape')) this.toTitle();
      return;
    }

    /* ---- play ---- */
    if (Input.p('Escape', 'KeyP')) this.paused = !this.paused;
    if (this.paused) return;

    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.15; }

    const wasSec = Math.ceil(this.shift);
    this.shift -= dt;
    if (this.shift > 0 && this.shift < 6 && Math.ceil(this.shift) !== wasSec) Audio5.sfx('tick');
    if (this.shift <= 0) { this.endShift(); return; }

    this.bannerT -= dt;
    this.comboPop = Math.max(0, this.comboPop - dt);
    this.tipPop = Math.max(0, this.tipPop - dt);
    this.throwCd -= dt;
    this.infraction = Math.max(0, this.infraction - dt);

    /* tip decay */
    if (this.order) {
      const before = this.order.tip;
      this.order.tip = Math.max(this.order.floor, this.order.tip - this.order.decay * dt);
      if (((before / 25) | 0) !== ((this.order.tip / 25) | 0)) this.tipPop = 0.07;
    }

    /* player */
    const p = this.player;
    p.control(Input);
    p.update(dt, this);

    if (Input.mhit || Input.p('Space')) this.tryThrow();

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
      /* player vs traffic */
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
        const nx2 = (p.x - c.x) / (d || 1), ny2 = (p.y - c.y) / (d || 1);
        p.x += nx2 * 2; p.y += ny2 * 2;
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
        this.earned = Math.max(0, this.earned - PED_FINE);
        this.stats.peds++;
        this.combo = 1;
        this.bumpHeat(34);
        Fx.star(q.x, q.y - 8);
        Fx.pop(q.x, q.y - 18, 'OW! -' + money(PED_FINE), PAL.bad);
        this.shake = 5; this.hitstop = 0.05;
        Audio5.sfx('ped');
      }
    }
    while (this.peds.length < 24) this.spawnPed();

    /* cop */
    if (this.cop) {
      this.cop.update(dt, this);
      this.copT -= dt;
      const d = hyp(this.cop.x - p.x, this.cop.y - p.y);
      Audio5.sirenSet(clamp(1 - d / 420, 0, 1));
      if (d < 16 && this.cop.hitCd <= 0) {
        this.cop.hitCd = 3;
        this.earned = Math.max(0, this.earned - TICKET);
        this.stats.tickets++;
        this.combo = 1;
        p.spinOut(1);
        this.shake = 9; this.hitstop = 0.1;
        Fx.pop(p.x, p.y - 22, 'TICKET! -' + money(TICKET), PAL.bad, true);
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
      if (z.dead) { this.flying.splice(i, 1); this.onLand(z); }
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

    /* camera */
    const lead = 46;
    const tx = p.x + clamp(p.vx / MAXSPD, -1, 1) * lead - VW / 2;
    const ty = p.y + clamp(p.vy / MAXSPD, -1, 1) * lead - VH / 2;
    const k = 1 - Math.exp(-7 * dt);
    this.cam.x = clamp(this.cam.x + (tx - this.cam.x) * k, 0, WW - VW);
    this.cam.y = clamp(this.cam.y + (ty - this.cam.y) * k, 0, WH - VH);
    this.shake = Math.max(0, this.shake - dt * 22);
  },

  simCrowd(dt) {
    for (const c of this.traffic) c.update(dt, this);
    for (const q of this.peds) q.update(dt, this);
    Fx.update(dt);
  },

  endShift() {
    this.state = 'results';
    this.shift = 0;
    Audio5.engineOff(); Audio5.sirenOff();
    this.cop = null;
    Nav.clear();
    Audio5.sfx('over');
  },

  rank() {
    const e = this.earned;
    return e < 4000 ? 'TRAINEE' : e < 9000 ? 'DRIVER' : e < 15000 ? 'ACE' : e < 23000 ? 'SALSA BARON' : 'LEGEND OF THE ASADA';
  },

  /* ---------------- render ------------------------------- */
  render(x) {
    const sh = this.shake;
    const cx = Math.round(this.cam.x + (sh > 0 ? rand(-sh, sh) : 0));
    const cy = Math.round(this.cam.y + (sh > 0 ? rand(-sh, sh) : 0));
    const cam = { x: cx, y: cy };

    x.fillStyle = PAL.void; x.fillRect(0, 0, VW, VH);
    x.drawImage(City.ground, cx, cy, VW, VH, 0, 0, VW, VH);

    if (this.state === 'play' || this.state === 'results') Nav.drawRoute(x, cam, this.time);
    if (this.state === 'play') this.drawBeacon(x, cam);

    /* ---- y-sorted sprite pass ---- */
    const rl = this.rl; rl.length = 0;
    City.collect(cx - 140, cy - 150, cx + VW + 140, cy + VH + 150, rl);
    if (this.state !== 'title') rl.push({ sortY: this.player.y, e: this.player });
    for (const c of this.traffic) if (this.nearScreen(c.x, c.y)) rl.push({ sortY: c.y, e: c });
    for (const q of this.peds)    if (this.nearScreen(q.x, q.y)) rl.push({ sortY: q.y, e: q });
    if (this.cop) rl.push({ sortY: this.cop.y, e: this.cop });
    for (const z of this.flying) rl.push({ sortY: z.y, e: z });
    rl.sort((a, b) => a.sortY - b.sortY);
    for (const it of rl) {
      if (it.e) it.e.draw(x, cam);
      else x.drawImage(it.img, it.x - cx, it.y - it.oy - cy);
    }

    Fx.draw(x, cam);

    if (this.state === 'play') {
      this.drawAim(x, cam);
      Hud.draw(x, this);
      if (this.restock > 0) this.drawRestock(x, cam);
      if (this.paused) this.overlayPause(x);
    }
    if (this.state === 'title')   this.overlayTitle(x);
    if (this.state === 'results') this.overlayResults(x);

    if (this.flash > 0) {
      x.globalAlpha = this.flash * 2.4;
      x.fillStyle = '#ffffff'; x.fillRect(0, 0, VW, VH);
      x.globalAlpha = 1;
    }
    Post.apply(x);
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

    /* target lock test */
    let lock = false;
    if (this.order && !this.needPickup) {
      const r = this.order.house.porch;
      lock = a.x > r.x && a.x < r.x + r.w && a.y > r.y && a.y < r.y + r.h;
    }
    const col = lock ? PAL.good : PAL.bone;

    /* arc of dots */
    for (let i = 1; i <= 7; i++) {
      const t = i / 8;
      const px = lerp(sx0, sx1, t), py = lerp(sy0, sy1, t);
      const z = Z0 + (0 - Z0 + 0.5 * GRAV * THROW_T * THROW_T) / THROW_T * (t * THROW_T) - 0.5 * GRAV * (t * THROW_T) ** 2;
      x.globalAlpha = 0.18 + t * 0.32;
      x.fillStyle = col;
      x.fillRect(px | 0, (py - z) | 0, 2, 2);
    }
    x.globalAlpha = 1;

    /* reticle */
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

  drawRestock(x, cam) {
    const p = this.player;
    const sx = (p.x - cam.x) | 0, sy = ((p.y - cam.y) | 0) - 26;
    R(x, PAL.ink, sx - 21, sy - 4, 42, 11);
    text(x, 'LOADING', sx, sy - 2, PAL.amber, 1, 1);
    R(x, '#2c2338', sx - 18, sy + 5, 36, 3);
    R(x, PAL.amber, sx - 18, sy + 5, Math.round(36 * clamp(this.restock, 0, 1)), 3);
  },

  /* ---------------- overlays ----------------------------- */
  overlayTitle(x) {
    x.fillStyle = 'rgba(20,12,28,0.62)'; x.fillRect(0, 0, VW, VH);
    const t = this.time;
    // badge and sprayed wordmark, both baked once at boot. Controls are not
    // listed here by design — they live in the pause overlay.
    x.drawImage(Art.badge, ((VW - Art.badge.width) / 2) | 0, 14);
    x.drawImage(Art.wordmark.c, ((VW - Art.wordmark.w) / 2) | 0, 130);

    if ((t * 2 | 0) % 2) text(x, 'PRESS ENTER TO CLOCK IN', VW / 2, 180, PAL.amber, 2, 1);
  },

  overlayResults(x) {
    x.fillStyle = 'rgba(20,12,28,0.78)'; x.fillRect(0, 0, VW, VH);
    const s = this.stats || { delivered: 0, perfect: 0, splat: 0, best: 0, peds: 0, tickets: 0 };
    const w = 250, h = 154, px = (VW - w) / 2 | 0, py = 24;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'SHIFT OVER', VW / 2, py + 10, PAL.red, 3, 1);
    R(x, PAL.red, px + 16, py + 34, w - 32, 1);

    const rows = [
      ['DELIVERED', s.delivered + ''],
      ['PERFECT TOSSES', s.perfect + ''],
      ['ORDERS DROPPED', s.splat + ''],
      ['PEDESTRIANS CLIPPED', s.peds + ''],
      ['TICKETS', s.tickets + ''],
      ['BEST SINGLE TIP', money(s.best)],
    ];
    rows.forEach((r, i) => {
      const y = py + 42 + i * 11;
      text(x, r[0], px + 16, y, PAL.boneDim, 1);
      text(x, r[1], px + w - 16, y, PAL.bone, 1, 2);
    });

    R(x, '#3a2c48', px + 16, py + 112, w - 32, 1);
    text(x, 'TAKE HOME', px + 16, py + 118, PAL.boneDim, 1);
    text(x, money(this.earned), px + w - 16, py + 116, PAL.good, 2, 2);
    text(x, this.rank(), VW / 2, py + 134, PAL.amber, 2, 1);

    if ((this.time * 2 | 0) % 2) text(x, 'ENTER - RUN IT BACK', VW / 2, VH - 22, PAL.bone, 1, 1);
    text(x, 'ESC - TITLE', VW / 2, VH - 11, '#6b5f84', 1, 1);
  },

  /* The page frame used to carry a key legend under the canvas. It doesn't
     any more, so this overlay is the only place the controls are written
     down — keep them here. */
  overlayPause(x) {
    x.fillStyle = 'rgba(20,12,28,0.88)'; x.fillRect(0, 0, VW, VH);
    // solid card, like the results screen: six rows of text over the live
    // HUD is unreadable on a dim wash alone
    const w = 222, h = 132, px = (VW - w) / 2 | 0, py = 30;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'PAUSED', VW / 2, py + 10, PAL.amber, 3, 1);
    R(x, PAL.red, px + 16, py + 34, w - 32, 1);

    // keys right-aligned to x=198, actions left from x=210: widest pair is
    // 107px + 83px, so the block spans 91..293 inside a card at 81..303
    const rows = [
      ['W A S D  /  ARROWS', 'DRIVE'],
      ['SHIFT', 'HANDBRAKE'],
      ['MOUSE', 'AIM THE TOSS'],
      ['CLICK  /  SPACE', 'THROW THE BAG'],
      ['M  /  N', 'MUTE  /  MUSIC'],
      ['P  /  ESC', 'PAUSE'],
    ];
    rows.forEach((r, i) => {
      const y = py + 46 + i * 13;
      text(x, r[0], 198, y, PAL.bone, 1, 2);
      text(x, r[1], 210, y, PAL.boneDim, 1);
    });

    // just under the card, not at VH-20: that lands on the nav panel
    text(x, 'P OR ESC TO RESUME', VW / 2, py + h + 7, PAL.cyan, 1, 1);
  },
};

/* ---------------- CRT-ish post ----------------------------- */
const Post = {
  lines: null, vig: null,
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
  apply(x) {
    if (!this.lines) this.build();
    x.drawImage(this.lines, 0, 0);
    x.drawImage(this.vig, 0, 0);
  },
};
