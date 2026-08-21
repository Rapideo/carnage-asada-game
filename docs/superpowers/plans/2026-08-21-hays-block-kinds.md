# Hays Block Kinds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the six fallback block kinds with bespoke generators, so downtown reads as downtown and the railway corridor exists as real geometry.

**Architecture:** Each kind is a `genX(rng, bx, by)` on `City`, alongside `genResidential`, writing into the same `statics` / `solid` / `ground` structures. New sprites are baked once at boot in `Art.build()` from the existing primitives — `mkCanvas`, `R`, `shade`, and the roof-above-wall layout `mkBldg` already uses. No new art rule, no new colour, no asset file. Each generator is removed from `KIND_FALLBACK` as it lands, so the map improves one block kind at a time and is always playable.

**Tech Stack:** Plain ES5-style browser JavaScript (no modules), Node 18+ for `build.mjs` and the test harness, zero runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-21-hays-neighbourhood-design.md` (§6 block kinds, §8 the corridor half of the Union Pacific)

**Predecessor:** `docs/superpowers/plans/2026-08-21-hays-map.md` — landed, five commits.

## Global Constraints

Everything in Plan 1's Global Constraints still applies verbatim. In addition:

- **`City.markSolid()` does not check `City.keep`.** Task 1 adds `markSolidSafe()`; every new generator must use it. A generator that marks a keep tile solid can bury a delivery porch and make an address unwinnable — `test/headless.mjs` asserts "no porch buried in geometry".
- **Sprite layout.** `mkBldg`-style sprites are a canvas `fw × (fh + BWALLH)`: roof in rows `0..fh`, wall band in rows `fh..fh+BWALLH`. The returned `{c, w: fw, h: fh, oy: BWALLH}` is pushed as a static with `x,y,w,h` = the **ground footprint** and `sortY` = `y + h`. The renderer draws at `y - oy`, height `h + oy`. `sortY` must stay the footprint's bottom edge or overlap breaks.
- **Everything faces south.** `mkBldg` has one orientation; only `Art.house` has four. Do not invent directional variants for these kinds — the top-down read that distinguishes downtown from residential is *built to the lot line with no yard*, not which way a face band points.
- **The block interior is tiles `+3..+10`** of the 12-tile span, with the sidewalk ring at `+2` and `+11`. Lot origin in world px is `(BORDER + bx * SPAN + 3) * TS`, and the lot is `8 * TS` = 128px square.
- **`PAL.jade` and `PAL.gold` are the shop's badge colours** and must not appear on any other building. `PAL.cyan` is reserved for guidance UI.
- **Look at every generator in the browser before committing it.** The test harness stubs every drawing call, so it cannot see a building drawn at the wrong offset, a sprite with a broken sort order, or a block that reads wrong. Rendering and looking is a required step, not a nicety.

---

## File Structure

| file | responsibility | change |
|---|---|---|
| `src/30_art.js` | `mkStorefront`, `mkCivic`, `mkApts`, `mkChurch`, `mkShed`, and the rail kit (ballast tile, rail, crossing planks, signal mast). | modify |
| `src/40_city.js` | `markSolidSafe`; `genRetail`, `genRail`, `genCivic`, `genApts`, `genChurch`, `genAuto`; `KIND_FALLBACK` shrinks to empty. | modify |
| `test/headless.mjs` | `— block kinds —` section; extends the existing porch and wedge assertions over the new geometry. | modify |
| `JOURNAL.md`, `ROADMAP.md` | Reasoning and status. | modify (Task 7) |

**Execution order is by visual impact**, so the map improves visibly as it goes: retail (the downtown spine) → rail (the corridor) → civic → apts → church → auto.

---

### Task 1: `markSolidSafe`, and the retail street wall

**Files:**
- Modify: `src/30_art.js` (add `mkStorefront`, call it in `build()`)
- Modify: `src/40_city.js` (add `markSolidSafe`, `genRetail`; drop `retail` from `KIND_FALLBACK`)
- Test: `test/headless.mjs`

**Interfaces:**
- Produces: `City.markSolidSafe(tx0, ty0, w, h)` — like `markSolid` but skips any tile where `City.keep` is set, and returns the number of tiles it refused. `Art.store` — an array of `{c, w, h, oy}` storefront runs, same shape as `Art.bldg`.

- [ ] **Step 1: Write the failing test**

Append a new section to `test/headless.mjs` immediately before `console.log('\n— heat —');`:

```js
console.log('\n— block kinds —');
ok(typeof City.markSolidSafe === 'function', 'City.markSolidSafe exists');

