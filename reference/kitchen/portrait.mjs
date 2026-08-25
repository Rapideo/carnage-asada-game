/* TEST ARTEFACT -- NOT A DECISION

   The dialogue portrait. Extracted so the face rig (face.mjs) and the scene
   (kitchen-face.mjs) draw the SAME function -- iterating on a face inside a
   full scene render was what made this slow before.

   44px across. At the 21px the pass window allowed, there are ~5px between
   the eyes and every feature is a 1px decision; that is where "silly" came
   from. Four times the area buys an eye a lid, a white, an iris, a pupil and
   a catchlight. */
import { E } from '../../tools/render/engine.mjs';
const { PAL, R, shade, makeRng } = E;

/* Head silhouette, 45 rows of half-width. A real skull, not a cylinder:
   wide cranium, temples, cheekbones, and a jaw that tapers to a chin.

   THIS IS CHARACTER DATA, NOT A MODULE CONSTANT -- and that distinction is the
   whole of a bug the first cast shipped with. Four faces were drawn, and every
   one of them used this array; only skin, hair, shirt and iris changed. The
   result reads as one person recoloured four times, because a skull is the
   thing you actually recognise a person by, and no amount of better shading
   fixes a silhouette everyone shares. `o.skull` overrides it per character. */
export const HEAD = [
   7, 11, 14, 16, 18, 19, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21,
  21, 21, 21, 21, 21, 21, 21, 20, 20, 20, 19, 19, 18, 18, 17, 17,
  16, 16, 15, 15, 14, 13, 13, 12, 11, 10,  9,  8,  7,
];

/* A row is a half-width (symmetric) or a [left, right] pair. A 3/4 view has no
   single half-width -- the near cheek shows and the far side foreshortens --
   so a face that turns needs both, and a face that does not costs nothing. */
const halves = (s, r) => {
  const v = s[r < 0 ? 0 : r >= s.length ? s.length - 1 : r];
  return typeof v === 'number' ? [v, v] : v;
};
const LW = (s, r) => halves(s, r)[0];
const RW = (s, r) => halves(s, r)[1];

/* Where the features sit, in head rows. Defaults are the rows the original
   face used, so a character that says nothing draws exactly as before. A
   character with a longer or shorter skull moves them. */
const FEAT = {
  brow: 15, lid: 20, eye: 22, lowLid: 27, ridge: 17, cheek: 30,
  noseTop: 24, noseBase: 33, mouth: 39, earTop: 21, earH: 12,
  eyeIn: 5, eyeOut: 14, eyeW: 9, noseW: 4,
};

