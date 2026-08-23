/* ============================================================
   HUD  --  order card, tip meter, TACO-NAV panel, minimap
   ============================================================ */
'use strict';

const MM = 52;                      // minimap edge in px

const Hud = {
  mapImg: null,

  buildMap() {
    const t = mkCanvas(MM, MM);
    const x = t.x;
    R(x, PAL.field, 0, 0, MM, MM);   // past the last street, same as the ground
    // roads are 2 tiles wide but a minimap pixel covers ~2 tiles, so point
    // sampling drops whole streets — take the most important class in the cell
    const step = GW / MM;
    for (let my = 0; my < MM; my++) for (let mx = 0; mx < MM; mx++) {
      const tx0 = (mx * step) | 0, ty0 = (my * step) | 0;
      let road = false, walk = false, land = false;
      for (let dy = 0; dy < Math.ceil(step); dy++) for (let dx = 0; dx < Math.ceil(step); dx++) {
        const c = classify(tx0 + dx, ty0 + dy);
        if (c === T_ROAD || c === T_INTER) road = true;
        else if (c === T_WALK) walk = true;
        else if (c === T_LOT) land = true;
      }
      const col = road ? '#828799' : walk ? '#4a4e5e' : land ? '#343848' : PAL.field;
      R(x, col, mx, my, 1, 1);
    }
    this.mapImg = t.c;
  },

  panel(x, px, py, w, h, accent) {
    R(x, PAL.ink, px, py, w, h);
    R(x, '#2c2338', px + 1, py + 1, w - 2, h - 2);
    x.strokeStyle = accent || '#5b5170'; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    R(x, 'rgba(255,255,255,0.07)', px + 1, py + 1, w - 2, 1);
  },

  draw(x, G) {
    if (!this.mapImg) this.buildMap();
    const o = G.order;

    /* ---------- order + tip ----------
       44 tall, matching the clock card opposite. It has to be: the scale-2
       money readout occupies y23..36, so a 37-tall card left no room and the
       decay bar was painted over the bottom 3px of the digits. */
    this.panel(x, 3, 3, 140, 44, '#6b5f84');
    if (o) {
      // Text starts at x=8 in a 140-wide card, so a scale-1 line has ~131px:
      // 22 characters. The restock lines used to read "OUT OF TACOS - RESTOCK
      // AT" / "TACO SHOP (<addr> WAITING)" — 149px and up to 203px, both
      // spilling well past the card. Longest address the generator makes is 13
      // chars ("408 WALNUT ST"), so "<addr> WAITING" tops out at 125px.
      text(x, G.needPickup ? 'OUT OF TACOS - RESTOCK' : 'DELIVER TO', 8, 7,
        G.needPickup ? PAL.bad : PAL.boneDim, 1);
      text(x, G.needPickup ? o.label + ' WAITING' : o.label, 8, 15, PAL.bone, 1);
      const pop = G.tipPop > 0 ? 1 : 0;
      text(x, money(o.tip), 8, 23, o.tip <= o.floor + 1 ? PAL.bad : PAL.amber, 2);
      text(x, 'TIP', 8 + textW(money(o.tip), 2) + 5, 29, PAL.boneDim, 1);
      if (pop) { x.globalAlpha = 0.5; text(x, money(o.tip), 8, 23, PAL.bone, 2); x.globalAlpha = 1; }
      // decay bar
      const f = clamp((o.tip - o.floor) / (o.max - o.floor), 0, 1);
      R(x, '#1b1425', 7, 39, 132, 4);
      const bw = Math.round(130 * f);
      R(x, f > 0.5 ? PAL.amber : f > 0.22 ? '#e07a1f' : PAL.bad, 8, 40, bw, 2);
      for (let i = 8; i < 138; i += 6) R(x, 'rgba(0,0,0,0.35)', i, 40, 1, 2);
    } else {
      text(x, 'NO ACTIVE ORDER', 8, 15, PAL.boneDim, 1);
    }

    /* ---------- clock + earnings ----------
       widths are tight at 384px: labels sit left at 1x, values right at 2x,
       sized so a 7-char "$999.99" still clears the label */
    const pw = 128, px0 = VW - pw + 1;
    this.panel(x, VW - pw - 3, 3, pw, 44, '#6b5f84');
    text(x, 'SHIFT', px0, 8, PAL.boneDim, 1);
    const low = G.shift < 20;
    text(x, clockStr(G.shift), VW - 7, 5, low && (G.time * 4 | 0) % 2 ? PAL.bad : PAL.bone, 2, 2);
    text(x, 'PAID', px0, 23, PAL.boneDim, 1);
    text(x, money(G.earned), VW - 7, 20, PAL.good, 2, 2);
    // Hays PD attention. "HAYS PD" is 41px at scale 1 where "HEAT" was 23, so
    // the meter starts 18px further right and is shortened by the same amount
    // — its right edge stays put, and the 3px label gap is preserved.
    text(x, 'HAYS PD', px0, 37, PAL.boneDim, 1);
    R(x, '#1b1425', px0 + 44, 36, 72, 5);
    const hf = clamp(G.heat / G.heatMax, 0, 1);
    R(x, hf > 0.75 ? PAL.bad : hf > 0.4 ? '#e07a1f' : '#5b6a8a', px0 + 45, 37, Math.round(70 * hf), 3);
    if (G.cop) textOut(x, 'IN PURSUIT', px0 + 44, 36, PAL.bad, 1);

    /* ---------- combo ---------- */
    if (G.combo > 1.001) {
      textOut(x, 'X' + G.combo.toFixed(2) + ' STREAK', VW - 6, 51,
        G.comboPop > 0 ? PAL.bone : PAL.amber, 1, 2);
    }

    /* ---------- minimap ---------- */
    const mx0 = 4, my0 = VH - MM - 4;
    R(x, PAL.ink, mx0 - 2, my0 - 2, MM + 4, MM + 4);
    x.globalAlpha = 0.88; x.drawImage(this.mapImg, mx0, my0); x.globalAlpha = 1;
    const w2m = (wx) => mx0 + wx / WW * MM, h2m = (wy) => my0 + wy / WH * MM;
    // route breadcrumbs
    if (Nav.goal) {
      x.fillStyle = PAL.cyanLo;
      for (const n of Nav.route) x.fillRect(w2m(City.nodeX(n[0])) | 0, h2m(City.nodeY(n[1])) | 0, 1, 1);
    }
    // shop
    R(x, PAL.red, w2m(City.shop.x + 60) - 1, h2m(City.shop.y + 40) - 1, 3, 3);
    // goal
    if (Nav.goal) {
      const blink = (G.time * 5 | 0) % 2;
      R(x, blink ? PAL.amber : PAL.bone, w2m(Nav.goal.x) - 2, h2m(Nav.goal.y) - 2, 5, 5);
      R(x, PAL.ink, w2m(Nav.goal.x) - 1, h2m(Nav.goal.y) - 1, 3, 3);
    }
    // cop
    if (G.cop) R(x, (G.time * 6 | 0) % 2 ? PAL.siren1 : PAL.siren2, w2m(G.cop.x) - 1, h2m(G.cop.y) - 1, 3, 3);
    // player
    R(x, PAL.bone, w2m(G.player.x) - 1, h2m(G.player.y) - 1, 3, 3);
    R(x, PAL.ink2, w2m(G.player.x), h2m(G.player.y), 1, 1);
    x.strokeStyle = '#6b5f84'; x.lineWidth = 1;
    x.strokeRect(mx0 - 1.5, my0 - 1.5, MM + 3, MM + 3);

    /* ---------- TACO-NAV ---------- */
    this.drawNav(x, G);

    /* ---------- taco bag ---------- */
    const bx0 = VW - 76, by0 = VH - 20;
    text(x, 'DELIVERIES', bx0, by0 - 9, PAL.boneDim, 1);
    for (let i = 0; i < G.bagMax; i++) {
      const px = bx0 + i * 15, py = by0;
      if (i < G.bag) {
        R(x, PAL.ink, px, py, 13, 13);
        R(x, BAG_MID, px + 1, py + 1, 11, 11);
        R(x, BAG_HI, px + 1, py + 1, 11, 1);
        R(x, BAG_LO, px + 1, py + 3, 11, 1);
        R(x, BAG_LO, px + 1, py + 10, 11, 2);
        R(x, PAL.jade, px + 4, py + 5, 5, 4);
        R(x, PAL.gold, px + 5, py + 6, 3, 1);
      } else {
        R(x, '#2c2338', px, py, 13, 13);
        x.strokeStyle = '#4a4058'; x.strokeRect(px + 0.5, py + 0.5, 12, 12);
      }
    }

    /* ---------- edge arrow to target ---------- */
    this.edgeArrow(x, G);

    /* ---------- banners ---------- */
    if (G.banner && G.bannerT > 0) {
      const a = clamp(G.bannerT / 0.4, 0, 1);
      x.globalAlpha = a;
      const w = textW(G.banner, 2) + 16;
      R(x, PAL.ink, (VW - w) / 2 | 0, 60, w, 20);
      x.strokeStyle = G.bannerCol; x.strokeRect(((VW - w) / 2 | 0) + 0.5, 60.5, w - 1, 19);
      // y is the TOP of the run, not its centre: the box is 20 tall from y=60
      // and the 5x7 font at scale 2 is 14, so y=66 put the final glyph row on
      // the bottom border stroke. 63 centres it with 3px either side.
      text(x, G.banner, VW / 2, 63, G.bannerCol, 2, 1);
      x.globalAlpha = 1;
    }
  },

  drawNav(x, G) {
    /* No unit name in the box. "TACO-NAV 2000" cost 10 of the panel's 34
       rows to say something the player reads once and never needs again, and
       the panel sits over the road you are trying to see. The identity lives
       in the LCD treatment — cyan on near-black with scan lines — not in a
       caption. Sized to the longest thing it can ever say: MAKE A U-TURN at
       77px from px+32, and RETURN TO ROADWAY at 101px centred. */
    const w = 118, h = 24, px = (VW - w) / 2 | 0, py = VH - h - 4;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#0e1c1c', px + 1, py + 1, w - 2, h - 2);
    x.strokeStyle = PAL.cyanLo; x.lineWidth = 1;
    x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);
    // LCD scan lines
    x.fillStyle = 'rgba(63,184,176,0.055)';
    for (let i = py + 2; i < py + h - 1; i += 2) x.fillRect(px + 1, i, w - 2, 1);

    if (!Nav.goal) { text(x, 'STANDBY', px + w / 2, py + 5, PAL.cyanLo, 2, 1); return; }

    if (Nav.glitch > 0 || Nav.lost) {
      const flick = (G.time * 9 | 0) % 2;
      text(x, flick ? 'RECALCULATING' : 'RECALCULATING.', px + w / 2, py + 4, flick ? PAL.cyan : PAL.cyanLo, 1, 1);
      text(x, Nav.lost ? 'RETURN TO ROADWAY' : 'PLEASE WAIT', px + w / 2, py + 13, PAL.cyanLo, 1, 1);
      return;
    }

    const arrowX = px + 16, arrowY = py + 12;
    navArrow(x, arrowX, arrowY, Nav.arriving ? 4 : Nav.turn, PAL.cyan, G.time);

    const label = Nav.arriving ? 'ARRIVING' : TURN_NAMES[Nav.turn];
    text(x, label, px + 32, py + 4, PAL.cyan, 1);
    const m = Math.max(0, Math.round(Nav.dist / 8 / 5) * 5);
    text(x, Nav.arriving ? 'TOSS THE BAG' : ('IN ' + m + ' M'), px + 32, py + 13, PAL.cyanLo, 1);
    if (Nav.arriving) {
      const b = (G.time * 6 | 0) % 2;
      R(x, b ? PAL.cyan : PAL.cyanLo, px + w - 6, py + 3, 3, 3);
    }
  },

  edgeArrow(x, G) {
    if (!Nav.goal) return;
    const cam = G.cam;
    const sx = Nav.goal.x - cam.x, sy = Nav.goal.y - cam.y;
    const pad = 16;
    if (sx > pad && sx < VW - pad && sy > pad && sy < VH - pad) return;
    // keep the arrow inside the clear band: below the top panels,
    // above the nav unit, clear of the minimap
    const cx = VW / 2, cy = VH / 2;
    const a = Math.atan2(sy - cy, sx - cx);
    const hw = VW / 2 - 26, hh = VH / 2 - 52;
    const t = Math.min(Math.abs(hw / Math.cos(a)), Math.abs(hh / Math.sin(a)));
    const ex = cx + Math.cos(a) * t, ey = cy + Math.sin(a) * t;
    const pulse = 0.6 + 0.4 * Math.sin(G.time * 7);
    x.globalAlpha = pulse;
    triArrow(x, ex, ey, a, 9, PAL.amber, PAL.ink);
    x.globalAlpha = 1;
    const m = Math.round(hyp(Nav.goal.x - G.player.x, Nav.goal.y - G.player.y) / 8);
    textOut(x, m + 'M', ex, ey - 17, PAL.amber, 1, 1);
  },
};

