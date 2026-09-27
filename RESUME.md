# Where we left off

*Written 2026-09-26, picking the project back up after a month away. Last commit was
`a824924` on 2026-08-25.* This is a snapshot, not a living document: `ROADMAP.md` is
where the plan is kept current. If the two disagree, the roadmap wins.

---

## The short version

The Delivery Shift is the shipped, playable game. The **Kitchen Shift**, the other
half of the 20-level game, exists only as **reference art and concept frames** in
`reference/kitchen/`. Moving it into `src/` is the next real piece of work. It has
been **paused since 2026-08-24, waiting on the design docs**, and those are now
mostly written. One menu (Era 1) is drafted. The kitchen's scoring is not.

## What the last stretch of work was (2026-08-24 → 08-25)

In order, roughly:

1. **The kitchen art landed as reference** (`d195994`), with the toolkit to change
   it. The concept frame is `reference/kitchen/kitchen-x3.png`, and its README
   names the screen regions: TICKET RAIL, OVERHEAD, LATTICE, PREP BOARD,
   DIALOGUE STRIP.
2. **Imported pixel art became canvas-native data.** The render harness learned
   to read outside images (`e0d1108`), and the baker turns them into data tables
   that ship inside the file, because an image file would blank the artifact under
   its CSP. It was used for two things:
   - **Faces.** Customer likenesses baked into `content/faces/` (`6b181aa`), then the
     **dialogue strip shipped into the real game** (`50da529`): `src/35_faces.js`
     and `src/72_dialog.js`, fired by `G.react()` on a delivery or a miss. It is
     the only piece of the kitchen work that is in `src/`.
   - **Ingredients.** A contact sheet baked into the steam-table wells (`e45cc4e`),
     then twelve bins (`48a5f3b`), then two base stations (`d2065a8`), then
     transparent cutouts in the baker (`52b77e9`), which drawing the item on the
     prep board needed.
3. **Concept layout passes** on that frame:
   - the clock card's third row became **ERRORS** (`507ebeb`);
   - the prep board became a workstation with the item on it (`3963fbf`);
   - **BUILD PROGRESS** became one readout: item name, stage pips, and a picture of
     the item at its current stage (`eddb262`).
4. **Groundwork for the port:** `tools/collide.mjs` (`a824924`) checks a module
   for top-level name clashes with `src/` before it is brought in. It was run on
   the kitchen: **0 hard clashes**. It declares **50 top-level names** against the
   ~9 a `src/` module averages, which says it should become one `Kitchen` object.

`docs/art_pipeline.md` documents how to add a character or an ingredient, and
lists every way the pipeline has gone wrong so far.

## What changed while the project sat (not yet committed)

- **The PRD and both kitchen briefs were deleted.** They are replaced by
  **`docs/gdd.md`** and the per-topic files in **`docs/authored content/`**
  (`levels`, `difficulty`, `menu`, `attract`, `music`).
- **Ruling, 2026-09-26: when the GDD and an authored-content file disagree, the
  authored content wins.** That settles two conflicts:
  - **The level table:** `levels.md`, not GDD §II.G. Difficulty climbs
    Easy ×6 → Medium ×6 → Hard ×6 → Supreme ×2.
  - **The shift clock:** `difficulty.md`. Easy is 3:00 to start, +1:30 per
    extension, at most five.
- New reference material: era image sets (70s/80s/90s) in `reference/assets/images/`,
  `reference/assets/midi/`, and `carnage_palette.png`.
- `Migrated/` holds older files (menus, angry-customer lines, a game design spec)
  dated May to Aug 1. **It has not been read.** `CLAUDE.md` warns against pulling in
  context from outside the repo, so treat it as out of scope until the owner says
  otherwise.
- Docs were repointed from the deleted PRD to the GDD (`CLAUDE.md`, `ROADMAP.md`,
  `reference/kitchen/README.md`, `tools/render/README.md`).

## Where the design docs stand

| Topic | Status | What it still blocks |
|---|---|---|
| **§IV.E Menus** | **Era 1 settled** (see below): 9 bins + 3 empty, 2 base stations, 9 items. Eras 2 and 3 empty. | Every level past the 1970s. |
| **§IV.F Kitchen scoring** | **Settled**: a tip per item, running down from arrival; a walkout at zero. A star per clean item, as a report card. | Nothing. |
| **§II.B.1 Mode A controls** | **Answered for driving**: carries over the existing controls. | The Kitchen Shift's keyboard map. |
| **§IV.A–C Kitchen mechanics, UI, controls** | Empty headings. The core loop is written, but it sits under §IV.F.2 ("An order arrives…") and belongs under §IV.A. | — |
| **Difficulty** | **All four defined**: Easy, Medium, Hard, Supreme. Kitchen values are paper estimates to tune by playtest. | Nothing. |
| **Maps, eras, seasons** | Headings only. `levels.md` names no map or menu per level. | Levels 7+, winter driving. |
| **Music** | 100 empty slots (5 songs × 2 shifts × 10 years). | Nothing yet. Note that arranging real songs raises a copyright question if the game is published. |

### The six Era 1 menu questions (answered 2026-09-26, written into `menu.md`)

1. **Cheese** was in no bin → Cheese (shredded) takes **bin 9**.
2. **Four bases, two stations** → the left station stacks **taco shell, small
   tortilla and large tortilla**; the right is **chips**.
3. **Soft Taco Supreme** was identical to Soft Taco → it **mirrors Hard Taco
   Supreme** (adds onions, tomatoes, sour cream) at **$0.49**.
