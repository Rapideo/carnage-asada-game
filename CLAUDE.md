# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Taco Shop: Carnage Asada** — a 16-bit top-down taco delivery arcade game (APB + Paperboy). Single-page HTML5 canvas,
**zero dependencies**: no `package.json`, no `node_modules`, no imports, no CDN, and no external assets.
Every sprite, the bitmap font, the city, and all audio are generated procedurally at boot. Keep it that way —
adding a runtime dependency or an asset file breaks the "self-contained single file" property the whole
build is designed around (the published artifact runs under a CSP that blocks all external hosts).

## Commands

```bash
node build.mjs           # bundle src/*.js -> taco-shop.html (ship) + index.html (dev)
node serve.mjs           # static server on http://localhost:8123 (no-store; edits are live in dev)
node test/headless.mjs   # full test suite; exits non-zero on failure
```

There is no lint step, no test framework, and no watch mode. `build.mjs` must be re-run before
`taco-shop.html` reflects source edits; `index.html` loads `src/*.js` directly so it does not.

There is no `package.json` — nothing to install. `taco-shop.html`, `index.html` and **`src/05_content.js`**
are generated; edit `src/`, `shell.html` and `content/` and rebuild rather than editing them directly.

## Authored copy (`content/*.json`)

Player-facing copy for the attract card lives in `content/winners.json`. It is **inlined by `build.mjs`,
never fetched at runtime** — the artifact runs under a CSP that blocks external requests, and `fetch()` on
a `file://` page is blocked by CORS, so a runtime load would blank the screen exactly where it matters.
`build.mjs` emits `src/05_content.js` (a generated `const CONTENT`), which the bundle and the dev page both
pick up with no second code path.

The build **fails loudly** rather than shipping broken text. It rejects any character the 5×7 font cannot
draw, naming the offenders (curly quotes pasted from a document are the usual culprit); it rejects a
missing field; and it rejects copy too wide for the 384px screen, reporting how many characters to trim.
That last one exists because the width limit was a comment in the JSON before it was a guard, and the first
person to edit the file immediately exceeded it — **a note is not a guard.**

`slogan` and `attribution` each accept a string *or* an array of lines, and `overlayWinners` lays the
attribution out below whatever the slogan needs, so long copy wraps rather than being cut. If you add copy
elsewhere, put it here and widen the validation rather than hard-coding strings in `80_game.js`.

## Related docs

- `ROADMAP.md` — the open punch list, and the tiered plan for reshaping the city into the real
  neighbourhood. **Read before touching the street grid**: it records which six modules assume a uniform
  block pitch, and which tiers are safe versus which are a rewrite.
- `docs/superpowers/specs/2026-08-21-hays-neighbourhood-design.md` — the approved design for turning the
  city into the real downtown Hays, and for the Union Pacific line through it. Not yet built. **Read with
  `ROADMAP.md` before touching `40_city.js` or the street grid**: it records the rejected alternatives,
  which is the part the code will never show you.
- `README.md` — what the game is, controls, and the development commands.

- `JOURNAL.md` — the original brief, why each design call was made (including rejected alternatives), the
  bugs that mattered, and the repeatable build order. Read before changing a core mechanic; the reasoning
  behind the tip decay, the throw scheme, and the bag-of-3 rule is not obvious from the code.
- `GAME-SPEC-GUIDE.md` — how the user is asked to brief new games. Useful context for what they optimise
  for, not a spec for this repo.

## Build model (read this before adding a file)

`src/*.js` are **plain scripts, not ES modules** — there are no `import`/`export` statements anywhere.
`build.mjs` concatenates them **in `readdirSync().sort()` order** into a single `<script>`, so:

- **The numeric filename prefix is the load order and therefore the dependency order.** A new module must
  be numbered after everything it uses at load time. Slots are spaced by 10 for exactly this reason.
- **All modules share one global scope in the bundle.** A top-level `const` name declared twice across two
  files is a fatal redeclaration that only surfaces in the bundle, never in dev. `node test/headless.mjs`
  catches it because it concatenates the same way.
