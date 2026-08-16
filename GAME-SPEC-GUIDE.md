# How to Spec a Game for Claude

A practical guide to writing game briefs that produce good games on the first try.
Derived from what actually worked on **Hot Slice** (see `JOURNAL.md`).

> This guide analyses the *original* pizza-delivery brief, so it refers to Hot Slice and SLICE-NAV
> throughout. That is deliberate — it is a post-mortem of the brief that was actually written. The game
> in this repo was later rebranded to **Taco Shop: Carnage Asada** (`JOURNAL.md` §7); none of the analysis
> below changes.

---

## The 30-second version

A great game spec is **tight on feel and loose on implementation.** Give me:

1. **Two reference games**, and say what to take from each
2. **Camera / perspective** (top-down, side-on, isometric, first-person…)
3. **Visual era or art direction** (16-bit, minimal vector, hand-drawn, PS1-jank…)
4. **The core tension** — the one thing the player is fighting
5. **3–5 verbs** — what the player actually does
6. **Session shape** — how long is one play, and what ends it
7. **Delivery target** — single file? artifact? repo? phone?

Leave the rest to me. Over-specifying implementation is how you get a worse game, not a more accurate one.

---

## Why the Hot Slice prompt worked

> "Create for me a 16-bit style top-down pizza delivery game based loosely on the mechanics of APB and
> Paperboy. The longer the delivery takes, the smaller the tip (which counts down) — and a rudimentary
> guidance system guides you towards the correct delivery location."

Two sentences. Look at the density:

| Phrase | What it silently decided |
|---|---|
| `16-bit style` | Internal resolution, palette discipline, sprite technique, chiptune audio |
| `top-down` | The entire rendering architecture: tilemap, y-sorting, fake-height sprites |
| `APB and Paperboy` | Two whole mechanical vocabularies — arcade driving + police heat, throw-at-porch |
| `pizza delivery` | The fiction, which generates the city, the addresses, the shop, the fail states |
| `the longer it takes, the smaller the tip` | The scoring loop **and** the HUD hierarchy |
| `rudimentary guidance system` | A named system to build — plus a *characterisation* |

**The single best word in that prompt was "rudimentary."** It's not a requirement, it's a personality note.
It told me the nav shouldn't just be weak — it should be *funny about being weak*. That became the
SLICE-NAV 2000 with its flickering `RECALCULATING / RETURN TO ROADWAY`, which is the most-loved detail in
the game. **Adjectives about how a system should feel are worth more than paragraphs about how it works.**

And what the prompt *didn't* say: session length, fail states, control scheme, how the throw works, world
size, procedural or authored, platform. All of that was mine to decide — which is exactly why it could be
built in one pass without a round-trip.

---

## The seven levers

### 1. Reference games — the highest-leverage sentence you can write

"X meets Y" compresses more design information than any amount of description. But make it precise by
saying **which half you want from each**:

- ❌ "like APB meets Paperboy"
- ✅ "APB for the police pressure and arcade driving, Paperboy for throwing at doorsteps"

Also useful: **anti-references.** "Like Vampire Survivors but *not* idle — I want to be actively dodging"
kills a whole wrong branch in six words.

If a reference is obscure, add one clause: *"Desert Bus — the joke is that it's boring on purpose."*

**References drag the aesthetic, not just the systems — use this deliberately.** Hot Slice was briefed as
"16-bit," which points at Genesis/SNES, but it reads as *mid-80s Atari arcade*. That's because APB (1987)
and Paperboy (1985) are both Atari Games arcade titles, and taking mechanical cues from them imported their
visual grammar too: the road-grid city, the ¾-view buildings, the boxy high-contrast HUD. The references
overrode the stated era, and the result was better for it.

So: if you want the era and the mechanics to come from *different* places, say so — *"Hotline Miami's
mechanics but Game Boy monochrome."* If you don't say, expect the references to win.

### 2. Camera and perspective

This determines more code than anything else. Say one of: top-down, three-quarter / isometric, side-on
platformer, side-on shmup, single fixed screen, first-person, 2.5D, twin-stick.

If you don't say, I'll pick what suits the references — but it's cheap to say and expensive to change later.

### 3. Visual era / art direction

"16-bit" is a great answer because it's a *system*, not a vibe: it implies resolution, palette size, sprite
technique, and audio. Other answers that carry the same weight: `1-bit Game Boy`, `CGA 4-colour`,
`vector wireframe`, `flat minimal geometric`, `hand-drawn marker sketch`, `PS1 low-poly with texture warp`,
`clean modern flat UI`.

