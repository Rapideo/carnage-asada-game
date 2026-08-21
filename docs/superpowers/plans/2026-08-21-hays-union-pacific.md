# The Union Pacific Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a live train on the Union Pacific corridor, with crossing gates that lower, a wreck that cannot trap you, and a cruiser that is not exempt — turning the tracks from a wall into the highest-risk shortcut in the game.

**Architecture:** `Train` is a rail-bound entity in the mould of `Traffic` — fixed `y`, constant speed, no steering, no interpolation — and `Crossing` is a small state machine, one per level crossing, that watches the train's distance and animates its gate arms. Both live in `50_entities.js`. `City.crossings` says *where* the crossings are (baked at generation, Plan 2); `G.crossings` says what they are *doing* (live, rebuilt each shift). No new solid geometry is added: the gates are drawn, never solid, so the corridor's collision surface is exactly what Plan 2 already shipped and the wedge sweep already covers.

**Tech Stack:** Plain ES5-style browser JavaScript (no modules, no imports), Node 18+ for `build.mjs` and the test harness, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-21-hays-neighbourhood-design.md` (§8 the Union Pacific, §10 testing)

**Predecessors:** `docs/superpowers/plans/2026-08-21-hays-map.md` (landed, 5 commits) and `docs/superpowers/plans/2026-08-21-hays-block-kinds.md` (landed, 6 commits). This is the third and last plan in the series.

## Global Constraints

Everything in Plan 1's and Plan 2's Global Constraints still applies verbatim. Restated here because the engineer may be reading this plan alone:

- **Zero dependencies.** No `package.json`, no `node_modules`, no imports, no CDN, no external asset files. Every sprite and all audio is generated procedurally at boot.
- **`src/*.js` are plain scripts, not ES modules.** All modules share one global scope in the bundle, so a top-level `const` declared twice across two files is a fatal redeclaration that surfaces only in the bundle. `node test/headless.mjs` concatenates the same way and will catch it.
- **The numeric filename prefix is the load order and therefore the dependency order.** `40_city` loads before `50_entities` before `75_demo` before `80_game`, which is why `Train` and `Crossing` can live in `50_entities.js` and be constructed from `80_game.js`.
- **`src/05_content.js` is generated. Never edit it by hand.**
- **`node build.mjs` must be re-run before `taco-shop.html` reflects source edits.** `index.html` loads `src/*.js` directly, so the dev page does not need it.
- **The 5×7 font is ASCII-only** and uppercase. Banner boxes are `textW(str, 2) + 16` and must fit the 384px screen.
- **Do not touch `classify()` in `00_core.js`.** Six modules depend on its uniform-pitch assumption.
- **Do not add solid geometry.** Plan 2 already added the largest collision surface in the game (roughly 1600px of ballast edge). The gates are drawn, not solid — §8 is explicit, and it is what makes the crossing a gamble rather than a wall.
- **`cam` passed to a `draw(ctx, cam)` is a rounded, shake-offset copy.** Use the argument, never `G.cam`, inside draw code.
- **`PAL.jade`/`PAL.gold` are badge-only and `PAL.cyan` is guidance-only.** The train uses literal hexes, the way `buildRail` and every other prop already does.
- **Look at every change in the browser before committing it.** The test harness stubs every drawing call, so it cannot see a sprite at the wrong offset, a gate arm that sorts under the road, or a train that reads as a smear. Rendering and looking is a required step, not a nicety.
- **Commit after every task.** Do not skip hooks.

---

## What Plan 2 already landed, and the numbers that follow from it

Read these off the code before starting; every task below depends on them.

| fact | value | where |
|---|---|---|
| corridor centre | `City.railY` = 512 | `genRail`, `40_city.js` |
| crossbuck mast sprite | 11×28 with `oy` = 26 — its head is 26px **above** its ground anchor | `buildRail`, `30_art.js` |
| rail tile rows | `ty` 31 and 32 → world y 496–527 | `genRail` |
| ballast band | `ty` 30–33 → world y 480–543 | `genRail` |
| track centres | 504 (north) and 520 (south) | derived: rails bake at tile-local y 4 and 10 |
| level crossings | 9, in `City.crossings` as `{x, y}` | `genRail` |
| crossing road width | 32px, `x` from `c.x - 16` to `c.x + 16` | the north-south street at the block edge |

The corridor carries **two tracks**, because `genRail` bakes a two-rail tile into both of its rail rows. A train running down `railY` would straddle them and read as floating, so a train must run on one of the two centres. Task 1 records them as `City.tracks` and picks by direction — **eastbound keeps to the south track**, which is the same right-hand-running convention `Traffic.laneFixed` already encodes (`dir === 0` takes the `+24` half of the road).

---

## File Structure

| file | responsibility | change |
|---|---|---|
| `src/20_audio.js` | Two new named sfx: `bell` (the two-tone crossing bell) and `trainhorn`. | modify |
| `src/30_art.js` | `buildTrain()` — locomotive and three boxcar liveries, baked facing east and mirrored for west. | modify |
| `src/40_city.js` | `genRail` records `City.tracks` and a gate-arm pivot per crossbuck mast; the masts move clear of the tracks to make room for the arms. | modify |
| `src/50_entities.js` | `Train` and `Crossing` classes; traffic brakes at a closed crossing. | modify |
| `src/75_demo.js` | The demo waits at a closed crossing. | modify |
| `src/80_game.js` | Train schedule, live crossing state, the wreck, the cop interaction, heat for running a gate, render-list entries. | modify |
| `test/headless.mjs` | New `— rail —` section; two banners added to `— hud layout —`; the attract stall bound widened. | modify |
| `JOURNAL.md`, `ROADMAP.md`, `CLAUDE.md` | Reasoning, status, architecture notes. | modify (Task 6) |

**Execution order runs downhill from "can be seen" to "cannot be seen":** the train first (visible immediately, no rules attached), then the gates that react to it, then the wreck, then the cop, then the two world-consistency touches. Every task ships something playable.

---

### Task 1: The train runs

**Files:**
- Modify: `src/30_art.js` (add `buildTrain`, declare `loco`/`boxcar`, call it in `build()`)
- Modify: `src/40_city.js` (`genRail` records `City.tracks`)
- Modify: `src/50_entities.js` (add `Train`)
- Modify: `src/80_game.js` (`G.train`, `G.trainT`, `resetRail`, schedule, render list)
- Modify: `src/20_audio.js` (`trainhorn`)
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `City.railY` (number), `City.crossings` (array of `{x, y}`) — both from Plan 2.
- Produces:
  - `City.tracks` — `[northY, southY]`, the two track centre lines in world px.
  - `Art.loco` — `[westFacingCanvas, eastFacingCanvas]`.
  - `Art.boxcar` — array of `[west, east]` pairs, one per livery.
  - `class Train` — `new Train(dir, y)` where `dir` is `+1` east / `-1` west. Fields: `x` (the **nose**), `y`, `dir`, `len`, `dead`. Getters `x0`/`x1` (west and east edges of the whole consist). Methods `hits(e)` → boolean for any entity with `x`, `y`, `ang`; `update(dt, G)`; `draw(ctx, cam)`.
  - `G.train` — the live train or `null`. `G.trainT` — seconds until the next one.
  - `G.resetRail()` — rebuilds live rail state; called from `startShift()` and `toTitle()`.

- [ ] **Step 1: Write the failing test**

Add a new section to `test/headless.mjs` immediately before `console.log('\n— heat —');`:

```js
console.log('\n— rail —');
/* This section drives a real shift, so reset the input the earlier sections
   left held. Note it also leaves the game in `play` — which is what finally
   lets `— heat —` below exercise a live pursuit instead of a title screen. */
