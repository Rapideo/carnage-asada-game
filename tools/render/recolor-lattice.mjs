/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   recolor-lattice.mjs -- derive a new well from an existing baked one.

       node tools/render/recolor-lattice.mjs <SRC> <NAME> <hue> <sat> <val>

   Two Era 2 bins, SAUCE and CHILI, have no reference sheet. Drawing them by
   hand would put two code-drawn heaps beside ten baked ones, and the drawn
   heaps were exactly what the bake replaced (see kitchen.mjs, "The baked wells
   are the DEFAULT now"). So they are DERIVED: the pixel art stays the pixel
   art, and only the food palette moves.

     hue  degrees to rotate
     sat  saturation multiplier
     val  value multiplier

   Only food colours move. Steel is the pan, and a pan that changed colour
   between bins would be the first thing anyone noticed, so any entry with
   saturation under 0.18 is left alone. The ink keyline is left alone too.

   SAUCE  <- CCQ    a smooth wet field, so it reads as sauce rather than as a heap
   CHILI  <- BEANS  whole beans in a mass, which is what chili con carne is

   It never overwrites: a NAME that is already a file fails with EEXIST (exit
   2) and the file is left as it was. The baked wells stay as they are (owner,
   2026-11-07); to re-derive one, delete its file first, deliberately.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'content', 'lattice');
const [src, name, hue, sat, val] = process.argv.slice(2);
if (!src || !name) {
  console.error('usage: recolor-lattice.mjs <SRC> <NAME> <hue> <sat> <val>');
  process.exit(1);
}

const rec = JSON.parse(readFileSync(join(DIR, src.toLowerCase() + '.json'), 'utf8'));

const toHsv = (h) => {
  const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let H = 0;
  if (d) H = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(H * 60 + 360) % 360, mx ? d / mx : 0, mx];
};
const toHex = ([H, S, V]) => {
  const c = V * S, x = c * (1 - Math.abs(((H / 60) % 2) - 1)), m = V - c;
  const [r, g, b] = H < 60 ? [c, x, 0] : H < 120 ? [x, c, 0] : H < 180 ? [0, c, x]
    : H < 240 ? [0, x, c] : H < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round(Math.min(1, Math.max(0, v + m)) * 255).toString(16).padStart(2, '0')).join('');
};

let moved = 0;
rec.pal = rec.pal.map((h) => {
  if (h === rec.ink) return h;
  const [H, S, V] = toHsv(h);
  if (S < 0.18) return h;                       // steel: the pan never changes colour
  moved++;
  return toHex([(H + Number(hue) + 360) % 360, Math.min(1, S * Number(sat)), Math.min(1, V * Number(val))]);
});
rec.name = name.toUpperCase();
/* never over an existing well: the output is opened exclusively */
try { writeFileSync(join(DIR, name.toLowerCase() + '.json'), JSON.stringify(rec, null, 2) + '\n', { flag: 'wx' }); }
catch (e) {
  if (e.code !== 'EEXIST') throw e;
  console.error(`EEXIST: content/lattice/${name.toLowerCase()}.json already exists; nothing written (delete it first to re-derive)`);
  process.exit(2);
}
console.log(`${rec.name} <- ${src.toUpperCase()}: ${moved} of ${rec.pal.length} colours moved`);
