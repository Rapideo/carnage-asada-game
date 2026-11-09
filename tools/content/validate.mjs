/* The one place content/*.json is checked. build.mjs and the in-game Service
   Mode overlay both call validateContent(), so the editor can never accept
   what the build would refuse.

   No imports, on purpose: a browser has to be able to import this file.
   Everything it reads comes through a `source`:

     { readJSON(rel) -> any, list(relDir) -> string[] | null }

   `rel` is relative to the content dir ('levels.json', 'faces',
   'music/playlist.json'). list() returns sorted .json names, or null when
   the directory is absent. readJSON() throws ContentError on a missing file
   or bad JSON.

   Every failure is a ContentError: `message` is the text a person reads,
   `file` the repo-relative file it is about, `path` the key path inside it. */

export class ContentError extends Error {
  constructor(file, path, message) {
    super(message);
    this.name = 'ContentError';
    this.file = file;
    this.path = path;
  }
}
const fail = (file, path, msg) => { throw new ContentError(file, path, msg); };

/* An in-memory source: { 'levels.json': {...}, 'faces/bob.json': {...} }.
   Hands out copies, because some builders trim what they are given. */
export function memSource(files) {
  return {
    readJSON(rel) {
      if (!(rel in files)) fail(`content/${rel}`, [], `content/${rel}: no such file`);
      return structuredClone(files[rel]);
    },
    list(relDir) {
      const pre = relDir + '/';
      const names = Object.keys(files)
        .filter((k) => k.startsWith(pre) && !k.slice(pre.length).includes('/') && k.endsWith('.json'))
        .map((k) => k.slice(pre.length))
        .sort();
      return names.length ? names : null;
    },
  };
}

/* Notes to the author are `_`-prefixed keys, at any depth (an item's `_drops`,
   an era's `_note`). They never ship. */
function stripNotes(v) {
  if (Array.isArray(v)) return v.map(stripNotes);
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) if (!k.startsWith('_')) o[k] = stripNotes(x);
    return o;
  }
  return v;
}

// mirrors the glyph table in src/10_font.js — anything else draws as a gap
export const FONT_CHARS = /^[A-Z0-9 .,:;!?$+\-/\\%#()[\]*=<>'"_&@^~]*$/;

// the virtual screen, and the scale each field is drawn at in overlayWinners
export const VW = 384;
const EDGE = 8;
export const FIELD_SCALE = { slogan: 2, attribution: 1, credit: 1 };
const textPx = (s, k) => (s.length ? s.length * 6 - 1 : 0) * k;
/* the most characters a line of a winners.json field may have (the panel shows it) */
export const lineMaxChars = (field) => Math.floor((VW - EDGE) / (FIELD_SCALE[field] || 1) / 6);

/* The one charset check every builder shares, so the message is the same
   everywhere: which file, which field, which characters. */
function drawable(file, path, where, s) {
  if (typeof s !== 'string') fail(file, path, `${where} must be a string, got ${JSON.stringify(s)}`);
  const up = s.toUpperCase();
  if (!FONT_CHARS.test(up)) {
    const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
    fail(file, path, `${where} ${JSON.stringify(s)} uses characters the 5x7 font cannot draw: ${bad}`);
  }
  return up;
}
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isCents = (v) => Number.isInteger(v) && v >= 0;

function buildContent(src) {
  const F = 'content/winners.json';
  const raw = src.readJSON('winners.json');
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;                       // notes to the author
    const list = Array.isArray(v) ? v : [v];
    const scale = FIELD_SCALE[k] || 1;
    for (const s of list) {
      if (typeof s !== 'string') fail(F, [k], `content/winners.json: "${k}" must be a string or array of strings`);
      const up = s.toUpperCase();
      if (!FONT_CHARS.test(up)) {
        const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
        fail(F, [k], `content/winners.json: "${k}" uses characters the 5x7 font cannot draw: ${bad}`);
      }
      // Width matters as much as charset: the copy is centred on a 384px
      // screen, so an over-long line silently runs off BOTH edges. The note in
      // the JSON said so, but a note is not a guard.
      const w = textPx(up, scale);
      if (w > VW - EDGE) {
        const max = lineMaxChars(k);
        fail(F, [k],
          `content/winners.json: "${k}" is ${w}px wide at scale ${scale}, but the screen is ${VW}px.\n` +
          `  ${JSON.stringify(s)} is ${s.length} characters; the limit at this scale is ${max}.\n` +
          `  Trim ${s.length - max} character${s.length - max === 1 ? '' : 's'}, or split it across the array.`);
      }
    }
    out[k] = v;
  }
  for (const need of ['slogan', 'attribution', 'credit']) {
    if (!(need in out)) fail(F, [need], `content/winners.json is missing "${need}"`);
  }
  return out;
}

/* ---- the city map -------------------------------------------------------
   Same contract as the copy above: authored in content/, inlined by the
   build, and rejected loudly rather than shipped broken. */
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

const MIN_ADDRESSES = 80;
function buildCity(src, file = 'hays.json') {
  const F = `content/${file}`;
  const raw = src.readJSON(file);
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  for (const key of ['streetsNS', 'streetsEW']) {
    const a = out[key];
    if (!Array.isArray(a) || a.length !== BLOCKS + 1)
      fail(F, [key], `${F}: "${key}" must be exactly ${BLOCKS + 1} street names, got ${Array.isArray(a) ? a.length : typeof a}`);
    a.forEach((s, i) => {
      if (typeof s !== 'string') fail(F, [key, i], `${F}: "${key}" must contain only strings`);
      drawable(F, [key, i], `${F}: street name`, s);
    });
  }

  const z = out.zoning;
  if (!Array.isArray(z) || z.length !== BLOCKS)
    fail(F, ['zoning'], `${F}: "zoning" must be ${BLOCKS} rows, got ${Array.isArray(z) ? z.length : typeof z}`);
  const shopCells = [];
  z.forEach((row, by) => {
    if (!Array.isArray(row) || row.length !== BLOCKS)
      fail(F, ['zoning', by], `${F}: zoning row ${by} must be ${BLOCKS} entries, got ${Array.isArray(row) ? row.length : typeof row}`);
    row.forEach((kind, bx) => {
      if (!KINDS.includes(kind))
        fail(F, ['zoning', by, bx], `${F}: zoning[${by}][${bx}] is "${kind}", which is not one of: ${KINDS.join(' ')}`);
      if (kind === 'shop') shopCells.push({ bx, by });
    });
  });
  if (shopCells.length !== 1)
    fail(F, ['zoning'], `${F}: zoning must contain exactly one "shop" cell, found ${shopCells.length}`);
  if (!out.shop || out.shop.bx !== shopCells[0].bx || out.shop.by !== shopCells[0].by)
    fail(F, ['shop'], `${F}: "shop" is ${JSON.stringify(out.shop)} but the shop cell in zoning is at ${JSON.stringify(shopCells[0])}`);

  /* The restock line "<addr> WAITING" overflows the order card before the bare
     address does, so guard the line, not the address. Three text-overflow bugs
     have shipped in this card already. */
  const widest = worstAddress(out).toUpperCase();
  const line = widest + ' WAITING';
  const px = line.length * 6 - 1;
  if (px > CARD_TEXT_PX)
    fail(F, [],
      `${F}: the longest address the generator can make is "${widest}", so the restock line\n` +
      `  "${line}" is ${px}px wide, but the order card fits ${CARD_TEXT_PX}px.\n` +
      `  Shorten a street name by ${Math.ceil((px - CARD_TEXT_PX) / 6)} character(s).`);

  /* res makes 4 addresses, retail and apts 2 each (40_city.js). A map with
     almost nowhere to deliver is a valid table and an unplayable level. */
  const ADDR = { res: 4, retail: 2, apts: 2 };
  const addresses = z.flat().reduce((n, k) => n + (ADDR[k] || 0), 0);
  if (addresses < MIN_ADDRESSES)
    fail(F, ['zoning'], `${F}: the zoning makes only ${addresses} deliverable addresses (res 4, retail 2, apts 2 a block); the floor is ${MIN_ADDRESSES}.`);
  Object.defineProperty(out, 'addresses', { value: addresses, enumerable: false });   // for the summary; never emitted

  return out;
}

