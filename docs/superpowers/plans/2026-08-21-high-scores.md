# High Scores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the game a persistent top-ten board scored in take-home pay, with cabinet-style initials entry, so a player can see that they got better.

**Architecture:** A new model-only module `src/78_scores.js` owns the board — factory content, `localStorage` with a guarded fallback, qualification and insertion — and never touches a canvas. `80_game.js` gains two states (`scores`, `entry`) and their overlays, alongside the ones it already has. The factory board is authored in `content/scores.json` and validated at build time like every other file in `content/`.

**Tech Stack:** Plain ES5-style browser JavaScript (no modules, no imports), Node 18+ for `build.mjs` and the test harness, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-21-high-scores-design.md`

**Branch:** `feature/high-scores`, cut from `master` at `26c03b4`.

## Global Constraints

- **Zero dependencies.** No `package.json`, no imports, no CDN, no asset files. Everything is generated at boot.
- **`src/*.js` are plain scripts, not ES modules**, concatenated in `readdirSync().sort()` order into one `<script>`. All modules share one global scope, so a top-level `const` declared twice across two files is a fatal redeclaration that surfaces only in the bundle. `node test/headless.mjs` concatenates the same way and catches it.
- **The numeric filename prefix is the load order.** `78_scores.js` must load after `05_content` (for `SCORES`) and before `80_game` (which constructs and draws it).
- **`src/05_content.js` is generated. Never edit it by hand.**
- **`node build.mjs` must be re-run** before `taco-shop.html` reflects source edits. `index.html` loads `src/*.js` directly and does not need it.
- **The 5×7 font is ASCII-only and uppercase.** `textW(str, s) === str.length * 6 * s - s`. At scale 1 that is `len * 6 - 1`.
- **Screen is `VW`=384 by `VH`=216.** All HUD and overlay layout is in these units.
- **Money is integer cents throughout.** `money(cents)` formats it.
- **No new colours.** `PAL.jade`/`PAL.gold` are badge-only; `PAL.cyan` is guidance-only. Use `PAL.amber`, `PAL.bone`, `PAL.boneDim`, `PAL.ink`, `PAL.red`.
- **`text(ctx, str, px, py, col, scale, align)` takes `py` as the TOP of the run, not its centre.** Align 0 = left, 1 = centre, 2 = right. A 5×7 glyph at scale 1 is 7px tall; at scale 2, 14px.
- **`Input.p(...codes)` reads one-shot presses** cleared by `Input.endFrame()`. `Input.anyKey` is true for any key that frame.
- **Look at every change in the browser before committing it.** The harness stubs every drawing call, so it cannot see a row at the wrong offset or an overlay drawn behind the world.
- **Commit after every task.**

---

## Facts this plan depends on

Read these off the code before starting.

| fact | value | where |
|---|---|---|
| rank thresholds (cents) | `<4000` TRAINEE, `<9000` DRIVER, `<15000` ACE, `<23000` SALSA BARON, else LEGEND OF THE ASADA | `G.rank()`, `80_game.js` |
| longest rank title | `LEGEND OF THE ASADA` — 19 chars, 113px at scale 1 | derived |
| results box | `w=250, h=154, px=67, py=24` — spans y 24–178 | `overlayResults` |
| existing results prompts | `VH-22` (194) and `VH-11` (205) | `overlayResults` |
| attract states today | `title` → `winners` → `demo` → `title`, one `G.attractT` countdown | `update()` |
| the harness has **no** `localStorage` | its sandbox global list does not include it | `test/headless.mjs` |

That last row matters: the headless suite naturally exercises the "storage unavailable" path, which is most of the `file://` case for free.

---

## File Structure

| file | responsibility | change |
|---|---|---|
| `content/scores.json` | the factory board — ten authored entries | create |
| `content/attract.json` | gains a `scores` slot with its own `seconds` | modify |
| `build.mjs` | validate and inline the board as `SCORES`; add `scores` to the attract screens | modify |
| `src/78_scores.js` | `Scores` — factory, storage, qualification, insertion. Model only, no canvas. | create |
| `src/80_game.js` | two states, the wheel's input, two overlays, the results line | modify |
| `test/headless.mjs` | new `— high scores —` section | modify |

---

### Task 1: The model

**Files:**
- Create: `content/scores.json`
- Modify: `build.mjs`
- Create: `src/78_scores.js`
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `SCORES` (generated into `src/05_content.js` by this task's `build.mjs` change), `money(cents)` from `10_font.js`.
- Produces:
  - `SCORE_MAX` = 10, `INI_LEN` = 3, `INI_ALPHA` — a 27-character string, `A`–`Z` then a space.
  - `Scores.board` — live array of `{ ini: string, cents: number }`, sorted descending, at most `SCORE_MAX`.
  - `Scores.load()` → the board. `Scores.save()` → boolean, true if it reached storage.
  - `Scores.qualifies(cents)` → boolean. `Scores.insert(ini, cents)` → index placed at, or `-1`.
  - `Scores.lowest()` → cents of the last place, or 0 on an empty board.

- [ ] **Step 1: Write the factory board**

Create `content/scores.json`. The values are chosen so a real shift places immediately — three measured playtest runs earned $20.90, $8.93 and $20.62 — while the top of the board stays out of reach for a while.

```json
{
  "_comment": "The factory high-score board, as a cabinet ships with. build.mjs INLINES this at build time - it is not fetched at runtime, because the shipped artifact must stay a single self-contained file (the CSP blocks external requests, and fetch() on a file:// page is blocked by CORS). Edit here, then run: node build.mjs",
  "_rules": "Exactly 10 entries, sorted descending by cents. ini is exactly 3 characters drawable by the 5x7 font. cents is a non-negative integer - the game stores all money in cents, so 4610 is $46.10. build.mjs rejects anything else.",
  "_ranks": "The rank title beside each row is DERIVED from cents at draw time, not stored, so retuning G.rank() reflows the whole board. Thresholds today: under $40 TRAINEE, under $90 DRIVER, under $150 ACE, under $230 SALSA BARON, above that LEGEND OF THE ASADA.",

  "board": [
    { "ini": "MJS", "cents": 9600 },
    { "ini": "ACE", "cents": 7250 },
    { "ini": "RED", "cents": 5840 },
    { "ini": "TAC", "cents": 4610 },
    { "ini": "UPX", "cents": 3990 },
    { "ini": "HAY", "cents": 3120 },
    { "ini": "ELM", "cents": 2450 },
    { "ini": "FRT", "cents": 1880 },
    { "ini": "BOB", "cents": 1240 },
    { "ini": "KAS", "cents": 640 }
  ]
}
```

- [ ] **Step 2: Add the `scores` slot to `content/attract.json`**

Insert after the `winners` block:

```json
  "scores": {
    "seconds": 15
  },
```

- [ ] **Step 3: Validate and inline it in `build.mjs`**

Add `'scores'` to the attract screens list — find `const SCREENS = ['title', 'winners', 'demo'];` and change it to:

```js
const SCREENS = ['title', 'winners', 'scores', 'demo'];
```

Then add this function immediately before `const content = buildContent();`:

```js
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
```

Wire it in. Change:

```js
const content = buildContent();
const city = buildCity();
const attract = buildAttract();
```

to add a fourth line:

```js
const scores = buildScores();
```

Emit it — find `'const ATTRACT = ' + JSON.stringify(attract, null, 2)` and change that expression to:

```js
'const ATTRACT = ' + JSON.stringify(attract, null, 2) + ';\n\n' + 'const SCORES = ' + JSON.stringify(scores, null, 2)
```

And add a build log line after the attract one:

```js
console.log(`  scores:  ${scores.board.length} places, top ${centsStr(scores.board[0].cents)}, tenth ${centsStr(scores.board[SCORE_MAX - 1].cents)}`);
```

- [ ] **Step 4: Run the build to confirm it emits**

Run: `node build.mjs`
Expected: a `scores:` line reading `10 places, top $96.00, tenth $6.40`, and `const SCORES = {` present in `src/05_content.js`.

- [ ] **Step 5: Write the failing test**

`test/headless.mjs` runs modules in a `node:vm` sandbox, and top-level `const`/`class` names never appear on the sandbox global — the harness hands them out through an explicit bridge. Add `Scores, SCORE_MAX, INI_LEN, INI_ALPHA,` to **both** the `globalThis.__x = {...}` string and the destructuring below it.

Then add a new section immediately before `console.log('\n— heat —');`:

```js
console.log('\n— high scores —');
/* The harness sandbox has no localStorage at all, which is most of the
   file:// case for free: Scores must fall back to the factory board without
   raising, because an unguarded read blanks the game on the exact path the
   artifact is meant to be opened by. */