Input.down = Object.create(null); Input.anyKey = false; Input.mhit = false; Input.hasMouse = false;
G.startShift();

ok(Array.isArray(City.tracks) && City.tracks.length === 2,
   `two track centre lines in the corridor: ${(City.tracks || []).join(' / ')}`);
ok(Array.isArray(Art.loco) && Art.loco.length === 2 && Art.boxcar.length > 1,
   `a locomotive both ways and ${(Art.boxcar || []).length} boxcar liveries`);

/* a train crosses the whole map and despawns, without the scheduler quietly
   starting a second one underneath the assertion */
G.trainT = 999;
G.train = new Train(1, City.tracks[1]);
ok(G.train.len > 300, `the consist is ${G.train.len}px nose to tail`);
let ran = 0;
for (let i = 0; i < 20 * 60 && G.train; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.train) { ran++; if (!finite(G.train.x)) break; }
}
ok(G.train === null, `the train crossed the map and despawned (${(ran / 60).toFixed(1)}s)`);
ok(ran > 5 * 60, 'it took several seconds to do it, rather than teleporting');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL on `two track centre lines`, then a `ReferenceError: Train is not defined`.

- [ ] **Step 3: Hand `Train` out to the harness**

`test/headless.mjs` runs the modules in a `node:vm` sandbox, and top-level `const`/`class` names live in the script's lexical scope — they **never** appear on the sandbox global. The harness appends an explicit bridge line; extend it.

Add `Train,` after `Player,` in **both** the `globalThis.__x = {...}` string and the destructuring below it:

```js
vm.runInContext(code + '\n;globalThis.__x = { G, City, Nav, Art, Input, Fx, Demo, solve, textW, MAXTHROW,' +
  ' ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, VW, VH, WW, WH, Player, Train, carBlocked, TS, GW, HSTREETS, VSTREETS };',
  sandbox, { filename: 'bundle.js' });

const { G, City, Nav, Art, Input, textW, MAXTHROW, VW, VH, WW, WH,
        ATTRACT_TITLE, ATTRACT_WINNERS, ATTRACT_DEMO, Player, Train, carBlocked, TS, GW, HSTREETS, VSTREETS } = sandbox.__x;
```

Add **only** `Train` here. `Crossing` does not exist until Task 2, and naming it in the bridge before then throws.

- [ ] **Step 4: Record the track centres in `src/40_city.js`**

In `genRail`, immediately after the line `this.railY = (BORDER + by * SPAN + MID) * TS;`:

```js
    /* The corridor carries two tracks: each rail tile bakes a pair of rails,
       and genRail lays two rows of them. A train running down railY would
       straddle both and read as floating, so it has to pick one. Right-hand
       running, the same convention Traffic.laneFixed uses for the road:
       eastbound keeps to the south track. */
    this.tracks = [this.railY - 8, this.railY + 8];
```

Then declare it alongside the other per-generation fields, at `src/40_city.js:41`:

```js
    this.statics = []; this.houses = []; this.crossings = []; this.tracks = null;
```

- [ ] **Step 5: Bake the train in `src/30_art.js`**

Add `buildTrain()` as a method on `Art`, immediately after `buildRail`:

```js
  /* ---------- rolling stock ------------------------------- */
  /* Baked facing east and mirrored for west. Every road vehicle gets 16
     rotFrames; the train only ever runs east-west, so 14 of those would be
     unused frames of a 58px sprite. The trucks deliberately stick out past
     the body top and bottom — that overhang is what stops a flat slab from
     reading as a shipping container lying in a field. */
  buildTrain() {
    const H = 16, B0 = 3, BH = 10;          // body rows 3..12, trucks 0..2 and 13..15
    const flip = (src) => {
      const t = mkCanvas(src.width, src.height);
      t.x.imageSmoothingEnabled = false;
      t.x.translate(src.width, 0); t.x.scale(-1, 1);
      t.x.drawImage(src, 0, 0);
      return t.c;
    };
    const trucks = (x, len) => {
      for (const tx of [4, len - 17]) {
        R(x, '#15121c', tx, 0, 13, 3);
        R(x, '#3a3644', tx + 1, 1, 11, 1);
        R(x, '#15121c', tx, H - 3, 13, 3);
        R(x, '#3a3644', tx + 1, H - 2, 11, 1);
      }
    };

    /* locomotive: cab at the rear, long hood forward, Armour Yellow */
    const L = 58, lo = mkCanvas(L, H), lx = lo.x;
    trucks(lx, L);
    R(lx, '#15121c', 0, B0 - 1, L, BH + 2);
    R(lx, '#d8a838', 1, B0, L - 2, BH);
    R(lx, '#eec457', 1, B0, L - 2, 1);
    R(lx, '#a97f22', 1, B0 + BH - 1, L - 2, 1);
    R(lx, '#2f333d', 2, B0, 13, BH);                     // cab
    R(lx, PAL.glass, 4, B0 + 2, 4, BH - 4);
    R(lx, PAL.glassHi, 4, B0 + 2, 4, 1);
    R(lx, '#8d919c', 18, B0 + 1, 34, BH - 2);            // long hood
    R(lx, '#a4a8b4', 18, B0 + 1, 34, 1);
    for (let i = 0; i < 5; i++) R(lx, '#6a6e78', 21 + i * 6, B0 + 2, 2, BH - 4);
    R(lx, '#15121c', L - 5, B0, 5, BH);                  // nose
    R(lx, '#fff2c0', L - 2, B0 + 4, 2, 2);               // headlight
    this.loco = [flip(lo.c), lo.c];                      // [0] west-facing, [1] east

    /* three liveries, so a consist does not read as one tile repeated */
    this.boxcar = [];
    for (const [body, dark] of [['#8c4030', '#652a20'], ['#767a86', '#565a66'], ['#6b563c', '#4c3d29']]) {
      const W = 48, bc = mkCanvas(W, H), bx = bc.x;
      trucks(bx, W);
      R(bx, '#15121c', 0, B0 - 1, W, BH + 2);
      R(bx, body, 1, B0, W - 2, BH);
      R(bx, shade(body, 0.18), 1, B0, W - 2, 1);
      R(bx, dark, 1, B0 + BH - 1, W - 2, 1);
      R(bx, dark, 1, B0 + 4, W - 2, 2);                  // door track along the side
      R(bx, shade(body, -0.18), 20, B0, 9, BH);          // sliding door
      R(bx, shade(body, 0.10), 20, B0, 1, BH);
      R(bx, shade(body, 0.10), 28, B0, 1, BH);
      for (let i = 0; i < 3; i++) R(bx, dark, 6 + i * 4, B0 + 1, 1, BH - 2);
      for (let i = 0; i < 3; i++) R(bx, dark, 33 + i * 4, B0 + 1, 1, BH - 2);
      this.boxcar.push([flip(bc.c), bc.c]);
    }
  },
```

Declare the fields on the `Art` object literal — `src/30_art.js:82` currently ends `taqueria: null, splat: [], signal: null,`; add `loco: null, boxcar: [],` to it.

