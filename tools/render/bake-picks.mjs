/* Part of the headless render harness -- see tools/render/README.md.
   Zero dependencies, Node built-ins only.
   --------------------------------------------------------------
   bake-picks.mjs -- the owner's picks off the art sheets, baked as customer faces.

       node tools/render/bake-picks.mjs            # every pick in casting-picks.json
       node tools/render/bake-picks.mjs --dry      # crops and keys only, writes nothing

   Reads reference/assets/casting-picks.json (the Casting Call review, 2026-11-08).
   For each pick ("action": "pick") on a decade sheet in reference/assets/images/:

   1. CROP by the sheet's grid. The 5x2 grid is found from the white name labels;
      the crop is 0.74 of the sheet's row pitch tall and starts at the crown (top
      of hair or hat). That scale was calibrated against the six '70s faces baked
      from Set 1 (91% silhouette overlap), and the sheets' cells differ by up to
      12%, so sizing from each sheet's own pitch keeps heads the same size.
   2. TONE-MATCH ("Matched", which the owner chose for all): measured after the
      same reduction the bake does, then a gentle shift toward the decade's
      reference faces -- brightness by at most 18 levels, contrast 0.9-1.15x,
      saturation 0.85-1.2x.
   3. KEY BY FLOOD. The sheets' background is exactly 0,0,0 and dark hair is 1-10
      per channel, so a colour tolerance deletes afros and black hats. Only black
      connected to the crop's edge becomes transparent. The crop is written as
      RGBA with transparent pixels magenta, so bake-face's corner-colour key is
      magenta and cannot touch the subject.
   4. BAKE with bake-face.mjs (MAXW=60 MAXH=74, the bust size), which writes
      content/faces/<key>.json, detects eyes and round-trips the result.
   5. CAST: adds the key to its era in content/casts.json and its first year to
      casts.json's "from", and records the key on the pick as "bakedAs".

   The proof the owner approved was rendered from the same steps (Face proofs tab
   of the review page). Keys: c<decade><label>, de-duplicated with a digit.
*/
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readPNG } from './png-read.mjs';
import { reduceHead } from './reduce.mjs';
import { Canvas, writePNG } from './px.mjs';
import { L64 } from '../../reference/kitchen/facedata.mjs';
import { formatJSON } from '../content/format.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const DRY = process.argv.includes('--dry');
const PICKS = join(ROOT, 'reference', 'assets', 'casting-picks.json');
const SHEETS = join(ROOT, 'reference', 'assets', 'images');
const MAXW = 60, MAXH = 74, INK = '#1b1425';

/* ---------- the sheet's grid ---------- */
export function labelRows(img) {
  const { width: w, height: h, data } = img, rows = [];
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = 0; x < w; x += 2) { const i = (y * w + x) * 4; if (data[i] > 215 && data[i + 1] > 215 && data[i + 2] > 215) n++; }
    rows.push(n);
  }
  const bands = []; let s = null;
  for (let y = 0; y < h; y++) {
    if (rows[y] > 15 && s === null) s = y;
    if (rows[y] <= 15 && s !== null) { if (y - s >= 8 && y - s <= 30) bands.push({ y: (s + y) >> 1, top: s, n: rows.slice(s, y).reduce((a, b) => a + b, 0) }); s = null; }
  }
  const top = bands.filter((b) => b.y < h * 0.55).sort((a, b) => b.n - a.n)[0];
  const bot = bands.filter((b) => b.y >= h * 0.55).sort((a, b) => b.n - a.n)[0];
  if (!top || !bot) throw new Error('could not find the two label rows');
  return [top, bot];
}
export function cellCrop(img, labels, row, col) {
  const pitch = labels[1].y - labels[0].y;
  const cw = img.width / 5, x0 = Math.round(col * cw), x1 = Math.round((col + 1) * cw);
  const H = Math.round(pitch * 0.74);
  const yStart = row === 0 ? 0 : labels[0].top + 30, mx0 = Math.round(x0 + cw * 0.2), mx1 = Math.round(x1 - cw * 0.2);
  let crown = yStart;
  for (let y = yStart; y < labels[row].top; y++) {
    let n = 0;
    for (let x = mx0; x < mx1; x++) { const i = (y * img.width + x) * 4; if (img.data[i] + img.data[i + 1] + img.data[i + 2] > 24) n++; }
    if (n > 4) { crown = y; break; }
  }
  const bottom = Math.min(labels[row].top - 8, crown - Math.round(pitch * 0.012) + H);
  let minx = x1, maxx = x0;
  for (let y = bottom - H; y < bottom; y += 2) for (let x = x0 + 2; x < x1 - 2; x++) {
    const i = (y * img.width + x) * 4;
    if (img.data[i] + img.data[i + 1] + img.data[i + 2] > 60) { if (x < minx) minx = x; if (x > maxx) maxx = x; }
  }
  const cx = (minx + maxx) / 2;
  const W = Math.min(x1 - x0 - 4, Math.round(H * (MAXW / MAXH)));
  const x = Math.max(x0 + 2, Math.min(Math.round(cx - W / 2), x1 - 2 - W));
  return [x, bottom - H, W, H];
}

