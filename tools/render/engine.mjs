/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   -------------------------------------------------------------- */
/* Loads the game's REAL modules against the software canvas, so the mockup
   uses the shipped palette, the shipped 5x7 font, the shipped display face,
   the shipped panel chrome and the shipped CRT pass -- not a copy of any of
   them. Same trick test/headless.mjs uses: plain scripts concatenated in
   filename-sort order, bindings handed out from inside the lexical scope.

   Only the modules whose top level is side-effect free are loaded
   (00/10/30/70). Post lives at the bottom of 80_game.js and is sliced out by
   text so it stays byte-identical to what ships. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { Canvas } from './px.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const S = (f) => readFileSync(join(REPO, 'src', f), 'utf8');

const game80 = S('80_game.js');
const cut = game80.indexOf('/* ---------------- CRT-ish post');
if (cut < 0) throw new Error('could not find the Post block in 80_game.js');
const post = game80.slice(cut);

const code = [
  '//# 00_core.js\n' + S('00_core.js'),
  '//# 10_font.js\n' + S('10_font.js'),
  '//# 30_art.js\n'  + S('30_art.js'),
  '//# 70_hud.js\n'  + S('70_hud.js'),
  '//# 80_game.js (Post only)\n' + post,
].join('\n');

const noop = () => {};
const sandbox = {
  document: { createElement: (t) => (t === 'canvas' ? new Canvas(1, 1) : { style: {} }) },
  window: { addEventListener: noop },
  addEventListener: noop,
  console, Math, Date, JSON, Object, Array, String, Number, Boolean,
  Float32Array, Int32Array, Uint8Array, Uint8ClampedArray, isNaN, parseInt, parseFloat,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(code + `
;globalThis.__x = { VW, VH, PAL, CAR_COLORS, clamp, lerp, R, mkCanvas, makeRng,
  FW, FH, GLYPH, textW, text, textOut, drawRun, money, clockStr,
  LOGO, LOGO_W, LOGO_H, logoW, logoText, keyline, disc, shade,
  SPILL, BAG_MID, BAG_HI, BAG_LO, BAG_FOLD, Art, Hud, Post, MM };`,
  sandbox, { filename: 'bundle.js' });

export const E = sandbox.__x;
export { Canvas };
