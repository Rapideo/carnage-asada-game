/* ============================================================
   BOOT  --  canvas scaling, fixed-step loop, audio unlock
   ============================================================ */
'use strict';

(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = VW; canvas.height = VH;
  ctx.imageSmoothingEnabled = false;

  /* The safe area (a camera cutout, the gesture bar), read off a probe styled
     with env(safe-area-inset-*): JS has no other way to see it. Zero on a
     desktop, on file://, and wherever viewport-fit=cover is not in force. */
  let probe = null;
  try {
    if (document.body && document.createElement) {
      probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
        'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      document.body.appendChild(probe);
    }
  } catch (e) { probe = null; }
  function readInsets() {
    const z = { top: 0, right: 0, bottom: 0, left: 0 };
    try {
      if (!probe || typeof getComputedStyle !== 'function') return z;
      const cs = getComputedStyle(probe);
      return { top: parseFloat(cs.paddingTop) || 0, right: parseFloat(cs.paddingRight) || 0,
               bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0 };
    } catch (e) { return z; }
  }

  let scale = 3;
  function resize() {
    const wrap = document.getElementById('stage');
    const availW = wrap.clientWidth || window.innerWidth;
    const availH = wrap.clientHeight || window.innerHeight;
    /* Mode C on a landscape phone: Pad lays the ghost controls out in the
       margins and says how big the picture may be (the full height, unless a
       control would reach its centre 80%). Everything else fits as below. */
    const lay = typeof Pad !== 'undefined'
      ? Pad.relayout(availW, availH, window.devicePixelRatio || 1, readInsets()) : null;
    if (lay && lay.landscape) {
      scale = lay.scale;
      canvas.style.width = (VW * scale) + 'px';
      canvas.style.height = (VH * scale) + 'px';
      return;
    }
    // Integer scaling keeps pixels perfectly square, but a window only a few
    // px short of the next step throws away a third of the picture, so take
    // the fit instead and accept that some rows land on 2 device px.
    //
    // There used to be a `raw >= 1 ? 1` branch snapping the whole 1x-2x band
    // to a crisp 1:1. It is gone deliberately: #stage fills the viewport, so
    // raw is min(W/384, H/216) and *height* falls in that band constantly --
    // an 800x400 window measures 1.85 and painted a 384x216 canvas into the
    // middle of it. Uneven pixels beat a picture at a quarter of the size.
    const raw = Math.min(availW / VW, availH / VH);
    scale = raw >= 1 ? Math.floor(raw * 20) / 20   // fit to the stage in 0.05 steps
          : raw;                                   // below 1:1, fit rather than overflow
    canvas.style.width = (VW * scale) + 'px';
    canvas.style.height = (VH * scale) + 'px';
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', resize);
  try { document.addEventListener('fullscreenchange', resize); } catch (e) { /* no fullscreen API */ }

  Input.init(canvas, () => scale);
  /* Modes B and C: the gamepad and the touch layer. It injects into Input
     the same codes a keyboard would, so nothing downstream has a second
     input path to keep in step. The stage carries the margin touches and
     #pad is the overlay the landscape ghost controls are drawn on. */
  if (typeof Pad !== 'undefined') {
    Pad.init(canvas, document.getElementById('stage'), document.getElementById('pad'));
    Pad.onModeChange = resize;      // choosing Mode C on a landscape phone refits the picture
  }

  /* Near-native on a phone, in Mode C only. The first tap in Mode C asks for
     full screen, then locks landscape (Chrome allows the lock only in full
     screen). The wake lock is held only while playing -- a shift, its card or
     its clear -- and syncWake() lets it go the moment that stops, so a phone
     left on the title still sleeps. Every one of these throws or rejects
     somewhere -- file://, desktop, iOS, an insecure origin -- and every one is
     optional, so each is wrapped and ignored. touchend, not touchstart: it is
     the gesture Chrome accepts for full screen. */
  let wake = null, wakePending = false, wakeFailed = false, nativeAsked = false;
  const PLAYING = { play: 1, kitchen: 1, card: 1, clear: 1 };
  const wakeWanted = () => !document.hidden && typeof Pad !== 'undefined' && Pad.mode === 'C' && !!PLAYING[G.state];
  const dropWake = (w) => { try { const r = w.release(); if (r && r.catch) r.catch(() => {}); } catch (e) { /* gone already */ } };
  function syncWake() {
    try {
      const want = wakeWanted();
      if (!want && wake) { const w = wake; wake = null; dropWake(w); }
      if (!want || wake || wakePending || wakeFailed) return;
      if (typeof navigator === 'undefined' || !navigator.wakeLock) return;
      wakePending = true;
      navigator.wakeLock.request('screen').then((w) => {
        wakePending = false;
        if (!wakeWanted()) { dropWake(w); return; }          // play ended while it was asked for
        wake = w;
        try { w.addEventListener('release', () => { if (wake === w) wake = null; }); } catch (e) { /* older API */ }
      }, () => { wakePending = false; wakeFailed = true; }); // refused: not again until the page comes back
    } catch (e) { wakePending = false; }
  }
  const goNative = () => {
    if (nativeAsked || typeof Pad === 'undefined' || Pad.mode !== 'C') return;
    nativeAsked = true;
    removeEventListener('touchend', goNative);
    try {
      const el = document.documentElement;
      if (document.fullscreenElement || !el || !el.requestFullscreen) return;
      const p = el.requestFullscreen({ navigationUI: 'hide' });
      const lock = () => {
        try {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
        } catch (e) { /* no orientation lock */ }
      };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* no fullscreen */ }
  };
  addEventListener('touchend', goNative);

  /* First gesture unlocks WebAudio. The music for whatever screen is up was
     asked for before there was a context to play it on, so ask again. */
  const unlock = () => {
    Audio5.init(); Audio5.resume();
    if (G.musicKey != null) G.playMusic(G.musicKey);
    removeEventListener('keydown', unlock);
    removeEventListener('mousedown', unlock);
    removeEventListener('touchstart', unlock);
    removeEventListener('touchend', unlock);
  };
  addEventListener('keydown', unlock);
  addEventListener('mousedown', unlock);
  /* Pad calls preventDefault on touches, so a phone never sends mousedown;
     touchend is the gesture browsers accept for audio. */
  addEventListener('touchstart', unlock);
  addEventListener('touchend', unlock);

  /* splash while the city bakes */
  ctx.fillStyle = PAL.void; ctx.fillRect(0, 0, VW, VH);
  text(ctx, 'TACO SHOP', VW / 2, VH / 2 - 22, PAL.gold, 4, 1);
  text(ctx, 'PAVING THE STREETS...', VW / 2, VH / 2 + 14, PAL.amber, 1, 1);
  resize();

  const params = new URLSearchParams(location.search);
  const seed = (parseInt(params.get('seed'), 10) || 20260816) >>> 0;

  setTimeout(() => {
    const t0 = performance.now();
    G.boot(seed);
    console.log('[taco shop] city built in ' + Math.round(performance.now() - t0) + 'ms, ' +
                City.statics.length + ' props, ' + City.houses.length + ' addresses');
    resize();
    requestAnimationFrame(frame);
  }, 30);

  const STEP = 1 / 60;
  let acc = 0, last = 0;

  // coming back from a hidden tab hands us one enormous frame; drop it rather
  // than fast-forwarding the shift the player was not watching
  addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; acc = 0; wakeFailed = false; syncWake(); } });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    /* G.speed and G.testPaused are the Test panel's (1 and false in the
       shipped game); step(n) below steps whatever they say */
    acc = G.testPaused ? 0 : Math.min(acc + dt * (G.speed || 1), 0.25);   // never let the catch-up loop spiral

    let guard = 0;
    while (acc >= STEP && guard++ < 5) {
      acc -= STEP;
      tick();
    }
    /* engine voice only while a shift is live */
    if (Audio5.ready) {
      if ((G.state === 'play' || G.state === 'demo') && !G.paused) Audio5.engineOn();
      else if (Audio5.engine) Audio5.engineOff();
      /* the rain, on the same terms: only under a live, rainy shift */
      if ((G.state === 'play' || G.state === 'demo') && !G.paused && G.weather === 'rainy') Audio5.rainOn();
      else if (Audio5.rainV) Audio5.rainOff();
    }
    G.render(ctx);
    /* the landscape ghost controls, over the margins: a delivery shift
       (paused or not, as on the canvas before) and the kitchen's PAUSE */
    if (typeof Pad !== 'undefined') Pad.drawOverlay(G.state === 'play' ? 'drive' : G.state === 'kitchen' ? 'kitchen' : null);
    syncWake();
  }

  /* Console bridge. Browsers pause requestAnimationFrame in a hidden tab, so
     this also makes the game steppable when it cannot self-drive. */
  window.TacoShop = {
    G, City, Nav, Art, Audio5, Input, ctx, Dialog, Faces, Kitchen,
    Pad: typeof Pad !== 'undefined' ? Pad : null,
    Music: typeof Music !== 'undefined' ? Music : null,
    step(n = 1) {
      for (let i = 0; i < n; i++) tick();
      G.render(ctx);
      syncWake();
    },
    /* For the phone check over Chrome remote debugging: what the page
       measured, and what Pad laid out from it. */
    layoutInfo() {
      const wrap = document.getElementById('stage'), r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
      let orientation = null, fullscreen = false;
      try { orientation = screen.orientation ? screen.orientation.type : null; } catch (e) { /* none */ }
      try { fullscreen = !!document.fullscreenElement; } catch (e) { /* none */ }
      return {
        innerWidth: window.innerWidth, innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1,
        stage: wrap ? { w: wrap.clientWidth, h: wrap.clientHeight } : null,
        insets: readInsets(),
        canvas: r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null, scale,
        mode: typeof Pad !== 'undefined' ? Pad.mode : null,
        layout: typeof Pad !== 'undefined' && Pad._lay ? JSON.parse(JSON.stringify(Pad._lay)) : null,   // a copy
        drive: typeof Pad !== 'undefined' && Pad._view
          ? Pad.layout(Pad._view.vw, Pad._view.vh, Pad._view.dpr, Pad._view.insets, { mode: 'C', context: 'drive' }) : null,
        orientation, fullscreen, wakeLock: !!wake,
      };
    },
  };

  /* One fixed step. The pad layer reads first, so its injected keys are in
     Input.down before the game looks; endFrame clears one-shot presses last. */
  function tick() {
    if (typeof Pad !== 'undefined') {
      Pad.aimHeading = G.player ? G.player.ang : 0;    // aim mode starts ahead of the car
      Pad.poll(G.padContext(), STEP);
    }
    G.update(STEP);
    handleGlobalKeys();
    Input.endFrame();
  }

  function handleGlobalKeys() {
    if (Input.p('KeyM')) {
      const m = Audio5.toggleMute();
      G.say(m ? 'SOUND OFF' : 'SOUND ON', PAL.boneDim);
    }
    if (Input.p('KeyN')) {
      const m = Audio5.toggleMusic();
      G.say(m ? 'MUSIC ON' : 'MUSIC OFF', PAL.boneDim);
    }
  }
})();
