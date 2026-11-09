# Roadmap

Working list for **Taco Shop: Carnage Asada**. Small items first, then the neighbourhood pass.

Checkboxes render as a live task list on GitHub:
<https://github.com/Rapideo/carnage-asada-game/blob/master/ROADMAP.md>

---

## NOW: version 0.9.1 (Service Mode), then the owner's 0.9.x list

The game is **feature-complete at 0.9.0** (2026-11-07) and **0.9.1 adds Service Mode** (same
day; see `CHANGELOG.md`). The owner playtests the whole game on Monday 2026-11-09 and brings a
punch list. Fixes ship as 0.9.x, and 1.0.0 is the owner's call.

## DONE: Service Mode (the admin overlay), 0.9.1

- [x] **Service Mode**, built 2026-11-07 on branch `admin-overlay` (never pushed): F2 in the
      dev game served by `node admin.mjs` (localhost:8124). Tabs: Levels, Menu, Attract, Music,
      Difficulty, Dialogue, Faces, Test. Save runs the build's own validator, writes the JSON and
      the regenerated docs, and rebuilds. None of it ships in `taco-shop.html`.
- Design: `docs/superpowers/specs/2026-10-25-admin-overlay-design.md` (the owner's 2026-11-07
  rulings are at its head: the name, F2, the version). Plan:
  `docs/superpowers/plans/2026-10-25-admin-overlay.md`.
- **Rulings now in force** (recorded in `CLAUDE.md` and `docs/gdd.md`):
  - **The JSON is the master copy** and `docs/authored content/*.md` are generated from it.
    This reverses the 2026-09-26 ruling. All seven docs were regenerated once in 0.9.1.
  - **Release months:** summer is July; winter is January when it comes before that year's
    summer level and December when it comes after. A same-year song released after its
    level's month is a **warning, never a refusal** (owner, 2026-11-07). Level 3 keeps both
    Bohemian Rhapsody songs and Level 16 keeps Cannonball.
- [x] **Era faces blink again** (E1): eyes hand-set on the 15 decade faces (the 1990s club
      customer wears sunglasses and has none); lid colours fixed on 6.
- [x] **E8, music clearance: CLOSED** (owner, 2026-11-07). The owner ruled it is not a concern
      and 0.9.0 is on Netlify. Do not raise it again.

## NEXT: the 0.9.x list (owner rulings, 2026-11-07)

The owner answered the Open Calls page. Items marked **build** are queued work, to be done
after Service Mode and not before; the rest are decisions that need no work.

**Build in 0.9.x**
- [ ] **Q2 (B): rain bites more.** Rain grip 0.84 to 0.75 (`WEATHER_GRIP.summer.rainy`). Weather
      hazards beyond grip are post-1.0.
- [ ] **Q4 (C): the player's car stays red;** remove the red (#d94f4f) from the traffic
      colours (`CAR_COLORS`).
