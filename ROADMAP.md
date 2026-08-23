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

- [ ] **The shop apron: re-measured 2026-08-23, and the question has changed.** The item asked for a
      re-measurement before anyone touched the geometry. Done, and the geometry turns out to be
      close to beside the point.

      The corridor is clean. Kerb to dock is 40px, every sample along it is paved `S_ROAD`, and
      **0 of 41 samples would block a car pointing south** — the crawl really was the whole of the
      original 25-second report, and it is fixed. Measured over 20 minutes of demo: 44 visits inside
      60px of the dock, **mean 2.3s each** against a mandatory 1.0s restock hold, so about 1.3s of
      manoeuvring. Worst was 6.8s. Reversing accounts for 4.9% of apron frames and a blocked move
      for 2.7%.

      **The more useful finding: you never have to enter the apron at all.** Restock needs you within
      54px of the dock and under speed 62, held 1.0s. The dock is at y=776 and the carriageway runs
      y 800..832 — so a car anywhere on the road at the shop's x is **24 to 48px from the dock,
      already inside the radius**. Driving straight past on the street, never leaving the
      carriageway:

      | approach speed | time inside 54px | of which under 62 | restocked? |
      |---|---|---|---|
      | 40 | 1.00s | 1.00s | **yes, at 3.5s** |
      | 60 | 1.42s | 0.85s | no — just short |
      | 80 | 1.07s | 0.00s | no |
      | 120 | 1.07s | 0.00s | no |

      So a kerbside restock works at roughly 40-50 and the **speed gate binds, not the geometry**.
      The apron only costs anything because the driver aims at `City.shop.dock`, which is inside the
      pocket, rather than stopping at the kerb — which is true of the demo and of any player who has
      not noticed they can coast past.

      That leaves a real decision rather than a bug. Options: leave it (the pocket is then a thing
      skilled players learn to skip); widen the pocket; or lean into it and make the kerbside pickup
      explicit, which is the only one that changes how the shop *reads*. Not a fix to apply blind —
      it wants the same playtest the other balance questions want, and the numbers above are now on
      record so it can be judged rather than guessed.

### HUD and presentation

- [ ] **Judge the attract timings after a full cycle.** Still title 30s / winners 15s / demo 90s, and
      90 seconds is a long watch. The dials are now in `content/attract.json` rather than constants, so
      this is a one-line edit and a rebuild — but it is a judgement nobody has made yet.

### Features

- [ ] **Rework throwing.** Auto-aim, or aim-after-click, or something else — the current scheme is
      mouse position or facing direction. Note the design tension: throw spread scales with speed
      (`speed / MAXSPD * 22` px against a 28px porch), and that trade *is* the game's core skill, so
      auto-aim changes the feel more than any other item on this list.
- [ ] **Border zones.** Replace the current grey/sea margin with proper N/E/S/W edge zones. The
      border is still the 2-tile `T_SEA` ring from the original generator.
- [ ] **A second time period.** `content/hays.json` exists in the shape it does to make this cheap:
      another era is another file against the same schema plus a switch on which one loads, not
      another pass through `40_city.js`. Nothing in the city generator hard-codes a year. See §4 of
      the spec.
- [ ] **The kitchen — the other half of the game.** **Scope changed 2026-08-23, and the change is
      large.** This was filed as a mini-game replacing the flat 1.0s restock. It is not one. The
      kitchen is now the *other half of the play*: players alternate between driving deliveries and
      making the food, and the brief says so in its first line. Treat any earlier framing of it as a
      restock replacement as superseded.

      **The user is planning it now and a full spec is coming.** Do not start building from the
      current brief — it is a work in progress with three sections still unwritten (The Clock, The
      Order Timer, The Dialog System). Wait for the spec.

      Two files, and `docs/kitchen-minigame-prompt1.1.md` is the **newer** of the two:
      `docs/kitchen-minigame-prompt.md` is the original brief as revised, and the 1.1 adds a *Global
      Adjustments* section for the changes needed game-wide to let the two halves share one product.
      What has already moved between versions: menu, ingredients and build order become a **JSON
      settings file** against the `content/` pattern the rest of the authored copy uses; tickets
      become **concurrent**, up to three live at once, rather than one at a time; items per order
      drop from 1-8 to 1-5. The filenames still say "minigame" and are now misleading — worth a
      rename when the spec lands and the naming settles.

