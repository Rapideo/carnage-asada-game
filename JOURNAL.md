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

## 6. Final state

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
