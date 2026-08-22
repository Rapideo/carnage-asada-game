# Build Journal — Hot Slice

Sunday One-Shot Challenge, 16 Aug 2026. Written so the reasoning survives the code.

---

## 1. The original prompt

> I have a Sunday One-Shot Challenge for you. You Up for it?

> Create for me a 16-bit style top-down pizza delivery game based loosely on the mechanics of APB and
> Paperboy. The longer the delivery takes, the smaller the top (which counts down) - and a rudimentary
> guidance system guides you towards the correct delivery location.

Two follow-ups during the build: *"chrome should be accessible now"* and *"And this is 100 pure javascript?
no frameworks. no libraries?"*

("the smaller the top" was read as **tip** — the decaying-gratuity mechanic. That reading drove the whole
scoring design, and it was the right one.)

### What the prompt gave me, and what it didn't

The prompt was unusually efficient. Five things were pinned down in two sentences:

| Given | What it decided |
|---|---|
| "16-bit style" | Resolution, palette discipline, sprite technique, chiptune audio |
| "top-down" | Entire rendering architecture — tilemap, y-sorting, fake-height sprites |
| "APB and Paperboy" | Two mechanical vocabularies: arcade driving + police heat, and throw-at-porch |
| "the longer it takes, the smaller the tip" | The scoring loop **and** the HUD hierarchy |
| "rudimentary guidance system" | A named system to build — and `rudimentary` as a *character note* |

Deliberately unspecified, so I chose: session length, fail states, input scheme, how the throw works,
world size, whether the city is authored or procedural, and the platform.

That ratio — tight on feel, loose on implementation — is what made a one-shot possible. See
`GAME-SPEC-GUIDE.md` for how to hit it again on purpose.

---

## 2. Constraints I was working under

- **One shot.** The user framed it as a challenge, so no brainstorming round-trip. I stated the design read
  up front and started executing.
- **Background job, empty directory.** No existing code, no repo.
- **No browser at the start.** The Chrome extension only connected partway through, which turned out to
  shape the engineering more than anything else (see §4).

---

## 3. Design decisions and why

### Single-file vanilla JS on a canvas

Rejected: a Next.js app, a game framework, a bundler. Reasons: the deliverable a person can actually *use*
on a Sunday is a file they double-click; a published artifact runs under a CSP that blocks every external
host, so any CDN dependency would have silently died; and a build chain is a failure mode I'd have to debug
instead of the game. Zero dependencies made "it works everywhere" the default rather than a goal.

The cost is a hand-rolled build: `src/*.js` are plain scripts concatenated in filename order. The numeric
prefixes *are* the dependency graph. It's crude, and it's the right amount of machinery for this size.

### 384×216 internal resolution

Genesis-era games ran 320×224. 384×216 is the same density but 16:9, so it integer-scales to 1920×1080
exactly at 5× and gives ~24×13 tiles of visible city — enough to read a street and the next intersection.
Everything draws in these units; CSS does the scaling. (The scale rule was later relaxed above 2× because
integer-only scaling threw away a third of the picture on common laptop sizes.)

### The tip is the biggest thing on screen

This was the user's headline mechanic, so it got the loudest treatment: a scale-2 amber number with a
draining bar that shifts amber → orange → red, and a subtle pop each time it ticks down a notch. If a
player can't feel the money bleeding out while they're stuck behind a bus, the mechanic doesn't exist.
$15.00 → $2.00 floor at 55¢/sec ≈ 24 seconds, which is roughly one over-cautious delivery.

### Mouse aim for the throw

I went back and forth here, and the alternatives are worth recording because they're the obvious ones:

- *Throw along car heading* — you drive parallel to houses, so the target is always to your side. Bad.
- *Dedicated left/right toss keys (true Paperboy)* — authentic but fiddly with analogue-ish driving.
- *Hold-to-charge power* — fights the throttle; you can't charge and drive well at once.
- *Full auto-aim* — removes the skill entirely.

**Chosen:** point at the landing spot with the mouse, click to throw. The engine solves the ballistic arc
backwards from a fixed 0.5s flight time, so the pizza lands where the reticle is — *except* that spread
scales with car speed. That inverts the skill from "estimate a parabola" (unfun) to "decide whether to slow
down" (a real, readable decision that ties the aiming back into the driving). A dotted arc preview and a
green lock-on box make the whole thing legible at a glance.

### The guidance system is a character, not a feature

"Rudimentary" was the most useful word in the prompt. Instead of building a weak nav and apologising for it,
I built the **SLICE-NAV 2000**: a green-LCD unit with scanlines that gives turn-by-turn directions and
drops into a flickering `RECALCULATING / RETURN TO ROADWAY` the moment you cut across a lawn. The limitation
became the joke.

Underneath it's more serious than it looks: Dijkstra over **(intersection, arrival direction)** states
rather than plain nodes, so turning can be penalised (straight 0, turn +0.45, U-turn +1.8). That's why
routes prefer long straights and read like directions a human would give. A plain BFS produces
technically-shortest paths that zigzag and feel broken.

I also reserved **cyan for guidance only**. Amber is money, red is the player and danger, cyan is the
machine talking. Semantic colour means you can read the HUD in peripheral vision.