ok(typeof localStorage === 'undefined', 'the sandbox has no localStorage, so the fallback path is the one under test');
const board0 = Scores.load();
ok(board0.length === SCORE_MAX, `the factory board loads ${SCORE_MAX} places (got ${board0.length})`);
ok(board0.every((e, i) => i === 0 || board0[i - 1].cents >= e.cents), 'the factory board is sorted descending');
ok(board0.every((e) => e.ini.length === INI_LEN), 'every set of initials is 3 characters');
ok(Scores.save() === false, 'saving without storage reports failure rather than throwing');

/* qualification, at the boundary rather than in the middle */
const tenth = Scores.lowest();
ok(Scores.qualifies(tenth + 1), `one cent above tenth place qualifies (${tenth + 1} > ${tenth})`);
ok(!Scores.qualifies(tenth), 'matching tenth place does NOT qualify');
ok(!Scores.qualifies(tenth - 1), 'one cent below tenth place does not qualify');
ok(!Scores.qualifies(0), 'a shift that took nothing never places');

/* insertion keeps the invariants */
const idx = Scores.insert('ZZZ', tenth + 1);
ok(idx === SCORE_MAX - 1, `a barely-qualifying score lands last (index ${idx})`);
ok(Scores.board.length === SCORE_MAX, `the board is still capped at ${SCORE_MAX}`);
ok(Scores.board[SCORE_MAX - 1].ini === 'ZZZ', 'and it is actually on the board');
const topIdx = Scores.insert('AAA', Scores.board[0].cents + 100);
ok(topIdx === 0, 'a new best lands first');
ok(Scores.board.every((e, i) => i === 0 || Scores.board[i - 1].cents >= e.cents), 'the board stays sorted after inserts');
ok(Scores.board.length === SCORE_MAX, 'and stays capped');

/* ties do not displace the incumbent */
Scores.load();
const second = Scores.board[1].cents, wasSecond = Scores.board[1].ini;
Scores.insert('TIE', second);
ok(Scores.board[1].ini === wasSecond && Scores.board[2].ini === 'TIE',
   'a tied score goes below whoever got there first');