Call it from `Art.build()`, on the line after `this.buildRail(...)`:

```js
    this.buildTrain();
```

- [ ] **Step 6: Add the train horn to `src/20_audio.js`**

In the `sfx(name)` switch, next to `case 'horn':`:

```js
      case 'trainhorn': this.tone(146, 0.55, 'sawtooth', 0.15); this.tone(196, 0.55, 'sawtooth', 0.12, 0, 0.02); this.tone(233, 0.50, 'sawtooth', 0.09, 0, 0.04); break;
```

Three notes rather than one: a single tone reads as a car horn dropped an octave, and the whole point of the horn is that it does not sound like traffic.

- [ ] **Step 7: Add `Train` to `src/50_entities.js`**

Add after the `Traffic` class and before `Ped`:

```js
/* ---------------- the Union Pacific ----------------------- */
/* Rail-bound in the same sense Traffic is: fixed y, constant speed, no
   steering, no interpolation. It is the one hazard in the game that cannot be
   negotiated with, which is exactly why the crossings matter. */
const TRAIN_SPD = 250;              // px/s — about 8s to clear the 1632px map
const LOCO_LEN = 58, CAR_LEN = 48, CAR_GAP = 5;
const TRAIN_HH = 7;                 // hit-box half-height: the body, not the trucks

class Train {
  /* dir is +1 east, -1 west. `x` is always the NOSE, whichever way it runs. */
  constructor(dir, y) {
    this.dir = dir; this.y = y;
    this.cars = [];
    let off = 0;
    this.cars.push({ len: LOCO_LEN, img: Art.loco[dir > 0 ? 1 : 0], off });
    off += LOCO_LEN + CAR_GAP;
    const n = 5 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const b = Art.boxcar[(Math.random() * Art.boxcar.length) | 0];
      this.cars.push({ len: CAR_LEN, img: b[dir > 0 ? 1 : 0], off });
      off += CAR_LEN + CAR_GAP;
    }
    this.len = off - CAR_GAP;
    this.x = dir > 0 ? -20 : WW + 20;
    this.horn = 0.4;
    this.dead = false;
  }
  get x0() { return this.dir > 0 ? this.x - this.len : this.x; }
  get x1() { return this.x0 + this.len; }

  /* One box, nose to tail, gaps included. A 5px coupler gap is not a hole a
     car can be inside, and pretending it is would invite a threaded-the-needle
     bug on the one hazard that must never be survivable by accident. */
  hits(e) {
    const c = Math.cos(e.ang), s = Math.sin(e.ang), x0 = this.x0, x1 = this.x1;
    for (let i = 0; i < CORNERS.length; i++) {
      const lx = CORNERS[i][0], ly = CORNERS[i][1];
      const px = e.x + lx * c - ly * s, py = e.y + lx * s + ly * c;
      if (px > x0 && px < x1 && py > this.y - TRAIN_HH && py < this.y + TRAIN_HH) return true;
    }
    return false;
  }

  update(dt, G) {
    this.x += this.dir * TRAIN_SPD * dt;
    if (this.dir > 0 ? this.x0 > WW + 40 : this.x1 < -40) this.dead = true;
    this.horn -= dt;
    if (this.horn <= 0 && G.nearScreen(this.x, this.y)) { Audio5.sfx('trainhorn'); this.horn = 3.4; }
  }

  draw(x, cam) {
    for (const c of this.cars) {
      const nose = this.dir > 0 ? this.x - c.off : this.x + c.off;
      const left = this.dir > 0 ? nose - c.len : nose;
      const sx = (left - cam.x) | 0;
      if (sx > VW + 8 || sx + c.len < -8) continue;
      const sy = (this.y - cam.y - 8) | 0;
      x.fillStyle = PAL.shadow;
      x.fillRect(sx, sy + 5, c.len, 14);
      x.drawImage(c.img, sx, sy);
    }
  }
}
```

- [ ] **Step 8: Schedule it in `src/80_game.js`**

Add to the `G` object literal, on the line after `player: null, traffic: [], peds: [], flying: [], cop: null, copT: 0,`:

```js
  train: null, trainT: 0, crossings: [], railSide: 0, wreckCd: 0,
```

Add `resetRail` as a method, immediately after `dropCop()`:

```js
  /* City.crossings is WHERE the crossings are, baked once at generation.
     G.crossings is what they are DOING, and is rebuilt per shift. */
  resetRail() {
    this.train = null;
    this.trainT = rand(10, 22);
    this.railSide = 0;
    this.wreckCd = 0;
    this.crossings = [];          // Task 2 fills this with Crossing instances
  },
```

`Crossing` does not exist yet, which is why that last line is a placeholder for this task only. Everything else in `resetRail` is final.

Call it from `startShift()` (on the line after `this.flying.length = 0; Fx.clear();`) and from `toTitle()` (on the line after `this.cop = null; Nav.clear(); Fx.clear();`):

```js
    this.resetRail();
```

In `update(dt)`, in the shared play/demo body, immediately after the peds block's `while (this.peds.length < 24) this.spawnPed();`:

```js
    /* the Union Pacific */
    this.trainT -= dt;
    if (!this.train && this.trainT <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      // eastbound keeps to the south track — City.tracks is [north, south]
      this.train = new Train(dir, City.tracks[dir > 0 ? 1 : 0]);
      this.trainT = rand(22, 40);
    }
    if (this.train) {
      this.train.update(dt, this);
      if (this.train.dead) this.train = null;
    }
```

- [ ] **Step 9: Put it in the render list**

In `G.render(x)`, in the y-sorted sprite pass, immediately after `if (this.cop) rl.push({ sortY: this.cop.y, e: this.cop });`:

```js
    if (this.train) rl.push({ sortY: this.train.y, e: this.train });
```

- [ ] **Step 10: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS, including the new `— rail —` assertions.

- [ ] **Step 11: Look at it — required**

Run `node serve.mjs`, open `http://localhost:8123`, and put the camera on the corridor with a train coming. Freeze the sim, position the camera, then let it run:

```js
const T = window.TacoShop, G = T.G;
G.startShift();
G.player.x = T.City.crossings[4].x; G.player.y = T.City.railY + 90;
G.cam.x = G.player.x - 192; G.cam.y = G.player.y - 108;
G.trainT = 0;                      // the scheduler produces one within a frame
```

To hold a single frame for inspection, swap `G.update` for a no-op (`const keep = G.update; G.update = () => {};`) and restore it afterwards — never `delete` it, `G` is a plain object.

Judge: does the train sit **on** a track rather than between them? Do the trucks read at 1×, or is it a yellow smear? Drive alongside it and confirm the sort order against your own car looks right. Iterate on `buildTrain` until it reads, then re-run the suite.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "Run a train down the Union Pacific

Train is rail-bound the way Traffic is: fixed y, constant speed, no
steering. It picks one of the corridor's two tracks by direction --
eastbound keeps to the south rail, the same right-hand convention
Traffic.laneFixed already uses for the road -- because a train running
down railY straddles both and reads as floating.