- `shell.html` is the page template; `build.mjs` substitutes the `/*__GAME__*/` marker inside its
  `<script>`. It deliberately has **no page chrome** — no header, footer, bezel or key legend. The canvas
  is the whole product. Keep the `#stage` div: `90_main.js` measures it to size the canvas, and deleting
  it silently falls back to `window.innerWidth`.
- `shell.html` deliberately has no `<!doctype>`/`<html>`/`<body>` — the artifact host wraps it. `build.mjs`
  synthesises those wrappers only for the dev `index.html`.
- **Because there is no `<head>`, there is no `<meta charset>`.** Any non-ASCII character in *rendered*
  markup (the `<title>`, header, footer) is decoded as Latin-1 when the file is opened directly and comes
  out as mojibake. Write those as HTML entities (`&mdash;`, `&middot;`). Non-ASCII inside JS comments is
  harmless, and the 5×7 font is ASCII-only anyway, so in-game strings cannot hit this.

| module | responsibility |
|---|---|
| `00_core` | screen/world constants, `PAL`, RNG, `classify()`, `mkCanvas`/`R` helpers, `Input` |
| `05_content` | **generated** — `CONTENT`, inlined from `content/winners.json` by `build.mjs` |
| `10_font` | hand-authored 5×7 glyph table; `text()`, `textOut()`, `money()`, `clockStr()` |
| `20_audio` | `Audio5`: WebAudio SFX, engine voice, siren, and the 4-bar chip loop scheduler |
| `30_art` | `Art.build()` — bakes every sprite/tile once at boot; `rotFrames`/`drawRot`; `shade()`, `disc()`, `keyline()`; `LOGO` display face + `logoText()`/`mkLogoText()` |
| `40_city` | `City.gen()` — street grid, addressed houses, baked ground layer, spatial buckets |
| `50_entities` | `Player`, `Traffic`, `Ped`, `Cop`, `Bag`, `Fx`; shared car physics + collision |
| `60_nav` | `Nav` (TACO-NAV unit) and `solve()` — Dijkstra over the intersection graph |
| `70_hud` | `Hud.draw()` — order card, tip meter, nav panel, minimap; `navArrow`, `triArrow` |
| `75_demo` | `Demo.drive()` — the attract-mode driver; sets the same fields `Player.control` does |
| `80_game` | `G` — state machine, orders/tips/scoring, camera, render pipeline; `Post` |
| `90_main` | canvas scaling, fixed-step loop, audio unlock, `window.TacoShop` bridge |

## Architecture

### Three coordinate systems

1. **Virtual screen** — `VW×VH` = 384×216. All drawing and HUD layout is in these units; `90_main` scales
   the canvas via CSS only. Never draw in device pixels.
2. **World pixels** — `WW×WH` = 1632×1632. Entities, camera, and collision live here.
3. **Tile grid** — `TS`=16, `GW`=102 tiles including a 2-tile (`BORDER`) sea margin.

Road math uses a fourth, implicit space: **grid space**, `ax = tx - BORDER`. `classify()` and every road
formula operate on `ax`/`ay`, so mixing tile and grid coordinates is the most common source of
off-by-one-block bugs. `SEG0`/`PITCH` in `50_entities` are the world-pixel equivalents.

### City layout

`SPAN`=12 is the block pitch: 2 road tiles + a 10-tile interior (a 1-tile sidewalk ring around an 8×8 lot).
Lots subdivide into a 2×2 grid of 4×4 sub-lots, one house each, all four facing the same axis per block.
Intersections are indexed `0..BLOCKS` (9×9) and are the nav graph's nodes — `City.nodeX/nodeY` convert an
index to world pixels, `nearNodeX/nearNodeY` go back.

`City.gen()` bakes the **entire world ground** — tiles, road markings, porch pads, driveways, and static
shadows — into one 1632×1632 canvas. The render pass blits it with a single source-rect `drawImage`.