4. **Beef Burrito** 0, 1, 3 → a **typo**: tortilla, beef, cheese.
5. **Nachos** → **$0.49**.
6. **The step cap** → **6 toppings, not counting the base**, so up to 7 pips.
7. *(Found along the way)* **Full names don't fit the NOW BUILDING readout** →
   each item has a **Short** name (HD TACO, HTSUP, SF TACO, STSUP, BEEF BUR,
   BEAN BUR, COMBO, SANCHO, NACHOS). The limit is `12 × chars + 9 × steps ≤ 127`.

## What is already settled (do not re-litigate)

The full list with its reasoning is in `ROADMAP.md` under *What is already
settled*. In brief:

- The Kitchen Shift uses the art in `reference/kitchen/`. The **look** is approved;
  the **layout** is a starting point, and every menu item and price in the frames
  is a placeholder.
- **Levels are independent**: each has its own clock and money (stars are a
  report-card tally, not a score),
  totalled at the end. `78_scores.js` stays unchanged.
- **Twelve bins, always**, in 2 rows × 6. Nothing moves between levels, and a
  level needing fewer ingredients leaves bins empty rather than covering them.
  Travel distance on the grid is a real cost, so where ingredients sit is level
  design.
- **Two base stations** flank the twelve: tortillas and shells on the left, chips
  on the right.
- **Three buttons: select, wrap, serve.** So the game, not the player, decides
  which ticket is in focus.
- **Recipes are capped at 6 toppings after the base**, and they are **hidden**: the player sees only
  the pips. Learning the menu is the skill curve.
- **One dialogue strip serves both halves**, and it is the one already in `src/`.
- **New screens are scored, not judged**: `node tools/render/measure.mjs` against
  the targets in GDD §X.1.

## Next steps already planned

**Now:**

1. ~~Answer the six Era 1 menu questions.~~ Done.
2. Commit the design-doc move (the deletions, `docs/gdd.md`,
   `docs/authored content/`, the doc repointing and this file).
3. ~~**§IV.F Kitchen scoring** rules.~~ Done 2026-09-26: a tip per item, running down
   from arrival; a walkout at zero, with no fine. Easy values: **$5.00 per item,
   $1.00 per 8s**.
4. ~~**Easy difficulty.**~~ Done 2026-09-26, both shifts. Time comes only from
   3:00 plus +1:30 extensions (3 bags delivered / 3 tickets served, at most five),
   replacing today's +9s per delivery. The kitchen gets a +$5 clean-ticket bonus and
   the same ×1 to ×3 combo as delivery, reset by a walkout. See `ROADMAP.md` for the
   Delivery Shift code this changes.
5. ~~**Medium difficulty.**~~ Done 2026-09-26. Same clock; tips drop faster; fines
   double; navigation drops the minimap route line and the edge pointer. Kitchen:
   up to 4 items per ticket, a new ticket every 20s (Easy: 3 items, every 25s).
6. ~~**Hard difficulty.**~~ Done 2026-09-26. Extensions +1:00 (longest shift 8:00);
   tips drop faster; fines held at Medium's; navigation down to the minimap dot and
   the beacon. Kitchen: 5 items per ticket, a new ticket every 18s.
7. ~~**Supreme difficulty.**~~ Done 2026-09-26. At most three +1:00 extensions
   (longest shift 6:00); tips held at Hard's; fines $15 / $6 / $15; the beacon only.
   Kitchen: a new ticket every 15s.
8. ~~**How a level ends.**~~ Done 2026-09-26 (GDD §II.D.3). A checkpoint race: reach
   the target (15 deliveries or tickets, 9 on Supreme) to clear the level; 0:00 first
   is game over. The score is the money across every level played. A continue
   restarts the level with the score at $0. A two-hour full run is intended, with no
   save.
9. ~~**Stars.**~~ Done 2026-09-26. One star per item made without a wrong click, and
   one per perfect delivery. Shown as a tally at level clear and game over; never
   money, never on the board.
10. ~~**High scores and continues.**~~ Done 2026-09-26 (GDD §II.F). At game over,
    initials first if the run qualifies, then a 10s CONTINUE? prompt. A continued run
    starts at $0 and can make the board on its own.
    **Open:** redrawing the ERRORS row on the kitchen clock card (it still shows three
    segments; see `ROADMAP.md`).

**The Kitchen Shift port, once §IV.F is settled** (from `ROADMAP.md`, *Known
first tasks*):

- [ ] A `kitchen` state in `80_game.js`, and a level table that alternates it with
      `play`.
- [ ] A new module for it, numbered after everything it uses at load time. It is
      one `Kitchen` object rather than 50 globals, and does not depend on
      `40_city.js`. Run `node tools/collide.mjs` on it first.
- [ ] `content/menus.json` on the §IV.E schema, inlined by `build.mjs`, with
      build-time validation extended to cover recipes. **A note is not a guard.**
- [x] The dialogue strip in `src/`. Already done (`50da529`).
- [ ] Test coverage for the new state, plus `tools/render/` for anything visual.

**Carried into JSON when the port happens:** `levels.md` → a level table,
`difficulty.md` → per-difficulty tuning (it replaces today's constants at the top
of `80_game.js`: the Easy starting tip is $20 against today's $15, and the Easy
speeding ticket is $5 against today's $10), and `attract.md` → `content/attract.json`.
`attract.md` asks for a separate High Scores screen in the loop, where today the
winners card and the board alternate in one slot.

**Still open on the Delivery Shift** (`ROADMAP.md` → *Punch list*): the shop apron
re-measure, reworking throwing, a second time period (cheap by design, via
`content/hays.json`), seasonal hazards, gamepad support and the Mode B arcade map,
and a handful of tuning questions (the $10 ticket, what happens when Hays PD
catches you, making the player car read as *the* car).
