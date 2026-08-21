# Hays, Kansas — the real neighbourhood

Design for replacing the procedurally-zoned random city with the eight blocks of downtown
Hays that surround the actual Taco Shop, and for the Union Pacific line that runs through it.

Status: approved in brainstorming, 2026-08-21. Supersedes ROADMAP.md "The neighbourhood pass"
tiers 1 and 2; tiers 3 and 4 remain not-recommended and out of scope.

---

## 1. What this is, and the one thing it is not

The city becomes a specific place: Elm Street to Milner Street, 4th Street to 12th Street, with
the Taco Shop at **333 W 8th St** where it really stands. Street names are real, and every block
carries the kind of buildings that block really carries.

It is **not** an art-direction change. The look is the late-80s 16-bit arcade style the game
already has, and that never moves. Every new block kind is assembled from the existing `Art`
primitives, the existing `PAL`, and the existing fake-wall-height `oy` trick. No new art rule,
no new colour, no photographic reference driving geometry. Accuracy lives in *what is on each
block* and *what the streets are called* — not in silhouette fidelity to satellite imagery.

## 2. The geography, and why it fits

Measured from OpenStreetMap way geometry for the downtown bounding box, fitted per street by
principal axis:

- Every named street (Main, Fort, Ash, Oak, Pine, Allen, Milner) runs at bearing **~28°**.
- Every numbered street (4th through 26th) runs at bearing **~118°**.

That is exactly 90° apart. Downtown Hays is a **perfect rectilinear grid, rotated 28°** to
follow the Union Pacific alignment. Rotating the map so Main Street points up maps real Hays onto
the engine's axis-aligned grid with zero distortion. This is the finding that makes the whole job
cheap: there is no diagonal, no curve, no five-way junction — nothing that would have forced the
ROADMAP's Tier 4 rewrite of the nav graph and the traffic rails.

Measured street spacing, in grid space, metres:

| axis | spacing |
|---|---|
| named streets (Fort→Main→Oak→Pine→Allen→Milner) | 146, 165, 155, 155, 155 |
| numbered streets (4th→8th) | 90, 110, 107, 103 |
| numbered streets (8th→12th, downtown core) | 64, 63, 68, 70 |

So real blocks are about 500 ft × 340 ft, and the downtown core blocks between 8th and 12th are
roughly half height.

**Decision: keep square blocks (`SPAN` = 12, unchanged).** Reproducing the 3:2 proportion needs a
per-axis pitch, which breaks all six modules that assume one uniform pitch, and a 6-tile-tall
block interior fits only two houses instead of four — dragging the address generator and porch
layout in with it. Rejected. The irregular per-axis position arrays of Tier 3 were rejected for
the same reason at higher cost. Recognition comes from names and contents; proportion is the part
nobody will miss.

There is an exact nine-street window per axis — precisely `BLOCKS + 1` — centred on the shop.

## 3. The map

Columns west → east, rows north → south. `bx` is the block column, `by` the block row.