The consist bakes facing east and mirrors for west. Every road vehicle
gets 16 rotFrames; a train that only ever runs east-west would spend 14
of them on a 58px sprite nobody draws."
```

---

### Task 2: The gates

**Files:**
- Modify: `src/40_city.js` (`genRail` moves the crossbuck masts clear of the tracks and records a gate pivot on each)
- Modify: `src/50_entities.js` (add `Crossing`)
- Modify: `src/80_game.js` (`resetRail` builds them, `update` ticks them, `render` draws them)
- Modify: `src/20_audio.js` (`bell`)
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `City.crossings` (`{x, y}` per crossing), `G.train` (a `Train` or `null`, with `x0`/`x1`/`dir`/`len`).
- Produces:
  - Each entry of `City.crossings` gains `masts` — a two-element array of `[x, y]` world points where a gate arm pivots.
  - `class Crossing` — `new Crossing(cityCrossing)`. Fields: `x`, `y`, `masts`, `t` (0 = up, 1 = down), `down` (boolean, true past `t > 0.55`). Methods `update(dt, G)`, `draw(ctx, cam)`.
  - `G.crossings` — array of `Crossing`, one per entry of `City.crossings`.

- [ ] **Step 1: Write the failing test**

Append to the `— rail —` section of `test/headless.mjs`, after the despawn assertions from Task 1:

```js
ok(G.crossings.length === City.crossings.length,
   `${G.crossings.length} live crossings built from the ${City.crossings.length} in the city`);
ok(City.crossings.every((c) => Array.isArray(c.masts) && c.masts.length === 2),
   'every crossing carries two gate pivots');

/* gates go down for a train and come back up after it */
G.trainT = 999;
G.train = new Train(1, City.tracks[1]);
let sawDown = false;
for (let i = 0; i < 20 * 60 && G.train; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.crossings.some((c) => c.down)) sawDown = true;
}
ok(sawDown, 'gates went down as the train passed');
for (let i = 0; i < 120; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); }
ok(G.crossings.every((c) => c.t === 0 && !c.down),
   'every gate came back up — none stuck closed');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `0 live crossings built from the 9 in the city`.

- [ ] **Step 3: Add `Crossing` to the harness bridge**

In `test/headless.mjs`, add `Crossing,` next to `Train,` in **both** the `globalThis.__x = {...}` string and the destructuring below it. It is not referenced by the assertions above, but Task 3's and Task 4's are easier to write with it in hand, and adding it once avoids a second edit to the bridge.

- [ ] **Step 4: Move the masts clear and record the pivots (`src/40_city.js`)**

In `genRail`, replace the whole `addCrossing` function with:

```js
    const addCrossing = (col) => {
      const cx = (BORDER + col * SPAN) * TS + TS;
      if (this.crossings.some((c) => Math.abs(c.x - cx) < 4)) return;
      // a crossbuck on each approach, diagonally opposed like the real thing.
      // 44px off the centre line rather than ~20. The mast sprite is 28 tall
      // with oy = 26, so its head sits 26px ABOVE the anchor — at +22 the
      // south crossbuck lands on top of the south track and is drawn straight
      // through by the train. 44 is the first offset that clears it, and it
      // puts both masts outside the ballast band rather than in it.
      const s = Art.signal, masts = [];
      for (const [ox, oy] of [[-24, 44], [22, -44]]) {
        const px = cx + ox, py = this.railY + oy;
        this.statics.push({ img: s.c, x: px, y: py, oy: s.oy, w: s.w, h: s.h, sortY: py + s.h, noShadow: true });
        masts.push([px + 5, py]);            // the mast centre line, at its base
      }
      this.crossings.push({ x: cx, y: this.railY, masts });
    };
```

- [ ] **Step 5: Add the bell to `src/20_audio.js`**

In the `sfx(name)` switch, next to `case 'trainhorn':`:

```js
      case 'bell':    this.tone(1046, 0.10, 'sine', 0.09); this.tone(1318, 0.12, 'sine', 0.08, 0, 0.09); break;
```

- [ ] **Step 6: Add `Crossing` to `src/50_entities.js`**

Add immediately after the `Train` class:

```js
/* ---------------- level crossing -------------------------- */
/* The gates are DRAWN, never solid. You can always run one, which is the
   gamble the whole corridor is built around; what running one costs you is
   handled in 80_game. This class only knows how to watch a train and swing
   two arms. */
const GATE_LOWER = 0.7;     // seconds, up to down
const GATE_WARN  = 520;     // px of approach before the arms start moving
const GATE_CLEAR = 40;      // px past the tail before they lift
const GATE_ARM   = 34;      // arm length: reaches across the 32px crossing road
const BELL_T     = 0.55;

class Crossing {
  constructor(c) {
    this.x = c.x; this.y = c.y; this.masts = c.masts;
    this.t = 0; this.down = false; this.bell = 0; this.lamp = 0;
  }

  update(dt, G) {
    const tr = G.train;
    let want = false;
    if (tr) {
      // how far the crossing is AHEAD of the nose, along the way it is going
      const ahead = tr.dir > 0 ? this.x - tr.x1 : tr.x0 - this.x;
      want = ahead < GATE_WARN && ahead > -(tr.len + GATE_CLEAR);
    }
    this.t = clamp(this.t + (want ? dt : -dt) / GATE_LOWER, 0, 1);
    this.down = this.t > 0.55;
    this.lamp += dt;
    this.bell -= dt;
    if (!want) this.bell = 0;
    else if (this.bell <= 0 && G.nearScreen(this.x, this.y)) { Audio5.sfx('bell'); this.bell = BELL_T; }
  }

  /* The arm swings in the GROUND plane, not up and down. A raised arm in a
     top-down view points at the sky and foreshortens to nothing, so animating
     it vertically reads as a gate that vanished; swinging it from
     parallel-with-the-track to across-the-road is what every top-down game
     does, and what a player reads instantly. */
  drawArm(x, cam, m, a0, a1) {
    const a = a0 + (a1 - a0) * this.t;
    x.save();
    x.translate((m[0] - cam.x) | 0, (m[1] - cam.y) | 0);
    x.rotate(a);
    for (let i = 0; i < 5; i++) {                 // 4 + 5*6 = GATE_ARM px
      x.fillStyle = i & 1 ? '#e8e4d8' : PAL.red;
      x.fillRect(4 + i * 6, -1, 6, 3);
    }
    x.fillStyle = '#3c4250'; x.fillRect(-2, -2, 6, 5);
    x.restore();
  }

  /* The crossbuck's two red lamps are baked into the static, so the flashing
     pair is drawn over them rather than animated in place. */
  drawLamps(x, cam, m) {
    if (this.t <= 0) return;
    const on = ((this.lamp * 3) | 0) & 1;
    const ly = (m[1] - 6 - cam.y) | 0;
    x.fillStyle = on ? '#ff6a52' : '#5a1a12';
    x.fillRect((m[0] - 4 - cam.x) | 0, ly, 3, 3);
    x.fillStyle = on ? '#5a1a12' : '#ff6a52';
    x.fillRect((m[0] + 2 - cam.x) | 0, ly, 3, 3);
  }

  draw(x, cam) {
    // south mast swings from pointing south (clear) to pointing east (across);
    // north mast from north to west. Both take the short way round.
    this.drawArm(x, cam, this.masts[0], PI / 2, 0);
    this.drawArm(x, cam, this.masts[1], -PI / 2, -PI);
    this.drawLamps(x, cam, this.masts[0]);
    this.drawLamps(x, cam, this.masts[1]);
  }
}
```

- [ ] **Step 7: Wire it into `src/80_game.js`**