### Bag of 3, and throwing spends a slot immediately

The single best systemic decision. Because a *miss* costs a pizza and not just points, a bad throw can
strand you mid-order with a live, still-decaying tip and force a run back to the shop. That one rule
creates the return-to-base loop, gives the nav a second job, and makes the accuracy/speed tradeoff carry
real stakes — all without a separate mechanic.

### Heat and the cop = the APB half

Paperboy gives the throw; APB gives the pressure. Clipping pedestrians or driving on pavements fills a heat
meter; at full a siren spawns and hunts you for a $15 ticket. It punishes the exact reckless line the tip
timer is tempting you into. The two systems are designed to pull against each other — that tension *is* the
game.

### Fake-height sprites and one baked ground canvas

Buildings draw as a roof plus a south-facing wall strip (`oy` in the static record), offset up from their
ground footprint, with baked drop shadows. That's the trick that makes flat top-down read as 16-bit rather
than as a spreadsheet.

The entire 1632×1632 world ground — tiles, road markings, porch pads, driveways, static shadows — is baked
into **one canvas at boot** and blitted per frame with a single source-rect `drawImage`. City generation
costs ~150ms once; the per-frame cost is one draw call. Skid marks and pizza splats paint permanently into
that same canvas, which is why the streets accumulate evidence of your shift.

### Procedural everything

No image files, no font files, no audio files. The 5×7 bitmap font is a hand-authored glyph table; sprites
are `fillRect` calls baked into offscreen canvases (car rotations pre-rendered to 32 frames each); audio is
WebAudio oscillators including the 4-bar chip loop. This wasn't purity for its own sake — it's what makes
the whole game one 124 KB file with no loading state and no CSP problems.

---

## 4. The thing that actually made a one-shot work

**I wrote a headless test harness before I could see the game.**

`test/headless.mjs` runs the real modules inside a `node:vm` sandbox against a Proxy-based stub 2D context —
every drawing call becomes a no-op, but all the logic executes. It boots the city, solves 250 routes,
fuzzes 9,000 frames of driving, and drives a full delivery.

This caught things a screenshot never could:

- **8 delivery porches were buried under street trees** — those addresses would have been literally
  impossible to complete, and it would have looked fine in every screenshot. Fixed with a `City.keep`
  keep-clear mask that prop placement must respect; the invariant is now an assertion.
- Address collisions, non-contiguous routes, NaN drift in the physics, cars escaping the world.

The lesson generalises: **for a generative system, assert the invariants that make the game winnable.**
Visual inspection samples one frame out of a space you can't enumerate.

### Other bugs worth remembering

- **Top-level `const` doesn't land on a `vm` sandbox global.** Lexical declarations live in the script's
  scope, not on `globalThis`. The harness appends an explicit `globalThis.__x = {...}` line to hand bindings
  out. Cost me the first test run.
- **Chrome pauses `requestAnimationFrame` in a hidden tab.** I spent a couple of cycles convinced the boot
  had thrown before checking `document.visibilityState`. Fixed properly by adding a `window.HotSlice.step(n)`
  bridge to drive frames manually, plus a `visibilitychange` handler so returning to the tab doesn't
  fast-forward the shift.
- **The minimap sampled every other tile** and dropped whole streets, because roads are 2 tiles wide and one
  map pixel covers ~2 tiles. Fixed by taking the most important class in each pixel's footprint rather than
  a point sample.
- The wordmark overlapped itself at scale 6; the turn-arrow glyphs were malformed on first write. Both only
  visible once rendered — which is the honest counterpart to the lesson above: **tests catch invariants,
  eyes catch composition.** You need both.

---

## 5. How to do this again

The order matters more than any individual step.

1. **State the design read before writing code.** Palette, resolution, typography, one reserved semantic
   colour. Two minutes of commitment prevents a generic result.
2. **Pick the delivery target first.** "One self-contained HTML file" determined the architecture,
   the dependency policy, and the audio approach. Decide this before anything else.
3. **Lock the internal resolution and the palette.** Everything downstream inherits them.
4. **Build in dependency order, art first.** `core → font → audio → art → city → entities → nav → hud →
   game → main`. Art before gameplay means you can *see* what you're debugging from the first run.
5. **Write the headless harness as soon as there's a world to assert on.** Not at the end. It is what makes
   it safe to keep building without looking.
6. **Assert winnability, not just absence of crashes.** Every generated objective must be reachable.
7. **Verify in a browser last, and verify the bundle specifically** — modules that never collide in dev
   share one scope once concatenated.
8. **Tune by feel, then say which numbers are guesses.** `SHIFT_START` and `TIME_PER_JOB` at the top of
   `80_game.js` were never playtested by a human; they're flagged as the two dials.

### Reusable skeleton

The structure here is genre-agnostic. For a different top-down arcade game, what survives unchanged is:
`00_core` (constants/RNG/input), `10_font`, `20_audio`, `30_art` (the bake-at-boot pattern),
the y-sorted render pass with bucket culling, the fixed-step loop in `90_main`, and `test/headless.mjs`.
What you replace is `40_city`, `50_entities`, `60_nav`, `70_hud`, and the state machine in `80_game`.

