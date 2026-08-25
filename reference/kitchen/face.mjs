/* TEST ARTEFACT -- NOT A DECISION

   A rig for iterating on the dialogue portrait alone. Renders the cast at
   native size and again at 6x, so the whole point -- does this read as a
   person -- can be judged without rebuilding the scene each time.

   Why the head got bigger: at 21px across you have ~5px between the eyes and
   every feature is a 1px decision, which is where "silly" came from. This is
   44px, four times the area, so an eye can carry a lid, a white, an iris, a
   pupil and a catchlight instead of one 2x2 block.

   Three things are deliberately in this sheet at once:

   CLASSIC        the only face with a known-good look, so it is the canary:
                  a regression in the shared drawing code shows up here rather
                  than being inferred from the character you were working on.
   SMOKER / PARAM the likeness attempted through parameters. Kept because the
                  comparison argues the case better than any paragraph can.
   SMOKER         the baked likeness, plus the variation states on top of it.
*/
import { E, Canvas } from '../../tools/render/engine.mjs';
import { writePNG, upscale } from '../../tools/render/px.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file
const { PAL, R, text } = E;

import { portrait } from './portrait.mjs';
import { decodeFace, drawFace } from './facedata.mjs';
import { CAST, CLASSIC, SMOKER_PARAM, SMOKER_HEAD } from './cast.mjs';

/* decode once, the way the game would at boot */
const baked = new Map();
for (const [k, c] of Object.entries(CAST)) if (c.baked) baked.set(k, decodeFace(c.baked));
baked.set('head', decodeFace(SMOKER_HEAD.baked));

const sm = CAST.smoker;
const CASES = [
  { label: 'CLASSIC', draw: (x, cx, ty) => portrait(x, cx, ty, Object.assign({ headOnly: 1 }, CLASSIC)) },
  { label: 'PARAM', draw: (x, cx, ty) => portrait(x, cx, ty, Object.assign({ headOnly: 1 }, SMOKER_PARAM)) },
  { label: 'HEAD 46x54', draw: (x, cx, ty) => drawFace(x, baked.get('head'), SMOKER_HEAD.baked, cx, ty + 10, SMOKER_HEAD) },
  { label: 'BUST 60x74', draw: (x, cx, ty) => drawFace(x, baked.get('smoker'), sm.baked, cx, ty) },
  { label: 'BUST HOOD 3', draw: (x, cx, ty) => drawFace(x, baked.get('smoker'), sm.baked, cx, ty, { hood: 3 }) },
  { label: 'BUST BLINK', draw: (x, cx, ty) => drawFace(x, baked.get('smoker'), sm.baked, cx, ty, { blink: 1 }) },
];

/* head-only is how the dialogue strip actually shows them: the 56x56 box has
   no room for shoulders, so judging a bust here judges the wrong drawing */
const CW = 78, CH = 92;
const W = CASES.length * CW + 8, H = CH + 12;
const c = new Canvas(W, H), x = c.getContext('2d');
R(x, '#2a2634', 0, 0, W, H);
CASES.forEach((o, i) => {
  const px = 8 + i * CW;
  R(x, PAL.ink, px, 4, 70, 80);
  R(x, '#2a2438', px + 1, 5, 68, 78);
  for (let k = 0; k < 78; k += 3) R(x, '#31293f', px + 1, 5 + k, 68, 1);
  o.draw(x, px + 35, 8);
  text(x, o.label, px + 35, CH - 6, PAL.boneDim, 1, 1);
});
writePNG(c, OUT('faces.png'));
writePNG(upscale(c, 6), OUT('faces-x6.png'));
console.log(`rendered faces.png (${W}x${H}) and faces-x6.png (${W * 6}x${H * 6})`);
console.log('panels: ' + CASES.map((o) => o.label).join(', '));