In `resetRail()`, replace Task 1's placeholder line with the real one:

```js
    this.crossings = City.crossings.map((c) => new Crossing(c));
```

In `update(dt)`, immediately after the train block added in Task 1:

```js
    for (const c of this.crossings) c.update(dt, this);
```

In `render(x)`, immediately after the train's render-list push:

```js
    for (const c of this.crossings)
      if (this.nearScreen(c.x, c.y)) rl.push({ sortY: c.y + 30, e: c });
```

`c.y + 30` puts a crossing's arms in front of the train and in front of a car waiting at the gate — which is right: a lowered arm is above car height, and a car stopped at the gate is behind it.

- [ ] **Step 8: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS.

- [ ] **Step 9: Look at it — required**

Serve the dev page and park next to a crossing with a train coming:

```js
const T = window.TacoShop, G = T.G;
G.startShift();
G.player.x = T.City.crossings[4].x; G.player.y = T.City.railY + 90;
G.cam.x = G.player.x - 192; G.cam.y = G.player.y - 108;
G.trainT = 0;
```

Judge: do the arms swing *across the road* and stop there, or sweep past it? Are the lamps visibly flashing at 1×, or lost in the crossbuck? Does an arm ever lie on the track the train uses? Does a gate stay down after the train has gone? Watch at least two full trains, one each way.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "Lower the gates for the train

Each crossing watches the train's distance and swings two arms in the
ground plane, with flashing lamps and a two-tone bell. The arms swing
sideways rather than up: a raised arm in a top-down view points at the
sky and foreshortens to nothing, which reads as a gate that vanished.

The crossbuck masts move from ~20px off the centre line to 44. The mast
sprite's head sits 26px above its anchor, so at +22 the south crossbuck
lay on the south track and the train drew straight through it.

City.crossings is where the crossings are; G.crossings is what they are
doing. The gates are drawn, never solid -- you can always run one."
```

---

### Task 3: The wreck

**Files:**
- Modify: `src/80_game.js` (`RAIL_EJECT`, `wreck()`, the hit test)
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `Train.hits(e)`, `City.railY`, `G.crossings`, `carBlocked(x, y, ang)` (from `50_entities.js`), `City.nodeX/nodeY/nearNodeX/nearNodeY`.
- Produces: `G.wreck()` — no arguments, no return. `G.wreckCd` — seconds of immunity after one.

**This is the task the spec calls the single most important line of code in the feature.** A wreck that leaves the car on the rails is a repeat-hit loop: the same class of defect as the collision wedge, unescapable by any input rather than merely awkward. The assertion in Step 1 is the guard, and it is not optional.

- [ ] **Step 1: Write the failing test**

Append to the `— rail —` section:

```js
/* THE softlock guard. A wreck that leaves the car on the rails is a repeat-hit
   loop — unescapable by any input, the same class of defect as the collision
   wedge that unwedge() exists to prevent. */
G.trainT = 999; G.train = null;
const cross = G.crossings[4];
G.player.x = cross.x; G.player.y = City.railY;
G.player.vx = G.player.vy = 0; G.player.ang = -Math.PI / 2; G.player.spinT = 0;
G.bag = 3; G.needPickup = false; G.wreckCd = 0;
G.train = new Train(1, City.tracks[1]);
G.train.x = cross.x - 140;
let wrecked = false;
for (let i = 0; i < 5 * 60; i++) {
  G.update(1 / 60); G.render(ctx); Input.endFrame();
  if (G.banner === 'HIT BY TRAIN') wrecked = true;
}
ok(wrecked, 'a car parked on the rails is hit by the train');
const off = Math.abs(G.player.y - City.railY);
ok(off > 40, `the wreck threw the car clear of the corridor (${off.toFixed(0)}px off the rails)`);
ok(!carBlocked(G.player.x, G.player.y, G.player.ang),
   'and left it somewhere it can actually drive out of');
ok(G.bag === 0 && G.needPickup, 'the load is lost and the nav sends you back to the shop');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `a car parked on the rails is hit by the train`.

- [ ] **Step 3: Add the eject distance and the wreck to `src/80_game.js`**

Add to the tuning constants at the top of the file, after `const BAG_MAX = 3;`:

```js
const RAIL_EJECT = 52;      // px from the corridor centre a wreck throws you
```

52 is not arbitrary: the ballast band runs y 480–543, `railY` is 512, and a car's body reaches 9px along its long axis — so 52 clears the ballast by 11px to the north and 12px to the south. Anything smaller can leave a corner inside the geometry.

Add `wreck()` as a method immediately after `onCrash()`:

```js
  /* THE most important function in this feature. A wreck that leaves the car
     on the rails is a repeat-hit loop, which is the same class of defect as
     the collision wedge: not merely awkward but unescapable by any input.
     Throwing the car clear is the safety property, not a polish step. */
  wreck() {
    const p = this.player;
    this.wreckCd = 1.5;

    /* Out along the crossing road it was hit on. A wreck can only happen where
       the corridor is not solid, which is a crossing, which is a north-south
       street — so both exits are guaranteed roadway. Prefer the side it was
       already on; fall back to the other; fall back again to the demo's hard
       reset, which is ugly but always works. */
    let cx = p.x, nd = 1e9;
    for (const c of this.crossings) { const d = Math.abs(c.x - p.x); if (d < nd) { nd = d; cx = c.x; } }
    const first = p.y < City.railY ? -1 : 1;
    let placed = false;
    for (const s of [first, -first]) {
      const ny = City.railY + s * RAIL_EJECT;
      if (!carBlocked(cx, ny, p.ang)) { p.x = cx; p.y = ny; placed = true; break; }
    }
    if (!placed) {
      p.x = City.nodeX(City.nearNodeX(cx));
      p.y = City.nodeY(City.nearNodeY(City.railY + first * 200));
    }
    p.vx = p.vy = 0;
    p.spinOut(Math.random() < 0.5 ? -1 : 1);
    p.spinT = 1.3;                       // longer than a crunch: this is a wreck
    this.railSide = p.y < City.railY ? -1 : 1;   // do not read the eject as beating the train

    /* the whole load across the ballast, whatever you were carrying */
    for (let i = 0; i < this.bag; i++) Fx.splat(cx + rand(-30, 30), City.railY + rand(-14, 14));
    Fx.spill(cx, City.railY);
    for (let k = 0; k < 22; k++) Fx.spark(p.x, p.y, rand(-140, 140), rand(-140, 140));
    this.bag = 0;
    this.needPickup = true;
    this.syncNav();

    this.shake = 12; this.hitstop = 0.14; this.flash = 0.18;
    this.combo = 1;
    this.say('HIT BY TRAIN', PAL.bad);   // 12 chars — well inside the banner box
    Audio5.sfx('crash'); Audio5.sfx('trainhorn');
    // No fine. The spec is explicit: a wreck costs time and load, not money.
  },
```

- [ ] **Step 4: Fire it from the update loop**

In `update(dt)`, replace the train block from Task 1 with:

```js
    /* the Union Pacific */
    this.wreckCd -= dt;
    this.trainT -= dt;
    if (!this.train && this.trainT <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      // eastbound keeps to the south track — City.tracks is [north, south]
      this.train = new Train(dir, City.tracks[dir > 0 ? 1 : 0]);
      this.trainT = rand(22, 40);
    }
    if (this.train) {
      this.train.update(dt, this);
      if (this.train.hits(p) && this.wreckCd <= 0) this.wreck();
      if (this.train.dead) this.train = null;
    }
```

