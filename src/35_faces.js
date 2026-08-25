/* ============================================================
   FACES -- baked character likenesses, decoded at boot
   ============================================================

   The likeness is DATA and the variation is CODE, and that split is load
   bearing. A parameterised drawing routine composes axis-aligned rectangles,
   which is fine for a car and hopeless for a face: at 44px a likeness needs
   irregular, diagonal edges, and every attempt to re-derive one from
   parameters produced a face made of bars -- two hard brow strokes, a
   rectangular cheek shadow, a ruler-straight hairline.

   So the pixels come from `FACES` in 05_content.js, generated from a reference
   image by tools/render/bake-face.mjs. That is not a departure from how this
   project works: GLYPH (the 5x7 font) and LOGO (the 7x9 display face) are both
   hand-authored pixel tables in source, decoded at boot. This is the same
   thing with a bigger table and a generated one.

   NOT AN ASSET. Nothing is fetched. The artifact runs under a CSP that blocks
   external hosts, and fetch() on a file:// page is blocked by CORS, so an
   image file would blank the screen on the main distribution path.

   Encoding: `pix` is a run per two characters -- a symbol (a hex palette index,
   or '.' for transparent) and a length from L64. Runs never cross a row, so a
   run is one fillRect and its length can never exceed the bitmap width.
*/
'use strict';

const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
const L64V = {};
for (let i = 0; i < 64; i++) L64V[L64[i]] = i;

const Faces = {
  img: {},                          // name -> baked canvas

  /* Called once from G.boot, before anything can draw. Decoding is a boot-time
     bake like Art.build, never a per-frame cost. */
  build() {
    if (typeof FACES === 'undefined') return;
    for (const name in FACES) this.img[name] = this.decode(FACES[name]);
  },

  decode(f) {
    const t = mkCanvas(f.w, f.h), x = t.x;
    let p = 0;
    for (let i = 0; i < f.pix.length; i += 2) {
      const len = L64V[f.pix[i + 1]], sym = f.pix[i];
      if (sym !== '.') R(x, f.pal[parseInt(sym, 16)], p % f.w, (p / f.w) | 0, len, 1);
      p += len;
    }
    return t.c;
  },

  /**
   * Draw a face, with variation layered OVER the baked pixels -- never into
   * them. Repainting part of the likeness in flat rectangles would put back
   * exactly the bars this approach exists to avoid.
   *
   *   o.blink  1 = eyes closed
   *   o.hood   rows of lid pulled down. 0 alert, 2 tired, 3 hostile.
   */
  draw(x, name, cx, ty, o) {
    const f = FACES[name], img = this.img[name];
    if (!f || !img) return;
    o = o || {};
    const px = (cx - (img.width >> 1)) | 0, py = ty | 0;
    x.drawImage(img, px, py);

    const eyes = f.eyes;
    if (!eyes || !eyes.length) return;
    const skin = f.skin, lash = f.ink;

    for (let i = 0; i < eyes.length; i++) {
      const e = eyes[i], X = px + e[0], Y = py + e[1], ew = e[2], eh = e[3];
      if (o.blink) {
        /* a closed eye is skin with a line across it, sitting where the LOWER
           lid was -- closing to the top of the socket reads as a missing eye */
        R(x, skin, X, Y, ew, eh);
        R(x, shade(skin, -0.22), X, Y, ew, 1);
        R(x, lash, X, Y + eh - 2, ew, 1);
      } else if (o.hood > 0) {
        const n = Math.min(o.hood, eh - 1);        // never close it completely
        R(x, shade(skin, -0.30), X, Y, ew, n);
        R(x, lash, X, Y + n - 1, ew, 1);
      }
    }
  },
};
