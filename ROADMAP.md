# Roadmap

Working list for **Taco Shop: Carnage Asada**. Small items first, then the neighbourhood pass.

Checkboxes render as a live task list on GitHub:
<https://github.com/Rapideo/carnage-asada-game/blob/master/ROADMAP.md>

---

## Punch list

Small items to clear before starting the neighbourhood work. Everything below is known and unclaimed —
add to it freely.

- [ ] **Canvas renders at 1× between ~768–900px window width.** The scale rule at `90_main.js:21` snaps to a
      crisp 1:1 below 2×, so on a narrow window the game sits small in the middle of a large black field.
      Deliberate and pre-existing, but far more noticeable now the page frame is gone. Fix is to let that
      band fit like every other size, at the cost of slightly uneven pixels.
- [ ] **Demo driver clips kerbs.** It recovers every time since the collision fix, but it visibly drives
      worse than a person and triggers `RETURN TO ROADWAY` more than it should. Path-following rather than
      steer-straight-at-the-target would fix it properly.
- [ ] **Attract timings may want tuning.** Currently title 30s / winners 15s / demo 90s
      (`ATTRACT_*` at the top of `80_game.js`). 90 seconds is a long watch; judge after a full cycle.
- [ ] **Default branch is `master`, not `main`.** GitHub took what the repo had. One command to change if
      it matters: `git branch -m master main && git push -u origin main`.

_Add playtest findings here._

---

## The neighbourhood pass

Goal: make the city read as the blocks around the real Taco Shop — commercial strip, residential, college —
rather than a uniform random grid.

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
through it will desync the minimap from the world.

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

### Recommendation

**Tiers 1 + 2 get roughly 80% of the recognition for 20% of the effort**, because a neighbourhood reads
from *what is on each block* and *what the streets are called* far more than from exact block dimensions.

### What's needed to start

An 8×8 zoning grid and the street names. Letters are enough:

```
        1st    2nd    3rd    4th   ...
Maple    R      C      C      P
Oak      R      S      C      C          S = the shop
Pine     R      R      U      U          U = college / campus
Birch    R      R      U      L          P = park   L = parking
...
```

### The invariant to design around

Any new block kind **must** test `City.keep` before marking a tile solid, or it can bury a delivery porch
and make an address unwinnable. `test/headless.mjs` asserts this ("no porch buried in geometry"), so a
violation fails the build rather than shipping — but it is the thing to design around from the start.