/* a corrupt stored board is discarded, not repaired */
Scores.load();
ok(Scores.valid([{ ini: 'ABC', cents: 10 }]), 'a well-formed board validates');
ok(!Scores.valid([{ ini: 'TOOLONG', cents: 10 }]), 'bad initials are rejected');
ok(!Scores.valid([{ ini: 'ABC', cents: 1.5 }]), 'non-integer cents are rejected');
ok(!Scores.valid('not a board'), 'a non-array is rejected');
ok(!Scores.valid([]), 'an empty array is rejected');

```

- [ ] **Step 6: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL with `ReferenceError: Scores is not defined`.

- [ ] **Step 7: Write the module**

Create `src/78_scores.js`:

```js
/* ============================================================
   SCORES  --  the high-score board: factory content, storage, ranking
   ============================================================ */
'use strict';

/* Model only. Scores never touches a canvas and G never touches storage; the
   board is drawn by overlayScores/overlayEntry in 80_game.js. */

const SCORE_MAX = 10;                                 // places on the board
const INI_LEN = 3;                                    // characters in a set of initials
const INI_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';      // 27, wraps both ways

const Scores = {
  KEY: 'tacoshop.scores.v1',
  board: [],
  stored: false,                    // did a stored board actually load this session?

  /* Storage is wrapped because reading it can THROW, not merely fail: Chrome
     treats a file:// page as an opaque origin and raises SecurityError on
     touch, and taco-shop.html is meant to be opened exactly that way. The
     headless harness has no localStorage at all and exercises the same path.
     A board that lives only in memory is a small loss; a game that will not
     boot from a file:// page is a total one. */
  _read() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return null;
      return localStorage.getItem(this.KEY);
    } catch (e) { return null; }
  },
  _write(s) {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return false;
      localStorage.setItem(this.KEY, s);
      return true;
    } catch (e) { return false; }    // opaque origin, quota, or private mode
  },

  factory() {
    return SCORES.board.map((e) => ({ ini: String(e.ini).toUpperCase().slice(0, INI_LEN), cents: e.cents | 0 }));
  },

  valid(v) {
    return Array.isArray(v) && v.length > 0 && v.length <= SCORE_MAX &&
      v.every((e) => e && typeof e === 'object' &&
        typeof e.ini === 'string' && e.ini.length === INI_LEN &&
        Number.isInteger(e.cents) && e.cents >= 0);
  },

  /* Anything unexpected in storage is DISCARDED in favour of the factory
     board rather than repaired — a half-understood board is worse than a
     known one, and there is nothing here worth salvaging. */
  load() {
    this.board = this.factory();
    this.stored = false;
    const raw = this._read();
    if (raw) {
      let v = null;
      try { v = JSON.parse(raw); } catch (e) { v = null; }
      if (this.valid(v)) {
        this.board = v.map((e) => ({ ini: e.ini.toUpperCase(), cents: e.cents }));
        this.stored = true;
      }
    }
    this.sort();
    return this.board;
  },

  sort() {
    this.board.sort((a, b) => b.cents - a.cents);
    if (this.board.length > SCORE_MAX) this.board.length = SCORE_MAX;
  },

  save() { return this._write(JSON.stringify(this.board)); },

  lowest() { return this.board.length ? this.board[this.board.length - 1].cents : 0; },

  /* A shift that took nothing never places, however empty the board is. */
  qualifies(cents) {
    if (!(cents > 0)) return false;
    if (this.board.length < SCORE_MAX) return true;
    return cents > this.board[SCORE_MAX - 1].cents;
  },

  /* Returns the index it landed at, or -1 if it did not place. Ties go BELOW
     the incumbent: matching a score does not displace whoever got there first. */
  insert(ini, cents) {
    if (!this.qualifies(cents)) return -1;
    const e = { ini: String(ini).toUpperCase().slice(0, INI_LEN), cents: cents | 0 };
    let i = 0;
    while (i < this.board.length && this.board[i].cents >= e.cents) i++;
    this.board.splice(i, 0, e);
    if (this.board.length > SCORE_MAX) this.board.length = SCORE_MAX;
    this.save();
    return i;
  },
};
```

- [ ] **Step 8: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS, with the new `— high scores —` section green.

- [ ] **Step 9: Commit**

```bash
node build.mjs
git add -A
git commit -m "The high-score board, as a model

Scores owns the board and nothing else -- factory content, storage,
qualification, insertion -- and never touches a canvas.

Every storage access is wrapped because reading localStorage can THROW
rather than merely fail: Chrome treats a file:// page as an opaque origin
and raises SecurityError on touch, and taco-shop.html is meant to be
opened exactly that way. The headless sandbox has no localStorage at all,
so the suite exercises that fallback by default.