- [ ] **Seasonal hazards.**
- [ ] **NPC feedback — APB-style character dialogue.**

### Housekeeping

- [ ] **Default branch is `master`, not `main`.** GitHub took what the repo had. One command if it
      matters: `git branch -m master main && git push -u origin main`.

### Open questions

These need a decision before they can become work.

- [ ] **Difficulty progression.** Grid expansion? A faster timer? Something else? Note the shift
      clock is already a survival curve — 110s to start, +9s per delivery, +12s for a perfect toss —
      so difficulty may be more about tightening that ratio than adding systems.
- [ ] **Is the $15 ticket too heavy now the cop can actually catch you?** This question has
      **reversed** since it was first written, and the reversal is the interesting part.

      The original finding was that reckless driving went unpunished: across three shifts, ten
      pedestrians were hit and **no ticket was ever paid**, because the cop jammed into geometry
      before reaching anyone. That was the wedging-cop bug, now fixed — and fixing it turned a
      cosmetic defect into a live balance change. Pursuits that resolve went from 27 of 60 to 44 of
      60.

      Re-measured on the fixed build, three more shifts: **$23.61 with no ticket, $0.00 with two, and
      $7.27 with one.** A $15.00 ticket against a typical $20–25 shift is 60–75% of everything
      earned, and `earned` floors at zero — so the middle run delivered two perfect tosses and took
      home nothing at all.

      So the chain now has teeth, and the open question is whether it has too many. The pedestrian
      fine is no longer the lever: at $2.00 it is a rounding error, but pedestrians feed heat, and
      heat is what now costs you. Options, in rough order of bluntness: lower `TICKET`, raise the
      heat decay above 7/s, or make the cop easier to shake once it has ticketed you. Needs a
      decision about how punishing a bad shift should be, and it should be made by playing rather
      than by arithmetic.
- [ ] **Does downtown play the way it is meant to?** Shipped 2026-08-22 and **not yet played.** The
      design position was that a downtown door is *deliberately* an easier throw than a suburban
      porch — the target is the same 28px but sits on the pavement, roughly 24px nearer the kerb than
      a porch set back in a yard — and that this is the payoff for driving the spine and crossing the
      tracks. It cannot be farmed, because `newOrder` issues addresses rather than letting the player
      choose one.

      Two numbers to check it against. Downtown is 18 of 138 addresses, **13%**, against downtown
      being 14% of the map — so by raw count it is proportional. But measured from the shop, **17 of
      18** downtown addresses fall inside `newOrder`'s 230–980px window against **80 of 120**
      residential ones, so the *effective* share is nearer **17%**. That was not designed, it falls
      out of downtown being close to the shop.

      What to watch for: whether downtown runs feel like a reward or like the easy money that makes
      the suburbs feel like a chore. If it is the latter the lever is the porch width for
      `retail`/`apts` in `addAddress`, not the address count — narrowing the downtown target to
      ~18px was the rejected alternative and is a one-number change if it turns out to be wanted.
      Decide by playing, not by arithmetic.
- [ ] **What happens when Hays PD catches you?** Currently a $15 ticket, a spin-out and heat reset.
- [ ] **How should the player car read as *the* car?** Turning it white is the starting idea.
- [ ] **Gamepad / Xbox controller support**, and whether an on-screen control overlay comes with it.

### Landed, for the record

Closed 2026-08-23: **the nav unit stops describing junctions you have already passed.** Found while
fixing the attract driver and deliberately deferred then, because it is player-facing and the driver
work was not. `Nav.recompute` seeded its Dijkstra from the *nearest* junction, which can be one the
car has driven past, and patched that up afterwards by dropping the head node when the car was
closer to the second node than the two nodes are to each other. That fires 12px past on a straight
and **never on a turn** — there the second node is perpendicular and a full `PITCH` away wherever
the car is.

The symptom was on the panel the whole time. Driving straight through a junction the route wanted a
turn at: **91 of 151 frames had the head node behind the car, and in 89 of them the displayed
distance was growing** while the instruction still read `TURN LEFT` — never `MAKE A U-TURN`, which
has been in `TURN_NAMES` all along. After: 21 frames and 15, and the residual is only the 0.4s
recompute cadence.