/* The invariant: marking a porch tile solid must be refused, not obeyed. */
const porchTile = (() => {
  for (let i = 0; i < City.keep.length; i++) if (City.keep[i]) return i;
  return -1;
})();
ok(porchTile >= 0, 'found a keep tile to test against');
const wasSolid = City.solid[porchTile];
const refused = City.markSolidSafe(porchTile % GW, (porchTile / GW) | 0, 1, 1);
ok(refused === 1 && City.solid[porchTile] === wasSolid,
   `markSolidSafe refuses keep tiles (refused ${refused}, solid unchanged ${City.solid[porchTile] === wasSolid})`);

ok(Array.isArray(Art.store) && Art.store.length > 0, `Art.store has ${(Art.store || []).length} storefront runs`);

/* Retail blocks must build to the lot line: far more solid interior tiles than
   a residential block, which is what reads as "downtown" from above. */
const blockSolid = (bx, by) => {
  let n = 0;
  for (let ly = 3; ly <= 10; ly++) for (let lx = 3; lx <= 10; lx++)
    if (City.solid[(2 + by * 12 + ly) * GW + (2 + bx * 12 + lx)]) n++;
  return n;
};
const retailFill = blockSolid(3, 0);       // Fort-Main x 11th-12th, authored 'retail'
const resFill = blockSolid(0, 6);          // Elm-Walnut x 5th-6th, authored 'res'
ok(retailFill > resFill,
   `a retail block is built up more densely than a residential one (${retailFill} vs ${resFill} solid tiles)`);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node build.mjs && node test/headless.mjs`
Expected: FAIL on `City.markSolidSafe exists` and `Art.store has 0 storefront runs`.

- [ ] **Step 3: Add `markSolidSafe` to `src/40_city.js`**

Directly below the existing `markSolid`:

```js
  /* markSolid obeys blindly, which is how a generator buries a porch and makes
     an address unwinnable. Every block generator should use this instead: it
     refuses keep tiles and reports how many it refused, so a generator that is
     fighting the porch mask shows up rather than silently winning. */
  markSolidSafe(tx0, ty0, w, h) {
    let refused = 0;
    for (let ty = ty0; ty < ty0 + h; ty++) for (let tx = tx0; tx < tx0 + w; tx++) {
      if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) continue;
      const i = ty * GW + tx;
      if (this.keep[i]) { refused++; continue; }
      this.solid[i] = 1;
    }
    return refused;
  },
```

- [ ] **Step 4: Add `mkStorefront` to `src/30_art.js`**

Add as a method on `Art`, next to `mkBldg`:

```js
  /* A run of storefronts sharing party walls — the downtown street wall. Same
     roof-above-wall layout as mkBldg, but divided into bays so it reads as
     several businesses rather than one warehouse, with an awning band at the
     pavement edge. */
  mkStorefront(r, fw, fh, idx) {
    const t = mkCanvas(fw, fh + BWALLH);
    const x = t.x, wy = fh;
    const BAY = 22 + r.int(8);
    const AWN = [PAL.red, '#8a5fc0', PAL.roofF, PAL.roofE, PAL.roofB];

    // roof: one plane per bay, so the party walls read from above
    for (let bx0 = 0; bx0 < fw; bx0 += BAY) {
      const bw = Math.min(BAY, fw - bx0);
      const tint = WALLS[(idx + (bx0 / BAY | 0)) % WALLS.length];
      R(x, shade(tint, -0.12), bx0, 0, bw, fh);
      for (let i = 0; i < 26; i++)
        R(x, r.chance(0.5) ? shade(tint, -0.2) : shade(tint, -0.04), bx0 + r.int(bw), r.int(fh), 1, 1);
      // parapet, and the party wall itself
      R(x, shade(tint, 0.18), bx0, 0, bw, 3);
      R(x, shade(tint, -0.34), bx0, fh - 3, bw, 3);
      R(x, shade(tint, -0.40), bx0 + bw - 1, 0, 1, fh);
      // a roof vent or two
      if (r.chance(0.7)) {
        const ux = bx0 + 4 + r.int(Math.max(1, bw - 12)), uy = 5 + r.int(Math.max(1, fh - 14));
        R(x, '#6b7280', ux, uy, 7, 6); R(x, '#8a919e', ux, uy, 7, 1);
      }
    }

    // shopfronts: glass, door, and an awning per bay
    for (let bx0 = 0; bx0 < fw; bx0 += BAY) {
      const bw = Math.min(BAY, fw - bx0);
      const tint = WALLS[(idx + (bx0 / BAY | 0)) % WALLS.length];
      R(x, shade(tint, -0.34), bx0, wy, bw, BWALLH);
      R(x, tint, bx0, wy, bw, 1);
      // window band and door
      R(x, PAL.glass, bx0 + 2, wy + 4, bw - 9, 6);
      R(x, PAL.glassHi, bx0 + 2, wy + 4, bw - 9, 1);
      if (r.chance(0.4)) R(x, '#f0d68a', bx0 + 3, wy + 5, bw - 11, 4);
      R(x, PAL.door, bx0 + bw - 6, wy + 3, 4, 8);
      R(x, PAL.doorHi, bx0 + bw - 6, wy + 3, 4, 1);
      // awning at the pavement edge
      const aw = AWN[(idx + (bx0 / BAY | 0)) % AWN.length];
      R(x, aw, bx0 + 1, wy + BWALLH - 4, bw - 2, 3);
      R(x, shade(aw, -0.3), bx0 + 1, wy + BWALLH - 2, bw - 2, 1);
      R(x, PAL.ink, bx0, wy + BWALLH - 1, bw, 1);
    }

    x.strokeStyle = 'rgba(20,14,28,0.55)'; x.lineWidth = 1;
    x.strokeRect(0.5, 0.5, fw - 1, fh + BWALLH - 1);
    return { c: t.c, w: fw, h: fh, oy: BWALLH };
  },