---

## 6. Final state of the original build

Numbers as they stood at the end of the one-shot session. See §7 and §8 for what changed after.

- **164** addressed houses, ~1,000 static props, 8×8 city blocks, deterministic from a seed (`?seed=`).
- **3,070** lines of vanilla JS, 10 modules, **zero** dependencies, 124 KB shipped.
- Headless suite: 30 assertions passing. Bundle verified in-browser, no console errors.
- Playable: https://claude.ai/code/artifact/b818a61d-e6b2-4d3e-bf72-48c8295deeb8

---

## 7. Rebrand — Taco Shop: Carnage Asada

Everything above is the record of the original build and is left as written. Later, the game was rebranded
from pizza to tacos: `Hot Slice` → **`Taco Shop: Carnage Asada`**, the thrown pizza box became a brown paper
bag, and the title screen was rebuilt around a real taqueria's badge logo the user supplied as reference.

No mechanic, constant, or system changed. The tip decay, the bag-of-3 rule, the throw scheme, the nav
penalties, the city generator, and the render pipeline are all untouched — this was art, strings, and names.

Three things worth recording:

- **The reference image does not ship.** The badge is hand-authored in `Art.mkBadge()` and baked at boot like
  every other sprite. Embedding the supplied `.webp` would have been faster and would have broken the single
  property the whole build is designed around. The 5×7 font has no lowercase and no script face, so the
  logo's cursive "Est. 1970" is rendered blocky — the badge is a 16-bit *reading* of the logo, not a trace.
- **`textOut()` does not scale.** It offsets its outline by the glyph scale, so at scale 4 the eight offset
  copies merge into a solid black slab and the jade face vanished behind the wordmark. Fixed with
  `keyline()`, which takes outline width as a separate argument. This was invisible to the test suite and
  obvious in the first screenshot — the same "tests catch invariants, eyes catch composition" split as §4.
- **The brand colours are deliberately quarantined.** Jade reads close to the guidance cyan, so it is barred
  from the HUD and confined to the badge and the shop's signage. The semantic reservation from §3 —
  amber money, red danger, cyan machine — survives the rebrand intact.

`SLICE-NAV 2000` became `TACO-NAV 2000`, which is the one piece of the original character that the rename
touched. The joke structure is unchanged: it is still a rudimentary unit that falls apart into
`RECALCULATING / RETURN TO ROADWAY` the moment you cut across a lawn.

---

## 8. HUD repairs and the title screen

A pass of small fixes and a title-screen rebuild. Worth recording because of what the bugs had in common.

### Three text-overflow bugs, all in one card

The order card had shipped with the tip readout clipped: `money(o.tip)` draws at scale 2 from y=23,
occupying y23–36, and the decay bar's background was painted *after* it at y34–38. The bottom 3px of every
digit was overwritten, so `$14.87` rendered as `$14_87`. The card was 37px tall and its contents needed 38.
Fixed by taking it to 44 — which also squared it up with the clock card opposite, already 44.

Then the empty-bag lines: `OUT OF TACOS - RESTOCK AT` and `TACO SHOP (<addr> WAITING)` measured 149px and
203px in a card whose text column is 131px. And a banner, `OUT OF TACOS - BACK TO THE SHOP`, made a 386px
box on a 384px screen — that one was self-inflicted during the rebrand, where the original
`BAG EMPTY - BACK TO THE SHOP` had fit at 350px.

**Three of the same bug is a missing assertion, not bad luck.** `test/headless.mjs` now has a
`— hud layout —` section asserting the longest *generated* address fits, that both restock lines fit, and
that every banner box fits the screen. The drawing stubs make overflow structurally invisible, so no
existing assertion could ever have caught these.

Two things that generalise beyond this repo:

- **The first version of that guard was wrong.** It compared an absolute x against a width and failed a
  string that was genuinely fine. Worth confirming a new guard *rejects the buggy input* before trusting
  it — a test that cannot fail is not worth having.
- **Layout bugs can be measured, not eyeballed.** With the browser extension down, the fix was verified by
  recording every `fillRect` the HUD issues and replaying it into a pixel grid printed as ASCII. That is
  exact about overlap in a way a screenshot is not, and it needs no browser. It is blind to anything
  outside the canvas, so it complements eyes rather than replacing them.

### Pixel type does not scale continuously

The title lost its page frame — no header, footer or bezel, the canvas is the whole product — and gained a
badge and a sprayed `CARNAGE ASADA`. Removing the frame removed the key legend with it, so the controls
moved into the pause overlay. That is now the only place they are written down.

The recurring lesson was about **type sizing**, and it took three goes to state properly:

1. Spraying the 5×7 game font produced "the game font wearing drips" — every stroke is one cell wide, so
   there is no letterform to read. Fixed by hand-authoring a separate graffiti alphabet (`GRAF`).
2. "40% smaller" and "20% smaller" are not available from `scale`. Cells are drawn as `s×s` rects, so only
   whole numbers stay crisp; the steps are 100% and 50%.