Dropping the head node was *not* the fix — on a turn the node after it is perpendicular, so it would
point somewhere unreachable in a straight line. The seed is now `Nav.aheadNode(p)`, the junction the
car is heading toward, and Dijkstra does the rest: it routes on around the block, because a U-turn
costs 1.8 against three turns at 0.45. The demo, which builds its lane polyline from `Nav.route`,
came out slightly better on every measure (off the tarmac 23.1% to 21.8%, grass 3.3% to 2.5%).

Confirmed in play 2026-08-23, which closes the one gap the harness could not: every number above
comes from a sandbox where all drawing is a no-op stub, and this is a change to what the panel
*says*. Still untested is whether `MAKE A U-TURN` ever actually appears — the reproduction never
produced a route where a U-turn beat going round the block, so that branch of `relTurn` remains
unexercised in practice.

Guarded by a new `— guidance —` assertion that samples just past every junction on both axes and
both directions. It fails on the old code at **147 of 288** and passes at 0 — the 250-contiguous-
routes assertion that was already there could never see it, because a contiguous route can still
start behind you.


Closed 2026-08-23: **the attract driver follows a lane**. The punch list said it clipped kerbs and
that path-following would fix it properly. Half right, and the half it got wrong was the useful part.

Measured before touching anything, because the complaint was unquantified. The old driver spent
**34.9% of its frames steering at a point behind the car** — 85px behind on average, for up to 9
seconds — and 27.2% steering at one under 24px away, where `atan2` swings wildly and
`clamp(err * 2.2)` saturates the wheel. `Nav.recompute` retires the head node when the car is closer
to the *second* node than the two nodes are to each other: on a straight that fires 12px past the
node, but on a **turn** the second node is perpendicular and a full `PITCH` away wherever the car is,
so the head node is never retired at all. Corner-cutting and mid-block wandering were the same bug
seen at two distances.

**Neither half of the fix works alone.** Retiring passed nodes on its own made it *worse* — 32.0% off
the tarmac against 25.7%, grass time 2.9% to 8.3% — because the node you advance to is around a
corner and driving straight at it crosses the block.

`Demo.buildPath` now turns `Nav.route` into a polyline of **lane** centres via `Traffic.laneFixed`,
the same right-hand-traffic rule the traffic obeys; vertices are where consecutive legs' centrelines
cross, so left and right turns need no special case. `Nav` is untouched, so nothing player-facing
moved. Paired 20-minute runs:

| | old | new |
|---|---|---|
| off the tarmac | 26.4% | **23.1%** |
| excursions | 461 (one per 2.6s) | **305** (one per 3.9s) |
| worst single excursion | 5.7s | **3.7s** |
| on grass | 4.7% | **3.3%** |
| steering at a point under 24px away | 27.2% | **3.6%** |
| mean offset from the lane centre | 10.0px | **6.4px** |
| frames more than 12px off lane centre | 36.7% | **20.6%** |
| delivered / earned | 42 / $134.79 | **60 / $640.09** |

The earnings gap is far wider than the delivery gap because the tip decays at 55c/s — the old driver
was arriving late on almost everything. Playtested and confirmed before merge.

Three things worth keeping:

- **The retirement test is the whole feature.** Retiring a waypoint on "is it behind my nose" is the
  obvious implementation and is catastrophically wrong: the corner you are about to turn *onto* sits
  square to your heading, so a nose test throws away the very waypoint you were braking for, and the
  path collapses to the delivery kerb — which can be most of the map away and diagonal.
  `test/headless.mjs` carries a comment on why it deliberately does **not** assert the nose test.
  Asserting it would demand the bug back.
- **Speed is part of the geometry.** No aim point fixes a speed the car cannot turn at. Turn radius is
  `v / (TURNRATE * (1 - 0.28 * v / MAXSPD))` — ~37px at 100, ~24px at 70 — so against a 32px
  carriageway a **right** turn only stays on the tarmac below about 70, while left turns have room to
  spare. Pure pursuit also cuts a corner by roughly its lookahead, so the lookahead has to stay near
  the turning radius; the first cut used 38-65px and was measurably worse than the naive driver.