```

Then bake them in `Art.build()`, next to where `this.bldg` is filled:

```js
    this.store = [];
    for (let i = 0; i < 4; i++)
      this.store.push(this.mkStorefront(makeRng(900 + i * 77), 128, 34 + i * 4, i));
```

Declare `store: [],` in the `Art` object literal alongside `bldg: []`.

- [ ] **Step 5: Add `genRetail` to `src/40_city.js`**

```js
  /* ---------- downtown retail block ----------------------- */
  /* Built to the lot line, north and south, with a service court between. The
     read that matters from above is "no yards, no gaps" — that is what
     separates downtown from the residential blocks, not which way a face
     points. */
  genRetail(rng, bx, by) {
    const lotX = (BORDER + bx * SPAN + 3) * TS, lotY = (BORDER + by * SPAN + 3) * TS, L = 8 * TS;
    const g = this.gx;

    // service court: asphalt between the two runs
    for (let ly = 3; ly <= 10; ly++) for (let lx = 3; lx <= 10; lx++) {
      const tx = BORDER + bx * SPAN + lx, ty = BORDER + by * SPAN + ly;
      this.surf[ty * GW + tx] = S_ROAD;
      g.drawImage(Art.tile.lot[(lx + ly) & 3], tx * TS, ty * TS);
    }

    for (const side of [0, 1]) {
      const s = Art.store[rng.int(Art.store.length)];
      const wx = lotX;
      const wy = side === 0 ? lotY + s.h - s.h : lotY + L - s.h;   // north run, south run
      this.markSolidSafe((wx / TS) | 0, (wy / TS) | 0, 8, Math.ceil(s.h / TS));
      this.statics.push({ img: s.c, x: wx, y: wy, oy: s.oy, w: s.w, h: s.h, sortY: wy + s.h });
    }

    // painted bays in the service court
    g.fillStyle = '#c9cede66';
    for (let i = 0; i < 7; i++) g.fillRect(lotX + 8 + i * 17, lotY + L / 2 - 8, 1, 16);
  },
```

- [ ] **Step 6: Wire it up**

In `src/40_city.js`, remove `retail` from `KIND_FALLBACK`, and add to the dispatch in `gen()`:

```js
      else if (k === 'retail') this.genRetail(rng, bx, by);
```

The lot-asphalt loop in step 3 of `gen()` keys off `com`/`lot`/`shop`; `genRetail` paints its own court, so it does not need adding there.

- [ ] **Step 7: Run the tests**

Run: `node build.mjs && node test/headless.mjs`
Expected: PASS, including the pre-existing `no porch buried in geometry` and the wedge sweep.

- [ ] **Step 8: Look at it — required**

Run `node serve.mjs`, open `http://localhost:8123`, and put the camera on Main Street:

```js
const T = window.TacoShop, G = T.G;
G.startShift();
const keep = G.update; G.update = () => {};        // never `delete` — G is a plain object
G.player.x = (2 + 4*12)*16 + 16; G.player.y = (2 + 1*12)*16 + 90;
G.cam.x = G.player.x - 192; G.cam.y = G.player.y - 108;
T.step(1);
```

Judge: does the Fort/Main spine read as a continuous street wall rather than two warehouses? Are the bays legible at 1× without looking noisy? Does anything sort wrongly — a run drawn over a car that should be in front of it? Iterate on `mkStorefront` until it reads, then re-run the suite.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Build downtown to the lot line

genRetail lays a storefront run along the north and south edges with a
service court between, so the Fort/Main spine reads as a street wall
instead of two warehouses. mkStorefront divides a run into bays with
party walls and awnings, from the existing primitives only.

markSolidSafe lands with it: markSolid obeys blindly, which is how a
generator buries a porch. Every new block kind uses the safe one, and it
reports refusals rather than silently winning."
```

---

### Task 2: The Union Pacific corridor

**Files:** `src/30_art.js` (rail kit), `src/40_city.js` (`genRail`), `test/headless.mjs`

**Interfaces:**
- Produces: `City.crossings` — an array of `{x, y}` world positions, one per north-south street, consumed by Plan 3 for gates and the train. `City.railY` — the corridor centre line in world px.

- [ ] **Step 1: Write the failing test**

```js
ok(Array.isArray(City.crossings) && City.crossings.length === 9,
   `nine level crossings, one per north-south street (got ${(City.crossings || []).length})`);
ok(typeof City.railY === 'number' && City.railY > 0, `City.railY is the corridor centre (${City.railY})`);

/* Drivable at every crossing, solid everywhere between them. */
const railTy = (City.railY / TS) | 0;
const openAtCrossings = (City.crossings || []).every((c) => !City.isSolid(c.x, City.railY));
ok(openAtCrossings, 'every crossing is drivable');
let solidRun = 0, checked = 0;
for (let tx = 3; tx < GW - 3; tx++) {
  const wx = tx * TS + 8;
  const nearCrossing = (City.crossings || []).some((c) => Math.abs(c.x - wx) < 26);
  if (nearCrossing) continue;
  checked++;
  if (City.solid[railTy * GW + tx]) solidRun++;
}
ok(checked > 0 && solidRun / checked > 0.9,
   `the corridor is solid between crossings (${solidRun}/${checked} tiles)`);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node build.mjs && node test/headless.mjs`
Expected: FAIL — `nine level crossings ... (got 0)`.

- [ ] **Step 3: Add the rail kit to `src/30_art.js`**

```js
  /* Ballast, rail and crossing planks. Baked as 16px tiles so the corridor
     blits with the rest of the ground and costs nothing per frame. */
  buildRail(rng) {
    const ballast = mkCanvas(TS, TS), b = ballast.x;
    R(b, '#6a6152', 0, 0, TS, TS);
    for (let i = 0; i < 40; i++)
      R(b, rng.chance(0.5) ? '#7d7462' : '#565042', rng.int(TS), rng.int(TS), 1, 1);
    this.tile.ballast = [ballast.c, ballast.c, ballast.c, ballast.c];

    const rail = mkCanvas(TS, TS), r2 = rail.x;
    R(r2, '#6a6152', 0, 0, TS, TS);
    for (let i = 0; i < 24; i++) R(r2, '#565042', rng.int(TS), rng.int(TS), 1, 1);
    R(r2, '#4a3f33', 0, 3, TS, 2);            // sleeper ends
    R(r2, '#4a3f33', 0, 11, TS, 2);
    R(r2, '#9aa0aa', 0, 5, TS, 2);            // the two rails
    R(r2, '#c8ced8', 0, 5, TS, 1);
    R(r2, '#9aa0aa', 0, 9, TS, 2);
    R(r2, '#c8ced8', 0, 9, TS, 1);
    this.tile.rail = [rail.c, rail.c, rail.c, rail.c];

    const plank = mkCanvas(TS, TS), p = plank.x;
    R(p, '#5b4a38', 0, 0, TS, TS);
    for (let i = 0; i < 4; i++) R(p, '#6d5943', 0, i * 4, TS, 3);
    R(p, '#9aa0aa', 0, 5, TS, 2); R(p, '#c8ced8', 0, 5, TS, 1);
    R(p, '#9aa0aa', 0, 9, TS, 2); R(p, '#c8ced8', 0, 9, TS, 1);
    this.tile.plank = [plank.c, plank.c, plank.c, plank.c];

    // crossing signal: mast, crossbuck, two lamps
    const m = mkCanvas(10, 26), mx = m.x;
    R(mx, '#3c4250', 4, 10, 2, 16);
    R(mx, '#c9cede', 1, 2, 8, 2); R(mx, '#c9cede', 4, 0, 2, 8);
    R(mx, PAL.red, 1, 9, 3, 3); R(mx, PAL.red, 6, 9, 3, 3);
    this.signal = { c: m.c, w: 10, h: 6, oy: 20 };
  },
