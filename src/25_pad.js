/* ============================================================
   PAD  --  arcade stick (Mode B) and touch (Mode C) controls
   ============================================================ */
'use strict';

/* Pad turns a gamepad, and on a phone the screen itself, into the key codes the
   game already reads. Nothing downstream learns a second input path: the
   driving model still asks Input for KeyW and ArrowLeft, the menus still ask
   for Enter, and the kitchen still reads Input.mx/my/mhit.

   Three rules hold the whole thing together:

   - Pad only ever clears a code it set itself, and never one the real keyboard
     is still holding. It keeps its own record of the keyboard for that reason:
     Input.down cannot say WHO is holding a key.
   - Everything happens in poll(), once per fixed step, before G.update. Touch
     handlers only queue events; poll() drains them. So a press can never land
     between the step that reads it and the endFrame() that clears it.
   - Anything physically held across a context change is LATCHED and does
     nothing until it is let go. Without that, the Button 3 that serves the
     last ticket would also skip the level-clear card (it is Enter in a menu),
     and the Button 1 that starts a shift would, still held, drive off. */
const Pad = {
  /* ---- public ---- */
  mode: 'A',            // 'A' keyboard + mouse, 'B' arcade stick, 'C' touch
  context: null,        // the context the last poll() ran in
  aiming: false,        // Button 3 / TOSS is held: the stick or finger moves the reticle
  aimX: 0, aimY: 0,     // the reticle, world px relative to the car
  aimHeading: 0,        // the game sets this to player.ang before each poll()
  throwNow: false,      // one-shot: the aim button was let go. Lives for one step.
  touched: false,       // a touch has written Input.mx/my -- the kitchen's hover
  connected: 0,         // gamepads the browser has announced

  /* ---- tuning ---- */
  REPEAT_DELAY: 0.35,   // menu / kitchen auto-repeat: first repeat...
  REPEAT_EVERY: 0.15,   // ...then every
  DRIVE_DZ: 0.25,       // stick deadzone for steering, and the aim's radial deadzone
  AXIS_ON: 0.5,         // stick past this is a direction: menus, and throttle
  AIM_START: 60,        // the reticle starts this far ahead of the car
  AIM_SPEED: 160,       // px/s at full stick
  AIM_MAX: 120,         // and never further than this
  AIM_DRAG: 2.5,        // Mode C: aim px per px the finger drags on TOSS
  SLOP: 7,              // a button takes a touch this far outside its rim
  TRAVEL: 14,           // how far the knob is DRAWN from centre at full stick

  /* ---- Mode C layout, virtual px. The stick sits over the minimap corner;
     the buttons stay inside x300..380 y150..212 and the stick inside
     x4..70 y146..212, so the HUD can be planned around fixed rects. GAS is
     the biggest and nearest the corner because the right thumb rests on it;
     TOSS sits up and in, where that thumb rolls to when it comes off the gas,
     which is also when the car should be coasting -- and high enough to leave
     a finger room to drag DOWN to aim. Each radius is the smallest whose face
     holds its label with a pixel to spare. Green, red, amber: the three
     lamps of the signal at every corner. Colours are PAL keys, looked up
     when the sprites are baked. ---- */
  STICK: { x: 34, y: 178, r: 24 },
  BTN: {
    gas:  { x: 359, y: 190, r: 20, label: 'GAS',  pal: 'good' },
    rev:  { x: 322, y: 198, r: 14, label: 'REV',  pal: 'red' },
    toss: { x: 316, y: 166, r: 16, label: 'TOSS', pal: 'amber' },
  },
  PAUSE: { x: 182, y: 4, w: 20, h: 11 },

  LABELS: {
    B: { drive: 'STICK, 1 GAS, 2 REV', throw: 'HOLD 3, RELEASE', aim: 'HOLD 3 + STICK',
         pause: 'START', select: 'BUTTON 1', wrap: 'BUTTON 2', serve: 'BUTTON 3', mute: 'BACK' },
    C: { drive: 'STICK, GAS, REV', throw: 'HOLD TOSS', aim: 'DRAG TOSS',
         pause: 'TAP PAUSE', select: 'TAP A BIN', wrap: 'TAP WRAP', serve: 'TAP SERVE', mute: '' },
  },

  /* ---- private ---- */
  _held: Object.create(null),    // codes Pad is asserting in Input.down
  _kb: Object.create(null),      // codes the real keyboard is holding
  _latch: Object.create(null),   // physical inputs held through a context change
  _raw: null,                    // this step's gamepad, as read
  _eff: null,                    // ...and after latching
  _prevB3: false,
  _dir: null, _rep: 0,           // menu / kitchen direction and its repeat timer
  _aimSrc: null,                 // 'pad', or the identifier of the TOSS touch
  _aimBase: null,
  _q: [],                        // queued touch events, drained by poll()
  _t: new Map(),                 // live touches by identifier
  _clock: 0,
  _pauseLit: 0,
  _canvas: null,
  _pi: -1,                       // index of the gamepad in use
  _spr: null,                    // baked overlay sprites

  setMode(m) {
    m = m === 'B' || m === 'C' ? m : 'A';
    if (m === this.mode) return;
    this.mode = m;
    this._reset(this.context);
  },

  /** Release every code Pad holds, cancel any aim without throwing, and latch
      whatever is still physically down -- what poll() does on a context
      change, for any other moment the game wants to start clean. */
  reset() { this._reset(this.context); },

  /** The mode to preselect: touch-primary, then a connected pad, then keys.
      A gamepad stays invisible to the page until a button is pressed on it,
      so a mode-select screen should ask again rather than trust boot. */
  detect() {
    const w = typeof window !== 'undefined' ? window : null;
    const mm = (q) => { try { return !!(w && w.matchMedia && w.matchMedia(q).matches); } catch (e) { return false; } };
    const fine = mm('(any-pointer: fine)') || mm('(pointer: fine)');
    if (mm('(pointer: coarse)') || (w && 'ontouchstart' in w && !fine)) return 'C';
    return this._pads().length ? 'B' : 'A';
  },

  init(canvas) {
    this._canvas = canvas || null;
    if (typeof addEventListener === 'function') {
      // the same codes Input.init records, so the two always agree on names
      const codes = (e) => (e.key && e.key.length > 1 && e.key !== e.code) ? [e.code, e.key] : [e.code];
      addEventListener('keydown', (e) => { for (const k of codes(e)) this._kb[k] = true; });
      addEventListener('keyup', (e) => { for (const k of codes(e)) this._kb[k] = false; });
      addEventListener('blur', () => { this._kb = Object.create(null); });
      addEventListener('gamepadconnected', () => { this.connected++; });
      addEventListener('gamepaddisconnected', () => { this.connected = Math.max(0, this.connected - 1); });
    }
    if (!canvas || typeof canvas.addEventListener !== 'function') return;
    // belt and braces with preventDefault: no pan, no pinch, no long-press menu
    if (canvas.style) {
      canvas.style.touchAction = 'none';
      canvas.style.userSelect = canvas.style.webkitUserSelect = 'none';
      canvas.style.webkitTouchCallout = 'none';
    }
    const on = (type, t) => canvas.addEventListener(type, (e) => {
      if (e.cancelable) e.preventDefault();
      const list = e.changedTouches || [];
      for (let i = 0; i < list.length; i++) this._push(t, list[i].identifier, list[i].clientX, list[i].clientY);
    }, { passive: false });
    on('touchstart', 's'); on('touchmove', 'm'); on('touchend', 'e'); on('touchcancel', 'c');
  },

  /** Once per fixed step, before G.update. context: 'menu' | 'kitchen' | 'drive'. */
  poll(context, dt) {
    const ctx = context === 'drive' || context === 'kitchen' ? context : 'menu';
    dt = dt > 0 ? dt : 0;
    this._clock += dt;
    this._pauseLit = Math.max(0, this._pauseLit - dt);
    // a throw the game did not take on the step it was offered is dropped,
    // never deferred -- a toss from before a pause must not land after it
    this.throwNow = false;

    const raw = this._read();
    if (ctx !== this.context) this._reset(ctx);
    const e = this._effective(raw);

    const want = Object.create(null), pulse = [];
    this._drain(ctx, pulse);
    if (ctx === 'drive') this._drive(e, want, dt);
    else this._nav(ctx, e, want, pulse, dt);
    this._apply(want, pulse);
  },

  label(action) {
    const L = this.LABELS[this.mode];
    return (L && L[action]) || '';
  },

  /* ---------------- gamepad ---------------- */
  _pads() {
    try {
      const g = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : null;
      return g ? Array.prototype.filter.call(g, (p) => p && p.connected !== false) : [];
    } catch (e) { return []; }
  },

  _read() {
    const r = this._raw || (this._raw = {});
    r.b1 = r.b2 = r.b3 = r.start = r.back = r.du = r.dd = r.dl = r.dr = false;
    r.sx = r.sy = 0;
    const list = this._pads();
    if (!list.length) return r;
    const btn = (g, i) => {
      const b = g.buttons && g.buttons[i];
      return !!b && (typeof b === 'object' ? (b.pressed || b.value > 0.5) : b > 0.5);
    };
    const any = (g) => { for (let i = 0; g.buttons && i < g.buttons.length; i++) if (btn(g, i)) return true; return false; };
    // Stay on the pad in use; move to whichever has a button down when it has
    // none. A cabinet with a second encoder, or a phantom device with a stuck
    // axis, cannot then take the stick away from the player.
    let g = list.find((p) => p.index === this._pi);
    if (!g || !any(g)) g = list.find(any) || g;
    if (!g) g = list.find((p) => p.mapping === 'standard') || list[0];
    this._pi = g.index;

    const ax = g.axes || [];
    r.sx = clamp(+ax[0] || 0, -1, 1); r.sy = clamp(+ax[1] || 0, -1, 1);
    r.b1 = btn(g, 0); r.b2 = btn(g, 1); r.b3 = btn(g, 2);
    r.back = btn(g, 8); r.start = btn(g, 9);
    // 12-15 are the d-pad only under the standard mapping; on a bare encoder
    // they can be ordinary buttons, and reading them as directions would be wrong
    if (g.mapping === 'standard') { r.du = btn(g, 12); r.dd = btn(g, 13); r.dl = btn(g, 14); r.dr = btn(g, 15); }
    return r;
  },

  _stickOn(r) {
    const dz = this.DRIVE_DZ;
    return r.du || r.dd || r.dl || r.dr || Math.abs(r.sx) > dz || Math.abs(r.sy) > dz;
  },

  _effective(raw) {
    const L = this._latch, e = this._eff || (this._eff = {});
    for (const k of ['b1', 'b2', 'b3', 'start', 'back']) {
      if (L[k] && !raw[k]) L[k] = false;
      e[k] = raw[k] && !L[k];
    }
    if (L.stick && !this._stickOn(raw)) L.stick = false;
    const s = !L.stick;
    e.sx = s ? raw.sx : 0; e.sy = s ? raw.sy : 0;
    e.du = s && raw.du; e.dd = s && raw.dd; e.dl = s && raw.dl; e.dr = s && raw.dr;
    return e;
  },

  _reset(ctx) {
    this.context = ctx;
    const r = this._raw;
    if (r) {
      for (const k of ['b1', 'b2', 'b3', 'start', 'back']) this._latch[k] = r[k];
      this._latch.stick = this._stickOn(r);
    }
    let tap = false;
    for (const t of this._t.values()) { if (t.role === 'tap') tap = true; t.role = 'dead'; }
    if (tap) Input.mdown = false;
    this._prevB3 = false; this._dir = null; this._rep = 0;
    if (this._aimSrc !== null) this._aimEnd(false);   // cancelled, not thrown
    this._apply(Object.create(null), []);              // let go of every code
  },

  /* ---------------- per-context mapping ---------------- */
  _drive(e, want, dt) {
    const DZ = this.DRIVE_DZ, ON = this.AXIS_ON;
    // Button 3: hold to aim, release to throw (GDD III.B.2)
    if (e.b3 && !this._prevB3 && this._aimSrc === null) this._aimStart('pad');
    else if (!e.b3 && this._prevB3 && this._aimSrc === 'pad') this._aimEnd(true);
    this._prevB3 = e.b3;

    if (e.start) want.KeyP = 1;
    if (e.back) want.KeyM = 1;
    if (this._aimSrc === 'pad') {
      // the stick is the reticle now, so nothing reaches the car: it coasts
      let vx = e.sx, vy = e.sy;
      const m = hyp(vx, vy);
      if (m < DZ) vx = vy = 0;
      else { const k = Math.min(1, (m - DZ) / (1 - DZ)) / m; vx *= k; vy *= k; }
      vx += (e.dr ? 1 : 0) - (e.dl ? 1 : 0);
      vy += (e.dd ? 1 : 0) - (e.du ? 1 : 0);
      const n = hyp(vx, vy);
      if (n > 1) { vx /= n; vy /= n; }
      this._aimAt(this.aimX + vx * this.AIM_SPEED * dt, this.aimY + vy * this.AIM_SPEED * dt);
    } else {
      if (e.dl || e.sx < -DZ) want.ArrowLeft = 1;
      if (e.dr || e.sx > DZ) want.ArrowRight = 1;
      if (e.b1 || e.du || e.sy < -ON) want.KeyW = 1;
      if (e.b2 || e.dd || e.sy > ON) want.KeyS = 1;
    }
    if (this.mode !== 'C') return;
    // The on-screen set. Its stick keeps steering while TOSS is held: a thumb
    // is free for it here, where on a cabinet the one stick has to do both.
    const s = this._stick();
    if (s.x < -DZ) want.ArrowLeft = 1;
    if (s.x > DZ) want.ArrowRight = 1;
    if (s.y < -ON) want.KeyW = 1;
    if (s.y > ON) want.KeyS = 1;
    if (this._touching('gas')) want.KeyW = 1;
    if (this._touching('rev')) want.KeyS = 1;
  },

  _nav(ctx, e, want, pulse, dt) {
    // a little hysteresis, so a thumbstick resting on the threshold cannot chatter
    const ON = this.AXIS_ON, d = this._dir;
    const onV = d === 'ArrowUp' || d === 'ArrowDown' ? ON * 0.7 : ON;
    const onH = d === 'ArrowLeft' || d === 'ArrowRight' ? ON * 0.7 : ON;
    let up = e.du || e.sy < -onV, dn = e.dd || e.sy > onV;
    let lf = e.dl || e.sx < -onH, rt = e.dr || e.sx > onH;
    if (up && dn) up = dn = false;
    if (lf && rt) lf = rt = false;
    const v = up ? 'ArrowUp' : dn ? 'ArrowDown' : null;
    const h = lf ? 'ArrowLeft' : rt ? 'ArrowRight' : null;
    // A 4-way stick: a diagonal keeps the axis already moving, else the
    // stronger one, so rolling the stick round a corner never double-steps.
    let dir = v || h;
    if (v && h) dir = d === v || d === h ? d : (Math.abs(e.sx) > Math.abs(e.sy) ? h : v);
    if (dir !== d) { this._dir = dir; this._rep = this.REPEAT_DELAY; }
    else if (dir) {
      this._rep -= dt;
      if (this._rep <= 1e-6) { pulse.push(dir); this._rep += this.REPEAT_EVERY; }
    }
    if (dir) want[dir] = 1;

    if (ctx === 'menu') {
      if (e.b1 || e.b3 || e.start) want.Enter = 1;
      if (e.b2 || e.back) want.Escape = 1;
    } else {
      if (e.b1) want.Space = 1;
      if (e.b2) want.KeyX = 1;
      if (e.b3) want.Enter = 1;
      if (e.start) want.KeyP = 1;
      if (e.back) want.KeyM = 1;
    }
  },

  /* A held code is re-asserted every step, so a keyup on the same key, or the
     blur that wipes Input.down, cannot drop it while the button is still down.
     The hit is set only where a keydown would have set one. */
  _apply(want, pulse) {
    const D = Input.down, H = Input.hit;
    for (const c in want) {
      if (!this._held[c]) {
        if (!D[c]) H[c] = true;
        Input.anyKey = true;
        this._held[c] = true;
      }
      D[c] = true;
    }
    for (const c in this._held) {
      if (want[c]) continue;
      delete this._held[c];
      if (!this._kb[c]) D[c] = false;          // never stomp the real keyboard
    }
    for (const c of pulse) { H[c] = true; Input.anyKey = true; }
  },

  /* ---------------- aim ---------------- */
  _aimStart(src) {
    const h = +this.aimHeading || 0;
    this._aimSrc = src;
    this.aiming = true;
    this.aimX = Math.cos(h) * this.AIM_START;
    this.aimY = Math.sin(h) * this.AIM_START;
    this._aimBase = { x: this.aimX, y: this.aimY };
  },
  _aimAt(ax, ay) {
    const d = hyp(ax, ay), M = this.AIM_MAX;
    if (d > M) { ax *= M / d; ay *= M / d; }
    this.aimX = ax; this.aimY = ay;
  },
  _aimEnd(thrown) {
    if (thrown) this.throwNow = true;    // aimX/aimY stay put for the game to read
    this.aiming = false;
    this._aimSrc = null;
  },

  /* ---------------- touch ---------------- */
  _push(t, id, cx, cy) {
    // exactly Input.init's toVirtual
    const c = this._canvas, r = c && c.getBoundingClientRect ? c.getBoundingClientRect() : null;
    const s = r && r.width ? r.width / VW : 1;
    const x = clamp((cx - (r ? r.left : 0)) / s, 0, VW), y = clamp((cy - (r ? r.top : 0)) / s, 0, VH);
    const q = this._q, last = q[q.length - 1];
    if (t === 'm' && last && last.t === 'm' && last.id === id) { last.x = x; last.y = y; return; }
    q.push({ t, id, x, y });
    if (q.length > 64) q.splice(0, q.length - 64);   // nobody is polling: drop the oldest
  },

  _drain(ctx, pulse) {
    if (!this._q.length) return;
    const q = this._q;
    this._q = [];
    for (const ev of q) {
      if (ev.t === 's') { this._tStart(ctx, ev, pulse); continue; }
      const t = this._t.get(ev.id);
      if (!t) continue;
      t.x = ev.x; t.y = ev.y;
      if (ev.t === 'm') this._tMove(t);
      else { this._t.delete(ev.id); this._tEnd(t, ev.t === 'c'); }
    }
  },

  _tStart(ctx, ev, pulse) {
    const t = { id: ev.id, x: ev.x, y: ev.y, x0: ev.x, y0: ev.y, t0: this._clock, role: 'dead' };
    this._t.set(ev.id, t);
    /* Outside the drive overlay a tap is a click, in every mode: a phone that
       has not been switched to C yet still has to tap its way past the title.
       The kitchen gets Input.mx/my/mhit but NOT hasMouse, which would make
       the driving reticle chase the finger; Pad.touched says they are valid. */
    if (ctx !== 'drive' || this.mode === 'A') {
      t.role = 'tap';
      Input.mx = ev.x; Input.my = ev.y; Input.mhit = true; Input.mdown = true;
      Input.anyKey = true;
      this.touched = true;
      if (ctx === 'menu') pulse.push('Enter');
      if (ctx === 'drive') Input.hasMouse = true;   // Mode A: the finger is the mouse
      return;
    }
    if (this.mode !== 'C') return;                  // Mode B drives on the stick alone
    const hit = this._hitTest(ev.x, ev.y);
    if (hit === 'pause') { pulse.push('KeyP'); this._pauseLit = 0.2; return; }
    if (hit === 'toss' && this._aimSrc !== null) return;
    t.role = hit;
    if (hit === 'toss') this._aimStart(ev.id);
    else if (hit === 'none') {
      // two fingers down together, away from the controls: pause
      for (const o of this._t.values()) {
        if (o !== t && o.role === 'none' && this._clock - o.t0 < 0.3) {
          pulse.push('KeyP'); o.role = t.role = 'dead'; break;
        }
      }
    }
  },

  _tMove(t) {
    if (t.role === 'tap') { Input.mx = t.x; Input.my = t.y; }
    else if (t.role === 'gas' || t.role === 'rev') {
      // a thumb can rock from one pedal to the other without lifting
      const h = this._hitTest(t.x, t.y);
      if (h === 'gas' || h === 'rev') t.role = h;
    } else if (t.role === 'toss' && this._aimSrc === t.id) {
      // relative to where the finger landed, so a plain tap always throws
      // straight ahead however far off-centre on the button it came down
      this._aimAt(this._aimBase.x + (t.x - t.x0) * this.AIM_DRAG,
                  this._aimBase.y + (t.y - t.y0) * this.AIM_DRAG);
    }
  },

  _tEnd(t, cancelled) {
    if (t.role === 'tap') {
      let held = false;
      for (const o of this._t.values()) if (o.role === 'tap') held = true;
      if (!held) Input.mdown = false;
    } else if (t.role === 'toss' && this._aimSrc === t.id) {
      this._aimEnd(!cancelled);     // a cancelled touch is the OS's, not a throw
    }
  },

  _hitTest(x, y) {
    const P = this.PAUSE;
    if (x >= P.x - 10 && x < P.x + P.w + 10 && y < P.y + P.h + 9) return 'pause';
    let best = 'none', bd = this.SLOP;
    for (const k in this.BTN) {
      const b = this.BTN[k], d = hyp(x - b.x, y - b.y) - b.r;
      if (d < bd) { bd = d; best = k; }
    }
    if (best !== 'none') return best;
    // the whole lower-left corner is the stick: a thumb lands roughly, not on a pixel
    const S = this.STICK;
    if (x < S.x + S.r + 40 && y > S.y - S.r - 40) return 'stick';
    return 'none';
  },

  _touching(role) {
    for (const t of this._t.values()) if (t.role === role) return t;
    return null;
  },

  /* A floating stick: the input is the drag from where the thumb came down,
     so landing a little off-centre is not a turn. The base is still drawn at
     home and only the knob moves, which keeps the overlay inside its rect. */
  _stick() {
    const t = this._touching('stick');
    if (!t) return { x: 0, y: 0, on: false };
    let x = (t.x - t.x0) / this.STICK.r, y = (t.y - t.y0) / this.STICK.r;
    const m = hyp(x, y);
    if (m > 1) { x /= m; y /= m; }
    return { x, y, on: true };
  },

  /* ---------------- drawing (Mode C, drive only) ---------------- */
  /* Every circle here is disc() at a HALF-integer radius. At a whole radius
     disc()'s middle row is two pixels wider than the rows beside it, so each
     circle grows a one-pixel ear at 3 and 9 o'clock -- and a control is four
     concentric rings, so the ears stack into a visible tick. r + 0.5 gives an
     even-diameter circle with no ear, filling exactly [cx-r, cx+r) by
     [cy-r, cy+r): centred on the pixel corner (cx, cy). */
  _o(x, cx, cy, r, col) { disc(x, cx, cy - 1, r + 0.5, col); },

  /* Baked once at full strength and blitted translucent: a stack of
     translucent discs would compound alpha at every overlap and come out
     blotchy rather than as one see-through control. */
  _bake() {
    const O = this._o, ink = PAL.ink, body = PAL.ink2, ring = shade(PAL.ink2, 0.24);
    const spr = { btn: {} };
    const S = this.STICK, sd = S.r * 2 + 2;

    // stick base: keyline, a lit rim, the well, four direction pips
    const t = mkCanvas(sd, sd), x = t.x, c = S.r + 1;
    O(x, c, c, S.r, ink);
    O(x, c, c, S.r - 1, ring);
    O(x, c, c, S.r - 2, body);
    O(x, c, c, 13, shade(PAL.ink, -0.25));
    O(x, c, c, 12, shade(PAL.ink2, 0.08));
    // 3-step arrowheads 2, 4 and 6 wide -- navArrow's own -- centred on the corner
    for (let i = 0; i < 3; i++) {
      const n = i + 1, w = n * 2;
      R(x, PAL.boneDim, c - n, c - 19 + i, w, 1);     // up
      R(x, PAL.boneDim, c - n, c + 18 - i, w, 1);     // down
      R(x, PAL.boneDim, c - 19 + i, c - n, 1, w);     // left
      R(x, PAL.boneDim, c + 18 - i, c - n, 1, w);     // right
    }
    spr.base = t.c;

    // the knob: a ball-top, the one thing every arcade stick shares
    const knob = (lit) => {
      const r = 10, kd = r * 2 + 2, k = mkCanvas(kd, kd + 1), y = k.x, m = r + 1;
      const col = lit ? shade(PAL.red, 0.18) : PAL.red;
      O(y, m, m + 1, r, shade(PAL.ink, -0.3));        // its shadow on the panel
      O(y, m, m, r, ink);
      O(y, m, m, r - 1, shade(col, -0.38));
      O(y, m - 1, m - 1, r - 2, col);
      O(y, m - 3, m - 3, 3, shade(col, 0.32));
      R(y, PAL.bone, m - 5, m - 5, 2, 2);
      return k.c;
    };
    spr.knob = [knob(false), knob(true)];

    /* arcade buttons: keyline, a 1px bezel of the button's own dark hue, and
       a flat cap lit from the top left -- one light and one dark crescent,
       the same two-step shading the sprites use, rather than a gloss that
       would sit on the label. Pressed, the cap drops a pixel and brightens. */
    for (const name in this.BTN) {
      const b = this.BTN[name], col = PAL[b.pal];
      const one = (lit) => {
        const bd = b.r * 2 + 2, k = mkCanvas(bd, bd + 1), y = k.x, m = b.r + 1, rc = b.r - 2;
        const cap = lit ? shade(col, 0.3) : col;
        const dip = lit ? 1 : 0;
        O(y, m, m + 1, b.r, shade(PAL.ink, -0.3));            // its shadow on the panel
        O(y, m, m, b.r, ink);
        O(y, m, m, b.r - 1, shade(col, lit ? -0.2 : -0.6));
        O(y, m, m + dip, rc, shade(cap, -0.35));
        O(y, m - 1, m - 1 + dip, rc - 1, shade(cap, 0.42));
        O(y, m, m + dip, rc - 1, cap);
        text(y, b.label, m, m - 4 + dip, PAL.ink, 1, 1);
        return k.c;
      };
      spr.btn[name] = [one(false), one(true)];
    }

    // pause: a small HUD plate with the two bars every pause button has
    const pz = (lit) => {
      const P = this.PAUSE, k = mkCanvas(P.w, P.h), y = k.x;
      R(y, ink, 0, 0, P.w, P.h);
      R(y, lit ? ring : body, 1, 1, P.w - 2, P.h - 2);
      y.strokeStyle = ring; y.lineWidth = 1;
      y.strokeRect(0.5, 0.5, P.w - 1, P.h - 1);
      const bar = lit ? PAL.amber : PAL.bone;
      R(y, bar, (P.w >> 1) - 4, 3, 3, P.h - 6);
      R(y, bar, (P.w >> 1) + 1, 3, 3, P.h - 6);
      return k.c;
    };
    spr.pause = [pz(false), pz(true)];
    this._spr = spr;
  },

  draw(x, context) {
    if (this.mode !== 'C' || context !== 'drive') return;
    if (!this._spr) this._bake();
    const spr = this._spr, S = this.STICK;
    const ga = x.globalAlpha;

    // stick
    const s = this._stick();
    x.globalAlpha = 0.5;
    x.drawImage(spr.base, S.x - S.r - 1, S.y - S.r - 1);
    x.globalAlpha = s.on ? 0.85 : 0.6;
    const kx = Math.round(S.x + s.x * this.TRAVEL), ky = Math.round(S.y + s.y * this.TRAVEL);
    x.drawImage(spr.knob[s.on ? 1 : 0], kx - 11, ky - 11);

    // buttons
    for (const name in this.BTN) {
      const b = this.BTN[name];
      const lit = name === 'toss' ? this.aiming : !!this._touching(name);
      x.globalAlpha = lit ? 0.85 : 0.6;
      x.drawImage(spr.btn[name][lit ? 1 : 0], b.x - b.r - 1, b.y - b.r - 1);
    }

    // pause
    const lit = this._pauseLit > 0;
    x.globalAlpha = lit ? 0.9 : 0.6;
    x.drawImage(spr.pause[lit ? 1 : 0], this.PAUSE.x, this.PAUSE.y);
    x.globalAlpha = ga;
  },
};
