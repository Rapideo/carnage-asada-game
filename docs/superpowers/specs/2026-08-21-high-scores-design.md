# High scores, and what the score is

Design for giving *Taco Shop: Carnage Asada* a persistent high-score table with cabinet-style
initials entry, and for settling what "score" means in a game that has only ever tracked money.

Status: approved in brainstorming, 2026-08-21. Closes the **Score and high-score screen** item on
`ROADMAP.md`, which has been the largest gap on that list since the punch lists were merged.

---

## 1 · Why this, and why now

The game has no persistence of any kind — no `localStorage`, nothing. Improvement shows up only as
one of five rank strings, which is far too coarse for what the mechanics actually reward.

That is not a guess. Three shifts were played and measured (see `ROADMAP.md` → Playtest notes):
a naive run earned $20.90, a careful-but-slow run $8.93, and a fast road-following run $20.62 from
*half* the deliveries of the first. Three genuinely different standards of play, and the game called
all three **TRAINEE**. It currently cannot tell you that you got better, which is the one thing a
game with a skill curve this steep most needs to do.

## 2 · The score is the money

**Decision: score = `G.earned`, integer cents. No second number.**

`earned` already integrates everything a score would want to measure:

| the score rewards | via |
|---|---|
| speed | the tip decays 55¢/s from $15.00 to a $2.00 floor |
| accuracy | `PERFECT_BONUS` $5.00 for the door rather than the porch |
| consistency | the combo, up to ×3, reset by any crash, ped, ticket or splat |
| restraint | `PED_FINE` $2.00, `REMAKE_FEE` $1.50, `TICKET` $15.00 |

**Rejected: a separate arcade points number.** It would put two competing figures on screen, need its
own balancing, and duplicate work `earned` already does well. **Rejected: money displayed as bare
points** (2340 rather than $23.40) — it reads more like an arcade board but throws away the
"TAKE HOME" framing the results screen is already built on, and a leaderboard denominated in dollars
is more distinctive than one denominated in points.

**An entry stores `{ ini, cents }` and nothing else.** The rank title is *derived* at draw time
through the existing `G.rank()`. Storing it would bake in today's thresholds, so retuning them later
would leave a board of stale titles; deriving means the whole board reflows.

## 3 · Where it appears

Two new states.

- **`scores`** — the board itself. It serves twice: as an attract screen, on a timer, and as the
  post-shift screen, waiting for input. One flag, `G.scoresFromShift`, distinguishes them.
  Post-shift it takes the same keys `results` already does — **Enter** runs it back, **Escape**
  returns to the title — so the player never has to learn a second set. As an attract screen it
  ignores both and advances on its timer, and any key returns to the title exactly as the winners
  card does today.
- **`entry`** — the initials wheel. Reached from `results` **only** when the score qualifies.

```
play ──► results ──► qualifies? ──► entry ──► scores
                         │ no
                         └────────► results, as today

attract:  title ──► winners ⇄ scores ──► demo ──► title
```

**The attract middle slot alternates** between the winners card and the board, one flag flipped each
pass out of the title. **Rejected: a dedicated fourth slot** (title → winners → scores → demo), which
is the more classic loop but grows the cycle from 135s to ~147s — and 90 seconds of demo is already
flagged on the punch list as a long watch. Alternating keeps the cycle length exactly where it is.
**Rejected: post-shift only**, which means nobody idling at the title ever learns the board exists.

**The demo still never posts a score.** `update()` already returns a demo that outlasts the clock to
the title rather than to `results`; that stays true, and the `— attract —` tests assert it.

## 4 · Persistence, and the `file://` trap

`localStorage`, under the key **`tacoshop.scores.v1`**, holding a JSON array of `{ ini, cents }`.

**Every read and write is wrapped in try/catch, and this is load-bearing rather than defensive
habit.** `taco-shop.html` is meant to be opened directly — the README says so — and Chrome treats a
`file://` page as an *opaque origin* where touching `localStorage` throws a `SecurityError` outright.
An unguarded read would blank the game on exactly the distribution path the whole build is designed
around. On any failure the board falls back to running in memory for the session.

The key is versioned so a later schema change can be detected and reset rather than crashing on
unexpected shapes. Anything that fails to parse, or parses to the wrong shape, is discarded in favour
of the factory board rather than repaired.

Scores are per-origin, so a published artifact keeps a board per viewer and per URL. That is the
correct behaviour for a cabinet homage and needs no server.

## 5 · The factory board is authored content

The starting ten live in **`content/scores.json`**, inlined by `build.mjs` exactly as
`winners.json`, `hays.json` and `attract.json` are, and validated the same way:

```json
{
  "board": [
    { "ini": "MJS", "cents": 4720 },
    { "ini": "ACE", "cents": 3185 },
    ... eight more, sorted descending ...
  ]
}
```

Build-time guards, all failing loudly rather than shipping:

1. exactly 10 entries;
2. `ini` is exactly 3 characters and drawable by the 5×7 font (the existing `FONT_CHARS` guard);
3. `cents` is a non-negative integer;
4. the board is sorted descending — an unsorted factory board would display wrong before the player
   ever touches it;
5. the widest possible row fits the screen (§6).

This means the board is never empty, the attract screen always has something to show on first run,
and the factory initials are authored rather than hard-coded in a module.

