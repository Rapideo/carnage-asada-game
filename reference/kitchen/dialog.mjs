/* TEST ARTEFACT -- NOT A DECISION

   ONE dialogue mechanism, for both halves of the game.

   The constraint that shaped it: in the Delivery Shift the middle band is the
   road and cannot be covered while you are steering; in the Kitchen the middle
   band is the ingredient lattice. The only region non-critical in BOTH is the
   bottom strip -- and it is non-critical precisely because during a one-line
   reaction you are not reading the minimap or the nav unit.

   So the strip takes that band for as long as someone is speaking, and gives
   it back. It lands on furniture in both halves, which is the point: the
   furniture is what you can spare.

   The portrait box starts at 56x56 -- the minimap's exact rect -- and a
   floating head fits it. A BUST DOES NOT: measured, a bust squeezed into 56
   rows drops the face from 33px wide to 24px, and this project has already
   established that a face fails below about 44px and is mush around 21px.

   So the box is a floor, not a ceiling. A taller portrait overhangs the strip
   upward and the strip itself stays 60 rows. See drawDialog. */
import { E } from '../../tools/render/engine.mjs';
import { portrait } from './portrait.mjs';
import { decodeFace, drawFace } from './facedata.mjs';

/* decode once per face and keep it -- decoding is a boot-time bake, not a
   per-frame cost, and the game will do exactly this in Art.build() */
const _decoded = new Map();
const faceImg = (f) => {
  if (!_decoded.has(f.baked)) _decoded.set(f.baked, decodeFace(f.baked));
  return _decoded.get(f.baked);
};
const { VW, VH, PAL, R, text, textW, shade, Hud } = E;

export function drawDialog(x, o) {
  const py = 150, h = 60, px = 4, w = VW - 8;

  R(x, 'rgba(10,6,16,0.55)', px + 3, py + 4, w, h);
  Hud.panel(x, px, py, w, h, '#6b5f84');

  /* Portrait box. 56x56 is the minimap's rect reused, and it is the FLOOR, not
     the ceiling: a bust is 74 rows and there is no way to fit one into 56
     without shrinking the face from 33px wide to 24px, which is inside the
     dead zone this project has already measured once.

     So a portrait taller than the strip OVERHANGS IT, upward. That costs a
     60x18 patch at the bottom-left corner of the screen rather than a taller
     strip across the full 376px, and the bottom-left in the Delivery Shift is
     where the minimap already sits -- it is the cheapest real estate there is.
     Breaking the frame is also an arcade idiom rather than an accident. */
  const bk = o.face && o.face.baked;
  const fs = 56;
  const fw = bk ? Math.max(fs, bk.w + 4) : fs;
  const fh = bk ? Math.max(fs, bk.h + 4) : fs;
  const fx = px + 3, fy = py + 2 - (fh - fs);         // grows up, never down

  R(x, PAL.ink, fx, fy, fw, fh);
  R(x, '#2a2438', fx + 1, fy + 1, fw - 2, fh - 2);
  for (let i = 0; i < fh - 2; i += 3)                 // faint backing, so the
    R(x, '#31293f', fx + 1, fy + 1 + i, fw - 2, 1);   // head is not on a void
  /* A character is either baked (a decoded pixel table -- the likeness is
     data) or parametric (drawn by portrait.mjs). The strip does not care
     which, so both kinds can coexist while the cast is being built out. */
  if (bk) {
    drawFace(x, faceImg(o.face), bk, fx + fw / 2, fy + ((fh - bk.h) >> 1), o.face);
  } else {
    portrait(x, fx + fw / 2, fy + 9, Object.assign({ headOnly: 1 }, o.face));
  }
  x.strokeStyle = '#6b5f84'; x.lineWidth = 1;
  x.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);

  /* speech bubble */
  const bx = fx + fw + 10, by = py + 6, bw = px + w - 6 - bx, bh = 34;
  R(x, PAL.ink, bx, by, bw, bh);
  R(x, PAL.bone, bx + 1, by + 1, bw - 2, bh - 2);
  R(x, PAL.boneDim, bx + 1, by + bh - 2, bw - 2, 1);
  for (let i = 0; i < 5; i++) {                       // tail into the portrait
    R(x, PAL.ink, bx - 1 - i, by + 11 + i, 2, 7 - i);
    R(x, PAL.bone, bx - i, by + 12 + i, 2, 5 - i);
  }
  /* speaker plate rides the bubble's top-left corner, clear of the head */
  const nw = textW(o.who, 1) + 8;
  R(x, PAL.ink, bx + 4, by - 4, nw, 9);
  R(x, o.hostile ? PAL.bad : PAL.amber, bx + 5, by - 3, nw - 2, 7);
  text(x, o.who, bx + 8, by - 2, PAL.ink, 1);

  const lines = [].concat(o.line);
  lines.forEach((l, i) => text(x, l, bx + bw / 2, by + (lines.length > 1 ? 9 : 14) + i * 11, PAL.ink, 1, 1));

  /* context line under the bubble -- who is waiting, and how patient */
  if (o.sub) text(x, o.sub, bx + 2, py + h - 12, o.hostile ? PAL.bad : PAL.boneDim, 1);
  if (o.meter != null) {
    const mw = 96, mx = px + w - mw - 6;
    R(x, '#1b1425', mx, py + h - 13, mw, 5);
    const f = Math.max(0, Math.min(1, o.meter));
    R(x, f > 0.5 ? PAL.amber : f > 0.22 ? '#e07a1f' : PAL.bad, mx + 1, py + h - 12, Math.round((mw - 2) * f), 3);
  }
}
