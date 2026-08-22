# Roadmap

Working list for **Taco Shop: Carnage Asada**. Small items first, then the neighbourhood pass.

Checkboxes render as a live task list on GitHub:
<https://github.com/Rapideo/carnage-asada-game/blob/master/ROADMAP.md>

---

## Punch list

The single list. Merged 2026-08-21 from this file and the standalone
`TACO SHOP - CARNAGE ASADA - Punch List.md` of 16 August, which is now retired — two lists that
disagreed is how the Hays items sat open for days after they had shipped. Everything below is known
and unclaimed; add to it freely. Status was verified against the code at merge time, not assumed.

### Bugs

- [ ] **A pursuing cop wedges about a third of the time.** Measured 19 of 60 dispatches never covered
      40px in ten seconds. `Cop.update` does not call `unwedge()` the way `Player.update` does, so a
      cruiser that drives into geometry is stuck permanently — the exact defect `unwedge()` exists to
      prevent. Not a railway problem: 17 of those 19 jammed 166–272px away from the corridor, in
      ordinary city geometry. Likely a one-line fix.
- [ ] **The shop apron is the easiest place in the city to get stuck.** Measured in play: 25 seconds
      lost crawling and re-wedging within ~60px of the dock, and separately ~$10 of decaying tip lost
      wedged on a warehouse corner nearby. Reversing always freed it — this is not a softlock — but it
      is the most cluttered ground in the game and it sits exactly where every restock trip ends.
- [ ] **Canvas renders at 1× between ~768–900px window width.** The scale rule at `90_main.js:21`
      snaps to a crisp 1:1 below 2×, so on a narrow window the game sits small in a large black field.
      Deliberate and pre-existing, but far more noticeable now the page frame is gone. Fix is to let
      that band fit like every other size, at the cost of slightly uneven pixels.
- [ ] **Demo driver clips kerbs.** It recovers every time since the collision fix, but it drives
      visibly worse than a person and triggers `RETURN TO ROADWAY` more than it should. Path-following
      rather than steer-straight-at-the-target would fix it properly.

### HUD and presentation

- [ ] **Drop the "TACO-NAV 2000" header** and shrink the directions box to fit (`70_hud.js:124`).
- [ ] **Relabel "TACO BAG" as "DELIVERIES"** (`70_hud.js:129`).
- [ ] **Title sequence.** Hold "CARNAGE ASADA" for ~3s, then fade it in with a rumble in the style of
      the gameplay collision shake. `overlayTitle` is currently badge + wordmark + blinking prompt and
      has no timed sequence at all.
- [ ] **Attract timings may want tuning.** Currently title 30s / winners 15s / demo 90s
      (`ATTRACT_*` at the top of `80_game.js`). 90 seconds is a long watch.

### Features

- [ ] **Score and high-score screen.** There is no persistence of any kind — no `localStorage`,
      nothing. Improvement currently shows only as one of five rank strings, which is coarse for a
      game whose skill curve turns on shaving seconds off a delivery. Self-contained: one new state,
      no engine risk.
- [ ] **Rework throwing.** Auto-aim, or aim-after-click, or something else — the current scheme is
      mouse position or facing direction. Note the design tension: throw spread scales with speed
      (`speed / MAXSPD * 22` px against a 28px porch), and that trade *is* the game's core skill, so
      auto-aim changes the feel more than any other item on this list.
- [ ] **Downtown has no deliverable addresses.** Only `res` blocks generate houses, so orders
      concentrate south of the tracks and the tightest driving in the game — the Fort/Main retail
      spine — carries traffic and hazard but no targets. §7 of the spec names the fix: a street door
      for the flat above the shop, giving `retail` and `apts` blocks an address.
- [ ] **Border zones.** Replace the current grey/sea margin with proper N/E/S/W edge zones. The
      border is still the 2-tile `T_SEA` ring from the original generator.
- [ ] **A second time period.** `content/hays.json` exists in the shape it does to make this cheap:
      another era is another file against the same schema plus a switch on which one loads, not
      another pass through `40_city.js`. Nothing in the city generator hard-codes a year. See §4 of
      the spec.
- [ ] **Seasonal hazards.**
- [ ] **NPC feedback — APB-style character dialogue.**

### Housekeeping

- [ ] **Default branch is `master`, not `main`.** GitHub took what the repo had. One command if it
      matters: `git branch -m master main && git push -u origin main`.
- [ ] **Line endings churn the built artifact.** `core.autocrlf=true` means a fresh checkout hands
      `build.mjs` CRLF sources, so a rebuild produces a byte-different `taco-shop.html` with identical
      content (189 KB vs 193 KB). A `.gitattributes` with `* text=auto eol=lf` would pin it.