The factory board is authored in content/scores.json with five build-time
guards, including that it is sorted descending -- nothing at runtime
re-sorts what came from content, so an unsorted file would display wrong
before a player ever touched it."
```

---

### Task 2: The board on screen

**Files:**
- Modify: `src/80_game.js`
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `Scores.board`, `SCORE_MAX` from Task 1; `G.rank()`; `money(cents)`.
- Produces:
  - `ATTRACT_SCORES` — seconds, from `ATTRACT.scores.seconds`.
  - `G.toScores(fromShift)` — enters the `scores` state; `fromShift` truthy means it waits for input instead of a timer.
  - `G.scoresFromShift` (boolean), `G.scoreIdx` (index to highlight, `-1` for none), `G.attractFlip` (boolean).
  - `G.overlayScores(ctx)`.

- [ ] **Step 1: Write the failing test**

Append to the `— high scores —` section:

```js
/* the board is an attract screen, alternating with the winners card */
Input.down = Object.create(null); Input.anyKey = false; Input.mhit = false; Input.hasMouse = false;
G.toTitle();
const seq = [];
for (let cycle = 0; cycle < 4 && seq.length < 3; cycle++) {
  for (let i = 0; i < (ATTRACT_TITLE + 0.5) * 60; i++) { G.update(1 / 60); Input.endFrame(); }
  seq.push(G.state);
  // skip whatever middle screen we landed on, then the demo, back to the title
  for (let i = 0; i < (ATTRACT_SCORES + ATTRACT_WINNERS + 1) * 60 && G.state !== 'demo'; i++) { G.update(1 / 60); Input.endFrame(); }
  G.toTitle();
}
ok(seq.length === 3 && seq[0] !== seq[1] && seq[1] !== seq[2],
   `the attract middle slot alternates: ${seq.join(' -> ')}`);
ok(seq.includes('scores') && seq.includes('winners'), 'and it shows both the board and the winners card');

/* the widest row the board can ever draw must fit the screen */
const RANK_X = 208, WIDEST_RANK = 'LEGEND OF THE ASADA';
ok(RANK_X + textW(WIDEST_RANK, 1) <= VW - 8,
   `the widest rank title fits the board row (ends at ${RANK_X + textW(WIDEST_RANK, 1)} of ${VW})`);
ok(G.rank.call({ earned: 999999 }) === WIDEST_RANK, 'and it really is the widest title rank() can return');

```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `ATTRACT_SCORES is not defined`.

- [ ] **Step 3: Add `ATTRACT_SCORES` and the new state fields**

In `src/80_game.js`, after `const ATTRACT_DEMO = ATTRACT.demo.seconds;` add:

```js
const ATTRACT_SCORES = ATTRACT.scores.seconds;
```

Add to the `G` object literal, on the line after `attractT: 0, demoAim: null,`:

```js
  scoresFromShift: false, scoreIdx: -1, attractFlip: false,
```

Add `ATTRACT_SCORES` to the harness bridge in `test/headless.mjs` — both the `globalThis.__x = {...}` string and the destructuring.

- [ ] **Step 4: Add `toScores` and alternate the attract slot**

Add immediately after `toWinners()`:

```js
  /* The board serves twice: an attract screen on a timer, and the post-shift
     screen waiting for input. One flag tells them apart. */
  toScores(fromShift) {
    this.state = 'scores';
    this.scoresFromShift = !!fromShift;
    this.attractT = ATTRACT_SCORES;
    if (!fromShift) this.scoreIdx = -1;
  },
```

In `update()`, in the `title` branch, replace:

```js
      if (this.attractT <= 0) this.toWinners();
```

with:

```js
      /* The middle slot alternates rather than adding a fourth screen: a
         dedicated slot would grow the cycle from 135s to ~147s, and 90s of
         demo is already the long part of the watch. */
      if (this.attractT <= 0) {
        this.attractFlip = !this.attractFlip;
        if (this.attractFlip) this.toWinners(); else this.toScores(false);
      }
```

- [ ] **Step 5: Handle the `scores` state in `update()`**

Add immediately after the whole `if (this.state === 'winners') { ... }` block:

```js
    if (this.state === 'scores') {
      if (this.scoresFromShift) {
        // the same keys results already uses, so there is no second set to learn
        if (Input.p('Enter', 'NumpadEnter', 'KeyR')) { Audio5.sfx('select'); this.startShift(); return; }
        if (Input.p('Escape')) { Audio5.sfx('select'); this.toTitle(); return; }
      } else {
        this.attractT -= dt;
        if (Input.anyKey || Input.mhit) { Audio5.sfx('select'); this.toTitle(); return; }
        if (this.attractT <= 0) { this.toDemo(); return; }
      }
      this.simCrowd(dt);
      return;
    }
```

- [ ] **Step 6: Draw it**

In `render()`, beside the other overlay dispatches — find `if (this.state === 'results') this.overlayResults(x);` and add above it:

```js
    if (this.state === 'scores')  this.overlayScores(x);
```

Add the overlay itself immediately after `overlayResults`:

```js
  /* Ten rows on a 12px pitch. The rank title is derived from the score rather
     than stored, so retuning rank() reflows the whole board. */
  overlayScores(x) {
    x.fillStyle = 'rgba(20,12,28,0.78)'; x.fillRect(0, 0, VW, VH);
    const w = 300, px = (VW - w) / 2 | 0, py = 6, h = 178;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'HIGH SCORES', VW / 2, 12, PAL.amber, 2, 1);
    R(x, PAL.amber, px + 16, 32, w - 32, 1);

    for (let i = 0; i < Scores.board.length; i++) {
      const e = Scores.board[i], y = 38 + i * 12;
      const mine = i === this.scoreIdx;
      // the placing row blinks so the player can find themselves at a glance
      const on = !mine || (this.time * 3 | 0) % 2 === 0;
      const col = mine ? (on ? PAL.amber : PAL.bone) : PAL.bone;
      text(x, (i + 1) + '', 75, y, mine ? col : PAL.boneDim, 1, 2);
      text(x, e.ini, 93, y, col, 1);
      text(x, money(e.cents), 193, y, col, 1, 2);
      text(x, this.rank.call({ earned: e.cents }), 208, y, mine ? col : PAL.boneDim, 1);
    }

    if (this.scoresFromShift) {
      if ((this.time * 2 | 0) % 2) text(x, 'ENTER - RUN IT BACK', VW / 2, 190, PAL.bone, 1, 1);
      text(x, 'ESC - TITLE', VW / 2, 201, '#6b5f84', 1, 1);
    } else {
      text(x, 'BEAT THE BOARD', VW / 2, 195, PAL.boneDim, 1, 1);
    }
  },