**`City.gx` is that canvas's live context and is mutated during play**: skid marks (`Player.update`) and
bag splats (`Fx.splat`) are painted into it permanently. Anything drawn there is not undoable without a
regen, so never use it for per-frame effects.

**`City.keep` is a keep-clear mask** marking every porch and its walkway to the kerb. Any new prop, tree, or
scenery placement **must test `City.keep` before marking a tile solid**, or it can bury a delivery target and
make an address unwinnable. `test/headless.mjs` asserts this ("no porch buried in geometry").

### Render pipeline (`G.render`)

Ground blit → nav chevrons → target beacon → **y-sorted sprite pass** → particles → HUD → CRT post.

The sprite pass merges bucket-culled statics with live entities into `G.rl` and sorts by `sortY`:

- **Statics** are plain data — `{img, x, y, oy, w, h, sortY}` — gathered by `City.collect()` from a 128px
  bucket grid using a frame stamp to dedupe. `x,y,w,h` is the **ground footprint**; `oy` is the fake wall
  height, so the sprite draws at `y - oy` and is `h + oy` tall. That offset is what sells the 16-bit
  pseudo-height, and `sortY` must stay the footprint's bottom edge or overlap breaks.
- **Entities** are objects with a `draw(ctx, cam)` method. The loop distinguishes them by the presence of
  an `e` property on the list item.

`cam` passed to `draw` is a rounded, shake-offset copy — not `G.cam`. Use the argument, never `G.cam`,
inside draw code.

### Traffic

Cars are rail-bound, not steered: each holds `dir` (0=E 1=S 2=W 3=N, matching `DIRV`) and `laneNode`, the
**perpendicular** intersection index of the road it is on. Right-hand traffic puts E/N in the far lane and
S/W in the near lane — `Traffic.laneFixed()` is the single source of truth for that.

Turns exploit a uniform rule: measured from the intersection's origin `A`, the right-turn point is at
`+8` and the left at `+24` when travelling in a positive direction, and swapped when negative. Both offsets
land the car exactly on its new lane centre, so a turn is a snap plus a `dir`/`laneNode` update with no
interpolation. Cars are recycled around the player rather than simulated city-wide.

### Guidance (`Nav`)

`solve()` runs Dijkstra over **(node, arrival direction)** states — `NODES²×4` — not plain nodes, so turn
penalties are expressible (straight 0, turn +0.45, U-turn +1.8). This is why routes prefer long straights
and read like real directions. `Nav.update` recomputes every 0.4s and derives the instruction by comparing
the cardinal exit heading against the player's cardinal approach; being off-road forces the
`RECALCULATING` state. Cyan (`PAL.cyan`) is reserved exclusively for guidance UI so it always reads as
machine output — don't spend it elsewhere.

### Title screen and controls

`overlayTitle` is badge + wordmark + blinking prompt, nothing else. **The controls are documented only in
`overlayPause`** — the page used to carry a key legend under the canvas and no longer does, so that overlay
is the single place a player can find them. Don't strip it back to a resume line.

### The display face (`LOGO`)

`LOGO` in `30_art.js` is a hand-authored **7×9** face in the style of the shop's sticker — fat 2-cell
strokes, clipped corners — covering only the 12 characters `TACO SHOP` and `CARNAGE ASADA` need. Both the
badge wordmark and the title are drawn from it, which is what makes them read as one lockup. The 5×7 game
font is separate and untouched; it has one-cell strokes and reads as a scaled-up UI font at display sizes.

**The 7×9 grid is load-bearing.** At scale 3 four characters measure 93px, giving the ~2px overspill the
88px badge face wants; at scale 2 thirteen measure 206px, the title's established width. One grid serves
both sizes with no resampling — changing `LOGO_W`/`LOGO_H` breaks both at once.

`logoText()` draws it with a keyline whose width is in **device px and does not scale with `s`** — the same
reason `keyline()` exists for the 5×7 font. `mkLogoText()` bakes the title once at boot so the 9-pass
keyline isn't redrawn every frame.