### Open questions

These need a decision before they can become work.

- [ ] **Difficulty progression.** Grid expansion? A faster timer? Something else? Note the shift
      clock is already a survival curve — 110s to start, +9s per delivery, +12s for a perfect toss —
      so difficulty may be more about tightening that ratio than adding systems.
- [ ] **Is the pedestrian fine doing any work?** $2.00 against a $15.00 delivery is 13%, and a
      playtest of three shifts says it is not a deterrent: the run that hit **ten** pedestrians
      out-earned the clean run, because cutting corners buys more time than the fines cost. The
      intended deterrent is the chain heat → cop → $15 ticket, but across those three shifts **no
      ticket was ever paid** — the cop was lost every time. So the cheap penalty lands and the
      expensive one does not. Options: raise the fine, slow heat decay (currently 7/s) so pursuits
      actually convert, or make the cop harder to shake. Needs a decision on what the intended
      punishment for reckless driving even is.
- [ ] **What happens when Hays PD catches you?** Currently a $15 ticket, a spin-out and heat reset.
- [ ] **How should the player car read as *the* car?** Turning it white is the starting idea.
- [ ] **Gamepad / Xbox controller support**, and whether an on-screen control overlay comes with it.

### Landed, for the record

Closed by the neighbourhood pass and no longer carried: the Hays street data, the block-kind zoning,
and the display-face resize (the 9×11 → 7×9 glyph-grid change in `JOURNAL.md`, which is what made an
exact percentage possible — cells are square `s×s` rects, so `scale` alone cannot do it).

Closed 2026-08-21: **the clipped banner** — text moved from y=66 to y=63, verified by reading the
rendered pixels rather than by eye (glyphs now occupy rows 63–76 inside a box spanning 60–79, two
clear rows of ink either side). And **the display face on the shop building** — `Art.mkTaqueria`
sets its rooftop sign with `logoText()` at scale 2, gold on jade with a 1px ink keyline, so the shop
on the map and the badge on the title screen are one lockup. The board grew from 34px tall to 50 to
take it: `LOGO` is a 7×9 grid against the game font's 5×7, and scale cannot be fudged because cells
are square `s×s` rects. Four rows of jade sit between the lines — butted together the two keylines
touch and the O of TACO fuses into the H of SHOP. The real sticker in `reference/assets/` interlocks
those lines deliberately, but it separates them with outlines that pixel type at this size has no
room for.

### Playtest notes — 2026-08-21

Measured over three shifts. Numbers, not impressions; feel is still untested.

- **Break-even is about 9 seconds per delivery**, and the best measured round trip was 9.4s. A
  delivery buys `TIME_PER_JOB` = 9s (12s perfect) against a 110s shift, so the game is a survival
  curve and that margin is razor thin. This looks right — leave it alone unless playtesting says
  otherwise.
- **Speed beats volume.** Three shifts: a fast run earned $10.31 per delivery against a careful
  run's $6.47, because the tip decays at 55¢/s and arriving late is worth less than arriving at all.
  The clean, cautious shift was the *worst* earner of the three.
- **The tip floor makes the perfect bonus dominant, and that is a feature.** Once the tip bottoms
  out at $2.00, `PERFECT_BONUS` of $5.00 is 2.5× the whole delivery — so on a late job accuracy is
  the entire payout. Emergent rather than designed. **Don't "fix" it.**
- **Out-of-range throws are a mouse-only mistake.** `aimPoint()` clamps to `MAXTHROW` = 132px and
  the reticle turns `PAL.good` only on a porch lock, so the feedback is there — but keyboard aim is
  a fixed 84px ahead of the car and therefore *always* in range. Only a mouse player can waste a bag
  by throwing short. Worth knowing before anyone reworks throwing (see Features).
- **The railway plays as designed.** Running a lowered gate charged the +20 heat correctly. The
  failed attempt failed for the right reason: a traffic car T-boned the run-up at full speed. The
  approach being a live street is what makes it a gamble rather than a timing puzzle.

_Add further playtest findings here._

---

## The neighbourhood pass

Goal: make the city read as the blocks around the real Taco Shop — commercial strip, residential, college —
rather than a uniform random grid.