3. **To resize pixel type by an arbitrary percentage, change the glyph grid, not the scale.** Moving `GRAF`
   from 9×11 to 7×9 gave an advance ratio of exactly 0.8 — a true −20% with every pixel still square.

And a fourth option that solved the last request outright: when small text looks wrong, check whether the
problem is *weight* rather than size. `PRESS ENTER` at scale 1 read thin and lost; `textOut()` at scale 1
thickens the strokes to ~3px with an ink halo and reads as a deliberate prompt at the same footprint.

Two spray details worth keeping, both found on screen and invisible to the tests: mist must be **darker**
than the core (thin paint over a dark ground reads dark, and lighter mist washed the letters out), and the
mist radius must stay near 1.25 cells or the halo floods the letter counters. Drips were later removed
entirely at the user's request, but while they existed the rule was that a run may only start at the lowest
lit cell in its column — "nothing directly below" also matches the crossbar of A and the waist of S, and
those runs poured straight down through the strokes beneath.

### One face for both

The graffiti alphabet did not survive. The badge was drawing its wordmark from the 5×7 game font at 4×
and the title from the angular `GRAF` face — two unrelated sources, which is exactly why the screen never
felt like one design. Both now draw from `LOGO`, a single hand-authored 7×9 display face in the style of
the shop's sticker: fat 2-cell strokes, clipped corners, 12 characters. `GRAF` and `mkSprayText` were
deleted rather than left lying around.

The grid size fell out of a constraint rather than taste, and it is worth writing down because it is the
sort of thing that looks arbitrary later. The badge wanted ~92px for four characters; the title wanted
206px for thirteen. Those imply different per-character widths, and integer scaling only offers 1× and 2×,
so most grids can serve one or the other but not both. 7×9 happens to serve both exactly: scale 3 gives
93px for `TACO`, scale 2 gives 206px for `CARNAGE ASADA`. Changing `LOGO_W`/`LOGO_H` breaks both at once.

The title also dropped its spray treatment entirely and went gold with a black keyline, matching the badge.
The screen reads as one branded lockup now rather than a clean logo above a rough tag — a deliberate trade
of contrast for coherence.

### Process note (title screen work)

`taco-shop.html` is generated and nothing rebuilds it automatically. The tests read `src/` directly, so a
green suite says nothing about the artifact. One fix was reported as done while the shipped file still had
the old layout, because `node build.mjs` had not been re-run. **Rebuild before asking anyone to look.**

---

## 9. Attract mode, and the bug it exposed

Added a cabinet-style rotation — title 30s, a "winners don't use drugs" card 15s, a 90-second self-playing
demo — which turned out to be worth far more than the feature itself.

The first pass at the anti-drug card invented an in-world Hays P.D. version, because no reference image had
been supplied and inventing one seemed safer than approximating a real agency's seal from memory. The user
then supplied the reference and asked for a faithful recreation, which is what shipped. Worth recording as
a process note rather than a design one: **a placeholder built to avoid a decision is still a placeholder.**
Asking for the reference up front would have saved building the screen twice.

The seal is rasterised per pixel rather than assembled from rects — the scalloped starburst and the
lettering ring are both functions of angle. At 100px the ring lettering is far below legibility, so it is
tick marks: the eye reads "text around a seal" from the rhythm, which is the honest way to render type too
small to draw. Pretending otherwise produces mush, as the first spray wordmark did.

### Copy belongs in data, not in draw calls

The card's text moved to `content/winners.json`. The interesting part is the constraint: a JSON file
*fetched at runtime* cannot work here at all. The artifact runs under a CSP that blocks external requests,
and `fetch()` on a `file://` page is blocked by CORS — so the obvious implementation would blank the screen
in precisely the two situations that matter, published and double-clicked. `build.mjs` inlines it instead,
emitting a generated `src/05_content.js` that the bundle and the dev page both pick up, so there is no
second code path to drift.

The build **fails** on any character the 5×7 font cannot draw, naming the offenders. That guard exists
because the realistic failure is not exotic: paste a line out of a document and the apostrophe is curly,
which the font has no glyph for, and the screen ships with a silent gap. All three paths were checked —
an edit reaching the artifact, a curly quote aborting the build, a missing field aborting the build —
because a validation nobody has seen fail is not known to work.

### The demo found a real control bug

The demo driver kept getting wedged against scenery. The obvious reading was that the AI was bad, and the
first two rounds of work went into the AI — a speed floor so it could steer, kerb targets instead of porch
targets, `classify()` instead of `surfaceAt()` for street tests. All were genuine bugs. None was the
important one.

The user then mentioned they had hit the same thing playing by hand. Testing that properly:

> **0 of 37 wedge sites were escapable by any input.** Not hard. Impossible.

`carBlocked()` is evaluated at the *destination*. Once a car body overlaps geometry, every nearby
destination overlaps too — including the ones that would free it — so both axis moves are rejected and
speed is zeroed every frame. Steering is gated on speed. The car therefore cannot drive out, cannot turn
out, and cannot rock out. Forward, reverse and wiggling all fail.

Getting *into* that state was easy, because the traffic separation push moved the player 2px per frame
with no collision test at all: any car nudging you against a building shoved you inside it.