- **Three plausible causes that measurement killed**, recorded so they are not re-run: kerbside
  furniture (lane centres are 0.00% blocked, identical to the crown of the road); sharing a lane with
  traffic (traffic-ahead frames 8.5% new against 7.7% old, unchanged); and the corner governor
  (disabling it left off-tarmac flat and dropped deliveries from ~15 to 9). What it actually was: the
  off-road recovery aimed at the nearest **junction**, half a block away on *both* axes, so the line
  to it ran diagonally through the block interior. Aiming at the nearest **carriageway** instead was
  worth most of the remaining gap.

**The stuck tail, addressed 2026-08-23.** The driver leaves the road less than the old one but was
going *deeper* when it did — its excursions start at corners, where block interiors are full of
furniture, rather than as shallow drifts near kerbs and porches, which are `keep`-reserved and
prop-free. The escape could not see it: `wedgeT` accumulated only below `p.speed < 20`, so a car
grinding along a fence at 21-29 never tripped it, and worse, any single frame ticking over 20 decayed
the accumulator, so a jiggling car oscillated below the threshold forever. **The defect was the
ratchet, not the number.** One traced excursion ran 8.8s.

Entrapment is now judged on net displacement over half a second — under 20px, away from the target —
because a car that is genuinely stuck is not going anywhere whatever its speedometer reads. Over
twenty minutes: entrapments longer than four seconds **41 to 7**, worst **16.8s to 9.1s**, with
off-tarmac time and deliveries unchanged. The cost is hard resets going 9 to 25, one visible jump per
48s of attract mode rather than one per 133s.

Three things tried and rejected, all measured, so they are not re-run:

- **`carBlocked` as the signal** — the honest-looking question, under power and refused by collision.
  It is never sustained on any build: 1.0% of frames, longest run 0.12s, because `Player.update`
  calls `unwedge()` every frame and depenetrates. It catches contact, not entrapment.
- **Decaying at half the accumulation rate**, which the old per-frame version did. Shortens the worst
  grind to 7.2s but quadruples the resets to 47.
- **Snapping the reset to the nearest carriageway** instead of the nearest junction, to make the jump
  read as a stumble (35px against 78px). A smaller escape turns out to be a less effective one — the
  car is freed beside the trap and drives straight back in. Off-tarmac 26.8% against 23.2%,
  deliveries 44 against 50, and it does not even reduce the resets.
- **Splitting the two escapes** — progress driving the reverse, a frozen car driving the teleport.
  Keeps resets at ~10 but off-tarmac balloons to ~35% and deliveries fall to ~33. The teleport is
  doing real rescue work.

Still open, and still uninvestigated: the obstacle probe tests only `City.isSolid` and so cannot see
a traffic car at all.

Closed 2026-08-22: **downtown deliveries**. The Fort/Main retail spine carried traffic, the rail
corridor and the tightest driving in the game, and nothing to deliver to; orders concentrated south
of the tracks because only `res` blocks made addresses. §7 of the spec had deferred the fix to avoid
a *second address path* — so the fix was to make sure there still isn't one. The address block came
out of `genResidential` into **`City.addAddress`**, and `genResidential`, `genRetail` and `genApts`
all call it. 12 retail doors (one flat above each store run) and 6 apartment doors: **18 addresses,
13% of orders against downtown being 14% of the map.**

Two things worth keeping:

- **The geometry generalised for free, which is what made this small.** Every offset in the address
  path is measured from the building footprint, so a building flush to the lot line — which is what
  a downtown storefront is — puts its porch in the sidewalk ring with no special case. No new art,
  no notch in the store sprites, no collision changes.
- **The target stays 28px wide downtown, so a street door is a softer throw than a suburban porch.**
  That is deliberate: it is the payoff for driving the spine and crossing the tracks, and it cannot
  be farmed because `newOrder` issues addresses rather than letting the player choose. Measured from
  the shop, 17 of 18 downtown addresses fall inside the order filter's 230–980px window against 80
  of 120 residential ones, so downtown's *effective* share is nearer 17% than 13%.

**The one real defect was invisible to every test and found by looking at the screen.** Statics draw
from `y - oy`, so a north-facing building's fake wall height rises into its own porch. A house has
`oy` 9 against a 15px porch and leaves a 6px sliver — the look the game already shipped. A store run
has `oy` 14 and left **1px**: the target was there, hittable, and effectively invisible. A north
porch is now set out by `max(0, oy - 9)` so the sliver holds, which leaves every residential porch
exactly where it was. `— downtown addresses —` asserts it across *every* north-facing address, not
just downtown, so neither a new block kind nor a taller sprite can swallow one again.