Include a **palette hint** if you care: "sun-bleached desert" or "neon on wet asphalt" or just three hex
codes. Otherwise I'll choose and tell you what I chose.

### 4. The core tension — the most important line in the spec

Every good arcade game is one sentence: **the player wants A, but B pushes back.**

- Hot Slice: *you want to drive fast for a bigger tip, but speed wrecks your accuracy and attracts police.*
- Tetris: *you want to clear lines, but the stack rises while you decide.*
- Spelunky: *you want the loot, but the ghost is coming.*

If you can't write this sentence, the spec isn't ready — and you'll get a competent game with no pull.
Write it explicitly and I'll build every system to serve it.

### 5. The verb list

Three to five things the player *does*, in plain language: **drive, aim, throw, restock.** That's the whole
of Hot Slice. If your list runs past six, you're describing a project, not a session — split it.

Say if a verb should feel a particular way: *"the dash should feel abrupt and slightly too powerful."*

### 6. Session shape

How long is one play, and what ends it? Options: fixed timer, lives, run-until-death, level-based,
endless with a score, campaign. Say roughly how long a good session should be — "2 minutes" and
"45 minutes" produce completely different games from the same mechanics.

Also worth one line: **what happens on failure.** Instant restart? Lose progress? Soft penalty?

### 7. Delivery target

Say this first, actually — it constrains everything:

- **"One self-contained HTML file I can double-click"** → zero dependencies, procedural assets, ~100–200 KB
- **"A shareable artifact link"** → same, plus a strict CSP (no CDNs, no external fonts or images)
- **"A proper repo I can keep working on"** → modules, a real build, tests, README
- **"Works on my phone"** → touch controls, portrait-friendly, larger hit targets
- **"Runs in the terminal"** → a whole different rendering approach

Default if unspecified: single self-contained file. It's the most useful thing on a Sunday.

---

## The template

Copy, fill in, delete what you don't care about.

```
GAME: <working title, or "you name it">

PITCH: <one sentence a friend would understand>

REFERENCES: <Game A> for <what>, <Game B> for <what>.
NOT like: <anti-reference, optional>

PERSPECTIVE: <top-down / side-on / isometric / …>
ART: <era or direction> — <palette hint, optional>
AUDIO: <chiptune / ambient / none / sfx only>

CORE TENSION: <the player wants ___, but ___ pushes back>

VERBS: <3–5 things the player does>

SESSION: <length> · <what ends it> · <what failure costs>

MUST HAVE:
- <the 1–3 mechanics that ARE the game — be specific>

NICE TO HAVE:
- <things to cut first if scope bites>

DELIVERY: <single file / artifact / repo / mobile>

FEEL NOTES: <adjectives about how systems should feel — "rudimentary", "greasy",
             "over-responsive", "menacing but fair". These are gold.>

LEAVE TO YOU: <explicitly hand me the decisions you don't care about>
```

---

## Three worked examples

### Fidelity 1 — one-liner (good for "surprise me")

> A 1-bit Game Boy-style single-screen arcade game about a lighthouse keeper: rotate the beam to guide ships
> in, but the beam blinds the birds you're also trying to protect. 90-second rounds. Single HTML file.

This has references-by-era, perspective, core tension, session shape, and delivery. Enough for a full build.

### Fidelity 2 — paragraph (the sweet spot; this is roughly Hot Slice's level)

> **Deep Signal** — top-down submarine salvage, PS1 low-poly-ish but 2D, murky green-on-black.
> Subnautica for the dread of descending, Asteroids for the drifting momentum. You want to go deeper because
> the salvage is worth more, but your oxygen and your hull integrity both only go one way. Verbs: thrust,
> scan, grab, surface. One run ends when you surface or die; a run should last 3–6 minutes and losing a run
> loses the cargo but keeps upgrades. Must have: the pressure gauge as the loudest thing on screen, and
> sonar that reveals the map in pings rather than continuously. Feel note: the sub should feel *heavy and
> reluctant* — turning is a commitment. Single self-contained file. Leave the upgrade list to you.

### Fidelity 3 — full spec (for something you'll keep building)

Use the template above, and add:

```
PROGRESSION: <what changes between sessions>
CONTENT SCALE: <how many enemies/levels/items for v1>
DIFFICULTY: <how it ramps, and what the mastery ceiling looks like>
PLATFORM DETAIL: <resolution, input devices, save persistence>
OUT OF SCOPE: <explicitly, so I don't build it>
```

---

## What to leave to me (on purpose)

These almost always come out better if you don't pin them:

