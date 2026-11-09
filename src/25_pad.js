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
  TRIG_ON: -0.4,        // a raw trigger axis (rest -1, full +1) past this is pressed: 30% travel
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

  /* ---- Mode C on a landscape phone: concept C, ghost controls in the side
     margins (reference/touch-concepts/, owner rulings 2026-11-08). The game
     picture fills the height and the controls live in the margins either side
     of it, drawn on the #pad overlay in CSS px rather than on the 384x216
     canvas. Sizes are physical: PX_PER_MM = dpr * DPI / 25.4 device px, which
     is DPI / 25.4 = 6.3 CSS px per mm whatever the dpr, because on Android one
     CSS px is one dp, 1/160 in. A 17 mm stick is then wider than the Pixel
     10's 15.3 mm margin, so it bleeds onto the picture's edge as concept C
     shows; the picture shrinks only if a control would reach its centre 80%.
     THE TUNABLES for the phone: DPI (if the controls come out the wrong
     physical size), LAND_MM (sizes and the edge gap), LAND_ASPECT (what counts
     as landscape), LAND_CLEAR (how much of the picture is kept clear). ---- */
  DPI: 160,
  LAND_MM: { stick: 18, gas: 15, toss: 12.7, rev: 10, pause: 7.2, edge: 2.5, gap: 2, slop: 2, throw: 5 },
  LAND_ASPECT: 1.5,     // vw / vh above this is landscape
  LAND_CLEAR: 0.8,      // no control reaches the picture's centre 80%
  LAND_BTN: ['toss', 'gas', 'rev'],   // top to bottom on the right: centred, or slid down off LAND_HUD
  /* The HUD's top-right stack in the city, in virtual px: the clock card
     (x 253..381, y 3..47), then ORDERS and the stars (y 50..58) and the
     streak (y 60..68), each with its 1px outline. The right column slides
     down off it rather than sitting on the ORDERS counter (owner, 2026-11-09). */
  LAND_HUD: { x: 250, y: 0, w: VW - 250, h: 70 },
  /* ghost styling: a 2 CSS px bone outline and a faint fill, both brighter under a thumb */
  GHOST: { line: 2, lineA: 0.45, fillA: 0.12, lineOn: 0.85, fillOn: 0.35 },

  LABELS: {
    B: { drive: 'STICK, 1 GAS, 2 REV', throw: 'HOLD 3, RELEASE', aim: 'HOLD 3 + STICK',
         pause: 'START', select: 'BUTTON 1', wrap: 'BUTTON 2', serve: 'BUTTON 3', mute: 'BACK' },
    C: { drive: 'STICK, GAS, REV', throw: 'HOLD TOSS', aim: 'TOSS + STICK',
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
  _lay: null,                    // the current layout (relayout), null until the page measures
  _view: null,                   // ...and the viewport it was measured from
  _scene: 'drive',               // ...and the stage it was laid out for
  _ov: null,                     // the #pad overlay canvas, over the whole page
  _ovSig: '',                    // what the overlay last drew, so an idle frame redraws nothing

  /* 90_main sets this to its resize(), so choosing Mode C refits the canvas */
  onModeChange: null,

  setMode(m) {
    m = m === 'B' || m === 'C' ? m : 'A';
    if (m === this.mode) return;
    this.mode = m;
    this._reset(this.context);
    if (this._view) this.relayout(this._view.vw, this._view.vh, this._view.dpr, this._view.insets, this._view.scene);
    if (typeof this.onModeChange === 'function') this.onModeChange();
  },

  /** The control layout for a viewport, in CSS px; pure. vw/vh: the page,
      dpr: devicePixelRatio, insets: the safe area {top,right,bottom,left}.
      opts: { mode (default this.mode), context: 'drive' | 'kitchen' | 'menu' }.
      Landscape Mode C returns { landscape: true, units: 'css', picture, stick,
      buttons: [{id, cx, cy, r}], pause: {cx, cy, r} } -- the kitchen has only
      PAUSE, a menu nothing. Anything else is today's on-canvas layout in
      virtual px ({ landscape: false, units: 'virtual', ... }), and its
      picture is exactly the fit 90_main has always made. */
  layout(vw, vh, dpr, insets, opts) {
    opts = opts || {};
    const mode = opts.mode || this.mode;
    const ctx = opts.context === 'kitchen' || opts.context === 'menu' ? opts.context : 'drive';
    vw = +vw || 0; vh = +vh || 0; dpr = dpr > 0 ? +dpr : 1;
    const ins = {};
    for (const k of ['top', 'right', 'bottom', 'left']) ins[k] = Math.max(0, +(insets && insets[k]) || 0);
    // 90_main's own rule: fit in 0.05 steps, or below 1:1 fit exactly
    const fit = (w, h) => { const raw = Math.max(0, Math.min(w / VW, h / VH)); return raw >= 1 ? Math.floor(raw * 20) / 20 : raw; };
    const pic = (s) => ({ x: (vw - VW * s) / 2, y: (vh - VH * s) / 2, w: VW * s, h: VH * s });

    if (mode !== 'C' || !(vh > 0 && vw / vh > this.LAND_ASPECT)) {
      const s = fit(vw, vh), on = mode === 'C' && ctx === 'drive', S = this.STICK, P = this.PAUSE;
      return {
        landscape: false, units: 'virtual', dpr, scale: s, picture: pic(s),
        stick: on ? { cx: S.x, cy: S.y, r: S.r } : null,
        buttons: on ? Object.keys(this.BTN).map((id) => ({ id, cx: this.BTN[id].x, cy: this.BTN[id].y, r: this.BTN[id].r })) : [],
        pause: on ? { x: P.x, y: P.y, w: P.w, h: P.h } : null,
      };
    }

    const mm = this.DPI / 25.4, M = this.LAND_MM;          // CSS px per mm
    const e = M.edge * mm, gap = M.gap * mm;
    const left = ins.left + e, right = vw - ins.right - e, top = ins.top + e;
    const cy = (ins.top + vh - ins.bottom) / 2;
    const sr = M.stick * mm / 2;
    const stick = { cx: left + sr, cy, r: sr };
    const rs = this.LAND_BTN.map((id) => M[id] * mm / 2);
    const col = right - Math.max(...rs);
    let y = cy - (rs.reduce((a, r) => a + 2 * r, 0) + gap * (rs.length - 1)) / 2;
    const buttons = this.LAND_BTN.map((id, i) => {
      const b = { id, cx: col, cy: y + rs[i], r: rs[i] };
      y += 2 * rs[i] + gap;
      return b;
    });
    const pr = M.pause * mm / 2;
    const pause = { cx: left + pr, cy: top + pr, r: pr };
    const box = (s, x, y) => ({ x, y, w: VW * s, h: VH * s });

    /* The Kitchen Shift has nothing in the margins but PAUSE (owner, round 2),
       so its picture simply fills the safe area's height, centred on the page
       where the safe area allows. PAUSE goes in whichever margin has room for
       it, left first, and only overlaps the picture if neither does. */
    if (ctx === 'kitchen') {
      const sx0 = ins.left, sx1 = vw - ins.right, sy0 = ins.top, sy1 = vh - ins.bottom;
      const s = fit(sx1 - sx0, sy1 - sy0), w = VW * s, h = VH * s;
      const x = clamp((vw - w) / 2, sx0, Math.max(sx0, sx1 - w)), y = clamp((vh - h) / 2, sy0, Math.max(sy0, sy1 - h));
      const need = 2 * (e + pr), lf = x - ins.left, rf = vw - ins.right - (x + w);
      const onLeft = lf >= need || (rf < need && lf >= rf);
      return {
        landscape: true, units: 'css', dpr, scale: s, picture: box(s, x, y), mm,
        stick: null, buttons: [],
        pause: { cx: onLeft ? left + pr : right - pr, cy: top + pr, r: pr },
      };
    }

    /* Delivery (and the menus over it): the picture is fitted as if there
       were no insets -- only the controls dodge the camera band -- and
       shrinks only if a control would reach its centre LAND_CLEAR. It sits
       centred when it can; with the stick pushed in by an inset it slides
       the other way, as far as keeps that centre clear of both reaches. */
    const reachL = Math.max(stick.cx + stick.r, pause.cx + pause.r);
    const reachR = Math.min(...buttons.map((b) => b.cx - b.r));
    const C = this.LAND_CLEAR, lo = (1 - C) / 2, hi = (1 + C) / 2, AIR = 0.5;   // AIR: CSS px, so "clear" is not a tie
    const maxW = Math.max(0, (reachR - reachL - 2 * AIR) / C);
    const s = fit(Math.min(vw, maxW), vh), w = VW * s, h = VH * s;
    let x = clamp((vw - w) / 2, 0, Math.max(0, vw - w));
    x = clamp(x, reachL + AIR - lo * w, Math.max(reachL + AIR - lo * w, reachR - AIR - hi * w));
    const picture = box(s, x, (vh - h) / 2);
    /* The column is centred unless TOSS would sit on the HUD's top-right
       stack: then it slides down to clear it by the gap, or as far as the
       bottom edge allows. Only y moves, so the picture's fit is unchanged. */
    const H = this.LAND_HUD, hud = { x: picture.x + H.x * s, y: picture.y + H.y * s, w: H.w * s, h: H.h * s };
    const t0 = buttons[0], nx = clamp(t0.cx, hud.x, hud.x + hud.w), ny = clamp(t0.cy, hud.y, hud.y + hud.h);
    if (Math.hypot(t0.cx - nx, t0.cy - ny) < t0.r) {
      const top = t0.cy - t0.r, bot = buttons[buttons.length - 1].cy + buttons[buttons.length - 1].r;
      const dy = Math.max(0, Math.min(hud.y + hud.h + gap, vh - ins.bottom - e - (bot - top)) - top);
      for (const b of buttons) b.cy += dy;
    }
    return {
      landscape: true, units: 'css', dpr, scale: s, picture, mm,
      stick: ctx === 'drive' ? stick : null,
      buttons: ctx === 'drive' ? buttons : [],
      pause: ctx === 'menu' ? null : pause,
    };
  },

  /** 90_main measures the page and calls this on every resize, and again
      whenever the stage changes between the city and the kitchen (scene
      'drive' | 'kitchen'), since the kitchen's picture is a different size.
      It keeps that layout for hit-testing and sizes the overlay to the page. */
  relayout(vw, vh, dpr, insets, scene) {
    scene = scene === 'kitchen' ? 'kitchen' : 'drive';
    this._view = { vw, vh, dpr, insets, scene };
    this._scene = scene;
    const L = this._lay = this.layout(vw, vh, dpr, insets, { mode: this.mode, context: scene });
    const ov = this._ov;
    if (ov) {
      try {
        if (L.landscape) {
          ov.width = Math.max(1, Math.round(vw * L.dpr)); ov.height = Math.max(1, Math.round(vh * L.dpr));
          if (ov.style) { ov.style.width = vw + 'px'; ov.style.height = vh + 'px'; }
        } else { ov.width = 1; ov.height = 1; }
        if (ov.style) ov.style.display = 'none';
      } catch (e) { /* a stub or a detached canvas: nothing to size */ }
    }
    this._ovSig = '';
    return L;
  },

  /** Mode C with the controls drawn ON the picture, as they always were: a
      portrait phone, or before the page has measured. The HUD makes room for
      them (bag, edge arrow) only then. */
  onCanvas() { return this.mode === 'C' && !(this._lay && this._lay.landscape); },
  /** Mode C with the controls in the margins: hit-tested in CSS px. */
  _margins() { return this.mode === 'C' && !!(this._lay && this._lay.landscape); },

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

  /** stage: the page element under the margins; overlay: the #pad canvas.
      Both are optional -- without them Mode C stays on the canvas. */
  init(canvas, stage, overlay) {
    this._canvas = canvas || null;
    this._ov = overlay && typeof overlay.getContext === 'function' ? overlay : null;
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

    /* The margins: touches that land on the page outside the canvas. They are
       queued only while the margin layout is up -- anywhere else they did
       nothing before and still do nothing -- but an end is always passed on,
       so a thumb held on GAS through a rotation cannot leave KeyW stuck. A
       touch that started on the canvas is the canvas listener's. */
    if (!stage || stage === canvas || typeof stage.addEventListener !== 'function') return;
    if (stage.style) stage.style.touchAction = 'none';
    const onS = (type, t) => stage.addEventListener(type, (e) => {
      const list = e.changedTouches || [], live = this._margins();
      let mine = false;
      for (let i = 0; i < list.length; i++) {
        const tc = list[i];
        if (tc.target === canvas) continue;
        if (!live && (t === 's' || t === 'm')) continue;
        mine = true;
        this._push(t, tc.identifier, tc.clientX, tc.clientY);
      }
      if (mine && e.cancelable) e.preventDefault();
    }, { passive: false });
    onS('touchstart', 's'); onS('touchmove', 'm'); onS('touchend', 'e'); onS('touchcancel', 'c');
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
    r.b1 = r.b2 = r.b3 = r.start = r.back = r.lt = r.rt = r.du = r.dd = r.dl = r.dr = false;
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
    const raw = g.mapping === 'standard' ? null : this._rawLayout(g);
    if (raw) {
      r.b1 = btn(g, raw.b1); r.b2 = btn(g, raw.b2); r.b3 = btn(g, raw.b3);
      r.back = btn(g, raw.back); r.start = btn(g, raw.start);
      if (raw.lt != null) r.lt = (ax[raw.lt] == null ? -1 : +ax[raw.lt]) > this.TRIG_ON;
      if (raw.rt != null) r.rt = (ax[raw.rt] == null ? -1 : +ax[raw.rt]) > this.TRIG_ON;
      this._hat(+ax[raw.hat], r);
      return r;
    }
    r.b1 = btn(g, 0); r.b2 = btn(g, 1); r.b3 = btn(g, 2);
    r.back = btn(g, 8); r.start = btn(g, 9);
    // 6 and 7 are the left and right triggers only under the standard mapping
    if (g.mapping === 'standard') { r.lt = btn(g, 6); r.rt = btn(g, 7); }
    // 12-15 are the d-pad only under the standard mapping; on a bare encoder
    // they can be ordinary buttons, and reading them as directions would be wrong
    if (g.mapping === 'standard') { r.du = btn(g, 12); r.dd = btn(g, 13); r.dl = btn(g, 14); r.dr = btn(g, 15); }
    return r;
  },

  /* Controllers Chrome hands over WITHOUT the standard mapping, by USB
     vendor:product, in their raw HID order. Under the standard mapping Button 3
     is index 2; on these it is an unused slot, so the throw never fired (owner,
     2026-11-09, on a Series X|S pad over Bluetooth). `hat` is the axis that
     carries the d-pad. */
  RAW_LAYOUTS: {
    // Xbox Wireless Controller (Series X|S), Bluetooth: A 0, B 1, X 3, View 10, Menu 11;
    // the triggers are axes resting at -1, and the d-pad a hat on axis 9
    '045e:0b13': { b1: 0, b2: 1, b3: 3, back: 10, start: 11, lt: 3, rt: 4, hat: 9 },
  },

  /* Windows Chrome: "Unknown Gamepad (Vendor: 045e Product: 0b13)";
     macOS and Linux Chrome: "045e-0b13-Xbox Wireless Controller" */
  _rawLayout(g) {
    const id = String(g.id || '');
    const m = /Vendor:\s*([0-9a-f]{4})\s+Product:\s*([0-9a-f]{4})/i.exec(id) || /^([0-9a-f]{4})-([0-9a-f]{4})-/i.exec(id);
    return m ? this.RAW_LAYOUTS[(m[1] + ':' + m[2]).toLowerCase()] || null : null;
  },

  /* A HID hat switch as one axis: -1 is up, each 2/7 is the next of 8
     directions clockwise, and centred rests past +1 (9/7). */
  _hat(v, r) {
    if (!(v >= -1.05 && v <= 1.05)) return;
    const d = ((Math.round((v + 1) * 3.5) % 8) + 8) % 8;   // 0 up, 1 up-right, ... 7 up-left
    r.du = d === 7 || d <= 1;
    r.dr = d >= 1 && d <= 3;
    r.dd = d >= 3 && d <= 5;
    r.dl = d >= 5 && d <= 7;
  },

  _stickOn(r) {
    const dz = this.DRIVE_DZ;
    return r.du || r.dd || r.dl || r.dr || Math.abs(r.sx) > dz || Math.abs(r.sy) > dz;
  },

  _effective(raw) {
    const L = this._latch, e = this._eff || (this._eff = {});
    for (const k of ['b1', 'b2', 'b3', 'start', 'back', 'lt', 'rt']) {
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
      for (const k of ['b1', 'b2', 'b3', 'start', 'back', 'lt', 'rt']) this._latch[k] = r[k];
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
      // the triggers are a second gas and brake: right is gas, left is brake (owner, 2026-11-09)
      if (e.b1 || e.rt || e.du || e.sy < -ON) want.KeyW = 1;
      if (e.b2 || e.lt || e.dd || e.sy > ON) want.KeyS = 1;
    }
    if (this.mode !== 'C') return;
    const s = this._stick();
    /* TOSS held: the on-screen stick AIMS, the same convention as the
       controller (hold X, aim with the stick, let go), and the car coasts
       (owner, 2026-11-09, on the Pixel: it used to keep steering). It moves
       the aim's base, so a drag on TOSS still adds its own offset on top. */
    if (this._aimSrc !== null && this._aimSrc !== 'pad') {
      const m = hyp(s.x, s.y);
      if (m >= DZ && this._aimBase) {
        const k = Math.min(1, (m - DZ) / (1 - DZ)) / m * this.AIM_SPEED * dt;
        const B = this._aimBase, M = this.AIM_MAX;
        B.x += s.x * k; B.y += s.y * k;
        const bd = hyp(B.x, B.y);
        if (bd > M) { B.x *= M / bd; B.y *= M / bd; }
        this._aimAt(this.aimX + s.x * k, this.aimY + s.y * k);
      }
      return;
    }
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
    /* ux/uy: the same mapping unclamped, so a drag in a margin still moves;
       cx/cy: the page's CSS px, which the margin layout is hit-tested in */
    const ux = (cx - (r ? r.left : 0)) / s, uy = (cy - (r ? r.top : 0)) / s;
    const x = clamp(ux, 0, VW), y = clamp(uy, 0, VH);
    const q = this._q, last = q[q.length - 1];
    if (t === 'm' && last && last.t === 'm' && last.id === id) {
      last.x = x; last.y = y; last.ux = ux; last.uy = uy; last.cx = cx; last.cy = cy; return;
    }
    q.push({ t, id, x, y, ux, uy, cx, cy });
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
      t.x = ev.x; t.y = ev.y; t.ux = ev.ux; t.uy = ev.uy; t.cx = ev.cx; t.cy = ev.cy;
      if (ev.t === 'm') this._tMove(t);
      else { this._t.delete(ev.id); this._tEnd(t, ev.t === 'c'); }
    }
  },

  _tStart(ctx, ev, pulse) {
    const t = { id: ev.id, x: ev.x, y: ev.y, x0: ev.x, y0: ev.y, t0: this._clock, role: 'dead',
                ux: ev.ux, uy: ev.uy, ux0: ev.ux, uy0: ev.uy, cx: ev.cx, cy: ev.cy, cx0: ev.cx, cy0: ev.cy };
    this._t.set(ev.id, t);
    const land = this._margins();
    /* The kitchen in landscape: PAUSE in the margin, and the picture is tapped
       as always. Any other margin touch is nothing -- clamped to the canvas it
       would be a tap on whichever edge bin it happened to line up with. */
    if (land && ctx === 'kitchen') {
      if (this._hitLand(ev.cx, ev.cy, ctx) === 'pause') { pulse.push('KeyP'); this._pauseLit = 0.2; return; }
      const P = this._lay.picture;
      if (!(ev.cx >= P.x && ev.cx < P.x + P.w && ev.cy >= P.y && ev.cy < P.y + P.h)) return;
    }
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
    const hit = land ? this._hitLand(ev.cx, ev.cy, ctx) : this._hitTest(ev.x, ev.y);
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
      const h = this._margins() ? this._hitLand(t.cx, t.cy, 'drive') : this._hitTest(t.x, t.y);
      if (h === 'gas' || h === 'rev') t.role = h;
    } else if (t.role === 'toss' && this._aimSrc === t.id) {
      // relative to where the finger landed, so a plain tap always throws
      // straight ahead however far off-centre on the button it came down.
      // In the margins TOSS is off the picture, so the drag is read unclamped.
      const m = this._margins();
      const dx = m ? t.ux - t.ux0 : t.x - t.x0, dy = m ? t.uy - t.uy0 : t.y - t.y0;
      this._aimAt(this._aimBase.x + dx * this.AIM_DRAG, this._aimBase.y + dy * this.AIM_DRAG);
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

  /* The margin layout, in CSS px. PAUSE first; then the nearest button within
     the slop -- or the nearest at all, anywhere in the right margin -- and the
     stick for anything in the left margin or near its ring. */
  _hitLand(cx, cy, ctx) {
    const L = this._lay;
    if (!L || !L.landscape) return 'none';
    const sl = this.LAND_MM.slop * L.mm, pz = L.pause, P = L.picture;
    if (pz && hyp(cx - pz.cx, cy - pz.cy) < pz.r + sl) return 'pause';
    if (ctx !== 'drive') return 'none';
    let best = 'none', bd = cx >= P.x + P.w ? Infinity : sl;
    for (const b of L.buttons) {
      const d = hyp(cx - b.cx, cy - b.cy) - b.r;
      if (d < bd) { bd = d; best = b.id; }
    }
    if (best !== 'none') return best;
    const S = L.stick;
    if (S && (cx < P.x || hyp(cx - S.cx, cy - S.cy) < S.r + sl)) return 'stick';
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
    // in the margins: full lock at LAND_MM.throw of drag, not the whole 9 mm radius
    const land = this._margins(), th = land ? this.LAND_MM.throw * this._lay.mm : this.STICK.r;
    let x = land ? (t.cx - t.cx0) / th : (t.x - t.x0) / th, y = land ? (t.cy - t.cy0) / th : (t.y - t.y0) / th;
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
    if (this.mode !== 'C' || context !== 'drive' || !this.onCanvas()) return;
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

  /* ---------------- drawing (Mode C, landscape: the margins) ---------------- */
  /** 90_main calls this every frame after G.render. scene: 'drive' (a delivery
      shift, paused or not), 'kitchen', or null for anything else, which hides
      the overlay. It repaints only when something it shows has changed. */
  drawOverlay(scene) {
    const ov = this._ov;
    if (!ov) return;
    const on = this._margins() && (scene === 'drive' || scene === 'kitchen');
    if (!on) {
      if (this._ovSig !== 'off') { this._ovSig = 'off'; if (ov.style) ov.style.display = 'none'; }
      return;
    }
    const st = this.ghostState(scene);
    const sig = scene + JSON.stringify(st);
    if (sig === this._ovSig) return;
    this._ovSig = sig;
    if (ov.style) ov.style.display = 'block';
    const x = ov.getContext('2d');
    if (!x) return;
    x.clearRect(0, 0, ov.width, ov.height);
    this.paintGhosts(x, this._lay, scene, st);
  },

  /** What the ghosts show: the knob's deflection and which control is lit. */
  ghostState(scene) {
    const s = this._stick(), q = (v) => Math.round(v * 50) / 50;
    return { sx: q(s.x), sy: q(s.y), stick: s.on, toss: this.aiming,
             gas: !!this._touching('gas'), rev: !!this._touching('rev'), pause: this._pauseLit > 0, scene };
  },

  /** Paint the ghosts for layout L into x, a canvas of the page at L.dpr.
      Coordinates are device px. Separate from drawOverlay so a render
      script can draw the same thing into a picture of the whole screen. */
  paintGhosts(x, L, scene, st) {
    if (!L || !L.landscape) return;
    st = st || {};
    const k = L.dpr, G = this.GHOST, TAU = Math.PI * 2, ga = x.globalAlpha;
    const circle = (X, Y, r, back) => { if (back) x.arc(X, Y, r, TAU, 0, true); else x.arc(X, Y, r, 0, TAU); };
    const ghost = (c, fill, lit, cx, cy, r) => {
      const X = (cx == null ? c.cx : cx) * k, Y = (cy == null ? c.cy : cy) * k, Rr = (r == null ? c.r : r) * k, w = G.line * k;
      x.globalAlpha = lit ? G.fillOn : G.fillA; x.fillStyle = fill;
      x.beginPath(); circle(X, Y, Rr); x.closePath(); x.fill();
      // the outline: an annulus, so its width is exact at any dpr
      x.globalAlpha = lit ? G.lineOn : G.lineA; x.fillStyle = PAL.bone;
      x.beginPath(); circle(X, Y, Rr); x.closePath();
      x.moveTo(X + Rr - w, Y); circle(X, Y, Rr - w, true); x.closePath(); x.fill();
    };
    const tri = (X, Y, a, s) => {                         // a pip pointing along angle a
      const c = Math.cos(a), n = Math.sin(a);
      x.beginPath();
      x.moveTo(X + c * s, Y + n * s);
      x.lineTo(X - c * s * 0.6 - n * s * 0.8, Y - n * s * 0.6 + c * s * 0.8);
      x.lineTo(X - c * s * 0.6 + n * s * 0.8, Y - n * s * 0.6 - c * s * 0.8);
      x.closePath(); x.fill();
    };

    if (scene === 'drive' && L.stick) {
      const S = L.stick, lit = !!st.stick, kr = S.r * 0.42, tr = S.r - kr - G.line;
      ghost(S, PAL.bone, lit);
      x.globalAlpha = lit ? G.lineOn : G.lineA; x.fillStyle = PAL.bone;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        tri((S.cx + Math.cos(a) * S.r * 0.8) * k, (S.cy + Math.sin(a) * S.r * 0.8) * k, a, S.r * 0.09 * k);
      }
      // the knob, the arcade ball-top: red, like the stick it stands in for
      ghost(S, PAL.red, lit, S.cx + (st.sx || 0) * tr, S.cy + (st.sy || 0) * tr, kr);
    }
    if (scene === 'drive') {
      /* one label scale for all three, the largest that keeps each word
         inside about 90% of its button's radius */
      let ls = Infinity;
      for (const b of L.buttons) ls = Math.min(ls, Math.floor(0.9 * b.r * k / textW(this.BTN[b.id].label, 1)));
      ls = Math.max(1, ls === Infinity ? 1 : ls);
      for (const b of L.buttons) {
        const B = this.BTN[b.id], lit = !!st[b.id];
        ghost(b, PAL[B.pal], lit);
        x.globalAlpha = lit ? G.lineOn : G.lineA;
        text(x, B.label, Math.round(b.cx * k), Math.round(b.cy * k - FH * ls / 2), PAL.bone, ls, 1);
      }
    }
    if (L.pause) {
      const P = L.pause, lit = !!st.pause;
      ghost(P, PAL.bone, lit);
      x.globalAlpha = lit ? G.lineOn : G.lineA; x.fillStyle = PAL.bone;
      const bw = Math.max(1, Math.round(P.r * 0.22 * k)), bh = Math.round(P.r * 0.9 * k);
      const X = Math.round(P.cx * k), Y = Math.round(P.cy * k - bh / 2);
      x.fillRect(X - bw - Math.round(bw * 0.6), Y, bw, bh);
      x.fillRect(X + Math.round(bw * 0.6), Y, bw, bh);
    }
    x.globalAlpha = ga;
  },
};