Closed 2026-08-22: **the shop apron crawl**. `genShop` painted the apron and the driveway onto the
ground canvas but never wrote `S_ROAD` into `surf`, so the tarmac you can see was still sidewalk in
the data. Crossing it cost `SURF_MUL[S_WALK]` = 0.60 — **60% of top speed and 60% of acceleration** —
across the 16px kerb band, twice per delivery, at the one spot in the game the player is *required*
to leave the road. Measured on the fixed build, the exit from the dock to the street now holds 176
the whole way where it used to drop to 106. The apron and driveway are now declared as rectangles
once and used twice, to paint *and* to pave, so the picture and the data cannot drift apart again;
both are also reserved in `keep`, because `genFurniture` runs after every block generator and tests
nothing else. Guarded by the new `— shop apron —` section in `test/headless.mjs`.

The general lesson is the inverse of the one already in `CLAUDE.md`. That file warns that *a
generator which marks more solid than it draws will eventually build a trap*; this was a generator
that **drew more road than it marked**, and the failure mode is the mirror image — invisible on
screen, because the picture was right, and blamed on car handling for months.

Closed 2026-08-22: **the 1× scaling band**. `90_main.js` snapped everything between 1× and 2× to a
crisp 1:1, and because `#stage` fills the viewport the governing term is `min(W/384, H/216)` — so
*height* put ordinary windows in that band constantly. Measured: an 800×400 stage rendered the canvas
at 384×216 and threw away **52% of the width**; 760×430 threw away 49%; 700×390, 45%. The band now
fits like every other size. At and above 2× the output is byte-identical — a 900×470 stage gives
826×464 under both rules — so the change is confined to exactly the broken range.

Closed 2026-08-22: **line-ending churn**. `.gitattributes` pins `* text=auto eol=lf` (with `*.webp
binary`), the working tree was converted, and `core.autocrlf` is off locally so the two rules stop
disagreeing. `node build.mjs` twice in a row now produces byte-identical output. The 25 files this
touched carried no content change — the blobs were already LF; it was the *working tree* that was
mixed, which is the half that matters, because `build.mjs` reads the working tree.

Closed by the neighbourhood pass and no longer carried: the Hays street data, the block-kind zoning,
and the display-face resize (the 9×11 → 7×9 glyph-grid change in `JOURNAL.md`, which is what made an
exact percentage possible — cells are square `s×s` rects, so `scale` alone cannot do it).

Closed 2026-08-21: **scoring and the high-score board**. The score is the money — `G.earned` in
cents — because it already integrates speed, accuracy, consistency and restraint; a second points
number would only compete with it. Ten places, persisted in guarded `localStorage` with the factory
board authored in `content/scores.json`. Initials go in on a cabinet wheel, arrows only. The attract
middle slot alternates between the winners card and the board rather than growing a fourth screen,
so the cycle stays 135s. A shift that misses is told what it missed by. Spec and plan are in
`docs/superpowers/`.

Closed 2026-08-21: **the wedging cop**. `Cop.update` now calls `unwedge()`, the way `Player.update`
always has. It was a one-line fix as predicted, and the measurements bracket it: 0 of 12 synthetic wedge
sites were escapable before (every cop frozen at exactly 0px), 12 of 12 after; in the field, 19 of 60
dispatches were stuck before, 0 of 80 after. Pursuits that resolve rather than jam went from 27 of 60 to
44 of 60 — the cops now actually reach you.

Closed 2026-08-21, the HUD pass: **the TACO-NAV header** is gone and the panel shrank from 128×34 to
118×24, sized to the longest string it can ever hold (`MAKE A U-TURN`, `RETURN TO ROADWAY`) and guarded
in `— hud layout —`; **TACO BAG is now DELIVERIES**; **the title holds its badge alone for 3 seconds**
before the wordmark slams in with the collision rumble; and **the attract durations moved into
`content/attract.json`**, validated at build time like every other authored file.

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
- **A ticket now dominates a shift.** Post-cop-fix measurements: $23.61 / $0.00 / $7.27, differing
  almost entirely by how many tickets were paid (0 / 2 / 1). Before the fix, three shifts produced
  zero tickets between them. Any balance reasoning older than commit `26c03b4` was measured on a
  build where cops could not reach you, and should be re-measured before it is trusted.
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
