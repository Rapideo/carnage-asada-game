/* TEST ARTEFACT -- NOT A DECISION

   Renders a real frame of the SHIPPED Delivery Shift to a PNG, so the kitchen
   mockups can be judged against the actual game rather than against a memory
   of it. Loads every module in src/ the way build.mjs concatenates them, boots
   the game, starts a shift, drives a few hundred fixed steps, and renders.

   This is the honest normalisation test: same renderer, same post pass, same
   scale -- so any difference in the two images is a real difference in the
   art, not an artefact of how they were captured. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, writePNG, upscale } from './px.mjs';
import { drawDialog } from '../../reference/kitchen/dialog.mjs';
import { dirname as _d, join as _j } from 'node:path';
import { fileURLToPath as _f } from 'node:url';
const OUT = (n) => _j(_d(_f(import.meta.url)), n);   // write beside this file

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort()
  .filter((f) => f !== '90_main.js');            // its boot IIFE would race us
const code = files.map((f) => `\n//# ${f}\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

const noop = () => {};
const sandbox = {
  document: {
    createElement: (t) => (t === 'canvas' ? new Canvas(1, 1) : { style: {} }),
    getElementById: () => new Canvas(1, 1),
  },
  window: { addEventListener: noop, innerWidth: 1440, innerHeight: 800 },
  addEventListener: noop, removeEventListener: noop,
  performance: { now: () => 0 },
  requestAnimationFrame: noop,
  setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, isNaN,
  parseInt, parseFloat, Float32Array, Int32Array, Int16Array, Int8Array,
  Uint8Array, Uint16Array, Uint8ClampedArray,
  location: { search: '' }, URLSearchParams,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__x = { G, City, Nav, Art, Input, VW, VH, Post, PAL };',
  sandbox, { filename: 'bundle.js' });

const { G, VW, VH, Input, PAL } = sandbox.__x;

const c = new Canvas(VW, VH);
const ctx = c.getContext('2d');
G.boot(1972);            // boot takes a seed, not a context
G.startShift();

/* drive forward so the frame has traffic, a live order and a moving camera */
const STEPS = Number(process.argv[2] || 260);
Input.down['KeyW'] = true;
for (let i = 0; i < STEPS; i++) {
  if (i === 90) Input.down['KeyD'] = true;
  if (i === 120) Input.down['KeyD'] = false;
  G.update(1 / 60);
  Input.endFrame();
}
G.render(ctx);           // ...render takes the context

if (process.argv.includes('--dialog')) {
  drawDialog(ctx, {
    who: 'DRIVER',
    line: "THAT'S THE THIRD TIME YOU'VE PASSED MY HOUSE.",
    sub: '629 OAK ST  -  WAITING 41s',
    meter: 0.28, hostile: 1,
    face: { skin: '#c98d63', hair: '#3a2a1e', eyes: '#3a5a3a', shirt: PAL.roofE,
            bigHair: 1, lips: 1, mood: 'sour', seed: 19 },
  });
  writePNG(c, OUT('drive-dialog.png'));
  writePNG(upscale(c, 3), OUT('drive-dialog-x3.png'));
  console.log('rendered the shared dialogue over a live driving frame');
} else {
  writePNG(c, OUT('drive.png'));
  writePNG(upscale(c, 3), OUT('drive-x3.png'));
}
console.log(`rendered a live Delivery Shift frame after ${STEPS} steps`);
console.log(`  state ${G.state}  shift ${G.shift.toFixed(1)}s  earned ${G.earned}c`);
