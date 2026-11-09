/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   eyes-proof.mjs -- the owner's proof of the hand-set eyes.

       node build.mjs && node tools/render/eyes-proof.mjs

   Every new face (the owner's picks in reference/assets/casting-picks.json,
   by decade) and then the nine cast, each drawn twice at 3x -- open, then
   blinking -- through the game's own Faces.draw, so what the owner signs off
   is exactly what ships. Each face is labelled with its key; a face with no
   eye rects says so, and a face whose rects were a judgement call carries an
   amber dot (UNSURE below, from the three passes' reports).

   It reads the BUILT content (src/05_content.js), so run node build.mjs
   first. It refuses to draw if the build is older than content/faces/.

   Writes reference/faces/eyes-proof-1.png ... -N.png, a few decades a page,
   so no image is much over 2500px on a side.
*/
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Canvas, writePNG } from './px.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const SRC = join(REPO, 'src');
const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort().filter((f) => f !== '90_main.js');
const code = files.map((f) => `\n//# ${f}\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

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
vm.runInContext(code + '\n;globalThis.__x = { G, Faces, FACES, text, textW, PAL };', sandbox, { filename: 'bundle.js' });
const { G, Faces, FACES, text, textW, PAL } = sandbox.__x;
G.boot(1972);
Faces.build();

/* the faces, in order: the picks by decade, then the cast */
const picks = JSON.parse(readFileSync(join(REPO, 'reference', 'assets', 'casting-picks.json'), 'utf8')).decisions
  .filter((d) => d.action === 'pick' && d.bakedAs);
const DECADES = [[1, '1970S'], [2, '1980S'], [3, '1990S']];
const groups = DECADES.map(([d, label]) => ({ label, keys: picks.filter((p) => p.decade === d).map((p) => p.bakedAs) }));
groups.push({ label: 'CAST', keys: ['70', '80', '90'].flatMap((y) => ['cop' + y, 'rival' + y, 'staff' + y]) });

/* rects that were a judgement call, from the pass reports
   (.superpowers/sdd/2026-11-08-0.9.3/task-7-pass-{1,2,3}-report.md) */
const UNSURE = new Set([
  'c70easyrider', 'c70stonerdude', 'c70beekeeper', 'c70taxman', 'staff70',
  'c80heavymetaldude', 'c80newwaveguy2', 'c80miamigirl', 'rival80', 'staff80', 'c80newwaveguy', 'c80metalhead',
  'c90girlpowerfan', 'c90sk8terchick', 'c90teenmom', 'c90dopeybuddy', 'c90ravergirl', 'c90raver', 'staff90',
]);

/* the build has to be current, or the proof shows yesterday's eyes */
for (const g of groups) for (const k of g.keys) {
  const f = FACES[k];
  if (!f) throw new Error(`${k} is not in the build -- run node build.mjs`);
  const j = JSON.parse(readFileSync(join(REPO, 'content', 'faces', k + '.json'), 'utf8'));
  if (JSON.stringify(j.eyes) !== JSON.stringify(f.eyes) || j.skin !== f.skin)
    throw new Error(`${k}: the build differs from content/faces -- run node build.mjs`);
}

const Z = 3, FW = 60, FH = 74, PAD = 2, GAP = 14;
const PAIR = 2 * FW * Z + PAD;                  // open | blink
const CELLW = PAIR + GAP, CELLH = FH * Z + 26;  // the face pair, then its label
const COLS = 6, M = 16, HEAD = 26;
const BG = '#201a2c', BACK = '#2a2438';         // page; the dialogue strip's portrait backing

/* pages: whole decade groups, packed while the page stays under ~2500px */
const pages = [];
let page = [], h = M;
for (const g of groups) {
  const gh = HEAD + Math.ceil(g.keys.length / COLS) * CELLH;
  if (page.length && h + gh > 2500) { pages.push(page); page = []; h = M; }
  page.push(g); h += gh;
}
pages.push(page);

const face = (k, blink) => {
  const t = new Canvas(FW, FH), x = t.getContext('2d');
  x.fillStyle = BACK; x.fillRect(0, 0, FW, FH);
  Faces.draw(x, k, FW >> 1, 0, { blink: blink ? 1 : 0 });
  return t;
};
const blit = (c, src, dx, dy) => {
  for (let y = 0; y < src.height * Z; y++) for (let x = 0; x < src.width * Z; x++) {
    const si = (((y / Z) | 0) * src.width + ((x / Z) | 0)) * 4, di = ((dy + y) * c.width + dx + x) * 4;
    c.data[di] = src.data[si]; c.data[di + 1] = src.data[si + 1]; c.data[di + 2] = src.data[si + 2]; c.data[di + 3] = 255;
  }
};

const totals = { set: 0, none: 0, unsure: 0 };
pages.forEach((groupsOnPage, pi) => {
  const H = M + groupsOnPage.reduce((s, g) => s + HEAD + Math.ceil(g.keys.length / COLS) * CELLH, 0);
  const c = new Canvas(M * 2 + COLS * CELLW - GAP, H), x = c.getContext('2d');
  x.fillStyle = BG; x.fillRect(0, 0, c.width, c.height);
  let y = M;
  for (const g of groupsOnPage) {
    text(x, g.label, M, y + 4, PAL.gold, 2);
    text(x, 'OPEN / BLINK, 3X, THROUGH FACES.DRAW', M + textW(g.label, 2) + 12, y + 8, PAL.boneDim, 1);
    y += HEAD;
    g.keys.forEach((k, i) => {
      const cx = M + (i % COLS) * CELLW, cy = y + ((i / COLS) | 0) * CELLH;
      blit(c, face(k, 0), cx, cy);
      blit(c, face(k, 1), cx + FW * Z + PAD, cy);
      const none = !FACES[k].eyes.length;
      text(x, k, cx, cy + FH * Z + 4, PAL.bone, 1);
      if (none) text(x, 'NO EYES (SUNGLASSES)', cx, cy + FH * Z + 14, PAL.red || '#e04040', 1);
      if (UNSURE.has(k)) {
        x.fillStyle = PAL.amber;
        x.fillRect(cx + textW(k, 1) + 5, cy + FH * Z + 4, 7, 7);
      }
      totals[none ? 'none' : 'set']++;
      if (UNSURE.has(k)) totals.unsure++;
    });
    y += Math.ceil(g.keys.length / COLS) * CELLH;
  }
  const out = join(REPO, 'reference', 'faces', `eyes-proof-${pi + 1}.png`);
  writePNG(c, out);
  console.log('wrote', out, c.width + 'x' + c.height, groupsOnPage.map((g) => g.label).join(' + '));
});
console.log(`faces ${totals.set + totals.none}: eyes set ${totals.set}, no eyes ${totals.none}, unsure ${totals.unsure}`);