> **Status: all three plans have landed.** The city is Hays -- real street names, real Hays
> addressing, the authored zoning table, and all six block kinds built out. The Union Pacific runs
> through it: a live train every 22-40s, nine level crossings whose gates lower and lift, a wreck
> that throws you clear of the corridor, and a cruiser that is not exempt. Plans are in
> `docs/superpowers/plans/`. The full design is
> [`docs/superpowers/specs/2026-08-21-hays-neighbourhood-design.md`](docs/superpowers/specs/2026-08-21-hays-neighbourhood-design.md).
> Read it before starting work on the city -- it records the decisions *and the alternatives that
> were rejected*, which is the part that is not recoverable from the code. The sections below remain
> accurate as background on why the job costs what it costs.

### Why the two halves cost very different amounts

Building *types* are separable. Street *layout* is not: the uniform grid is an assumption baked into six
modules, not merely how the city is drawn.

| what | assumes |
|---|---|
| `classify()` (`00_core`) | `ax % SPAN < 2` decides road vs lot |
| `Hud.buildMap` | calls `classify()` directly to draw the minimap |
| `Traffic` (`50_entities`) | rails are `SEG0 + node * PITCH`, one constant pitch |
| `Nav` (`60_nav`) | nodes are `(i,j)` indices assuming even spacing |
| addresses (`40_city`) | derived from block coordinates |
| `Demo` (`75_demo`) | street test goes through `classify()` |

`classify()` is the single source of truth. Anything that changes the street layout **without** going
through it will desync the minimap from the world. The approved design does not touch `classify()` at all,
which is how it sidesteps this entire class of bug.

### Tier 1 — zoning and street names · *free, ~15 lines*

`kinds[by][bx]` at `40_city.js:57` is already an 8×8 array filled by a random roll. Replace the roll with a
hand-authored table; swap `HSTREETS`/`VSTREETS` for the real street names and addresses come out right
automatically.

Gets you "that's the college block, that's the commercial strip" with zero architectural risk.

### Tier 2 — new block kinds · *~a day, no risk*

There are five today: `res`, `com`, `park`, `lot`, `shop`. Add what the real neighbourhood has — a campus,
a strip mall with a shared apron facing the street, apartment blocks, a parking structure. Each is a new
`genX()` alongside `genResidential`, writing into the same statics / solid / ground structures. Completely
separable; nothing else needs to know they exist.

### Tier 3 — irregular block sizes · *real work, still safe*

Replace the `% SPAN` modulo with per-axis street-position arrays (`streetX = [0, 12, 26, 38, 54, …]`).
`classify()` becomes a lookup, nav nodes become indices into those arrays, `Traffic.laneFixed` reads the
array instead of multiplying by `PITCH`. Buys real block proportions — a long block here, a short one there
— while staying rectilinear.

Worth doing only if the real layout has proportions that jump out at you.

### Tier 4 — true geometry · *not recommended*

Diagonals, curves, five-way junctions, streets that don't span the map. Breaks the nav graph's grid
indexing and the traffic rail system outright. A from-scratch city module.

### What the survey settled

The city is **downtown Hays, Kansas**: Elm Street to Milner Street, 4th Street to 12th Street, with the
shop at its real address, **333 W 8th St**.

- **Tiers 1 + 2 are the scope. Tiers 3 and 4 are rejected.** Measured street bearings show downtown Hays
  is a *perfect rectilinear grid rotated 28°* to the Union Pacific alignment — no diagonals, no curves, no
  five-way junctions. Rotating the map so Main Street points up lands it on the existing axis-aligned grid
  with no distortion, so the Tier 4 rewrite never becomes necessary.
- **There is an exact nine-street window per axis — precisely `BLOCKS + 1` — centred on the shop.** The
  8×8 block grid did not need to change to hold the real neighbourhood.
- **Square blocks are kept.** Real blocks are ~500ft × 340ft, but a per-axis pitch breaks all six modules
  above *and* halves the houses per block, dragging the address generator and porch layout in with it.
  Recognition comes from names and contents, not proportion.
- **The zoning grid and street names now live in `content/hays.json`**, validated at build time, rather
  than hard-coded — the same path `winners.json` already uses.
- **New scope the tiers did not anticipate:** the Union Pacific line runs the full width of the map
  between 9th and 10th, which is why that whole band is parking lots and Union Pacific Park in reality. It
  ships with a live train, level crossings whose gates are drawn but not solid, and a wreck if you lose the
  gamble. The cruiser is not exempt, so the crossing doubles as an escape from a pursuit.

### The invariant to design around

Any new block kind **must** test `City.keep` before marking a tile solid, or it can bury a delivery porch
and make an address unwinnable. `test/headless.mjs` asserts this ("no porch buried in geometry"), so a
violation fails the build rather than shipping — but it is the thing to design around from the start.
