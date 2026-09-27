# Resume here

*Last updated at the end of the 2026-09-26 session.* This is the starting point for a
fresh session. It is a snapshot: **`ROADMAP.md` is the living plan**, and if the two
disagree, the roadmap wins.

---

## Start here

**Next session: the owner works on the menu items** in
`docs/authored content/menu.md`. Era 1 is settled; **Eras 2 and 3 are empty**. Follow
the owner's lead. This is their authored content, and the session is theirs to steer.

Three things to know before touching anything:

1. **This is planning, not the port.** Nothing is being built in `src/`. Decisions go
   into the design docs (below), and the Kitchen Shift port starts only when the owner
   says so. Say "planning only" out loud whenever that's the case.
2. **`Migrated/` is in scope for the menu work, but read only on request.** It holds
   older files (a July 2026 menu, angry-customer lines, a game design spec) dated May
   to Aug 1. The owner ruled it in scope on 2026-09-26. It has **not been read**. Open a
   file there **only when the owner points at it**, per `CLAUDE.md`'s rule on outside
   context. It is untracked on purpose.
3. **When the GDD and an authored-content file disagree, the authored content wins**
   (owner's ruling, 2026-09-26).

## The state of the repo

- **`master` = `origin/master`**, all pushed. The last code change to the game itself
  was August's; 2026-09-26 changed docs, reference art and assets only.
- **`node test/headless.mjs` passes, 178 of 178** (checked at the end of 2026-09-26).
- The Delivery Shift is the shipped, playable game. The **Kitchen Shift**, the other
  half of the planned 20-level game, exists only as reference art and concept frames
  in `reference/kitchen/`. The one piece of kitchen work already in the game is the
  dialogue strip (`src/72_dialog.js`, `src/35_faces.js`).

## Where the design lives

| file | holds |
|---|---|
| `docs/gdd.md` | the game design document: rules and structure |
| `docs/authored content/menu.md` | bins, base stations, items, prices, short names |
| `docs/authored content/difficulty.md` | every number, per difficulty, both shifts |
| `docs/authored content/levels.md` | the 20-level table (wins over GDD §II.G) |
| `docs/authored content/attract.md` | the attract-mode loop |
| `docs/authored content/music.md` | songs per year and shift (all empty) |
| `ROADMAP.md` → *NEXT* | what is settled, what it changes, and what is still open |

These are markdown for people. The game reads `content/*.json`, so a settled value
still has to be carried into JSON and validated by `build.mjs` when it is built.

## What 2026-09-26 settled

Every decision is written into the files above; `ROADMAP.md` → *Settled 2026-09-26*
has the full detail, including a table of all four difficulties. In short:

- **The Era 1 menu.** Cheese takes bin 9 (9 filled, 3 empty). The left base station
  stacks taco shell, small tortilla and large tortilla; the right is chips. Soft Taco
  Supreme mirrors Hard at $0.49; Nachos is $0.49. The step cap is 6 toppings after the
  base. Every item has a **Short** name for the NOW BUILDING readout, limited per item
  by `12 × chars + 9 × steps ≤ 127`.
- **Kitchen scoring.** A ticket pays a tip (menu prices are flavour): *tip per item ×
  items*, running down from arrival. At zero the customer walks out. Clean ticket +$5;
  combo ×1 to ×3, reset by a walkout.
- **All four difficulties**: Easy (levels 1–6), Medium (7–12), Hard (13–18), Supreme
  (19–20). Each sets the clock, tips, fines, a navigation ladder, items per ticket and
  ticket arrivals.
- **How a level ends.** A checkpoint race: reach the target (15, or 9 on Supreme) to
  clear it; 0:00 first is game over. Score is the money across every level played.
  A continue restarts the level at $0. A two-hour full run is intended, with no save.
- **Stars.** One per item made without a wrong click, one per perfect delivery. A
  report-card tally, never money, never on the board.
- **High scores.** At game over: initials first (if the run qualifies), then a 10s
  CONTINUE? prompt.
- **The concept frame's clock card** now reads `STARS ★ 12`, with the star at stake
  beside `ITEM 3 OF 5`. It was the ERRORS meter.
- **Assets.** The era image sets, 203 MIDI files and the palette sheet are committed;
  the shop sticker (`reference/assets/Taco Shop.webp`) was restored. The repo is
  public, by the owner's choice.

## Still open

See `ROADMAP.md` → *Still open*. The headline items:

- **Era 2 and Era 3 menus.** Tomorrow's work.
- The Kitchen Shift's keyboard and mouse controls.
- GDD §IV.A–C (kitchen mechanics, UI, controls) are empty headings. The core loop is
  written, in a paragraph under §IV.F.2 that belongs under §IV.A; left for the owner
  to move.
- What "customers start complaining" (more than 3 live tickets) actually does.
- Maps 2 and 3, eras, seasons, music, and the attract loop's fourth screen.

## When the port does start

The first tasks are in `ROADMAP.md` → *Known first tasks*: a `kitchen` state and a
level table in `80_game.js`; one `Kitchen` object in a new module (run
`node tools/collide.mjs` on it first); `content/menus.json` with build-time validation
of recipes and short names. Several settled rules also change the Delivery Shift as
it plays today (the clock, tips, fines, navigation); `ROADMAP.md` lists them under
*Delivery Shift changes these imply*.

## Background: the last stretch of work before the break (2026-08-24 → 08-25)

The kitchen art landed as reference (`d195994`). Imported pixel art became
canvas-native data: faces, then the dialogue strip into the real game (`50da529`),
then ingredients baked into twelve wells and two base stations. The concept frame got
its layout passes (clock card, workstation, BUILD PROGRESS readout), and
`tools/collide.mjs` (`a824924`) checked the kitchen code for name clashes before any
port: none, but 50 top-level names, so it should become one `Kitchen` object.
`docs/art_pipeline.md` documents how to add a character or an ingredient.