Two fixes. `unwedge()` depenetrates — if the body is overlapping, nudge toward the first direction with
clear space, widening the probe radius so deep corners are not abandoned. And the traffic push now tests
`carBlocked` per axis before moving the player. Result: **37 of 37 escapable**, average 3.1s of rocking.

The lesson is not "write a depenetration step". It is that **an autonomous agent is an excellent fuzzer for
the systems a human tests politely.** The demo driver hammered geometry thousands of times per run and
surfaced, in minutes, a permanent-softlock that a person hits occasionally and works around by restarting.
It is the same argument as §4 — assert the invariants that make the game winnable — arrived at from the
other direction.

### Assertions about autonomous behaviour need care

The first guard for "the demo actually drives" measured net displacement over 85 seconds. It failed on
working code: the demo takes orders all over the map and can legitimately end up near where it started.
Replaced with total path length plus a bound on the *longest stall*, which is the property that actually
matters — and which the wedge fix is what guarantees.

---

## 10. The city becomes Hays

The brief was to make the playing grid as accurate as possible to the real neighbourhood around the shop:
real street names, and the real kind of building on each block. Explicitly **not** a change of art direction —
the late-80s 16-bit look is settled, and accuracy here means *data*, not new drawing vocabulary.

### The survey did the hard part

I expected the street layout to be the expensive half. `ROADMAP.md` warned that a uniform block pitch is
assumed by six modules, and that anything genuinely irregular is a from-scratch city module.

Measuring OpenStreetMap way geometry and fitting each street to its principal axis settled it in one pass:

- every named street (Main, Fort, Ash, Oak, Pine, Allen, Milner) runs at bearing **~28°**
- every numbered street (4th through 26th) runs at bearing **~118°**

Exactly 90° apart. Downtown Hays is a **perfect rectilinear grid, rotated 28°** to follow the Union Pacific
alignment. Rotate the map so Main Street points up and the real town lands on the engine's axis-aligned grid
with no distortion at all. No diagonals, no curves, no five-way junctions — none of the geometry that would
have forced the rewrite.

Better still, there is an **exact nine-street window per axis — precisely `BLOCKS + 1`** — centred on the
shop: Elm to Milner, 4th to 12th. The 8×8 grid did not have to change to hold a real place.

### What was rejected

**Real block proportions.** Hays blocks are about 500ft × 340ft, and the downtown core blocks between 8th and
12th are roughly half height. Reproducing that needs a per-axis pitch, which breaks all six modules *and*
leaves a 6-tile block interior that fits two houses instead of four — dragging the address generator and the
porch layout in with it. Rejected. Recognition comes from names and contents; nobody misses the proportion.

**Deliverable downtown addresses.** Only `res` blocks generate houses, so a faithful map — eight blocks of
downtown, one whole row of railway — concentrates orders south of the tracks and along the edges. Accepted
knowingly. The fix, if it plays badly, is a street door for the apartment above the shop, which is what those
storefronts really have.

### The map is content, not code

`content/hays.json` holds two street arrays, the shop cell and the 8×8 zoning table; `build.mjs` inlines it as
`HAYS` exactly as `winners.json` becomes `CONTENT`. That was not tidiness. It is what makes a **second time
period** another file against the same schema rather than another pass through `40_city.js` — the game is
built for one period now and wants eras later, so nothing hard-codes a year.

Six guards were added and, more importantly, **each was verified to fire** by mutating the file and watching
the build die: array length, font charset, unknown block kind, exactly one shop cell, shop agreeing with the
table, and the worst-case generated address fitting the order card.

That last one is the descendant of §8's text-overflow bugs, and it is deliberately at *build* time rather than
in the test suite. The suite only ever sees one seed — it reported the longest address as `407 W 12TH ST`
(77px), comfortable. The build computes the true worst case across the whole authored table, `1129 WALNUT ST`,
whose restock line lands at 131px against a 135px card. Four pixels of headroom that no test run would have
found. **A guard that samples is not a guard.**

### Addressing came out for free

Numbered streets take a W/E prefix and a hundred-block from the distance to Main; named streets take theirs
from the numbered street on the block's south edge — which is why City Hall is 1507 Main and the courthouse is
1204 Fort. Parity of the house offset keeps the two sides of a street on opposite odd/even runs, so the two
blocks that share a street cannot collide, and all 132 addresses stay unique with no extra bookkeeping.

### `classify()` was never touched

The whole design routes around it. The street grid does not move, so the minimap cannot desync from the
world — the specific failure `ROADMAP.md` warns about. Confirmed by eye as well as by assertion: the minimap
shows the shop marker at column 1, row 3, which is where the table puts it.

### Two mistakes worth recording

**Context leaked in from a neighbouring project.** A design question was built on a decades-spanning timeline
with four named eras — none of which appears anywhere in this repo. It came from Claude's path-keyed project
memory, written by a different codebase that previously occupied this folder. The tell was available and
missed: that memory described `npm start` and a `package.json`, in a project that has neither. `CLAUDE.md`
now carries a Scope section, and the rule it states is the useful part — **when outside context contradicts
the tree, the tree wins, and the contradiction is a reason to stop and ask.**

