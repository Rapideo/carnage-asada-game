/* ============================================================
   BOOT  --  canvas scaling, fixed-step loop, audio unlock
   ============================================================ */
'use strict';

(function () {
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d', { alpha: false });
  canvas.width = VW; canvas.height = VH;
  ctx.imageSmoothingEnabled = false;

  let scale = 3;
  function resize() {
    const wrap = document.getElementById('stage');
    const availW = wrap.clientWidth || window.innerWidth;
    const availH = wrap.clientHeight || window.innerHeight;
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

  Input.init(canvas, () => scale);

  /* first gesture unlocks WebAudio */
  const unlock = () => {
    Audio5.init(); Audio5.resume();
    removeEventListener('keydown', unlock);
    removeEventListener('mousedown', unlock);
  };
  addEventListener('keydown', unlock);
  addEventListener('mousedown', unlock);

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
  addEventListener('visibilitychange', () => { if (!document.hidden) { last = 0; acc = 0; } });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc = Math.min(acc + dt, 0.25);   // never let the catch-up loop spiral

    let guard = 0;
    while (acc >= STEP && guard++ < 5) {
      acc -= STEP;
      G.update(STEP);
      handleGlobalKeys();
      Input.endFrame();
    }
    /* engine voice only while a shift is live */
    if (Audio5.ready) {
      if ((G.state === 'play' || G.state === 'demo') && !G.paused) Audio5.engineOn();
      else if (Audio5.engine) Audio5.engineOff();
    }
    G.render(ctx);
  }

  /* Console bridge. Browsers pause requestAnimationFrame in a hidden tab, so
     this also makes the game steppable when it cannot self-drive. */
  window.TacoShop = {
    G, City, Nav, Art, Audio5, Input, ctx, Dialog, Faces,
    step(n = 1) {
      for (let i = 0; i < n; i++) { G.update(STEP); handleGlobalKeys(); Input.endFrame(); }
      G.render(ctx);
    },
  };

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