```

`this.rank.call({ earned: e.cents })` reuses `rank()` against a row's score without duplicating the thresholds. `rank()` reads only `this.earned`, which is what makes that safe.

- [ ] **Step 7: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS.

- [ ] **Step 8: Look at it — required**

Run `node serve.mjs`, open `http://localhost:8123`, and force the board:

```js
const T = window.TacoShop, G = T.G;
G.toScores(false); G.scoreIdx = 2; T.step(1);
```

Note the tab must be **visible** for `requestAnimationFrame` to run; if you are driving it from a hidden tab use `T.step(n)` and be aware that screenshots of a hidden tab can return a stale frame — verify anything load-bearing by reading draw calls or `getImageData` rather than trusting the image.

Judge: do ten rows fit without crowding the header or the prompt? Does the highlighted row read as highlighted? Are the rank titles legible at 1× in `PAL.boneDim`, or too dim against the panel?

- [ ] **Step 9: Commit**

```bash
node build.mjs
git add -A
git commit -m "The board, on screen and in the attract loop

Ten rows on a 12px pitch, with the rank title derived from each score
through rank() rather than stored -- so retuning the thresholds reflows
the whole board instead of leaving stale titles in storage.

The attract middle slot alternates between the winners card and the
board rather than adding a fourth screen. A dedicated slot would grow
the cycle from 135s to about 147s, and 90 seconds of demo is already the
long part of the watch."
```

---

### Task 3: The wheel

**Files:**
- Modify: `src/80_game.js`
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `INI_ALPHA`, `INI_LEN`, `Scores.insert(ini, cents)` from Task 1; `G.toScores(fromShift)` from Task 2.
- Produces: `ENTRY_TIMEOUT` = 30; `G.toEntry()`; `G.commitEntry()`; `G.entryIni` (array of 3 indices into `INI_ALPHA`), `G.entrySlot`, `G.entryT`; `G.overlayEntry(ctx)`.

- [ ] **Step 1: Write the failing test**

Append to the `— high scores —` section:

```js
/* the initials wheel: arrows only, by design — the one input scheme the whole
   game uses, and the only one a gamepad maps to */
Scores.load();
G.earned = Scores.lowest() + 500;
G.toEntry();
ok(G.state === 'entry', 'the wheel opens');
ok(G.entryIni.length === INI_LEN && G.entryIni.every((v) => v === 0), 'all three slots start at A');
const press = (code) => { Input.hit[code] = true; G.update(1 / 60); Input.endFrame(); };
press('ArrowUp');                                   // A -> B
ok(INI_ALPHA[G.entryIni[0]] === 'B', `up cycles forward (${INI_ALPHA[G.entryIni[0]]})`);
press('ArrowDown'); press('ArrowDown');             // B -> A -> wrap to space
ok(INI_ALPHA[G.entryIni[0]] === ' ', 'down from A wraps to the end of the alphabet');
press('ArrowUp');                                   // back to A
press('ArrowLeft');
ok(G.entrySlot === 0, 'left on the first slot does nothing');
press('ArrowRight'); press('ArrowUp');              // slot 1 -> B
press('ArrowRight'); press('ArrowUp'); press('ArrowUp');   // slot 2 -> C
ok(G.entrySlot === INI_LEN - 1, 'right walks to the last slot');
press('ArrowRight');
ok(G.entrySlot === INI_LEN - 1, 'right on the last slot does nothing');
const spelled = G.entryIni.map((i) => INI_ALPHA[i]).join('');
ok(spelled === 'ABC', `the wheel spells what was driven into it (${spelled})`);
press('Enter');
ok(G.state === 'scores' && Scores.board.some((e) => e.ini === 'ABC'),
   'enter on the last slot commits and shows the board');

/* an abandoned cabinet must not block the attract loop forever */
Scores.load();
G.earned = Scores.lowest() + 700;
G.toEntry();
ok(G.entryT > 0, 'the wheel arms an idle timeout');
for (let i = 0; i < (ENTRY_TIMEOUT + 1) * 60 && G.state === 'entry'; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'scores', 'and it confirms itself rather than hanging');
ok(Scores.board.some((e) => e.ini === 'AAA'), 'defaulting to AAA rather than blanks');

```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `G.toEntry is not a function`.

- [ ] **Step 3: Add the constant and state**

Add `ENTRY_TIMEOUT` to the tuning constants at the top of `src/80_game.js`, after `const TITLE_FADE = 0.22;`:

```js
const ENTRY_TIMEOUT = 30;    // seconds idle before the wheel confirms itself
```