**`delete G.update` is not "restore it afterwards."** `CLAUDE.md` says to swap `G.update` for a no-op to hold
a frame and restore it after. `G` is a plain object literal, so `delete` removed the method outright rather
than revealing one on a prototype, and the page needed a reload. Keep the reference and reassign it.

---

## 11. Six block kinds, and what the tests could not see

Plan 1 made the map Hays by name and by zoning, but every new kind rendered through
an existing generator via a `KIND_FALLBACK` table. Plan 2 replaced all six and emptied the table.

### The kinds, and what each is really made of

| kind | the read |
|---|---|
| `retail` | Two storefront runs hard against the north and south lot lines with a service alley between. Bays with party walls, shopfronts and awnings. |
| `rail` | The Union Pacific: ballast and double track the full width of the map, solid except at nine level crossings. |
| `civic` | One limestone mass set back behind a paved forecourt, portico on the centreline. |
| `apts` | Two 2-storey blocks with a shared apron. A taller wall band than anything else on a residential street. |
| `church` | A pitched nave plus a steeple carrying the largest overhang in the game. |
| `auto` | A corrugated shed at the back, stock on painted bays out front. |

None of them introduced a new art rule, a new palette entry, or an asset. All six are
assembled from `mkCanvas`, `R`, `shade` and the roof-above-wall layout `mkBldg` already used.

### Every real defect this pass came from looking, not from testing

The suite stubs every drawing call, so it cannot see a building drawn wrong. Four of the
five defects below were invisible to it, and were found by rendering a frame and looking:

- **Retail roofs were so deep the shopfront was a thin strip**, the two runs abutted into one
  slab with no visible alley, and every bay was the same brown. Runs went to 32px so two of
  them leave a real 48px alley, bays pick their own tone from a brick/limestone/stucco set,
  and the roofs got AC units, stair bulkheads and vents.
- **Railway sleepers were drawn as horizontal bands**, parallel to the rails, so they read as
  extra rail lines — four parallel greys and no track. Sleepers run *across* an east-west
  corridor and are vertical bars.
- **Crossing planks were nearly the same brown as the ballast**, so the crossing vanished into
  the corridor. Where you may cross is the one thing that must be legible.
- **The church nave was two nearly-identical greys**, so the pitch disappeared into a flat slab
  from above. It needed a real value split between the slopes plus shingle courses. The
  steeple also stood directly over the entrance, burying the doors it exists to announce.

The fifth was a genuine softlock and the suite *did* catch it — see below.

### The wedge assertion was wrong, and had been all along

Task 2 failed the wedge sweep at one site. The site turned out to be escapable: reverse-only
drove out of it in 0.8s, and steer-left in 4.5s. Only the suite's single hard-coded
strategy — rock the throttle while steering permanently right — stayed inside the 40px
threshold, circling in place.

The assertion's own comment says sites must be "escapable by ANY input" while trying exactly
one. **A test that asserts "any" must try more than one.** It now runs four strategies, fails
only when every one is stuck, and names the trapped tiles.

Why it surfaced here is worth recording, because it looked like the railway caused it and did
not. `genRail` makes **zero** `rng` calls where the `genParking` fallback it replaced consumed
many. The shared random stream shifted, every block generated after the corridor got a
different layout, and one park block went from 21 statics to 20 — the sampler simply landed
somewhere tighter. **Anything that changes how much randomness a generator consumes reshuffles
every block after it.**

A sweep of 10 seeds and 313 sites found 0 genuinely trapped and **6 that the old
single-strategy test would have failed**, spread across five seeds. It had been latently flaky
since it was written, and since the artifact accepts `?seed=<int>` it would eventually have
fired on a player's seed.

### One real trap, fixed in the generator

`genAuto`'s first cut put two rows of stock 26px apart while marking each car 2×2 tiles.
Neighbouring marks merged into walls and left a 4px pocket between the rows — a site no input
escaped. Fixed where the fault was, in the generator: one row flush to the front lot line with
an aisle wider than a car behind it. 365 sites across 10 seeds, 0 trapped.

The general lesson is the one `markSolidSafe` also encodes: **a generator that marks more solid
than it draws will eventually build a trap.** `markSolid` obeys blindly; `markSolidSafe`
refuses `City.keep` tiles and reports refusals, so a generator fighting the porch mask shows up
instead of silently winning.

### What was deliberately not done

`apts` blocks are scenery. They were deliverable in Plan 1 only because they fell back to
`res`, and giving them a real street door drops the delivery pool from 132 addresses to 120.
Downtown still receives no orders at all. That concentration is the accepted cost of a faithful
map, and the fix — a door for the apartment above the shop, which those storefronts really
have — is a follow-up rather than part of this branch.

The north storefront run in each retail block faces the alley rather than the street, because
`mkBldg`-style sprites have one orientation and only `Art.house` has four. Directional variants
were judged not worth it: what reads as downtown from directly above is the unbroken street
wall, not which way an awning points.

---

## The Union Pacific (Plan 3 of 3)

The corridor was already geometry after Plan 2 — ballast, rails, nine crossings, solid along its
whole length except where the streets cross it. This put a train on it, gates that lower for it, a
wreck that cannot trap you, and a cruiser that is not exempt.

