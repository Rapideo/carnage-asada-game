# Resume: the demo path-following driver

Branch `demo-path-following`. Written 2026-08-22, mid-task, to pick this up cold.
Delete this file when the branch merges.

## State

Done and green. `node test/headless.mjs` passes **174** assertions (was 171); `node build.mjs`
succeeds and `taco-shop.html` is rebuilt. The measured before/after table is in `ROADMAP.md` under
the punch-list entry — every number there is from the headless harness.

## The one thing not done

**Nobody has watched it.** Every claim on this branch is a statistic. The attract loop's entire job
is to be looked at, and this repo has twice shipped defects that were correct by every assertion and
wrong on screen — the clipped banner, and the invisible north-facing store porch. Both were found by
rendering a frame and looking at it.

So before merging: run `node serve.mjs`, open <http://localhost:8123>, wait out the 45s of title and
winners card, and watch a full 90s demo. Specifically —

- does it look like a driver, or like a machine on rails? It is now lane-perfect, 6.4px off centre.
  If that reads as robotic rather than competent, **the pursuit lookahead is the dial**: `rem` in
  `Demo.aim`, currently `18 + p.speed * 0.20`. Longer wanders more.
- does it brake convincingly for corners? The governor coasts under 64px and brakes under 30px,
  targeting ~70. Derived, not chosen: turn radius is `v / (TURNRATE * (1 - 0.28 * v / MAXSPD))`,
  ~37px at speed 100 but ~24px at 70, and a **right** turn against a 32px carriageway only stays on
  the tarmac below about 70. Left turns have room to spare.
- watch what happens when it does leave the road. It should turn perpendicular to the nearest
  carriageway and rejoin, not strike out diagonally.

## What is still wrong

**It gets stuck more than the old driver did, even though it leaves the road less.** Hard wedge
resets went 2 -> 6 per 20 minutes. Frames slow-under-power went 4.4% -> 12.4%, and **74% of those
are off the carriageway with two thirds genuinely blocked** by `carBlocked`. The old driver left the
road *more* (22.2% vs 14.2% out on the open road) but its excursions were shallow drifts near kerbs
and porches, which are `keep`-reserved and therefore prop-free. This one leaves at corners, where
block interiors are full of furniture, so each excursion goes deeper.

Aiming recovery at the nearest **carriageway** rather than the nearest **junction** was worth most
of it — that single change took off-tarmac from ~30% to 23.1%. What is left is the tail. If it needs
more, the two candidates, neither investigated:

1. The obstacle probe only tests `City.isSolid`, which is baked static geometry. It cannot see
   traffic cars at all. Ruled out as the *wedging* cause — traffic-ahead frames are 8.5% new against
   7.7% old, unchanged — but it is still a real gap.
2. `Demo`'s own wedge escape needs `p.speed < 20` to accumulate `wedgeT`, and a car grinding along a
   wall at 21-29 never trips it, so the 2.5s hard reset never fires. Traced one 8.8s excursion that
   was exactly this. Note this is **pre-existing**, not introduced here.

## Blind alleys, so they are not re-run

- **Kerbside furniture.** Lane centres at +8/+24 are `0.00%` blocked across 5760 samples per offset,
  identical to the crown of the road. Driving a proper lane is not more dangerous than hugging the
  middle.
- **Sharing a lane with traffic.** See above; unchanged between builds.
- **The corner governor causing the slowness.** Disabling it leaves off-tarmac flat and drops
  deliveries from ~15 to 9. It is earning its place.
- **Lookahead sweeps.** 18/26/34/44 px base, all within run-to-run noise (+-4 points on the same
  build). Do not tune this metric on 3x180s samples; use 4x300s paired against a baseline, which is
  what the table in `ROADMAP.md` is.

## Where the measuring rigs are

Throwaway, in the session scratchpad, not the repo:
`%LOCALAPPDATA%\Temp\claude\C--Users-matts-Desktop-Taco-Shop---Carnage-Asada\7ee5a89c-2437-499b-a678-e46ce5a5021b\scratchpad\`
— `bench.mjs` (the main one; `node bench.mjs <secs> <runs>`), `trace.mjs` (frame-by-frame around the
worst excursion — the single most useful one), `shopsplit.mjs`, `slow.mjs`, `clearance.mjs`,
`pathcheck.mjs`, `xsection.mjs`. They all bootstrap the sandbox the way `test/headless.mjs` does.
If the scratchpad is gone they are cheap to rewrite; the harness header is the only fiddly part.

To compare against master: `git show master:src/75_demo.js > src/75_demo.js`, run, then restore.

## The design, in one paragraph

`Nav.route` is a list of intersection centres. `Demo.buildPath` turns it into a polyline of **lane**
centres via `Traffic.laneFixed` — the same right-hand-traffic rule the traffic itself obeys — whose
vertices are the crossings of consecutive legs' centrelines, which is the corner to drive round.
Left and right turns fall out with no special case. `Demo.aim` retires a vertex once the car is past
it **measured along the leg it leads into**, projects the car sideways onto its lane, and pursues a
point a short way along the polyline. The head node is deliberately absent from the polyline —
corners come from leg *pairs*, so the first one is the next junction ahead — except for a synthetic
head corner covering a route that turns at the node the car is already on.

**The single most important line** is the retirement test in `Demo.aim`. Retiring on "is the target
behind my nose" is the obvious implementation and it is catastrophically wrong: the corner you are
about to turn onto sits square to your heading, so a nose test throws away the very waypoint you
were braking for, and the path collapses to the delivery kerb — which can be most of the map away
and diagonal. That is recorded as a comment there, and `test/headless.mjs` says in a comment why it
deliberately does **not** assert the nose test.
