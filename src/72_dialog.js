/* ============================================================
   DIALOGUE STRIP -- one mechanism, both halves of the game
   ============================================================

   The constraint that shaped it: in the Delivery Shift the middle band is the
   road and cannot be covered while you are steering; in the Kitchen the middle
   band is the ingredient lattice. The only region non-critical in BOTH is the
   bottom strip -- and it is non-critical precisely because during a one-line
   reaction you are not reading the minimap or the nav unit.

   So the strip takes that band for as long as someone is speaking, and gives
   it back. It lands on furniture in both halves, which is the point: the
   furniture is what you can spare.

   PORTRAIT BOX: 56x56 is the minimap's rect reused, and it is a FLOOR, not a
   ceiling. A bust squeezed into 56 rows drops the face from 33px wide to 24px,
   and this project has already measured that a face works at ~44px and is mush
   around 21px. So a taller portrait OVERHANGS the strip upward while the strip
   itself stays 60 rows. That costs a 60x18 patch at the bottom-left corner --
   where the minimap already sits, the cheapest real estate on the screen --
   rather than a taller band across all 376px. Breaking the frame is an arcade
   idiom, not an accident.
*/
'use strict';

/* Which baked face speaks. One character exists so far, so this is a constant;
   when the cast grows it becomes a property of whoever is talking. */
const DLG_FACE = 'smokerbust';

const DLG_Y = 150, DLG_H = 60, DLG_X = 4;
const DLG_BOX = 56;                 // the minimap's rect: the floor
const DLG_RISE = 0.16;              // seconds to slide in

const Dialog = {
  active: false, t: 0, hold: 0, who: '', lines: [], sub: '', meter: null,
  face: null, hostile: false, hood: 0, blinkT: 0, blink: 0,

  /** raise the strip. `secs` is how long it stays up once it has arrived. */
  say(who, line, o) {
    o = o || {};
    this.active = true; this.t = 0; this.hold = o.secs || 3.2;
    this.who = who; this.lines = [].concat(line);
    this.sub = o.sub || ''; this.meter = o.meter == null ? null : o.meter;
    this.face = o.face || null; this.hostile = !!o.hostile;
    this.hood = o.hood || 0; this.blinkT = 1.4 + Math.random() * 1.6; this.blink = 0;
  },

  drop() { this.active = false; },

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    /* a blink every couple of seconds -- the one thing that stops a static
       portrait reading as a still image pasted over the game */
    this.blinkT -= dt;
    if (this.blink > 0) { this.blink -= dt; if (this.blink <= 0) this.blinkT = 1.4 + Math.random() * 1.8; }
    else if (this.blinkT <= 0) this.blink = 0.11;
    if (this.t > DLG_RISE + this.hold) this.active = false;
  },

  draw(x) {
    if (!this.active) return;
    const f = this.face && FACES[this.face];
    const fw = f ? Math.max(DLG_BOX, f.w + 4) : DLG_BOX;
    const fh = f ? Math.max(DLG_BOX, f.h + 4) : DLG_BOX;

    /* slide up, and ease out so it settles rather than snapping */
    const g = Math.min(1, this.t / DLG_RISE), e = 1 - (1 - g) * (1 - g);
    const dy = Math.round((1 - e) * (DLG_H + 8));

    x.save();
    x.translate(0, dy);

    const py = DLG_Y, h = DLG_H, px = DLG_X, w = VW - 8;
    R(x, 'rgba(10,6,16,0.55)', px + 3, py + 4, w, h);
    Hud.panel(x, px, py, w, h, '#6b5f84');

    const fx = px + 3, fy = py + 2 - (fh - DLG_BOX);      // grows up, never down
    R(x, PAL.ink, fx, fy, fw, fh);
    R(x, '#2a2438', fx + 1, fy + 1, fw - 2, fh - 2);
    for (let i = 0; i < fh - 2; i += 3)                   // faint backing, so the
      R(x, '#31293f', fx + 1, fy + 1 + i, fw - 2, 1);     // head is not on a void
    if (f) Faces.draw(x, this.face, fx + fw / 2, fy + ((fh - f.h) >> 1),
                      { hood: this.hood, blink: this.blink > 0 ? 1 : 0 });
    x.strokeStyle = '#6b5f84'; x.lineWidth = 1;
    x.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

    /* speech bubble */
    const bx = fx + fw + 10, by = py + 6, bw = px + w - 6 - bx, bh = 34;
    R(x, PAL.ink, bx, by, bw, bh);
    R(x, PAL.bone, bx + 1, by + 1, bw - 2, bh - 2);
    R(x, PAL.boneDim, bx + 1, by + bh - 2, bw - 2, 1);
    for (let i = 0; i < 5; i++) {                          // tail into the portrait
      R(x, PAL.ink, bx - 1 - i, by + 11 + i, 2, 7 - i);
      R(x, PAL.bone, bx - i, by + 12 + i, 2, 5 - i);
    }

    /* speaker plate rides the bubble's top-left corner, clear of the head */
    const nw = textW(this.who, 1) + 8;
    R(x, PAL.ink, bx + 4, by - 4, nw, 9);
    R(x, this.hostile ? PAL.bad : PAL.amber, bx + 5, by - 3, nw - 2, 7);
    text(x, this.who, bx + 8, by - 2, PAL.ink, 1);

    const n = this.lines.length;
    for (let i = 0; i < n; i++)
      text(x, this.lines[i], bx + bw / 2, by + (n > 1 ? 9 : 14) + i * 11, PAL.ink, 1, 1);

    if (this.sub) text(x, this.sub, bx + 2, py + h - 12, this.hostile ? PAL.bad : PAL.boneDim, 1);
    if (this.meter != null) {
      const mw = 96, mx = px + w - mw - 6;
      R(x, PAL.ink, mx, py + h - 13, mw, 5);
      const v = clamp(this.meter, 0, 1);
      R(x, v > 0.5 ? PAL.amber : v > 0.22 ? '#e07a1f' : PAL.bad, mx + 1, py + h - 12, Math.round((mw - 2) * v), 3);
    }
    x.restore();
  },
};
