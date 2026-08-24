/* TEST ARTEFACT -- NOT A DECISION

   A rig for iterating on the dialogue portrait alone. Renders four faces side
   by side at native size and again at 6x, so the whole point -- does this read
   as a person -- can be judged without rebuilding the scene each time.

   Why the head got bigger: at 21px across you have ~5px between the eyes and
   every feature is a 1px decision, which is where "silly" comes from. This is
   44px, four times the area, so an eye can carry a lid, a white, an iris, a
   pupil and a catchlight instead of one 2x2 block. */
import { E, Canvas } from '../../tools/render/engine.mjs';
import { writePNG, upscale } from '../../tools/render/px.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file
const { PAL, R } = E;

import { portrait } from './portrait.mjs';

/* ---- the rig ---- */
const CASES = [
  { skin: '#eab98f', hair: '#d9a340', eyes: '#4a7fb5', shirt: '#c4557e', bigHair: 1, lips: 1, mood: 'sour', seed: 3 },
  { skin: '#9a6440', hair: PAL.trunk, eyes: '#5a3a22', shirt: PAL.roofB, moustache: 1, mood: 'flat', seed: 7 },
  { skin: '#d9a273', hair: '#6b4630', eyes: '#4a7fb5', shirt: PAL.roofC, mood: 'glad', seed: 11 },
  { skin: '#c98d63', hair: '#3a2a1e', eyes: '#3a5a3a', shirt: PAL.roofE, bigHair: 1, lips: 1, mood: 'flat', seed: 19 },
];

const W = 4 * 74 + 8, H = 82;
const c = new Canvas(W, H), x = c.getContext('2d');
R(x, '#2a2634', 0, 0, W, H);
CASES.forEach((o, i) => {
  const px = 8 + i * 74;
  R(x, PAL.ink, px, 6, 66, 70);
  R(x, '#4a3524', px + 1, 7, 64, 68);
  portrait(x, px + 33, 12, o);
});
writePNG(c, OUT('faces.png'));
writePNG(upscale(c, 6), OUT('faces-x6.png'));
console.log('rendered face.png (' + W + 'x' + H + ') and face-x6.png');