`p` is already in scope — it is bound as `const p = this.player;` earlier in the same function.

- [ ] **Step 5: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS, and in particular `the wreck threw the car clear of the corridor`.

- [ ] **Step 6: Run the suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines. The wreck picks its spin direction with `Math.random()` and the harness fuzz is unseeded, so one green run is not evidence.

If the eject assertion fails even once, **stop and report** rather than widening the tolerance. A wreck that *sometimes* leaves the car on the rails is a softlock that sometimes happens, which is worse than one that always does — it will not be found again by hand.

- [ ] **Step 7: Look at it — required**

Drive onto a crossing and sit there until a train comes. Do it three times: once from the north, once from the south, once stopped dead centre.

Judge: are you thrown clear every time, onto tarmac you can drive off? Does the banner read? Do the splats land on the ballast where they should? Then immediately try to drive back over — you should be able to, and the nav should be pointing you at the shop.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "A hit is a wreck, and it throws you clear

Hitstop, hard shake, a long spin, the whole load splatted across the
ballast, and needPickup sending you back to the shop. No fine: it costs
time and load, not money.

The car is ejected 52px clear of the corridor along the crossing road it
was hit on -- a wreck can only happen where the corridor is not solid,
which is a crossing, which is a street, so both exits are known roadway.
A wreck that leaves the car on the rails is a repeat-hit loop, the same
class of defect as the collision wedge: unescapable by any input rather
than merely awkward. The suite asserts the car ends up clear and
unblocked."
```

---

### Task 4: The cruiser is not exempt

**Files:**
- Modify: `src/80_game.js` (`onRail`, `railCheck`, the `spawnCop` guard, cop vs train)
- Test: `test/headless.mjs`

**Interfaces:**
- Consumes: `Train.hits(e)` — a `Cop` has `x`, `y` and `ang`, so it satisfies the same shape as the player — plus `G.dropCop()` and `G.bumpHeat(n)`.
- Produces: `G.onRail(x, y)` → boolean, true inside the corridor band. `G.railCheck()` — no arguments; detects the player crossing the corridor and charges heat if a gate was down.

- [ ] **Step 1: Write the failing test**

Append to the `— rail —` section:

```js
/* the cruiser is not exempt — beat the train across and the pursuit eats it */
G.trainT = 999; G.train = null; G.wreckCd = 0;
G.player.x = cross.x; G.player.y = City.railY + 160;
G.heat = 0; G.cop = null;
for (let i = 0; i < 40; i++) G.bumpHeat(5);
ok(G.cop !== null, 'a cop is on you');
G.cop.x = cross.x; G.cop.y = City.railY;
G.train = new Train(1, City.tracks[1]);
G.train.x = cross.x - 140;
for (let i = 0; i < 5 * 60 && G.cop; i++) { G.update(1 / 60); G.render(ctx); Input.endFrame(); }
ok(G.cop === null, 'the train took the cruiser');
ok(G.heat === 0, `and the heat reset (${G.heat})`);

/* a wrecked cop must not respawn under the train */
ok(G.onRail(cross.x, City.railY) && !G.onRail(cross.x, City.railY + 200),
   'the corridor is a refused spawn, the street beyond it is not');
G.player.x = cross.x; G.player.y = City.railY + 120;
let onTracks = 0;
for (let i = 0; i < 200; i++) { G.cop = null; G.spawnCop(); if (G.cop && G.onRail(G.cop.x, G.cop.y)) onTracks++; }
ok(onTracks === 0, `none of 200 cop spawns landed in the corridor (${onTracks})`);
G.cop = null; G.heat = 0;

/* running a closed gate is allowed, and it is what costs you */
G.crossings.forEach((c) => { c.t = 1; c.down = true; });
G.player.x = cross.x; G.player.y = City.railY - 60;
G.railSide = -1;
G.player.y = City.railY + 60;
G.railCheck();
ok(G.heat >= 20, `running a closed crossing adds heat (${G.heat})`);
G.heat = 0; G.cop = null; G.crossings.forEach((c) => { c.t = 0; c.down = false; });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node test/headless.mjs`
Expected: FAIL — `the train took the cruiser`, then `G.onRail is not a function`.

- [ ] **Step 3: Add `onRail` and `railCheck` to `src/80_game.js`**

Add both immediately after `wreck()`:

```js
  /* The corridor band, generously sized. Used to keep a cop from being
     dispatched onto the tracks: a cruiser that materialises under a moving
     train is wrecked the instant it exists, which reads as a bug rather than
     as a rule. */
  onRail(x, y) { return Math.abs(y - City.railY) < 44; },

  /* Running a closed crossing is always allowed — the gates are drawn, not
     solid. Surviving one is what costs you, because the cops saw you do it. */
  railCheck() {
    const p = this.player;
    const side = p.y < City.railY ? -1 : 1;
    if (this.railSide === 0) { this.railSide = side; return; }
    if (side === this.railSide) return;
    this.railSide = side;
    let near = null, nd = 1e9;
    for (const c of this.crossings) { const d = Math.abs(c.x - p.x); if (d < nd) { nd = d; near = c; } }
    if (near && nd < 40 && near.down) {
      this.bumpHeat(20);
      Fx.pop(p.x, p.y - 22, 'BEAT THE TRAIN!', PAL.amber);
    }
  },
```

- [ ] **Step 4: Refuse the corridor in `spawnCop`**

In `spawnCop()`, extend the retry loop's condition from `City.isSolid(x, y)` to include the corridor:

```js
    for (let i = 0; i < 30 && (City.isSolid(x, y) || this.onRail(x, y)); i++) { x = clamp(p.x + rand(-260, 260), 40, WW - 40); y = clamp(p.y + rand(-260, 260), 40, WH - 40); }
```

- [ ] **Step 5: Have the train take the cruiser**

In `update(dt)`, extend the train block so it reads:

```js
    if (this.train) {
      this.train.update(dt, this);
      if (this.train.hits(p) && this.wreckCd <= 0) this.wreck();
      /* Beat the train across and the pursuit eats it. That is what turns the
         tracks from an obstacle into a tactic: a genuine high-risk escape. */
      if (this.cop && this.train.hits(this.cop)) {
        for (let k = 0; k < 20; k++) Fx.spark(this.cop.x, this.cop.y, rand(-150, 150), rand(-150, 150));
        Fx.pop(this.cop.x, this.cop.y - 22, 'CRUNCH!', PAL.good);
        this.shake = Math.max(this.shake, 7);
        Audio5.sfx('crash');
        this.say('THE TRAIN GOT THEM', PAL.good);   // 18 chars, a 230px banner
        this.heat = 0;
        this.dropCop();
      }
      if (this.train.dead) this.train = null;
    }
    for (const c of this.crossings) c.update(dt, this);
    this.railCheck();