/* chunky turn arrow. kind: 0 straight 1 right 2 uturn 3 left 4 arriving */
function navArrow(x, cx, cy, kind, col, time) {
  const b = (px, py, w, h) => R(x, col, cx + px, cy + py, w, h);
  // 3-step solid arrowheads, tip one px beyond the last step
  const hUp    = (ax, ay) => { for (let i = 0; i < 3; i++) b(ax - (i + 1), ay - 3 + i, (i + 1) * 2, 1); };
  const hDown  = (ax, ay) => { for (let i = 0; i < 3; i++) b(ax - (i + 1), ay + 2 - i, (i + 1) * 2, 1); };
  const hRight = (ax, ay) => { for (let i = 0; i < 3; i++) b(ax + 2 - i, ay - (i + 1), 1, (i + 1) * 2); };
  const hLeft  = (ax, ay) => { for (let i = 0; i < 3; i++) b(ax - 2 + i, ay - (i + 1), 1, (i + 1) * 2); };

  if (kind === 0) {                        // continue straight
    hUp(0, -4);  b(-2, -5, 4, 13);
  } else if (kind === 1) {                 // turn right
    b(-8, -2, 4, 10);  b(-8, -6, 12, 4);  hRight(4, -4);
  } else if (kind === 3) {                 // turn left
    b(4, -2, 4, 10);   b(-4, -6, 12, 4);  hLeft(-4, -4);
  } else if (kind === 2) {                 // u-turn
    b(3, -4, 4, 12);   b(-5, -8, 12, 4);  b(-5, -4, 4, 5);  hDown(-3, 1);
  } else {                                 // arriving — bobbing marker
    const bob = (Math.sin(time * 6) * 1.5) | 0;
    hDown(0, 3 + bob);  b(-2, -6 + bob, 4, 9);
    if ((time * 4 | 0) % 2) { b(-6, 7, 12, 2); }
  }
}

function triArrow(x, cx, cy, a, r, col, outline) {
  const c = Math.cos(a), s = Math.sin(a);
  const P = [[r, 0], [-r * 0.7, -r * 0.75], [-r * 0.7, r * 0.75]];
  x.beginPath();
  P.forEach(([lx, ly], i) => {
    const px = cx + lx * c - ly * s, py = cy + lx * s + ly * c;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  });
  x.closePath();
  x.fillStyle = col; x.fill();
  x.strokeStyle = outline; x.lineWidth = 1; x.stroke();
}