/* ---------- tone ---------- */
export function stats(px) {
  let L = 0, L2 = 0, S = 0, c = 0;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const l = 0.299 * r + 0.587 * g + 0.114 * b, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    L += l; L2 += l * l; S += mx ? (mx - mn) / mx : 0; c++;
  }
  const m = L / c; return { mean: m, sd: Math.sqrt(Math.max(1, L2 / c - m * m)), sat: S / c };
}
function toneMatch(img, [x, y, w, h], target, rawStats) {
  const out = { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
  const tmp = new Uint8ClampedArray(w * h * 4);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const s = ((y + j) * img.width + x + i) * 4, d = (j * w + i) * 4;
    tmp[d] = img.data[s]; tmp[d + 1] = img.data[s + 1]; tmp[d + 2] = img.data[s + 2];
    tmp[d + 3] = img.data[s] + img.data[s + 1] + img.data[s + 2] > 54 ? 255 : 0;
  }
  const st = stats(tmp);
  const k = Math.max(0.9, Math.min(1.15, target.sd / rawStats.sd));
  const sk = Math.max(0.85, Math.min(1.2, target.sat / Math.max(0.05, rawStats.sat)));
  const shift = Math.max(-18, Math.min(18, target.mean - rawStats.mean));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const s = ((y + j) * img.width + x + i) * 4;
    let r = img.data[s], g = img.data[s + 1], b = img.data[s + 2];
    if (r + g + b <= 54) continue;
    const l = 0.299 * r + 0.587 * g + 0.114 * b, nl = (l - st.mean) * k + st.mean + shift;
    const f = l > 1 ? nl / l : 1;
    r *= f; g *= f; b *= f;
    const m = (r + g + b) / 3;
    r = m + (r - m) * sk; g = m + (g - m) * sk; b = m + (b - m) * sk;
    out.data[s] = Math.max(60, r); out.data[s + 1] = g; out.data[s + 2] = b;
    if (out.data[s] + out.data[s + 1] + out.data[s + 2] <= 54) out.data[s] = 60;
  }
  return out;
}
export function keyByFlood(img, [x, y, w, h]) {
  const out = { width: img.width, height: img.height, data: new Uint8ClampedArray(img.data) };
  const seen = new Uint8Array(w * h), stack = [];
  const black = (i, j) => { const k = ((y + j) * img.width + x + i) * 4; return out.data[k] + out.data[k + 1] + out.data[k + 2] === 0; };
  for (let i = 0; i < w; i++) stack.push(i, 0, i, h - 1);
  for (let j = 0; j < h; j++) stack.push(0, j, w - 1, j);
  while (stack.length) {
    const j = stack.pop(), i = stack.pop();
    if (i < 0 || j < 0 || i >= w || j >= h || seen[j * w + i] || !black(i, j)) continue;
    seen[j * w + i] = 1;
    out.data[((y + j) * img.width + x + i) * 4 + 3] = 0;
    stack.push(i + 1, j, i - 1, j, i, j + 1, i, j - 1);
  }
  return out;
}
/* the crop as its own RGBA image, transparent pixels magenta (see 3. above) */
export function cropOut(img, [x, y, w, h]) {
  const c = new Canvas(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const s = ((y + j) * img.width + x + i) * 4, d = (j * w + i) * 4;
    if (img.data[s + 3] < 128) { c.data[d] = 255; c.data[d + 1] = 0; c.data[d + 2] = 255; c.data[d + 3] = 0; }
    else { c.data[d] = img.data[s]; c.data[d + 1] = img.data[s + 1]; c.data[d + 2] = img.data[s + 2]; c.data[d + 3] = 255; }
  }
  return c;
}

/* a baked face's pixels as RGBA, straight from its palette and runs */
function facePixels(f) {
  const out = new Uint8ClampedArray(f.w * f.h * 4);
  let p = 0;
  for (let i = 0; i < f.pix.length; i += 2) {
    const n = L64.indexOf(f.pix[i + 1]);
    if (f.pix[i] !== '.') {
      const c = f.pal[parseInt(f.pix[i], 16)], r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
      for (let k = p; k < p + n; k++) { out[k * 4] = r; out[k * 4 + 1] = g; out[k * 4 + 2] = b; out[k * 4 + 3] = 255; }
    }
    p += n;
  }
  return out;
}

/* ---------- keys ---------- */
const DEC = { 1: '70', 2: '80', 3: '90' };
function keyFor(p, taken) {
  const slug = p.label.toLowerCase().replace(/^(70s|80s|90s)\s+/, '').replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'face';
  let k = 'c' + DEC[p.decade] + slug, n = 2;
  while (taken.has(k)) k = 'c' + DEC[p.decade] + slug.slice(0, 17) + n++;
  taken.add(k);
  return k;
}