Add to the `G` object literal, on the line after `scoresFromShift: false, scoreIdx: -1, attractFlip: false,`:

```js
  entryIni: [0, 0, 0], entrySlot: 0, entryT: 0,
```

Add `ENTRY_TIMEOUT` and `INI_ALPHA` to the harness bridge in `test/headless.mjs` (both the string and the destructuring) if they are not already there from Task 1.

- [ ] **Step 4: Add the transitions**

Add immediately after `toScores()`:

```js
  toEntry() {
    this.state = 'entry';
    this.entryIni = [0, 0, 0];        // all slots start at A, so a timeout yields AAA
    this.entrySlot = 0;
    this.entryT = ENTRY_TIMEOUT;
  },

  commitEntry() {
    const ini = this.entryIni.map((i) => INI_ALPHA[i]).join('');
    this.scoreIdx = Scores.insert(ini, this.earned);
    Audio5.sfx('cash');
    this.toScores(true);
  },
```

`toScores(true)` resets `attractT` but leaves `scoreIdx` alone, which is why `toScores` only clears it in the attract case.

- [ ] **Step 5: Handle the `entry` state in `update()`**

Add immediately after the `if (this.state === 'scores') { ... }` block:

```js
    if (this.state === 'entry') {
      const n = INI_ALPHA.length;
      let acted = false;
      if (Input.p('ArrowUp', 'KeyW'))    { this.entryIni[this.entrySlot] = (this.entryIni[this.entrySlot] + 1) % n; acted = true; }
      if (Input.p('ArrowDown', 'KeyS'))  { this.entryIni[this.entrySlot] = (this.entryIni[this.entrySlot] + n - 1) % n; acted = true; }
      if (Input.p('ArrowLeft', 'KeyA'))  { if (this.entrySlot > 0) this.entrySlot--; acted = true; }
      if (Input.p('ArrowRight', 'KeyD')) { if (this.entrySlot < INI_LEN - 1) this.entrySlot++; acted = true; }
      if (Input.p('Enter', 'NumpadEnter', 'Space')) {
        if (this.entrySlot < INI_LEN - 1) { this.entrySlot++; acted = true; }
        else { this.commitEntry(); return; }
      }
      // the timeout fires on abandonment, not on someone taking their time
      if (acted) { this.entryT = ENTRY_TIMEOUT; Audio5.sfx('tick'); }
      this.entryT -= dt;
      if (this.entryT <= 0) { this.commitEntry(); return; }
      this.simCrowd(dt);
      return;
    }
```

- [ ] **Step 6: Draw it**

In `render()`, beside the other overlay dispatches, add under the `scores` line:

```js
    if (this.state === 'entry')   this.overlayEntry(x);
```

Add the overlay after `overlayScores`:

```js
  /* Arrows only, by design. A keyboard player's instinct is to type, so the
     prompt has to say plainly what drives it — an entry screen a player
     cannot work out is worse than no board at all. */
  overlayEntry(x) {
    x.fillStyle = 'rgba(20,12,28,0.82)'; x.fillRect(0, 0, VW, VH);
    const w = 240, h = 118, px = (VW - w) / 2 | 0, py = 44;
    R(x, PAL.ink, px, py, w, h);
    R(x, '#241a2e', px + 2, py + 2, w - 4, h - 4);
    x.strokeStyle = PAL.amber; x.strokeRect(px + 0.5, py + 0.5, w - 1, h - 1);

    text(x, 'NEW HIGH SCORE', VW / 2, py + 10, PAL.amber, 2, 1);
    text(x, money(this.earned) + '  ' + this.rank(), VW / 2, py + 30, PAL.good, 1, 1);

    // three slots, 24px apart, the active one blinking under a caret
    for (let i = 0; i < INI_LEN; i++) {
      const cx = VW / 2 + (i - 1) * 24, active = i === this.entrySlot;
      const on = !active || (this.time * 3 | 0) % 2 === 0;
      text(x, INI_ALPHA[this.entryIni[i]], cx, py + 48, on ? PAL.bone : PAL.boneDim, 2, 1);
      R(x, active ? PAL.amber : '#3a2c48', cx - 7, py + 66, 14, 1);
    }

    text(x, 'UP/DOWN - LETTER', VW / 2, py + 78, PAL.boneDim, 1, 1);
    text(x, 'LEFT/RIGHT - MOVE', VW / 2, py + 89, PAL.boneDim, 1, 1);
    text(x, 'ENTER - DONE', VW / 2, py + 100, PAL.bone, 1, 1);
  },
```

- [ ] **Step 7: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS.

- [ ] **Step 8: Run the suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines. The sections share one mutable game and run in order, and this one both mutates `G.earned` and leaves the state in `scores`; five runs is how a leak into `— heat —` shows up.

- [ ] **Step 9: Look at it — required**

```js
const T = window.TacoShop, G = T.G;
G.earned = 5000; G.stats = { delivered: 4, perfect: 3, splat: 0, best: 1500, peds: 0, tickets: 0 };
G.toEntry(); T.step(1);
```

Judge: is it obvious the arrows drive it without being told? Are the three slots clearly three slots, and is the active one unmistakable? Does the caret read as a caret at 1×?

- [ ] **Step 10: Commit**