- Exact tuning numbers (speeds, timers, costs) — I'll tune by feel and tell you which dials to turn
- Architecture, file layout, render pipeline
- Procedural generation approach
- Specific colour values, if you gave me a direction
- Sprite and audio production — assume procedural unless you say otherwise
- UI layout, as long as you told me what the *most important* number on screen is

## What to never leave ambiguous

- **Delivery target** — changing this late invalidates architecture
- **The core tension** — without it you get competence without pull
- **Session length** — 2 minutes and 45 minutes are different games
- **Whether it must run offline / with no dependencies**
- **Any real constraint you have** — a deadline, a device, an audience, an accessibility need

---

## High-leverage vocabulary

Terms that carry a lot of implementation meaning. Using them precisely saves paragraphs.

**Perspective & camera**
`top-down` · `three-quarter` / `isometric` · `side-on` · `twin-stick` (move + aim independently) ·
`single-screen` (no scrolling; whole game visible) · `parallax` (layered scrolling depth) ·
`camera lookahead` (view leads your motion — makes fast games readable) · `y-sorting` (draw order by depth)

**Game feel**
`juice` (feedback layered on every action) · `hitstop` (freeze frames on impact — makes hits land) ·
`screen shake` · `coyote time` (jump still works just after leaving a ledge) ·
`input buffering` (presses land slightly early) · `i-frames` (invulnerability window) ·
`telegraph` (enemy wind-up you can read) · `snappy` vs `floaty` · `momentum` / `drift`

**Structure**
`score attack` · `run-based` / `roguelite` (die, restart, keep some progress) · `endless` ·
`wave-based` · `extraction` (get in, get loot, get out — dying loses it) · `metroidvania` (gated by ability)

**Systems**
`risk/reward` · `resource pressure` · `combo` / `streak multiplier` · `cooldown` · `aggro` ·
`spawn director` (adaptive difficulty) · `mastery ceiling` (how good can an expert get)

**Art & tech**
`limited palette` · `dithering` · `tilemap` · `fake height` / `pseudo-3D` · `CRT filter` / `scanlines` ·
`deterministic seed` (same seed → same world) · `procedural generation` · `fixed timestep` ·
`self-contained` (one file, no external requests)

---

## Scope calibration

**Comfortably one shot** (like Hot Slice)
One core loop · 3–5 verbs · one procedural world or a handful of levels · score-based ending ·
no persistence between sessions · no networking

**Needs a second pass**
Multiple interacting systems (crafting + combat + economy) · authored level design · a real difficulty
curve · save/load · 10+ distinct enemy or item types

**Multi-session project**
Narrative · multiplayer · asset-heavy art direction · anything with a level editor · mobile + desktop
parity

You don't need to scope it yourself — but if you say *"I want this in one shot"* I'll aggressively pick the
version that fits, and tell you what I cut. If you say *"this is a project"*, I'll build foundations
differently (real modules, tests, room to grow).

---

## Iterating after v1

The most useful change requests name **three things**: the system, the feel, and a comparison.

- ❌ "the driving feels bad"
- ✅ "the driving feels bad — the car understeers at speed. I want it to rotate faster when I'm slow, like
  Micro Machines"

Other formats that land well:

- **Numbers with a direction:** "tip should decay about half as fast"
- **Moments:** "the second after a perfect toss should feel like more of a reward"
- **Removals:** "cut the cop, it interrupts the flow" — cutting is a legitimate and underused request
- **A/B:** "show me two versions of the throw"

And when something's already right, say so specifically — "the RECALCULATING joke is the best part" tells me
what to protect while changing things around it.

---

## Anti-patterns

| Anti-pattern | Why it hurts | Instead |
|---|---|---|
| A feature list with no tension | Produces competent, forgettable games | Write the one-sentence tension |
| Specifying implementation ("use an entity-component system") | Spends your budget on my job, not yours | Specify feel and constraints |
| Ten reference games | They average into mush | Two, with what to take from each |
| "Make it fun" / "make it juicy" | Not actionable alone | Name the moment that should feel good |
| No delivery target | Risks the wrong architecture | One line, up front |
| Scope with no priority | I have to guess what to cut | MUST HAVE / NICE TO HAVE |
| Withholding the real constraint | Produces work that doesn't fit your situation | Say the deadline, device, audience |

---

## One last thing

The best briefs read like someone describing a game they can already see. You don't need design vocabulary
or precision — *"you're a pizza guy, the tip shrinks while you dawdle, and the sat-nav is rubbish"* is a
complete spec. Everything in this guide is just a way to get more of that per sentence.