### The corridor has two tracks, and that decided the train

`genRail` bakes a two-rail tile and lays two rows of it, so the corridor carries two tracks whose
centres sit at `railY ± 8` — 504 and 520. That was not noticed while writing the plan. A train
running down `railY` would have straddled both and read as floating over the gap.

So `City.tracks` exists, and a train picks its track by direction. Eastbound keeps to the south
rail, which is the same right-hand convention `Traffic.laneFixed` already encodes for the road
(`dir === 0` takes the `+24` half of its span). Two trains could pass without either being wrong.

`Train` is rail-bound in exactly the sense `Traffic` is: fixed `y`, constant speed, no steering, no
interpolation. It is the one hazard in the game that cannot be negotiated with, which is what makes
the crossings matter. `TRAIN_SPD` 250px/s takes it across the 1632px map in about eight seconds and
past any single point in one and a half.

The consist bakes facing east and mirrors for west. Every road vehicle gets 16 `rotFrames`; a train
that only ever runs east-west would spend fourteen of them on a 64px sprite nobody ever draws.

### Two numbers only looking could have fixed

The locomotive's first cut gave the grey hood eight of the body's ten rows. On screen that left
Armour Yellow as a hairline frame and the whole unit read as a flatcar carrying a pale load — a
grille on wheels, not a locomotive. The fix is proportion, not colour: a wide dark cab and a narrow
hood with two full rows of yellow either side, and 64px long so it is visibly not a boxcar. The test
suite could never have caught this; every drawing call is a no-op there.

The crossbuck masts had to move from ~20px off the centre line to 44. The mast sprite is 28 tall
with `oy` 26, so its head hangs 26px **above** its ground anchor — at +22 the south crossbuck stood
squarely on the south track and the train drew straight through it. The plan had guessed 30, which
is still not enough. 44 is the first offset that clears the rails, and it puts both masts outside
the ballast band rather than in it.

### The gates swing sideways, and which way matters

A gate arm raised in a top-down view points at the sky and foreshortens to nothing, so animating it
vertically reads as a gate that simply vanished. It swings in the ground plane instead.

The first version swung it from parallel-with-the-road to across-the-road. That is wrong in a way
that is obvious the moment you look and invisible until then: a raised arm then lies down the middle
of the carriageway, and on the north mast the striped bar draws straight up through its own
crossbuck. Raised has to fold back along the **track**, away from the road. Each mast stands just
outside its kerb, so "away" is west for the south mast and east for the north one, and each swings
the way that keeps it clear of the rails mid-sweep.

Measured on a live train: the arms start down about two seconds before the nose arrives, hold for
four, and are back up 0.7s after the tail clears.

### The wreck, and the number that is derived rather than chosen

A wreck that leaves the car on the rails is a repeat-hit loop. That is the same class of defect as
the collision wedge — not merely awkward but unescapable by any input — so ejecting the car clear is
the safety property, not a polish step.

`RAIL_EJECT` is 52 because the ballast band runs y 480-543 either side of `railY` 512 and a car body
reaches 9px along its long axis; 52 clears by 11px north and 12px south. Anything smaller can leave a
corner inside the geometry.

The ejection direction is safe for a structural reason worth stating: a wreck can only happen where
the corridor is *not* solid, which is a crossing, which is a north-south street — so both exits are
known roadway before any test is run.

The plan guarded this with one crossing, which is thin evidence for the feature's whole safety
property. The suite now sweeps all nine against both approach headings and both train directions:
36 cases, every one landing at exactly 52px on clear roadway.

That sweep needs `G.banner` cleared between cases. A banner lives 1.6s, so a sweep that forgets reads
the *previous* case's wreck on frame one, exits immediately, and reports every case after the first
as a car that never moved. It produced a convincing fifteen-line failure report before the cause was
spotted. **When a sweep says everything after the first case failed, suspect the sweep.**

### An assertion that passed for the wrong reason

The first cop assertion — that the cruiser is gone after a train crosses it — passed before a single
line of the cop interaction had been written. A cop that *catches* you also despawns and zeroes the
heat, via the ticket path, so `cop === null` was true for reasons that had nothing to do with the
train. It now parks the player 400px clear and asserts the banner reads `THE TRAIN GOT THEM`.

The related trap: a cop accelerates away from wherever it is placed, 285px/s² being 45px in half a
second, so a train *approaching* a hand-placed cop can legitimately miss. The train straddles the
crossing at the start of the test instead, which makes the hit deterministic.

The test places the cop by hand, so it cannot answer the question that actually matters: would a
cruiser ever follow you onto the tracks under its own pathing? Checked separately against the real
`Cop.update` over ten pursuits across five crossings from both sides — it entered the corridor and
reached the far side every time. The escape exists in play, not just on paper.

### The demo's wait is latched, and it has to be

The demo plays by the same rules as a player, which includes being allowed to run a gate. It should
not: the attract loop showing the car flattened by a train reads as the game being broken rather
than as a hazard.

The test that starts the wait needs a direction of travel, and a stopped car has none. Unlatched, the
demo stops, stops detecting, creeps forward again under the speed floor in `Demo.drive`, and jitters
into the gate instead of waiting behind it. Latching it costs one boolean.