async function main() {
  const doc = JSON.parse(readFileSync(PICKS, 'utf8'));
  const picks = doc.decisions.filter((d) => d.action === 'pick');
  const facesDir = join(ROOT, 'content', 'faces');
  const existing = readdirSync(facesDir).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
  const ours = new Set(picks.map((p) => p.bakedAs).filter(Boolean));
  const taken = new Set(existing.filter((k) => !ours.has(k)));
  for (const p of picks) { if (p.bakedAs) taken.add(p.bakedAs); }
  for (const p of picks) if (!p.bakedAs) p.bakedAs = keyFor(p, taken);

  /* the decade's reference: the faces that were in the game before the picks */
  const casts = JSON.parse(readFileSync(join(ROOT, 'content', 'casts.json'), 'utf8'));
  const target = {};
  for (const era of [1, 2, 3]) {
    const refs = (casts[era] || []).filter((k) => !ours.has(k) && !picks.some((p) => p.bakedAs === k));
    const acc = refs.map((k) => stats(facePixels(JSON.parse(readFileSync(join(facesDir, k + '.json'), 'utf8')))));
    target[era] = { mean: acc.reduce((a, s) => a + s.mean, 0) / acc.length, sd: acc.reduce((a, s) => a + s.sd, 0) / acc.length, sat: acc.reduce((a, s) => a + s.sat, 0) / acc.length };
  }

  const tmp = join(tmpdir(), 'taco-shop-picks');
  mkdirSync(tmp, { recursive: true });
  const bySheet = new Map();
  for (const p of picks) { if (!bySheet.has(p.file)) bySheet.set(p.file, []); bySheet.get(p.file).push(p); }
  let n = 0;
  for (const [file, ps] of bySheet) {
    const img = readPNG(join(SHEETS, file));
    const labels = labelRows(img);
    for (const p of ps) {
      const crop = cellCrop(img, labels, p.row - 1, p.col - 1);
      const opt = { maxW: MAXW, maxH: MAXH, colours: 15, ink: INK, opaque: true };
      const raw = reduceHead(keyByFlood(img, crop), crop, opt).cv;
      const keyed = keyByFlood(toneMatch(img, crop, target[p.decade], stats(raw.data)), crop);
      p.crop = crop;
      console.log(`${String(++n).padStart(3)} ${p.bakedAs.padEnd(22)} ${p.label.padEnd(22)} ${file} r${p.row}c${p.col} crop ${crop.join(',')}`);
      if (DRY) continue;
      const png = join(tmp, p.bakedAs + '.png');
      writePNG(cropOut(keyed, crop), png);
      execFileSync(process.execPath, [join(HERE, 'bake-face.mjs'), p.bakedAs, png], { env: { ...process.env, MAXW: String(MAXW), MAXH: String(MAXH) }, stdio: ['ignore', 'pipe', 'inherit'] });
    }
  }
  if (DRY) return;

  /* cast them: each in its era, with its first year */
  const from = casts.from && typeof casts.from === 'object' ? casts.from : {};
  for (const p of picks) {
    const era = String(p.decade);
    if (!casts[era].includes(p.bakedAs)) casts[era].push(p.bakedAs);
    from[p.bakedAs] = p.firstYear;
  }
  /* the owner also moved some existing faces later ("keep" with a year) */
  for (const d of doc.decisions.filter((d) => d.action === 'keep' && d.faceKey && d.firstYear)) from[d.faceKey] = d.firstYear;
  /* a face whose first year is its era's first level needs no entry */
  const levels = JSON.parse(readFileSync(join(ROOT, 'content', 'levels.json'), 'utf8')).levels;
  for (const [k, y] of Object.entries(from)) {
    const era = Object.keys(casts).find((e) => /^\d+$/.test(e) && casts[e].includes(k));
    const first = Math.min(...levels.filter((l) => String(l.era) === era).map((l) => l.year));
    if (y === first) delete from[k];
  }
  casts.from = from;
  casts._comment = "The customers' faces per era: Kitchen.castFor(era, year) picks from this list. Each name is a file in content/faces/ (without .json). Every era a level uses needs at least one face at its first level. \"from\" is the year a face first appears (none = the era's first level), so the crowd grows level by level. Edited in Service Mode (Faces); faces.md mirrors it.";
  writeFileSync(join(ROOT, 'content', 'casts.json'), formatJSON(casts));
  writeFileSync(PICKS, JSON.stringify(doc, null, 1));
  console.log(`baked ${n}; casts.json: ${Object.keys(casts).filter((k) => /^\d+$/.test(k)).map((k) => `era ${k} ${casts[k].length}`).join(', ')}, ${Object.keys(from).length} with a first year`);
}
if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase()) await main();
