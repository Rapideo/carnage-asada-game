/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   frame.mjs -- a real frame of any level, to a PNG.

       node tools/render/frame.mjs <level> [seconds] [--card|--clear|--over|--pause|--title|--mode|--say] [--out name]

   Boots the shipped modules exactly as build.mjs concatenates them, points the
   game at <level> (1-20: era, season, map, menu, difficulty all follow), and
   lets the autoplayers run it for [seconds] -- Demo at the wheel for a
   delivery level, the kitchen's own cook for a kitchen level -- so the frame
   has traffic, tickets, a build in progress and money on the card. Then it
   renders through the real pipeline, CRT pass and era grade included.

   Writes tools/render/<out>.png and <out>-x3.png (default out: frame-L<level>).
*/
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Canvas, writePNG, upscale } from './px.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort().filter((f) => f !== '90_main.js');
const code = files.map((f) => `\n//# ${f}\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

const argv = process.argv.slice(2);
const flag = (n) => argv.includes('--' + n);
const val = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const nums = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1] === '--out'));
const LEVEL = Number(nums[0] || 2), SECS = Number(nums[1] || 12);
const OUT = val('out', 'frame-L' + LEVEL);

const noop = () => {};
const sandbox = {
  document: { createElement: (t) => (t === 'canvas' ? new Canvas(1, 1) : { style: {} }), getElementById: () => new Canvas(1, 1) },
  window: { addEventListener: noop, innerWidth: 1440, innerHeight: 800 },
  addEventListener: noop, removeEventListener: noop, performance: { now: () => 0 },
  requestAnimationFrame: noop, setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  console, Math, Date, JSON, Object, Array, String, Number, Boolean, isNaN, parseInt, parseFloat,
  Float32Array, Int32Array, Int16Array, Int8Array, Uint8Array, Uint16Array, Uint8ClampedArray,
  location: { search: '' }, URLSearchParams,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + '\n;globalThis.__x = { G, Kitchen, Input, Dialog, Demo, VW, VH };', sandbox, { filename: 'bundle.js' });
const { G, Kitchen, Input, Dialog, Demo, VW, VH } = sandbox.__x;

const c = new Canvas(VW, VH), ctx = c.getContext('2d');
const step = (n) => { for (let i = 0; i < n; i++) { G.update(1 / 60); Input.endFrame(); } };
G.boot(1972);

if (flag('title')) { G.toTitle(); step(60 * 4); }
else if (flag('mode')) { G.toMode(); step(10); }
else {
  G.toCard(LEVEL);
  if (!flag('card')) {
    G.beginShift();
    /* the autoplayers, in the real state so the real HUD draws */
    if (G.stage === 'kitchen') Kitchen.demo = true;
    const drive = G.stage === 'delivery';
    if (drive) { Demo.reset(G.player); G.attractT = 1e9; }
    for (let i = 0; i < SECS * 60; i++) {
      if (drive) G.state = 'demo';
      G.update(1 / 60); Input.endFrame();
      if (drive && G.state === 'demo') G.state = 'play';
      if (G.state !== 'play' && G.state !== 'kitchen') break;
    }
    if (G.stage === 'kitchen') Kitchen.demo = false;
    if (flag('clear')) G.levelClear();
    if (flag('over')) G.timeUp();
    if (flag('pause')) G.paused = true;
    if (flag('say')) {
      if (G.stage === 'kitchen') { Kitchen.barkT = 0; Kitchen.bark(G, 'wait', Kitchen.tickets[0], true, true); }
      else G.react('missed', G.order, true);
      for (let i = 0; i < 24; i++) Dialog.update(1 / 60);
    }
  }
}
G.render(ctx);
writePNG(c, join(HERE, OUT + '.png'));
writePNG(upscale(c, 3), join(HERE, OUT + '-x3.png'));
console.log(`L${LEVEL} ${G.level && G.level.name} ${G.stage} ${G.state}  earned ${G.earned}c  done ${G.done}  -> tools/render/${OUT}.png`);