Traffic gets the same treatment with a floor rather than a latch: brake for a lowered gate, but only
from more than 34px out, because a car already between the gates is committed and braking there parks
it on the rails instead of clearing them.

Both were measured rather than assumed. Traffic queues three deep at 51/72/93px from the rails — the
gate is at 44 — and across three full train traversals no car ever occupied the train's box. The demo
latches at 114px out, holds stopped for the whole closure without flapping, and releases the frame
the gate lifts.

The attract stall bound widens from 8s to 12s for that legitimate wait. Worst observed went from
0.7-1.0s before the change to 3.6s after, so the bound still has room to catch a real wedge.

### What the section ordering turned out to be doing

`— rail —` calls `startShift()`. That is now the only reason `— heat —`, which runs after it,
exercises a live pursuit at all: before this branch every section past `— attract —` left the game in
`title`, where `update()` returns before the cop is ever touched. Ten seconds of "cop pursuit stable"
were asserting against a cruiser that had never moved.

The sections share one mutable game and run in order, so where a section sits changes what the ones
after it test. `— heat —` now asserts the state it ran in, so that guarantee does not quietly rot the
next time something is reordered.

### What was deliberately not done

Widening `— heat —` also surfaced that a pursuing cop wedges about a third of the time — 19 of 60
dispatches never covered 40px in ten seconds. `Cop.update` never calls `unwedge()` the way
`Player.update` does, so a cruiser that drives into geometry is stuck for good.

It is not a railway problem: 17 of those 19 jammed between 166 and 272px away from the corridor, in
ordinary city geometry, and the only cop code this branch touched was `spawnCop` refusing to dispatch
onto the tracks, which can only reduce corridor cases. So it went on the ROADMAP punch list rather
than into a train commit, and the assertion that found it was withdrawn rather than loosened until it
passed. A test weakened to accommodate a bug records nothing; a punch-list line records the bug.

---

## Two punch-list items, and what merging the lists was actually for

### The lists had drifted

There were two: `ROADMAP.md`, kept current, and a standalone punch list authored on 16 August. Two of
its items — the Hays street data and the block-kind zoning — had shipped days earlier and were still
sitting there unticked, because nothing ever reconciled the two files.

They are one list now. The part worth keeping is not the merge, it is that **every carried-over item
was checked against the code instead of assumed**, and that changed three of them:

- the display-face resize was **done** — `JOURNAL.md` already recorded the 9×11 → 7×9 glyph-grid
  change that made an exact percentage possible;
- putting the logo on the building was **not** done, which had been guessed either way at various
  points. `Art.mkTaqueria` was still setting its sign with `text()` in the 5×7 game font;
- the clipped banner was **real**, and became a diagnosis rather than a description.

A list you have to re-verify before trusting is worth about as much as no list.

### The shop was wearing the wrong typeface

The rooftop sign was set in the 5×7 game font — the *UI* face, one-cell strokes. The `LOGO` display
face already existed and was already what the title badge and wordmark used, so the shop on the map
and the shop on the title screen were reading as two different brands.

Moving it over cost more than swapping the call. `LOGO` is a 7×9 grid against the game font's 5×7,
so two lines at scale 2 need 40 rows where the old jade panel had 28, and the scale is not free to
split the difference: cells are drawn as square `s×s` rects, so a fractional scale lands on
half-pixels. The board grew from 34px tall to 50 and the roof vents moved down to clear it.

**The reference and the render disagree on purpose.** The first attempt butted the two lines
together and the whole lockup fused into one gold slab — the O of `TACO` running into the H of
`SHOP`. Opening the actual sticker in `reference/assets/` showed it interlocks those lines
*deliberately*; it just separates the layers with outlines that pixel type 18px tall has no room
for. Four rows of jade between the lines is the translation. Copy the intent, not the geometry.

### A fourth text-overflow bug, in the axis nobody was checking

`— hud layout —` exists because three text bugs shipped in the order card. It asserts every banner
box fits the 384px screen. A fourth shipped anyway, straight through it, because **it only measures
width**.

`text()` takes `py` as the top of the run, not its centre. The banner box spans y=60 to y=79 and the
5×7 font at scale 2 is 14px tall, so text at y=66 put its final glyph row exactly on the bottom
border stroke. Every `say()` banner in the game was shaved — PERFECT TOSS!, PULLED OVER, LOST THEM,
HIT BY TRAIN. The fix is one number: y=63, which centres it with three rows either side.

It was verified by rendering a frame and reading the pixels back with `getImageData`, not by eye —
glyph rows land at 63–76 inside a box at 60–79. Eyeballing it is how it shipped clipped the first
time, and at 3.7× browser zoom through a CRT post pass a one-pixel shave is invisible anyway.

### What did not change

The plan documents in `docs/superpowers/plans/` still have every step unticked, including the two
that landed a week ago. That is the convention here, not an oversight: the plans are the record of
*how a thing was built and why*, and live status lives in `ROADMAP.md`. Ticking 54 boxes in one file
and leaving the other two untouched would have made the inconsistency worse, not better.