```

Call `this.buildRail(makeRng(777));` inside `Art.build()`, and declare `signal: null,` on the `Art` object.

- [ ] **Step 4: Add `genRail` to `src/40_city.js`**

```js
  /* ---------- the Union Pacific corridor ------------------ */
  /* Runs the full width of the map through this block row. Solid along its
     whole length except at the nine level crossings, so the tracks are a real
     barrier: you cross where Hays lets you cross. Ballast bakes into the ground
     once and never changes. */
  genRail(rng, bx, by) {
    const g = this.gx;
    const midLy = 6;                                  // corridor centre within the block
    this.railY = (BORDER + by * SPAN + midLy) * TS + TS / 2;
    if (!this.crossings) this.crossings = [];

    for (let ly = midLy - 2; ly <= midLy + 2; ly++) {
      const ty = BORDER + by * SPAN + ly;
      for (let lx = 0; lx < SPAN; lx++) {
        const tx = BORDER + bx * SPAN + lx;
        if (tx < BORDER || tx >= GW - BORDER) continue;
        const onRoad = lx < 2;                        // the north-south street at the block edge
        const isRail = ly === midLy - 1 || ly === midLy;
        const img = onRoad ? (isRail ? Art.tile.plank : Art.tile.road)
                  : (isRail ? Art.tile.rail : Art.tile.ballast);
        g.drawImage(img[(lx + ly) & 3], tx * TS, ty * TS);
        this.surf[ty * GW + tx] = onRoad ? S_ROAD : S_GRASS;
        if (!onRoad) this.markSolidSafe(tx, ty, 1, 1);
      }
    }

    // one crossing per block edge, plus the far edge on the last column
    const addCrossing = (col) => {
      const cx = (BORDER + col * SPAN) * TS + TS;
      if (!this.crossings.some((c) => Math.abs(c.x - cx) < 4)) this.crossings.push({ x: cx, y: this.railY });
    };
    addCrossing(bx);
    if (bx === BLOCKS - 1) addCrossing(bx + 1);

    // signal masts either side of the crossing
    for (const c of [{ x: (BORDER + bx * SPAN) * TS - 6 }, { x: (BORDER + bx * SPAN) * TS + 38 }]) {
      const s = Art.signal;
      const py = this.railY + (c.x < (BORDER + bx * SPAN) * TS ? -30 : 18);
      this.statics.push({ img: s.c, x: c.x, y: py, oy: s.oy, w: s.w, h: s.h, sortY: py + s.h, noShadow: true });
    }
  },
```

Reset `this.crossings = []` at the top of `gen()`, next to `this.statics = []`.

- [ ] **Step 5: Wire it up**

Remove `rail` from `KIND_FALLBACK`; add `else if (k === 'rail') this.genRail(rng, bx, by);` to the dispatch.

- [ ] **Step 6: Run the tests**

Run: `node build.mjs && node test/headless.mjs`
Expected: PASS. Watch the **wedge sweep** especially — this adds the largest single run of solid geometry in the game, and it is the most likely place for a new softlock. If wedge sites appear that are not escapable, stop and report rather than widening the test.

- [ ] **Step 7: Look at it — required**

Put the camera on the corridor and drive across a crossing and along the tracks:

```js
const T = window.TacoShop, G = T.G;
G.startShift();
G.player.x = T.City.crossings[4].x; G.player.y = T.City.railY - 80;
G.cam.x = G.player.x - 192; G.cam.y = G.player.y - 60;
T.step(1);
```

Judge: do the tracks read as tracks at 1×? Do the crossings look like crossings, and can you actually drive through one? Try to drive *along* the corridor and confirm you cannot. Then let the demo run a full 90s and watch whether it gets stuck at the tracks.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Lay the Union Pacific through 9th and 10th

The corridor runs the full width of the map, solid along its length
except at the nine level crossings, so the tracks are a real barrier.
Ballast and rails bake into the ground layer once. City.crossings and
City.railY are the handles plan 3 needs for gates and the train."
```