```
            Elm   Walnut  Ash    Fort   MAIN   Oak    Pine   Allen  Milner
   12th ─────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┤
 by=0        │ res  │ res  │church│retail│retail│ com  │ res  │ res  │
   11th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=1        │ res  │ res  │ com  │retail│retail│ res  │ res  │ res  │
   10th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=2        ╞═════════════ UNION PACIFIC — rail ═══════════════════╡
    9th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=3        │ apts │ SHOP │ com  │retail│retail│ auto │ res  │ auto │
    8th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=4        │ res  │church│ res  │civic │civic │ com  │ com  │ auto │
    7th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=5        │ apts │ res  │ res  │civic │ apts │ res  │ res  │church│
    6th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=6        │ res  │ res  │ res  │ res  │ res  │ res  │ res  │ res  │
    5th ─────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
 by=7        │ res  │ res  │ res  │ res  │ park │ res  │ park │ res  │
    4th ─────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

What each cell is drawn from, in the real city:

- `[3,0]` `[4,0]` — Goodwin's Sporting Goods, Couture, the Masonic Lodge; Gella's Brewery, the
  Strand Event Center, Paisley Pear.
- `[3,1]` `[4,1]` — Kuhn's Diamond Jewelry, Coldwell Banker, the AT&T building; Hays Arts Center.
- `[2,1]` — Sip N Spin, Arcade 11, salons and small offices.
- `[1,3]` — **Taco Shop**, The Golden Q, Tiger Mart. The shop block.
- `[2,3]` — 9th Street Diner, 8th Street Liquor, Top Notch Cleaners, Sake2Me.
- `[3,3]` `[4,3]` — Lomato's Pizza, Diamond R Jewelry, Regal Audio; Daylight Donuts, the gym,
  Hays Community Theater.
- `[5,3]` `[7,3]` `[7,4]` — G&L Tire; Western Metal Co; World of Wheels Autoplex.
- `[3,4]` `[4,4]` — the Hays Post Office; Commerce Bank and the Ellis County Administration Office.
- `[3,5]` — Ellis County Historical Society, the Volga German Haus, the Stone Gallery.
- `[0,3]` `[0,5]` `[4,5]` — Kay Apts and Epsilon Mu; Sigma Chi; the Main–Oak apartment blocks.
- `[2,0]` `[1,4]` `[7,5]` — First Baptist, First United Methodist, Liberty Foursquare.
- `[4,7]` `[6,7]` — the 4th Street playground and Treat Playground.

## 4. The map is authored content, not code

A new `content/hays.json`, inlined by `build.mjs` into the generated `src/05_content.js` exactly
as `winners.json` already is. No runtime fetch: the artifact runs under a CSP that blocks external
hosts, and `fetch()` on a `file://` page is blocked by CORS, so a runtime load would blank the
screen. One code path, shared by the bundle and the dev page.

```json
{
  "streetsNS": ["ELM ST", "WALNUT ST", "ASH ST", "FORT ST", "MAIN ST",
                "OAK ST", "PINE ST", "ALLEN ST", "MILNER ST"],
  "streetsEW": ["12TH ST", "11TH ST", "10TH ST", "9TH ST", "8TH ST",
                "7TH ST", "6TH ST", "5TH ST", "4TH ST"],
  "shop":  { "bx": 1, "by": 3 },
  "zoning": [["res","res","church","retail","retail","com","res","res"],
              ... all eight rows, exactly as tabulated in §3 ...]
}
```

`streetsNS[bx]` is the street on the **west** edge of block column `bx`; `streetsEW[by]` is the
street on the **north** edge of block row `by`. Both arrays are one longer than `BLOCKS`, which is
what makes the nine-street window fit exactly.

**Note the axis swap.** Today `HSTREETS` holds tree names for the east-west streets and `VSTREETS`
holds numbered avenues for the north-south ones. Hays is the other way round: named streets run
north-south, numbered streets run east-west. The two arrays exchange roles.

`build.mjs` validation widens to cover the new file, and fails the build rather than shipping a
broken map:

1. every character in every name is drawable by the 5×7 font (the curly-quote guard, already there);
2. both street arrays are exactly `BLOCKS + 1` long;
3. `zoning` is exactly `BLOCKS × BLOCKS` and every code is a known kind;
4. exactly one cell is `shop`, and it agrees with `shop.bx`/`shop.by`;
5. the **worst-case generated address fits the order card**, computed at build time.

Guard 5 is the one that matters. Three text-overflow bugs have already shipped in the order card,
and the width limit was a comment before it was a guard the last time — *a note is not a guard.*

## 5. Addressing

Real Hays convention, which the block grid yields for free.

**Houses fronting a numbered (east-west) street** take a `W`/`E` prefix and a hundred-block from
their distance to Main:

| bx | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| block | 400 W | 300 W | 200 W | 100 W | 100 E | 200 E | 300 E | 400 E |