```

Note the ordering: `dropCop()` clamps heat to at most 45, so `this.heat = 0` has to come first for §8's "heat resets" to actually hold.

The `for (const c of this.crossings) c.update(dt, this);` line replaces the one added in Task 2 Step 7 — it moves below the train block so the gates see the train's position for this frame rather than the last.

- [ ] **Step 6: Add the two banners to the HUD width test**

In `test/headless.mjs`, in the `— hud layout —` section, extend the `BANNERS` array:

```js
const BANNERS = ['CLOCK IN!', 'OUT OF TACOS - BACK TO SHOP', 'THAT IS NOT ' + longestAddr.split(' ')[0],
  'SPLAT!', 'PERFECT TOSS!', 'DELIVERED!', "HAYS PD! LOSE 'EM!", 'PULLED OVER', 'LOST THEM',
  'HIT BY TRAIN', 'THE TRAIN GOT THEM'];
```

This is the section that exists because three text-overflow bugs shipped in the order card. Adding banner copy without adding it here is how the fourth one ships.

- [ ] **Step 7: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS.

- [ ] **Step 8: Look at it — required**

Earn a cop (drive on the pavement until `HAYS PD! LOSE 'EM!` shows), lead it to a crossing, and beat a train across.

Judge: does the cruiser actually follow you onto the tracks, or does its obstacle probe turn it away every time? **If it never follows, the escape does not exist in practice** — report that even though the test passes, because the test places the cop by hand and cannot tell you. Does the banner read? Does the heat bar visibly empty?

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "The cruiser is not exempt

Beat the train across and the pursuit eats it: the cop despawns and heat
resets, which turns the tracks from an obstacle into a tactic and gives
the player a real high-risk escape. spawnCop now refuses the corridor,
because a cruiser that materialises under a moving train is wrecked the
instant it exists and reads as a bug rather than a rule.

Running a closed gate is always allowed -- the gates are drawn, not
solid. Surviving one adds heat, because the cops saw you do it."
```

---

### Task 5: Traffic brakes, and the demo waits

**Files:**
- Modify: `src/50_entities.js` (`Traffic.update`)
- Modify: `src/75_demo.js` (`Demo.reset`, `Demo.drive`)
- Test: `test/headless.mjs` (widen the attract stall bound)

**Interfaces:**
- Consumes: `G.crossings` (each with `x`, `down`), `City.railY`.
- Produces: nothing new. Both changes are behavioural.

§8 calls these "two touches outside the new code, both to stop the world looking stupid rather than to add mechanics". Keep them that small.

- [ ] **Step 1: Widen the attract stall bound first**

In `test/headless.mjs`, in the `— attract —` section, change:

```js
ok(worstStall < 8, `demo never stalled for long (worst ${worstStall.toFixed(1)}s)`);
```

to:

```js
// 12s, not 8: a legitimate wait at a closed crossing is roughly 2s of warning
// plus 1.5s of train plus the raise, and the demo can meet one mid-approach.
// The bound still has to catch a wedge. What it must NOT become is a net
// displacement check — that fails on working code, because the demo takes
// orders all over the map and can legitimately finish near where it started.
ok(worstStall < 12, `demo never stalled for long (worst ${worstStall.toFixed(1)}s)`);
```

- [ ] **Step 2: Run the suite three times to get a baseline**

Run: `for i in 1 2 3; do node test/headless.mjs 2>&1 | grep 'never stalled'; done`
Expected: three passes. Note the reported worst stall. With Tasks 1–4 landed the demo meets gates but does not yet wait, so this is the "before" figure to compare against in Step 5.

- [ ] **Step 3: Have traffic brake at a closed gate (`src/50_entities.js`)**

In `Traffic.update`, immediately after the `/* --- car ahead / player ahead --- */` block and **before** the line beginning `this.spd = block < 40 ? ...`:

```js
    /* --- a closed crossing ahead --- */
    // Only north-south traffic meets the corridor. Nothing in the rules stops
    // a car driving into a moving train, but it looks like a bug, so treat a
    // lowered gate as a stopped car on the tracks. The 34px floor matters: a
    // car already between the gates is committed, and braking there would park
    // it on the rails instead of clearing them.
    if (this.dir % 2 === 1 && G.crossings) {
      const toRail = (City.railY - this.y) * DIRV[this.dir][1];
      if (toRail > 34 && toRail < 150) {
        for (const c of G.crossings) {
          if (!c.down || Math.abs(c.x - this.x) > 30) continue;
          block = Math.min(block, toRail - 30);
          break;
        }
      }
    }
```

- [ ] **Step 4: Have the demo wait (`src/75_demo.js`)**

Add `hold: false,` to the `Demo` field list (the line reading `wedgeT: 0, esteer: 1, throwCd: 0,`) and reset it:

```js
  reset(p) { this.wedgeT = 0; this.esteer = 1; this.throwCd = 0; this.hold = false; },
```

Then in `drive(dt, G)`, immediately **after** the throttle assignment (`p.throttle = p.speed < 34 ? 1 : ...`) and **before** the `/* ---- toss once the porch is in range ---- */` block:

```js
    /* ---- hold at a closed crossing ----
       The demo plays by the same rules as a player, which includes being
       allowed to run a gate. It should not: the attract loop showing the car
       flattened by a train reads as the game being broken, not as a hazard.

       Latched, deliberately. The test that STARTS the hold needs a direction
       of travel, and a stopped car has none — so unlatched it stops, stops
       detecting, creeps forward again under the speed floor above, and
       jitters into the gate instead of waiting behind it. */
    if (G.crossings) {
      let near = null;
      for (const c of G.crossings)
        if (Math.abs(c.x - p.x) < 34 && Math.abs(c.y - p.y) < 130) { near = c; break; }
      if (!near || !near.down) this.hold = false;
      else if (this.hold || (City.railY - p.y) * sign(p.vy || (ty - p.y)) > 24) this.hold = true;
      if (this.hold) {
        // brake to a stop, then coast. Never reverse: the road behind is live.
        p.throttle = p.fwdSpeed > 10 ? -1 : 0;
        p.steer = 0; p.hb = false;
        this.wedgeT = 0;                    // waiting is not wedging
      }
    }
```

The `> 24` test is what stops it braking once it is already between the gates: a car on the tracks should finish crossing, not stop.

- [ ] **Step 5: Run the tests**

Run: `node test/headless.mjs`
Expected: PASS. Compare the reported worst stall against the Step 2 baseline — it should have grown by a few seconds and stayed under 12. If it lands at 11-and-change the bound is too tight for comfort; report that rather than nudging it to 20.

- [ ] **Step 6: Run the suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines. §11 flags the demo driving through a live hazard as the most likely source of a flake, and a flake is a bug in the harness, not noise to live with.

- [ ] **Step 7: Look at it — required**

Let the attract loop run a full cycle (title → winners → 90s demo) and watch the demo meet a train. Then, in play, sit behind a stopped traffic car at a closed crossing.

Judge: does the demo stop behind the gate and set off again cleanly, or does it creep and jitter? Do traffic cars queue at the gate, or stop 100px short and look confused? Does anything drive through the train?

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Traffic brakes at a closed gate, and so does the demo

Neither adds a mechanic; both stop the world looking stupid. Nothing in
the rules forbids driving into a train, but a car that does it reads as
a bug, so a lowered gate is treated as a stopped car on the tracks --
with a 34px floor, so a car already between the gates finishes crossing
instead of parking on the rails.

The demo's wait is latched on purpose: the test that starts it needs a
direction of travel and a stopped car has none, so unlatched it stops,
stops detecting, creeps forward under the speed floor and jitters into
the gate. The attract stall bound widens from 8s to 12s to allow a
legitimate wait."
```

---

### Task 6: Ship it

