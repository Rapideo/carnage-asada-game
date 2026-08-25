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

/* ---- the attract rotation ----------------------------------------------
   Same contract again. These were three consts at the top of 80_game.js; they
   are content because they are a judgement about pacing that wants changing
   after watching a full cycle, not a fact about how the game works. */
const SCREENS = ['title', 'winners', 'scores', 'demo'];
const MIN_SECS = 3, MAX_SECS = 600;

function buildAttract() {
  const raw = JSON.parse(readFileSync(join('content', 'attract.json'), 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  for (const screen of SCREENS) {
    const cfg = out[screen];
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg))
      throw new Error(`content/attract.json: "${screen}" must be an object, e.g. { "seconds": 30 }`);
    for (const key of Object.keys(cfg)) if (key.startsWith('_')) delete cfg[key];
    const secs = cfg.seconds;
    if (typeof secs !== 'number' || !Number.isFinite(secs))
      throw new Error(`content/attract.json: "${screen}.seconds" must be a number, got ${JSON.stringify(secs)}`);
    if (secs < MIN_SECS || secs > MAX_SECS)
      throw new Error(
        `content/attract.json: "${screen}.seconds" is ${secs}, outside ${MIN_SECS}-${MAX_SECS}.` +
        `
  Below ${MIN_SECS}s the screen flickers past before it can be read; above ${MAX_SECS}s the cabinet looks hung.`);
  }

  /* The title holds its badge alone before the wordmark lands. Let that run
     past the card's own duration and the wordmark is never seen at all — the
     rotation would flip while the screen is still mid-beat. */
  const hold = out.title.wordmarkHold;
  if (typeof hold !== 'number' || !Number.isFinite(hold) || hold < 0)
    throw new Error(`content/attract.json: "title.wordmarkHold" must be a number >= 0, got ${JSON.stringify(hold)}`);
  if (hold > out.title.seconds - 2)
    throw new Error(
      `content/attract.json: "title.wordmarkHold" is ${hold}s but the title only shows for ${out.title.seconds}s.` +
      `
  The wordmark would land with under 2s left, or never. Lower the hold, or raise title.seconds.`);

  return out;
}

/* ---- the factory high-score board ---------------------------------------
   Same contract as every other file in content/: authored, inlined, and
   rejected loudly rather than shipped broken. */
const SCORE_MAX = 10, INI_LEN = 3;
const RANK_WIDEST = 'LEGEND OF THE ASADA';   // mirrors G.rank() in 80_game.js
const SCORE_RANK_X = 208, SCORE_CENTS_X = 193, SCORE_INI_END = 110;
const centsStr = (c) => '$' + ((c / 100) | 0) + '.' + String(c % 100).padStart(2, '0');

function buildScores() {
  const raw = JSON.parse(readFileSync(join('content', 'scores.json'), 'utf8'));
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  const b = out.board;
  if (!Array.isArray(b) || b.length !== SCORE_MAX)
    throw new Error(`content/scores.json: "board" must be exactly ${SCORE_MAX} entries, got ${Array.isArray(b) ? b.length : typeof b}`);

  b.forEach((e, i) => {
    if (!e || typeof e !== 'object' || Array.isArray(e))
      throw new Error(`content/scores.json: board[${i}] must be an object like { "ini": "ABC", "cents": 1234 }`);
    if (typeof e.ini !== 'string' || e.ini.length !== INI_LEN)
      throw new Error(`content/scores.json: board[${i}].ini must be exactly ${INI_LEN} characters, got ${JSON.stringify(e.ini)}`);
    const up = e.ini.toUpperCase();
    if (!FONT_CHARS.test(up)) {
      const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
      throw new Error(`content/scores.json: board[${i}].ini uses characters the 5x7 font cannot draw: ${bad}`);
    }
    if (!Number.isInteger(e.cents) || e.cents < 0)
      throw new Error(`content/scores.json: board[${i}].cents must be a non-negative integer of cents, got ${JSON.stringify(e.cents)}`);
    /* An unsorted factory board would display wrong before a player ever
       touched it, and nothing at runtime re-sorts what came from content. */
    if (i > 0 && e.cents > b[i - 1].cents)
      throw new Error(
        `content/scores.json: the board must be sorted descending, but board[${i}] (${e.cents}) is higher than board[${i - 1}] (${b[i - 1].cents}).`);
    /* The amount column is right-aligned and grows leftward into the initials. */
    const amt = textPx(centsStr(e.cents), 1);
    if (SCORE_CENTS_X - amt < SCORE_INI_END)
      throw new Error(
        `content/scores.json: board[${i}] is ${centsStr(e.cents)}, ${amt}px wide, which overruns the initials column at x=${SCORE_INI_END}.`);
  });

  /* Layout invariant, not content: the widest rank title any row can ever
     carry must fit from its column to the screen edge. */
  const rankW = textPx(RANK_WIDEST, 1);
  if (SCORE_RANK_X + rankW > VW - EDGE)
    throw new Error(
      `content/scores.json: the widest rank title "${RANK_WIDEST}" is ${rankW}px from x=${SCORE_RANK_X}, ending at ${SCORE_RANK_X + rankW} on a ${VW}px screen.`);

  return out;
}