Sizing is constrained to whole numbers: cells are drawn as `s×s` rects, so a fractional scale lands on
half-pixels and blurs. To resize display type by an arbitrary percentage, change the **glyph grid**, not
the scale — the advance ratio gives exact percentages that `s` cannot. `EST. 1970` deliberately stays on
the 5×7 font: it's small subtext, and the real sticker sets it in a different face anyway.

### Branding

`PAL.jade`/`PAL.gold` are the shop's badge colours and are **not** part of the in-game semantic set. Jade
sits close enough to `PAL.cyan` that putting it on the HUD would cost guidance its distinct "machine output"
read, so it is confined to two places: `Art.badge` (the title screen) and the shop's roof sign and awning in
`Art.mkTaqueria`. Amber stays money, red stays player/danger.

`Art.mkBadge()` bakes the badge once at boot. Two helpers exist because the normal text path could not draw
it: `disc()` plots a hard-edged circle as one `fillRect` span per scanline (canvas `arc()` antialiases, which
breaks the pixel look), and `keyline()` draws an outline of constant pixel width regardless of glyph scale —
`textOut()` offsets its outline *by* the scale, so past about 2× the eight offset copies merge into a solid
slab instead of a keyline.

### Collision, and why `unwedge()` exists

`carBlocked()` tests the **destination**, so once a car body already overlaps solid geometry every nearby
destination overlaps too — including the ones that would free it. Both axis moves are rejected, speed is
killed each frame, and steering is speed-gated (`clamp(spd/46, 0, 1)`), so the car can neither drive nor
turn out. That state is permanent, not merely awkward: **0 of 37 tested wedge sites were escapable by any
input** before `unwedge()` existed.

`unwedge()` in `50_entities` depenetrates: if the body is overlapping, it nudges toward the first direction
with clear space, widening the probe radius so deep corners are not abandoned. `Player.update` calls it
every frame. Anything that moves a car *without* a `carBlocked` test can recreate the trap — the traffic
separation push in `80_game` did exactly that, shoving the player inside buildings. The
`— collision —` test section asserts every wedge site stays escapable.

### Attract mode

`title` (30s) → `winners` (15s) → `demo` (90s) → `title`, driven by one `G.attractT` countdown. Any key or
click from `winners`/`demo` returns to the title. The demo reuses the play simulation exactly — same
physics, same traffic, same scoring — with `Demo.drive()` swapped in for `Player.control()` and a flag
disabling pause and the tick sound. `G.aimPoint()` has a demo branch so throws aim at the porch.

The winners card is a faithful recreation of the period cabinet screen — flat blue field, seal, slogan in
quotes, attribution, credit counter. The blue is the one place the game's palette gives way to the
reference, because that field *is* the memory of these screens; everything on top of it uses the game's own
gold and bone, and the CRT post pass supplies the scanlines the originals had. `Art.mkSeal()` rasterises
per pixel rather than assembling rects: the scalloped starburst and the lettering ring are both functions
of angle. At 100px the ring lettering is far below legibility, so it is drawn as tick marks — the eye reads
"text around a seal" from the rhythm, which is the honest way to render sub-pixel type.

Two things the demo driver must keep doing, both learned by watching it fail:

- **Steer at the house's `curb`, never at `Nav.goal`.** The goal is the porch, which sits in the front
  yard; steering at it drives the car off the road and into the scenery.
- **Test streets with `classify()`, not `surfaceAt()`.** Parking lots and shop aprons are surfaced
  `S_ROAD`, so a surface test lets the demo cut across lots full of solid parked cars.

### Game state (`G`)

States: `title` → `winners` → `demo` → `play` → `results`. One active `order` at a time; `G.needPickup` (bag empty) redirects the
nav to the shop while the order and its decaying tip stay live. Throwing consumes a bag slot immediately, so
a miss can strand you mid-order — that coupling is intentional.