/* ---- the three maps -----------------------------------------------------
   One per era, against one schema. They may differ ONLY in zoning: 40_city.js
   reads the street names into HSTREETS/VSTREETS once, at load, from Map 1, so
   a street renamed in Map 2 would be silently ignored -- and the shop cell and
   the Union Pacific row are assumed in more places than one (genShop's apron,
   City.tracks, the wreck ejection, the crossing sweep in the tests). */
const MAP_FILES = { 1: 'hays.json', 2: 'hays-1980s.json', 3: 'hays-1990s.json' };
function buildMaps(src) {
  const maps = {};
  for (const [n, file] of Object.entries(MAP_FILES)) maps[n] = buildCity(src, file);
  const base = maps[1];
  for (const [n, m] of Object.entries(maps)) {
    if (n === '1') continue;
    const F = `content/${MAP_FILES[n]}`;
    for (const key of ['streetsNS', 'streetsEW']) {
      const i = m[key].findIndex((s, j) => s !== base[key][j]);
      if (i >= 0)
        fail(F, [key, i], `${F}: ${key}[${i}] is "${m[key][i]}" but Map 1 (content/hays.json) has "${base[key][i]}".\n` +
          `  Every era shares one street grid; the city reads its names from Map 1 only.`);
    }
    if (m.shop.bx !== base.shop.bx || m.shop.by !== base.shop.by)
      fail(F, ['shop'], `${F}: the shop is at ${JSON.stringify(m.shop)} but Map 1 has it at ${JSON.stringify(base.shop)}. The shop never moves.`);
    base.zoning.forEach((row, by) => row.forEach((k, bx) => {
      if ((k === 'rail') !== (m.zoning[by][bx] === 'rail'))
        fail(F, ['zoning', by, bx], `${F}: zoning[${by}][${bx}] is "${m.zoning[by][bx]}" where Map 1 has "${k}". The Union Pacific row never moves.`);
    }));
  }
  return maps;
}

/* ---- the attract rotation ----------------------------------------------
   Same contract again. These were three consts at the top of 80_game.js; they
   are content because they are a judgement about pacing that wants changing
   after watching a full cycle, not a fact about how the game works. */
const SCREENS = ['title', 'winners', 'scores', 'demo'];
export const MIN_SECS = 3, MAX_SECS = 600;

function buildAttract(src) {
  const F = 'content/attract.json';
  const raw = src.readJSON('attract.json');
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  for (const screen of SCREENS) {
    const cfg = out[screen];
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg))
      fail(F, [screen], `content/attract.json: "${screen}" must be an object, e.g. { "seconds": 30 }`);
    for (const key of Object.keys(cfg)) if (key.startsWith('_')) delete cfg[key];
    const secs = cfg.seconds;
    if (typeof secs !== 'number' || !Number.isFinite(secs))
      fail(F, [screen, 'seconds'], `content/attract.json: "${screen}.seconds" must be a number, got ${JSON.stringify(secs)}`);
    if (secs < MIN_SECS || secs > MAX_SECS)
      fail(F, [screen, 'seconds'],
        `content/attract.json: "${screen}.seconds" is ${secs}, outside ${MIN_SECS}-${MAX_SECS}.` +
        `
  Below ${MIN_SECS}s the screen flickers past before it can be read; above ${MAX_SECS}s the cabinet looks hung.`);
  }

  /* The title holds its badge alone before the wordmark lands. Let that run
     past the card's own duration and the wordmark is never seen at all — the
     rotation would flip while the screen is still mid-beat. */
  const hold = out.title.wordmarkHold;
  if (typeof hold !== 'number' || !Number.isFinite(hold) || hold < 0)
    fail(F, ['title', 'wordmarkHold'], `content/attract.json: "title.wordmarkHold" must be a number >= 0, got ${JSON.stringify(hold)}`);
  if (hold > out.title.seconds - 2)
    fail(F, ['title', 'wordmarkHold'],
      `content/attract.json: "title.wordmarkHold" is ${hold}s but the title only shows for ${out.title.seconds}s.` +
      `
  The wordmark would land with under 2s left, or never. Lower the hold, or raise title.seconds.`);

  /* The demo's level set: "random", or the levels it may pick from. An empty
     list would leave G.toDemo nothing to play. */
  const lv = out.demo.levels;
  if (lv !== 'random') {
    if (!Array.isArray(lv) || !lv.length)
      fail(F, ['demo', 'levels'], `content/attract.json: "demo.levels" must be "random" or a non-empty list of level numbers, e.g. [1, 2, 9]; got ${JSON.stringify(lv)}`);
    lv.forEach((n, i) => {
      if (!Number.isInteger(n) || n < 1 || n > LEVEL_COUNT)
        fail(F, ['demo', 'levels'], `content/attract.json: "demo.levels" holds ${JSON.stringify(n)}; every entry must be a level number 1-${LEVEL_COUNT}`);
      if (lv.indexOf(n) !== i)
        fail(F, ['demo', 'levels'], `content/attract.json: "demo.levels" names level ${n} twice`);
    });
  }

  return out;
}

/* ---- the release ---------------------------------------------------------
   The version a screenshot or a bug report can name. One file, one place to
   bump it; the title and pause screens read RELEASE. */
function buildRelease(src) {
  const F = 'content/release.json';
  const raw = src.readJSON('release.json');
  const v = raw.version, d = raw.date;
  if (typeof v !== 'string' || !/^\d+\.\d+\.\d+$/.test(v))
    fail(F, ['version'], `${F}: "version" must be MAJOR.MINOR.PATCH, e.g. "0.9.0", got ${JSON.stringify(v)}`);
  if (typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d)))
    fail(F, ['date'], `${F}: "date" must be YYYY-MM-DD, e.g. "2026-11-07", got ${JSON.stringify(d)}`);
  return { version: v, date: d };
}

/* ---- the factory high-score board ---------------------------------------
   Same contract as every other file in content/: authored, inlined, and
   rejected loudly rather than shipped broken. */
export const SCORE_MAX = 10;
const INI_LEN = 3;
const RANK_WIDEST = 'LEGEND OF THE ASADA';   // mirrors G.rank() in 80_game.js
const SCORE_RANK_X = 208, SCORE_CENTS_X = 193, SCORE_INI_END = 110;
export const centsStr = (c) => '$' + ((c / 100) | 0) + '.' + String(c % 100).padStart(2, '0');