/* ---- the dialogue strip -------------------------------------------------
   The bubble is narrower than the screen because the portrait sits beside it,
   so the width limit here is NOT the 384px one every other field uses. Getting
   that wrong would clip a line at the bubble's right edge, where nothing in
   the test suite can see it -- the drawing stubs make overflow invisible.

   Geometry mirrors src/72_dialog.js:
     portrait box   x 7, width  FACE_W + 4
     bubble         x = box right + 10, to x 374
   The widest face decides how much room the bubble has, so this is computed
   from the baked faces rather than hard-coded. */
const DLG_BUBBLE_PAD = 10;
function buildDialogue(faces) {
  const raw = JSON.parse(readFileSync(join('content', 'dialogue.json'), 'utf8'));
  const widestFace = Math.max(56, ...Object.values(faces).map((f) => f.w + 4));
  const bx = 7 + widestFace + DLG_BUBBLE_PAD;
  const limitPx = (4 + 376 - 6) - bx - 8;            // bubble inner width, less padding
  const maxChars = Math.floor((limitPx + 1) / 6);

  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    const list = Array.isArray(v) ? v : [v];
    for (const s of list) {
      if (typeof s !== 'string') throw new Error(`content/dialogue.json: "${k}" must be a string or array of strings`);
      const up = s.toUpperCase();
      if (!FONT_CHARS.test(up)) {
        const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
        throw new Error(`content/dialogue.json: "${k}" uses characters the 5x7 font cannot draw: ${bad}`);
      }
      const w = textPx(up, 1);
      if (w > limitPx) {
        throw new Error(
          `content/dialogue.json: "${k}" line ${JSON.stringify(s)} is ${w}px wide.\n` +
          `  The bubble gives ${limitPx}px beside a ${widestFace}px portrait, so the limit is ${maxChars} characters.\n` +
          `  Trim ${s.length - maxChars} character${s.length - maxChars === 1 ? '' : 's'}.`);
      }
    }
    out[k] = v;
  }
  for (const need of ['who', 'delivered', 'missed']) {
    if (!(need in out)) throw new Error(`content/dialogue.json is missing "${need}"`);
  }
  return out;
}

/* ---- baked faces --------------------------------------------------------
   Generated by tools/render/bake-face.mjs, inlined here like every other bit
   of content. Validated because a face whose runs do not cover its bitmap
   decodes into a smear with no error, and the drawing stubs cannot see it. */
function buildFaces() {
  const dir = join('content', 'faces');
  let names = [];
  try { names = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return {}; }
  const out = {};
  for (const file of names) {
    const key = file.replace(/\.json$/, '');
    const f = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    for (const need of ['w', 'h', 'pal', 'pix', 'ink', 'skin'])
      if (!(need in f)) throw new Error(`content/faces/${file} is missing "${need}"`);
    if (f.pal.length > 16)
      throw new Error(`content/faces/${file}: ${f.pal.length} palette entries, the symbol is one hex digit so 16 is the cap`);
    if (f.pix.length % 2)
      throw new Error(`content/faces/${file}: "pix" has an odd length, runs are two characters each`);
    // runs must cover exactly w*h, or the decode silently shears the image
    const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
    let covered = 0;
    for (let i = 0; i < f.pix.length; i += 2) {
      const n = L64.indexOf(f.pix[i + 1]);
      if (n < 0) throw new Error(`content/faces/${file}: bad run length ${JSON.stringify(f.pix[i + 1])} at ${i}`);
      const sym = f.pix[i];
      if (sym !== '.' && !(parseInt(sym, 16) < f.pal.length))
        throw new Error(`content/faces/${file}: run at ${i} points at palette ${sym}, which is not there`);
      covered += n;
    }
    if (covered !== f.w * f.h)
      throw new Error(`content/faces/${file}: runs cover ${covered}px but the bitmap is ${f.w}x${f.h} = ${f.w * f.h}`);
    out[key] = f;
  }
  return out;
}

const content = buildContent();
const city = buildCity();
const attract = buildAttract();
const scores = buildScores();
const faces = buildFaces();
const dialogue = buildDialogue(faces);

writeFileSync(join(SRC, '05_content.js'),
  '/* GENERATED by build.mjs from content/*.json — do not edit by hand. */\n' +
  "'use strict';\n\n" +
  'const CONTENT = ' + JSON.stringify(content, null, 2) + ';\n\n' +
  'const HAYS = ' + JSON.stringify(city, null, 2) + ';\n\n' + 'const ATTRACT = ' + JSON.stringify(attract, null, 2) + ';\n\n' + 'const SCORES = ' + JSON.stringify(scores, null, 2) + ';\n\n' +
  'const DIALOGUE = ' + JSON.stringify(dialogue, null, 2) + ';\n\n' +
  /* faces are big and unreadable by eye -- one line each keeps 05_content.js
     navigable instead of burying the authored copy under 5000 lines of runs */
  'const FACES = {\n' + Object.entries(faces)
    .map(([k, f]) => `  ${JSON.stringify(k)}: ${JSON.stringify(f)}`).join(',\n') + '\n};\n');

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
console.log(`  attract: title ${attract.title.seconds}s (wordmark at ${attract.title.wordmarkHold}s) / winners ${attract.winners.seconds}s / demo ${attract.demo.seconds}s`);
console.log(`  scores:  ${scores.board.length} places, top ${centsStr(scores.board[0].cents)}, tenth ${centsStr(scores.board[SCORE_MAX - 1].cents)}`);