```bash
node build.mjs
git add -A
git commit -m "Sign the board: the initials wheel

Up and down cycle the letter, left and right move between slots, enter
advances and confirms. Arrows only -- the same input scheme the rest of
the game uses, and the only one a gamepad maps to, at the accepted cost
that a keyboard player's instinct is to type. The prompt says plainly
what drives it, which is the whole mitigation.

The alphabet wraps both ways and all three slots start at A, so the
30-second idle timeout yields AAA rather than blanks. The timer resets on
every keypress, so it fires on an abandoned cabinet rather than on
someone taking their time -- without it the attract loop sits blocked
behind the entry screen forever."
```

---

### Task 4: Closing the loop

**Files:**
- Modify: `src/80_game.js`
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `Scores.qualifies(cents)`, `Scores.lowest()`, `G.toEntry()`.
- Produces: `G.placed` — boolean, set by `endShift()`.

- [ ] **Step 1: Write the failing test**

Append to the `— high scores —` section:

```js
/* the shift end routes to the wheel only when the score places */
Scores.load();
Input.down = Object.create(null);
G.startShift();
G.earned = Scores.lowest() + 1000;
G.shift = 0.01;
for (let i = 0; i < 5; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.state === 'results', 'a finished shift still shows the results card first');
ok(G.placed === true, 'and knows the score placed');
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'entry', 'enter from a placing result opens the wheel');
G.toTitle();

Scores.load();
G.startShift();
G.earned = 1;                       // beats nothing on a full board
G.shift = 0.01;
for (let i = 0; i < 5; i++) { G.update(1 / 60); Input.endFrame(); }
ok(G.placed === false, 'a non-placing shift knows it did not place');
Input.hit['Enter'] = true; G.update(1 / 60); Input.endFrame();
ok(G.state === 'play', 'and enter runs it back as it always did');
G.toTitle();

/* the results screen names the target, and it has to fit */
const target = 'BEAT ' + money(Scores.lowest()) + ' TO MAKE THE BOARD';
ok(textW(target, 1) <= VW - 16, `the board target line fits: "${target}" (${textW(target, 1)}px)`);
ok(textW('NEW HIGH SCORE - ENTER TO SIGN', 1) <= VW - 16, 'the placing prompt fits');

```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `and knows the score placed` (`G.placed` is undefined).

- [ ] **Step 3: Record the placing in `endShift()`**

Add `placed: false,` to the `G` object literal beside the other new fields.

In `endShift()`, after `this.shift = 0;`:

```js
    // decided once, here, so the results screen and its Enter key agree
    this.placed = Scores.qualifies(this.earned);
    this.scoreIdx = -1;
```

- [ ] **Step 4: Route Enter from the results screen**

In `update()`, in the `results` branch, replace:

```js
      if (Input.p('Enter', 'NumpadEnter', 'KeyR')) { Audio5.sfx('select'); this.startShift(); }
```

with:

```js
      if (Input.p('Enter', 'NumpadEnter', 'KeyR')) {
        Audio5.sfx('select');
        if (this.placed) this.toEntry(); else this.startShift();
      }
```

- [ ] **Step 5: Name the target on the results screen**

In `overlayResults`, replace:

```js
    if ((this.time * 2 | 0) % 2) text(x, 'ENTER - RUN IT BACK', VW / 2, VH - 22, PAL.bone, 1, 1);
    text(x, 'ESC - TITLE', VW / 2, VH - 11, '#6b5f84', 1, 1);
```

with:

```js
    /* A leaderboard nobody is chasing is a trophy cabinet. Naming the number
       that would put you on it is what turns it into a reason to press ENTER. */
    if (this.placed) {
      if ((this.time * 2 | 0) % 2) text(x, 'NEW HIGH SCORE - ENTER TO SIGN', VW / 2, VH - 22, PAL.amber, 1, 1);
    } else {
      text(x, 'BEAT ' + money(Scores.lowest()) + ' TO MAKE THE BOARD', VW / 2, VH - 32, PAL.boneDim, 1, 1);
      if ((this.time * 2 | 0) % 2) text(x, 'ENTER - RUN IT BACK', VW / 2, VH - 22, PAL.bone, 1, 1);
    }
    text(x, 'ESC - TITLE', VW / 2, VH - 11, '#6b5f84', 1, 1);
```

The results box spans y 24–178, so the new line at y=184 clears it and the two prompts below it.

- [ ] **Step 6: Load the board at boot**

In `G.boot(seed)`, after `Hud.buildMap();`:

```js
    Scores.load();
```

- [ ] **Step 7: Run the tests five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines.

- [ ] **Step 8: Look at it — required**

Play a real shift to its end, twice: once earning enough to place and once not. Judge whether the results screen makes it obvious which happened, and whether pressing ENTER does what the screen just told you it would.

- [ ] **Step 9: Commit**

```bash
node build.mjs
git add -A
git commit -m "Close the loop: place, sign, and a number to chase

endShift decides once whether the score placed, so the results screen and
its ENTER key cannot disagree. Placing routes ENTER to the wheel; not
placing runs the shift back exactly as before.

A shift that misses now gets told what it missed by: BEAT \$6.40 TO MAKE
THE BOARD. One line on a screen that already exists, and it is the
difference between a trophy cabinet and a reason to press ENTER again."
```

---

### Task 5: Ship it

**Files:**
- Modify: `CLAUDE.md`, `ROADMAP.md`, `README.md`, `JOURNAL.md`
- Build: `taco-shop.html`

- [ ] **Step 1: Run the full suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines.

