/* inline every src module into a single self-contained page */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src';

/* ---- content ------------------------------------------------------------
   Authored copy lives in content/*.json but is INLINED here, not fetched at
   runtime: the published artifact runs under a CSP that blocks external
   requests, and fetch() on a file:// page is blocked by CORS, so a runtime
   load would leave the screen blank exactly where it matters most. Generating
   a module into src/ means the dev page picks it up too, with no second path. */

// mirrors the glyph table in src/10_font.js — anything else draws as a gap
const FONT_CHARS = /^[A-Z0-9 .,:;!?$+\-/\\%#()[\]*=<>'"_&@^~]*$/;

// the virtual screen, and the scale each field is drawn at in overlayWinners
const VW = 384, EDGE = 8;
const FIELD_SCALE = { slogan: 2, attribution: 1, credit: 1 };
const textPx = (s, k) => (s.length ? s.length * 6 - 1 : 0) * k;

function buildContent() {
  const raw = JSON.parse(readFileSync(join('content', 'winners.json'), 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;                       // notes to the author
    const list = Array.isArray(v) ? v : [v];
    const scale = FIELD_SCALE[k] || 1;
    for (const s of list) {
      if (typeof s !== 'string') throw new Error(`content/winners.json: "${k}" must be a string or array of strings`);
      const up = s.toUpperCase();
      if (!FONT_CHARS.test(up)) {
        const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
        throw new Error(`content/winners.json: "${k}" uses characters the 5x7 font cannot draw: ${bad}`);
      }
      // Width matters as much as charset: the copy is centred on a 384px
      // screen, so an over-long line silently runs off BOTH edges. The note in
      // the JSON said so, but a note is not a guard.
      const w = textPx(up, scale);
      if (w > VW - EDGE) {
        const max = Math.floor((VW - EDGE) / scale / 6);
        throw new Error(
          `content/winners.json: "${k}" is ${w}px wide at scale ${scale}, but the screen is ${VW}px.\n` +
          `  ${JSON.stringify(s)} is ${s.length} characters; the limit at this scale is ${max}.\n` +
          `  Trim ${s.length - max} character${s.length - max === 1 ? '' : 's'}, or split it across the array.`);
      }
    }
    out[k] = v;
  }
  for (const need of ['slogan', 'attribution', 'credit']) {
    if (!(need in out)) throw new Error(`content/winners.json is missing "${need}"`);
  }
  return out;
}

/* ---- the city map -------------------------------------------------------
   Same contract as the copy above: authored in content/, inlined here, and
   rejected loudly rather than shipped broken. */
const BLOCKS = 8;                    // mirrors src/00_core.js
const KINDS = ['res', 'com', 'park', 'lot', 'shop', 'retail', 'civic', 'apts', 'church', 'auto', 'rail'];
const CARD_TEXT_PX = 135;            // order card: 140 wide at x=3, text inset to x=8, 3px pad

/* Mirrors the address rule in 40_city.js genResidential. The widest number a
   house can carry is hundred + 22 + 7, so this is the true worst case, not a
   sample. */
function worstAddress(city) {
  let worst = '';
  const keep = (s) => { if (s.length > worst.length) worst = s; };
  for (let by = 0; by < BLOCKS; by++) {
    for (let bx = 0; bx < BLOCKS; bx++) {
      const pre = bx < 4 ? 'W ' : 'E ';
      const hundredEW = (bx < 4 ? 4 - bx : bx - 3) * 100;
      keep(`${hundredEW + 29} ${pre}${city.streetsEW[by]}`);
      keep(`${hundredEW + 29} ${pre}${city.streetsEW[by + 1]}`);
      const hundredNS = parseInt(city.streetsEW[by + 1], 10) * 100;
      keep(`${hundredNS + 29} ${city.streetsNS[bx]}`);
      keep(`${hundredNS + 29} ${city.streetsNS[bx + 1]}`);
    }
  }
  return worst;
}

function buildCity() {
  const raw = JSON.parse(readFileSync(join('content', 'hays.json'), 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  for (const key of ['streetsNS', 'streetsEW']) {
    const a = out[key];
    if (!Array.isArray(a) || a.length !== BLOCKS + 1)
      throw new Error(`content/hays.json: "${key}" must be exactly ${BLOCKS + 1} street names, got ${Array.isArray(a) ? a.length : typeof a}`);
    for (const s of a) {
      if (typeof s !== 'string') throw new Error(`content/hays.json: "${key}" must contain only strings`);
      const up = s.toUpperCase();
      if (!FONT_CHARS.test(up)) {
        const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
        throw new Error(`content/hays.json: street name ${JSON.stringify(s)} uses characters the 5x7 font cannot draw: ${bad}`);
      }
    }
  }

  const z = out.zoning;
  if (!Array.isArray(z) || z.length !== BLOCKS)
    throw new Error(`content/hays.json: "zoning" must be ${BLOCKS} rows, got ${Array.isArray(z) ? z.length : typeof z}`);
  const shopCells = [];
  z.forEach((row, by) => {
    if (!Array.isArray(row) || row.length !== BLOCKS)
      throw new Error(`content/hays.json: zoning row ${by} must be ${BLOCKS} entries, got ${Array.isArray(row) ? row.length : typeof row}`);
    row.forEach((kind, bx) => {
      if (!KINDS.includes(kind))
        throw new Error(`content/hays.json: zoning[${by}][${bx}] is "${kind}", which is not one of: ${KINDS.join(' ')}`);
      if (kind === 'shop') shopCells.push({ bx, by });
    });
  });
  if (shopCells.length !== 1)
    throw new Error(`content/hays.json: zoning must contain exactly one "shop" cell, found ${shopCells.length}`);
  if (!out.shop || out.shop.bx !== shopCells[0].bx || out.shop.by !== shopCells[0].by)
    throw new Error(`content/hays.json: "shop" is ${JSON.stringify(out.shop)} but the shop cell in zoning is at ${JSON.stringify(shopCells[0])}`);

  /* The restock line "<addr> WAITING" overflows the order card before the bare
     address does, so guard the line, not the address. Three text-overflow bugs
     have shipped in this card already. */
  const widest = worstAddress(out).toUpperCase();
  const line = widest + ' WAITING';
  const px = line.length * 6 - 1;
  if (px > CARD_TEXT_PX)
    throw new Error(
      `content/hays.json: the longest address the generator can make is "${widest}", so the restock line\n` +
      `  "${line}" is ${px}px wide, but the order card fits ${CARD_TEXT_PX}px.\n` +
      `  Shorten a street name by ${Math.ceil((px - CARD_TEXT_PX) / 6)} character(s).`);

  return out;
}

const content = buildContent();
const city = buildCity();

writeFileSync(join(SRC, '05_content.js'),
  '/* GENERATED by build.mjs from content/*.json — do not edit by hand. */\n' +
  "'use strict';\n\n" +
  'const CONTENT = ' + JSON.stringify(content, null, 2) + ';\n\n' +
  'const HAYS = ' + JSON.stringify(city, null, 2) + ';\n');

const files = readdirSync(SRC).filter((f) => f.endsWith('.js')).sort();
const code = files.map((f) => `\n/* ===== ${f} ===== */\n` + readFileSync(join(SRC, f), 'utf8')).join('\n');

const shell = readFileSync('shell.html', 'utf8');
if (!shell.includes('/*__GAME__*/')) throw new Error('shell.html is missing the /*__GAME__*/ marker');

const out = shell.replace('/*__GAME__*/', () => code);
writeFileSync('taco-shop.html', out);

// dev page: same shell, but load the modules from disk so edits are instant
const dev = shell.replace(
  /<script>[\s\S]*?<\/script>/,
  files.map((f) => `<script src="${SRC}/${f}"></script>`).join('\n')
);
writeFileSync('index.html', '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
  dev.slice(0, dev.indexOf('</style>') + 8) + '\n</head>\n<body>\n' +
  dev.slice(dev.indexOf('</style>') + 8) + '\n</body>\n</html>\n');

console.log(`built taco-shop.html  (${(out.length / 1024).toFixed(1)} kB, ${files.length} modules)`);
console.log(`  content: "${String(content.slogan).slice(0, 40)}"`);
console.log(`  city:    ${city.streetsNS.length}x${city.streetsEW.length} streets, shop at ${city.streetsNS[city.shop.bx]} & ${city.streetsEW[city.shop.by + 1]}`);