- [x] **Q7 (C): a full speaking cast before 1.0 (DONE 2026-11-08):** police, a rival delivery driver and kitchen
      staff, one face per decade each (9 faces). The art director's nine portraits are
      **approved** (`reference/faces/cast/`, untracked). Baking them needs reserved palette
      slots (olive cactus on the rivals' caps; jade #1fa37e and gold #f3bd46 on the staff
      badge) per `reference/faces/cast/crop-guide.json`. The owner writes the lines in
      Service Mode's Dialogue tab.
      **The cast, as the owner ruled it on 2026-11-08:**
      - **Each character has a name** on the speech strip:

        | | '70s | '80s | '90s |
        |---|---|---|---|
        | Officer | SGT. PFEIFER | OFC. KARLIN | OFC. DREILING |
        | Rival | DUSTY | ACE | JINX |
        | Coworker | MARGE | DALE | NIKKI |

        Claude proposed them and the owner approved; all can be renamed in Service Mode.
      - **The officer (Delivery)** speaks when a chase starts, when you are fined (speeding,
        a pedestrian, a gate), and when you lose them.
      - **The rival (Delivery) is a voice only** for now, with no car in the city. They speak
        on your missed toss and your perfect toss.
      - **The coworker (Kitchen)** speaks:
        - the next-ingredient hint ("CHEESE NEXT, HON"; a line takes the ingredient's name);
        - at clock-in;
        - after a clean streak;
        - when there is trouble (the line backs up, or the clock is under 30s).
      - **More customers, growing through each decade** (owner, 2026-11-08):
        - 196 characters exist on the art sheets in `reference/assets/images/`; 17 are baked
          (catalogue: `reference/assets/art-inventory.md`).
        - Each picked character has a **first-appears year** within its decade and stays to
          the decade's end, so a decade's crowd grows level by level.
        - About **12 special regulars** carry on into later decades.
        - The owner picks them, and reviews every line, in the Casting Call review page
          (https://claude.ai/artifact/LFMAnoCD9cA4GdK49k6SdS). Claude reads the choices back
          and applies them.
        - **Picks, 2026-11-08** (`reference/assets/casting-picks.json`; anything unanswered is
          a no):
          - 104 new customers: '70s 32, '80s 40, '90s 32. Each has a first-appears year.
          - 10 skipped, including every police candidate; the approved cast plays the officers.
          - Five existing faces now first appear later: c80breaker from 1981; c90rocker and
            c90soap from 1993; c90raider and c90club from 1999.
          - **No regulars for now** (owner ruling).
          - The line review is done: the owner kept every attributed line (2026-11-08), and the
            per-face lines are built (670 lines on 120 faces, used 3 times in 4).
        - **DONE 2026-11-08: all 104 baked and cast.**
          - The owner approved the Face proofs and chose **Matched** for all.
          - The casts are '70s 38, '80s 45, '90s 37, with first years in `casts.json`'s `from`.
          - **Still to do: eyes.** Detection was wrong on most (boxes on chins and hats), so
            they were cleared and the new faces do not blink yet. Set them by hand in Service
            Mode's Faces tab. **The same goes for the nine cast portraits** (officers PFEIFER,
            KARLIN, DREILING; rivals DUSTY, ACE, JINX; coworkers MARGE, DALE, NIKKI): eyes are
            cleared and need setting by hand.
          - **Note:** the '90s start thin. At 1990, 4 faces (c90jock and three picks) are there,
            because four of the original five were moved to 1993 or 1999.
        - **Baking them** (Claude's plan, owner agreed 2026-11-08):
          - crop by head size, not by sheet cell, because the sheets' cells differ by up to 12%;
          - tone-match each face to a reference face from its decade;
          - give each decade shared skin, dark and highlight ramps;
          - make a proof sheet beside the existing faces, with the era grade, for approval
            before anything ships;
          - send faces that still clash back to the art director rather than forcing them.
          - The bundle grows by about 480 KB (about 4.6 KB per face).
      - *Claude's calls, to settle while building:*
        - the hinted bin must stay visible above the strip, because the strip covers the
          lower bins;
        - one speaker at a time, with customers' walkouts still taking priority;
        - the existing rate limit covers the whole cast.
- [ ] **Q8 (B): each address keeps one customer face for the whole run,** picked from that
      decade's cast.
- [ ] **Eyes on the new faces:** the owner sets eyes by hand in Service Mode's Faces tab for the
      nine cast faces once baked, and for any other era face that lacks them.
- [ ] **E2: snow tracked in** onto the dining-room door mat, and wet footprints along the line,
      on winter kitchen levels.
- [ ] **E3: Mode C (touch) only:** move the minimap to a free corner; check on a real phone.
- [ ] **Touch controls in the landscape margins** (owner, 2026-11-08). In landscape the 16:9
      picture does not use all the screen it could. Move the Mode C controls out into the left
      and right margins, and make them larger. Fold E3 into it, since freeing the picture may
      settle where the minimap goes.
      - **Decided 2026-11-08: concept C, transparent ghost controls**
        (`reference/touch-concepts/`, page https://claude.ai/artifact/1esoAeXXrpk3JgVCKbNwUJ).
        - **Picture:** full height on the owner's Pixel 10 (2424x1080), at an exact 5x scale.
        - **Left:** the Delivery Shift's stick sits **vertically centred** on the left margin,
          not lower-left.
        - **Right:** the Delivery buttons are **vertically centred** on the right margin to
          match.
        - **Kitchen Shift: no on-screen controls** (owner, 2026-11-08). The player taps the
          bins, stations and WRAP IT directly, as Mode C already does; only pause remains.
          This supersedes the kitchen d-pad and buttons in the concept mockups.
        - **Style:** outlines with a faint fill that brighten under the thumb.
        - **Sizes:** stick 18 mm, gas 15 mm.
        - **Edges:** 2-3 mm in from the screen edge, away from Android's back-swipe.
        - **Near-native:** with it, fullscreen and a landscape lock on the first tap, the
          camera cutout respected, no pull-to-refresh or zoom, a wake lock, and an install
          manifest beside the game on Netlify (display fullscreen, landscape, icons).
        - **Check first on the phone:** the browser's screen scale and where the camera sits
          (ADB is set up on the owner's PC).
- [ ] **Fix: the kitchen wall calendar** shows JAN on every winter level, but by the season
      rule all seven winter kitchen levels are December. (Final wave of this work.)

**Added by the owner, 2026-11-08 (rulings the same day)**
- [ ] **Windy weather, Delivery Shift only,** because Hays is known for it. This reverses
      Q2's "weather hazards beyond grip are post-1.0" for wind.
      - **Wind is its own roll and stacks** with the season's weather: windy and sunny, windy
        and rainy, a windy snowstorm. (Owner, 2026-11-08.)
      - **Three challenges:**
        - a crosswind on the toss, so the bag drifts downwind, with a windsock in the HUD
          showing direction and strength;
        - telegraphed gusts that shove the car sideways for about a second;
        - tumbleweeds rolling across the streets with the wind.
      - Not chosen: headwind and tailwind on speed, a dust storm, any kitchen effect.
      - **Weather is set per level, not rolled** (owner, 2026-11-08: weather is part of a
        level's difficulty). Each level in `levels.json` carries a weather, set in Service
        Mode's Levels tab: the season's choices (summer sunny or rainy, winter snowy or sunny;
        the build refuses snow in summer), a **windy** switch that stacks on top, or
        **Random**, which rolls as today. On kitchen levels weather is decoration only
        (snow on the door mat, rain on the window); wind stays a Delivery challenge.
      - **Starting plan (Claude's, the owner adjusts in Service Mode):**
        - Delivery:
          - 1 sunny; 3 snowy; 5 sunny + windy;
          - 7 rainy; 9 snowy + windy; 11 Random;
          - 13 rainy + windy; 15 snowy + windy; 17 Random;
          - 19 rainy + windy.
        - Kitchen: winter levels snowy; summer levels sunny, except 10 and 16 rainy.
      - *Claude's calls, to confirm in play:*
        - Random, where a level uses it, rolls windy about 30% in summer and 25% in winter;
        - wind strength rises with difficulty;
        - a tumbleweed bursts into twigs and wobbles the car, with no fine;
        - swaying trees and dust streaks are the telegraph, not extra hazards.
- [ ] **A much simpler level card:** "LEVEL #" and the date (month and year), text on black.
      - **Concepts D and B together:** a thin three-colour stripe in the decade's colours,
        with the date typing on beneath it in the decade colour.
        (`reference/level-card/2026-11-08-concepts.png`)
      - **It moves on by itself:** the date types on, holds about 2 seconds, and the shift
        starts. Any key skips ahead. No prompt text.
      - **The kitchen menu is not shown** at the start of a level. The next-ingredient hint
        and trial and error teach the recipes. *Claude's assumption, to confirm:* the pause
        screen keeps its menu, at the cost of clock time.
      - The other cards (clear, game over, continue) are unchanged.
- [x] **A next-ingredient hint (DONE 2026-11-08; `hint`/`hintNewOnly`/`hintStall` in `difficulty.json`):** the right bin blinks briefly to show what comes next.
      - It blinks **after a stall** (about 3 seconds with no pick while building) **and after
        a wrong pick.**
      - **Easy:** always. **Medium:** only for dishes new to this decade's menu (not on the
        previous decade's menu, or with a changed recipe). **Hard and Supreme:** off.
      - **The owner sets it per difficulty in Service Mode's Difficulty tab:** on/off,
        new-items-only, and the stall delay. There is no player switch.
      - It replaces today's `kitchen.hint`, which only flashed after a wrong pick on Easy.
- [x] **Playtest fixes (on `playtest-0.9.2`):** WRAP IT! is reachable with arrows or the stick
      (Down past the bins), and the tortilla rack's cursor fits each tray.

**Decided, no work**
- Q1 (A): keep mouse-aim throwing in Mode A.
- Q3 (A): police cost unchanged; judge Monday by counting tickets per shift.
- Q5 (A): downtown targets unchanged; judge Monday.
- Q6 (A): long (4-5 item) tickets may cover the kitchen calendar and sign; leave it.
- E4: the Hard delivery levels (13, 15): decide after Monday's play.
- E5: **the GDD X.1 palette targets are retired for graded frames;** judge by eye (noted in
  `docs/gdd.md` X.1 and `tools/render/README.md`).
- E6: leave the flaky demo test; rerun when it trips.
- E7: keep the branch name `master` (the work is on `admin-overlay` until the owner merges it).

---

## DONE: kitchen art (2026-11-06 to 2026-11-07, all three items)

The owner set the order on 2026-11-07. Details are in `RESUME.md`: "The art director and
the prep board", and "Pinned: the art". **The owner lifted the art pin on 2026-11-07.**

1. [x] **Assembly-board pictures.** Done 2026-11-07. The art director's 88 frames for all
   26 dishes are baked (`tools/render/bake-board.mjs` → `content/board/`), inlined as
   `BOARD`, and drawn by `Kitchen.pic()`. The build fails if any frame is missing.
2. [x] **Playtest.** Done 2026-11-07 (`docs/playtest-2026-11-07.md`). Its bugs are fixed, and weather (rain, sunny winter) plus a rain sound were added on the owner's request.
3. [x] **The kitchen levels' surrounding art.** Built 2026-11-07: a wall, a dining room
   and a counter lip per decade, from the art director's mockups, redrawn in
   `Kitchen.buildBg`. The bins are unchanged. See `reference/kitchen/surroundings/`.

- [x] ~~**Steam-table wells from real art.**~~ **Tried and declined 2026-11-07.** The approved
  pans were baked and rendered in place, and the owner kept the old wells. The reasons are in
  `RESUME.md`.

---

## DONE: the full game (the 2026-10-25 build)

The 2026-10-25 build finished the game the section below planned:

- **20 levels** that alternate the Delivery Shift and the Kitchen Shift, as checkpoint
  races, with level cards, LEVEL CLEAR, GAME OVER, initials, CONTINUE? and a victory
  card.
- **The Kitchen Shift**, in `src/74_kitchen.js`.
- **Three eras**, each with its own map (`content/hays*.json`), menu, customer cast,
  colour grade and music.
- **Winter.**
- **Control modes A, B and C** (`src/25_pad.js`).
- **The four-screen attract loop**, with a random-level demo.

The design as built is **`docs/gdd.md`**. The values are in `docs/authored content/`.
Every owner ruling and every invention is recorded in `docs/PURE-CARNAGE-DECISIONS.md`.

### Verified headless

| check | result |
|---|---|
| `node build.mjs` | clean; `taco-shop.html` ~619 KB, 18 modules, all content validated |
| `node test/headless.mjs` | PASS: the original suite plus `— run structure —`, `— kitchen —`, `— kitchen demo —` and `— copy —` |
| `node tools/check-pad.mjs` | 209 passed |
| `node tools/music/check-music.mjs` | all music checks pass |
| `node tools/render/sweep.mjs 2` | the autoplayers clear every level; the Hard deliveries 13 and 15 cleared 1 run in 2 |
| `tools/render/frame.mjs` | rendered frames of the title, mode select, every card type, every era's kitchen and city, winter, pause, dialogue and the touch overlay |

### Still needs a human

- [ ] **A real browser playtest, in depth.** Everything above is headless. Play
      delivery and kitchen levels across the eras, in Mode A first:
      `node serve.mjs`, then <http://localhost:8123/taco-shop.html>.
- [ ] **The music, by ear.** The arrangements were chosen by structural heuristics,
      because no agent can listen.
      - Renders to listen to are in `tools/music/preview/*.wav`.
      - To swap a song, edit `tools/music/songs.json`, then run
        `node tools/music/midi2song.mjs --batch tools/music/songs.json`.
- [ ] **Mode B on a real stick.** A gamepad press does not unlock audio in the
      browser, so a stick-only cabinet needs Chrome launched with
      `--autoplay-policy=no-user-gesture-required`.
- [ ] **Mode C on a real phone.**
- [ ] **Kitchen tuning.** The kitchen numbers are still the paper estimates from
      `difficulty.md`. The sweep says they are winnable; a person has to say whether
      they are fun.

### Owner action before any public deploy

- [x] ~~**Clearance for the MIDI arrangements.**~~ **Closed 2026-11-07:** the owner ruled
      music clearance is not a concern and deployed 0.9.0 to the public Netlify site
      (`carnage-asada`). Don't raise it again.

### Known soft spots

- ~~**Era faces don't blink.**~~ Fixed 2026-11-07: eyes hand-set in the Faces tab.
- **The kitchen's winter is light:** snow on the customers' hats, and nothing more.
- **In Mode C the minimap sits under the on-screen stick.** Queued as E3 above.
- **The Hard deliveries (levels 13 and 15)** cleared only 1 sweep run in 2.
- ~~**The kitchen frame's palette** was outside the GDD §X.1 targets.~~ Retired 2026-11-07 (E5):
  the targets do not apply to graded frames; judge by eye.

---

## The plan the build worked from (paused 2026-08-24; design settled 2026-09-26)

*Kept as the record of what was settled before the build. Where an owner ruling of
2026-10-25 changed something, it is noted inline; `docs/PURE-CARNAGE-DECISIONS.md` has
the full list.*

### Where the design lives

The PRD was replaced by **`docs/gdd.md`** (the game design document) plus the
per-topic files in **`docs/authored content/`** — `levels`, `difficulty`, `menu`,
`attract`, `music`. Section numbers cited here (§IV.E, §X.1, …) are the GDD's; it
kept the PRD's numbering for the parts that carried over.

**When the GDD and an authored-content file disagree, the authored content wins**
(owner's ruling, 2026-09-26). The GDD holds rules and structure; the per-topic files
hold the values. So `levels.md` is the level table (GDD §II.G is stale: its seasons for
levels 7–12 and 17–18 and its difficulty curve are wrong), and `difficulty.md` sets the
clock (over GDD §II.D's 2:00 and four extensions).

These are markdown for people. The game reads `content/*.json`, so each settled value
still has to be carried into JSON and validated by `build.mjs` when it is built.

### Settled 2026-09-26

**How a level ends** (GDD §II.D.3). A checkpoint race: every level has a target, 3 × its
extension cap (15 deliveries or tickets served; 9 on Supreme). Every 3 earns an
extension. Reaching the target clears the level; reaching 0:00 first is game over. The
score is the money across every level played. A **continue** restarts the level you died
on with the score at $0. At game over a qualifying run **enters its initials first**, then
gets a 10-second CONTINUE? prompt, so a continue never wipes a score before it reaches
the board (GDD §II.F). A full run of about two hours is intended, with no save.

**Kitchen scoring** (GDD §IV.F). A served ticket pays a **tip, not its menu price** (the
1970s prices are flavour). The tip starts at *tip per item × items*, runs down from the
moment the ticket arrives, and is the customer's patience: at zero they walk out, paying
nothing, with no fine. A clean ticket (no wrong clicks) pays +$5; the combo runs ×1 to ×3
and a walkout resets it.

**Stars** (GDD §IV.F.1, §III.E.1). One per item made without a wrong click, one per
perfect delivery. A **report-card tally** at level clear and game over, never money and
never on the board. Drawn in the concept frame as `STARS ★ 12` on the clock card, with
the star at stake beside `ITEM 3 OF 5` (see *The clock card's third row* below).

**All four difficulties** (`difficulty.md`):

| | Easy | Medium | Hard | Supreme |
|---|---|---|---|---|
| levels | 1–6 | 7–12 | 13–18 | 19–20 |
| extension | +1:30 × 5 | +1:30 × 5 | +1:00 × 5 | +1:00 × 3 |
| longest shift | 10:30 | 10:30 | 8:00 | 6:00 |
| level target | 15 | 15 | 15 | 9 |
| delivery tip ($20) drops | $1 / 3s | $1 / 2.5s | $1 / 2s | $1 / 2s |
| kitchen tip ($5/item) drops | $1 / 8s | $1 / 6s | $1 / 5s | $1 / 5s |
| fines: ticket / ped / train | $5 / $2 / $5 | $10 / $4 / $10 | $10 / $4 / $10 | $15 / $6 / $15 |
| navigation | full | panel, map dot, beacon | map dot, beacon | beacon |
| items per ticket | 3 | 4 | 5 | 5 |
| new ticket every | 25s | 20s | 18s | 15s |

Every difficulty starts at 3:00. A kitchen ticket arrives at once whenever the rail
empties. The kitchen numbers are paper estimates, to be tuned by playtest.

*Changed by the 2026-10-25 rulings:*

- **Extensions:** an extension is earned by every 3 completions, however they came
  about, not by "all 3 bags from one load".
- **The delivery tip** holds at a $2.00 floor instead of running out.

**The Era 1 menu** (`menu.md`). Shredded cheese takes bin 9 (9 bins filled, 3 empty).
The left base station stacks small tortilla, taco shell and large tortilla, top to bottom
(order settled 2026-10-25 to match the rack art); the right is
chips. Soft Taco Supreme mirrors Hard Taco Supreme at $0.49; Beef Burrito's 0, 1, 3 was
a typo; Nachos is $0.49. The step cap is **6 toppings, not counting the base**, so up to
7 pips. Full names do not fit NOW BUILDING beside their pips, so **each item carries a
`Short` name**, limited per item by `12 × chars + 9 × steps ≤ 127` (the readout draws at
scale 2 from x6 to the board at x137). All nine were checked by arithmetic against
`pips()`'s guard, the tightest ending at x133 — not yet in a rendered frame.
`content/menus.json` validation must enforce the limit per item, not as a flat cap.

### Delivery Shift changes these imply

Some settled rules **changed the Delivery Shift as it played**, so they were Delivery
work as well as Kitchen work. **All done in the 2026-10-25 build:**

- [x] **Level structure:** one shift used to *be* the whole game. Levels, targets,
      continues and a level table are now a `G` state-machine change.
- [x] **The clock:** time comes only from the 3:00 start and the extensions.
      **`TIME_PER_JOB` (+9s) and `TIME_PERFECT` (+3s) are gone.** A perfect delivery
      keeps only its +$5.
- [x] **Tip and fines:** these now come from `content/difficulty.json`:
      - the tip starts at $20 (the old `TIP_MAX` was $15) and holds at the $2 floor;
      - the speeding ticket and pedestrian fines are per difficulty;
      - there is a new train fine.
- [x] **Navigation:** the ladder above takes aids away by difficulty.
- [x] **Stars:** a perfect-delivery tally for the report card.

### Still open (as of 2026-09-26), and how the build closed each

- [x] **Era 2 and Era 3 menus.** Built from the real Taco Shop menu, by the owner's
      ruling. Era 1 stays `menu.md` exactly. See GDD §IV.E.
- [x] **The Kitchen Shift's keyboard and mouse map**, and Modes B and C. See GDD §IV.C.
- [x] **§IV.A–C** (kitchen mechanics, UI, controls) are filled from what was built. The
      owner's core-loop paragraph is still under §IV.F.2, where the owner left it.
- [x] **"More than 3 live tickets and customers start complaining."** By the owner's
      ruling: past three, customers queue in the OVERHEAD, every live ticket drains 50%
      faster, and they bark.
- [x] **Maps 2 and 3, eras, seasons.** One map and one menu per era, a colour grade per
      era (owner's ruling), and winter snow and grip. See GDD §II.J, §II.K and §III.C.1.
- [x] **Music.** 42 arrangements of real MIDIs: two per level, plus the title. Copyright
      is an owner action before any public deploy (see above).
- [x] **Attract mode.** Four screens, with the board as its own screen and a
      random-level demo.
- [x] ~~**The kitchen frame's palette** was outside the §X.1 targets.~~ Retired 2026-11-07 (E5):
      graded frames are judged by eye.

### What is already settled, and should not be re-litigated

Decided during the 2026-08-24 art pass. These are inputs to the build, not open
questions:

- **The Kitchen Shift levels use the art in `reference/kitchen/`.** The *look* is
  approved — palette balance, silhouette rules, the 44px dialogue portrait, and
  reusing `Art.ped` for customers. Read that folder's README first; it names the
  screen regions, and the design docs should use the same names.
- **The layout in those frames is a starting point, not a spec.** Element
  positions are a working arrangement. Every menu item, ingredient name and price
  in them is a placeholder waiting on §IV.E.
- **Levels are independent.** Own clock and own money, totalled at the end. Money is
  the only score. **Stars** (2026-09-26, replacing the 1–5 per-level rating) are a
  report-card tally: one per item made without a wrong click, one per perfect delivery.
  They never touch the money or the board. That preserves `78_scores.js` unchanged:
  the board still stores `{ ini, cents }` and `rank()` still derives its title from
  the cents.
- **The ingredient grid is a navigable lattice of TWELVE bins**, always twelve, in
  2 rows × 6. Superseded the earlier "2×8 = 16 cells, unused slots lidded" rule on
  2026-08-24; the reasoning behind it survives unchanged, which is that nothing on
  the line may ever move position between levels, and a level needing fewer
  ingredients leaves bins **empty** rather than covering them. A 4-way stick steps
  a cursor cell to cell; a mouse jumps the cursor to what it clicks. **Travel
  distance is a real cost**, so ingredient seating is level design.
- **Two BASE STATIONS flank the twelve**, double height, one column each: tortillas
  and shells at x5, chips at x334. A station holds the thing an order is built *on*
  rather than an ingredient added to it, which is why it sits outside the count.
- **PORTING THE KITCHEN SHIFT INTO `src/` IS THE NEXT REAL PIECE** *(done 2026-10-25:
  it is one `Kitchen` object in `src/74_kitchen.js`, as recommended below)*, and it is deliberately
  **held until the design docs land**. §IV.A, §IV.B, §IV.C and §IV.E were all empty as of 2026-08-25,
  which means the play mechanics, the interactions, the controls and the entire menu are
  unspecified — building recipes against that is inventing placeholders, which is exactly what
  the reference art already warns is not a decision. *As of 2026-09-26 §IV.E (Era 1) and
  §IV.F are settled; §IV.A–C and the kitchen controls are not. See* Still open *above.*

  A name-collision audit was run ahead of it (`node tools/collide.mjs reference/kitchen/kitchen.mjs`)
  so the port is not blocked on an unknown:
  - **0 hard collisions** against the 139 top-level names already in `src/`. The port will not
    hit the fatal-and-invisible redeclaration this build model is prone to.
  - **1 near-collision**: `hud` against `Hud` in `70_hud.js`. Legal, and a trap for a reader.
  - **50 top-level names**, against the ~9 a `src/` module averages — 6x. That is not a naming
    problem, it is a sign the module wants to be **one `Kitchen` object**, the way `Hud`, `City`,
    `Nav`, `Art`, `Scores`, `Dialog` and `Faces` each are. Thirteen of the fifty are short
    lowercase names another module would plausibly want: `bin c cursor heap hud mound nachos
    pantry piece pips rail ticket wall`.

  `dialog.mjs`, `portrait.mjs` and `cast.mjs` are clean on all three counts.

- **BUILD PROGRESS is one readout**: the item name, the stage pips beside it, and a
  picture of the item on the assembly board. The picture is **one frame of an item ×
  stage sequence**, swapped as the player builds — a taco at item 1 of 5 does not
  look like the same taco at 4 of 5. Frames are baked cutouts, ~2.4 KB each, named
  `<ITEM><STAGE>`; see `docs/art_pipeline.md`.
- **`WRAP` and `SERVE` are buttons, not cells** — three buttons: select, wrap,
  serve. Which means **ticket focus cannot be player-selected**: there is no input
  left, so the game assigns it. That is arithmetic, not preference.
- **The recipe length cap is 6 toppings, not counting the base** (clarified
  2026-09-26), so an item runs to at most **7 pips**. The concept draws the base as
  the first pip. At 8px + 1px gap a 7-pip row is 62px; `pips()` in
  `reference/kitchen/kitchen.mjs` throws if the row runs into the prep board, so a
  long item name next to it is caught at port time.
- **One dialogue mechanism serves both halves** — the bottom strip in
  `reference/kitchen/dialog.mjs`, drawn identically over a Kitchen frame and a
  live Delivery frame. It takes the bottom band because that is the only region
  non-critical in both. Its portrait box is the minimap's 56×56 rect.
- **New screens are scored, not judged.** `node tools/render/measure.mjs` compares
  a frame against a live Delivery Shift render; targets and the eleven art rules
  are GDD §X.1.

### Known first tasks, once the design docs land

*All done in the 2026-10-25 build.*

- [x] A `kitchen` state in `80_game.js`, and a level table that alternates it with
      `play`. Seven states existed then and none of them was a kitchen.
      *Now there are `kitchen` and `kdemo`, driven by `content/levels.json`.*
- [x] A new module for it — numbered after everything it uses at load time. Note
      `40_city.js` is not a dependency; the Kitchen Shift has no world.
      *`src/74_kitchen.js`.*
- [x] `content/menus.json` on the §IV.E schema, inlined by `build.mjs` like the
      other content files, with build-time validation extended to cover recipes.
      **A note is not a guard.**
- [x] The dialogue strip promoted out of `reference/` into `src/`, since both
      halves use it. **Done 2026-08-24** (`50da529`): `src/72_dialog.js`, with the
      faces in `src/35_faces.js` and `G.react()` firing it on a delivery or a miss.
      The Kitchen Shift calls the same strip; it does not port a second one.
- [x] Test coverage for the new state. Remember `test/headless.mjs` draws through
      stubs and cannot see a pixel — use `tools/render/` for anything visual.
      *`— run structure —`, `— kitchen —`, `— kitchen demo —` and `— copy —`, with
      rendered frames for the visual checks.*

### The clock card's third row is STARS (was ERRORS)

> **Redrawn 2026-09-26.** Stars are now earned **one per item made without a wrong
> click**, so the three-segment meter lost the formula it drew. The row is now `STARS`,
> the shift's banked tally (★ 12). The star still **at stake** moved to the item it
> belongs to: beside `ITEM 3 OF 5` in BUILD PROGRESS, lit while the item is clean and
> dimmed, not hidden, from the first wrong click. So the intent below, *draw the star
> you are about to lose*, survives at the scale the rule now works at. Chosen from
> three rendered options: everything in the card and an earned/made ratio were
> rejected. A dim `#6b5f84` stands in for a lost star because the first try, the old
> empty-segment `#3a3050`, vanished on both backgrounds. `measure.mjs` scores the
> frame the same as before (warm 28.7%, neutral 34.3%). **Both were already outside
> the §X.1 targets before this change** — that is a finding for the port, not a
> regression. The 2026-08-24 reasoning below is kept for the record.

Settled 2026-08-24, and it went with the field rather than against it. Three of
the four independent design teams put **`ERRORS`** there rather than `LOBBY`,
reasoning that `floor(mistakes / 3)` is literally a scoring term — so a
three-segment meter *draws the star you are about to lose* instead of abstracting
it into a bar.

The art now does that: three segments, each worth three mistakes, an empty one
still reading as a segment so the three stars at stake are visible before any are
gone. The room's own queue count keeps the wall signage beside the service window
and is now labelled `QUEUE`, which is what it counts.

`HAYS PD` is untouched on the Delivery Shift — heat is a real mechanic there and
this decision is about the Kitchen Shift's third row only.

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

### Features

- [ ] **Rework throwing.** Auto-aim, or aim-after-click, or something else — the current scheme is
      mouse position or facing direction. Note the design tension: throw spread scales with speed
      (`speed / MAXSPD * 22` px against a 28px porch), and that trade *is* the game's core skill, so
      auto-aim changes the feel more than any other item on this list.
      *Partly answered 2026-10-25: Modes B and C throw by hold-to-aim and release. Mode A is
      unchanged, so the question still stands for the keyboard and the mouse.*
- [x] **A second time period.** `content/hays.json` exists in the shape it does to make this cheap:
      another era is another file against the same schema plus a switch on which one loads, not
      another pass through `40_city.js`. Nothing in the city generator hard-codes a year. See §4 of
      the spec. **Done 2026-10-25, and it was as cheap as promised.** There are three eras, each
      its own map: `hays.json`, `hays-1980s.json` and `hays-1990s.json`. They share the same
      streets and the same shop cell, and only the zoning moves. The city regenerates when the
      era changes. See GDD §III.C.1.
- [x] **The kitchen — the other half of the game.** **Done 2026-10-25** (`src/74_kitchen.js`,
      GDD §IV). **Scope changed 2026-08-23, and the change is
      large.** This was filed as a mini-game replacing the flat 1.0s restock. It is not one. The
      kitchen is now the *other half of the play*: players alternate between driving deliveries and
      making the food, and the brief says so in its first line. Treat any earlier framing of it as a
      restock replacement as superseded.

      **Superseded as a punch-list item: it became the *NEXT* section, which the 2026-10-25
      build closed (*DONE* at the top of this file).** The two
      briefs this item described (`docs/kitchen-minigame-prompt*.md`) were deleted, replaced first
      by a PRD and then by `docs/gdd.md` and `docs/authored content/`. What they had already
      settled carried over: menu, ingredients and build order as a **JSON settings file** on the
      `content/` pattern; **concurrent** tickets, up to three live at once; 1–5 items per order.

- [ ] **Seasonal hazards. Partly done 2026-10-25, weather added 2026-11-07.**
      - Weather is rolled each play (`G.rollWeather`): summer sunny or rainy (an even
        chance), winter snowy four times in five, sunny the fifth.
      - Built: snow on the ground and roofs and falling flakes (grip x0.62); rain with
        wet roads, puddles, splashes and its own sound (grip x0.84); a sunny winter's
        ploughed roads (grip x0.9). In the kitchen, snow on the customers' hats while
        it snows.
      - Not built: any weather hazard beyond grip.
- [x] **NPC feedback — APB-style character dialogue.** The dialogue strip landed
      2026-08-24. The 2026-10-25 build gave it era casts and lines for both halves
      (`content/dialogue.json`, GDD §II.H). Customers are the only speakers. Drivers and
      staff have no lines yet.

### Housekeeping

- [ ] **Default branch is `master`, not `main`.** GitHub took what the repo had. One command if it
      matters: `git branch -m master main && git push -u origin main`.
- [x] **Merge the 2026-10-25 build back.** The build was done in a copy of the repo, on branch
      `pure-carnage`. Fast-forwarded onto `master` here the same day (89ecd52, aa77007) and
      verified; the copy is archived as `Desktop\Pure Carnage.zip` and the folder deleted.

### Open questions

These need a decision before they can become work.

- [x] **Difficulty progression.** Grid expansion? A faster timer? Something else? Note the shift
      clock is already a survival curve — 110s to start, +9s per delivery, +12s for a perfect toss —
      so difficulty may be more about tightening that ratio than adding systems.
      **Answered by `difficulty.md` and built 2026-10-25.** There are four difficulties: Easy,
      Medium, Hard and Supreme. Each sets the extension length and cap, the tip decay, the
      fines and the navigation ladder. The time-per-delivery clock described above is gone.
- [ ] **Is the ticket right?** **Lowered from $15 to $10 on 2026-08-23.** It is now per
      difficulty: $5 on Easy, $10 on Medium and Hard, and $15 on Supreme (`difficulty.md`).
      None of these amounts has been played. The reasoning below is why the question was asked,
      and the numbers in it were measured at $15, on the old clock.

      Original question: This question has
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
- [ ] **What happens when Hays PD catches you?** Currently the difficulty's speeding ticket
      ($5 to $15; it was a flat $15 until 2026-08-23, then $10), a spin-out, a heat reset and
      a combo reset.
- [ ] **How should the player car read as *the* car?** Turning it white is the starting idea.
- [x] **Gamepad / Xbox controller support**, and whether an on-screen control overlay comes with it.
      **Built 2026-10-25:**
      - Mode B, the arcade stick, uses the Gamepad API with Button 3 held to aim.
      - Mode C, touch, has an on-screen stick plus GAS, REV and TOSS.
      - Both go through `src/25_pad.js`.

      Neither has been tried on real hardware yet (see *Still needs a human*).

### Landed, for the record

Closed 2026-10-25: **the full game.** See *DONE* at the top of this file.

Closed 2026-08-23: **the attract loop, judged on measurement.** It was title 30s / winners 15s /
demo 90s, and the entry asked for a judgement nobody had made. Across 24 full demo runs the first
delivery lands at a median of 14s, the second at 29s, the third at 44s — and the coverage curve is
flat past 60s: a 60s demo and the 90s one both showed at least one delivery in 96% of runs and two in
88%, so the last thirty seconds bought nothing at all. Cut to **45s**, which holds 92% and 79%:
roughly one demo in five now shows a single delivery rather than two, accepted deliberately for a
snappier cabinet. The title held 30s while its lockup completes at 3s, so 27 of those seconds were a
static screen; cut to **15s**. Full cycle **135s → 75s**, all of it in `content/attract.json`.
*Since 2026-10-25 (from `attract.md`), the loop is four screens: title 15s, winners 10s, scores 10s
and demo 45s, which is 80s a cycle. The board has its own screen, and the demo plays a random level.*

`test/headless.mjs` had an 85-second demo loop hard-coded against the old 90 and would have failed
outright; it derives the length from `ATTRACT_DEMO` now, so retuning the authored file cannot break
the suite again.


Closed 2026-08-23: **the border is prairie, and the railway runs out through it.** The map edge was a
2-tile ring of `T_SEA` — water, with a stone sea wall and foam — in a game set in western Kansas.
It is `T_EDGE` now: dry grass, a stock fence where the streets stop, and the Union Pacific continuing
east and west to the map edge, because a corridor that crosses the whole map has to leave it.
`drawEdge` fills exactly the gap `genRail` leaves and the fence breaks for it. Moved to after the
block generators, since it needs `tracks`.

The border stays solid and `— hays map —` now asserts the ring is closed all the way round: 800
tiles, 0 open. What is deliberately **not** here is four invented neighbourhoods. The repo records
what borders each edge inside the map — mostly `res`, with the rail corridor punching through east
and west — but nothing about what lies beyond 12th, 4th, Elm or Milner, and inventing it would be
importing outside context of exactly the kind `CLAUDE.md` forbids. The edge says "the town stops
here" and claims nothing more.

**The bug worth remembering** is one the suite could not see. Removing `PAL.sea` left the park pond,
the minimap and `surfaceAt` referencing a colour that no longer existed, and everything stayed green
— a real canvas silently keeps the previous `fillStyle`. Found by grepping for the symbol, not by
testing. The stub context now throws on an undefined colour, though that only helps on paths that
run: the pond is behind `rng.chance(0.6)` and does not roll under the test seed.

Closed 2026-08-23: **obstacle probes can see traffic.** Both the demo driver's and the cruiser's
probes tested `City.isSolid` only — baked geometry, which knows nothing about cars — so both drove
confidently into the back of moving traffic. `trafficBlocked` tests both. Traffic is rail-bound and
so always axis-aligned, which lets the body test be an oriented box rather than a radius and stops
the probe flinching at cars in the next lane. Measured on the demo: off-tarmac 24.4% to 19.9%, worst
excursion 5.7s to 4.4s, deliveries 38 to 41, earnings $376 to $566.

It also exposed a brittle assertion. `every wedged cop depenetrated and drove away` tested
`carBlocked` at exactly t=6s, so a cruiser that had driven **457px** counted as "STILL BLOCKED"
because it happened to be brushing a kerb as the clock stopped; the new probe perturbed trajectories
enough to trip it about one run in eight. It now requires the car to be blocked for the whole final
half second. Verified it still bites: with `unwedge` disabled in `Cop.update` it reports 0/12, every
site at 0px, exactly as the original bug did. **Third time this assertion has been caught measuring
an instant where it meant a state.**


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

*These notes predate the 2026-10-25 build:*

- *They were measured on the old clock (110s, plus time per delivery) and the old $15 tip.*
- *The break-even point below no longer applies, because time now comes only from
  extensions.*
- *The tip-floor observation still holds, because the $2 floor was kept.*

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