## 6 · Layout

Ten rows on a 12px pitch, all at scale 1 except the header.

| element | x | note |
|---|---|---|
| header `HIGH SCORES` | centred, y=12 | scale 2 |
| position | right-aligned at 75 | `10` is 11px |
| initials | 93 | 3 chars, 17px |
| amount | right-aligned at 193 | `$47.20` is 35px |
| rank title | 208 | `LEGEND OF THE ASADA` is 113px, ending at 321 |
| prompt | centred, y=190 | |

Rows run y=38 to y=146, so the last row's glyphs end at 152 and the prompt clears them. The widest
row ends at **321 of 384**, leaving 63px each side. Guard 5 above makes that permanent — three
text-overflow bugs have shipped in this game's HUD already, and a fourth shipped vertically through a
guard that only measured width.

`PAL.amber` for the header and the placing row, `PAL.bone` for entries, `PAL.boneDim` for the rank
titles. No new colours: jade and gold stay badge-only, cyan stays guidance-only.

## 7 · The wheel

Cabinet-authentic, and the only scheme on the list that a gamepad maps to directly — which is a
punch-list item.

- the alphabet is exactly **27 characters** — `A`–`Z` then space — and it **wraps** in both
  directions, so Down from `A` gives space and Up from space gives `A`
- all three slots **start at `A`**, so confirming immediately yields `AAA` rather than blanks
- **Up / Down** cycle the current slot
- **Left / Right** move between slots; Left on the first and Right on the last do nothing
- **Enter** advances a slot, and confirms on the last
- **a 30-second idle timeout auto-confirms**, because an abandoned cabinet must not sit on the entry
  screen forever with the attract loop blocked behind it. The timer **resets on every keypress**, so
  it fires on abandonment rather than on someone taking their time

**Rejected: typing, and the type-or-arrows hybrid.** Typing is what a keyboard player will try
first, and this design accepts that cost deliberately in exchange for one consistent input scheme
across the whole game. **The mitigation is the on-screen prompt**, which must say plainly that the
arrows drive it — an entry screen a player cannot work out is worse than no board at all.

## 8 · Code shape

A new module **`src/78_scores.js`** owns the model and nothing else:

| export | does |
|---|---|
| `Scores.load()` | factory board, overlaid with storage if readable |
| `Scores.save()` | best-effort write, silent on failure |
| `Scores.qualifies(cents)` | true if it beats the tenth place |
| `Scores.insert(ini, cents)` | insert sorted, cap at 10, return the new index |
| `Scores.board` | the live array |

Numbered 78 so it loads after `75_demo` and before `80_game`, which constructs and draws it.

**The drawing stays in `80_game.js`** — `overlayScores` and `overlayEntry` beside the existing
`overlayTitle`, `overlayWinners` and `overlayResults`, because that is where every overlay lives.
The split is model versus presentation: `Scores` never touches a canvas, `G` never touches storage.

`80_game.js` is already past 800 lines, which is why the persistence concern gets its own file rather
than being folded in.

## 9 · One addition to the results screen

When a shift does **not** place, the results screen gains a single line naming the target:
`BEAT $9.60 TO MAKE THE BOARD`. One line on an existing screen, and it is the thing that converts a
leaderboard from a trophy cabinet into a reason to press ENTER again.

## 10 · Files touched

| file | change |
|---|---|
| `content/scores.json` | new — the factory board |
| `content/attract.json` | new `scores` slot with its own `seconds` |
| `build.mjs` | inline and validate the board; add `scores` to the attract screens |
| `src/78_scores.js` | new — the model |
| `src/80_game.js` | two states, qualifying, the wheel's input, two overlays, the results line |
| `test/headless.mjs` | new `— high scores —` section |

`src/05_content.js` is regenerated. `70_hud.js`, `40_city.js` and `50_entities.js` are untouched.

## 11 · Testing

A new `— high scores —` section:

1. the factory board loads, is 10 long, and is sorted descending;
2. **a throwing `localStorage` falls back to the factory board without raising** — the `file://`
   case, stubbed by making the accessor throw;
3. a corrupt or wrong-shaped stored value is discarded rather than repaired;
4. `qualifies()` is correct *at the boundary* — one cent above and one cent below tenth place;
5. `insert()` keeps the board sorted, caps it at 10, and returns the right index;
6. a key sequence through the wheel produces the expected three characters, including wrap at `Z`;
7. the entry timeout confirms rather than hanging;
8. the widest possible row fits 384px, computed rather than sampled;
9. the attract middle slot alternates winners → scores → winners across cycles;
10. the demo still never posts a score.

## 12 · Risks

1. **The `file://` storage throw.** Guarded and directly tested, but it is the failure that would
   break the shipped artifact rather than merely the feature.
2. **Players will try to type their initials.** Accepted (§7); mitigated by the prompt.
3. **The attract loop gains a branch.** The rotation is already asserted in `— attract —`; those
   assertions widen rather than being replaced.

## 13 · Out of scope

Online or shared leaderboards. Per-run replays. Score attribution beyond three initials. Any change
to the rank thresholds themselves — retuning `rank()` is a balance question, and this design
deliberately makes it a safe one by deriving titles rather than storing them.
