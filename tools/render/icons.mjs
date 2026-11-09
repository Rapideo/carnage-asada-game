/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only, so the repo stays dependency-free.
   --------------------------------------------------------------
   icons.mjs -- the home-screen icons for the Netlify install, drawn from
   the game's own badge art (Art.mkBadge, the title screen's shop sticker).

       node tools/render/icons.mjs

   Writes deploy/icon-192.png and deploy/icon-512.png. They sit beside the
   deployed index.html with deploy/manifest.webmanifest (RESUME.md's deploy
   steps) and never ship in taco-shop.html: the single file stays free of
   external requests.

   The field is the page's own #120d1a, full bleed, so the icon also works as
   a maskable one: the badge is kept inside the central 80% circle a launcher
   may crop to. A non-integer nearest-neighbour scale left the rings visibly
   uneven, so the badge is drawn at a whole 10x and box-filtered down to size:
   the pixels stay square to the eye and the rims stay round.
*/
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { E, Canvas } from './engine.mjs';
import { writePNG } from './px.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(REPO, 'deploy');
mkdirSync(OUT, { recursive: true });

const badge = E.Art.mkBadge();                 // 108x108, transparent outside the rim
const FIELD = '#120d1a', SAFE = 0.78;          // the badge's share of the icon's width
const K = 10;                                  // the whole-number scale it is drawn at first

/* the big one: the badge at K x, centred on a field it fills SAFE of */
const big = Math.round(badge.width * K / SAFE);
const hi = new Canvas(big, big), hx = hi.getContext('2d');
hx.fillStyle = FIELD; hx.fillRect(0, 0, big, big);
const o = Math.round((big - badge.width * K) / 2);
hx.drawImage(badge, 0, 0, badge.width, badge.height, o, o, badge.width * K, badge.height * K);

/* area-average resample: each output pixel is the mean of the source area it covers */
function shrink(src, size) {
  const out = new Canvas(size, size), r = src.width / size, d = src.data, w = src.width;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const x0 = x * r, x1 = x0 + r, y0 = y * r, y1 = y0 + r;
    const acc = [0, 0, 0, 0]; let n = 0;
    for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
      const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
      for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
        const wt = wy * (Math.min(x1, sx + 1) - Math.max(x0, sx)), i = (sy * w + sx) * 4;
        for (let c = 0; c < 4; c++) acc[c] += d[i + c] * wt;
        n += wt;
      }
    }
    const j = (y * size + x) * 4;
    for (let c = 0; c < 4; c++) out.data[j + c] = Math.round(acc[c] / n);
  }
  return out;
}

for (const size of [192, 512]) {
  const path = join(OUT, `icon-${size}.png`);
  writePNG(shrink(hi, size), path);
  console.log(`icon ${size}x${size} -> ${path} (badge ${Math.round(size * SAFE)}px)`);
}