function buildScores(src) {
  const F = 'content/scores.json';
  const raw = src.readJSON('scores.json');
  const out = {};
  for (const [k, v] of Object.entries(raw)) if (!k.startsWith('_')) out[k] = v;

  const b = out.board;
  if (!Array.isArray(b) || b.length !== SCORE_MAX)
    fail(F, ['board'], `content/scores.json: "board" must be exactly ${SCORE_MAX} entries, got ${Array.isArray(b) ? b.length : typeof b}`);

  b.forEach((e, i) => {
    if (!e || typeof e !== 'object' || Array.isArray(e))
      fail(F, ['board', i], `content/scores.json: board[${i}] must be an object like { "ini": "ABC", "cents": 1234 }`);
    if (typeof e.ini !== 'string' || e.ini.length !== INI_LEN)
      fail(F, ['board', i, 'ini'], `content/scores.json: board[${i}].ini must be exactly ${INI_LEN} characters, got ${JSON.stringify(e.ini)}`);
    const up = e.ini.toUpperCase();
    if (!FONT_CHARS.test(up)) {
      const bad = [...new Set([...up].filter((ch) => !FONT_CHARS.test(ch)))].join(' ');
      fail(F, ['board', i, 'ini'], `content/scores.json: board[${i}].ini uses characters the 5x7 font cannot draw: ${bad}`);
    }
    if (!Number.isInteger(e.cents) || e.cents < 0)
      fail(F, ['board', i, 'cents'], `content/scores.json: board[${i}].cents must be a non-negative integer of cents, got ${JSON.stringify(e.cents)}`);
    /* An unsorted factory board would display wrong before a player ever
       touched it, and nothing at runtime re-sorts what came from content. */
    if (i > 0 && e.cents > b[i - 1].cents)
      fail(F, ['board', i, 'cents'],
        `content/scores.json: the board must be sorted descending, but board[${i}] (${e.cents}) is higher than board[${i - 1}] (${b[i - 1].cents}).`);
    /* The amount column is right-aligned and grows leftward into the initials. */
    const amt = textPx(centsStr(e.cents), 1);
    if (SCORE_CENTS_X - amt < SCORE_INI_END)
      fail(F, ['board', i, 'cents'],
        `content/scores.json: board[${i}] is ${centsStr(e.cents)}, ${amt}px wide, which overruns the initials column at x=${SCORE_INI_END}.`);
  });

  /* Layout invariant, not content: the widest rank title any row can ever
     carry must fit from its column to the screen edge. */
  const rankW = textPx(RANK_WIDEST, 1);
  if (SCORE_RANK_X + rankW > VW - EDGE)
    fail(F, [],
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
   from the baked faces rather than hard-coded. On top of that sits a flat
   34-character cap: the Kitchen Shift's strip is the narrow one, and a line
   has to fit both halves of the game because both draw from one pool.

   A line may open with an era floor, "2|" or "3|": that line is only for the
   1980s-and-later, or the 1990s. It is how a Filofax stays out of 1972. The
   prefix ships in the string -- the game filters on it -- so it is stripped
   here only for the width check. */
const DLG_BUBBLE_PAD = 10;
export const DLG_MAX_CHARS = 34;
export const DLG_MAX_ROWS = 2;
export const DLG_KEYS = ['who', 'delivered', 'missed', 'late', 'arrive', 'wait', 'queue', 'walkout', 'served', 'wrong'];
/* the moments a customer speaks at (DLG_KEYS minus the speaker's name); personal lines are keyed by these */
export const DLG_MOMENTS = DLG_KEYS.filter((k) => k !== 'who');
const ERA_PREFIX = /^([0-9])\|/;

/* the cast: officers chase and fine the player, rivals taunt a miss or a perfect
   toss, coworkers speak in the kitchen. The moments each role speaks at. */
export const CAST_MOMENTS = {
  officer: ['chase', 'fined', 'lost'],
  rival: ['missed', 'perfect'],
  coworker: ['hint', 'clockin', 'streak', 'trouble'],
};
/* {ING} is the next ingredient's plate name; only a coworker's hint may use it,
   and its width is checked as the longest plate name (CHICKEN) */
const CAST_ING = '{ING}', CAST_ING_WIDEST = 'CHICKEN';

/* Greedy word wrap with the 5x7 font's width. null when one word alone is wider
   than a row. Dialog.wrap in src/72_dialog.js is the same rule (src/ cannot
   import); the headless suite asserts the two agree. */
export function wrapRows(body, limitPx) {
  const rows = [];
  let cur = '';
  for (const word of body.split(' ').filter(Boolean)) {
    if (textPx(word, 1) > limitPx) return null;
    const next = cur ? cur + ' ' + word : word;
    if (cur && textPx(next, 1) > limitPx) { rows.push(cur); cur = word; } else cur = next;
  }
  if (cur) rows.push(cur);
  return rows;
}

/* the widest a row of dialogue may be: the bubble beside the widest baked face,
   capped at DLG_MAX_CHARS characters */
export function dlgLimitPx(faces) {
  const widestFace = Math.max(56, ...Object.values(faces).map((f) => f.w + 4));
  const bx = 7 + widestFace + DLG_BUBBLE_PAD;
  const bubblePx = (4 + 376 - 6) - bx - 8;            // bubble inner width, less padding
  return { widestFace, bubblePx, limitPx: Math.min(bubblePx, textPx('X'.repeat(DLG_MAX_CHARS), 1)) };
}

function buildDialogue(src, faces) {
  const F = 'content/dialogue.json';
  const raw = src.readJSON('dialogue.json');
  const { widestFace, bubblePx, limitPx } = dlgLimitPx(faces);
  const maxChars = Math.floor((limitPx + 1) / 6);
  const why = bubblePx < textPx('X'.repeat(DLG_MAX_CHARS), 1)
    ? `The bubble gives ${bubblePx}px beside a ${widestFace}px portrait`
    : `Lines are capped at ${DLG_MAX_CHARS} characters so they fit the Kitchen Shift's strip`;

  /* one line: caps, drawable, wraps to DLG_MAX_ROWS. `era` false = personal line,
     which carries no prefix (the face's decade already places it). Returns
     whether the line is usable in Era 1 (no prefix). */
  const checkLine = (P, label, s, era) => {
    if (typeof s !== 'string') fail(F, P, `${F}: ${label} must contain only strings, got ${JSON.stringify(s)}`);
    let body = s;
    const m = ERA_PREFIX.exec(s);
    if (m) {
      if (era === 'none') fail(F, P, `${F}: ${label} cannot carry an era prefix`);
      if (!era) fail(F, P, `${F}: ${label} line ${JSON.stringify(s)} carries an era prefix; a personal line is placed by its face's decade. Drop the "${m[1]}|".`);
      if (m[1] !== '2' && m[1] !== '3')
        fail(F, P, `${F}: ${label} line ${JSON.stringify(s)} has era floor ${m[1]}; only 2| (1980s on) and 3| (1990s) mean anything. Drop it for every era.`);
      body = s.slice(2);
    }
    if (body.includes('|'))
      fail(F, P, `${F}: ${label} line ${JSON.stringify(s)} has a "|" that is not an era prefix at the start. The font cannot draw it.`);
    if (body !== body.toUpperCase())
      fail(F, P, `${F}: ${label} line ${JSON.stringify(s)} must be ALL CAPS, as it is drawn.`);
    if (!body.trim()) fail(F, P, `${F}: ${label} has an empty line`);
    drawable(F, P, `${F}: ${label} line`, body);
    const rows = wrapRows(body, limitPx);
    if (!rows) {
      const big = body.split(' ').reduce((x, y) => (y.length > x.length ? y : x), '');
      fail(F, P,
        `${F}: ${label} line ${JSON.stringify(s)} has a word too wide for one row (${JSON.stringify(big)}, ${textPx(big, 1)}px).
` +
        `  ${why}, so a row holds ${maxChars} characters. Break it up or shorten the word.`);
    }
    if (rows.length > DLG_MAX_ROWS) {
      fail(F, P,
        `${F}: ${label} line ${JSON.stringify(s)} needs ${rows.length} rows; the bubble holds ${DLG_MAX_ROWS}.
` +
        `  ${why}, so a row holds ${maxChars} characters. Trim it to fit ${DLG_MAX_ROWS} rows.`);
    }
    return !m;
  };

  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    if (k === 'people' || k === 'cast') continue;                     // built below, once the shared pools are in
    if (!DLG_KEYS.includes(k))
      fail(F, [k], `${F}: unknown key "${k}". The game reads: ${DLG_KEYS.join(' ')} people cast. (Prefix a note with _ to keep it out of the build.)`);
    if (k === 'who' ? typeof v !== 'string' : !Array.isArray(v) || !v.length)
      fail(F, [k], `${F}: "${k}" must be ${k === 'who' ? 'a string' : 'a non-empty array of lines'}`);
    const list = Array.isArray(v) ? v : [v];
    let anyEra = false;
    list.forEach((s, li) => {
      const P = Array.isArray(v) ? [k, li] : [k];
      if (checkLine(P, `"${k}"`, s, k === 'who' ? 'none' : true)) anyEra = true;
    });
    /* every pool needs a line 1972 can say, or the strip draws nothing in Era 1 */
    if (!anyEra) fail(F, [k], `${F}: every line in "${k}" carries an era prefix, so Era 1 has nothing to say there. Add a line with no prefix.`);
    out[k] = v;
  }
  for (const need of DLG_KEYS) {
    if (!(need in out)) fail(F, [need], `${F} is missing "${need}"`);
  }

  /* personal lines: people[faceKey][moment] = [lines]. A face with none for a
     moment falls back to the shared pool at play time, so a short list is fine. */
  const people = {};
  const rawPeople = raw.people === undefined ? {} : raw.people;
  if (!rawPeople || typeof rawPeople !== 'object' || Array.isArray(rawPeople))
    fail(F, ['people'], `${F}: "people" must be an object of face key to moments`);
  for (const [face, moments] of Object.entries(rawPeople)) {
    if (face.startsWith('_')) continue;
    if (!faces[face])
      fail(F, ['people', face], `${F}: people: ${JSON.stringify(face)} is not a face in content/faces/ (${Object.keys(faces).join(' ')})`);
    if (!moments || typeof moments !== 'object' || Array.isArray(moments))
      fail(F, ['people', face], `${F}: people.${face} must be an object of moment to lines`);
    const mo = {};
    for (const [moment, lines] of Object.entries(moments)) {
      if (moment.startsWith('_')) continue;
      if (!DLG_MOMENTS.includes(moment))
        fail(F, ['people', face, moment], `${F}: people.${face}: unknown moment "${moment}". Moments are: ${DLG_MOMENTS.join(' ')}.`);
      if (!Array.isArray(lines) || !lines.length)
        fail(F, ['people', face, moment], `${F}: people.${face}.${moment} must be a non-empty array of lines`);
      lines.forEach((s, li) => checkLine(['people', face, moment, li], `people.${face}.${moment}`, s, false));
      mo[moment] = lines;
    }
    people[face] = mo;
  }
  out.people = people;

  /* the cast: cast[key] = { name, face, era, role, lines: { moment: [lines] } }.
     The coworkers may be absent; an entry present must give every moment of its role. */
  const cast = {};
  const rawCast = raw.cast === undefined ? {} : raw.cast;
  if (!rawCast || typeof rawCast !== 'object' || Array.isArray(rawCast))
    fail(F, ['cast'], `${F}: "cast" must be an object of key to character`);
  for (const [key, c] of Object.entries(rawCast)) {
    if (key.startsWith('_')) continue;
    const at = (...p) => ['cast', key, ...p];
    if (!c || typeof c !== 'object' || Array.isArray(c))
      fail(F, at(), `${F}: cast.${key} must be an object`);
    if (typeof c.name !== 'string' || !c.name.trim())
      fail(F, at('name'), `${F}: cast.${key}.name must be the name on the strip`);
    if (c.name !== c.name.toUpperCase()) fail(F, at('name'), `${F}: cast.${key}.name must be ALL CAPS, as it is drawn`);
    drawable(F, at('name'), `${F}: cast.${key}.name`, c.name);
    if (!CAST_MOMENTS[c.role])
      fail(F, at('role'), `${F}: cast.${key}.role ${JSON.stringify(c.role)} is not a role. Roles are: ${Object.keys(CAST_MOMENTS).join(' ')}.`);
    if (!faces[c.face])
      fail(F, at('face'), `${F}: cast.${key}.face ${JSON.stringify(c.face)} is not a face in content/faces/ (${Object.keys(faces).join(' ')})`);
    if (![1, 2, 3].includes(c.era))
      fail(F, at('era'), `${F}: cast.${key}.era must be 1, 2 or 3, got ${JSON.stringify(c.era)}`);
    if (!c.lines || typeof c.lines !== 'object' || Array.isArray(c.lines))
      fail(F, at('lines'), `${F}: cast.${key}.lines must be an object of moment to lines`);
    const mine = CAST_MOMENTS[c.role];
    const lines = {};
    for (const [moment, list] of Object.entries(c.lines)) {
      if (moment.startsWith('_')) continue;
      if (!mine.includes(moment))
        fail(F, at('lines', moment), `${F}: cast.${key} is a ${c.role}; its moments are: ${mine.join(' ')}, not "${moment}".`);
      if (!Array.isArray(list) || !list.length)
        fail(F, at('lines', moment), `${F}: cast.${key}.lines.${moment} must be a non-empty array of lines`);
      list.forEach((s, li) => {
        const P = at('lines', moment, li), label = `cast.${key}.${moment}`;
        if (typeof s === 'string' && s.includes(CAST_ING)) {
          if (c.role !== 'coworker' || moment !== 'hint')
            fail(F, P, `${F}: ${label} line ${JSON.stringify(s)} uses ${CAST_ING}, which only a coworker's hint line may. Say the ingredient another way.`);
          checkLine(P, label, s.split(CAST_ING).join(CAST_ING_WIDEST), false);
        } else checkLine(P, label, s, false);
      });
      lines[moment] = list;
    }
    for (const need of mine)
      if (!lines[need]) fail(F, at('lines', need), `${F}: cast.${key} (${c.role}) is missing "${need}" lines`);
    cast[key] = { name: c.name, face: c.face, era: c.era, role: c.role, lines };
  }
  out.cast = cast;
  return out;
}

/* ---- baked pixel tables -------------------------------------------------
   Faces (tools/render/bake-face.mjs) and lattice art (bake-lattice.mjs) share
   one format and one failure: runs that do not cover the bitmap decode into a
   smear with no error, and the drawing stubs cannot see it. */
const L64 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
function checkRuns(where, f) {
  for (const need of ['w', 'h', 'pal', 'pix', 'ink', 'skin'])
    if (!(need in f)) fail(where, [need], `${where} is missing "${need}"`);
  if (!Number.isInteger(f.w) || !Number.isInteger(f.h) || f.w <= 0 || f.h <= 0)
    fail(where, ['w'], `${where}: w and h must be positive integers, got ${f.w}x${f.h}`);
  if (!Array.isArray(f.pal) || f.pal.length > 16)
    fail(where, ['pal'], `${where}: ${Array.isArray(f.pal) ? f.pal.length : 'no'} palette entries, the symbol is one hex digit so 16 is the cap`);
  if (typeof f.pix !== 'string' || f.pix.length % 2)
    fail(where, ['pix'], `${where}: "pix" must be a string of two-character runs, and has an odd length`);
  // runs must cover exactly w*h, or the decode silently shears the image
  let covered = 0;
  for (let i = 0; i < f.pix.length; i += 2) {
    const n = L64.indexOf(f.pix[i + 1]);
    if (n < 0) fail(where, ['pix'], `${where}: bad run length ${JSON.stringify(f.pix[i + 1])} at ${i}`);
    const sym = f.pix[i];
    if (sym !== '.' && !(parseInt(sym, 16) < f.pal.length))
      fail(where, ['pix'], `${where}: run at ${i} points at palette ${sym}, which is not there`);
    covered += n;
  }
  if (covered !== f.w * f.h)
    fail(where, ['pix'], `${where}: runs cover ${covered}px but the bitmap is ${f.w}x${f.h} = ${f.w * f.h}`);
}

/* A face's `eyes` are what blink and hood paint over: [x, y, w, h] rects in
   face pixels. One off the bitmap, or one row tall (the lash line sits at
   y + h - 2), paints across the cheek or nothing at all, and no assertion that
   cannot see a pixel would notice. `_eyesByHand` is a note: it tells
   bake-face.mjs to keep them, and never ships. */
function checkEyes(where, f) {
  /* skin is the lid colour a blink paints; a colour the face does not have
     is a typo, and paints a patch nothing else on the face matches */
  if (!f.pal.includes(f.skin)) fail(where, ['skin'], `${where}: "skin" ${JSON.stringify(f.skin)} is not one of the face's palette colours`);
  if (!('eyes' in f)) return;
  if (!Array.isArray(f.eyes)) fail(where, ['eyes'], `${where}: "eyes" must be a list of [x, y, w, h] rects, got ${JSON.stringify(f.eyes)}`);
  f.eyes.forEach((e, i) => {
    const ok = Array.isArray(e) && e.length === 4 && e.every((n) => Number.isInteger(n) && n >= 0) && e[2] >= 1 && e[3] >= 2;
    if (!ok) fail(where, ['eyes', i], `${where}: eye ${i + 1} must be [x, y, w, h] in whole face pixels, at least 1 wide and 2 tall, got ${JSON.stringify(e)}`);
    if (e[0] + e[2] > f.w || e[1] + e[3] > f.h)
      fail(where, ['eyes', i], `${where}: eye ${i + 1} ${JSON.stringify(e)} runs off the ${f.w}x${f.h} bitmap`);
  });
}

function buildFaces(src) {
  const out = {};
  for (const file of src.list('faces') || []) {
    const where = `content/faces/${file}`;
    const f = stripNotes(src.readJSON(`faces/${file}`));
    checkRuns(where, f);
    checkEyes(where, f);
    out[file.replace(/\.json$/, '')] = f;
  }
  return out;
}

/* content/casts.json: the customers per era, { "1": [face, ...], ... }. Every
   era a level uses has a cast, every name is a face, and a face is listed once
   per era. Kitchen.castFor(era, year) reads it.

   `from` (optional) is { face: year }: the year a face first appears, so an
   era's crowd grows level by level (owner, 2026-11-08). A face with no entry
   is there from its era's first level. The year must be one a level of an era
   casting that face uses, and an era may not be left with nobody at its first
   level. */
function buildCasts(src, faces, levels) {
  const F = 'content/casts.json';
  const raw = stripNotes(src.readJSON('casts.json'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(F, [], `${F} must be an object of eras, { "1": ["c70teacher", ...] }`);
  const eras = [...new Set(levels.map((l) => String(l.era)))].sort();
  for (const k of Object.keys(raw))
    if (k !== 'from' && !eras.includes(k)) fail(F, [k], `${F}: "${k}" is not an era any level uses (${eras.join(', ')})`);
  const out = {};
  for (const era of eras) {
    const c = raw[era];
    if (!Array.isArray(c) || !c.length) fail(F, [era], `${F}: era ${era} needs a cast of at least one face, got ${JSON.stringify(c)}`);
    c.forEach((n, i) => {
      if (typeof n !== 'string' || !faces[n])
        fail(F, [era, i], `${F}: era ${era}, face ${i + 1} ${JSON.stringify(n)} is not a face in content/faces/ (${Object.keys(faces).join(' ')})`);
      if (c.indexOf(n) !== i) fail(F, [era, i], `${F}: era ${era} lists "${n}" twice`);
    });
    out[era] = c;
  }
  const from = raw.from === undefined ? {} : raw.from;
  if (!from || typeof from !== 'object' || Array.isArray(from)) fail(F, ['from'], `${F}: "from" must be an object of { face: year }, got ${JSON.stringify(raw.from)}`);
  const yearsOf = (era) => [...new Set(levels.filter((l) => String(l.era) === era).map((l) => l.year))].sort((a, b) => a - b);
  const kept = {};
  for (const [n, y] of Object.entries(from)) {
    const inEras = eras.filter((e) => out[e].includes(n));
    /* a face taken out of every cast leaves its year behind; that is harmless,
       and refusing it would make every edit that uncasts a face clean up too */
    if (!inEras.length) continue;
    const ok = inEras.flatMap(yearsOf);
    if (!Number.isInteger(y) || !ok.includes(y))
      fail(F, ['from', n], `${F}: "${n}" first appears in ${JSON.stringify(y)}, which is not a level year of its era (${ok.join(', ')})`);
    kept[n] = y;
  }
  for (const era of eras) {
    const first = yearsOf(era)[0];
    if (!out[era].some((n) => !(n in kept) || kept[n] <= first))
      fail(F, [era], `${F}: era ${era} has nobody at its first level (${first}); give at least one face no "from", or ${first}`);
  }
  out.from = kept;
  return out;
}

/* Keyed by the record's own "name" (BEEF, CHIPS...), which is what the menu's
   bin keys refer to, not by its filename. */
function buildLattice(src) {
  const out = {};
  for (const file of src.list('lattice') || []) {
    const where = `content/lattice/${file}`;
    const f = src.readJSON(`lattice/${file}`);
    checkRuns(where, f);
    if (typeof f.name !== 'string' || !/^[A-Z0-9]+$/.test(f.name))
      fail(where, ['name'], `${where}: "name" must be an upper-case key like "BEEF", got ${JSON.stringify(f.name)}`);
    if (out[f.name]) fail(where, ['name'], `${where}: name "${f.name}" is already taken by another file in content/lattice/`);
    out[f.name] = f;
  }
  return out;
}

/* ---- levels, difficulty, menus ------------------------------------------ */
export const DIFF_KEYS = ['easy', 'medium', 'hard', 'supreme'];   // in ladder order
export const NAV_KEYS = ['panel', 'line', 'dot', 'edge', 'beacon'];
function buildDifficulty(src) {
  const F = 'content/difficulty.json';
  const out = stripNotes(src.readJSON('difficulty.json'));
  for (const k of Object.keys(out))
    if (!DIFF_KEYS.includes(k)) fail(F, [k], `${F}: unknown difficulty "${k}"; expected ${DIFF_KEYS.join(' ')}`);
  let prevNav = null;
  for (const k of DIFF_KEYS) {
    const d = out[k], W = `${F}: "${k}"`;
    if (!d || typeof d !== 'object') fail(F, [k], `${F} is missing "${k}"`);
    for (const f of ['start', 'extend', 'maxExt', 'target'])
      if (!Number.isInteger(d[f]) || d[f] <= 0) fail(F, [k, f], `${W}.${f} must be a positive whole number of ${f === 'start' || f === 'extend' ? 'seconds' : 'counts'}, got ${JSON.stringify(d[f])}`);
    /* GDD II.D.3: the level clears at 3 x the extension cap. Two numbers that
       must move together are one number written twice; this keeps them honest. */
    if (d.target !== 3 * d.maxExt)
      fail(F, [k, 'target'], `${W}.target is ${d.target} but maxExt is ${d.maxExt}; the target must be exactly 3 x maxExt = ${3 * d.maxExt}.`);
    for (const f of ['tipStart', 'tipFloor'])
      if (!isCents(d[f])) fail(F, [k, f], `${W}.${f} must be integer cents (2000 = $20.00), got ${JSON.stringify(d[f])}`);
    if (d.tipFloor >= d.tipStart) fail(F, [k, 'tipFloor'], `${W}.tipFloor (${d.tipFloor}) must be below tipStart (${d.tipStart})`);
    if (!isNum(d.tipDecay) || d.tipDecay <= 0)
      fail(F, [k, 'tipDecay'], `${W}.tipDecay must be a positive number of cents per second ($1.00 / 3s = 33.33), got ${JSON.stringify(d.tipDecay)}`);
    if (!isCents(d.perfectBonus)) fail(F, [k, 'perfectBonus'], `${W}.perfectBonus must be integer cents (500 = $5.00), got ${JSON.stringify(d.perfectBonus)}`);
    if (!d.fines || typeof d.fines !== 'object') fail(F, [k, 'fines'], `${W} is missing "fines"`);
    for (const f of ['ticket', 'ped', 'train', 'remake'])
      if (!isCents(d.fines[f])) fail(F, [k, 'fines', f], `${W}.fines.${f} must be integer cents, got ${JSON.stringify(d.fines[f])}`);
    if (!d.nav || typeof d.nav !== 'object') fail(F, [k, 'nav'], `${W} is missing "nav"`);
    for (const f of NAV_KEYS)
      if (typeof d.nav[f] !== 'boolean') fail(F, [k, 'nav', f], `${W}.nav.${f} must be true or false, got ${JSON.stringify(d.nav[f])}`);
    /* difficulty.md: "each difficulty takes one more piece away" -- a harder
       level never gives back a piece of guidance an easier one removed. */
    if (prevNav) for (const f of NAV_KEYS)
      if (d.nav[f] && !prevNav.nav[f])
        fail(F, [k, 'nav', f], `${W}.nav.${f} is on, but "${prevNav.k}" (easier) already turned it off. Guidance only ever comes away up the ladder.`);
    prevNav = { k, nav: d.nav };
    const kt = d.kitchen;
    if (!kt || typeof kt !== 'object') fail(F, [k, 'kitchen'], `${W} is missing "kitchen"`);
    if (!isCents(kt.tipPerItem) || kt.tipPerItem <= 0) fail(F, [k, 'kitchen', 'tipPerItem'], `${W}.kitchen.tipPerItem must be positive integer cents, got ${JSON.stringify(kt.tipPerItem)}`);
    if (!isNum(kt.decay) || kt.decay <= 0) fail(F, [k, 'kitchen', 'decay'], `${W}.kitchen.decay must be a positive number of cents per second, got ${JSON.stringify(kt.decay)}`);
    if (!Number.isInteger(kt.maxItems) || kt.maxItems < 1) fail(F, [k, 'kitchen', 'maxItems'], `${W}.kitchen.maxItems must be a whole number >= 1, got ${JSON.stringify(kt.maxItems)}`);
    if (!isNum(kt.every) || kt.every <= 0) fail(F, [k, 'kitchen', 'every'], `${W}.kitchen.every must be a positive number of seconds, got ${JSON.stringify(kt.every)}`);
    if (!isCents(kt.cleanBonus)) fail(F, [k, 'kitchen', 'cleanBonus'], `${W}.kitchen.cleanBonus must be integer cents, got ${JSON.stringify(kt.cleanBonus)}`);
    if (typeof kt.hint !== 'boolean') fail(F, [k, 'kitchen', 'hint'], `${W}.kitchen.hint must be true or false, got ${JSON.stringify(kt.hint)}`);
    if (!Number.isInteger(kt.railMax) || kt.railMax < 1) fail(F, [k, 'kitchen', 'railMax'], `${W}.kitchen.railMax must be a whole number >= 1, got ${JSON.stringify(kt.railMax)}`);
    if (!Number.isInteger(kt.queueMax) || kt.queueMax < 0) fail(F, [k, 'kitchen', 'queueMax'], `${W}.kitchen.queueMax must be a whole number >= 0, got ${JSON.stringify(kt.queueMax)}`);
  }
  return out;
}

/* Kitchen geometry the menu has to fit, mirrored from reference/kitchen/:
   a bin's name plate is 44px (7 characters), a ticket line 72px (12), and
   the NOW BUILDING readout shares 127px with one 9px pip per step. */
export const BIN_COUNT = 12, NOW_PX = 127;
const PLATE_CHARS = 7, TICKET_CHARS = 12, MAX_STEPS = 7;
export const nowCost = (short, steps) => 12 * short.length + 9 * steps;
function checkSlot(file, path, where, s) {
  if (!s || typeof s !== 'object' || Array.isArray(s))
    fail(file, path, `${where} must be an object like { "key": "BEEF", "name": "GROUND BEEF", "plate": "BEEF" }`);
  if (typeof s.key !== 'string' || !/^[A-Z]+$/.test(s.key))
    fail(file, [...path, 'key'], `${where}.key must be upper-case letters, got ${JSON.stringify(s.key)}`);
  drawable(file, [...path, 'name'], `${where}.name`, s.name);
  const plate = drawable(file, [...path, 'plate'], `${where}.plate`, s.plate);
  if (plate.length > PLATE_CHARS)
    fail(file, [...path, 'plate'], `${where}.plate ${JSON.stringify(s.plate)} is ${textPx(plate, 1)}px on a 44px name plate; the plate holds ${PLATE_CHARS} characters. Trim ${plate.length - PLATE_CHARS}.`);
}
function buildMenus(src) {
  const F = 'content/menus.json';
  const out = stripNotes(src.readJSON('menus.json'));
  const eras = Object.keys(out).sort((a, b) => a - b);
  if (!eras.length || eras.some((e, i) => e !== String(i + 1)))
    fail(F, [], `${F}: eras must be "1", "2", "3"... with no gaps, got ${JSON.stringify(eras)}`);
  let prev = null;
  for (const e of eras) {
    const m = out[e], W = `${F}: era ${e}`;
    if (!Array.isArray(m.bins) || m.bins.length !== BIN_COUNT)
      fail(F, [e, 'bins'], `${W}: "bins" must be exactly ${BIN_COUNT} slots (null for an empty one), got ${Array.isArray(m.bins) ? m.bins.length : typeof m.bins}`);
    const bins = new Set();
    m.bins.forEach((b, i) => {
      if (b === null) return;
      checkSlot(F, [e, 'bins', i], `${W} bins[${i}]`, b);
      if (bins.has(b.key)) fail(F, [e, 'bins', i, 'key'], `${W}: bin key "${b.key}" appears twice`);
      bins.add(b.key);
    });
    /* A bin NEVER moves. The player learns where the beef is in 1972 and it
       is still there in 1999; a later era may only fill a slot that was empty. */
    if (prev) prev.bins.forEach((b, i) => {
      if (b && (!m.bins[i] || m.bins[i].key !== b.key))
        fail(F, [e, 'bins', i], `${W}: bins[${i}] is ${m.bins[i] ? '"' + m.bins[i].key + '"' : 'empty'}, but era ${prev.e} put "${b.key}" there.\n` +
          `  Bins never move or close; a later era may only fill a slot that was null.`);
    });
    const bs = m.bases;
    if (!bs || !Array.isArray(bs.left) || bs.left.length !== 3 || !Array.isArray(bs.right) || bs.right.length < 1)
      fail(F, [e, 'bases'], `${W}: "bases" must be { "left": [3 stacked zones, top to bottom], "right": [at least 1] }`);
    const bases = new Set();
    for (const [side, list] of [['left', bs.left], ['right', bs.right]]) list.forEach((b, i) => {
      checkSlot(F, [e, 'bases', side, i], `${W} bases.${side}[${i}]`, b);
      if (bases.has(b.key) || bins.has(b.key)) fail(F, [e, 'bases', side, i, 'key'], `${W}: key "${b.key}" is used twice across bins and bases`);
      bases.add(b.key);
    });
    if (prev) {
      const was = [...prev.m.bases.left, ...prev.m.bases.right].map((b) => b.key).join(' ');
      const now = [...bs.left, ...bs.right].map((b) => b.key).join(' ');
      if (was !== now) fail(F, [e, 'bases'], `${W}: the base stations are "${now}" but era ${prev.e} had "${was}". The stations are hardware; they never change.`);
    }
    if (!Array.isArray(m.items) || !m.items.length) fail(F, [e, 'items'], `${W}: "items" must be a non-empty array`);
    const seen = { name: new Set(), ticket: new Set(), short: new Set() };
    m.items.forEach((it, i) => {
      const I = `${W} item ${i + 1}`, P = [e, 'items', i];
      if (!it || typeof it !== 'object') fail(F, P, `${I} must be an object`);
      const name = drawable(F, [...P, 'name'], `${I}.name`, it.name);
      const ticket = drawable(F, [...P, 'ticket'], `${I} (${name}).ticket`, it.ticket);
      const short = drawable(F, [...P, 'short'], `${I} (${name}).short`, it.short);
      if (ticket.length > TICKET_CHARS)
        fail(F, [...P, 'ticket'], `${I} (${name}): ticket ${JSON.stringify(it.ticket)} is ${ticket.length} characters; the 72px ticket line holds ${TICKET_CHARS}. Trim ${ticket.length - TICKET_CHARS}.`);
      for (const [f, v] of [['name', name], ['ticket', ticket], ['short', short]]) {
        if (seen[f].has(v)) fail(F, [...P, f], `${I}: ${f} "${v}" is used by two items in era ${e}; the player could not tell them apart.`);
        seen[f].add(v);
      }
      if (!isCents(it.price)) fail(F, [...P, 'price'], `${I} (${name}).price must be integer cents (29 = $0.29), got ${JSON.stringify(it.price)}`);
      const r = it.recipe;
      if (!Array.isArray(r) || r.length < 2 || r.length > MAX_STEPS)
        fail(F, [...P, 'recipe'], `${I} (${name}).recipe must be a base then 1 to ${MAX_STEPS - 1} ingredients (2..${MAX_STEPS} keys), got ${Array.isArray(r) ? r.length : typeof r}`);
      if (!bases.has(r[0]))
        fail(F, [...P, 'recipe', 0], `${I} (${name}): recipe[0] is "${r[0]}", but ingredient 0 is always the base: one of ${[...bases].join(' ')}`);
      r.slice(1).forEach((k, j) => {
        if (bases.has(k)) fail(F, [...P, 'recipe', j + 1], `${I} (${name}): recipe[${j + 1}] is the base "${k}". Items that need a base mid-build are out (the base is always ingredient 0).`);
        if (!bins.has(k)) fail(F, [...P, 'recipe', j + 1], `${I} (${name}): recipe[${j + 1}] is "${k}", which is not a bin in era ${e}. Era ${e} bins: ${[...bins].join(' ')}`);
      });
      /* The readout shares its row with one pip per step, so the budget is
         a function of the recipe, not a fixed character count. */
      const cost = nowCost(short, r.length);
      if (cost > NOW_PX) {
        const max = Math.floor((NOW_PX - 9 * r.length) / 12);
        fail(F, [...P, 'short'], `${I} (${name}): short "${short}" at ${r.length} steps needs 12x${short.length} + 9x${r.length} = ${cost}px of the ${NOW_PX}px NOW BUILDING row.\n` +
          `  At ${r.length} steps the limit is ${max} characters. Trim ${short.length - max}.`);
      }
    });
    prev = { e, m, bins: m.bins };
  }
  return out;
}

export const SEASONS = ['summer', 'winter'], TYPES = ['delivery', 'kitchen'];
const LEVEL_COUNT = 20, LEVEL_CARD_SCALE = 2;
function buildLevels(src, difficulty, maps, menus) {
  const F = 'content/levels.json';
  const raw = stripNotes(src.readJSON('levels.json'));
  const L = raw.levels;
  if (!Array.isArray(L) || L.length !== LEVEL_COUNT)
    fail(F, ['levels'], `${F}: "levels" must be exactly ${LEVEL_COUNT} entries, got ${Array.isArray(L) ? L.length : typeof L}`);
  L.forEach((v, i) => {
    const W = `${F}: level ${i + 1}`, P = ['levels', i];
    if (v.n !== i + 1) fail(F, [...P, 'n'], `${W} has n ${JSON.stringify(v.n)}; levels must be listed in order, n = 1..${LEVEL_COUNT}`);
    if (!TYPES.includes(v.type)) fail(F, [...P, 'type'], `${W}.type must be ${TYPES.join(' or ')}, got ${JSON.stringify(v.type)}`);
    const name = drawable(F, [...P, 'name'], `${W}.name`, v.name);
    if (textPx(name, LEVEL_CARD_SCALE) > VW - 2 * EDGE)
      fail(F, [...P, 'name'], `${W}.name ${JSON.stringify(v.name)} is ${textPx(name, LEVEL_CARD_SCALE)}px at scale ${LEVEL_CARD_SCALE}, wider than the ${VW}px screen.`);
    if (!Number.isInteger(v.year) || v.year < 1970 || v.year > 1999) fail(F, [...P, 'year'], `${W}.year must be 1970..1999, got ${JSON.stringify(v.year)}`);
    if (!name.includes(String(v.year))) fail(F, [...P, 'name'], `${W}.name ${JSON.stringify(v.name)} does not show its year ${v.year}`);
    const era = Math.floor((v.year - 1970) / 10) + 1;
    if (v.era !== era) fail(F, [...P, 'era'], `${W}.era is ${JSON.stringify(v.era)} but ${v.year} is era ${era} (1 = 1970s, 2 = 1980s, 3 = 1990s)`);
    if (!SEASONS.includes(v.season)) fail(F, [...P, 'season'], `${W}.season must be ${SEASONS.join(' or ')}, got ${JSON.stringify(v.season)}`);
    if (!name.includes(v.season.toUpperCase())) fail(F, [...P, 'name'], `${W}.name ${JSON.stringify(v.name)} does not match its season "${v.season}"`);
    if (!difficulty[v.difficulty]) fail(F, [...P, 'difficulty'], `${W}.difficulty "${v.difficulty}" is not in content/difficulty.json (${Object.keys(difficulty).join(' ')})`);
    if (v.map !== v.era || !maps[v.map]) fail(F, [...P, 'map'], `${W}.map is ${JSON.stringify(v.map)}; it must equal the era (${v.era}) and name a map in ${Object.values(MAP_FILES).join(', ')}`);
    if (v.menu !== v.era || !menus[v.menu]) fail(F, [...P, 'menu'], `${W}.menu is ${JSON.stringify(v.menu)}; it must equal the era (${v.era}) and name an era in content/menus.json`);
    if (i > 0 && v.year < L[i - 1].year) fail(F, [...P, 'year'], `${W} is ${v.year}, earlier than level ${i} (${L[i - 1].year}); the run moves forward in time`);
    if (i > 0 && DIFF_KEYS.indexOf(v.difficulty) < DIFF_KEYS.indexOf(L[i - 1].difficulty))
      fail(F, [...P, 'difficulty'], `${W} is "${v.difficulty}", easier than level ${i} ("${L[i - 1].difficulty}"); the run only gets harder`);
  });
  /* the season rule's month (levelMonth) rides on each built level, so the
     game (the kitchen's wall calendar) reads it rather than keeping a copy of
     the rule. Derived from the order, never authored. */
  return L.map((v, i) => ({ ...v, month: levelMonth(L, i) }));
}

/* Every bin in every era names a piece of lattice art. A missing one draws
   an empty well, which looks deliberate (bins CAN be empty) and so would be
   the last thing anyone noticed. Bases are station art, named differently. */
function checkMenuArt(menus, lattice) {
  if (!Object.keys(lattice).length) return;
  for (const [e, m] of Object.entries(menus)) m.bins.forEach((b, i) => {
    if (b && !lattice[b.key])
      fail('content/menus.json', [e, 'bins', i, 'key'],
        `content/menus.json: era ${e} bins[${i}] is "${b.key}", but content/lattice/ has no record named "${b.key}".\n` +
        `  Bake it with tools/render/bake-lattice.mjs, or rename the key to one of: ${Object.keys(lattice).join(' ')}`);
  });
}

/* ---- the prep board -------------------------------------------------------
   content/board/<key>.json is one picture of a dish part-built, keyed by its
   recipe prefix (LARGE-BEANS-CHEESE); content/board.json names the finished
   picture for every dish that does not simply finish on its last build frame.
   Both are generated by tools/render/bake-board.mjs from the art director's
   set in reference/kitchen/board-frames/. Same table format as the faces. */
function buildBoard(src) {
  const frames = {};
  for (const file of src.list('board') || []) {
    const where = `content/board/${file}`;
    const f = src.readJSON(`board/${file}`);
    checkRuns(where, f);
    if (typeof f.name !== 'string' || !/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(f.name))
      fail(where, ['name'], `${where}: "name" must be a recipe key like "LARGE-BEANS-CHEESE", got ${JSON.stringify(f.name)}`);
    if (frames[f.name]) fail(where, ['name'], `${where}: name "${f.name}" is already taken by another file in content/board/`);
    frames[f.name] = f;
  }
  let finish = {};
  try { finish = stripNotes(src.readJSON('board.json')).finish || {}; }
  catch (e) { if (Object.keys(frames).length) fail('content/board.json', [], `content/board.json: ${e.message}`); }
  return { frames, finish };
}

/* Every dish on every menu needs a picture for every step and for its finish.
   A missing one leaves the board blank mid-build, which a player reads as the
   pick not having registered -- so a new dish, or a reordered recipe, fails the
   build here until its frames are drawn and baked. */
function checkBoardArt(menus, board) {
  if (!Object.keys(board.frames).length) return;
  const need = (key, why, file, path) => {
    if (!board.frames[key])
      fail(file, path, `content/board/ has no frame "${key}" (${why}).\n` +
        `  Add it to reference/kitchen/board-frames/ and re-run node tools/render/bake-board.mjs`);
  };
  for (const [e, m] of Object.entries(menus)) m.items.forEach((it, i) => {
    for (let s = 1; s <= it.recipe.length; s++)
      need(it.recipe.slice(0, s).join('-'), `era ${e} ${it.name}, step ${s}`, 'content/menus.json', [e, 'items', i, 'recipe']);
    need(board.finish[it.name] || it.recipe.join('-'), `era ${e} ${it.name}, finished`, 'content/menus.json', [e, 'items', i, 'recipe']);
  });
  for (const [dish, key] of Object.entries(board.finish))
    need(key, `content/board.json finish for ${dish}`, 'content/board.json', ['finish', dish]);
}

/* ---- music --------------------------------------------------------------
   content/music/<id>.json is one song (tools/music/midi2song.mjs), and
   playlist.json names which songs each level, and the title, may play.
   music.md: a level plays songs from its own year or up to 2 years before,
   never after -- an anachronism is a guard, not a judgement call. */
export const MUSIC_LOOKBACK = 2;
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* The month a level's season means (spec §9, owner): whichever keeps time
   moving forward. Summer is July. Winter is January when a summer level of
   the same year comes after it in level order, and December otherwise. It is
   derived from the order, never authored per level. */
export function levelMonth(levels, i) {
  const lv = levels[i];
  if (lv.season === 'summer') return 7;
  return levels.some((l, j) => j > i && l.year === lv.year && l.season === 'summer') ? 1 : 12;
}

/* May level i play this song? The YEAR window is a rule: a song from after
   the level's year, or more than MUSIC_LOOKBACK years before it, is
   { ok: false, why }. The MONTH is advice (owner, 2026-11-07): a same-year
   song released after the level's month is { ok: true, warn }, flagged and
   never refused. The title list has no year and is not asked. */
export function songEligible(song, levels, i) {
  const lv = levels[i];
  if (!lv || !song || typeof song.year !== 'number') return { ok: true };
  if (song.year > lv.year) return { ok: false, why: 'too new: ' + song.year + ', after ' + lv.year };
  if (song.year < lv.year - MUSIC_LOOKBACK) return { ok: false, why: 'too old: ' + song.year + ', more than ' + MUSIC_LOOKBACK + ' years before ' + lv.year };
  const lm = levelMonth(levels, i);
  if (song.year === lv.year && Number.isInteger(song.month) && song.month > lm && song.month <= 12)
    return { ok: true, warn: 'released ' + MONTHS[song.month - 1].slice(0, 3) + ' ' + song.year + ', after this level\'s ' + MONTHS[lm - 1] };
  return { ok: true };
}

/* Every month warning the shipped playlists carry: [{ level, id, warn }]. */
export function musicWarnings(music, playlist, levels) {
  const out = [];
  levels.forEach((lv, i) => {
    for (const id of playlist[String(lv.n)] || []) {
      const r = music[id] ? songEligible(music[id], levels, i) : { ok: true };
      if (r.warn) out.push({ level: lv.n, id, warn: r.warn });
    }
  });
  return out;
}

function buildMusic(src, levels) {
  const files = src.list('music');
  if (files === null) return { music: {}, playlist: {}, note: 'no content/music/ yet' };
  const music = {};
  for (const file of files) {
    if (file === 'playlist.json') continue;
    const id = file.replace(/\.json$/, '');
    const MF = `content/music/${file}`;
    const s = src.readJSON(`music/${file}`);
    if (!s || typeof s !== 'object' || Array.isArray(s)) fail(MF, [], `content/music/${file} must be a song object`);
    if (s.id !== undefined && s.id !== id) fail(MF, ['id'], `content/music/${file}: id is "${s.id}" but the file is ${file}; they must match`);
    for (const f of ['title', 'artist']) if (s[f] !== undefined) drawable(MF, [f], `content/music/${file} ${f}`, s[f]);
    /* the release month (midi2song --month): required, for the season rule */
    if (s.month === undefined)
      fail(MF, ['month'], `content/music/${file}: no month. Every song needs its release month, an integer 1-12 (1 = January): the first release, single or album, whichever came first.`);
    if (!(Number.isInteger(s.month) && s.month >= 1 && s.month <= 12))
      fail(MF, ['month'], `content/music/${file}: month is ${JSON.stringify(s.month)}; a release month is an integer 1-12 (1 = January)`);
    music[id] = stripNotes(s);
  }
  if (!files.includes('playlist.json')) return { music, playlist: {}, note: 'no playlist.json yet' };

  const F = 'content/music/playlist.json';
  const raw = stripNotes(src.readJSON('music/playlist.json'));
  const pl = raw.levels && typeof raw.levels === 'object' && !Array.isArray(raw.levels) ? { ...raw.levels, title: raw.title } : raw;
  const playlist = {};
  const need = ['title', ...levels.map((l) => String(l.n))];
  for (const k of need) {
    const list = pl[k];
    if (!Array.isArray(list) || !list.length)
      fail(F, [k], `${F}: "${k}" must be a non-empty array of song ids, e.g. "${k}": ["${Object.keys(music)[0] || 'song-id'}"]. ` +
        `Every level 1-${levels.length} and "title" needs a list.`);
    const lv = k === 'title' ? null : levels[+k - 1];
    list.forEach((id, j) => {
      if (typeof id !== 'string' || !music[id])
        fail(F, [k, j], `${F}: "${k}" names ${JSON.stringify(id)}, which is not a song in content/music/ (have: ${Object.keys(music).join(' ') || 'none'})`);
      /* the year window only: a late month is a warning (songEligible), not a failure */
      const y = music[id].year;
      if (lv && isNum(y) && !songEligible(music[id], levels, +k - 1).ok)
        fail(F, [k, j], `${F}: level ${k} (${lv.name}) plays "${id}" from ${y}. A level may only play songs from ${lv.year - MUSIC_LOOKBACK}-${lv.year}: its own year or up to ${MUSIC_LOOKBACK} before, never after.`);
    });
    playlist[k] = list;
  }
  for (const k of Object.keys(pl))
    if (!need.includes(k) && pl[k] !== undefined) fail(F, [k], `${F}: unknown key "${k}"; expected "title" and "1".."${levels.length}"`);
  return { music, playlist, note: null };
}

/* Everything content/ holds, validated, notes stripped. Throws ContentError on
   the first problem. `musicNote` is the build log's remark when music is
   only partly there; it never ships. */
export function validateContent(src) {
  const content = buildContent(src);
  const maps = buildMaps(src);
  const attract = buildAttract(src);
  const release = buildRelease(src);
  const scores = buildScores(src);
  const faces = buildFaces(src);
  const dialogue = buildDialogue(src, faces);
  const difficulty = buildDifficulty(src);
  const menus = buildMenus(src);
  const levels = buildLevels(src, difficulty, maps, menus);
  const casts = buildCasts(src, faces, levels);
  const lattice = buildLattice(src);
  checkMenuArt(menus, lattice);
  const board = buildBoard(src);
  checkBoardArt(menus, board);
  const { music, playlist, note: musicNote } = buildMusic(src, levels);
  return { content, maps, attract, release, scores, faces, casts, dialogue, difficulty, menus, levels, lattice, board, music, playlist, musicNote };
}