**All money is integer cents.** `money()` formats it. Tuning dials are the constants at the top of
`80_game.js` (`SHIFT_START`, `TIME_PER_JOB`, `TIP_*`, fines, `BAG_MAX`).

### Loop and input

`90_main` runs a fixed `1/60` step with an accumulator capped at 0.25s and a 5-iteration guard. Browsers
pause `requestAnimationFrame` in a hidden tab; `visibilitychange` resets the accumulator so the shift never
fast-forwards through time the player did not see.

`Input` keys off `e.code` (physical position, so WASD survives AZERTY) plus `e.key` for named keys.
`Input.p()` reads one-shot presses that `Input.endFrame()` clears — it must be called once per fixed step,
inside the loop, or presses are consumed at the wrong rate.

`window.TacoShop` exposes `{G, City, Nav, Art, Audio5, Input, ctx, step(n)}`. `step(n)` advances and renders
manually, which is the only way to drive the game in a backgrounded tab (where rAF is paused) — use it for
browser verification. Note `Fx` is **not** on the bridge; to exercise particles or splats from the console,
trigger them through gameplay (a bag landing off-porch calls `Fx.splat`/`Fx.spill`) rather than directly.

To hold a single frame for inspection while rAF is running, swap `G.update` for a no-op — `G.render` will
keep redrawing the frozen state. Restore it afterwards or the game stays stuck.

## Testing

`test/headless.mjs` runs the real modules in a `node:vm` sandbox against a Proxy-based stub 2D context, so
every drawing call is a no-op but all logic executes. 47 assertions covering city invariants (address
uniqueness, porch reachability), HUD text widths, wedge escapability, 250 solved routes, 9000 fuzzed
simulation frames checked for NaN and out-of-world drift, the attract rotation and 85s of autonomous
demo driving, the full scoring loop, and heat/cop behaviour.

**The `— hud layout —` section exists because three text-overflow bugs shipped in the order card.** It
asserts the longest *generated* address still fits, that both restock lines fit, and that every banner box
fits the 384px screen. Extend it whenever you add HUD copy — the drawing stubs make overflow invisible
otherwise, and none of these bugs were catchable by any other assertion.

Three things to know when extending it:

- Top-level `const`/`let` live in the script's lexical scope and **never appear on the sandbox global**. The
  harness appends a `globalThis.__x = {...}` line to hand bindings out; add any new symbol you need there.
- It stubs `setTimeout` into a `deferred` array so `90_main`'s boot IIFE does not race the assertions.
- **Sections share one mutable game and one `Input`, and run in order.** State leaks forward: the fuzz
  section holds driving keys in `Input.down`, so `— scoring —` must reset it before parking the car, or the
  player drives off and spins out — and `G.tryThrow()` silently no-ops while `player.spinT > 0`, which made
  those assertions fail about 1 run in 20. Any new section that sets input or teleports the player should
  reset what it relies on rather than assume a clean slate.

The suite uses `Math.random()` (not the seeded RNG) for the fuzz and for order selection, so runs are not
reproducible. When something fails, re-run it several times to tell a real break from a flake — and treat a
flake as a bug in the harness, not noise to live with.

Assertions about autonomous behaviour must measure the right thing. "Net displacement over 85s" looked
like a reasonable check that the demo was driving, but the demo takes orders all over the map and can
legitimately finish near where it started — it failed on working code. Total path length plus a
*longest-stall* bound is what actually captures "never wedges".

There is no per-test filter — it is one sequential script with labelled sections (`— build —`,
`— hud layout —`, `— collision —`, `— guidance —`, `— simulation —`, `— scoring —`, `— attract —`,
`— heat —`). To isolate one, edit the script.

## Publishing

`taco-shop.html` is the shippable artifact: one self-contained file, ~143 KB. It must stay free of external
requests. `?seed=<int>` on the URL regenerates the city deterministically (mulberry32); the default seed is
in `90_main.js`.
