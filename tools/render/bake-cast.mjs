/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only.
   --------------------------------------------------------------
   bake-cast.mjs -- the nine speaking-cast portraits (officer, rival, coworker
   x three decades) baked as faces cop70 ... staff90.

       node tools/render/bake-cast.mjs

   Reads reference/faces/cast/crop-guide.json and the nine PNGs beside it. Each
   is cropped by its `bakeCrop`, keyed by flood from the crop's edge (the sheets'
   black ground is 0,0,0 and the caps and hair are 1-10 per channel, so a colour
   key would eat them; see bake-picks.mjs), then baked by bake-face.mjs at the
   bust size 60x74. Officers take the standard 15 body colours; rivals 14 plus
   their olive cactus accent; coworkers 13 plus jade and gold -- the colours the
   median cut would otherwise average away (README.md beside the art).
   The detector's eyes are cleared to []: it is unreliable on these sheets and
   the owner sets them by hand in Service Mode (a hand-set face keeps its eyes
   through a re-bake).
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readPNG } from './png-read.mjs';
import { writePNG } from './px.mjs';
import { keyByFlood, cropOut } from './bake-picks.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CAST = join(ROOT, 'reference', 'faces', 'cast');
const KEY = { police: 'cop', rival: 'rival', staff: 'staff' };

async function main() {
  const guide = JSON.parse(readFileSync(join(CAST, 'crop-guide.json'), 'utf8'));
  const tmp = join(tmpdir(), 'taco-shop-cast');
  mkdirSync(tmp, { recursive: true });
  for (const entry of Object.keys(guide)) {
    const m = /^(police|rival|staff)-(\d\d)s$/.exec(entry);
    if (!m) continue;
    const g = guide[entry], key = KEY[m[1]] + m[2];
    const img = readPNG(join(CAST, entry + '.png'));
    const crop = g.bakeCrop;
    const png = join(tmp, key + '.png');
    writePNG(cropOut(keyByFlood(img, crop), crop), png);
    const accents = g.accents || (g.accent ? [g.accent] : []);
    const env = { ...process.env, MAXW: '60', MAXH: '74', COLOURS: String(15 - accents.length) };
    delete env.ACCENTS;
    if (accents.length) {
      const f = join(tmp, key + '-accents.json');
      writeFileSync(f, JSON.stringify(accents));
      env.ACCENTS = f;
    }
    const out = execFileSync(process.execPath, [join(HERE, 'bake-face.mjs'), key, png], { env, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
    /* eyes cleared: set by hand later */
    const fj = join(ROOT, 'content', 'faces', key + '.json');
    const f = JSON.parse(readFileSync(fj, 'utf8'));
    if (!f._eyesByHand) { f.eyes = []; writeFileSync(fj, JSON.stringify(f, null, 2) + '\n'); }
    console.log(key.padEnd(8) + out.split('\n').filter((l) => /colours/.test(l)).join('').trim());
  }
}
if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) await main();
