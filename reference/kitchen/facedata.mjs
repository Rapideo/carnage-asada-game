/* TEST ARTEFACT -- NOT A DECISION

   Baked faces: decode, and draw with variation on top.

   WHY THIS EXISTS. `portrait.mjs` composes axis-aligned rectangles, because
   that is all a parameterised drawing routine can do. A likeness at 44px needs
   irregular, diagonal edges -- and a reduced reference has them, because it
   came from a drawing. Every attempt to re-derive a likeness through
   parameters produced a face made of bars: two hard brow strokes, a
   rectangular cheek shadow, a ruler-straight hairline.

   So the likeness is DATA and the variation is CODE. That split is not new
   here: `GLYPH` (the 5x7 font) and `LOGO` (the 7x9 display face) are both
   hand-authored pixel tables in source, decoded at boot. This is the same
   thing with a bigger table and a generated one.

   NOT AN ASSET. The pixels live in a source literal, are decoded at boot into
   a canvas, and nothing is ever fetched -- which is the property the whole
   build depends on, since the artifact runs under a CSP that blocks external
   hosts and `fetch()` on a file:// page is blocked by CORS anyway.

   Cost, measured on the first face: 46x54 at 15 colours + ink is ~1.9 KB of
   source against a 232 KB artifact. Eight characters is under 15 KB.

   PORTING TO src/: this is an ES module because reference/ is. In src/ it
   becomes a plain script -- drop the import/export, keep everything else. The
   decoder touches only mkCanvas and R, both of which are in 00_core.
*/
import { E } from '../../tools/render/engine.mjs';
const { R, mkCanvas, shade } = E;

/* One char per run length, so a run is exactly two characters: a symbol and a
   length. Runs never cross a row, which caps length at the bitmap width and
   lets each run decode as a single fillRect instead of a loop over pixels. */
export const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
const LV = {};
for (let i = 0; i < 64; i++) LV[L64[i]] = i;

/** decode a baked face into a canvas. Call once, at boot, and keep the result. */
export function decodeFace(f) {
  const t = mkCanvas(f.w, f.h), x = t.x;
  let p = 0;
  for (let i = 0; i < f.pix.length; i += 2) {
    const sym = f.pix[i], len = LV[f.pix[i + 1]];
    if (len === undefined) throw new Error(`${f.name}: bad run length '${f.pix[i + 1]}' at ${i}`);
    if (sym !== '.') {
      const idx = parseInt(sym, 16);
      const col = f.pal[idx];
      if (!col) throw new Error(`${f.name}: run points at palette ${idx}, which is not there`);
      R(x, col, p % f.w, (p / f.w) | 0, len, 1);
    }
    p += len;
  }
  if (p !== f.w * f.h) throw new Error(`${f.name}: runs cover ${p} px, bitmap is ${f.w * f.h}`);
  return t.c;
}

/**
 * Draw a decoded face, with variation layered over the baked pixels.
 *
 * The baked bitmap is the likeness and is never edited. Everything here is an
 * overlay on top of it, which is the only kind of change that stays in
 * character -- repainting part of a face in flat rectangles would put back
 * exactly the bars this approach exists to avoid.
 *
 *   blink  1 = eyes closed
 *   hood   rows of lid pulled down over each eye. 0 alert, 2 tired, 3 hostile.
 */
export function drawFace(x, img, f, cx, ty, o = {}) {
  const px = (cx - (img.width >> 1)) | 0;
  x.drawImage(img, px, ty | 0);

  const eyes = o.eyes || f.eyes;
  if (!eyes || !eyes.length) return;
  const skin = o.skin || f.skin, lash = o.ink || f.ink || '#1b1425';

  for (const [ex, ey, ew, eh] of eyes) {
    const X = px + ex, Y = (ty | 0) + ey;
    if (o.blink) {
      /* a closed eye is skin with a line across it, sitting where the LOWER
         lid was -- closing to the top of the socket reads as a missing eye */
      R(x, skin, X, Y, ew, eh);
      R(x, shade(skin, -0.22), X, Y, ew, 1);
      R(x, lash, X, Y + eh - 2, ew, 1);
      continue;
    }
    const hood = o.hood || 0;
    if (hood > 0) {
      const n = Math.min(hood, eh - 1);          // never close it completely
      R(x, shade(skin, -0.30), X, Y, ew, n);
      R(x, lash, X, Y + n - 1, ew, 1);
    }
  }
}