So a house on the south edge of `[1,3]` is `3xx W 8TH ST` — and the shop is **333 W 8TH ST**.

**Houses fronting a named (north-south) street** take their hundred-block from the numbered street
on the block's south edge: `hundred = number(streetsEW[by + 1]) × 100`. Block row `by=1` spans
10th to 11th, so a Main Street address there is `10xx MAIN ST`, the way Hays City Hall is 1507 Main
and the Ellis County Courthouse is 1204 Fort.

Odd and even sides are preserved as they are today, via the parity of the per-house offset.

**Width.** The longest address the generator can now produce is 14 characters (`1130 WALNUT ST`),
one more than today's 13 (`408 WALNUT ST`). At scale 1 that is 83px, and the restock line
`<addr> WAITING` reaches 131px against the order card's 135px of text room. It fits, with 4px to
spare — and guard 5 above makes that permanent rather than lucky.

## 6. Block kinds

`res`, `park`, `lot` and `shop` are unchanged. `com` stays for mixed office-and-bar blocks. Five
are new. Each is a `genX(rng, bx, by)` alongside `genResidential`, writing into the same statics /
solid / ground structures, and knowing nothing about any other kind.

| kind | what it builds |
|---|---|
| `retail` | Continuous storefronts hard against the sidewalk with shared party walls, awnings and parapets — the downtown read. Service alley and parking behind. |
| `civic` | One large formal massing, set back, in limestone tone (`PAL.wallLt`, which already is one — Hays is a limestone town). |
| `apts` | Two or three 2-storey masses with a street door. Scenery only; see §7. |
| `church` | Steeple silhouette assembled from the existing roof primitives. |
| `auto` | An apron of parked cars reusing the existing parked-car statics, plus a shed or warehouse mass. |

`rail` is the sixth new generator and is specified separately in §8.

`lot` stays a valid kind and the validator accepts it, but the Hays table does not use it: the
parking that genuinely exists downtown is absorbed into the `rail`, `retail` and `civic` programmes
as their back-of-block aprons.

**The invariant every one of them must respect:** test `City.keep` before marking a tile solid.
`City.keep` masks every porch and its walkway to the kerb, and a generator that ignores it can bury
a delivery target and make an address unwinnable. `test/headless.mjs` asserts this — "no porch
buried in geometry" — so a violation fails the build rather than shipping.

## 7. Deliveries stay on residential blocks

Only `res` blocks generate addressable houses. `apts` blocks are scenery; downtown blocks receive
no orders.

**This is a deliberate, accepted cost.** A faithful map spends eight of its blocks on downtown and
one whole row on the railway, so orders concentrate south of the tracks and along the edges, and
the tightest driving in the game — the Fort/Main retail spine — carries traffic and hazard but no
delivery targets. The alternative considered and rejected was giving `retail` and `apts` blocks a
street door for the apartment above the shop, which is what downtown Hays storefronts actually
have; it was rejected to avoid a second address path on this branch. It remains the obvious first
follow-up if the order distribution plays badly.

## 8. The Union Pacific

The corridor occupies block row `by=2`, running the full 1632px width and crossing all nine
north-south streets.

**Ground.** Ballast and rails bake into `City.ground` once at generation. They never change, so
they cost nothing per frame — the same single-blit path as every other ground tile. Crossing planks
bake where the roads cross.

**Solidity.** The corridor is solid along its whole length **except at the nine crossings**. That
is what makes the tracks a real barrier: you cross where Hays lets you cross. This adds roughly
1600px of new solid edge — the largest single collision surface in the game — which is why §10
re-runs the wedge sweep against it.

**The train** is a rail-bound entity in the mould of `Traffic`: fixed y, constant speed, no
steering, no interpolation. A locomotive and about six boxcars, so it takes a couple of seconds to
clear a point and about six to cross the map. `G.trainT` schedules one every 22–40s with random
direction, in `play` **and** `demo`, so the attract loop shows it off.