**Files:**
- Modify: `CLAUDE.md`, `ROADMAP.md`, `JOURNAL.md`
- Build: `taco-shop.html`

- [ ] **Step 1: Run the full suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines.

**Watch `— heat —` specifically.** Before this plan every section after `— attract —` left the game in the `title` state, where `G.update` returns early — so `cop pursuit stable` was asserting against a cop that was never simulated. The `— rail —` section calls `startShift()`, so `— heat —` now runs a live 10-second pursuit for the first time. That is a strictly better test, and if it fails it has found something real. Investigate it; do not reorder the sections to hide it.

- [ ] **Step 2: Watch a full attract cycle, twice**

Run `node serve.mjs` and let title → winners → demo run end to end without touching anything, twice. The demo is the best fuzzer this project has for geometry, and this plan put a moving hazard in its path.

- [ ] **Step 3: Rebuild the artifact and check its size**

```bash
node build.mjs
ls -l taco-shop.html
```

Confirm it is still one self-contained file with no external requests. Note the new byte size — `CLAUDE.md`'s Publishing section quotes it, and it is about to be wrong.

- [ ] **Step 4: Update `CLAUDE.md`**

Four edits, all factual:

1. In the module table, extend the `50_entities` row to name `Train` and `Crossing`.
2. Add this subsection under **Architecture**, after **Traffic**:

```markdown
### The Union Pacific

The corridor is block row `by=2` and carries **two tracks** — `genRail` lays two rail-tile rows and each
bakes a pair of rails. `City.tracks` is `[northY, southY]` and a train picks by direction: eastbound keeps
to the south track, the same right-hand convention `Traffic.laneFixed` uses for the road. A train running
down `City.railY` would straddle both and read as floating.

`City.crossings` is **where** the nine crossings are, baked at generation. `G.crossings` is what they are
**doing**, rebuilt each shift by `G.resetRail()`. **The gates are drawn, never solid** — you can always run
one, and that gamble is the whole point of the corridor. Running a closed one and surviving adds heat.

The arms swing in the **ground plane**, from parallel-with-the-track to across-the-road. A raised arm in a
top-down view points at the sky and foreshortens to nothing, so animating it vertically reads as a gate
that vanished.

`G.wreck()` is the most important function in the feature. It ejects the car `RAIL_EJECT` = 52px clear of
the corridor along the crossing road it was hit on — a wreck can only happen where the corridor is not
solid, which is a crossing, which is a street, so both exits are known roadway. **A wreck that leaves the
car on the rails is a repeat-hit loop**, the same class of defect as the collision wedge: unescapable by
any input rather than merely awkward. `test/headless.mjs` asserts the car ends up clear and unblocked.
```

3. In **Publishing**, correct the artifact size to what Step 3 reported.
4. In **Testing**, update the assertion count, add `— rail —` to the list of labelled sections, and record the ordering fact from Step 1: `— rail —` leaves the game in `play`, which is what lets `— heat —` exercise a live pursuit.

- [ ] **Step 5: Update `ROADMAP.md`**

Replace the status banner in "The neighbourhood pass" with one saying all three plans have landed: the city is Hays, all six block kinds are built, and the Union Pacific runs with gates, a wreck and the cop interaction. Then move the remaining follow-ups out of the spec and into the punch list as unclaimed items:

- **deliverable downtown addresses** — a street door for the flat above the shop, which §7 names as the obvious first follow-up if order distribution plays badly;
- **a second time period** — which §4 says the JSON schema exists to make cheap.

- [ ] **Step 6: Update `JOURNAL.md`**

Record, in the journal's existing voice: what the train is made of and why it runs on one of two tracks; why the gate arms swing sideways; why the wreck's eject distance is 52 and not "some margin"; why the demo's wait is latched; and anything that did **not** work while you were building it. That last part is the reason the journal exists — the code will never show a future reader the version that jittered at the gate.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Plan 3 complete: the Union Pacific runs

Documents the train, the crossings, the wreck and the cop interaction,
and records why each call was made -- including the ones that only make
sense once you have watched them fail.

Also notes that -- rail -- leaves the game in play, which means -- heat --
finally exercises a live pursuit instead of a title screen whose update()
returns before the cop ever moves."
```

---

## Self-Review

**Spec coverage.** Every claim in §8 maps to a task:

| §8 requirement | task |
|---|---|
| ground: ballast and rails bake once | landed in Plan 2, Task 2 |
| solidity: solid except at the nine crossings | landed in Plan 2, Task 2 |
| the train: rail-bound, loco + ~six boxcars, seconds to clear a point | Task 1 |
| `G.trainT` schedules one every 22–40s, random direction, in play **and** demo | Task 1 (the schedule sits in the shared play/demo body) |
| crossings: watch distance, lower over ~0.7s, flashing lights, two-tone bell, raise after the tail | Task 2 |
| the gates are drawn, not solid | Task 2 — no `markSolid` call appears anywhere in this plan |
| running a closed crossing and surviving adds heat | Task 4 |
| a hit is a wreck: hitstop, shake, spin, bags splatted, `bag = 0`, `HIT BY TRAIN`, no fine | Task 3 |
| **the wreck must throw the player clear** | Task 3, with the assertion as the guard |
| the cruiser is not exempt; a wrecked cop must not respawn mid-train | Task 4 |
| traffic brakes at a closed crossing; the demo waits at one | Task 5 |

§10's five `— rail —` assertions: *crossings drivable with gates up* and *the corridor solid between them* are already asserted by Plan 2's `— block kinds —` section and are deliberately not duplicated — noted here so the omission reads as a decision rather than a gap. Traverse-and-despawn and gates-lower-and-raise are Tasks 1 and 2; the softlock guard is Task 3; the cop spawn is Task 4. §10's widenings: `— hud layout —` in Task 4, `— attract —` in Task 5. The wedge sweep is **not** widened, because this plan adds no solid geometry — stated rather than silently skipped.

**Type consistency.** `Train` exposes `x0`/`x1`/`len`/`dir`, and `Crossing.update` consumes exactly those. `hits(e)` takes anything with `x`/`y`/`ang`, which is why one method serves both the player and the cop. `City.tracks` is `[north, south]` and every consumer indexes it as `[dir > 0 ? 1 : 0]`. `G.crossings` is `Crossing[]` and `City.crossings` is `{x, y, masts}[]`; only `resetRail` reads across that boundary.

**Known ordering hazard, stated up front.** Task 1 adds `Train` to the harness bridge and Task 2 adds `Crossing`. Adding both in Task 1 throws, because a top-level `class` must exist before the bridge line evaluates. Task 1's `resetRail` therefore ships a one-line placeholder that Task 2 replaces — flagged in both tasks rather than left as a surprise. Likewise, Task 2 places the crossing tick after the train block and Task 4 moves it below the wreck check; both say so at the point of the edit.

**Known side effect, stated up front.** The `— rail —` section leaves the game in `play`, so `— heat —` runs a real pursuit for the first time. Task 6 Step 1 says to investigate a failure there rather than reorder around it.

**Placeholder scan.** Tasks 1–5 carry complete code for every step. Task 6 Steps 5 and 6 describe documentation to write rather than exact prose, which is right for a roadmap banner and a journal entry — but Step 4 spells out the `CLAUDE.md` insertion verbatim, because that file is a contract with future sessions rather than a narrative.
