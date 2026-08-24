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

/* Head silhouette, 47 rows of half-width. A real skull, not a cylinder:
   wide cranium, temples, cheekbones, and a jaw that tapers to a chin. */
const HEAD = [
   7, 11, 14, 16, 18, 19, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21,
  21, 21, 21, 21, 21, 21, 21, 20, 20, 20, 19, 19, 18, 18, 17, 17,
  16, 16, 15, 15, 14, 13, 13, 12, 11, 10,  9,  8,  7,
];

export function portrait(x, cx, ty, o) {
  const skin = o.skin, hair = o.hair;
  const skM = shade(skin, -0.16), skD = shade(skin, -0.34), skX = shade(skin, -0.52);
  const hrH = shade(hair, 0.30), hrD = shade(hair, -0.34);
  const P = (c, ox, oy, w, h) => R(x, c, cx + ox, ty + oy, w, h);
  const N = HEAD.length;
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
    const hw = HEAD[r];
    P(PAL.ink, -hw - 1, r, hw * 2 + 2, 1);
    P(skin, -hw, r, hw * 2, 1);
    P(skM, hw - 5, r, 5, 1);                    // form shadow, one side only
    P(skD, hw - 2, r, 2, 1);
  }
  P(PAL.ink, -HEAD[0], -1, HEAD[0] * 2, 1);
  for (const s of [-1, 1]) {                    // ears, at eye height
    const ex = s > 0 ? HEAD[22] - 1 : -HEAD[22] - 4;
    P(PAL.ink, ex, 21, 6, 12);
    P(skM, ex + (s > 0 ? 0 : 1), 22, 5, 10);
    P(skD, ex + (s > 0 ? 1 : 2), 25, 3, 5);
  }

  /* brow ridge + cheekbones: the two things that stop a face reading flat */
  P(skM, -20, 17, 40, 1);
  P(skD, -19, 30, 8, 3);
  P(skD, 11, 30, 8, 3);

  /* eyes -- lid, white, iris, pupil, catchlight */
  for (const s of [-1, 1]) {
    const ex = s < 0 ? -14 : 5;
    const drop = sour ? (s < 0 ? 0 : 0) : 0;
    P(PAL.ink, ex - 1, 20 + drop, 11, 2);       // upper lid, heavy
    P(PAL.bone, ex, 22 + drop, 9, 5);
    P(shade(PAL.bone, -0.18), ex, 22 + drop, 9, 1);
    const ix = ex + (s < 0 ? 3 : 2);
    P(o.eyes, ix, 22 + drop, 5, 5);             // iris
    P(shade(o.eyes, -0.4), ix, 22 + drop, 5, 1);
    P(PAL.ink, ix + 1, 23 + drop, 3, 3);        // pupil
    P('#ffffff', ix + 1, 23 + drop, 1, 1);      // catchlight
    P(skD, ex, 27 + drop, 9, 1);                // lower lid
    // brow
    for (let k = 0; k < 12; k++) {
      const tilt = sour ? (s < 0 ? Math.round(k * 0.34) : Math.round((11 - k) * 0.34))
                        : glad ? (s < 0 ? Math.round((11 - k) * 0.2) : Math.round(k * 0.2)) : 0;
      P(hrD, ex - 2 + k, 15 + tilt, 1, 3);
    }
  }

  /* nose -- a bridge and a tip, not a smudge */
  P(skM, -2, 24, 4, 10);
  P(skD, 1, 26, 2, 8);
  P(PAL.ink, -5, 33, 11, 3);
  P(skin, -4, 33, 9, 2);
  P(shade(skin, 0.14), -3, 33, 5, 1);
  P(skX, -5, 34, 2, 2); P(skX, 3, 34, 2, 2);    // nostrils

  /* mouth -- corners are what carry the expression */
  const my = 39;
  P(PAL.ink, -9, my, 19, 2);
  if (o.lips) {
    P('#b8506f', -8, my, 17, 3);
    P('#d4708c', -7, my, 15, 1);
    P(shade('#b8506f', -0.35), -7, my + 2, 15, 1);
  } else {
    P(skX, -8, my, 17, 1);
    P(skM, -7, my + 1, 15, 1);
  }
  for (const s of [-1, 1]) {                    // corners turn with the mood
    const dy = sour ? -1 : glad ? 1 : 0;
    P(PAL.ink, s < 0 ? -10 : 8, my + 1 - dy, 2, 2);
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
  if (o.bigHair) {
    for (let r = -7; r < 34; r++) {
      const base = HEAD[Math.max(0, Math.min(N - 1, r))];
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
      const hw = HEAD[Math.max(0, r)] + 2;
      P(PAL.ink, -hw - 1, r, hw * 2 + 2, 1);
      P(hair, -hw, r, hw * 2, 1);
    }
    P(hrD, -16, 9, 32, 2);                      // hairline
    for (let k = 0; k < 9; k++) P(hair, -HEAD[14] - 2, 12 + k, 4, 1);
    for (let k = 0; k < 9; k++) P(hair, HEAD[14] - 2, 12 + k, 4, 1);
    for (let i = 0; i < 18; i++) {               // texture, not a pale cap
      const a = -18 + rng.int(36);
      P(rng.chance(0.5) ? shade(hair, 0.16) : shade(hair, -0.20), a, -2 + rng.int(10), 3, 2);
    }
  }
  for (let i = 0; i < 6; i++)                   // a little skin texture
    P(skM, -14 + rng.int(28), 28 + rng.int(8), 2, 1);
}