---

### Tasks 3-6: `civic`, `apts`, `church`, `auto`

Each follows the same five beats, and each is its own commit:

1. **Test** — a `— block kinds —` assertion that the kind produces geometry distinguishable from its old fallback (solid-tile count, static count, or a distinguishing sprite in `Art`).
2. **Art** — a `mk*` on `Art`, baked in `build()`, from existing primitives only.
3. **Generator** — a `genX(rng, bx, by)` using `markSolidSafe`.
4. **Wire** — drop the kind from `KIND_FALLBACK`, add the dispatch branch.
5. **Run the suite, then look at it in the browser, then commit.**

What each should be, from the spec:

- **`civic`** — one large formal massing, set back from the lot line with a plaza or lawn in front, in limestone tone (`PAL.wallLt`, which already is one — Hays is a limestone town). Blocks: the Post Office, Commerce Bank / county admin, the Ellis County museum. Reuse `mkBldg` with a wider footprint and a limestone tint before writing anything new; only add `mkCivic` if a portico and a stepped entrance are needed to sell it.
- **`apts`** — two or three 2-storey masses with a street door and a parking apron. Taller wall band than `BWALLH` is the cheapest way to read "two storeys". **Not deliverable** — Plan 1 fell these back to `res`, so this task *removes* delivery addresses from three blocks. Re-run `— scoring —` and confirm order distribution still works.
- **`church`** — a nave mass plus a steeple. The steeple is the whole silhouette: a small footprint with a much larger `oy` than anything else in the game, which is exactly what the fake-height trick is for.
- **`auto`** — an apron of parked cars reusing the existing parked-car statics from `genParking`, plus a shed or warehouse mass. Closest to existing code; do it last.

- [ ] **Task 3: `civic`**
- [ ] **Task 4: `apts`**
- [ ] **Task 5: `church`**
- [ ] **Task 6: `auto`**

---

### Task 7: Empty the fallback table, document, ship

- [ ] **Step 1: Confirm `KIND_FALLBACK` is empty**

Every kind now has a generator. Delete the constant and the `genKind` helper, and restore the dispatch to read `kinds[by][bx]` directly. Leaving an empty indirection is worse than none.

- [ ] **Step 2: Run the full suite five times**

Run: `for i in 1 2 3 4 5; do node test/headless.mjs | tail -1; done`
Expected: five PASS lines. The suite uses `Math.random` for the fuzz and order selection, so one green run is not evidence.

- [ ] **Step 3: Watch a full attract cycle**

Let title → winners → demo run end to end and watch the demo drive. It is the best fuzzer the project has for geometry, and this plan added a great deal of geometry.

- [ ] **Step 4: JOURNAL and ROADMAP**

Record what each new kind is made of, and — more useful to a future reader — anything that did not work and why. Update the ROADMAP status banner to "Plans 1 and 2 landed; Plan 3 (the live train) remains".

- [ ] **Step 5: Commit**

---

## Self-Review

**Spec coverage.** §6's five kinds → Tasks 1, 3, 4, 5, 6. §8's corridor, ballast, solidity and crossings → Task 2; the live train, gates, wreck and cop interaction are Plan 3 and are called out as such. The `City.keep` invariant → Task 1's `markSolidSafe`, used by every generator.

**Known risk, stated up front.** Task 2 adds roughly 1600px of solid edge, the largest single collision surface in the game. The wedge sweep is the guard, and the instruction on failure is to stop and report rather than to widen the test — a wedge site that is not escapable is a softlock, and 0 of 37 were escapable before `unwedge()` existed.

**Known behaviour change.** Task 4 removes delivery addresses from three `apts` blocks that Plan 1 made deliverable via the `res` fallback. That is intended by the spec (§7) but it is a real change in order distribution and the task says to re-check scoring.

**Placeholder scan.** Tasks 1 and 2 carry complete code. Tasks 3-6 carry a specified shape and a required loop rather than final pixel code, because that code is the part that must be iterated against a rendered frame — the plan says what each must be, what it must respect, and how it is judged. This is deliberate and is flagged here rather than hidden.