export function portrait(x, cx, ty, o) {
  const skin = o.skin, hair = o.hair;
  const S = o.skull || HEAD;
  const F = Object.assign({}, FEAT, o.feat);
  const skM = shade(skin, -0.16), skD = shade(skin, -0.34), skX = shade(skin, -0.52);
  const hrH = shade(hair, 0.30), hrD = shade(hair, -0.34);
  const P = (c, ox, oy, w, h) => R(x, c, cx + ox, ty + oy, w, h);
  const N = S.length;
  const rng = makeRng(o.seed || 5);
  const mood = o.mood || 'flat';
  const sour = mood === 'sour', glad = mood === 'glad';

  /* neck + shoulders: a head with no neck is a balloon -- but the shared
     dialogue box is 56 rows and a bust needs 66, so it is optional. */
  if (!o.headOnly) {
  for (let r = 0; r < 15; r++) {
    const hw = Math.round(5 + r * 0.42);        // out of the jaw, not a slab
    P(PAL.ink, -hw - 1, N - 8 + r, hw * 2 + 2, 1);
    P(r < 3 ? skD : skM, -hw, N - 8 + r, hw * 2, 1);
  }
  for (let r = 0; r < 12; r++) {                // sloped, not a bar
    const hw = Math.round(9 + Math.min(1, r / 5) * 17);
    P(PAL.ink, -hw - 1, N + 4 + r, hw * 2 + 2, 1);
    P(r < 2 ? shade(o.shirt, 0.20) : o.shirt, -hw, N + 4 + r, hw * 2, 1);
    P(shade(o.shirt, -0.28), hw - 6, N + 4 + r, 6, 1);
  }
  P(PAL.ink, -7, N + 4, 15, 2);                 // collar, tight to the neck
  P(shade(o.shirt, -0.40), -6, N + 5, 13, 1);
  } else {                                       // floating head: a soft base
    for (let r = 0; r < 5; r++)
      P(shade(skin, -0.30 - r * 0.09), -6 + r, N - 7 + r, 13 - r * 2, 1);
  }

  /* the head */
  for (let r = 0; r < N; r++) {
    const [lw, rw] = halves(S, r);
    P(PAL.ink, -lw - 1, r, lw + rw + 2, 1);
    P(skin, -lw, r, lw + rw, 1);
    P(skM, rw - 5, r, 5, 1);                    // form shadow, one side only
    P(skD, rw - 2, r, 2, 1);
  }
  P(PAL.ink, -LW(S, 0), -1, LW(S, 0) + RW(S, 0), 1);

  /* Ears. `o.ears` picks which are visible: a 3/4 head shows the far one only,
     because the near ear is on the far side of the nose from us. Drawing both
     on a turned head is what makes it read as a flat mask with tabs. */
  const ears = o.ears || [-1, 1];
  for (const s of ears) {
    const w = o.earW || 6, h = F.earH;
    /* anchored to the head edge AT THE EAR'S OWN TOP ROW, not at the eye row.
       On a tapering jaw those are different widths, and anchoring to the wrong
       one leaves the ear floating in space beside the head. Overlaps by 2 so
       the two ink outlines meet instead of leaving a seam. */
    const ex = s > 0 ? RW(S, F.earTop) - 2 : -LW(S, F.earTop) - (w - 2);
    P(PAL.ink, ex, F.earTop, w, h);
    P(skM, ex + (s > 0 ? 0 : 1), F.earTop + 1, w - 1, h - 2);
    P(skD, ex + (s > 0 ? 1 : 2), F.earTop + 4, w - 3, h - 7);
  }

  /* brow ridge + cheekbones: the two things that stop a face reading flat */
  P(skM, -LW(S, F.ridge) + 1, F.ridge, LW(S, F.ridge) + RW(S, F.ridge) - 2, 1);
  P(skD, -LW(S, F.cheek) + 1, F.cheek, 8, 3);
  P(skD, RW(S, F.cheek) - 9, F.cheek, 8, 3);
  if (o.gaunt) {                                // hollow cheeks, under the bone
    P(skD, -LW(S, F.cheek) + 2, F.cheek + 3, 6, 4);
    P(skD, RW(S, F.cheek) - 8, F.cheek + 3, 6, 4);
  }

  /* eyes -- lid, white, iris, pupil, catchlight.

     `hood` eats rows off the top of the white. It is the one parameter that
     changes a face's whole read at this size: a fully open eye is alert, two
     rows of hood is tired, three is contemptuous. Cheaper and far more legible
     than any mouth change, because the eye is where the viewer looks first. */
  const hood = o.hood || 0;
  for (const s of [-1, 1]) {
    const ex = s < 0 ? -F.eyeOut : F.eyeIn;
    const ew = s < 0 ? (F.eyeWL || F.eyeW) : (F.eyeWR || F.eyeW);
    const open = Math.max(1, 5 - hood);         // rows of white left
    const top = F.eye + hood;
    /* The lash line stays 2 rows of ink whatever the hood does. Drawing the
       hood AS ink was the first attempt and it is wrong: four solid dark rows
       over each eye merge with the brow into one black shelf across the face,
       and the eye stops being an eye. A hood is a fold of SKIN in shadow -- it
       has to be skin-coloured or it is not a lid, it is a hole. */
    P(PAL.ink, ex - 1, F.lid, ew + 2, 2);          // lash line
    if (hood) P(skD, ex, F.lid + 2, ew, hood);     // the fold itself
    P(PAL.bone, ex, top, ew, open);
    P(shade(PAL.bone, -0.18), ex, top, ew, 1);
    const ix = ex + (s < 0 ? 3 : 2);
    const iw = Math.min(5, ew - 3);
    P(o.eyes, ix, top, iw, open);               // iris
    P(shade(o.eyes, -0.4), ix, top, iw, 1);
    P(PAL.ink, ix + 1, top + 1, iw - 2, Math.max(1, open - 2));   // pupil
    if (open >= 3) P('#ffffff', ix + 1, top + 1, 1, 1);           // catchlight
    P(skD, ex, F.lowLid, ew, 1);                // lower lid
    // brow
    const bw = ew + 3;
    for (let k = 0; k < bw; k++) {
      const t = k / (bw - 1);
      const tilt = sour ? (s < 0 ? Math.round(t * 4) : Math.round((1 - t) * 4))
                : glad ? (s < 0 ? Math.round((1 - t) * 2.2) : Math.round(t * 2.2)) : 0;
      P(hrD, ex - 2 + k, F.brow + tilt, 1, o.browH || 3);
    }
  }

  /* nose -- a bridge and a tip, not a smudge */
  const nx = o.noseDX || 0, nb = F.noseBase;
  P(skM, -2 + nx, F.noseTop, F.noseW, nb - F.noseTop + 1);
  P(skD, 1 + nx, F.noseTop + 2, 2, nb - F.noseTop - 1);
  /* Base width is a parameter: the ink under the tip is the widest dark mass
     on the face, and at 11px on a narrow nose it stops reading as a tip and
     starts reading as a smudge across the middle of the head. */
  const bw2 = F.noseBaseW || 11, b2 = bw2 >> 1;
  P(PAL.ink, -b2 + nx, nb, bw2, 3);
  P(skin, -b2 + 1 + nx, nb, bw2 - 2, 2);
  P(shade(skin, 0.14), -b2 + 2 + nx, nb, bw2 - 6, 1);
  P(skX, -b2 + nx, nb + 1, 2, 2); P(skX, b2 - 2 + nx, nb + 1, 2, 2);   // nostrils

  /* mouth -- corners are what carry the expression */
  /* Width is a parameter because the mouth sits near the bottom of the taper,
     where a narrow jaw is far narrower than a wide one. A fixed 19 on a gaunt
     face draws a mouth wider than the chin carrying it, and the jaw then reads
     as broken rather than as narrow. */
  const my = F.mouth, mw = F.mouthW || 19, mh = mw - 2, m2 = mw >> 1;
  P(PAL.ink, -m2, my, mw, 2);
  if (o.lips) {
    P('#b8506f', -m2 + 1, my, mh, 3);
    P('#d4708c', -m2 + 2, my, mh - 2, 1);
    P(shade('#b8506f', -0.35), -m2 + 2, my + 2, mh - 2, 1);
  } else {
    P(skX, -m2 + 1, my, mh, 1);
    P(skM, -m2 + 2, my + 1, mh - 2, 1);
  }
  for (const s of [-1, 1]) {                    // corners turn with the mood
    const dy = sour ? -1 : glad ? 1 : 0;
    P(PAL.ink, s < 0 ? -m2 - 1 : m2 - 1, my + 1 - dy, 2, 2);
  }
  if (o.moustache) {                            // sits ON the lip, not the nose
    P(PAL.ink, -12, my - 4, 25, 5);
    P(hair, -11, my - 4, 23, 3);
    P(hrH, -11, my - 4, 23, 1);
    P(hair, -12, my - 3, 2, 3); P(hair, 11, my - 3, 2, 3);
    for (let k = 0; k < 11; k++) P(hrD, -10 + k * 2, my - 2, 1, 1);
  }
  if (!o.moustache) P(skD, -5, my + 5, 11, 1);  // chin crease, 1px and only
                                                // where a moustache is not

  /* hair -- volume and direction, never a cap */
  if (o.locs) {
    /* Locs: separate clumps with GAPS between them, radiating off the crown.
       The gap is the whole read -- a solid mass with texture painted on is a
       cap in a wig, which is what the first attempt looked like. Each clump
       tapers, and the background showing between them is what says "separate
       ropes of hair" at a size too small to draw a rope. */
    const cap = o.locsCap === undefined ? 9 : o.locsCap;
    for (let r = -1; r < cap; r++) {            // the scalp they grow out of
      const lw = LW(S, Math.max(0, r)) + 1, rw = RW(S, Math.max(0, r)) + 1;
      P(PAL.ink, -lw - 1, r, lw + rw + 2, 1);
      P(hair, -lw, r, lw + rw, 1);
    }
    /* Each clump starts INSIDE the scalp and grows out. Starting at the
       silhouette edge leaves a hairline of background between scalp and loc,
       which reads as a wig sitting above the head rather than hair growing
       out of it. They also fan sideways more than up: locs hang, and a set
       that all points at the sky is a splash, not hair. */
    const NL = o.locsN || 13;
    for (let i = 0; i < NL; i++) {
      const t = i / (NL - 1);                   // -1..1 across the crown
      const a = -1 + t * 2;
      const bx = Math.round(a * (LW(S, 4) + 1));
      const by = Math.round(1 + Math.abs(a) * 6) - 3;
      const len = 4 + rng.int(4), out = Math.sign(a || 1);
      for (let k = -2; k < len; k++) {          // -2: rooted in the scalp
        const w = k < len - 2 ? 3 : 2;
        const px2 = bx + Math.round(out * k * 1.15) + rng.int(2) - 1;
        const py2 = by - k * 0.8 + Math.abs(a) * k * 0.8;
        P(PAL.ink, px2 - 1, (py2 | 0) - 1, w + 2, 3);
        P(k < 1 ? hair : rng.chance(0.45) ? hrD : hair, px2, py2 | 0, w, 2);
      }
    }
    for (let i = 0; i < 10; i++)                // a few highlights, low contrast
      P(hrH, -12 + rng.int(24), -1 + rng.int(7), 2, 1);
  } else if (o.bigHair) {
    for (let r = -7; r < 34; r++) {
      const base = Math.max(LW(S, r < 0 ? 0 : r), RW(S, r < 0 ? 0 : r));
      const hw = r < 10 ? base + 5 : base + 4;
      if (r < 10) { P(PAL.ink, -hw - 1, r, hw * 2 + 2, 1); P(hair, -hw, r, hw * 2, 1); }
      else {
        const w = r < 24 ? 9 : 7;
        P(PAL.ink, -hw - 1, r, w + 1, 1); P(hair, -hw, r, w, 1);
        P(PAL.ink, hw - w, r, w + 1, 1); P(hair, hw - w, r, w, 1);
      }
    }
    // strands, following the skull -- a single swept streak reads as wire
    for (let i = 0; i < 26; i++) {              // short, low-contrast, aligned
      const a = -21 + rng.int(42), rr = -4 + rng.int(13);
      P(rng.chance(0.55) ? shade(hair, 0.14) : shade(hair, -0.18), a, rr, 3, 2);
    }
    for (let k = 0; k < 9; k++) P(shade(hair, 0.18), -16 + k * 2, -2 + Math.round(k * 0.4), 2, 2);
  } else {
    for (let r = -4; r < 12; r++) {
      const lw = LW(S, Math.max(0, r)) + 2, rw = RW(S, Math.max(0, r)) + 2;
      P(PAL.ink, -lw - 1, r, lw + rw + 2, 1);
      P(hair, -lw, r, lw + rw, 1);
    }
    P(hrD, -16, 9, 32, 2);                      // hairline
    for (let k = 0; k < 9; k++) P(hair, -LW(S, 14) - 2, 12 + k, 4, 1);
    for (let k = 0; k < 9; k++) P(hair, RW(S, 14) - 2, 12 + k, 4, 1);
    for (let i = 0; i < 18; i++) {               // texture, not a pale cap
      const a = -18 + rng.int(36);
      P(rng.chance(0.5) ? shade(hair, 0.16) : shade(hair, -0.20), a, -2 + rng.int(10), 3, 2);
    }
  }
  for (let i = 0; i < 6; i++)                   // a little skin texture
    P(skM, -14 + rng.int(28), 28 + rng.int(8), 2, 1);

  /* Props last, over everything -- a cigarette in front of the lip, not
     tattooed onto it. It also has to be drawn after the hair, or a loc that
     falls past the jaw crosses in front of it. */
  if (o.cig) {
    const cy2 = F.mouth + (o.cigDY || 1), cx2 = (o.cigDX || 0) - 16;
    P(PAL.ink, cx2 - 1, cy2 - 1, 18, 5);
    P('#e8e2d2', cx2, cy2, 16, 3);              // paper
    P('#c8c0ac', cx2, cy2 + 2, 16, 1);          // its own underside shadow
    P('#8a7f68', cx2 + 12, cy2, 4, 3);          // the filter, a different value
    P(PAL.red, cx2, cy2, 3, 3);                 // ember
    P('#ffd06a', cx2 + 1, cy2 + 1, 1, 1);       // and its hot centre
  }
}