**Crossings.** Each watches the train's distance, lowers its gates over ~0.7s with flashing lights
and a two-tone bell from `Audio5`, and raises them shortly after the tail passes. **The gates are
drawn, not solid.** You can always run them. Running a closed crossing and surviving adds heat,
because the cops saw you do it.

**A hit is a wreck:** hitstop, hard shake, a long spin, both bags splatted across the ballast via
the existing `Fx.splat`, `G.bag = 0` (whatever you were carrying, up to `BAG_MAX`) so
`needPickup` sends you back to the shop, and `HIT BY TRAIN`
on the banner (12 characters — well inside the box). No fine. Time and load only.

**The wreck must throw the player clear of the corridor.** A wreck that leaves the car on the rails
is a repeat-hit loop, which is the same class of defect as the collision wedge: not merely awkward,
but unescapable by any input. This is the single most important line of code in the feature.

**The cruiser is not exempt.** Beat the train across and the pursuit eats it — the cop despawns and
heat resets. That turns the tracks from an obstacle into a tactic and gives the player a genuine
high-risk escape. A wrecked cop must not be able to respawn mid-train.

**Two touches outside the new code**, both to stop the world looking stupid rather than to add
mechanics: traffic cars brake at a closed crossing instead of driving into a train, and
`Demo.drive()` learns to wait at one.

## 9. Files touched

| file | change |
|---|---|
| `content/hays.json` | new — streets, zoning, shop cell |
| `build.mjs` | inline the new file; five new validation guards |
| `src/30_art.js` | track, ballast, gate, signal, locomotive, boxcar; art for five new block kinds |
| `src/40_city.js` | table-driven zoning; real street arrays and addressing; five new `genX`; `genRail` |
| `src/50_entities.js` | `Train`; traffic braking at closed crossings |
| `src/80_game.js` | train schedule, crossing state, wreck handling, heat for running a crossing |
| `src/75_demo.js` | wait at a closed crossing |
| `test/headless.mjs` | new `— rail —` section; widened hud/collision/attract assertions |

`src/00_core.js` is **not** touched. `classify()` is untouched, so the minimap cannot desync from
the world — the failure mode the ROADMAP warns about. `60_nav.js` and `70_hud.js` are untouched
because the street grid itself does not move.

## 10. Testing

A new `— rail —` section in `test/headless.mjs`:

1. all nine crossings are drivable with the gates up;
2. the corridor is solid everywhere else along its length;
3. a train traverses the full map and despawns; gates lower and raise; none stays stuck closed;
4. **a player parked on the rails is wrecked and ends up clear of the corridor** — the softlock guard;
5. a wrecked cop does not respawn under the train.

Widened elsewhere:

- `— hud layout —`: the longest *real* address and its restock line, and the `HIT BY TRAIN` banner.
- `— collision —`: the wedge sweep re-run against the new ballast edge and all five new kinds.
- porch burial: the existing assertion, now exercised against six new generators.
- `— attract —`: the longest-stall bound widened for a legitimate wait at a closed crossing. Note
  the existing lesson here — net displacement is the wrong measure; total path length plus a
  longest-stall bound is what captures "never wedges".

New sections must reset the input state they rely on rather than assume a clean slate: the sections
share one mutable game and one `Input`, and run in order.

## 11. Risks

1. **The ballast is the largest new solid surface in the game.** Mitigated by the wedge sweep, but
   it is the most likely source of a new softlock.
2. **The demo now drives through a live hazard.** The attract assertions may flake until the
   crossing wait is tuned. A flake is a bug in the harness, not noise to live with.
3. **Order distribution shifts south** (§7). Accepted; revisit if it plays badly.
4. **Address width** is 4px from the card edge. Guarded at build time.

## 12. Out of scope

Tier 3 irregular block spacing. Tier 4 true geometry. Deliverable downtown addresses. Seasonal
hazards, NPC barks, the high-score table, and everything else on the punch list. Big Creek and the
Fort Hays State campus, both of which sit outside the nine-street window.