- [ ] **Step 2: Watch a full attract cycle, twice**

Let title → middle → demo run end to end without touching anything, twice, and confirm the middle screen alternates between the winners card and the board.

- [ ] **Step 3: Play a shift end to end**

Place, sign the board, and confirm the row you just wrote is highlighted on the board that follows. Then reload the page and confirm it is still there — that is the whole feature working.

- [ ] **Step 4: Rebuild and check the artifact**

```bash
node build.mjs
ls -l taco-shop.html
grep -c "https\?://" taco-shop.html || echo "no external references"
```

Note the new size; `CLAUDE.md`'s Publishing section quotes it.

- [ ] **Step 5: Update `CLAUDE.md`**

1. Add `78_scores` to the module table: `| `78_scores` | `Scores` — the high-score board: factory content, guarded `localStorage`, qualification, insertion. Model only. |`
2. Add a subsection under **Architecture**:

```markdown
### Scores

The score **is** the money — `G.earned`, integer cents. There is no second number, because `earned`
already integrates speed (the tip decay), accuracy (the perfect bonus), consistency (the combo) and
restraint (the fines).

A board entry stores `{ ini, cents }` and nothing else. **The rank title is derived at draw time**
through `G.rank()`, so retuning the rank thresholds reflows the whole board instead of leaving stale
titles baked into storage.

**Every `localStorage` access in `78_scores.js` is wrapped, and that is load-bearing rather than
defensive habit.** Chrome treats a `file://` page as an opaque origin and *throws* `SecurityError` on
touch — and `taco-shop.html` is meant to be opened exactly that way. An unguarded read would blank
the game on its main distribution path. The headless harness has no `localStorage` at all, so the
suite exercises the fallback by default. Anything stored that fails to parse, or parses to the wrong
shape, is **discarded** in favour of the factory board rather than repaired.

The attract middle slot **alternates** between the winners card and the board, so the rotation stays
135s rather than growing a fourth screen. `G.attractFlip` is the whole mechanism.

Initials entry is **arrows only** — up/down cycle, left/right move, Enter confirms — which is the
one input scheme the rest of the game uses and the only one a gamepad maps to. A keyboard player's
instinct is to type; the on-screen prompt is the entire mitigation, so don't trim it. A 30-second
idle timeout confirms `AAA` rather than letting an abandoned cabinet block the attract loop.
```

3. Update the artifact size in **Publishing** and the assertion count in **Testing**, and add `— high scores —` to the list of labelled sections.

- [ ] **Step 6: Update `ROADMAP.md`**

Remove the **Score and high-score screen** item from Features. Add to *Landed, for the record* a note covering: the score is the money; the board is ten places persisted in guarded `localStorage` with a factory board in `content/scores.json`; entry is the cabinet wheel; and the attract slot alternates rather than growing.

- [ ] **Step 7: Update `README.md`**

Add a line to **How it plays** naming the board, and mention `content/scores.json` in the paragraph that lists the authored content files.

- [ ] **Step 8: Update `JOURNAL.md`**

Record: why the score is the money rather than a points system; the `file://` `localStorage` throw and why the wrapper is not paranoia; why ties go below the incumbent; why the attract slot alternates; and anything that did not work while building it.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "High scores complete: docs, and the artifact rebuilt"
```

---

## Self-Review

**Spec coverage:**

| spec section | task |
|---|---|
| §2 score is the money; entries store `{ini, cents}`; rank derived | Task 1 (model), Task 2 (derived at draw) |
| §3 two states, alternating attract slot, demo never posts | Task 2 (states + alternation), Task 4 (shift end) |
| §4 guarded `localStorage`, versioned key, discard bad data | Task 1 |
| §5 factory board as content, five build guards | Task 1 |
| §6 layout, ten rows, widest row fits | Task 2 |
| §7 the wheel — 27 chars, wraps, starts at A, idle timeout | Task 3 |
| §8 `78_scores.js` model / `80_game.js` presentation split | Task 1 + Task 2 |
| §9 the `BEAT $x` results line | Task 4 |
| §11 all ten test items | Tasks 1–4 |

Spec §11 item 10 — "the demo still never posts a score" — needs no new code: `update()` already routes a demo that outlasts the clock to `toTitle()` rather than `endShift()`, and the existing `— attract —` section asserts it. Noted here so the omission reads as a decision rather than a gap.

**Type consistency:** `Scores.insert(ini, cents)` returns an index, consumed as `G.scoreIdx` in Task 3 and read by `overlayScores` in Task 2. `G.toScores(fromShift)` takes one boolean everywhere it is called. `G.entryIni` is an array of *indices into `INI_ALPHA`*, never characters — `commitEntry` and `overlayEntry` both map through `INI_ALPHA` to get letters, and the test asserts against `INI_ALPHA[G.entryIni[0]]`.

**Ordering hazard:** Task 2's overlay calls `Scores.board`, so Task 1 must land first. Task 3's `commitEntry` calls `toScores`, defined in Task 2. Task 4 calls `toEntry`, defined in Task 3. The tasks are strictly ordered and each says what it consumes.

**A note on `rank.call({ earned })`:** `G.rank()` reads only `this.earned`. Calling it against a bare object is what lets a board row derive its own title without duplicating the thresholds — but it means **`rank()` must not start reading any other field**. If it ever does, `overlayScores` breaks. Stated here because the coupling is invisible at the call site.
